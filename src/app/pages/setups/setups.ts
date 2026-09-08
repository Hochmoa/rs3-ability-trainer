import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DataService } from '../../core/data.service';
import { GENERAL_SETUP_NAME, ItemRef, Loadout, RELICS, Rotation, STYLES4, Setup, setupTitle } from '../../core/models';
import { PresetsService } from '../../core/presets.service';
import { setupRotations } from '../../core/rotation-pick';
import { StorageService } from '../../core/storage.service';
import { SupabaseService, errorText } from '../../core/supabase.service';
import { FetchedSetup, PublicSetupRow, SetupUserRow, SyncService } from '../../core/sync.service';
import { DialogService } from '../../shared/dialog';
import { GearPanel } from '../../shared/gear-panel';
import { ToastService } from '../../shared/toast';

export type SetupsView = 'mine' | 'all' | 'players';

/** the setups of one boss – own or public */
interface BossGroup<T> {
  boss: string;
  items: T[];
  styles: string[];
}

const STYLE_ORDER = [...STYLES4, 'Hybrid'];
/** the style choices a player can give an own setup */
export const SETUP_STYLES = [...STYLES4, 'Magic/Melee', 'Magic/Ranged', 'Melee/Ranged', 'Necromancy/Magic', 'Necromancy/Melee', 'Necromancy/Ranged'];

function sortStyles(styles: string[]): string[] {
  const rank = (s: string) => (s.includes('/') ? 10 : STYLE_ORDER.indexOf(s) < 0 ? 9 : STYLE_ORDER.indexOf(s));
  return [...styles].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/** setups grouped by boss, in first-seen order; the general ones (no boss) first */
function groupByBoss<T extends { boss: string; style: string }>(items: T[]): BossGroup<T>[] {
  const byBoss = new Map<string, T[]>();
  for (const it of items) {
    const list = byBoss.get(it.boss) ?? [];
    list.push(it);
    byBoss.set(it.boss, list);
  }
  const groups = [...byBoss].map(([boss, list]) => ({ boss, items: list, styles: sortStyles([...new Set(list.map((x) => x.style).filter(Boolean))]) }));
  return groups.sort((a, b) => (a.boss === '' ? -1 : b.boss === '' ? 1 : 0));
}

/**
 * The one place for setups (docs/plan-setups.md): "My setups" – the player's own, with their gear and rotations –,
 * "All setups" – every public setup, the PvME guide account's and other players', searchable by boss, name and
 * player –, and "Players" – everyone who shares at least one. "Use this setup" copies gear and rotations into the
 * player's own list; bars and keys are never part of a setup.
 */
@Component({
  selector: 'app-setups',
  imports: [FormsModule, RouterLink, GearPanel],
  templateUrl: './setups.html',
  styleUrl: './setups.scss',
})
export class Setups {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);
  readonly supabase = inject(SupabaseService);
  private sync = inject(SyncService);
  private presets = inject(PresetsService);
  private dialogs = inject(DialogService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly STYLES = SETUP_STYLES;
  readonly GENERAL = GENERAL_SETUP_NAME;

  /** `?view=mine|all|players` – links from other pages land on the right list */
  private readonly wantedView = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('view') as SetupsView | null)), { initialValue: null });
  readonly view = signal<SetupsView>('all');
  readonly query = signal('');
  readonly styleFilter = signal('all');
  /** owner id the public list is narrowed to (from the Players view) */
  readonly owner = signal<string | null>(null);
  readonly ownerName = computed(() => this.rows().find((r) => r.owner_id === this.owner())?.owner_name ?? this.users().find((u) => u.owner_id === this.owner())?.display_name ?? '');

  // ---------------------------------------------------------------- my setups

  /** the setup whose fields are being edited (boss, name, style) */
  readonly editing = signal<string | null>(null);
  /** setups whose gear is shown */
  readonly openMine = signal<ReadonlySet<string>>(new Set());
  readonly mineGroups = computed(() => groupByBoss(this.storage.setups()));
  /** what a setup of mine came from – "in my setups" on the public list */
  private readonly mineSources = computed(() => new Set(this.storage.setups().flatMap((s) => [s.sourceId, s.presetId].filter((x): x is string => !!x))));

  // ---------------------------------------------------------------- the public list

  readonly rows = signal<PublicSetupRow[]>([]);
  readonly users = signal<SetupUserRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private loaded = false;
  /** the public setup whose gear and rotations are shown, and what was fetched for it */
  readonly open = signal<string | null>(null);
  readonly details = signal<Record<string, FetchedSetup | null>>({});
  /** bosses opened by hand (a narrowed list opens on its own) */
  readonly openBosses = signal<ReadonlySet<string>>(new Set());
  readonly busy = signal<string | null>(null);

  readonly filtered = computed<PublicSetupRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.styleFilter();
    const owner = this.owner();
    return this.rows()
      .filter((r) => !owner || r.owner_id === owner)
      .filter((r) => f === 'all' || r.style === f)
      .filter((r) => !q || (r.boss + ' ' + r.name + ' ' + r.owner_name + ' ' + r.rotation_names.join(' ')).toLowerCase().includes(q));
  });
  readonly groups = computed(() => groupByBoss(this.filtered()));
  readonly styles = computed(() => sortStyles([...new Set(this.rows().map((r) => r.style).filter(Boolean))]));
  readonly bossCount = computed(() => new Set(this.filtered().map((r) => r.boss)).size);

  constructor() {
    effect(() => {
      const wanted = this.wantedView();
      if (wanted === 'mine' || wanted === 'all' || wanted === 'players') untracked(() => this.show(wanted));
    });
    effect(() => {
      const v = this.view();
      if (v !== 'mine') untracked(() => void this.load());
    });
    // the gear panel needs the catalogs to draw the items
    void this.data.ensure('gear', 'weapons', 'perks');
  }

  show(v: SetupsView): void {
    this.view.set(v);
  }

  async load(force = false): Promise<void> {
    if (this.loaded && !force) return;
    this.loaded = true;
    this.loading.set(true);
    this.error.set(null);
    try {
      const [rows, users] = await Promise.all([this.sync.listPublicSetups(), this.sync.listSetupUsers()]);
      this.rows.set(rows);
      this.users.set(users);
    } catch (err) {
      this.loaded = false;
      this.error.set(errorText(err));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------------------------------------------------------------- my setups: actions

  title(s: Pick<Setup, 'boss' | 'name'>): string {
    return setupTitle(s);
  }

  rotationsOf(s: Setup): Rotation[] {
    return setupRotations(this.storage.rotations(), s.id);
  }

  loadoutOf(s: Setup): Loadout | undefined {
    return this.storage.loadoutOf(s);
  }

  isOpenMine(id: string): boolean {
    return this.openMine().has(id);
  }

  toggleMine(id: string): void {
    const next = new Set(this.openMine());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.openMine.set(next);
  }

  async newSetup(): Promise<void> {
    const name = await this.dialogs.prompt('Name of the new setup – the boss can be set afterwards:', { title: 'New setup', placeholder: 'e.g. solo ranged', ok: 'Create' });
    if (name === null || !name.trim()) return;
    if (await this.storage.acceptConsentOnSave()) this.toast.show('Saved in this browser', 'info', 2000);
    const s = await this.storage.createSetup({ name: name.trim().slice(0, 60) });
    await this.storage.setActiveSetup(s.id);
    this.editing.set(s.id);
    this.show('mine');
  }

  edit(s: Setup): void {
    this.editing.set(this.editing() === s.id ? null : s.id);
  }

  setField(s: Setup, field: 'boss' | 'name' | 'style', value: string): void {
    const v = value.trim().slice(0, 60);
    if (field === 'name' && !v) return;
    void this.storage.saveSetup({ ...s, [field]: v });
  }

  async togglePublic(s: Setup): Promise<void> {
    if (!this.supabase.user()) {
      this.toast.show('Sign in to share a setup – then it is listed for everyone.', 'info');
      return;
    }
    await this.storage.saveSetup({ ...s, isPublic: !s.isPublic });
    this.toast.show(s.isPublic ? 'Setup is private again.' : 'Setup is public: gear and rotations are listed for everyone.', 'info', 3000);
  }

  async duplicate(s: Setup): Promise<void> {
    const copy = await this.storage.duplicateSetup(s.id);
    if (copy) this.toast.show('Copied as "' + setupTitle(copy) + '".', 'info', 2500);
  }

  async remove(s: Setup): Promise<void> {
    const n = this.rotationsOf(s).length;
    const ok = await this.dialogs.confirm('Delete "' + setupTitle(s) + '" with its gear' + (n ? ' and ' + n + (n === 1 ? ' rotation' : ' rotations') : '') + '?', { title: 'Delete setup', ok: 'Delete', danger: true });
    if (!ok) return;
    await this.storage.deleteSetup(s.id);
  }

  async train(s: Setup): Promise<void> {
    await this.storage.setActiveSetup(s.id);
    const first = this.rotationsOf(s)[0];
    void this.router.navigate(['/'], first ? { queryParams: { rotation: first.id } } : {});
  }

  async openGear(s: Setup): Promise<void> {
    await this.storage.setActiveSetup(s.id);
    void this.router.navigate(['/loadout']);
  }

  async openRotations(s: Setup): Promise<void> {
    await this.storage.setActiveSetup(s.id);
    void this.router.navigate(['/rotations']);
  }

  loadDemo(): void {
    void this.presets.addDemo();
  }

  // ---------------------------------------------------------------- the public list: actions

  isOpen(boss: string): boolean {
    return this.openBosses().has(boss) || this.groups().length <= 3;
  }

  toggleBoss(boss: string): void {
    const next = new Set(this.openBosses());
    if (next.has(boss)) next.delete(boss);
    else next.add(boss);
    this.openBosses.set(next);
  }

  async toggle(row: PublicSetupRow): Promise<void> {
    if (this.open() === row.id) {
      this.open.set(null);
      return;
    }
    this.open.set(row.id);
    if (this.details()[row.id] !== undefined) return;
    try {
      const f = await this.sync.fetchSetup(row.id);
      this.details.update((d) => ({ ...d, [row.id]: f }));
    } catch (err) {
      this.toast.show('Could not load the setup: ' + errorText(err), 'warn');
    }
  }

  /** already copied into my setups (by origin or by the PvME preset it came from) */
  haveIt(row: PublicSetupRow): boolean {
    const mine = this.mineSources();
    return mine.has(row.id) || (!!row.preset_id && mine.has(row.preset_id));
  }

  async use(row: PublicSetupRow): Promise<void> {
    this.busy.set(row.id);
    try {
      if (await this.storage.acceptConsentOnSave()) this.toast.show('Saved in this browser', 'info', 2000);
      const f = this.details()[row.id] ?? (await this.sync.fetchSetup(row.id));
      if (!f) throw new Error('This setup is not shared any more.');
      const setup = await this.sync.copySetup(f, { ownerName: row.owner_name, ownerKind: row.owner_kind });
      await this.storage.setActiveSetup(setup.id);
      const first = setupRotations(this.storage.rotations(), setup.id)[0];
      this.toast.show('"' + setupTitle(setup) + '" is in your setups: gear and ' + f.rotations.length + (f.rotations.length === 1 ? ' rotation' : ' rotations') + '. Your bars and keys are untouched.', 'info', 5000);
      void this.router.navigate(['/'], first ? { queryParams: { rotation: first.id } } : {});
    } catch (err) {
      this.toast.show('Could not use the setup: ' + errorText(err), 'warn');
    } finally {
      this.busy.set(null);
    }
  }

  pickUser(u: SetupUserRow): void {
    this.owner.set(u.owner_id);
    this.styleFilter.set('all');
    this.show('all');
  }

  clearOwner(): void {
    this.owner.set(null);
  }

  // ---------------------------------------------------------------- gear extras (own and public setups alike)

  /** Archaeology relics the loadout carries – the gear panel has no slot for them */
  relics(l: Loadout | undefined): string[] {
    return (l?.relics ?? []).map((id) => RELICS.find((r) => r.id === id)?.name ?? id);
  }

  familiarName(l: Loadout | undefined): string {
    return (l?.familiar && this.data.familiarById().get(l.familiar)?.name) || l?.familiar || '';
  }

  /** the Invention perks on the worn items, "Biting 4" */
  perks(l: Loadout | undefined): string[] {
    if (!l) return [];
    const refs = [...Object.values(l.equipment ?? {}), ...l.inventory].filter((r): r is ItemRef => !!r);
    const out = new Set<string>();
    for (const r of refs) for (const g of r.gizmos ?? []) for (const p of g.perks) out.add((this.data.perkById().get(p.perk)?.name ?? p.perk) + ' ' + p.rank);
    return [...out];
  }

  ago(iso: string): string {
    const ms = Date.now() - Date.parse(iso);
    const d = Math.floor(ms / 86_400_000);
    if (d >= 30) return Math.floor(d / 30) + ' mo ago';
    if (d >= 1) return d + ' d ago';
    const h = Math.floor(ms / 3_600_000);
    return h >= 1 ? h + ' h ago' : 'just now';
  }
}

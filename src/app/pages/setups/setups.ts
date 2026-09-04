import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { keybindLabel } from '../../core/keybind.util';
import { ActionBarPreset, Keybind, Loadout, RELICS, RotationStep, Settings } from '../../core/models';
import { PublicSetup, PublicSetupRow, SetupSyncService } from '../../core/setup-sync.service';
import { StorageService } from '../../core/storage.service';
import { SupabaseService, errorText } from '../../core/supabase.service';
import { AbilityIcon } from '../../shared/ability-icon';
import { DialogService } from '../../shared/dialog';
import { ToastService } from '../../shared/toast';
import { EntityTip } from '../../shared/tooltip';

/** Public overview of shared setups: settings, loadouts, keybinds and action bars of other players, loadable in one click. */
@Component({
  selector: 'app-setups',
  imports: [AbilityIcon, EntityTip, RouterLink],
  templateUrl: './setups.html',
  styleUrl: './setups.scss',
})
export class Setups {
  readonly data = inject(DataService);
  readonly setups = inject(SetupSyncService);
  readonly supabase = inject(SupabaseService);
  readonly storage = inject(StorageService);
  private dialogs = inject(DialogService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly rows = signal<PublicSetupRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  /** user id → full setup once "Details" was opened */
  readonly details = signal<Record<string, PublicSetup>>({});
  readonly open = signal<string | null>(null);
  readonly busy = signal<string | null>(null);
  readonly myId = computed(() => this.supabase.user()?.id ?? null);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.rows.set(await this.setups.list());
    } catch (err) {
      this.error.set(errorText(err));
    } finally {
      this.loading.set(false);
    }
  }

  async toggle(row: PublicSetupRow): Promise<void> {
    if (this.open() === row.user_id) {
      this.open.set(null);
      return;
    }
    this.open.set(row.user_id);
    if (this.details()[row.user_id]) return;
    try {
      const s = await this.setups.get(row.user_id);
      if (s) this.details.update((d) => ({ ...d, [row.user_id]: s }));
      else this.toast.show('This setup is not shared any more.', 'warn');
    } catch (err) {
      this.toast.show('Could not load the setup: ' + errorText(err), 'warn');
    }
  }

  async loadSetup(row: PublicSetupRow): Promise<void> {
    const ok = await this.dialogs.confirm(
      'Replace your settings, loadouts, keybinds, action bars and enemy config with the setup of ' + row.display_name + '? Your rotations stay. This cannot be undone.',
      { title: 'Load setup', ok: 'Replace mine', danger: true },
    );
    if (!ok) return;
    this.busy.set(row.user_id);
    try {
      const s = this.details()[row.user_id] ?? (await this.setups.get(row.user_id));
      if (!s) throw new Error('This setup is not shared any more.');
      await this.setups.loadIntoMine(s);
      this.toast.show('Setup of ' + row.display_name + ' loaded' + (this.supabase.user() ? ' – your online copy follows.' : '.'), 'info');
      void this.router.navigate(['/']);
    } catch (err) {
      this.toast.show('Load failed: ' + errorText(err), 'warn');
    } finally {
      this.busy.set(null);
    }
  }

  // ---------------------------------------------------------------- display helpers

  /** "Full manual" / "Revolution, 9 slots, basic + enhanced" (shared settings may predate the combat mode) */
  combatModeText(s: Partial<Settings>): string {
    if (s.combatMode !== 'revolution') return 'Full manual';
    const r = s.revolution;
    const types = [r?.basics && 'basic', r?.enhanced && 'enhanced', r?.thresholds && 'threshold', r?.ultimates && 'ultimate'].filter((x): x is string => !!x);
    return 'Revolution, ' + (r?.slots ?? '?') + ' slots' + (types.length ? ', ' + types.join(' + ') : '');
  }

  settingsSummary(s: Settings): string {
    const parts = ['ping ' + s.pingMs + ' ms ± ' + s.jitterMs, 'queueing ' + (s.abilityQueueing ? 'on' : 'off')];
    if (s.combatMode === 'revolution') parts.push(this.combatModeText(s));
    if (s.loop) parts.push('loop');
    if (s.fullAdrenaline) parts.push('100% adrenaline');
    if (s.rechargeAdrenaline) parts.push('recharge');
    return parts.join(' · ');
  }

  weaponName(id: string | null): string | null {
    return id ? (this.data.weaponById().get(id)?.name ?? id) : null;
  }

  weapons(l: Loadout): string {
    const names = [l.twoHand, l.mainHand, l.offHand].map((id) => this.weaponName(id)).filter((x): x is string => !!x);
    return names.length ? names.join(' + ') : 'no weapon';
  }

  switches(l: Loadout): string[] {
    return (l.switches ?? []).map((id) => this.weaponName(id)).filter((x): x is string => !!x);
  }

  armour(l: Loadout): string | null {
    if (!l.armourSet) return null;
    const set = this.data.setEffectById().get(l.armourSet);
    return (set?.name ?? l.armourSet) + (l.armourPieces ? ' (' + l.armourPieces + ')' : '');
  }

  relics(l: Loadout): string[] {
    return (l.relics ?? []).map((id) => RELICS.find((r) => r.id === id)?.name ?? id);
  }

  familiarName(l: Loadout): string {
    return (l.familiar && this.data.familiarById().get(l.familiar)?.name) || l.familiar || '';
  }

  perks(l: Loadout): string[] {
    const out: string[] = [];
    for (const g of [...(l.weaponGizmos ?? []), ...(l.armourGizmos ?? [])]) {
      for (const p of g.perks ?? []) out.push((this.data.perkById().get(p.perk)?.name ?? p.perk) + ' ' + p.rank);
    }
    return out;
  }

  keybindRows(kb: Record<string, Keybind>): { key: string; name: string; label: string; entity: Entity | undefined }[] {
    return Object.entries(kb)
      .map(([key, k]) => {
        const entity = this.data.get(key);
        return { key, name: entity?.name ?? key, label: keybindLabel(k), entity };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  usedPresets(s: PublicSetup): ActionBarPreset[] {
    return (s.action_bars?.presets ?? []).filter((p) => p.slots.some((x) => !!x));
  }

  slotEntity(step: RotationStep | null): Entity | undefined {
    return step && step.kind !== 'note' ? this.data.step(step) : undefined;
  }

  slotKeys(s: PublicSetup): number {
    return (s.action_bars?.slotKeybinds ?? []).reduce((n, row) => n + row.filter((k) => !!k).length, 0);
  }

  ago(iso: string): string {
    const d = (Date.now() - Date.parse(iso)) / 1000;
    if (d < 3600) return Math.max(1, Math.round(d / 60)) + ' min ago';
    if (d < 86400) return Math.round(d / 3600) + ' h ago';
    return Math.round(d / 86400) + ' d ago';
  }
}

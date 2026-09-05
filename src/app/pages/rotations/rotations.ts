import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { groupCatalog } from '../../core/catalog-groups';
import { DataService, Entity } from '../../core/data.service';
import { keybindLabel } from '../../core/keybind.util';
import { parsePvme } from '../../core/pvme';
import { Rotation, RotationStep, SPELLBOOKS, SPELLBOOK_NAMES, STYLES } from '../../core/models';
import { isObscureEntity } from '../../core/obscure';
import { StorageService } from '../../core/storage.service';
import { SupabaseService } from '../../core/supabase.service';
import { SyncService } from '../../core/sync.service';
import { ruleFor } from '../../engine/rules';
import { AbilityIcon } from '../../shared/ability-icon';
import { EntityTip } from '../../shared/tooltip';
import { DialogService } from '../../shared/dialog';

const TABS = [...STYLES, 'Prayers', 'Curses', 'Spells', 'Special', 'Weapons', 'Specs', 'Actions'] as const;
type Tab = (typeof TABS)[number];
const TYPE_ORDER: Record<string, number> = { Basic: 0, Enhanced: 1, Threshold: 2, Ultimate: 3, Incantation: 4, Special: 5 };

@Component({
  selector: 'app-rotations',
  imports: [AbilityIcon, FormsModule, RouterLink, EntityTip, CdkDropList, CdkDrag],
  templateUrl: './rotations.html',
  styleUrl: './rotations.scss',
})
export class Rotations {
  private dialogs = inject(DialogService);
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);

  constructor() {
    // weapons are entities of the catalog (a step can wield one); the PvME import loads the alias table on use
    void this.data.ensure('weapons');
  }
  readonly supabase = inject(SupabaseService);
  readonly sync = inject(SyncService);
  private router = inject(Router);

  readonly TABS = TABS;
  readonly editing = signal<Rotation | null>(null);
  readonly tab = signal<Tab>('Melee');
  readonly search = signal('');
  readonly importText = signal('');
  readonly importOpen = signal(false);
  readonly importReport = signal<string | null>(null);

  /** same setting as on the action bars page: hide abilities / prayers / weapons nobody uses (core/obscure.ts) */
  readonly hideObscure = computed(() => this.storage.settings().hideObscureAbilities);

  setHideObscure(v: boolean): void {
    void this.storage.saveSettings({ ...this.storage.settings(), hideObscureAbilities: v });
  }

  readonly catalog = computed<Entity[]>(() => {
    const q = this.search().trim().toLowerCase();
    const hide = this.hideObscure();
    const byId = this.data.weaponById();
    const all = this.data.entities().filter((e) => !hide || !isObscureEntity(e, byId));
    const tab = this.tab();
    const list = q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all.filter((e) => (tab === 'Spells' ? e.kind === 'spell' : e.group === tab));
    return [...list].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
      if (a.ability && b.ability) {
        const t = (TYPE_ORDER[a.ability.type] ?? 9) - (TYPE_ORDER[b.ability.type] ?? 9);
        if (t) return t;
        return a.ability.level - b.ability.level || a.name.localeCompare(b.name);
      }
      if (a.prayer && b.prayer) return a.prayer.level - b.prayer.level || a.name.localeCompare(b.name);
      if (a.spell && b.spell) return SPELLBOOKS.indexOf(a.spell.book) - SPELLBOOKS.indexOf(b.spell.book) || a.spell.level - b.spell.level || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  });

  /** the catalog with a header per ability type (Basic → Enhanced → Threshold → Ultimate …), like the ability book */
  readonly catalogGroups = computed(() => groupCatalog(this.catalog()));

  /** in-game impossibilities in the rotation being edited */
  readonly editWarnings = computed<string[]>(() => {
    const r = this.editing();
    if (!r) return [];
    const out: string[] = [];
    const ids = r.steps.filter((s) => s.kind === 'ability').map((s) => s.id);
    const set = new Set(ids);
    for (const id of set) {
      const rule = ruleFor(id);
      if (rule?.replaces && set.has(rule.replaces)) {
        out.push(this.data.get('ability:' + id)?.name + ' replaces ' + this.data.get('ability:' + rule.replaces)?.name + ' in game – both cannot be on the action bar.');
      }
      for (const req of rule?.requires ?? []) {
        if (req.spirit && !ids.slice(0, ids.indexOf(id)).includes('conjure-' + req.spirit) && !ids.slice(0, ids.indexOf(id)).includes('conjure-undead-army')) {
          out.push(this.data.get('ability:' + id)?.name + ' needs its conjure earlier in the rotation.');
        }
        if (req.sequence) {
          const prev = ids.slice(0, ids.indexOf(id));
          const base = req.sequence.group === 'dismember' ? ['dismember', 'slaughter'][req.sequence.step - 2] : 'spectral-scythe';
          if (base && !prev.includes(base)) out.push(this.data.get('ability:' + id)?.name + ' needs ' + this.data.get('ability:' + base)?.name + ' first (same action bar slot).');
        }
      }
    }
    return [...new Set(out)];
  });

  keyOf(e: Entity): string {
    return keybindLabel(this.storage.keybinds()[e.key]);
  }

  entity(step: RotationStep): Entity | undefined {
    return this.data.step(step);
  }

  subtitle(e: Entity): string {
    if (e.ability) return e.ability.basicAttack ? 'auto-attack' : e.ability.type + (e.ability.triggersGcd ? '' : ' · no GCD');
    if (e.prayer) return 'level ' + e.prayer.level;
    if (e.special) return e.special.kind === 'bomb' ? 'thrown · no GCD' : e.special.kind === 'device' ? 'deployed · no GCD' : e.special.kind === 'scroll' ? 'familiar scroll · ' + e.special.specialPoints + ' special move points · no GCD' : e.special.adrenaline || e.special.adrenalineOverTime ? '+' + (e.special.adrenaline || e.special.adrenalineOverTime) + '% adrenaline' : 'potion · no GCD';
    if (e.weapon) return 'weapon switch · no GCD';
    if (e.spec) return 'spec · ' + (e.spec.adrenaline ?? 0) + '% adrenaline';
    if (e.action) return 'client action · no GCD';
    if (e.spell) return SPELLBOOK_NAMES[e.spell.book] + ' · level ' + e.spell.level + (e.spell.gcd ? '' : ' · no GCD');
    return '';
  }

  /** what the editor shows for a step: entity, or a note card */
  stepLabel(s: RotationStep): string {
    if (s.kind === 'note') return s.note ?? '';
    return this.entity(s)?.name ?? s.id;
  }

  /** Parses PvME notation and appends the steps to the rotation being edited. */
  async importPvme(): Promise<void> {
    const text = this.importText().trim();
    if (!text) return;
    await this.data.ensure('aliases', 'weapons');
    const { steps, unknown } = parsePvme(text, (alias) => this.data.resolvePvmeAlias(alias));
    if (!steps.length) {
      this.importReport.set('Nothing recognised.');
      return;
    }
    this.editing.update((r) => (r ? { ...r, steps: [...r.steps, ...steps] } : r));
    const inputs = steps.filter((s) => s.kind !== 'note').length;
    this.importReport.set(
      inputs + ' input' + (inputs === 1 ? '' : 's') + ' imported' + (unknown.length ? ', kept as notes: ' + unknown.join(' · ') : '') + '.',
    );
    this.importText.set('');
  }

  async addNote(): Promise<void> {
    const text = await this.dialogs.prompt('Note text (shown in the queue, not an input):', { title: 'Add note', placeholder: 'e.g. wait for the boss to move' });
    if (text?.trim()) this.editing.update((r) => (r ? { ...r, steps: [...r.steps, { kind: 'note', id: '', note: text.trim() }] } : r));
  }

  /** change the text of a note / phase step */
  async editNote(i: number): Promise<void> {
    const r = this.editing();
    const step = r?.steps[i];
    if (!r || !step || step.kind !== 'note') return;
    const text = await this.dialogs.prompt(step.phase ? 'Phase text:' : 'Note text (shown in the queue, not an input):', { title: step.phase ? 'Edit phase' : 'Edit note', value: step.note ?? '', ok: 'Save' });
    if (text === null || !text.trim()) return;
    this.editing.update((cur) => (cur ? { ...cur, steps: cur.steps.map((st, k) => (k === i ? { ...st, note: text.trim() } : st)) } : cur));
  }

  toggleSameTick(i: number): void {
    this.editing.update((r) => {
      if (!r) return r;
      const steps = r.steps.map((s, k) => (k === i ? { ...s, sameTick: !s.sameTick, offsetTicks: s.sameTick ? undefined : s.offsetTicks } : s));
      return { ...r, steps };
    });
  }

  newRotation(): void {
    this.editing.set({ id: crypto.randomUUID(), name: 'New rotation', steps: [], updatedAt: Date.now() });
  }

  edit(r: Rotation): void {
    this.editing.set({ ...r, steps: r.steps.map((s) => ({ ...s })) });
  }

  async remove(r: Rotation): Promise<void> {
    if (!(await this.dialogs.confirm('Delete rotation "' + r.name + '"?', { title: 'Delete rotation', ok: 'Delete', danger: true }))) return;
    await this.storage.deleteRotation(r.id);
  }

  train(r: Rotation): void {
    void this.router.navigate(['/'], { queryParams: { rotation: r.id } });
  }

  add(e: Entity): void {
    this.editing.update((r) => (r ? { ...r, steps: [...r.steps, { kind: e.kind, id: e.id }] } : r));
  }

  removeStep(i: number): void {
    this.editing.update((r) => (r ? { ...r, steps: r.steps.filter((_, k) => k !== i) } : r));
  }

  /** a tile was dragged to another place */
  reorder(ev: CdkDragDrop<unknown>): void {
    if (ev.previousIndex === ev.currentIndex) return;
    this.editing.update((r) => {
      if (!r) return r;
      const steps = [...r.steps];
      moveItemInArray(steps, ev.previousIndex, ev.currentIndex);
      return { ...r, steps };
    });
  }

  move(i: number, dir: -1 | 1): void {
    this.editing.update((r) => {
      if (!r) return r;
      const j = i + dir;
      if (j < 0 || j >= r.steps.length) return r;
      const steps = [...r.steps];
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...r, steps };
    });
  }

  setName(name: string): void {
    this.editing.update((r) => (r ? { ...r, name } : r));
  }

  setPublic(isPublic: boolean): void {
    this.editing.update((r) => (r ? { ...r, isPublic } : r));
  }

  async save(): Promise<void> {
    const r = this.editing();
    if (!r) return;
    await this.storage.saveRotation({ ...r, name: r.name.trim() || 'Unnamed rotation' });
    this.editing.set(null);
  }

  cancel(): void {
    this.editing.set(null);
  }
}

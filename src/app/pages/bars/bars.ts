import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { keybindLabel } from '../../core/keybind.util';
import { ActionBarSetup, BAR_POSITION_NAMES, RotationStep, STYLES, STYLES4, Style4, WEAPON_TYPES, WeaponType } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { AbilityIcon } from '../../shared/ability-icon';
import { EntityTip } from '../../shared/tooltip';

const TABS = [...STYLES, 'Prayers', 'Curses', 'Special', 'Weapons'] as const;
type Tab = (typeof TABS)[number];
const TYPE_ORDER: Record<string, number> = { Basic: 0, Enhanced: 1, Threshold: 2, Ultimate: 3, Special: 4 };

/** Action bar setup: 18 presets with drag & drop, positions, style bindings, weapon types. */
@Component({
  selector: 'app-bars',
  imports: [FormsModule, RouterLink, CdkDropList, CdkDrag, AbilityIcon, EntityTip],
  templateUrl: './bars.html',
  styleUrl: './bars.scss',
})
export class Bars {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);

  readonly TABS = TABS;
  readonly STYLES4 = STYLES4;
  readonly WEAPON_TYPES = WEAPON_TYPES;
  readonly POSITIONS = BAR_POSITION_NAMES;
  readonly setup = this.storage.actionBars;
  readonly selectedId = signal(1);
  readonly tab = signal<Tab>('Melee');
  readonly search = signal('');

  readonly preset = computed(() => this.setup().presets.find((p) => p.id === this.selectedId()) ?? this.setup().presets[0]);
  readonly slotEntities = computed<(Entity | null)[]>(() => this.preset().slots.map((s) => (s ? this.data.step(s) ?? null : null)));
  readonly slotIds = computed(() => this.preset().slots.map((_, i) => 'slot-' + i));

  readonly catalog = computed<Entity[]>(() => {
    const q = this.search().trim().toLowerCase();
    const all = this.data.entities();
    const list = q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all.filter((e) => e.group === this.tab());
    return [...list].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
      if (a.ability && b.ability) {
        const t = (TYPE_ORDER[a.ability.type] ?? 9) - (TYPE_ORDER[b.ability.type] ?? 9);
        return t || a.ability.level - b.ability.level || a.name.localeCompare(b.name);
      }
      if (a.prayer && b.prayer) return a.prayer.level - b.prayer.level || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  });

  /** which positions / bindings show a preset – for the list */
  usage(presetId: number): string {
    const s = this.setup();
    const out: string[] = [];
    s.positions.forEach((p, i) => p === presetId && out.push(this.POSITIONS[i]));
    for (const st of STYLES4) s.bindings[st].forEach((p, i) => p === presetId && out.push(st + ' → ' + this.POSITIONS[i]));
    return out.join(', ');
  }

  filled(presetId: number): number {
    return this.setup().presets.find((p) => p.id === presetId)?.slots.filter(Boolean).length ?? 0;
  }

  keyLabel(pos: number, slot: number): string {
    return keybindLabel(this.setup().slotKeybinds[pos]?.[slot]);
  }

  private save(mutate: (s: ActionBarSetup) => void): void {
    const s = structuredClone(this.setup());
    mutate(s);
    void this.storage.saveActionBars(s);
  }

  private mutatePreset(mutate: (slots: (RotationStep | null)[]) => void): void {
    const id = this.selectedId();
    this.save((s) => {
      const p = s.presets.find((x) => x.id === id);
      if (p) mutate(p.slots);
    });
  }

  rename(name: string): void {
    const id = this.selectedId();
    this.save((s) => {
      const p = s.presets.find((x) => x.id === id);
      if (p) p.name = name.trim() || 'Bar ' + id;
    });
  }

  /** drop from the catalog onto slot `target` */
  drop(event: CdkDragDrop<unknown>, target: number): void {
    if (event.previousContainer.id !== 'catalog') return;
    const e = event.item.data as Entity;
    this.mutatePreset((slots) => {
      slots[target] = { kind: e.kind, id: e.id };
    });
  }

  /** ‹ › on a slot: swap with the neighbour */
  move(slot: number, dir: -1 | 1): void {
    const j = slot + dir;
    this.mutatePreset((slots) => {
      if (j < 0 || j >= slots.length) return;
      [slots[slot], slots[j]] = [slots[j], slots[slot]];
    });
  }

  /** click in the catalog: first empty slot */
  add(e: Entity): void {
    this.mutatePreset((slots) => {
      const i = slots.findIndex((s) => !s);
      if (i >= 0) slots[i] = { kind: e.kind, id: e.id };
    });
  }

  clear(slot: number): void {
    this.mutatePreset((slots) => {
      slots[slot] = null;
    });
  }

  /** overwrite the selected preset with the slots of another one */
  copyFrom(sourceId: string | number | null): void {
    const src = this.setup().presets.find((p) => p.id === Number(sourceId));
    const target = this.preset();
    if (!src || !target || src.id === target.id) return;
    if (target.slots.some(Boolean) && !confirm('Replace the slots of "' + target.name + '" with a copy of "' + src.name + '"?')) return;
    this.mutatePreset((slots) => src.slots.forEach((s, i) => (slots[i] = s ? { ...s } : null)));
  }

  clearAll(): void {
    if (!confirm('Empty all 14 slots of "' + this.preset().name + '"?')) return;
    this.mutatePreset((slots) => slots.fill(null));
  }

  setPosition(pos: number, presetId: string | number | null): void {
    const id = presetId === null || presetId === '' ? null : Number(presetId);
    this.save((s) => (s.positions[pos] = id));
  }

  setBinding(style: Style4, pos: number, presetId: string | number | null): void {
    const id = presetId === null || presetId === '' ? null : Number(presetId);
    this.save((s) => (s.bindings[style][pos] = id));
  }

  setWeaponType(style: Style4, type: WeaponType): void {
    this.save((s) => (s.weapons[style] = type));
  }

  setStartWeapon(style: Style4): void {
    this.save((s) => (s.startWeapon = style));
  }

  subtitle(e: Entity): string {
    if (e.ability) return e.ability.basicAttack ? 'auto-attack' : e.ability.type + (e.ability.triggersGcd ? '' : ' · no GCD');
    if (e.prayer) return 'level ' + e.prayer.level;
    if (e.special) return '+' + (e.special.adrenaline || e.special.adrenalineOverTime) + '% adrenaline';
    if (e.weapon) return 'weapon switch';
    return '';
  }
}

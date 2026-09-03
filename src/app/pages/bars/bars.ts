import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { keybindLabel } from '../../core/keybind.util';
import { ActionBarSetup, BAR_POSITION_NAMES, RotationStep, STYLES, STYLES4, Style4, WEAPON_TYPES, WeaponType } from '../../core/models';
import { isObscureEntity } from '../../core/obscure';
import { StorageService } from '../../core/storage.service';
import { AbilityIcon } from '../../shared/ability-icon';
import { EntityTip } from '../../shared/tooltip';
import { DialogService } from '../../shared/dialog';

const TABS = [...STYLES, 'Prayers', 'Curses', 'Special', 'Weapons'] as const;
type Tab = (typeof TABS)[number];
const TYPE_ORDER: Record<string, number> = { Basic: 0, Enhanced: 1, Threshold: 2, Ultimate: 3, Special: 4 };

/** Action bar setup: 18 presets with drag & drop, positions, style bindings, weapon types. */
@Component({
  selector: 'app-bars',
  imports: [FormsModule, RouterLink, AbilityIcon, EntityTip],
  templateUrl: './bars.html',
  styleUrl: './bars.scss',
})
export class Bars {
  private dialogs = inject(DialogService);
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
  /** slot under the pointer while dragging */
  readonly hoverSlot = signal<number | null>(null);
  /** slot being dragged (dimmed) */
  readonly dragSlot = signal<number | null>(null);
  readonly isDragging = signal(false);
  private drag: { entity: Entity; fromSlot: number | null; startX: number; startY: number; ghost: HTMLElement | null; moved: boolean } | null = null;
  private suppressClick = false;

  /** "Hide obscure abilities / prayers" – slayer passives, sub-36 standard prayers, saps & leeches … (core/obscure.ts) */
  readonly hideObscure = computed(() => this.storage.settings().hideObscureAbilities);

  setHideObscure(v: boolean): void {
    void this.storage.saveSettings({ ...this.storage.settings(), hideObscureAbilities: v });
  }

  readonly catalog = computed<Entity[]>(() => {
    const q = this.search().trim().toLowerCase();
    const hide = this.hideObscure();
    const byId = this.data.weaponById();
    const all = this.data.entities().filter((e) => !hide || !isObscureEntity(e, byId));
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

  /**
   * Pointer-based drag: the source stays where it is (the CDK hid it and left a gap in the catalog),
   * a ghost icon follows the pointer and the slot underneath is highlighted. Catalog → slot sets the
   * slot; slot → slot swaps the two slots.
   */
  startDrag(ev: PointerEvent, entity: Entity, fromSlot: number | null): void {
    if (ev.button !== 0) return;
    ev.preventDefault();
    this.drag = { entity, fromSlot, startX: ev.clientX, startY: ev.clientY, ghost: null, moved: false };
    window.addEventListener('pointermove', this.onDragMove);
    window.addEventListener('pointerup', this.onDragEnd, { once: true });
    window.addEventListener('pointercancel', this.onDragEnd, { once: true });
  }

  private onDragMove = (ev: PointerEvent): void => {
    const d = this.drag;
    if (!d) return;
    if (!d.moved) {
      if (Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) < 6) return;
      d.moved = true;
      d.ghost = this.makeGhost(d.entity);
      this.dragSlot.set(d.fromSlot);
      this.isDragging.set(true);
    }
    if (d.ghost) {
      d.ghost.style.left = ev.clientX - 24 + 'px';
      d.ghost.style.top = ev.clientY - 24 + 'px';
    }
    this.hoverSlot.set(this.slotUnder(ev));
  };

  private onDragEnd = (ev: PointerEvent): void => {
    const d = this.drag;
    this.drag = null;
    window.removeEventListener('pointermove', this.onDragMove);
    window.removeEventListener('pointerup', this.onDragEnd);
    window.removeEventListener('pointercancel', this.onDragEnd);
    if (!d) return;
    d.ghost?.remove();
    this.hoverSlot.set(null);
    this.dragSlot.set(null);
    this.isDragging.set(false);
    if (!d.moved) return; // plain click – handled by (click)
    this.suppressClick = true;
    window.setTimeout(() => (this.suppressClick = false), 0);
    const target = this.slotUnder(ev);
    if (target === null) return;
    this.mutatePreset((slots) => {
      if (d.fromSlot === null) {
        slots[target] = { kind: d.entity.kind, id: d.entity.id };
      } else if (d.fromSlot !== target) {
        [slots[d.fromSlot], slots[target]] = [slots[target], slots[d.fromSlot]];
      }
    });
  };

  private slotUnder(ev: PointerEvent): number | null {
    const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-slot]') as HTMLElement | null;
    return el ? Number(el.dataset['slot']) : null;
  }

  private makeGhost(e: Entity): HTMLElement {
    // appended to <body>, so the component's scoped styles do not reach it: style it inline
    const g = document.createElement('div');
    g.className = 'drag-ghost';
    Object.assign(g.style, {
      position: 'fixed', zIndex: '200', width: '48px', height: '48px', pointerEvents: 'none',
      border: '2px solid #c9a227', borderRadius: '6px', background: '#000', overflow: 'hidden',
      boxShadow: '0 6px 18px rgba(0,0,0,0.7)', left: '-100px', top: '-100px',
    } as Partial<CSSStyleDeclaration>);
    const img = document.createElement('img');
    img.src = e.icon;
    img.alt = e.name;
    Object.assign(img.style, { width: '100%', height: '100%', display: 'block' } as Partial<CSSStyleDeclaration>);
    g.appendChild(img);
    document.body.appendChild(g);
    return g;
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
    if (this.suppressClick) return;
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
  async copyFrom(sourceId: string | number | null): Promise<void> {
    const src = this.setup().presets.find((p) => p.id === Number(sourceId));
    const target = this.preset();
    if (!src || !target || src.id === target.id) return;
    if (target.slots.some(Boolean) && !(await this.dialogs.confirm('Replace the slots of "' + target.name + '" with a copy of "' + src.name + '"?', { title: 'Copy preset', ok: 'Replace' }))) return;
    this.mutatePreset((slots) => src.slots.forEach((s, i) => (slots[i] = s ? { ...s } : null)));
  }

  async clearAll(): Promise<void> {
    if (!(await this.dialogs.confirm('Empty all 14 slots of "' + this.preset().name + '"?', { title: 'Empty preset', ok: 'Empty', danger: true }))) return;
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


  subtitle(e: Entity): string {
    if (e.ability) return e.ability.basicAttack ? 'auto-attack' : e.ability.type + (e.ability.triggersGcd ? '' : ' · no GCD');
    if (e.prayer) return 'level ' + e.prayer.level;
    if (e.special) return '+' + (e.special.adrenaline || e.special.adrenalineOverTime) + '% adrenaline';
    if (e.weapon) return 'weapon switch';
    return '';
  }
}

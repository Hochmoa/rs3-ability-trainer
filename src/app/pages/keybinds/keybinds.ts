import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { ACTIONS, BAR_POSITION_NAMES, Keybind, loadoutWeapons } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { ToastService } from '../../shared/toast';
import { EntityTip } from '../../shared/tooltip';

type Target = { pos: number; slot: number } | { weapon: string } | { action: string };

/** Keybinds belong to bar position + slot (like in the game) plus one key per weapon switch. */
@Component({
  selector: 'app-keybinds',
  imports: [RouterLink, EntityTip],
  templateUrl: './keybinds.html',
  styleUrl: './keybinds.scss',
})
export class Keybinds {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);

  readonly POSITIONS = BAR_POSITION_NAMES;
  readonly ACTIONS = ACTIONS;
  readonly setup = this.storage.actionBars;
  readonly capturing = signal<Target | null>(null);
  /** target whose keybind was just taken away – highlighted red for two seconds */
  readonly flashing = signal<Target | null>(null);
  private toasts = inject(ToastService);
  private flashTimer = 0;

  /** keybind → list of places using it */
  readonly conflicts = computed(() => {
    const m = new Map<string, string[]>();
    const s = this.setup();
    s.slotKeybinds.forEach((row, pos) =>
      row.forEach((kb, slot) => {
        if (kb) m.set(keybindKey(kb), [...(m.get(keybindKey(kb)) ?? []), this.POSITIONS[pos] + ' slot ' + (slot + 1)]);
      }),
    );
    for (const w of this.carried()) {
      const kb = s.weaponKeybinds[w.id];
      if (kb) m.set(keybindKey(kb), [...(m.get(keybindKey(kb)) ?? []), w.name]);
    }
    for (const a of ACTIONS) {
      const kb = s.actionKeybinds?.[a.id];
      if (kb) m.set(keybindKey(kb), [...(m.get(keybindKey(kb)) ?? []), a.name]);
    }
    return m;
  });

  presetName(pos: number): string {
    const id = this.setup().positions[pos];
    return id === null ? '– empty –' : (this.setup().presets.find((p) => p.id === id)?.name ?? 'Bar ' + id);
  }

  /** entity sitting in that slot of the position's default preset – as a hint */
  entityAt(pos: number, slot: number): Entity | null {
    const id = this.setup().positions[pos];
    const step = id === null ? null : this.setup().presets.find((p) => p.id === id)?.slots[slot];
    return step ? (this.data.step(step) ?? null) : null;
  }

  label(pos: number, slot: number): string {
    return keybindLabel(this.setup().slotKeybinds[pos]?.[slot]);
  }

  /** weapons of the active loadout (in hand + switches) */
  readonly carried = computed<Entity[]>(() =>
    loadoutWeapons(this.storage.loadout())
      .map((id) => this.data.get('weapon:' + id))
      .filter((e): e is Entity => !!e),
  );

  weaponLabel(id: string): string {
    return keybindLabel(this.setup().weaponKeybinds[id]);
  }

  conflictOf(kb: Keybind | null, self: string): string[] {
    if (!kb) return [];
    return (this.conflicts().get(keybindKey(kb)) ?? []).filter((x) => x !== self);
  }

  slotConflicts(pos: number, slot: number): string[] {
    return this.conflictOf(this.setup().slotKeybinds[pos]?.[slot] ?? null, this.POSITIONS[pos] + ' slot ' + (slot + 1));
  }

  weaponConflicts(w: Entity): string[] {
    return this.conflictOf(this.setup().weaponKeybinds[w.id] ?? null, w.name);
  }

  actionLabel(id: string): string {
    return keybindLabel(this.setup().actionKeybinds?.[id]);
  }

  actionConflicts(id: string, name: string): string[] {
    return this.conflictOf(this.setup().actionKeybinds?.[id] ?? null, name);
  }

  isCapturing(t: Target): boolean {
    const c = this.capturing();
    if (!c) return false;
    if ('weapon' in t) return 'weapon' in c && c.weapon === t.weapon;
    if ('action' in t) return 'action' in c && c.action === t.action;
    return 'pos' in c && c.pos === t.pos && c.slot === t.slot;
  }

  capture(t: Target): void {
    this.capturing.set(this.isCapturing(t) ? null : t);
  }

  /** Sets the keybind; a key may only live in one place, so it is removed wherever else it was bound. */
  private assign(t: Target, kb: Keybind | null): void {
    const s = structuredClone(this.setup());
    if (kb) {
      const key = keybindKey(kb);
      const previous = this.findOther(s, key, t);
      if (previous) {
        this.put(s, previous, null);
        this.flash(previous);
        this.toasts.show('Removed bind ' + keybindLabel(kb) + ' from ' + this.describe(previous), 'warn');
      }
    }
    this.put(s, t, kb);
    void this.storage.saveActionBars(s);
  }

  private put(s: ReturnType<typeof this.setup>, t: Target, kb: Keybind | null): void {
    if ('weapon' in t) s.weaponKeybinds = { ...s.weaponKeybinds, [t.weapon]: kb };
    else if ('action' in t) s.actionKeybinds = { ...(s.actionKeybinds ?? {}), [t.action]: kb };
    else s.slotKeybinds[t.pos][t.slot] = kb;
  }

  private sameTarget(a: Target, b: Target): boolean {
    if ('weapon' in a) return 'weapon' in b && a.weapon === b.weapon;
    if ('action' in a) return 'action' in b && a.action === b.action;
    return 'pos' in b && a.pos === b.pos && a.slot === b.slot;
  }

  /** Any other place that currently holds this key. */
  private findOther(s: ReturnType<typeof this.setup>, key: string, self: Target): Target | null {
    for (let pos = 0; pos < s.slotKeybinds.length; pos++) {
      for (let slot = 0; slot < s.slotKeybinds[pos].length; slot++) {
        const kb = s.slotKeybinds[pos][slot];
        const t: Target = { pos, slot };
        if (kb && keybindKey(kb) === key && !this.sameTarget(t, self)) return t;
      }
    }
    for (const w of this.carried()) {
      const kb = s.weaponKeybinds[w.id];
      const t: Target = { weapon: w.id };
      if (kb && keybindKey(kb) === key && !this.sameTarget(t, self)) return t;
    }
    for (const a of ACTIONS) {
      const kb = s.actionKeybinds?.[a.id];
      const t: Target = { action: a.id };
      if (kb && keybindKey(kb) === key && !this.sameTarget(t, self)) return t;
    }
    return null;
  }

  describe(t: Target): string {
    if ('weapon' in t) return t.weapon + ' weapon switch';
    if ('action' in t) return ACTIONS.find((a) => a.id === t.action)?.name ?? t.action;
    return 'slot ' + (t.slot + 1) + ' in bar ' + this.POSITIONS[t.pos];
  }

  isFlashing(t: Target): boolean {
    const f = this.flashing();
    return !!f && this.sameTarget(f, t);
  }

  private flash(t: Target): void {
    window.clearTimeout(this.flashTimer);
    this.flashing.set(t);
    this.flashTimer = window.setTimeout(() => this.flashing.set(null), 2000);
  }

  clear(t: Target): void {
    this.assign(t, null);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const t = this.capturing();
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code === 'Escape') {
      this.capturing.set(null);
      return;
    }
    if (e.code === 'Backspace' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      this.assign(t, null);
      this.capturing.set(null);
      return;
    }
    const kb = keybindFromEvent(e);
    if (!kb) return;
    this.assign(t, kb);
    this.capturing.set(null);
  }
}

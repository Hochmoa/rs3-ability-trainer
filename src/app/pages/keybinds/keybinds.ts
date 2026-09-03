import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { BAR_POSITION_NAMES, Keybind, STYLES4, Style4 } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { EntityTip } from '../../shared/tooltip';

type Target = { pos: number; slot: number } | { weapon: Style4 };

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
  readonly STYLES4 = STYLES4;
  readonly setup = this.storage.actionBars;
  readonly capturing = signal<Target | null>(null);

  /** keybind → list of places using it */
  readonly conflicts = computed(() => {
    const m = new Map<string, string[]>();
    const s = this.setup();
    s.slotKeybinds.forEach((row, pos) =>
      row.forEach((kb, slot) => {
        if (kb) m.set(keybindKey(kb), [...(m.get(keybindKey(kb)) ?? []), this.POSITIONS[pos] + ' slot ' + (slot + 1)]);
      }),
    );
    for (const st of STYLES4) {
      const kb = s.weaponKeybinds[st];
      if (kb) m.set(keybindKey(kb), [...(m.get(keybindKey(kb)) ?? []), st + ' weapon']);
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

  weaponLabel(style: Style4): string {
    return keybindLabel(this.setup().weaponKeybinds[style]);
  }

  weaponIcon(style: Style4): string {
    return this.data.get('weapon:' + style.toLowerCase())?.icon ?? '';
  }

  conflictOf(kb: Keybind | null, self: string): string[] {
    if (!kb) return [];
    return (this.conflicts().get(keybindKey(kb)) ?? []).filter((x) => x !== self);
  }

  slotConflicts(pos: number, slot: number): string[] {
    return this.conflictOf(this.setup().slotKeybinds[pos]?.[slot] ?? null, this.POSITIONS[pos] + ' slot ' + (slot + 1));
  }

  weaponConflicts(style: Style4): string[] {
    return this.conflictOf(this.setup().weaponKeybinds[style], style + ' weapon');
  }

  isCapturing(t: Target): boolean {
    const c = this.capturing();
    if (!c) return false;
    if ('weapon' in t) return 'weapon' in c && c.weapon === t.weapon;
    return 'pos' in c && c.pos === t.pos && c.slot === t.slot;
  }

  capture(t: Target): void {
    this.capturing.set(this.isCapturing(t) ? null : t);
  }

  private assign(t: Target, kb: Keybind | null): void {
    const s = structuredClone(this.setup());
    if ('weapon' in t) s.weaponKeybinds[t.weapon] = kb;
    else s.slotKeybinds[t.pos][t.slot] = kb;
    void this.storage.saveActionBars(s);
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

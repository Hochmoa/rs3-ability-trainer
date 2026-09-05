import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { DEFAULT_LAYOUT_ID, KEYBIND_LAYOUTS, applyLayout, keybindLayout } from '../../core/keybind-layouts';
import { isReservedKeybind, keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { ACTIONS, ActionBarSetup, BAR_POSITION_NAMES, Keybind, loadoutWeapons } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { DialogService } from '../../shared/dialog';
import { ToastService } from '../../shared/toast';
import { EntityTip } from '../../shared/tooltip';

type Target = { pos: number; slot: number } | { weapon: string } | { action: string };

/** one stop of the "bind by pressing" wizard */
interface WizardStop {
  target: Target;
  entity: Entity | null;
  /** "Main bar · slot 3" / "Weapon switch" */
  where: string;
}

interface Wizard {
  stops: WizardStop[];
  index: number;
  /** working copy – saved when the wizard finishes */
  setup: ActionBarSetup;
  bound: number;
  skipped: number;
  cleared: number;
}

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

  constructor() {
    // the carried weapons and weapons sitting on bars are looked up by entity key
    void this.data.ensure('weapons');
  }

  readonly POSITIONS = BAR_POSITION_NAMES;
  readonly ACTIONS = ACTIONS;
  readonly LAYOUTS = KEYBIND_LAYOUTS;
  readonly setup = this.storage.actionBars;
  readonly capturing = signal<Target | null>(null);
  /** target whose keybind was just taken away – highlighted red for two seconds */
  readonly flashing = signal<Target | null>(null);
  readonly layoutId = signal(DEFAULT_LAYOUT_ID);
  readonly layout = computed(() => keybindLayout(this.layoutId()));
  readonly wizard = signal<Wizard | null>(null);
  readonly wizardStop = computed<WizardStop | null>(() => {
    const w = this.wizard();
    return w ? (w.stops[w.index] ?? null) : null;
  });
  readonly profileName = computed(() => this.storage.barProfiles().find((p) => p.id === this.storage.activeBarProfileId())?.name ?? 'Default');
  private toasts = inject(ToastService);
  private dialogs = inject(DialogService);
  private flashTimer = 0;

  /** keybind → list of places using it */
  readonly conflicts = computed(() => this.conflictMap(this.setup()));

  private conflictMap(s: ActionBarSetup): Map<string, string[]> {
    const m = new Map<string, string[]>();
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
  }

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
    if (this.wizard()) return;
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

  private put(s: ActionBarSetup, t: Target, kb: Keybind | null): void {
    if ('weapon' in t) s.weaponKeybinds = { ...s.weaponKeybinds, [t.weapon]: kb };
    else if ('action' in t) s.actionKeybinds = { ...(s.actionKeybinds ?? {}), [t.action]: kb };
    else s.slotKeybinds[t.pos][t.slot] = kb;
  }

  private get(s: ActionBarSetup, t: Target): Keybind | null {
    if ('weapon' in t) return s.weaponKeybinds[t.weapon] ?? null;
    if ('action' in t) return s.actionKeybinds?.[t.action] ?? null;
    return s.slotKeybinds[t.pos]?.[t.slot] ?? null;
  }

  private sameTarget(a: Target, b: Target): boolean {
    if ('weapon' in a) return 'weapon' in b && a.weapon === b.weapon;
    if ('action' in a) return 'action' in b && a.action === b.action;
    return 'pos' in b && a.pos === b.pos && a.slot === b.slot;
  }

  /** Any other place that currently holds this key. */
  private findOther(s: ActionBarSetup, key: string, self: Target): Target | null {
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

  // ---------------------------------------------------------------- layouts

  /** Number of keys the active profile has anywhere (slots, weapons, actions). */
  private keyCount(s: ActionBarSetup): number {
    return s.slotKeybinds.flat().filter(Boolean).length + Object.values(s.weaponKeybinds).filter(Boolean).length + Object.values(s.actionKeybinds ?? {}).filter(Boolean).length;
  }

  /** Writes the chosen layout into the active bar setup – all keys (after a confirm) or only the slots without one. */
  async applyLayout(overwrite: boolean): Promise<void> {
    const layout = this.layout();
    const s = this.setup();
    if (overwrite && this.keyCount(s) > 0) {
      const ok = await this.dialogs.confirm(
        'Replace every key of the bar setup "' + this.profileName() + '" with the layout "' + layout.name + '"?\n\nAll slot keys, weapon switches and client actions are overwritten.',
        { title: 'Apply layout', ok: 'Replace keys', danger: true },
      );
      if (!ok) return;
    }
    const { data, filled } = applyLayout(s, layout, { overwrite, weaponIds: this.carried().map((w) => w.id) });
    await this.storage.saveActionBars(data);
    this.toasts.show(overwrite ? 'Applied "' + layout.name + '" – ' + filled + ' keys' : filled ? 'Filled ' + filled + ' empty slots from "' + layout.name + '"' : 'Nothing to fill – every slot already has a key or its layout key is taken');
  }

  // ---------------------------------------------------------------- bind by pressing

  /** Walks through every filled slot of every bar (then the weapon switches); one key press per stop. */
  async startWizard(): Promise<void> {
    const s = this.setup();
    const stops: WizardStop[] = [];
    for (let pos = 0; pos < s.slotKeybinds.length; pos++) {
      for (let slot = 0; slot < s.slotKeybinds[pos].length; slot++) {
        const entity = this.entityAt(pos, slot);
        if (entity) stops.push({ target: { pos, slot }, entity, where: this.POSITIONS[pos] + ' · slot ' + (slot + 1) });
      }
    }
    for (const w of this.carried()) stops.push({ target: { weapon: w.id }, entity: w, where: 'Weapon switch' });
    if (!stops.length) {
      await this.dialogs.alert('The bars of this setup are empty – put abilities on them on the Action bars page (or add a boss preset) and come back.', 'Nothing to bind');
      return;
    }
    this.capturing.set(null);
    this.wizard.set({ stops, index: 0, setup: structuredClone(s), bound: 0, skipped: 0, cleared: 0 });
  }

  isWizardCurrent(t: Target): boolean {
    const stop = this.wizardStop();
    return !!stop && this.sameTarget(stop.target, t);
  }

  /** the key the current stop has right now (before the press) */
  wizardCurrentKey(): string {
    const w = this.wizard();
    const stop = this.wizardStop();
    return w && stop ? keybindLabel(this.get(w.setup, stop.target)) : '';
  }

  private wizardStep(w: Wizard, kb: Keybind | null | 'skip'): void {
    const stop = w.stops[w.index];
    if (kb === 'skip') w.skipped++;
    else {
      this.put(w.setup, stop.target, kb);
      if (kb) w.bound++;
      else w.cleared++;
    }
    w.index++;
    if (w.index >= w.stops.length) void this.finishWizard(true);
    else this.wizard.set({ ...w });
  }

  /** Saves what was bound (or throws it away) and reports keys that are now used more than once. */
  async finishWizard(save: boolean): Promise<void> {
    const w = this.wizard();
    if (!w) return;
    this.wizard.set(null);
    if (!save) {
      this.toasts.show('Binding cancelled – nothing changed');
      return;
    }
    if (await this.storage.acceptConsentOnSave()) this.toasts.show('Saved in this browser', 'info', 2000);
    await this.storage.saveActionBars(w.setup);
    this.toasts.show('Bound ' + w.bound + ' keys' + (w.skipped ? ', ' + w.skipped + ' skipped' : '') + (w.cleared ? ', ' + w.cleared + ' cleared' : ''));
    const dupes = [...this.conflictMap(w.setup).entries()].filter(([, places]) => places.length > 1);
    if (dupes.length) {
      const lines = dupes.map(([key, places]) => '• ' + keybindLabel(fromKey(key)) + ': ' + places.join(', '));
      await this.dialogs.alert('These keys are bound more than once – only one of the places can win in a session. Click a slot to rebind it.\n\n' + lines.join('\n'), 'Keys used twice');
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const w = this.wizard();
    if (w) {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape' && !e.ctrlKey && !e.shiftKey && !e.altKey) return this.wizardStep(w, 'skip');
      if (e.code === 'Backspace' && !e.ctrlKey && !e.shiftKey && !e.altKey) return this.wizardStep(w, null);
      const kb = keybindFromEvent(e);
      if (!kb) return;
      if (isReservedKeybind(kb)) {
        this.toasts.show(keybindLabel(kb) + ' is reserved by the browser – pick another key', 'warn');
        return;
      }
      return this.wizardStep(w, kb);
    }
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
    if (isReservedKeybind(kb)) {
      this.toasts.show(keybindLabel(kb) + ' is reserved by the browser – pick another key', 'warn');
      return;
    }
    this.assign(t, kb);
    this.capturing.set(null);
  }
}

/** inverse of keybindKey: "CS:KeyQ" → Keybind */
function fromKey(key: string): Keybind {
  const i = key.indexOf(':');
  const mods = key.slice(0, i);
  return { code: key.slice(i + 1), ctrl: mods.includes('C'), shift: mods.includes('S'), alt: mods.includes('A') };
}

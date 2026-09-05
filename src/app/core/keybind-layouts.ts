import { isReservedKeybind, keybindKey, parseKeybind } from './keybind.util';
import { ActionBarSetup, BAR_POSITIONS, BAR_SLOTS, BarProfileData, Keybind, defaultActionBars, snapshotActiveProfile } from './models';

/**
 * A named keyboard layout: one key per slot of the five bar positions (14 each), keys for up to four weapon
 * switches and for the client actions. Codes are KeyboardEvent.code with optional "Ctrl+" / "Shift+" / "Alt+".
 */
export interface KeybindLayout {
  id: string;
  name: string;
  description: string;
  /** [position][slot] – '' leaves the slot without a key */
  bars: string[][];
  /** keys for the weapon switches of the loadout, in order (in hand first) */
  weapons: string[];
  actions: Record<string, string>;
}

const DIGIT_ROW = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'BracketLeft', 'BracketRight'];
const shifted = (codes: string[]) => codes.map((c) => 'Shift+' + c);

export const KEYBIND_LAYOUTS: KeybindLayout[] = [
  {
    id: 'rows',
    name: 'Number row + QWERTY',
    description: 'Main bar 1-0 - = [ ], the Q, A and Z rows for additional bars 1-3 (Shift+ fills their last slots), Shift+1-0 on bar 4, F1-F4 for weapon switches, Tab for target cycle.',
    bars: [
      DIGIT_ROW,
      ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'Backslash', ...shifted(['KeyQ', 'KeyW', 'KeyE'])],
      ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', ...shifted(['KeyA', 'KeyS', 'KeyD'])],
      ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', ...shifted(['KeyZ', 'KeyX', 'KeyC', 'KeyV'])],
      shifted(DIGIT_ROW),
    ],
    weapons: ['F1', 'F2', 'F3', 'F4'],
    actions: { 'target-cycle': 'Tab' },
  },
  {
    id: 'numpad',
    name: 'Numpad + QWER (WASD free)',
    description: 'Main bar on the numpad, the number row and the keys around WASD for the additional bars - W A S D and the arrows stay free for the camera. F1-F4 for weapon switches, Tab for target cycle.',
    bars: [
      ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9', 'Numpad0', 'NumpadDecimal', 'NumpadAdd', 'NumpadSubtract', 'NumpadMultiply'],
      [...DIGIT_ROW.slice(0, 12), 'KeyQ', 'KeyE'],
      ['KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'],
      ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Quote', 'BracketLeft', 'BracketRight', 'Backslash'],
      [...shifted(DIGIT_ROW.slice(0, 12)), 'Shift+KeyQ', 'Shift+KeyE'],
    ],
    weapons: ['F1', 'F2', 'F3', 'F4'],
    actions: { 'target-cycle': 'Tab' },
  },
  {
    id: 'empty',
    name: 'Custom (empty)',
    description: 'No keys at all - bind every slot yourself, e.g. with "Bind by pressing".',
    bars: Array.from({ length: BAR_POSITIONS }, () => Array(BAR_SLOTS).fill('')),
    weapons: [],
    actions: {},
  },
];

export const DEFAULT_LAYOUT_ID = 'rows';

export function keybindLayout(id: string | undefined): KeybindLayout {
  return KEYBIND_LAYOUTS.find((l) => l.id === id) ?? KEYBIND_LAYOUTS.find((l) => l.id === DEFAULT_LAYOUT_ID)!;
}

function toKeybind(code: string): Keybind | null {
  if (!code) return null;
  const kb = parseKeybind(code);
  return isReservedKeybind(kb) ? null : kb;
}

/** Every keybind a layout defines (slots, weapons, actions) – for duplicate checks and tests. */
export function layoutKeybinds(l: KeybindLayout): Keybind[] {
  return [...l.bars.flat(), ...l.weapons, ...Object.values(l.actions)].filter(Boolean).map(parseKeybind);
}

export interface ApplyLayoutOptions {
  /** true = every slot gets the layout key (existing keys are dropped); false = only empty slots are filled, with keys nobody else uses */
  overwrite: boolean;
  /** weapon item ids of the loadout (in hand first) that get the layout's weapon keys */
  weaponIds?: string[];
}

export interface ApplyLayoutResult<T extends BarProfileData> {
  data: T;
  /** number of slot / weapon / action keys written */
  filled: number;
}

/**
 * Writes a layout into the keybinds of a profile. With `overwrite` everything is replaced, otherwise only empty
 * slots get a key and keys already in use elsewhere are skipped, so a player's own binds survive.
 */
export function applyLayout<T extends BarProfileData>(data: T, layout: KeybindLayout, opts: ApplyLayoutOptions): ApplyLayoutResult<T> {
  const out: T = { ...data, slotKeybinds: data.slotKeybinds.map((row) => [...row]), weaponKeybinds: { ...data.weaponKeybinds }, actionKeybinds: { ...(data.actionKeybinds ?? {}) } };
  const actions = out.actionKeybinds!;
  while (out.slotKeybinds.length < BAR_POSITIONS) out.slotKeybinds.push(Array(BAR_SLOTS).fill(null));
  for (const row of out.slotKeybinds) while (row.length < BAR_SLOTS) row.push(null);
  const used = new Set<string>();
  if (opts.overwrite) {
    out.slotKeybinds = out.slotKeybinds.map((row) => row.map(() => null));
    for (const id of Object.keys(out.weaponKeybinds)) out.weaponKeybinds[id] = null;
    for (const id of Object.keys(actions)) actions[id] = null;
  } else {
    for (const row of out.slotKeybinds) for (const kb of row) if (kb) used.add(keybindKey(kb));
    for (const kb of Object.values(out.weaponKeybinds)) if (kb) used.add(keybindKey(kb));
    for (const kb of Object.values(actions)) if (kb) used.add(keybindKey(kb));
  }
  let filled = 0;
  const take = (code: string, current: Keybind | null | undefined): Keybind | null => {
    const kb = toKeybind(code);
    if (!kb || current || used.has(keybindKey(kb))) return current ?? null;
    used.add(keybindKey(kb));
    filled++;
    return kb;
  };
  for (let pos = 0; pos < BAR_POSITIONS; pos++) {
    const row = out.slotKeybinds[pos];
    for (let slot = 0; slot < BAR_SLOTS; slot++) row[slot] = take(layout.bars[pos]?.[slot] ?? '', row[slot]);
  }
  (opts.weaponIds ?? []).forEach((id, i) => {
    if (i < layout.weapons.length) out.weaponKeybinds[id] = take(layout.weapons[i], out.weaponKeybinds[id]);
  });
  for (const [action, code] of Object.entries(layout.actions)) actions[action] = take(code, actions[action]);
  return { data: out, filled };
}

/** True when no bar slot of the profile has a key. */
export function hasNoSlotKeys(data: Pick<BarProfileData, 'slotKeybinds'>): boolean {
  return data.slotKeybinds.every((row) => row.every((kb) => !kb));
}

/** The pristine action bar setup of a first visit: empty bars with the default layout already bound. */
export function defaultActionBarsWithKeys(): ActionBarSetup {
  return snapshotActiveProfile(applyLayout(defaultActionBars(), keybindLayout(DEFAULT_LAYOUT_ID), { overwrite: true }).data);
}

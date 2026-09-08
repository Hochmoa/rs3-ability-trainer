import { isReservedKeybind, keybindKey, parseKeybind } from './keybind.util';
import { ActionBarData, ActionBarSetup, BAR_POSITIONS, BAR_SLOTS, Keybind, defaultActionBars } from './models';

/**
 * A named keyboard layout: one key per slot of the five bar positions (14 each)
 * switches and for the client actions. Codes are KeyboardEvent.code with optional "Ctrl+" / "Shift+" / "Alt+".
 */
export interface KeybindLayout {
  id: string;
  name: string;
  description: string;
  /** [position][slot] – '' leaves the slot without a key */
  bars: string[][];
    actions: Record<string, string>;
}

const DIGIT_ROW = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'BracketLeft', 'BracketRight'];
const shifted = (codes: string[]) => codes.map((c) => 'Shift+' + c);

export const KEYBIND_LAYOUTS: KeybindLayout[] = [
  {
    id: 'rows',
    name: 'Number row + QWERTY',
    description: 'Main bar 1-0 - = [ ], the Q, A and Z rows for additional bars 1-3 (Shift+ fills their last slots), Shift+1-0 on bar 4, Tab for target cycle, ` for the combat dummy.',
    bars: [
      DIGIT_ROW,
      ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'Backslash', ...shifted(['KeyQ', 'KeyW', 'KeyE'])],
      ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', ...shifted(['KeyA', 'KeyS', 'KeyD'])],
      ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', ...shifted(['KeyZ', 'KeyX', 'KeyC', 'KeyV'])],
      shifted(DIGIT_ROW),
    ],
    actions: { 'target-cycle': 'Tab', 'combat-dummy': 'Backquote' },
  },
  {
    id: 'numpad',
    name: 'Numpad + QWER (WASD free)',
    description: 'Main bar on the numpad, the number row and the keys around WASD for the additional bars - W A S D and the arrows stay free for the camera. Tab for target cycle, ` for the combat dummy.',
    bars: [
      ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9', 'Numpad0', 'NumpadDecimal', 'NumpadAdd', 'NumpadSubtract', 'NumpadMultiply'],
      [...DIGIT_ROW.slice(0, 12), 'KeyQ', 'KeyE'],
      ['KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'],
      ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Quote', 'BracketLeft', 'BracketRight', 'Backslash'],
      [...shifted(DIGIT_ROW.slice(0, 12)), 'Shift+KeyQ', 'Shift+KeyE'],
    ],
    actions: { 'target-cycle': 'Tab', 'combat-dummy': 'Backquote' },
  },
  {
    id: 'empty',
    name: 'Custom (empty)',
    description: 'No keys at all - bind every slot yourself, e.g. with "Bind by pressing".',
    bars: Array.from({ length: BAR_POSITIONS }, () => Array(BAR_SLOTS).fill('')),
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

/** Every keybind a layout defines (slots and actions) – for duplicate checks and tests. */
export function layoutKeybinds(l: KeybindLayout): Keybind[] {
  return [...l.bars.flat(), ...Object.values(l.actions)].filter(Boolean).map(parseKeybind);
}

export interface ApplyLayoutOptions {
  /** true = every slot gets the layout key (existing keys are dropped); false = only empty slots are filled, with keys nobody else uses */
  overwrite: boolean;
}

export interface ApplyLayoutResult<T extends ActionBarData> {
  data: T;
  /** number of slot / action keys written */
  filled: number;
}

/**
 * Writes a layout into the keybinds of a bar setup. With `overwrite` everything is replaced, otherwise only empty
 * slots get a key and keys already in use elsewhere are skipped, so a player's own binds survive.
 */
export function applyLayout<T extends ActionBarData>(data: T, layout: KeybindLayout, opts: ApplyLayoutOptions): ApplyLayoutResult<T> {
  const out: T = { ...data, slotKeybinds: data.slotKeybinds.map((row) => [...row]), actionKeybinds: { ...(data.actionKeybinds ?? {}) } };
  const actions = out.actionKeybinds!;
  while (out.slotKeybinds.length < BAR_POSITIONS) out.slotKeybinds.push(Array(BAR_SLOTS).fill(null));
  for (const row of out.slotKeybinds) while (row.length < BAR_SLOTS) row.push(null);
  const used = new Set<string>();
  if (opts.overwrite) {
    out.slotKeybinds = out.slotKeybinds.map((row) => row.map(() => null));
    for (const id of Object.keys(actions)) actions[id] = null;
  } else {
    for (const row of out.slotKeybinds) for (const kb of row) if (kb) used.add(keybindKey(kb));
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
  for (const [action, code] of Object.entries(layout.actions)) actions[action] = take(code, actions[action]);
  return { data: out, filled };
}

/** True when no bar slot of the setup has a key. */
export function hasNoSlotKeys(data: Pick<ActionBarData, 'slotKeybinds'>): boolean {
  return data.slotKeybinds.every((row) => row.every((kb) => !kb));
}

/** The pristine action bar setup of a first visit: empty bars with the default layout already bound. */
export function defaultActionBarsWithKeys(): ActionBarSetup {
  return applyLayout(defaultActionBars(), keybindLayout(DEFAULT_LAYOUT_ID), { overwrite: true }).data;
}

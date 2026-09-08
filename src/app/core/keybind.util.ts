import { ActionBarSetup, BAR_POSITIONS, Keybind, SPEC_KEY, entityKey } from './models';

const MODIFIER_CODES = new Set([
  'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight',
]);

/**
 * Extra mouse buttons as keybind codes: MouseEvent.button 1 (middle), 3 (back / "mouse 4") and 4 (forward / "mouse 5").
 * Left and right stay the UI's; the codes live next to the KeyboardEvent codes in the same Keybind shape.
 */
const MOUSE_CODES: Record<number, string> = { 1: 'Mouse3', 3: 'Mouse4', 4: 'Mouse5' };

const CODE_LABELS: Record<string, string> = {
  Mouse3: 'M3', Mouse4: 'M4', Mouse5: 'M5',
  Space: 'Space', Enter: 'Enter', Tab: 'Tab', Escape: 'Esc', Backspace: 'Backspace', Delete: 'Del',
  Insert: 'Ins', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'",
  Backquote: '`', Comma: ',', Period: '.', Slash: '/', CapsLock: 'Caps',
  NumpadAdd: 'Num +', NumpadSubtract: 'Num -', NumpadMultiply: 'Num *', NumpadDivide: 'Num /',
  NumpadDecimal: 'Num .', NumpadEnter: 'Num Enter',
};

/** Converts a mousedown of an extra mouse button (middle, mouse 4, mouse 5) into a keybind; null for left / right and unknown buttons. */
export function keybindFromMouse(e: MouseEvent): Keybind | null {
  const code = MOUSE_CODES[e.button];
  if (!code) return null;
  return { code, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey };
}

/** true for the mouse-button codes (their default action – browser back / forward, autoscroll – is suppressed while they are bound) */
export function isMouseCode(code: string): boolean {
  return code.startsWith('Mouse');
}

/** Converts a keydown into a keybind, or null if only a modifier was pressed. */
export function keybindFromEvent(e: KeyboardEvent): Keybind | null {
  if (!e.code || MODIFIER_CODES.has(e.code)) return null;
  return { code: e.code, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey };
}

function keyName(code: string): string {
  if (CODE_LABELS[code]) return CODE_LABELS[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  if (/^F\d{1,2}$/.test(code)) return code;
  return code;
}

export function keybindLabel(k: Keybind | null | undefined): string {
  if (!k) return '';
  const parts: string[] = [];
  if (k.ctrl) parts.push('c');
  if (k.shift) parts.push('s');
  if (k.alt) parts.push('a');
  parts.push(keyName(k.code));
  return parts.join('+');
}

/** Stable string key for map lookups. */
export function keybindKey(k: Keybind): string {
  return (k.ctrl ? 'C' : '') + (k.shift ? 'S' : '') + (k.alt ? 'A' : '') + ':' + k.code;
}

/**
 * Combos the browser handles before the page sees them (Chrome/Firefox/Edge): closing or opening tabs and windows,
 * tab switching, reload, fullscreen, developer tools. Layouts never use them and the wizard refuses them.
 */
const RESERVED = new Set<string>([
  ':F5', ':F11', ':F12', 'C:F5', 'CS:F5', 'S:F5', 'CS:KeyI', 'CS:KeyJ', 'CS:KeyC', 'C:KeyU', 'CS:Delete',
  'C:KeyW', 'C:KeyT', 'C:KeyN', 'C:KeyQ', 'C:KeyR', 'C:KeyL', 'C:KeyD', 'C:KeyH', 'C:KeyJ', 'C:KeyP', 'C:KeyS', 'C:KeyO', 'C:KeyF', 'C:KeyG',
  'CS:KeyW', 'CS:KeyT', 'CS:KeyN', 'CS:KeyQ', 'CS:KeyR', 'C:Tab', 'CS:Tab', 'C:PageUp', 'C:PageDown', 'C:F4',
  'C:Digit1', 'C:Digit2', 'C:Digit3', 'C:Digit4', 'C:Digit5', 'C:Digit6', 'C:Digit7', 'C:Digit8', 'C:Digit9',
  'A:Digit1', 'A:Digit2', 'A:Digit3', 'A:Digit4', 'A:Digit5', 'A:Digit6', 'A:Digit7', 'A:Digit8', 'A:Digit9',
  'A:F4', 'A:Space', 'A:KeyD', 'A:Home', 'A:ArrowLeft', 'A:ArrowRight',
  // used by the app itself while binding (skip / clear)
  ':Escape', ':Backspace',
]);

/** True for combos the browser keeps for itself (Ctrl+W, Ctrl+T, F5, Alt+F4 …) or the app uses while binding (Esc, Backspace). */
export function isReservedKeybind(k: Keybind): boolean {
  return RESERVED.has(keybindKey(k));
}

/** "Shift+KeyQ", "Ctrl+Alt+Digit1", "F1" → Keybind (modifier names are case-insensitive, the code is a KeyboardEvent.code). */
export function parseKeybind(text: string): Keybind {
  const parts = text.split('+').map((p) => p.trim()).filter(Boolean);
  const code = parts.pop() ?? '';
  const mods = parts.map((p) => p.toLowerCase());
  return { code, ctrl: mods.includes('ctrl'), shift: mods.includes('shift'), alt: mods.includes('alt') };
}

/** what a key press means for the bars: a weapon switch, a client action, or a bar slot */
export type PressTarget = { kind: 'weapon'; id: string } | { kind: 'action'; id: string } | { kind: 'slot'; pos: number; slot: number };

/**
 * Resolves a pressed key (`keybindKey` of the keydown) against the bar setup, in the order the Train page and the
 * drill agree on: the switch keys of the carried weapons (`carriedIds`; a bound weapon that is not carried does
 * nothing, like in the game), then the client actions (target cycle …), then the bar slots top to bottom,
 * left to right. Null = the key is bound to nothing.
 */
export function resolvePress(setup: ActionBarSetup, key: string, carriedIds: Iterable<string>): PressTarget | null {
  for (const id of carriedIds) {
    const wk = setup.weaponKeybinds[id];
    if (wk && keybindKey(wk) === key) return { kind: 'weapon', id };
  }
  for (const [id, ak] of Object.entries(setup.actionKeybinds ?? {})) {
    if (ak && keybindKey(ak) === key) return { kind: 'action', id };
  }
  for (let pos = 0; pos < BAR_POSITIONS; pos++) {
    const row = setup.slotKeybinds[pos] ?? [];
    for (let slot = 0; slot < row.length; slot++) {
      const skb = row[slot];
      if (skb && keybindKey(skb) === key) return { kind: 'slot', pos, slot };
    }
  }
  return null;
}

/**
 * Entity key → the key of the first bar slot holding that entity, over the five positions as they show for no
 * style (the Rotations page prints it on the tiles). A weapon special attack slot maps to SPEC_KEY.
 */
export function slotKeybinds(setup: ActionBarSetup): Map<string, Keybind> {
  const out = new Map<string, Keybind>();
  setup.positions.forEach((presetId, pos) => {
    const preset = presetId === null ? undefined : setup.presets.find((p) => p.id === presetId);
    preset?.slots.forEach((slot, i) => {
      const kb = setup.slotKeybinds[pos]?.[i];
      if (!slot || !kb || slot.kind === 'note') return;
      const key = slot.kind === 'spec' ? SPEC_KEY : entityKey(slot.kind, slot.id);
      if (!out.has(key)) out.set(key, kb);
    });
  });
  return out;
}

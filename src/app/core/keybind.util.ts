import { Keybind } from './models';

const MODIFIER_CODES = new Set([
  'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight',
]);

const CODE_LABELS: Record<string, string> = {
  Space: 'Space', Enter: 'Enter', Tab: 'Tab', Escape: 'Esc', Backspace: 'Backspace', Delete: 'Del',
  Insert: 'Ins', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'",
  Backquote: '`', Comma: ',', Period: '.', Slash: '/', CapsLock: 'Caps',
  NumpadAdd: 'Num +', NumpadSubtract: 'Num -', NumpadMultiply: 'Num *', NumpadDivide: 'Num /',
  NumpadDecimal: 'Num .', NumpadEnter: 'Num Enter',
};

/** Converts a keydown into a keybind, or null if only a modifier was pressed. */
export function keybindFromEvent(e: KeyboardEvent): Keybind | null {
  if (!e.code || MODIFIER_CODES.has(e.code)) return null;
  return { code: e.code, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey };
}

export function keyName(code: string): string {
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

export function keybindEquals(a: Keybind | null | undefined, b: Keybind | null | undefined): boolean {
  return !!a && !!b && keybindKey(a) === keybindKey(b);
}

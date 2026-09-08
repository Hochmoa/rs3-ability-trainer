import { describe, expect, it } from 'vitest';
import { isMouseCode, keybindFromMouse, keybindKey, keybindLabel, parseKeybind, resolvePress, slotKeybinds } from './keybind.util';
import { ActionBarSetup, SPEC_KEY, defaultActionBars } from './models';

const Q = parseKeybind('KeyQ');
const W = parseKeybind('KeyW');
const ONE = parseKeybind('Digit1');
const CTRL_ONE = parseKeybind('Ctrl+Digit1');
const F1 = parseKeybind('F1');

/** a setup with Q on main bar slot 0, Ctrl+1 on bar 2 slot 3 and F1 on target cycle */
function setup(): ActionBarSetup {
  const s = defaultActionBars();
  s.slotKeybinds[0][0] = Q;
  s.slotKeybinds[1][3] = CTRL_ONE;
  s.actionKeybinds = { 'target-cycle': F1 };
  return s;
}

describe('resolvePress – one key resolution for the Train page and the drill', () => {
  it('finds bar slots by position + slot, with modifiers telling keys apart', () => {
    expect(resolvePress(setup(), keybindKey(Q))).toEqual({ kind: 'slot', pos: 0, slot: 0 });
    expect(resolvePress(setup(), keybindKey(CTRL_ONE))).toEqual({ kind: 'slot', pos: 1, slot: 3 });
    expect(resolvePress(setup(), keybindKey(ONE))).toBeNull(); // the plain 1 is bound to nothing
  });

  it('client actions come before the bars', () => {
    const s = setup();
    s.slotKeybinds[4][13] = F1;
    expect(resolvePress(s, keybindKey(F1))).toEqual({ kind: 'action', id: 'target-cycle' });
  });

  it('an unbound key resolves to null, so the caller can treat it as a wrong press', () => {
    expect(resolvePress(setup(), keybindKey(parseKeybind('KeyZ')))).toBeNull();
  });

  it('tolerates a setup without action keybinds or with short keybind rows (older builds)', () => {
    const s = setup();
    delete s.actionKeybinds;
    s.slotKeybinds = [[Q]];
    expect(resolvePress(s, keybindKey(Q))).toEqual({ kind: 'slot', pos: 0, slot: 0 });
    expect(resolvePress(s, keybindKey(F1))).toBeNull();
  });
});

describe('extra mouse buttons as keybinds', () => {
  const ev = (button: number, mods: Partial<MouseEvent> = {}) => ({ button, ctrlKey: false, shiftKey: false, altKey: false, ...mods }) as MouseEvent;

  it('middle, back and forward become Mouse3 / Mouse4 / Mouse5, left and right stay clicks', () => {
    expect(keybindFromMouse(ev(3))).toEqual({ code: 'Mouse4', ctrl: false, shift: false, alt: false });
    expect(keybindFromMouse(ev(4, { shiftKey: true }))).toEqual({ code: 'Mouse5', ctrl: false, shift: true, alt: false });
    expect(keybindFromMouse(ev(1))).toEqual({ code: 'Mouse3', ctrl: false, shift: false, alt: false });
    expect(keybindFromMouse(ev(0))).toBeNull();
    expect(keybindFromMouse(ev(2))).toBeNull();
  });

  it('labels, keys and layouts treat them like any other code', () => {
    expect(keybindLabel(parseKeybind('Mouse4'))).toBe('M4');
    expect(keybindLabel(parseKeybind('Shift+Mouse5'))).toBe('s+M5');
    expect(keybindKey(parseKeybind('Ctrl+Mouse4'))).toBe('C:Mouse4');
    expect(isMouseCode('Mouse4')).toBe(true);
    expect(isMouseCode('KeyM')).toBe(false);
    const s = setup();
    s.slotKeybinds[0][1] = parseKeybind('Mouse5');
    expect(resolvePress(s, keybindKey(parseKeybind('Mouse5')))).toEqual({ kind: 'slot', pos: 0, slot: 1 });
  });
});

describe('slotKeybinds – entity key → the key of its bar slot (the Rotations page prints it on the tiles)', () => {
  it('walks the five positions as shown for no style; the first slot holding an entity wins, notes and empty slots are skipped', () => {
    const s = defaultActionBars();
    s.presets[0].slots[0] = { kind: 'ability', id: 'sever' };
    s.presets[0].slots[1] = { kind: 'spec', id: 'devour' };
    s.presets[0].slots[2] = { kind: 'note', id: '', note: 'x' };
    s.presets[1].slots[0] = { kind: 'ability', id: 'sever' }; // a second copy on bar 2 – the main bar's key counts
    s.slotKeybinds[1][0] = { code: 'KeyQ', ctrl: false, shift: false, alt: false };
    const keys = slotKeybinds(s);
    expect(keys.get('ability:sever')?.code).toBe('Digit1');
    expect(keys.get(SPEC_KEY)?.code).toBe('Digit2');
    expect(keys.size).toBe(2);
  });

  it('a slot without a key gives nothing, a position without a preset is skipped', () => {
    const s = defaultActionBars();
    s.presets[1].slots[0] = { kind: 'prayer', id: 'turmoil' }; // bar 2 has no keys by default
    s.positions[2] = null;
    expect(slotKeybinds(s).has('prayer:turmoil')).toBe(false);
  });
});

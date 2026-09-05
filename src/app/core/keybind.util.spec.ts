import { describe, expect, it } from 'vitest';
import { keybindKey, parseKeybind, resolvePress } from './keybind.util';
import { ActionBarSetup, defaultActionBars } from './models';

const Q = parseKeybind('KeyQ');
const W = parseKeybind('KeyW');
const ONE = parseKeybind('Digit1');
const CTRL_ONE = parseKeybind('Ctrl+Digit1');
const F1 = parseKeybind('F1');

/** a setup with Q on main bar slot 0, Ctrl+1 on bar 2 slot 3, 1 on the "sword" switch, W on "bow" and F1 on target cycle */
function setup(): ActionBarSetup {
  const s = defaultActionBars();
  s.slotKeybinds[0][0] = Q;
  s.slotKeybinds[1][3] = CTRL_ONE;
  s.weaponKeybinds = { sword: ONE, bow: W };
  s.actionKeybinds = { 'target-cycle': F1 };
  return s;
}

describe('resolvePress – one key resolution for the Train page and the drill', () => {
  it('finds bar slots by position + slot, with modifiers telling keys apart', () => {
    expect(resolvePress(setup(), keybindKey(Q), [])).toEqual({ kind: 'slot', pos: 0, slot: 0 });
    expect(resolvePress(setup(), keybindKey(CTRL_ONE), [])).toEqual({ kind: 'slot', pos: 1, slot: 3 });
    expect(resolvePress(setup(), keybindKey(ONE), [])).toBeNull(); // the plain 1 is only a weapon key, and no weapon is carried
  });

  it('a carried weapon wins over a bar slot with the same key; a bound weapon that is not carried does nothing', () => {
    const s = setup();
    s.slotKeybinds[2][0] = W;
    expect(resolvePress(s, keybindKey(W), ['sword', 'bow'])).toEqual({ kind: 'weapon', id: 'bow' });
    expect(resolvePress(s, keybindKey(W), ['sword'])).toEqual({ kind: 'slot', pos: 2, slot: 0 });
    expect(resolvePress(s, keybindKey(ONE), ['sword'])).toEqual({ kind: 'weapon', id: 'sword' });
  });

  it('client actions come after the weapons and before the bars', () => {
    const s = setup();
    s.slotKeybinds[4][13] = F1;
    expect(resolvePress(s, keybindKey(F1), [])).toEqual({ kind: 'action', id: 'target-cycle' });
    s.weaponKeybinds['sword'] = F1;
    expect(resolvePress(s, keybindKey(F1), ['sword'])).toEqual({ kind: 'weapon', id: 'sword' });
  });

  it('an unbound key resolves to null, so the caller can treat it as a wrong press', () => {
    expect(resolvePress(setup(), keybindKey(parseKeybind('KeyZ')), ['sword'])).toBeNull();
  });

  it('tolerates a setup without action keybinds or with short keybind rows (older builds)', () => {
    const s = setup();
    delete s.actionKeybinds;
    s.slotKeybinds = [[Q]];
    expect(resolvePress(s, keybindKey(Q), [])).toEqual({ kind: 'slot', pos: 0, slot: 0 });
    expect(resolvePress(s, keybindKey(F1), [])).toBeNull();
  });
});

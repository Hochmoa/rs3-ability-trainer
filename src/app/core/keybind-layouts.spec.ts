import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT_ID, KEYBIND_LAYOUTS, applyLayout, defaultActionBarsWithKeys, hasNoSlotKeys, keybindLayout, layoutKeybinds } from './keybind-layouts';
import { isReservedKeybind, keybindKey, parseKeybind } from './keybind.util';
import { BAR_POSITIONS, BAR_SLOTS, defaultActionBars, profileData } from './models';

describe('keybind layouts', () => {
  const filled = KEYBIND_LAYOUTS.filter((l) => l.id !== 'empty');

  it('has a default, a WASD-free and an empty layout', () => {
    expect(KEYBIND_LAYOUTS.map((l) => l.id)).toEqual(['rows', 'numpad', 'empty']);
    expect(keybindLayout(undefined).id).toBe(DEFAULT_LAYOUT_ID);
    expect(keybindLayout('nope').id).toBe(DEFAULT_LAYOUT_ID);
  });

  it.each(filled.map((l) => [l.name, l] as const))('%s: 5 bars with 14 keys each, 4 weapon keys', (_, l) => {
    expect(l.bars.length).toBe(BAR_POSITIONS);
    for (const bar of l.bars) {
      expect(bar.length).toBe(BAR_SLOTS);
      for (const code of bar) expect(code).not.toBe('');
    }
    expect(l.weapons.length).toBe(4);
  });

  it.each(filled.map((l) => [l.name, l] as const))('%s: no key twice (slots, weapons, actions)', (_, l) => {
    const keys = layoutKeybinds(l).map(keybindKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(filled.map((l) => [l.name, l] as const))('%s: no browser-reserved combos', (_, l) => {
    for (const kb of layoutKeybinds(l)) expect(isReservedKeybind(kb), keybindKey(kb)).toBe(false);
  });

  it('the WASD-free layout leaves W A S D and the arrows alone', () => {
    const codes = layoutKeybinds(keybindLayout('numpad')).map((k) => k.code);
    for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) expect(codes).not.toContain(c);
  });

  it('the empty layout defines nothing', () => {
    expect(layoutKeybinds(keybindLayout('empty'))).toEqual([]);
  });
});

describe('reserved keybinds', () => {
  it('flags the combos the browser keeps and the wizard keys', () => {
    for (const s of ['Ctrl+KeyW', 'Ctrl+KeyT', 'F5', 'F11', 'F12', 'Alt+F4', 'Ctrl+Digit1', 'Ctrl+Tab', 'Escape', 'Backspace']) expect(isReservedKeybind(parseKeybind(s)), s).toBe(true);
    for (const s of ['KeyW', 'Shift+KeyW', 'Digit1', 'Shift+Digit1', 'F1', 'Tab', 'Numpad5', 'Ctrl+Shift+Digit1']) expect(isReservedKeybind(parseKeybind(s)), s).toBe(false);
  });

  it('parseKeybind reads modifiers in any order and case', () => {
    expect(parseKeybind('shift+ctrl+KeyQ')).toEqual({ code: 'KeyQ', ctrl: true, shift: true, alt: false });
    expect(parseKeybind('F1')).toEqual({ code: 'F1', ctrl: false, shift: false, alt: false });
  });
});

describe('applyLayout', () => {
  it('overwrite fills every slot of every bar, the weapons in order and the actions', () => {
    const { data, filled } = applyLayout(profileData(defaultActionBars()), keybindLayout('rows'), { overwrite: true, weaponIds: ['a', 'b'] });
    expect(data.slotKeybinds.length).toBe(BAR_POSITIONS);
    for (const row of data.slotKeybinds) expect(row.filter(Boolean).length).toBe(BAR_SLOTS);
    expect(data.slotKeybinds[0][0]).toEqual({ code: 'Digit1', ctrl: false, shift: false, alt: false });
    expect(data.slotKeybinds[1][0]).toEqual({ code: 'KeyQ', ctrl: false, shift: false, alt: false });
    expect(data.slotKeybinds[4][0]).toEqual({ code: 'Digit1', ctrl: false, shift: true, alt: false });
    expect(data.weaponKeybinds['a']?.code).toBe('F1');
    expect(data.weaponKeybinds['b']?.code).toBe('F2');
    expect(data.actionKeybinds?.['target-cycle']?.code).toBe('Tab');
    expect(filled).toBe(BAR_POSITIONS * BAR_SLOTS + 2 + 1);
  });

  it('overwrite drops keys the layout does not set (empty layout clears everything)', () => {
    const base = applyLayout(profileData(defaultActionBars()), keybindLayout('rows'), { overwrite: true, weaponIds: ['a'] }).data;
    const { data, filled } = applyLayout(base, keybindLayout('empty'), { overwrite: true });
    expect(filled).toBe(0);
    expect(hasNoSlotKeys(data)).toBe(true);
    expect(data.weaponKeybinds['a']).toBeNull();
    expect(data.actionKeybinds?.['target-cycle']).toBeNull();
  });

  it('without overwrite the player\'s keys stay and their layout keys are not handed out twice', () => {
    const base = profileData(defaultActionBars());
    // the player put Q on main bar slot 1 and left the rest empty
    base.slotKeybinds = base.slotKeybinds.map((row) => row.map(() => null));
    base.slotKeybinds[0][0] = { code: 'KeyQ', ctrl: false, shift: false, alt: false };
    const { data, filled } = applyLayout(base, keybindLayout('rows'), { overwrite: false });
    expect(data.slotKeybinds[0][0]?.code).toBe('KeyQ');
    expect(data.slotKeybinds[1][0]).toBeNull(); // Q is taken, so the first slot of bar 2 stays empty
    expect(data.slotKeybinds[1][1]?.code).toBe('KeyW');
    expect(filled).toBe(BAR_POSITIONS * BAR_SLOTS - 2 + 1); // 70 slots - the player's slot - the skipped Q + target cycle
    expect(base.slotKeybinds[1][1]).toBeNull(); // input untouched
  });

  it('a fresh setup with keys mirrors them into the Default profile', () => {
    const s = defaultActionBarsWithKeys();
    expect(hasNoSlotKeys(s)).toBe(false);
    expect(s.profiles![0].slotKeybinds[1][0]?.code).toBe('KeyQ');
    expect(s.profiles![0].slotKeybinds[3][13]).toEqual({ code: 'KeyV', ctrl: false, shift: true, alt: false });
  });
});

import { describe, expect, it } from 'vitest';
import { placeOnBars } from './bar-place';
import { keybindLayout } from './keybind-layouts';
import { keybindKey } from './keybind.util';
import { BAR_SLOTS, defaultActionBars } from './models';

const rows = keybindLayout('rows');
const code = (kb: { code: string } | null | undefined) => kb?.code ?? null;

describe('placeOnBars', () => {
  it('puts abilities on the first free slots of the main bar and keeps the keys the slots already have', () => {
    const r = placeOnBars(defaultActionBars(), 'Necromancy', ['ability:soul-sap', 'prayer:sorrow', 'special:vulnerability-bomb'], rows);
    const main = r.setup.presets.find((p) => p.id === r.setup.positions[0])!;
    expect(main.slots.slice(0, 3)).toEqual([{ kind: 'ability', id: 'soul-sap' }, { kind: 'prayer', id: 'sorrow' }, { kind: 'special', id: 'vulnerability-bomb' }]);
    expect(code(r.setup.slotKeybinds[0][0])).toBe('Digit1');
    expect(r.placed).toEqual(['ability:soul-sap', 'prayer:sorrow', 'special:vulnerability-bomb']);
    expect(r.left).toEqual([]);
    expect(r.filled).toBe(0);
  });

  it('fills a key from the layout only where the slot has none, skipping keys already in use', () => {
    const setup = defaultActionBars();
    setup.slotKeybinds[0] = setup.slotKeybinds[0].map(() => null);
    setup.slotKeybinds[1][0] = { code: 'Digit1', ctrl: false, shift: false, alt: false };
    const r = placeOnBars(setup, 'Melee', ['ability:sever', 'ability:slice'], rows);
    expect(code(r.setup.slotKeybinds[0][0])).toBeNull(); // Digit1 belongs to bar 1 slot 0
    expect(code(r.setup.slotKeybinds[0][1])).toBe('Digit2');
    expect(r.filled).toBe(1);
  });

  it('spills onto the next bar when the main bar is full and gives an empty position an unused preset', () => {
    const setup = defaultActionBars();
    const main = setup.presets.find((p) => p.id === setup.positions[0])!;
    for (let i = 0; i < BAR_SLOTS; i++) main.slots[i] = { kind: 'ability', id: 'x' + i };
    setup.positions[1] = null;
    const r = placeOnBars(setup, 'Magic', ['ability:wrack'], rows);
    const pos1 = r.setup.positions[1];
    expect(pos1).not.toBeNull();
    expect(setup.positions.includes(pos1)).toBe(false);
    const bar = r.setup.presets.find((p) => p.id === pos1)!;
    expect(bar.slots[0]).toEqual({ kind: 'ability', id: 'wrack' });
    expect(code(r.setup.slotKeybinds[1][0])).toBe('KeyQ');
  });

  it('uses the bars bound to the style, not the default positions', () => {
    const setup = defaultActionBars();
    setup.bindings.Ranged[0] = 7;
    const r = placeOnBars(setup, 'Ranged', ['ability:piercing-shot'], rows);
    expect(r.setup.presets.find((p) => p.id === 7)!.slots[0]).toEqual({ kind: 'ability', id: 'piercing-shot' });
    expect(r.setup.presets.find((p) => p.id === 1)!.slots[0]).toBeNull();
  });

  it('maps specs to the one generic special-attack slot, weapons to weapon keys and actions to their layout key', () => {
    const r = placeOnBars(defaultActionBars(), 'Necromancy', ['spec:death-grasp', 'spec:death-essence', 'weapon:omni-guard', 'weapon:ek-zekkil', 'action:target-cycle'], rows);
    const main = r.setup.presets.find((p) => p.id === r.setup.positions[0])!;
    expect(main.slots[0]).toEqual({ kind: 'ability', id: 'weapon-special-attack' });
    expect(main.slots[1]).toBeNull();
    expect(code(r.setup.weaponKeybinds['omni-guard'])).toBe('F1');
    expect(code(r.setup.weaponKeybinds['ek-zekkil'])).toBe('F2');
    expect(code(r.setup.actionKeybinds!['target-cycle'])).toBe('Tab');
    expect(r.placed).toHaveLength(5);
    expect(r.filled).toBe(3);
  });

  it('only adds a key to a slot that already holds the ability, and reports what does not fit', () => {
    const setup = defaultActionBars();
    for (const p of setup.presets) for (let i = 0; i < BAR_SLOTS; i++) p.slots[i] = { kind: 'ability', id: 'x' + p.id + '-' + i };
    setup.presets[0].slots[13] = { kind: 'ability', id: 'bloat' };
    const r = placeOnBars(setup, 'Necromancy', ['ability:bloat', 'ability:soul-sap'], rows);
    expect(r.placed).toEqual(['ability:bloat']);
    expect(r.left).toEqual(['ability:soul-sap']);
    expect(code(r.setup.slotKeybinds[0][13])).toBe('BracketRight');
    expect(new Set(r.setup.slotKeybinds.flat().filter(Boolean).map((kb) => keybindKey(kb!))).size).toBe(r.setup.slotKeybinds.flat().filter(Boolean).length);
  });

  it('does not touch the setup it was given', () => {
    const setup = defaultActionBars();
    const before = JSON.stringify(setup);
    placeOnBars(setup, 'Melee', ['ability:sever', 'weapon:ek-zekkil'], rows);
    expect(JSON.stringify(setup)).toBe(before);
  });
});

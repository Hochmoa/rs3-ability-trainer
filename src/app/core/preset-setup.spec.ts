import { describe, expect, it } from 'vitest';
import { keybindLayout } from './keybind-layouts';
import { BAR_SLOTS, EquipSlot, ItemRef, RotationStep, SPEC_KEY, defaultActionBars } from './models';
import { BossPreset, presetBars, presetLoadout, presetSlotKeys } from './preset-setup';

const preset: BossPreset = {
  id: 'demo-boss-necromancy',
  boss: 'Demo boss, the Tester',
  style: 'Necromancy',
  title: 'Demo t90',
  guide: '',
  presetUrl: null,
  notes: '',
  equipment: { mainHand: { kind: 'weapon', id: 'omni-guard' }, offHand: { kind: 'weapon', id: 'soulbound-lantern' }, head: { kind: 'gear', id: 'hood' } },
  inventory: [{ kind: 'weapon', id: 'ek-zekkil' }, null, { kind: 'special', id: 'vulnerability-bomb' }],
  unknown: [],
  rotations: [{ name: 'Opener', text: '' }],
};

const slotOf = (ref: ItemRef): EquipSlot | null => (ref.id === 'omni-guard' ? 'mainHand' : ref.id === 'soulbound-lantern' ? 'offHand' : ref.id === 'hood' ? 'head' : null);

const step = (kind: RotationStep['kind'], id: string): RotationStep => ({ kind, id });

describe('preset loadout', () => {
  it('re-slots the worn items, keeps the backpack and names the loadout after the preset', () => {
    const l = presetLoadout(preset, slotOf);
    expect(l.name).toBe('Demo t90');
    expect(l.presetId).toBe(preset.id);
    expect(l.equipment?.mainHand?.id).toBe('omni-guard');
    expect(l.equipment?.head?.id).toBe('hood');
    expect(l.inventory[0]?.id).toBe('ek-zekkil');
    expect(l.inventory[1]).toBeNull();
    expect(l.prayerBook).toBe('Curses');
  });
});

describe('preset slot keys', () => {
  it('lists every bar input once, in order; notes, weapon switches and actions are not slots; specs share one slot', () => {
    const keys = presetSlotKeys([
      { steps: [step('ability', 'touch-of-death'), step('note', ''), step('weapon', 'ek-zekkil'), step('spec', 'ezk'), step('ability', 'touch-of-death'), step('action', 'target-cycle'), step('prayer', 'sorrow')] },
      { steps: [step('ability', 'finger-of-death'), step('spec', 'other')] },
    ]);
    expect(keys).toEqual(['ability:touch-of-death', SPEC_KEY, 'prayer:sorrow', 'ability:finger-of-death']);
  });
});

describe('preset bars', () => {
  const keys = Array.from({ length: 20 }, (_, i) => 'ability:a' + i);

  it('puts the abilities on bars 1..n bound to the style and fills the keys from the layout', () => {
    const cur = defaultActionBars();
    cur.slotKeybinds = cur.slotKeybinds.map((row) => row.map(() => null)); // a player without any keys
    const loadout = presetLoadout(preset, slotOf);
    const { setup, barsNeeded, left, filled } = presetBars(preset, keys, cur, keybindLayout('rows'), loadout);
    expect(barsNeeded).toBe(2);
    expect(left).toBe(0);
    expect(setup.presets[0].slots[0]).toEqual({ kind: 'ability', id: 'a0' });
    expect(setup.presets[1].slots[5]).toEqual({ kind: 'ability', id: 'a19' });
    expect(setup.presets[0].name).toBe('Demo boss Necromancy 1');
    expect(setup.bindings.Necromancy.slice(0, 2)).toEqual([setup.presets[0].id, setup.presets[1].id]);
    // every slot of every bar has a key now, the three weapons of the loadout got F1-F3
    for (const row of setup.slotKeybinds) expect(row.filter(Boolean).length).toBe(BAR_SLOTS);
    expect(setup.weaponKeybinds['omni-guard']?.code).toBe('F1');
    expect(setup.weaponKeybinds['soulbound-lantern']?.code).toBe('F2');
    expect(setup.weaponKeybinds['ek-zekkil']?.code).toBe('F3');
    expect(filled).toBe(5 * BAR_SLOTS + 3 + 1);
  });

  it('keeps the player\'s own keys and only fills the rest', () => {
    const cur = defaultActionBars(); // main bar bound 1-0 - =, bars 2-5 empty
    cur.slotKeybinds[0][0] = { code: 'KeyQ', ctrl: false, shift: false, alt: false };
    const { setup, filled } = presetBars(preset, keys, cur, keybindLayout('rows'), presetLoadout(preset, slotOf));
    expect(setup.slotKeybinds[0][0]?.code).toBe('KeyQ');
    expect(setup.slotKeybinds[0][1]?.code).toBe('Digit2');
    expect(setup.slotKeybinds[1][0]).toBeNull(); // Q is the player's
    expect(setup.slotKeybinds[1][1]?.code).toBe('KeyW');
    expect(filled).toBeGreaterThan(0);
    // the source setup is not touched
    expect(cur.slotKeybinds[1][1]).toBeNull();
    expect(cur.presets[0].slots[0]).toBeNull();
  });

  it('reports abilities that do not fit on 5 bars', () => {
    const many = Array.from({ length: 80 }, (_, i) => 'ability:a' + i);
    const { barsNeeded, left } = presetBars(preset, many, defaultActionBars(), keybindLayout('rows'), presetLoadout(preset, slotOf));
    expect(barsNeeded).toBe(5);
    expect(left).toBe(10);
  });
});

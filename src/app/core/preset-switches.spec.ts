import { describe, expect, it } from 'vitest';
import { Loadout, RotationStep, Weapon, WeaponSpec, newLoadout } from './models';
import { SWITCH_HINT, SwitchCatalog, insertSwitches } from './preset-switches';

const weapon = (id: string, style: Weapon['style'], slot: Weapon['slot'], spec: string | null = null): Weapon => ({ id, name: id, style, slot, tier: 90, spec } as unknown as Weapon);
const WEAPONS: Record<string, Weapon> = {
  'dark-shard-of-leng': weapon('dark-shard-of-leng', 'Melee', 'main'),
  'dark-sliver-of-leng': weapon('dark-sliver-of-leng', 'Melee', 'off'),
  'zaros-godsword': weapon('zaros-godsword', 'Melee', '2h', 'blackhole'),
  'bow-of-the-last-guardian': weapon('bow-of-the-last-guardian', 'Ranged', '2h', 'balance-by-force'),
  'seren-godbow': weapon('seren-godbow', 'Ranged', '2h', 'crystal-rain'),
};
const SPECS: Record<string, WeaponSpec> = {
  'crystal-rain': { id: 'crystal-rain', name: 'Crystal Rain', style: 'Ranged', weaponIds: ['seren-godbow'] } as unknown as WeaponSpec,
  blackhole: { id: 'blackhole', name: 'Blackhole', style: 'Melee', weaponIds: ['zaros-godsword'] } as unknown as WeaponSpec,
};
const ABILITIES: Record<string, { style: 'Melee' | 'Ranged' | 'Magic' | 'Necromancy' | 'Constitution'; gcd: boolean }> = {
  assault: { style: 'Melee', gcd: true },
  hurricane: { style: 'Melee', gcd: true },
  'greater-ricochet': { style: 'Ranged', gcd: true },
  surge: { style: 'Constitution', gcd: false },
};
const cat: SwitchCatalog = { weapon: (id) => WEAPONS[id], spec: (id) => SPECS[id], ability: (id) => ABILITIES[id] };

function loadout(main: string | null, off: string | null, two: string | null, backpack: string[], eof: string[] = []): Loadout {
  const l = newLoadout('t');
  l.equipment = {
    mainHand: main ? { kind: 'weapon', id: main } : null,
    offHand: off ? { kind: 'weapon', id: off } : null,
    twoHand: two ? { kind: 'weapon', id: two } : null,
    neck: eof.length ? { kind: 'gear', id: 'essence-of-finality-amulet', spec: eof[0] } : null,
  };
  l.inventory = [...backpack.map((id) => ({ kind: 'weapon' as const, id })), ...eof.slice(1).map((spec) => ({ kind: 'gear' as const, id: 'essence-of-finality-amulet', spec }))];
  return l;
}
const ids = (steps: RotationStep[]) => steps.map((s) => (s.hint === SWITCH_HINT ? '+' : '') + s.id);
const ability = (id: string): RotationStep => ({ kind: 'ability', id });
const spec = (id: string): RotationStep => ({ kind: 'spec', id });

describe('insertSwitches', () => {
  it('switches to the backpack weapons of the style an ability needs, once, and off-GCD utility never switches', () => {
    const l = loadout('dark-shard-of-leng', 'dark-sliver-of-leng', null, ['bow-of-the-last-guardian']);
    const out = insertSwitches([ability('assault'), ability('surge'), ability('greater-ricochet'), ability('greater-ricochet'), ability('assault')], l, cat);
    expect(ids(out)).toEqual(['assault', 'surge', '+bow-of-the-last-guardian', 'greater-ricochet', 'greater-ricochet', '+dark-shard-of-leng', '+dark-sliver-of-leng', 'assault']);
    expect(out[5].sameTick).toBeFalsy();
    expect(out[6].sameTick).toBe(true);
  });

  it('a two-handed ability with dual wield in hand takes the 2h of the style from the backpack', () => {
    const l = loadout('dark-shard-of-leng', 'dark-sliver-of-leng', null, ['zaros-godsword']);
    expect(ids(insertSwitches([ability('assault'), ability('hurricane'), ability('assault')], l, cat))).toEqual(['assault', '+zaros-godsword', 'hurricane', 'assault']);
  });

  it('the special of a backpack weapon gets its weapon; a special stored in an Essence of Finality does not', () => {
    const l = loadout(null, null, 'bow-of-the-last-guardian', ['seren-godbow']);
    expect(ids(insertSwitches([spec('crystal-rain')], l, cat))).toEqual(['+seren-godbow', 'crystal-rain']);
    const stored = loadout(null, null, 'bow-of-the-last-guardian', [], ['crystal-rain']);
    expect(ids(insertSwitches([spec('crystal-rain')], stored, cat))).toEqual(['crystal-rain']);
    const spare = loadout(null, null, 'bow-of-the-last-guardian', [], ['blackhole', 'crystal-rain']);
    expect(ids(insertSwitches([spec('crystal-rain')], spare, cat))).toEqual(['crystal-rain']);
  });

  it('a stored special of another style than the weapons in hand gets a switch to that style first', () => {
    const l = loadout('dark-shard-of-leng', 'dark-sliver-of-leng', null, ['bow-of-the-last-guardian'], ['crystal-rain']);
    expect(ids(insertSwitches([ability('assault'), spec('crystal-rain')], l, cat))).toEqual(['assault', '+bow-of-the-last-guardian', 'crystal-rain']);
  });

  it('a bare Essence of Finality step switches to the style of a stored special when the weapons in hand fit none', () => {
    const l = loadout('dark-shard-of-leng', 'dark-sliver-of-leng', null, ['bow-of-the-last-guardian'], ['crystal-rain']);
    expect(ids(insertSwitches([ability('essence-of-finality')], l, cat))).toEqual(['+bow-of-the-last-guardian', 'essence-of-finality']);
    const fits = loadout('dark-shard-of-leng', 'dark-sliver-of-leng', null, ['bow-of-the-last-guardian'], ['blackhole']);
    expect(ids(insertSwitches([ability('essence-of-finality')], fits, cat))).toEqual(['essence-of-finality']);
  });

  it('a switch the rotation writes itself is kept and counted', () => {
    const l = loadout('dark-shard-of-leng', 'dark-sliver-of-leng', null, ['bow-of-the-last-guardian']);
    const out = insertSwitches([{ kind: 'weapon', id: 'bow-of-the-last-guardian' }, ability('greater-ricochet')], l, cat);
    expect(ids(out)).toEqual(['bow-of-the-last-guardian', 'greater-ricochet']);
  });

  it('without the weapon in the backpack nothing is inserted', () => {
    const l = loadout('dark-shard-of-leng', 'dark-sliver-of-leng', null, []);
    expect(ids(insertSwitches([ability('greater-ricochet')], l, cat))).toEqual(['greater-ricochet']);
  });
});

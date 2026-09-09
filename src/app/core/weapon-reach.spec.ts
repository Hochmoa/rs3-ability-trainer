import { describe, expect, it } from 'vitest';
import { Weapon } from './models';
import { weaponsCanMeet } from './weapon-reach';

const w = (p: Partial<Weapon>): Weapon => ({ id: 'x', name: 'x', slot: 'main', type: null, tier: 90, style: 'Melee', spec: null, role: null } as Weapon);
const MAIN = { ...w({}), id: 'main' };
const OFF = { ...w({}), id: 'off', slot: 'off' as const };
const TWO = { ...w({}), id: 'two', slot: '2h' as const, spec: 'some-spec' };
const SHIELD = { ...w({}), id: 'shield', slot: 'shield' as const, role: 'shield' as const };
const DEFENDER = { ...w({}), id: 'def', slot: 'off' as const, role: 'defender' as const };
const SIPHON = { ...w({}), id: 'siphon', role: 'siphon' as const };
const CONDUIT = { ...w({}), id: 'conduit', slot: 'off' as const, role: 'conduit' as const };

describe('what the carried weapons can meet once wielded', () => {
  it('dual wield needs a main hand and an off-hand weapon somewhere in the loadout', () => {
    expect(weaponsCanMeet('dw', [TWO, MAIN, OFF])).toBe(true);
    expect(weaponsCanMeet('dw', [TWO, MAIN])).toBe(false);
    expect(weaponsCanMeet('dw', [MAIN, SHIELD])).toBe(false);
    expect(weaponsCanMeet('dw', [MAIN, DEFENDER])).toBe(true);
  });

  it('a two-hander, a shield, a defender', () => {
    expect(weaponsCanMeet('2h', [MAIN, OFF, TWO])).toBe(true);
    expect(weaponsCanMeet('2h', [MAIN, OFF])).toBe(false);
    expect(weaponsCanMeet('shield', [MAIN, DEFENDER])).toBe(false);
    expect(weaponsCanMeet('defender-or-shield', [MAIN, DEFENDER])).toBe(true);
    expect(weaponsCanMeet('defender-or-shield', [TWO, SHIELD])).toBe(true);
    expect(weaponsCanMeet('defender-or-shield', [TWO, OFF])).toBe(false);
  });

  it('a conduit wants its siphon, a special attack any weapon that has one', () => {
    expect(weaponsCanMeet('conduit', [SIPHON, CONDUIT])).toBe(true);
    expect(weaponsCanMeet('conduit', [MAIN, CONDUIT])).toBe(false);
    expect(weaponsCanMeet('spec-weapon', [MAIN, TWO])).toBe(true);
    expect(weaponsCanMeet('spec-weapon', [MAIN, OFF])).toBe(false);
    expect(weaponsCanMeet('eof', [])).toBe(true);
  });
});

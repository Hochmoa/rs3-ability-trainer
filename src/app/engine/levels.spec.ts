import { describe, expect, it } from 'vitest';
import { DEFAULT_LEVELS, loadoutLevels } from '../core/models';
import { boostedLevels, damageSkillOf } from './damage';

describe('combat levels', () => {
  it('missing levels are the cap, given ones are clamped', () => {
    expect(loadoutLevels({})).toEqual(DEFAULT_LEVELS);
    expect(loadoutLevels({ levels: { strength: 85, necromancy: 200, magic: -3 } })).toMatchObject({ strength: 85, necromancy: 120, magic: 1, ranged: 99 });
  });

  it('an elder overload boosts the six combat skills, not Constitution or Prayer', () => {
    const b = boostedLevels(loadoutLevels({ levels: { strength: 90 } }), 'elder');
    expect(b).toMatchObject({ strength: 90 + 15 + 5, attack: 120, ranged: 120, magic: 120, necromancy: 120 + 20 + 5, defence: 120, constitution: 99, prayer: 99 });
    expect(boostedLevels(DEFAULT_LEVELS, 'none')).toEqual(DEFAULT_LEVELS);
  });

  it('the damage skill follows the wielded style', () => {
    expect(damageSkillOf('Melee')).toBe('strength');
    expect(damageSkillOf('Ranged')).toBe('ranged');
    expect(damageSkillOf('Magic')).toBe('magic');
    expect(damageSkillOf('Necromancy')).toBe('necromancy');
    expect(damageSkillOf(null)).toBe('strength');
  });
});

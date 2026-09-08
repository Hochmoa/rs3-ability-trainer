import { describe, expect, it } from 'vitest';
import GEAR from '../../../public/data/gear.json';
import WEAPONS from '../../../public/data/weapons.json';
import { AUGMENT_MIN_TIER, gearGizmos, weaponGizmos } from './augment';
import { GearItem, Weapon } from './models';

const weapon = (p: Partial<Weapon>): Pick<Weapon, 'slot' | 'tier' | 'type'> => ({ slot: 'main', tier: 90, type: null, ...p });
const gear = (p: Partial<GearItem>): Pick<GearItem, 'slot' | 'tier' | 'augmentable'> => ({ slot: 'body', tier: 90, augmentable: false, ...p });

describe('augmented items: what they hold', () => {
  it('weapons: one gizmo in a hand, two on a two-hander, an armour gizmo on a shield', () => {
    expect(weaponGizmos(weapon({ slot: 'main' }))).toEqual(['weapon']);
    expect(weaponGizmos(weapon({ slot: 'off' }))).toEqual(['weapon']);
    expect(weaponGizmos(weapon({ slot: '2h' }))).toEqual(['weapon', 'weapon']);
    expect(weaponGizmos(weapon({ slot: 'shield', type: 'Shield' }))).toEqual(['armour']);
    expect(weaponGizmos(weapon({ slot: 'off', type: 'Defender' }))).toEqual(['armour']);
    expect(weaponGizmos(weapon({ slot: '2h', type: 'Shieldbow' }))).toEqual(['weapon', 'armour']);
  });

  it('armour: two armour gizmos on torso and legs, nothing anywhere else', () => {
    expect(gearGizmos(gear({ slot: 'body' }))).toEqual(['armour', 'armour']);
    expect(gearGizmos(gear({ slot: 'legs' }))).toEqual(['armour', 'armour']);
    for (const slot of ['head', 'hands', 'feet', 'cape', 'neck', 'ring', 'ammo', 'pocket'] as const) {
      expect(gearGizmos(gear({ slot })), slot).toEqual([]);
    }
  });

  it('below tier 70 nothing is augmented, unless the wiki page says the piece has an augmented version', () => {
    expect(weaponGizmos(weapon({ tier: AUGMENT_MIN_TIER - 1 }))).toEqual([]);
    expect(gearGizmos(gear({ tier: 60 }))).toEqual([]);
    expect(gearGizmos(gear({ tier: 60, augmentable: true }))).toEqual(['armour', 'armour']);
  });

  it('the real data: every tier 90 weapon and body piece the PvME setups use is augmented', () => {
    const w = (WEAPONS as Weapon[]).find((x) => x.id === 'bow-of-the-last-guardian')!;
    expect(weaponGizmos(w)).toEqual(['weapon', 'weapon']);
    const omni = (WEAPONS as Weapon[]).find((x) => x.id === 'omni-guard')!;
    expect(weaponGizmos(omni)).toEqual(['weapon']);
    // the fetcher never flagged this one as augmentable; the tier rule covers it
    const mw = (GEAR as GearItem[]).find((x) => x.id === 'masterwork-ranged-body')!;
    expect(mw.augmentable).toBe(false);
    expect(gearGizmos(mw)).toEqual(['armour', 'armour']);
    const cape = (GEAR as GearItem[]).find((x) => x.id === 'igneous-kal-zuk')!;
    expect(gearGizmos(cape)).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { Ability, Perk, Prayer, SetEffect, Weapon, WeaponSpec } from './models';
import { isObscureAbility, isObscurePerk, isObscurePrayer, isObscureSetEffect, isObscureSpec, isObscureWeapon } from './obscure';

function weapon(name: string, tier: number, extra: Partial<Weapon> = {}): Weapon {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    style: 'Melee',
    slot: 'main',
    type: null,
    tier,
    tierDamage: tier,
    tierAccuracy: tier,
    speed: null,
    attackStyle: null,
    range: null,
    damage: 0,
    accuracy: 0,
    abilityDamage: null,
    armour: 0,
    lifePoints: 0,
    charges: null,
    spec: null,
    innateMastery: false,
    icon: null,
    role: null,
    ...extra,
  };
}

function prayer(id: string, book: Prayer['book'], level: number): Prayer {
  return { id, name: id, book, level, drainPerHour: null, effect: '', description: '', adrenaline: null, icon: '' };
}

describe('isObscureWeapon', () => {
  it('keeps current boss weapons and their base / +5 smithing versions', () => {
    for (const w of [
      weapon('Omni guard', 95, { style: 'Necromancy', spec: 'death-essence' }),
      weapon('Drygore rapier', 90),
      weapon("Statius's warhammer", 78, { spec: 'obliterate' }),
      weapon('Elder rune longsword + 5', 85),
      weapon('Bane longsword', 75),
      weapon('Death guard (tier 90)', 90, { style: 'Necromancy' }),
      weapon('Sunspear (melee)', 78),
      weapon('Dragon claw', 60, { spec: 'slice-dice' }),
    ]) {
      expect(isObscureWeapon(w), w.name).toBe(false);
    }
  });

  it('hides Daemonheim tiers, tools, cosmetics, variants and intermediate upgrades', () => {
    for (const w of [
      weapon('Primal crossbow Mk. 5', 99, { style: 'Ranged' }),
      weapon('Masterwork staff', 100, { style: 'Magic' }),
      weapon('Crystal hatchet', 70, { spec: 'clobber' }),
      weapon('Dragon harpoon', 60, { spec: 'fishstabber' }),
      weapon('Golden chaotic rapier', 80),
      weapon('Lucky Armadyl godsword', 75),
      weapon('Abyssal whip (blue)', 70),
      weapon('Armadyl godsword (passive)', 75),
      weapon('Chaotic maul (frozen)', 80),
      weapon("Korasi's sword (Dominion Tower)", 70),
      weapon('Bane longsword + 3', 78),
      weapon('Elder rune 2h sword + 4', 84),
      weapon('Rune claws', 50, { spec: 'impale' }),
      weapon('Mindspike (air)', 10, { style: 'Magic', spec: 'rune-flame' }),
    ]) {
      expect(isObscureWeapon(w), w.name).toBe(true);
    }
  });
});

describe('isObscureSpec', () => {
  const byId = new Map<string, Weapon>([
    ['mindspike-air', weapon('Mindspike (air)', 10, { spec: 'rune-flame' })],
    ['dragon-dagger', weapon('Dragon dagger', 60, { spec: 'draconic-puncture' })],
    ['superior-dragon-dagger', weapon('Superior dragon dagger', 70, { spec: 'draconic-puncture' })],
  ]);
  const spec = (id: string, weaponIds: string[]): WeaponSpec =>
    ({ id, name: id, page: '', style: 'Melee', target: '', weapons: weaponIds, weaponIds, adrenaline: 50, cooldownTicks: 0, ignoresGcd: false, channelled: false, damageText: '', damageMin: null, damageMax: null, durationTicks: null, description: '', buffs: [], weaponIcons: [], eof: { storable: true }, members: true }) as unknown as WeaponSpec;

  it('is obscure only when all of its weapons are', () => {
    expect(isObscureSpec(spec('rune-flame', ['mindspike-air']), byId)).toBe(true);
    expect(isObscureSpec(spec('draconic-puncture', ['dragon-dagger', 'superior-dragon-dagger']), byId)).toBe(false);
    expect(isObscureSpec(spec('unknown', ['not-in-data']), byId)).toBe(false);
  });
});

describe('isObscurePrayer', () => {
  it('standard book: hides everything below level 36 plus Smite', () => {
    expect(isObscurePrayer(prayer('thick-skin', 'Prayers', 1))).toBe(true);
    expect(isObscurePrayer(prayer('incredible-reflexes', 'Prayers', 34))).toBe(true);
    expect(isObscurePrayer(prayer('protect-from-summoning', 'Prayers', 35))).toBe(true);
    expect(isObscurePrayer(prayer('protect-from-magic', 'Prayers', 37))).toBe(false);
    expect(isObscurePrayer(prayer('eagle-eye', 'Prayers', 44))).toBe(false);
    expect(isObscurePrayer(prayer('smite', 'Prayers', 52))).toBe(true);
    expect(isObscurePrayer(prayer('piety', 'Prayers', 70))).toBe(false);
  });

  it('curses: hides saps, leeches and the utility curses, keeps deflects, forms, Soul Split and the T95/T99 curses', () => {
    expect(isObscurePrayer(prayer('sap-melee-attack', 'Curses', 50))).toBe(true);
    expect(isObscurePrayer(prayer('berserker', 'Curses', 59))).toBe(true);
    expect(isObscurePrayer(prayer('deflect-summoning', 'Curses', 62))).toBe(true);
    expect(isObscurePrayer(prayer('deflect-magic', 'Curses', 65))).toBe(false);
    expect(isObscurePrayer(prayer('leech-melee-strength', 'Curses', 82))).toBe(true);
    expect(isObscurePrayer(prayer('dark-form', 'Curses', 80))).toBe(false);
    expect(isObscurePrayer(prayer('superheat-form', 'Curses', 91))).toBe(true);
    expect(isObscurePrayer(prayer('soul-split', 'Curses', 92))).toBe(false);
    expect(isObscurePrayer(prayer('ruination', 'Curses', 99))).toBe(false);
  });
});

describe('abilities, sets, perks', () => {
  const ability = (id: string) => ({ id }) as Ability;
  it('hides skilling abilities and unused ultimates, keeps slayer abilities and everything else', () => {
    expect(isObscureAbility(ability('demon-slayer'))).toBe(false);
    expect(isObscureAbility(ability('transfigure'))).toBe(false);
    expect(isObscureAbility(ability('kuradal-s-favour'))).toBe(true);
    expect(isObscureAbility(ability('ice-asylum'))).toBe(true);
    expect(isObscureAbility(ability('ingenuity-of-the-humans'))).toBe(false);
    expect(isObscureAbility(ability('death-skulls'))).toBe(false);
  });

  it('hides warpriest / void sets and non-combat perks', () => {
    expect(isObscureSetEffect({ id: 'void-knight' } as SetEffect)).toBe(true);
    expect(isObscureSetEffect({ id: 'cryptbloom' } as SetEffect)).toBe(false);
    expect(isObscurePerk({ id: 'wise', class: 'none' } as Perk)).toBe(true);
    expect(isObscurePerk({ id: 'precise', class: 'damage' } as Perk)).toBe(false);
  });
});

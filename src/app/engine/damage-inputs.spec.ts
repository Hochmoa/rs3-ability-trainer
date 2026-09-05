/**
 * Every input of the ability damage number, pinned to runescape.wiki (Ability damage, Damage bonus, Power armour, Critical
 * strike, Life points, the prayer pages): weapon tier part, the boosted level of the style's damage skill, the gear's damage
 * bonus, prayer boosts, critical strike damage by level and the maximum life points – resolved from the real data files.
 */
import { describe, expect, it } from 'vitest';
import GEAR from '../../../public/data/gear.json';
import PERKS from '../../../public/data/perks.json';
import PRAYERS from '../../../public/data/prayers.json';
import SETS from '../../../public/data/set-effects.json';
import SPECS from '../../../public/data/specs.json';
import WEAPONS from '../../../public/data/weapons.json';
import { DEFAULT_LEVELS, EquipSlot, GearItem, ItemRef, Loadout, Perk, Prayer, SetEffect, Weapon, WeaponSpec, newLoadout, weaponSlot } from '../core/models';
import { AMULET_OF_ZEALOTS_ADD, LEECH_RAMP_TICKS, PRAYER_DAMAGE, abilityDamageOf, baseLifePoints, critMultiplier, damageBonusOf, fortitudeLifePoints, levelPart, prayerDamagePct } from './damage';
import { defaultResolvedLoadout } from './loadout-resolved';
import { LoadoutData, resolveLoadout } from './loadout-resolver';
import { EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const GEAR_DATA = GEAR as unknown as GearItem[];
const WEAPON_DATA = WEAPONS as unknown as Weapon[];
const PRAYER_DATA = PRAYERS as unknown as Prayer[];

const DATA: LoadoutData = {
  weaponById: new Map(WEAPON_DATA.map((w) => [w.id, w])),
  specById: new Map((SPECS as unknown as WeaponSpec[]).map((s) => [s.id, s])),
  perkById: new Map((PERKS as unknown as Perk[]).map((p) => [p.id, p])),
  setEffectById: new Map((SETS as unknown as SetEffect[]).map((s) => [s.id, s])),
  gearById: new Map(GEAR_DATA.map((g) => [g.id, g])),
  specEntity: (s) => ({ key: 'spec:' + s.id, kind: 'spec', id: s.id, name: s.name, icon: '', gcd: true, style: s.style, abilityType: 'Special', adrenaline: 0, cooldownTicks: 0, buffs: [] }),
};

function weapon(id: string): Weapon {
  const w = DATA.weaponById.get(id);
  if (!w) throw new Error('unknown weapon ' + id);
  return w;
}

function gear(id: string): GearItem {
  const g = DATA.gearById!.get(id);
  if (!g) throw new Error('unknown gear ' + id);
  return g;
}

/** a level-99 loadout without overload wearing the given weapons.json / gear.json ids */
function wear(opts: { weapons?: string[]; gear?: string[]; levels?: Partial<Loadout['levels']>; overload?: Loadout['overload'] }): Loadout {
  const l = newLoadout('damage inputs');
  l.overload = opts.overload ?? 'none';
  l.weaponPoison = 0;
  l.levels = opts.levels ?? {};
  const eq = l.equipment as Record<string, ItemRef>;
  for (const id of opts.weapons ?? []) eq[weaponSlot(weapon(id))] = { kind: 'weapon', id };
  for (const id of opts.gear ?? []) eq[gear(id).slot as EquipSlot] = { kind: 'gear', id };
  return l;
}

function resolve(opts: Parameters<typeof wear>[0]) {
  return resolveLoadout(wear(opts), DATA);
}

/** tier-t power armour piece without wiki bonus fields, for the tier fallback */
function powerPiece(slot: GearItem['slot'], tier: number, damageTier: number | null = null): GearItem {
  return { id: 'p-' + slot, name: 'p', slot, style: 'Melee', tier, type: 'Power armour', armour: 0, lifePoints: 0, prayer: 0, set: null, passive: null, augmentable: false, icon: null, bonus: null, damageTier };
}

describe('weapon part and level part (runescape.wiki/w/Ability_damage)', () => {
  it('level part ⌊2.5·f⌋: 264 at 99, 310 at 120, 362 at 145 (120 + elder overload)', () => {
    expect(levelPart(99)).toBe(264);
    expect(levelPart(120)).toBe(310);
    expect(levelPart(145)).toBe(362);
  });

  it('tier-90 two-hander and tier-90 dual wield give the same 1692 at level 99 (b = 0); a shield adds nothing', () => {
    const scythe = weapon('noxious-scythe');
    expect(scythe.abilityDamage).toBe(1296); // 14.4 × 90
    expect(abilityDamageOf(null, null, scythe, 99)).toBe(264 + 132 + 1296);
    const mh = weapon('drygore-rapier');
    const oh = weapon('off-hand-drygore-rapier');
    expect([mh.abilityDamage, oh.abilityDamage]).toEqual([864, 432]); // 9.6 × 90, half of it
    expect(abilityDamageOf(mh, oh, null, 99)).toBe(264 + 864 + Math.floor(0.5 * (264 + 864)));
    expect(abilityDamageOf(mh, oh, null, 99)).toBe(1692);
    expect(abilityDamageOf(mh, weapon('merciless-kiteshield'), null, 99)).toBe(1128);
    // weapon speed is not an input: the fastest seismic wand (speed 4) equals the average drygore rapier (speed 5) at tier 90
    expect(weapon('seismic-wand').abilityDamage).toBe(864);
  });

  it('the resolved loadout uses the wielded style boosted level: Necromancy 120 + elder overload = 145 with the T95 siphon + conduit', () => {
    const r = resolve({ weapons: ['omni-guard', 'soulbound-lantern'], overload: 'elder' });
    expect(r.combatLevel).toBe(145);
    expect(r.abilityDamage).toBe(362 + 912 + Math.floor(0.5 * (362 + 912)));
    expect(r.abilityDamage).toBe(1911);
  });

  it('Ranged: the weapon part is min(weapon tier, ammunition tier) – T90 arrows in the T95 Bow of the Last Guardian', () => {
    const bow = weapon('bow-of-the-last-guardian');
    expect(bow.abilityDamage).toBe(1368);
    expect(resolve({ weapons: ['bow-of-the-last-guardian'] }).abilityDamage).toBe(264 + 132 + 1368);
    expect(resolve({ weapons: ['bow-of-the-last-guardian'], gear: ['araxyte-arrow'] }).abilityDamage).toBe(264 + 132 + 14.4 * 90);
    // bolts do not fire from a bow – no cap
    expect(resolve({ weapons: ['bow-of-the-last-guardian'], gear: ['ascension-bolts'] }).abilityDamage).toBe(264 + 132 + 1368);
  });
});

describe('damage bonus of the worn gear (runescape.wiki/w/Damage_bonus, /Power_armour)', () => {
  it('gear.json carries the wiki numbers: Vestments of havoc 27.5 / 41.2 / 34.3 / 17.1, Essence of Finality 55.7 to every style', () => {
    expect(gear('vestments-of-havoc-hood').bonus?.melee).toBe(27.5);
    expect(gear('vestments-of-havoc-robe-top').bonus?.melee).toBe(41.2);
    expect(gear('vestments-of-havoc-robe-bottom').bonus?.melee).toBe(34.3);
    expect(gear('vestments-of-havoc-boots').bonus?.melee).toBe(17.1);
    expect(gear('vestments-of-havoc-hood').bonus?.magic).toBe(0);
    expect(gear('essence-of-finality-amulet').bonus).toEqual({ melee: 55.7, ranged: 55.7, magic: 55.7, necromancy: 55.7 });
    expect(gear('champion-s-ring').bonus?.melee).toBe(34.5);
    // tank armour has none
    expect(gear('cryptbloom-helm').bonus).toEqual({ melee: 0, ranged: 0, magic: 0, necromancy: 0 });
  });

  it('a power armour set adds its bonus to the matching style only; hybrid jewellery counts for all', () => {
    const r = resolve({ gear: ['vestments-of-havoc-hood', 'vestments-of-havoc-robe-top', 'vestments-of-havoc-robe-bottom', 'vestments-of-havoc-boots', 'essence-of-finality-amulet'] });
    expect(r.damageBonus).toEqual({ Melee: 27.5 + 41.2 + 34.3 + 17.1 + 55.7, Ranged: 55.7, Magic: 55.7, Necromancy: 55.7 });
  });

  it('b enters the wiki formula: ×1 with main hand + shield, ×1.5 with dual wield or a two-hander (Essence of Finality + champion’s ring = 90.2)', () => {
    const jewellery = ['essence-of-finality-amulet', 'champion-s-ring'];
    expect(resolve({ weapons: ['drygore-rapier', 'merciless-kiteshield'], gear: jewellery }).abilityDamage).toBe(264 + Math.floor(864 + 90.2));
    // dual wield: mh 264 + ⌊864 + 90.2⌋ = 1218, oh ⌊0.5 × 1218⌋ = 609
    expect(resolve({ weapons: ['drygore-rapier', 'off-hand-drygore-rapier'], gear: jewellery }).abilityDamage).toBe(1218 + 609);
    // two-hander: 264 + 132 + ⌊1296 + 1.5 × 90.2⌋ = 1827 – the same as dual wield
    expect(resolve({ weapons: ['noxious-scythe'], gear: jewellery }).abilityDamage).toBe(1827);
    // the bonus of another style is not used: a ranged loadout ignores the champion's ring
    expect(resolve({ weapons: ['bow-of-the-last-guardian'], gear: ['champion-s-ring'] }).abilityDamage).toBe(1764);
  });

  it('tier fallback for items without wiki numbers: the power armour table (tier 90: 22.5 / 33.7 / 28.1 / 14.0 / 14.0 = 112.3; damage tier 110 helmet 27.5)', () => {
    expect(damageBonusOf(powerPiece('head', 90), 'Melee')).toBe(22.5);
    expect(damageBonusOf(powerPiece('body', 90), 'Melee')).toBe(33.7);
    expect(damageBonusOf(powerPiece('legs', 90), 'Melee')).toBe(28.1);
    expect(damageBonusOf(powerPiece('hands', 90), 'Melee')).toBe(14);
    expect(damageBonusOf(powerPiece('feet', 90), 'Melee')).toBe(14);
    expect(damageBonusOf(powerPiece('head', 95, 110), 'Melee')).toBe(27.5);
    expect(damageBonusOf(powerPiece('head', 90), 'Magic')).toBe(0);
    expect(damageBonusOf({ ...powerPiece('head', 90), type: 'Tank armour' }, 'Melee')).toBe(0);
  });
});

describe('prayers and curses boost the damage by a percentage', () => {
  it('the table matches the prayers.json effect texts', () => {
    const byId = new Map(PRAYER_DATA.map((p) => [p.id, p]));
    for (const p of PRAYER_DAMAGE) {
      const data = byId.get(p.prayer);
      expect(data, p.prayer).toBeDefined();
      const m = /\+(\d+)%(?: to \+(\d+)%)? [^\n]*damage/.exec(data!.effect);
      expect(m, p.prayer + ': ' + data!.effect).not.toBeNull();
      expect(Number(m![1]), p.prayer).toBe(p.pct);
      expect(m![2] ? Number(m![2]) : undefined, p.prayer).toBe(p.max);
    }
  });

  it('Turmoil +10% melee, Malevolence +12%, Piety +8%, Ultimate Strength +6% (+16 with the amulet of zealots), boosts of a style add up', () => {
    expect(prayerDamagePct(new Set(['turmoil']), 'Melee', false)).toBe(10);
    expect(prayerDamagePct(new Set(['turmoil']), 'Ranged', false)).toBe(0);
    expect(prayerDamagePct(new Set(['malevolence']), 'Melee', false)).toBe(12);
    expect(prayerDamagePct(new Set(['piety']), 'Melee', false)).toBe(8);
    expect(prayerDamagePct(new Set(['ultimate-strength']), 'Melee', false)).toBe(6);
    expect(prayerDamagePct(new Set(['ultimate-strength']), 'Melee', true)).toBe(6 + AMULET_OF_ZEALOTS_ADD);
    expect(prayerDamagePct(new Set(['ultimate-strength', 'divine-rage']), 'Melee', true)).toBe(21);
    expect(prayerDamagePct(new Set(['piety']), 'Melee', true)).toBe(8); // not a single-stat prayer
    expect(prayerDamagePct(new Set(['sap-melee-strength']), 'Melee', false)).toBe(0);
  });

  it('leech curses climb from 2% to 8% (12–18% with zealots)', () => {
    const on = new Set(['leech-melee-strength']);
    expect(prayerDamagePct(on, 'Melee', false, () => 0)).toBe(2);
    expect(prayerDamagePct(on, 'Melee', false, () => LEECH_RAMP_TICKS / 2)).toBe(5);
    expect(prayerDamagePct(on, 'Melee', false, () => LEECH_RAMP_TICKS)).toBe(8);
    expect(prayerDamagePct(on, 'Melee', false, () => 10 * LEECH_RAMP_TICKS)).toBe(8);
    expect(prayerDamagePct(on, 'Melee', true, () => LEECH_RAMP_TICKS)).toBe(18);
  });

  it('the amulet of zealots is read from the worn gear', () => {
    expect(resolve({ gear: ['amulet-of-zealots'] }).zealots).toBe(true);
    expect(resolve({}).zealots).toBe(false);
  });
});

function ability(id: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key: 'ability:' + id, kind: 'ability', id, name: id, icon: '', gcd: true, adrenaline: 9, cooldownTicks: 0, buffs: [], style: 'Melee', abilityType: 'Basic', damageMin: 100, damageMax: 100, ...extra };
}
function prayer(id: string): EngineEntity {
  return { key: 'prayer:' + id, kind: 'prayer', id, name: id, icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
}

/** a melee engine with ability damage 1000 and no critical strikes (random 0.5) */
function engine(steps: EngineEntity[], opts: { book?: 'Prayers' | 'Curses'; random?: number; levels?: Partial<Record<keyof typeof DEFAULT_LEVELS, number>>; zealots?: boolean } = {}): TrainerEngine {
  const catalog = new Map(steps.map((s) => [s.key, s]));
  const loadout = defaultResolvedLoadout();
  loadout.style = 'Melee';
  loadout.abilityDamage = 1000;
  loadout.levels = { ...DEFAULT_LEVELS, ...opts.levels };
  loadout.zealots = opts.zealots ?? false;
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: false, loadout, fullAdrenaline: true, prayerBook: opts.book ?? 'Curses' });
  e.random = () => opts.random ?? 0.5;
  e.start(0);
  return e;
}

function hits(e: TrainerEngine): number[] {
  return e.events.filter((x) => x.kind === 'hit').map((x) => (x.kind === 'hit' ? x.amount : 0));
}

describe('engine: prayer boosts, critical strike damage by level, life points', () => {
  it('Turmoil multiplies melee hits by 1.1 (cast with it on), not bleeds', () => {
    const a = ability('a');
    const e = engine([prayer('turmoil'), a]);
    e.press('prayer:turmoil', 0);
    e.press(a.key, 100);
    e.update(3 * TICK_MS);
    expect(hits(e)).toEqual([1100]);
    const dismember = ability('dismember', { damageMin: 25, damageMax: 35 });
    const filler = ability('attack', { damageMin: undefined, damageMax: undefined });
    const b = engine([prayer('turmoil'), dismember, filler], { random: 0 });
    b.press('prayer:turmoil', 0);
    b.press(dismember.key, 100);
    b.update(17 * TICK_MS);
    expect(hits(b)[0]).toBe(250); // 25% of the ability damage, no prayer on the bleed
  });

  it('Piety (standard book) +8%, Ultimate Strength +16% with the amulet of zealots; a ranged prayer does nothing for melee', () => {
    const a = ability('a');
    const p = engine([prayer('piety'), a], { book: 'Prayers' });
    p.press('prayer:piety', 0);
    p.press(a.key, 100);
    p.update(3 * TICK_MS);
    expect(hits(p)).toEqual([1080]);
    const z = engine([prayer('ultimate-strength'), a], { book: 'Prayers', zealots: true });
    z.press('prayer:ultimate-strength', 0);
    z.press(a.key, 100);
    z.update(3 * TICK_MS);
    expect(hits(z)).toEqual([1160]);
    const r = engine([prayer('anguish'), a]);
    r.press('prayer:anguish', 0);
    r.press(a.key, 100);
    r.update(3 * TICK_MS);
    expect(hits(r)).toEqual([1000]);
  });

  it('critical strike damage follows the Strength level: +30% at 50, +50% at 90 and 99, +10% at 1', () => {
    expect(critMultiplier(1)).toBeCloseTo(1.1);
    expect(critMultiplier(20)).toBeCloseTo(1.15);
    expect(critMultiplier(50)).toBeCloseTo(1.3);
    expect(critMultiplier(90)).toBeCloseTo(1.5);
    expect(critMultiplier(99)).toBeCloseTo(1.5);
    expect(critMultiplier(120)).toBeCloseTo(1.5);
    const a = ability('a');
    const e = engine([a], { random: 0, levels: { strength: 50 } }); // random 0 → critical strike
    e.press(a.key, 0);
    e.update(3 * TICK_MS);
    expect(hits(e)).toEqual([1300]);
  });

  it('maximum life points: 9,900 at 99 Constitution, plus the armour bonus (Cryptbloom helm 900); Fortitude and the Powerburst of vitality on top', () => {
    expect(baseLifePoints(99)).toBe(9900);
    expect(baseLifePoints(10)).toBe(1000);
    expect(fortitudeLifePoints(99)).toBe(1000);
    expect(resolve({}).maxLifePoints).toBe(9900);
    expect(resolve({ gear: ['cryptbloom-helm'] }).maxLifePoints).toBe(10800);
    expect(resolve({ gear: ['cryptbloom-helm'], levels: { constitution: 80 } }).maxLifePoints).toBe(8900);
    expect(resolve({ weapons: ['drygore-rapier', 'merciless-kiteshield'] }).lifePointsBonus).toBe(735);
    const e = engine([prayer('fortitude')]);
    expect(e.maxLifePoints).toBe(9900);
    e.press('prayer:fortitude', 0);
    e.update(TICK_MS);
    expect(e.maxLifePoints).toBe(10900);
  });
});

/**
 * Ammunition and weapon passives PvME rotations rely on: Deathspore / Ful / Wen / Jas dragonbane arrows, Hydrix and Ruby
 * bakriminel bolts (e), the Bow of the Last Guardian's Perfect Equilibrium, Ek-ZekKil's Ashen Vow, the Salve amulet and the
 * damage scrimshaws. Resolved from the real data files like gear.spec.ts; ability damage 1000, fixed rolls.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import GEAR from '../../../public/data/gear.json';
import PERKS from '../../../public/data/perks.json';
import SETS from '../../../public/data/set-effects.json';
import SPECS from '../../../public/data/specs.json';
import WEAPONS from '../../../public/data/weapons.json';
import { Ability, EquipSlot, GearItem, ItemRef, Loadout, Perk, SetEffect, Weapon, WeaponSpec, newLoadout, weaponSlot } from '../core/models';
import { ResolvedLoadout } from './loadout-resolved';
import { LoadoutData, loadoutWarnings, resolveLoadout } from './loadout-resolver';
import { EngineConfig, EngineEntity, PERFECT_EQUILIBRIUM_KEY, TICK_MS, TrainerEngine } from './trainer-engine';

const ABILITY_DATA = ABILITIES as unknown as Ability[];
const BY_ID = new Map(ABILITY_DATA.map((a) => [a.id, a]));
const GEAR_DATA = GEAR as unknown as GearItem[];
const T = TICK_MS;

const DATA: LoadoutData = {
  weaponById: new Map((WEAPONS as unknown as Weapon[]).map((w) => [w.id, w])),
  specById: new Map((SPECS as unknown as WeaponSpec[]).map((s) => [s.id, s])),
  perkById: new Map((PERKS as unknown as Perk[]).map((p) => [p.id, p])),
  setEffectById: new Map((SETS as unknown as SetEffect[]).map((s) => [s.id, s])),
  gearById: new Map(GEAR_DATA.map((g) => [g.id, g])),
  specEntity: (s) => ({
    key: 'spec:' + s.id, kind: 'spec', id: s.id, name: s.name, icon: '', gcd: true, style: s.style, abilityType: 'Special',
    adrenaline: -(s.adrenaline ?? 0), cooldownTicks: s.cooldownTicks, buffs: [], damageMin: s.damageMin ?? undefined, damageMax: s.damageMax ?? undefined,
  }),
};

interface Wear {
  weapons?: string[];
  gear?: string[];
}

function wear(w: Wear): Loadout {
  const l = newLoadout('ammo');
  const eq = l.equipment as Record<string, ItemRef>;
  for (const id of w.weapons ?? []) {
    const wp = DATA.weaponById.get(id);
    if (!wp) throw new Error('unknown weapon ' + id);
    eq[weaponSlot(wp)] = { kind: 'weapon', id };
  }
  for (const id of w.gear ?? []) {
    const g = DATA.gearById!.get(id);
    if (!g) throw new Error('unknown gear ' + id);
    eq[g.slot as EquipSlot] = { kind: 'gear', id };
  }
  return l;
}

const resolve = (w: Wear): ResolvedLoadout => resolveLoadout(wear(w), DATA);

function ability(id: string): EngineEntity {
  const a = BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0,
    buffs: a.buffs.filter((b) => b >= 0).map((b) => ({ id: 'buff:' + b, name: String(b), kind: 'Buff' as const, on: 'self' as const, icon: null, durationTicks: a.durationTicks ?? 3 })),
    damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

/** engine on a resolved loadout with ability damage 1000; `rnd.v` is the value every random roll returns */
function make(ids: string[], loadout: ResolvedLoadout, cfg: Partial<EngineConfig> = {}): { e: TrainerEngine; rnd: { v: number } } {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((x) => [x.key, x]));
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: { ...loadout, abilityDamage: 1000 } });
  const rnd = { v: 0.5 };
  e.random = () => rnd.v;
  e.start(0);
  return { e, rnd };
}

function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, key: string): { amount: number; tick: number; crit: boolean; dot: boolean }[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'hit' }> => x.kind === 'hit' && x.key === key).map((h) => ({ amount: h.amount, tick: h.tick, crit: h.crit, dot: h.dot }));
}

const A = (e: TrainerEngine, id: string) => hits(e, 'ability:' + id);
const amounts = (e: TrainerEngine, id: string) => A(e, id).map((h) => h.amount);

/** n basic Ranged attacks, one per GCD from tick 1 */
function shoot(e: TrainerEngine, n: number, from = 1): number {
  let tick = from;
  for (let i = 0; i < n; i++, tick += 3) cast(e, 'ranged', tick);
  return tick - 3; // tick of the last shot
}

// ---------------------------------------------------------------- resolver

describe('ammunition: resolves from gear.json / set-effects.json only with the matching weapon', () => {
  it('arrows need a bow, bolts a crossbow; the loadout page warns about the mismatch', () => {
    expect(resolve({ weapons: ['zaryte-bow'], gear: ['ful-arrow'] }).styleDamageMult).toEqual([{ style: 'Ranged', mult: 1.15, dots: false }]);
    const wrong = resolve({ weapons: ['eldritch-crossbow'], gear: ['ful-arrow'] });
    expect(wrong.styleDamageMult).toEqual([]);
    expect(wrong.items.has('ful-arrow')).toBe(false);
    expect(loadoutWarnings(wear({ weapons: ['eldritch-crossbow'], gear: ['ful-arrow'] }), DATA)).toEqual(['Ful arrow only fire from a bow – their effect is off with Eldritch crossbow.']);
    expect(loadoutWarnings(wear({ weapons: ['zaryte-bow'], gear: ['ful-arrow'] }), DATA)).toEqual([]);
    expect(resolve({ weapons: ['eldritch-crossbow'], gear: ['hydrix-bakriminel-bolts-e'] }).hitProcs).toHaveLength(1);
    expect(resolve({ weapons: ['zaryte-bow'], gear: ['hydrix-bakriminel-bolts-e'] }).hitProcs).toEqual([]);
    // no weapon at all: the ammunition is assumed to fit (the loadout page lists it)
    expect(resolve({ gear: ['deathspore-arrows'] }).items.has('deathspore-arrows')).toBe(true);
  });

  it('Deathspore / Wen arrows are rule items, Jas dragonbane / demonbane ×1.3 vs their type, black stone arrows are not simulated', () => {
    const r = resolve({ weapons: ['zaryte-bow'], gear: ['deathspore-arrows'] });
    expect(r.items.has('deathspore-arrows')).toBe(true);
    expect(r.ignoredEffects).toEqual([]);
    expect(resolve({ weapons: ['zaryte-bow'], gear: ['wen-arrow'] }).items.has('wen-arrow')).toBe(true);
    expect(resolve({ weapons: ['zaryte-bow'], gear: ['jas-dragonbane-arrow'] }).targetTypeDamageMult).toEqual({ dragon: 1.3 });
    expect(resolve({ weapons: ['zaryte-bow'], gear: ['jas-demonbane-arrow'] }).targetTypeDamageMult).toEqual({ demon: 1.3 });
    expect(resolve({ weapons: ['zaryte-bow'], gear: ['black-stone-arrows'] }).ignoredEffects).toEqual([{ id: 'black-stone-arrows', kind: 'armour-reduction' }]);
  });

  it('bakriminel bolts (e): Hydrix 10% Deathmark (10 adrenaline + buff), Ruby 5% Blood Forfeit (25% + 100% × life points share)', () => {
    expect(resolve({ weapons: ['eldritch-crossbow'], gear: ['hydrix-bakriminel-bolts-e'] }).hitProcs).toEqual([
      { id: 'hydrix-bakriminel-bolts-e', chance: 0.1, cooldownTicks: 0, style: 'Ranged', adrenaline: 10, buff: { id: 'deathmark', durationTicks: 25 }, lpScaledHit: undefined },
    ]);
    expect(resolve({ weapons: ['eldritch-crossbow'], gear: ['ruby-bakriminel-bolts-e'] }).hitProcs).toEqual([
      { id: 'ruby-bakriminel-bolts-e', chance: 0.05, cooldownTicks: 0, style: 'Ranged', adrenaline: undefined, buff: undefined, lpScaledHit: { base: 0.25, perLpShare: 1 } },
    ]);
  });

  it('Bow of the Last Guardian carries Perfect Equilibrium (8 stacks, 4 under Balance by Force, 12–16% + 33–37%)', () => {
    const r = resolve({ weapons: ['bow-of-the-last-guardian'] });
    expect(r.perfectEquilibrium).toEqual({ stacks: 8, stacksWithBuff: { buff: 'balance-by-force', stacks: 4 }, abilityDamage: { min: 12, max: 16 }, hitShare: { min: 33, max: 37 } });
    expect(r.weaponSpec?.id).toBe('balance-by-force');
    expect(resolve({ weapons: ['zaryte-bow'] }).perfectEquilibrium).toBeNull();
  });

  it('Salve amulet 1.15 / (e) 1.2 vs undead, scrimshaws of the elements / cruelty 1.05 (superior 1.0666), vampyrism not simulated', () => {
    expect(resolve({ gear: ['salve-amulet'] }).targetTypeDamageMult).toEqual({ undead: 1.15 });
    expect(resolve({ gear: ['salve-amulet-e'] }).targetTypeDamageMult).toEqual({ undead: 1.2 });
    expect(resolve({ gear: ['scrimshaw-of-the-elements'] }).styleDamageMult).toEqual([{ style: 'Magic', mult: 1.05, dots: true }]);
    expect(resolve({ gear: ['superior-scrimshaw-of-the-elements'] }).styleDamageMult).toEqual([{ style: 'Magic', mult: 1.0666, dots: true }]);
    expect(resolve({ gear: ['scrimshaw-of-cruelty'] }).styleDamageMult).toEqual([{ style: 'Ranged', mult: 1.05, dots: true }]);
    expect(resolve({ gear: ['superior-scrimshaw-of-cruelty'] }).styleDamageMult).toEqual([{ style: 'Ranged', mult: 1.0666, dots: true }]);
    expect(resolve({ gear: ['scrimshaw-of-vampyrism'] }).ignoredEffects).toEqual([{ id: 'scrimshaw-of-vampyrism', kind: 'heal' }]);
    expect(resolve({ gear: ['superior-scrimshaw-of-vampyrism'] }).ignoredEffects).toEqual([{ id: 'superior-scrimshaw-of-vampyrism', kind: 'heal' }]);
  });
});

// ---------------------------------------------------------------- engine

describe('ammunition: effects in the engine', () => {
  it('Ful arrows: ranged ability hits × 1.15, Corruption Shot damage over time not', () => {
    const { e } = make(['ranged', 'corruption-shot'], resolve({ weapons: ['zaryte-bow'], gear: ['ful-arrow'] }));
    cast(e, 'ranged', 1);
    expect(amounts(e, 'ranged')).toEqual([1150]); // 100% × 1.15
    cast(e, 'corruption-shot', 4);
    e.update(14 * T);
    expect(amounts(e, 'corruption-shot')).toEqual([1000, 800, 600, 400, 200]);
  });

  it('Deathspore arrows: 12 ranged hits build Feasting Spores, then the next adrenaline-costing ability is free (requirement kept) and no stacks build for 50 ticks', () => {
    const { e } = make(['ranged', 'snap-shot', 'deadshot'], resolve({ weapons: ['zaryte-bow'], gear: ['deathspore-arrows'] }));
    const last = shoot(e, 11);
    expect(e.stack('feasting-spores')).toBe(11);
    expect(e.hasBuff('feasting-spores-ready')).toBe(false);
    cast(e, 'ranged', last + 3); // the 12th hit
    expect(e.stack('feasting-spores')).toBe(0);
    expect(e.buff('feasting-spores-ready')?.endTick).toBe(last + 3 + 15);
    expect(e.buff('feasting-spores-cooldown')?.endTick).toBe(last + 3 + 50);
    expect(e.costOf(ability('snap-shot'))).toEqual({ need: 25, cost: 0 });
    expect(e.costOf(ability('deadshot'))).toEqual({ need: 60, cost: 0 });
    cast(e, 'snap-shot', last + 6);
    expect(e.adrenaline).toBe(100); // free
    expect(e.hasBuff('feasting-spores-ready')).toBe(false); // consumed
    expect(amounts(e, 'snap-shot')).toEqual([1450, 1450]); // the free cast still deals its damage
    expect(e.costOf(ability('snap-shot'))).toEqual({ need: 25, cost: 25 });
    cast(e, 'ranged', last + 9); // inside the 50-tick cooldown: nothing builds
    expect(e.stack('feasting-spores')).toBe(0);
    // without the arrows nothing builds either
    const { e: plain } = make(['ranged'], resolve({ weapons: ['zaryte-bow'] }));
    shoot(plain, 3);
    expect(plain.stack('feasting-spores')).toBe(0);
  });

  it('Deathspore arrows: a free ultimate keeps its 100% requirement; the Ring of vigour refund is not paid on a free cast', () => {
    const { e } = make(['ranged', 'death-s-swiftness'], resolve({ weapons: ['zaryte-bow'], gear: ['deathspore-arrows', 'ring-of-vigour'] }), { prebuild: { stacks: { 'feasting-spores': 11 }, spirits: [], abilities: [], prayers: [] } });
    cast(e, 'ranged', 1);
    expect(e.hasBuff('feasting-spores-ready')).toBe(true);
    expect(e.costOf(ability('death-s-swiftness'))).toEqual({ need: 100, cost: 0 });
    cast(e, 'death-s-swiftness', 4);
    expect(e.adrenaline).toBe(100);
    expect(e.hasBuff('feasting-spores-ready')).toBe(false);
  });

  it('Deathspore arrows: special attacks count as ranged hits and can be the free ability (Balance by Force through the Weapon Special Attack slot)', () => {
    const r = resolve({ weapons: ['bow-of-the-last-guardian'], gear: ['deathspore-arrows'] });
    const { e } = make(['ranged', 'weapon-special-attack'], r, { prebuild: { stacks: { 'feasting-spores': 10 }, spirits: [], abilities: [], prayers: [] } });
    cast(e, 'weapon-special-attack', 1); // 30% adrenaline, its hit adds the 11th stack
    expect(e.adrenaline).toBe(70);
    expect(e.stack('feasting-spores')).toBe(11);
    cast(e, 'ranged', 4); // 12th: ready
    expect(e.hasBuff('feasting-spores-ready')).toBe(true);
    expect(e.costOf(ability('weapon-special-attack'))).toEqual({ need: 30, cost: 0 });
    e.adrenaline = 70;
    cast(e, 'weapon-special-attack', 7);
    expect(e.adrenaline).toBe(70);
    expect(e.hasBuff('feasting-spores-ready')).toBe(false);
  });

  it('Wen arrows: basic hits build Icy Chill (Piercing Shot 2); at 10 the next enhanced / ultimate ability consumes them for Icy Precision (+30% for 15 ticks, basics not)', () => {
    const { e } = make(['ranged', 'piercing-shot', 'snap-shot', 'rapid-fire'], resolve({ weapons: ['zaryte-bow'], gear: ['wen-arrow'] }));
    cast(e, 'piercing-shot', 1);
    expect(e.stack('icy-chill')).toBe(2);
    expect(e.buff('icy-chill')?.endTick).toBe(1 + 50);
    const last = shoot(e, 8, 4);
    expect(e.stack('icy-chill')).toBe(10);
    expect(e.buff('icy-chill')?.endTick).toBe(last + 50); // refreshed by every stack
    cast(e, 'snap-shot', last + 3);
    expect(e.stack('icy-chill')).toBe(0);
    expect(e.hasBuff('icy-chill')).toBe(false);
    expect(e.buff('icy-precision')?.endTick).toBe(last + 3 + 15);
    expect(amounts(e, 'snap-shot')).toEqual([1885, 1885]); // 145% × 1.3
    cast(e, 'ranged', last + 6);
    expect(amounts(e, 'ranged').at(-1)).toBe(1000); // basics are not boosted
    expect(e.stack('icy-chill')).toBe(1);
    cast(e, 'rapid-fire', last + 9); // enhanced, inside the window
    e.update((last + 20) * T);
    expect(amounts(e, 'rapid-fire')).toEqual(Array(8).fill(1040)); // 80% × 1.3
    expect(e.hasBuff('icy-precision')).toBe(false);
    // the stack decays 50 ticks after the last basic hit (last + 6)
    expect(e.buff('icy-chill')?.endTick).toBe(last + 56);
    e.update((last + 57) * T);
    expect(e.hasBuff('icy-chill')).toBe(false);
  });

  it('Jas dragonbane arrows and the Salve amulet (e) only work against their target type', () => {
    const jas = resolve({ weapons: ['zaryte-bow'], gear: ['jas-dragonbane-arrow'] });
    const { e: dragon } = make(['ranged'], jas, { targetType: 'dragon' });
    cast(dragon, 'ranged', 1);
    expect(amounts(dragon, 'ranged')).toEqual([1300]);
    const { e: other } = make(['ranged'], jas, { targetType: 'undead' });
    cast(other, 'ranged', 1);
    expect(amounts(other, 'ranged')).toEqual([1000]);
    const { e: none } = make(['ranged'], jas);
    cast(none, 'ranged', 1);
    expect(amounts(none, 'ranged')).toEqual([1000]);
    const { e: salve } = make(['ranged'], resolve({ weapons: ['zaryte-bow'], gear: ['salve-amulet-e'] }), { targetType: 'undead' });
    cast(salve, 'ranged', 1);
    expect(amounts(salve, 'ranged')).toEqual([1200]);
  });

  it('Hydrix bakriminel bolts (e): 10% per hit for +10 adrenaline and Deathmark (+1 adrenaline per basic for 25 ticks)', () => {
    const { e, rnd } = make(['ranged'], resolve({ weapons: ['eldritch-crossbow'], gear: ['hydrix-bakriminel-bolts-e'] }), { fullAdrenaline: false });
    rnd.v = 0.05; // procs (and crits)
    cast(e, 'ranged', 1);
    expect(e.adrenaline).toBe(19); // 9 + 10
    expect(e.buff('deathmark')?.endTick).toBe(1 + 25);
    rnd.v = 0.5;
    cast(e, 'ranged', 4);
    expect(e.adrenaline).toBe(29); // 9 + 1
    e.update(27 * T);
    expect(e.hasBuff('deathmark')).toBe(false);
    cast(e, 'ranged', 28);
    expect(e.adrenaline).toBe(38);
  });

  it("Ruby bakriminel bolts (e): 5% per hit for an extra hit of 25% + 100% × the target's life points share of the ability damage", () => {
    const r = resolve({ weapons: ['eldritch-crossbow'], gear: ['ruby-bakriminel-bolts-e'] });
    const { e, rnd } = make(['ranged'], r, { targetLifePoints: 100000 });
    rnd.v = 0.04; // procs (and crits, and rolls at 4%)
    cast(e, 'ranged', 1); // 90.8% × 1.5 crit = 1362 → 98,638 left
    expect(amounts(e, 'ranged')).toEqual([1362]);
    expect(hits(e, 'proc:ruby-bakriminel-bolts-e')).toEqual([{ amount: 1236, tick: 1, crit: false, dot: false }]); // (0.25 + 0.98638) × 1000
    const { e: dummy, rnd: r2 } = make(['ranged'], r);
    r2.v = 0.04;
    cast(dummy, 'ranged', 1);
    expect(hits(dummy, 'proc:ruby-bakriminel-bolts-e')).toEqual([{ amount: 1250, tick: 1, crit: false, dot: false }]); // no life points: full health
    const { e: miss, rnd: r3 } = make(['ranged'], r);
    r3.v = 0.06;
    cast(miss, 'ranged', 1);
    expect(hits(miss, 'proc:ruby-bakriminel-bolts-e')).toEqual([]);
  });

  it('Perfect Equilibrium: the 8th hit fires a bonus hit of 14% ability damage + 35% of the triggering hit (at the 0.5 roll) and resets the stacks', () => {
    const { e } = make(['ranged'], resolve({ weapons: ['bow-of-the-last-guardian'] }));
    const last = shoot(e, 7);
    expect(e.stack('perfect-equilibrium')).toBe(7);
    expect(hits(e, PERFECT_EQUILIBRIUM_KEY)).toEqual([]);
    cast(e, 'ranged', last + 3);
    e.update((last + 4) * T);
    expect(e.stack('perfect-equilibrium')).toBe(0);
    expect(hits(e, PERFECT_EQUILIBRIUM_KEY)).toEqual([{ amount: 490, tick: last + 3, crit: false, dot: false }]); // 140 + 0.35 × 1000
    // the bonus hit adds no stack of its own; the next hit starts at 1
    cast(e, 'ranged', last + 6);
    expect(e.stack('perfect-equilibrium')).toBe(1);
  });

  it("Perfect Equilibrium: stores the triggering hit before its critical strike, can crit itself, and takes Death's Swiftness on its ability-damage part", () => {
    const { e, rnd } = make(['ranged'], resolve({ weapons: ['bow-of-the-last-guardian'] }), { prebuild: { stacks: { 'perfect-equilibrium': 7 }, spirits: [], abilities: [], prayers: [] } });
    rnd.v = 0.05; // every hit crits, rolls at 5%
    cast(e, 'ranged', 1); // 91% × 1.5 = 1365, stored as 910
    e.update(2 * T);
    expect(amounts(e, 'ranged')).toEqual([1365]);
    // (12.2% × 1000 + 0.332 × 910) × 1.5 crit = (122 + 302.12) × 1.5
    expect(hits(e, PERFECT_EQUILIBRIUM_KEY)).toEqual([{ amount: 636, tick: 1, crit: true, dot: false }]);
  });

  it('Perfect Equilibrium: Balance by Force lowers the trigger to 4 stacks – the special with 3 stacks fires it on its own hit', () => {
    const r = resolve({ weapons: ['bow-of-the-last-guardian'] });
    const { e } = make(['ranged', 'weapon-special-attack'], r, { prebuild: { stacks: { 'perfect-equilibrium': 3 }, spirits: [], abilities: [], prayers: [] } });
    cast(e, 'weapon-special-attack', 1);
    e.update(2 * T);
    expect(e.buff('balance-by-force')?.endTick).toBe(1 + 50);
    expect(hits(e, 'ability:weapon-special-attack').map((h) => h.amount)).toEqual([2450]); // 245%
    expect(hits(e, PERFECT_EQUILIBRIUM_KEY)).toEqual([{ amount: 997, tick: 1, crit: false, dot: false }]); // 140 + 0.35 × 2450
    expect(e.stack('perfect-equilibrium')).toBe(0);
    const last = shoot(e, 4, 4);
    e.update((last + 1) * T);
    expect(hits(e, PERFECT_EQUILIBRIUM_KEY)).toHaveLength(2); // 4 more hits inside the buff: the second bonus hit
  });

  it('Perfect Equilibrium counts as a ranged hit for Deathspore arrows', () => {
    const r = resolve({ weapons: ['bow-of-the-last-guardian'], gear: ['deathspore-arrows'] });
    const { e } = make(['ranged'], r, { prebuild: { stacks: { 'feasting-spores': 10, 'perfect-equilibrium': 7 }, spirits: [], abilities: [], prayers: [] } });
    cast(e, 'ranged', 1); // 11th stack, and the bonus hit is the 12th
    e.update(2 * T);
    expect(e.hasBuff('feasting-spores-ready')).toBe(true);
    expect(e.stack('feasting-spores')).toBe(0);
  });

  it('Ek-ZekKil Ashen Vow: melee hits × 1.12 while the target is the Flamebound Rival', () => {
    const { e } = make(['attack'], resolve({ weapons: ['ek-zekkil'] }));
    cast(e, 'attack', 1);
    (e as unknown as { applyBuff: (id: string, tick: number, key: string) => void }).applyBuff('flamebound-rival', 1, 'test');
    cast(e, 'attack', 4);
    expect(amounts(e, 'attack')).toEqual([1200, 1344]); // 120%, × 1.12
    const { e: other } = make(['attack'], resolve({ weapons: ['masterwork-2h-sword'] }));
    (other as unknown as { applyBuff: (id: string, tick: number, key: string) => void }).applyBuff('flamebound-rival', 0, 'test');
    cast(other, 'attack', 1);
    expect(amounts(other, 'attack')).toEqual([1200]); // another weapon: no vow
  });

  it('Scrimshaw of the elements: magic hits and Combust burns × 1.05 (superior 1.0666); cruelty does nothing for magic', () => {
    const { e } = make(['magic', 'combust'], resolve({ weapons: ['masterwork-staff'], gear: ['scrimshaw-of-the-elements'] }));
    cast(e, 'magic', 1);
    expect(amounts(e, 'magic')).toEqual([1050]);
    cast(e, 'combust', 4);
    e.update(35 * T);
    expect(amounts(e, 'combust')).toEqual(Array(10).fill(315)); // 30% × 1.05
    const { e: sup } = make(['magic'], resolve({ weapons: ['masterwork-staff'], gear: ['superior-scrimshaw-of-the-elements'] }));
    cast(sup, 'magic', 1);
    expect(amounts(sup, 'magic')).toEqual([1066]);
    const { e: cruel } = make(['magic'], resolve({ weapons: ['masterwork-staff'], gear: ['scrimshaw-of-cruelty'] }));
    cast(cruel, 'magic', 1);
    expect(amounts(cruel, 'magic')).toEqual([1000]);
  });
});

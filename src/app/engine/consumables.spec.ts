/**
 * Consumables from PvME rotations – docs/research/mechanics.md § 12: powerbursts (vitality, acceleration), the Combat
 * dummy MKII action, Dominion mine, Sticky bomb, and the always-on loadout choices (overload, weapon poison, Kwuarm
 * incense sticks). Ability damage 1000 and a fixed roll of 0.5 unless a test says otherwise.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import GEAR from '../../../public/data/gear.json';
import PERKS from '../../../public/data/perks.json';
import SETS from '../../../public/data/set-effects.json';
import SPECIALS from '../../../public/data/specials.json';
import SPECS from '../../../public/data/specs.json';
import WEAPONS from '../../../public/data/weapons.json';
import { ACTIONS, Ability, GearItem, Loadout, Perk, SetEffect, Special, Weapon, WeaponSpec, newLoadout } from '../core/models';
import { KWUARM_PER_POTENCY, WEAPON_POISON_CHANCE, boostedLevel, levelCurve, levelPart, poisonPct } from './damage';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { LoadoutData, resolveLoadout } from './loadout-resolver';
import { POWERBURST_COOLDOWN_TICKS, POWERBURST_TICKS } from './rules-consumables';
import { EngineConfig, EngineEntity, EngineEvent, TICK_MS, TrainerEngine } from './trainer-engine';

const ABILITY_BY_ID = new Map((ABILITIES as unknown as Ability[]).map((a) => [a.id, a]));
const SPECIAL_BY_ID = new Map((SPECIALS as unknown as Special[]).map((s) => [s.id, s]));
const WEAPON_DATA = WEAPONS as unknown as Weapon[];
const T = TICK_MS;

const DATA: LoadoutData = {
  weaponById: new Map(WEAPON_DATA.map((w) => [w.id, w])),
  specById: new Map((SPECS as unknown as WeaponSpec[]).map((s) => [s.id, s])),
  perkById: new Map((PERKS as unknown as Perk[]).map((p) => [p.id, p])),
  setEffectById: new Map((SETS as unknown as SetEffect[]).map((s) => [s.id, s])),
  gearById: new Map((GEAR as unknown as GearItem[]).map((g) => [g.id, g])),
  specEntity: (s) => ({ key: 'spec:' + s.id, kind: 'spec', id: s.id, name: s.name, icon: '', gcd: true, style: s.style, abilityType: 'Special', adrenaline: -(s.adrenaline ?? 0), cooldownTicks: s.cooldownTicks, buffs: [] }),
};

function ability(id: string): EngineEntity {
  const a = ABILITY_BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: '', gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [], damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

/** engine view of a specials.json item – what DataService.toEngineEntity derives */
function special(id: string): EngineEntity {
  const s = SPECIAL_BY_ID.get(id);
  if (!s) throw new Error('unknown special ' + id);
  return {
    key: 'special:' + id, kind: 'special', id, name: s.name, icon: s.icon, gcd: false, adrenaline: s.adrenaline, cooldownTicks: s.cooldownTicks,
    sharedCooldown: s.sharedCooldown || undefined,
    adrenalineOverTime: s.adrenalineOverTime > 0 ? { amount: s.adrenalineOverTime, ticks: s.overTimeTicks } : undefined,
    buffs: s.debuff ? [{ id: 'special:' + id, name: s.debuff.name, kind: 'Debuff', on: 'target', icon: s.debuff.icon, durationTicks: s.debuff.durationTicks }] : [],
  };
}

function action(id: string): EngineEntity {
  const a = ACTIONS.find((x) => x.id === id);
  if (!a) throw new Error('unknown action ' + id);
  return { key: 'action:' + id, kind: 'action', id, name: a.name, icon: a.icon, gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
}

/** engine over the steps (all of them in the catalog); ability damage 1000, melee 2h unless the loadout says otherwise */
function make(steps: EngineEntity[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}, random = 0.5): TrainerEngine {
  const l: ResolvedLoadout = { ...defaultResolvedLoadout(), style: 'Melee', has2h: true, abilityDamage: 1000, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, new Map(steps.map((s) => [s.key, s])), { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: l });
  e.random = () => random;
  e.start(0);
  return e;
}

/** press so that the input is processed on `tick` and advance to the end of that tick */
function cast(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, key: string): { amount: number; tick: number; dot: boolean }[] {
  return e.events.filter((x): x is Extract<EngineEvent, { kind: 'hit' }> => x.kind === 'hit' && x.key === key).map((h) => ({ amount: h.amount, tick: h.tick, dot: h.dot }));
}

const VITALITY = 'special:powerburst-of-vitality';
const ACCELERATION = 'special:powerburst-of-acceleration';

describe('powerbursts', () => {
  it('vitality: doubles the life points for 10 ticks, off the GCD, and starts the 200-tick cooldown shared with every powerburst', () => {
    const e = make([special('powerburst-of-vitality'), special('powerburst-of-acceleration'), ability('attack')]);
    cast(e, VITALITY, 1);
    expect(e.buff('powerburst-of-vitality')).toMatchObject({ startTick: 1, endTick: 1 + POWERBURST_TICKS });
    expect(e.maxLifePointsMult).toBe(2);
    expect(e.gcdEndTick).toBeNull(); // no GCD started
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([[VITALITY, 'done']]); // an off-GCD first step completes as "done"
    // the other powerburst is locked by the shared cooldown
    expect(e.cooldownLeft(ACCELERATION, 3)).toBe(POWERBURST_COOLDOWN_TICKS - 2);
    cast(e, ACCELERATION, 3);
    expect(e.events.at(-1)).toMatchObject({ kind: 'on-cooldown', key: ACCELERATION });
    expect(e.hasBuff('powerburst-of-acceleration')).toBe(false);
    e.update(12 * T);
    expect(e.hasBuff('powerburst-of-vitality')).toBe(false);
    expect(e.maxLifePointsMult).toBe(1);
    expect(e.cooldownLeft(VITALITY, 201)).toBe(0);
  });

  it('acceleration: resets Surge and the Dive pair and sets them to a 2-tick cooldown for 10 ticks; Bladed Dive deals no damage meanwhile; Escape is untouched', () => {
    const e = make([ability('surge'), ability('escape'), special('powerburst-of-acceleration'), ability('bladed-dive'), ability('dive')]);
    cast(e, 'ability:surge', 1);
    cast(e, 'ability:escape', 1);
    expect(e.cooldownLeft('ability:surge', 2)).toBe(33);
    cast(e, ACCELERATION, 2);
    expect(e.buff('powerburst-of-acceleration')?.endTick).toBe(12);
    expect(e.cooldownLeft('ability:surge', 2)).toBe(0); // reset at once
    expect(e.cooldownLeft('ability:escape', 2)).toBe(33); // not a Surge partner any more
    cast(e, 'ability:surge', 3);
    expect(e.cooldownLeft('ability:surge', 4)).toBe(1);
    expect(e.cooldownLeft('ability:surge', 5)).toBe(0);
    // Bladed Dive outside the GCD: normally a hit of 75–95%, now nothing – but the adrenaline still comes and the shared Dive cooldown is 2 ticks
    cast(e, 'ability:bladed-dive', 6);
    expect(hits(e, 'ability:bladed-dive')).toEqual([]);
    expect(e.adrenaline).toBe(100);
    expect(e.cooldownLeft('ability:dive', 7)).toBe(1);
    expect(e.cooldownLeft('ability:dive', 8)).toBe(0);
    // after the burst everything is back to normal: full cooldown, full damage
    e.update(13 * T);
    expect(e.hasBuff('powerburst-of-acceleration')).toBe(false);
    cast(e, 'ability:bladed-dive', 14);
    expect(hits(e, 'ability:bladed-dive')).toEqual([{ amount: 850, tick: 14, dot: false }]);
    expect(e.cooldownLeft('ability:dive', 15)).toBe(33);
    expect(e.cooldownLeft('ability:surge', 15)).toBe(0); // its 2-tick cooldown from tick 3 ran out long ago
  });

  it('a powerburst has no adrenaline number, so a fresh press does not cancel the low-adrenaline state', () => {
    const e = make([special('powerburst-of-vitality')], {}, { fullAdrenaline: false });
    cast(e, VITALITY, 1);
    expect(e.adrenaline).toBe(0);
  });
});

describe('combat dummy', () => {
  it('the dummy action is a client action with a rule: +10% adrenaline per tick for 100 ticks, no GCD', () => {
    const e = make([action('combat-dummy'), ability('attack')], {}, { fullAdrenaline: false });
    cast(e, 'action:combat-dummy', 1);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['action:combat-dummy', 'done']]);
    expect(e.buff('combat-dummy')?.endTick).toBe(101);
    expect(e.gcdEndTick).toBeNull();
    e.update(6 * T + 1);
    expect(e.adrenaline).toBe(60); // the tick of the press counts, then every tick: 1–6
    e.update(200 * T);
    expect(e.hasBuff('combat-dummy')).toBe(false);
    expect(e.adrenaline).toBe(100);
  });

  it('target cycle stays a no-op action', () => {
    const e = make([action('target-cycle')], {}, { fullAdrenaline: false });
    cast(e, 'action:target-cycle', 1);
    expect(e.buffs).toEqual([]);
    expect(e.adrenaline).toBe(0);
  });
});

describe('vulnerability bomb', () => {
  it('applies the Vulnerability status (+10% for 100 ticks); a second bomb or the spell only refreshes it – never 1.21x', () => {
    const e = make([special('vulnerability-bomb'), ability('attack'), special('vulnerability-bomb')]);
    cast(e, 'special:vulnerability-bomb', 1);
    expect(e.buff('vulnerability')).toMatchObject({ on: 'target', endTick: 101 });
    expect(e.buffs.filter((b) => b.id.includes('vulnerab'))).toHaveLength(1);
    e.buffs.push({ id: 'vulnerability', name: 'Vulnerability', kind: 'Debuff', on: 'target', icon: null, startTick: 1, endTick: 101, stacks: 0, extended: 0, sourceKey: 'spell:vulnerability' }); // even a duplicate entry counts once
    cast(e, 'ability:attack', 2);
    expect(hits(e, 'ability:attack')).toEqual([{ amount: Math.floor(1200 * 1.1), tick: 2, dot: false }]);
    cast(e, 'special:vulnerability-bomb', 10);
    expect(e.buff('vulnerability')?.endTick).toBe(110);
  });
});

describe('dominion mine and sticky bomb', () => {
  it('the mine detonates 8 ticks after it is placed for 20% of the target maximum, cap 10,000; Vulnerability adds 10%; two mines per 100 ticks', () => {
    const e = make([special('dominion-mine'), special('vulnerability-bomb')], {}, { targetLifePoints: 30000 });
    cast(e, 'special:dominion-mine', 1);
    expect(hits(e, 'special:dominion-mine')).toEqual([]);
    e.update(9 * T + 1);
    expect(hits(e, 'special:dominion-mine')).toEqual([{ amount: 6000, tick: 9, dot: false }]);
    expect(e.targetHp).toBe(24000);
    cast(e, 'special:vulnerability-bomb', 10);
    cast(e, 'special:dominion-mine', 10);
    cast(e, 'special:dominion-mine', 11); // third mine within the minute
    expect(e.events.at(-1)).toMatchObject({ kind: 'on-cooldown', key: 'special:dominion-mine' });
    e.update(19 * T);
    expect(hits(e, 'special:dominion-mine').at(-1)).toEqual({ amount: 6600, tick: 18, dot: false });
    expect(e.cooldownLeft('special:dominion-mine', 101)).toBe(0);

    const big = make([special('dominion-mine')], {}, { targetLifePoints: 900000 });
    cast(big, 'special:dominion-mine', 1);
    big.update(10 * T);
    expect(hits(big, 'special:dominion-mine')).toEqual([{ amount: 10000, tick: 9, dot: false }]);

    const unlimited = make([special('dominion-mine')]);
    cast(unlimited, 'special:dominion-mine', 1);
    unlimited.update(10 * T);
    expect(hits(unlimited, 'special:dominion-mine')).toEqual([{ amount: 10000, tick: 9, dot: false }]);
  });

  it('the sticky bomb binds the target for 10 ticks, deals nothing and has no cooldown', () => {
    const e = make([special('sticky-bomb')]);
    cast(e, 'special:sticky-bomb', 1);
    expect(e.buff('bound')).toMatchObject({ kind: 'Debuff', on: 'target', endTick: 11 });
    expect(e.events.filter((x) => x.kind === 'hit')).toEqual([]);
    cast(e, 'special:sticky-bomb', 3);
    expect(e.buff('bound')?.endTick).toBe(13); // refreshed
    e.update(14 * T);
    expect(e.hasBuff('bound')).toBe(false);
  });
});

describe('loadout: overload, weapon poison, Kwuarm incense', () => {
  const two = (over: Loadout['overload'], extra: Partial<Loadout> = {}): ResolvedLoadout => {
    const l = { ...newLoadout('c'), overload: over, weaponPoison: 0 as const, ...extra };
    l.equipment = { ...l.equipment, twoHand: { kind: 'weapon', id: 'masterwork-2h-sword' } };
    return resolveLoadout(l, DATA);
  };
  const skill = (level: number) => levelPart(level) + Math.floor(1.25 * levelCurve(level));
  const tierPart = DATA.weaponById.get('masterwork-2h-sword')!.abilityDamage ?? 0;

  it('overloads raise the level term of the ability damage: none 99, overload 116, supreme 118, elder 120 (the default)', () => {
    expect(boostedLevel('none')).toBe(99);
    expect(boostedLevel('overload')).toBe(116);
    expect(boostedLevel('supreme')).toBe(118);
    expect(boostedLevel('elder')).toBe(120);
    expect(boostedLevel(undefined)).toBe(99);
    expect(two('none')).toMatchObject({ combatLevel: 99, abilityDamage: skill(99) + tierPart });
    expect(two('elder')).toMatchObject({ combatLevel: 120, abilityDamage: skill(120) + tierPart });
    expect(two('elder').abilityDamage - two('none').abilityDamage).toBe(69); // 310 + 155 vs 264 + 132
    expect(newLoadout().overload).toBe('elder');
    expect(newLoadout().weaponPoison).toBe(4);
    expect(newLoadout().kwuarmPotency).toBe(0);
  });

  it('weapon poison: 1/8 per hit, 20% of the ability damage +5% per tier; cinderbane gloves add a tier and their own 1/8; Kwuarm +2.5% per potency', () => {
    expect(poisonPct(4)).toBe(35);
    expect(two('none', { weaponPoison: 4 }).poison).toEqual({ chance: WEAPON_POISON_CHANCE, pct: 35 });
    expect(two('none', { weaponPoison: 1 }).poison).toEqual({ chance: 0.125, pct: 20 });
    const gloves: Partial<Loadout> = { equipment: { hands: { kind: 'gear', id: 'cinderbane-gloves' } } };
    expect(two('none', { ...gloves, weaponPoison: 0 }).poison).toEqual({ chance: 0.125, pct: 25 });
    const both = two('none', { ...gloves, weaponPoison: 4 }).poison!;
    expect(both.pct).toBe(40);
    expect(both.chance).toBeCloseTo(1 - 0.875 * 0.875, 12);
    expect(two('none', { weaponPoison: 4, kwuarmPotency: 4 }).poison).toEqual({ chance: 0.125, pct: 35 * (1 + 4 * KWUARM_PER_POTENCY) });
    expect(two('none', { weaponPoison: 0, kwuarmPotency: 4 }).poison).toBeNull();
  });

  it('a poisoning hit with weapon poison+++ deals 35% × 0.65–1.3 of the ability damage every 17 ticks, an extra hit on re-application', () => {
    const l = { ...two('none', { weaponPoison: 4 }), abilityDamage: 1000 };
    const e = make([ability('attack')], l, {}, 0.05);
    cast(e, 'ability:attack', 1); // 5% roll: poisons
    expect(e.hasBuff('poisoned')).toBe(true);
    cast(e, 'ability:attack', 4); // re-applies: an immediate poison hit of 35% × 1000 × (0.65 + 0.05 × 0.65)
    e.update(20 * T);
    expect(hits(e, 'proc:poison')).toEqual([{ amount: 238, tick: 4, dot: true }, { amount: 238, tick: 18, dot: true }]);
    const none = make([ability('attack')], { ...two('none', { weaponPoison: 0 }), abilityDamage: 1000 }, {}, 0.05);
    cast(none, 'ability:attack', 1);
    expect(none.hasBuff('poisoned')).toBe(false);
  });
});

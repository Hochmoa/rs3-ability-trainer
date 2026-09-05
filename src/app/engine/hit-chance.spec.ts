/**
 * Hit chance (docs/research/hit-chance.md): the wiki's formulas against its worked numbers, and the engine's two models –
 * "scaled" (PvM damage potential: a hit deals hit chance × its roll) and "roll" (a hit lands in full or misses).
 * Resolved from the real data files like ammo.spec.ts; ability damage 1000, fixed rolls.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import FAMILIARS from '../../../public/data/familiars.json';
import GEAR from '../../../public/data/gear.json';
import PERKS from '../../../public/data/perks.json';
import SETS from '../../../public/data/set-effects.json';
import SPECS from '../../../public/data/specs.json';
import WEAPONS from '../../../public/data/weapons.json';
import { Ability, DEFAULT_ENEMY, ENEMY_PRESETS, EnemyConfig, EquipSlot, Familiar, GearItem, ItemRef, Loadout, Perk, SetEffect, Weapon, WeaponSpec, enemyWithStats, newLoadout, weaponSlot } from '../core/models';
import { MIN_HIT_CHANCE, accuracyCurve, accuracyRating, armourRating, hitChance, prayerAccuracyLevels, weaponAccuracy, weaponAccuracyOf } from './hit-chance';
import { ResolvedLoadout } from './loadout-resolved';
import { LoadoutData, resolveLoadout } from './loadout-resolver';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const ABILITY_DATA = ABILITIES as unknown as Ability[];
const BY_ID = new Map(ABILITY_DATA.map((a) => [a.id, a]));
const T = TICK_MS;

const DATA: LoadoutData = {
  weaponById: new Map((WEAPONS as unknown as Weapon[]).map((w) => [w.id, w])),
  specById: new Map((SPECS as unknown as WeaponSpec[]).map((s) => [s.id, s])),
  perkById: new Map((PERKS as unknown as Perk[]).map((p) => [p.id, p])),
  setEffectById: new Map((SETS as unknown as SetEffect[]).map((s) => [s.id, s])),
  gearById: new Map((GEAR as unknown as GearItem[]).map((g) => [g.id, g])),
  familiarById: new Map((FAMILIARS as unknown as Familiar[]).map((f) => [f.id, f])),
  specEntity: (s) => ({
    key: 'spec:' + s.id, kind: 'spec', id: s.id, name: s.name, icon: '', gcd: true, style: s.style, abilityType: 'Special',
    adrenaline: -(s.adrenaline ?? 0), cooldownTicks: s.cooldownTicks, buffs: [], damageMin: s.damageMin ?? undefined, damageMax: s.damageMax ?? undefined,
  }),
};

interface Wear {
  weapons?: string[];
  gear?: string[];
  familiar?: string;
}

function wear(w: Wear): Loadout {
  const l = newLoadout('hit chance');
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
  if (w.familiar) l.familiar = w.familiar;
  l.overload = 'none'; // the wiki's worked numbers are at level 99 (a new loadout defaults to an elder overload)
  return l;
}

const resolve = (w: Wear): ResolvedLoadout => resolveLoadout(wear(w), DATA);

function ability(id: string): EngineEntity {
  const a = BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [], damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

const preset = (id: string): EnemyConfig => enemyWithStats({ ...ENEMY_PRESETS.find((p) => p.preset === id)!, enabled: false });
const NAKATRA = preset('nakatra');

/** engine on a resolved loadout with ability damage 1000; `rnd.v` is what every random roll returns, `rnd.seq` values are consumed first */
function make(ids: string[], loadout: ResolvedLoadout, cfg: Partial<EngineConfig> = {}): { e: TrainerEngine; rnd: { v: number; seq: number[] } } {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((x) => [x.key, x]));
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: true, fullAdrenaline: true, enemy: NAKATRA, ...cfg, loadout: { ...loadout, abilityDamage: 1000 } });
  const rnd = { v: 0.5, seq: [] as number[] };
  e.random = () => (rnd.seq.length ? rnd.seq.shift()! : rnd.v);
  e.start(0);
  return { e, rnd };
}

function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, id: string): { amount: number; tick: number; miss: boolean }[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'hit' }> => x.kind === 'hit' && x.key === 'ability:' + id).map((h) => ({ amount: h.amount, tick: h.tick, miss: !!h.miss }));
}

// ---------------------------------------------------------------- formulas (runescape.wiki/w/Hit_chance worked example)

describe('hit chance formulas against the wiki', () => {
  it('f(x) = x³/1250 + 4x + 40', () => {
    expect(accuracyCurve(99)).toBeCloseTo(1212.24, 2);
    expect(accuracyCurve(70)).toBeCloseTo(594.4, 2);
    expect(accuracyCurve(1)).toBeCloseTo(44.0008, 4);
  });

  it('Saradomin godsword at 99 Attack: a = ⌊f(99) + 2.5 × f(75)⌋ = 2,905', () => {
    expect(weaponAccuracyOf(75)).toBeCloseTo(1693.75, 2);
    expect(accuracyRating(99, weaponAccuracyOf(75))).toBe(2905);
  });

  it('abyssal demon: d = ⌊1,608 + f(70)⌋ = 2,202', () => {
    expect(armourRating(70, 1608)).toBe(2202);
  });

  it('H = 90 × 2,905 / 2,202 ≈ 118.7%, capped at 100%', () => {
    expect((90 / 100) * (2905 / 2202)).toBeCloseTo(1.187, 3);
    expect(hitChance(90, 2905, 2202)).toBe(1);
  });

  it('weapon accuracy by tier: 2.5 × f(t) = t³/500 + 10t + 100 – 2,765 at tier 95, 1,924 at 80, 1,486 at 70 (the rounded weapons.json infobox values)', () => {
    expect(Math.round(weaponAccuracyOf(95))).toBe(2765);
    expect(Math.round(weaponAccuracyOf(80))).toBe(1924);
    expect(Math.round(weaponAccuracyOf(70))).toBe(1486);
    expect(weaponAccuracy(DATA.weaponById.get('ek-zekkil'))).toBeCloseTo(2764.75, 2);
    expect(weaponAccuracy(DATA.weaponById.get('zaryte-bow'))).toBe(1924);
    expect(weaponAccuracy(null)).toBe(0);
  });

  it('additive modifiers, no armour, the 1% floor', () => {
    expect(hitChance(55, 3000, 6000)).toBeCloseTo(0.275, 6);
    expect(hitChance(55, 3000, 6000, 0.25)).toBeCloseTo(0.525, 6);
    expect(hitChance(55, 3000, 6000, -0.05)).toBeCloseTo(0.225, 6);
    expect(hitChance(100, 1, 0)).toBe(1);
    expect(hitChance(55, 10, 6000)).toBeLessThan(MIN_HIT_CHANCE);
  });

  it('prayers and curses add levels to the accuracy skill of their style', () => {
    expect(prayerAccuracyLevels(new Set(['turmoil', 'soul-split']), 'Melee')).toBe(10);
    expect(prayerAccuracyLevels(new Set(['turmoil']), 'Ranged')).toBe(0);
    expect(prayerAccuracyLevels(new Set(['malevolence']), 'Melee')).toBe(12);
    expect(prayerAccuracyLevels(new Set(['piety']), 'Melee')).toBe(8);
    expect(prayerAccuracyLevels(new Set(['desolation']), 'Ranged')).toBe(12);
    expect(prayerAccuracyLevels(new Set(['affliction']), 'Magic')).toBe(12);
    expect(prayerAccuracyLevels(new Set(['ruination']), 'Necromancy')).toBe(12);
    expect(prayerAccuracyLevels(new Set(['hand-of-doom']), 'Necromancy')).toBe(6);
  });

  it('boss presets carry the wiki infobox values; a custom target is always hit', () => {
    expect(NAKATRA).toMatchObject({ affinity: { Melee: 55, Ranged: 65, Magic: 55, Necromancy: 55 }, defenceLevel: 95, armour: 2765 });
    expect(preset('zamorak')).toMatchObject({ affinity: { Melee: 55, Ranged: 55, Magic: 55 }, defenceLevel: 80, armour: 1924 });
    expect(preset('raksha')).toMatchObject({ affinity: { Melee: 55, Ranged: 65, Magic: 55 }, defenceLevel: 85, armour: 2178 });
    expect(preset('rasial')).toMatchObject({ affinity: { Necromancy: 55 }, defenceLevel: 95, armour: 2458 });
    expect(DEFAULT_ENEMY).toMatchObject({ affinity: { Melee: 100, Ranged: 100, Magic: 100, Necromancy: 100 }, defenceLevel: 1, armour: 0 });
    // a stored config from before the hit chance: the preset's stats are filled in, a custom one stays "always hit"
    expect(enemyWithStats({ preset: 'raksha', name: 'Raksha' })).toMatchObject({ defenceLevel: 85, armour: 2178, affinity: { Ranged: 65 } });
    expect(enemyWithStats({ preset: null, name: 'Custom' })).toMatchObject({ defenceLevel: 1, armour: 0, affinity: { Melee: 100 } });
  });
});

// ---------------------------------------------------------------- resolver

describe('resolved accuracy modifiers', () => {
  it('weapon accuracy from the main hand / two-hander, defender × 1.03, Ful arrows × 0.9, nihil × 1.05, reaver\'s ring −5%, Nightmare gauntlets Snipe +25%, Salve (e) +20% vs undead', () => {
    expect(resolve({ weapons: ['ek-zekkil'] }).weaponAccuracy).toBeCloseTo(2764.75, 2);
    expect(resolve({ weapons: ['abyssal-scourge', 'kalphite-defender'] })).toMatchObject({ weaponAccuracy: weaponAccuracyOf(92), accuracyMult: [{ mult: 1.03 }] });
    expect(resolve({ weapons: ['zaryte-bow'], gear: ['ful-arrow'] }).accuracyMult).toEqual([{ style: 'Ranged', mult: 0.9 }]);
    expect(resolve({ familiar: 'blood-nihil' }).accuracyMult).toEqual([{ style: 'Melee', mult: 1.05 }]);
    expect(resolve({ gear: ['reaver-s-ring'] }).hitChanceAdd).toBe(-0.05);
    expect(resolve({ gear: ['nightmare-gauntlets'] }).hitChanceAddPerAbility).toEqual({ snipe: 0.25 });
    expect(resolve({ gear: ['salve-amulet-e'] }).targetTypeHitChanceAdd).toEqual({ undead: 0.2 });
    expect(resolve({})).toMatchObject({ weaponAccuracy: 0, accuracyMult: [], hitChanceAdd: 0 });
  });
});

// ---------------------------------------------------------------- engine

describe('engine: hit chance against Nakatra (melee 55, Defence 95, armour 2,765)', () => {
  // Ek-ZekKil (tier 95) at 99 Attack: a = ⌊1212.24 + 2764.75⌋ = 3976; d = ⌊2765 + f(95)⌋ = 3870; H = 0.55 × 3976 / 3870
  const H = hitChance(55, 3976, 3870);

  it('hitChanceFor() follows the wiki formula; prayers raise it, gear shifts it', () => {
    const { e } = make(['attack'], resolve({ weapons: ['ek-zekkil'] }));
    expect(armourRating(95, 2765)).toBe(3870);
    expect(accuracyRating(99, weaponAccuracyOf(95))).toBe(3976);
    expect(e.hitChanceFor('Melee')).toBeCloseTo(H, 9);
    expect(H).toBeCloseTo(0.565, 3);
    e.activePrayers.add('turmoil'); // +10 Attack levels: a = ⌊f(109) + 2764.75⌋ = 4276
    expect(e.hitChanceFor('Melee')).toBeCloseTo(hitChance(55, 4276, 3870), 9);
    expect(e.hitChanceFor('Melee')!).toBeGreaterThan(H);
    e.activePrayers.delete('turmoil');
    e.activePrayers.add('malevolence'); // +12
    expect(e.hitChanceFor('Melee')).toBeCloseTo(hitChance(55, accuracyRating(111, weaponAccuracyOf(95)), 3870), 9);
    const { e: ring } = make(['attack'], resolve({ weapons: ['ek-zekkil'], gear: ['reaver-s-ring'] }));
    expect(ring.hitChanceFor('Melee')).toBeCloseTo(H - 0.05, 9);
    const { e: gloves } = make(['snipe'], resolve({ weapons: ['zaryte-bow'], gear: ['nightmare-gauntlets'] }));
    expect(gloves.hitChanceFor('Ranged', 'snipe')! - gloves.hitChanceFor('Ranged', 'ranged')!).toBeCloseTo(0.25, 9);
  });

  it('scaled (default): every hit deals hit chance × its roll – 1,200 becomes ⌊1,200 × H⌋', () => {
    const { e } = make(['attack'], resolve({ weapons: ['ek-zekkil'] }));
    cast(e, 'attack', 1); // 110–130% at roll 0.5 = 1,200
    expect(hits(e, 'attack')).toEqual([{ amount: Math.floor(1200 * H), tick: 1, miss: false }]);
    expect(e.missCount).toBe(0);
    expect(e.damageDealt).toBe(Math.floor(1200 * H));
  });

  it('roll: a hit lands in full or misses; a miss deals 0, emits a miss event and counts', () => {
    const { e, rnd } = make(['attack'], resolve({ weapons: ['ek-zekkil'] }), { hitChanceModel: 'roll' });
    rnd.seq = [0.9]; // hit roll 0.9 ≥ H → miss
    cast(e, 'attack', 1);
    expect(hits(e, 'attack')).toEqual([{ amount: 0, tick: 1, miss: true }]);
    expect(e.missCount).toBe(1);
    expect(e.damageDealt).toBe(0);
    rnd.seq = [0.1, 0.5, 0.5]; // hit roll 0.1 < H, no crit, damage roll 0.5
    cast(e, 'attack', 4);
    expect(hits(e, 'attack').at(-1)).toEqual({ amount: 1200, tick: 4, miss: false });
    expect(e.missCount).toBe(1);
    expect(e.hitCount).toBe(1);
  });

  it('a miss applies no on-hit effects: no Icy Chill stack, no cinderbane poison; a landing hit does both', () => {
    const loadout = resolve({ weapons: ['zaryte-bow'], gear: ['wen-arrow', 'cinderbane-gloves'] });
    const { e, rnd } = make(['piercing-shot'], loadout, { hitChanceModel: 'roll' });
    expect(e.hitChanceFor('Ranged')).toBeCloseTo(hitChance(65, accuracyRating(99, weaponAccuracyOf(80)), 3870), 9);
    rnd.v = 0.99; // every roll misses
    cast(e, 'piercing-shot', 1);
    expect(hits(e, 'piercing-shot').map((h) => h.miss)).toEqual([true, true]);
    expect(e.stack('icy-chill')).toBe(0);
    expect(e.hasBuff('poisoned')).toBe(false);
    expect(e.damageDealt).toBe(0);
    expect(e.missCount).toBe(2);
    rnd.v = 0; // every roll lands (and crits, and poisons)
    cast(e, 'piercing-shot', 6); // 5-tick cooldown
    expect(hits(e, 'piercing-shot').slice(2).map((h) => h.miss)).toEqual([false, false]);
    expect(e.stack('icy-chill')).toBe(2);
    expect(e.hasBuff('poisoned')).toBe(true);
    expect(e.damageDealt).toBeGreaterThan(0);
  });

  it('a bleed whose first tick misses never ticks again (roll); scaled: every tick is scaled', () => {
    const { e, rnd } = make(['dismember'], resolve({ weapons: ['ek-zekkil'] }), { hitChanceModel: 'roll' });
    rnd.v = 0.99;
    cast(e, 'dismember', 1);
    e.update(30 * T);
    expect(hits(e, 'dismember')).toEqual([{ amount: 0, tick: 3, miss: true }]);
    const { e: s } = make(['dismember'], resolve({ weapons: ['ek-zekkil'] }));
    cast(s, 'dismember', 1);
    s.update(30 * T);
    const ticks = hits(s, 'dismember');
    expect(ticks).toHaveLength(8);
    expect(ticks.every((h) => !h.miss && h.amount === Math.floor(300 * H))).toBe(true); // 25–35% at roll 0.5 = 300 per tick
  });

  it('a training dummy or a custom target is never missed, whatever the roll', () => {
    const { e, rnd } = make(['attack'], resolve({ weapons: ['ek-zekkil'] }), { hitChanceModel: 'roll', enemy: preset('dummy') });
    expect(e.hitChanceFor('Melee')).toBe(1);
    rnd.v = 0.99;
    cast(e, 'attack', 1);
    expect(hits(e, 'attack')).toEqual([{ amount: 1100 + Math.floor(0.99 * 200), tick: 1, miss: false }]); // 110–130% at roll 0.99, in full
    const { e: c } = make(['attack'], resolve({ weapons: ['ek-zekkil'] }), { enemy: { ...DEFAULT_ENEMY } });
    expect(c.hitChanceFor('Melee')).toBe(1);
    cast(c, 'attack', 1);
    expect(hits(c, 'attack')).toEqual([{ amount: 1200, tick: 1, miss: false }]);
  });

  it('hitChanceDisabled / no enemy: the old behaviour – full damage, no misses, no hit chance reported', () => {
    const { e } = make(['attack'], resolve({ weapons: ['ek-zekkil'] }), { hitChanceDisabled: true });
    expect(e.hitChanceFor('Melee')).toBeNull();
    cast(e, 'attack', 1);
    expect(hits(e, 'attack')).toEqual([{ amount: 1200, tick: 1, miss: false }]);
    const { e: none } = make(['attack'], resolve({ weapons: ['ek-zekkil'] }), { enemy: undefined });
    expect(none.hitChanceFor('Melee')).toBeNull();
    cast(none, 'attack', 1);
    expect(hits(none, 'attack')).toEqual([{ amount: 1200, tick: 1, miss: false }]);
  });

  it('under 1% hit chance everything misses, even in the scaled model', () => {
    const { e } = make(['attack'], resolve({ weapons: ['ek-zekkil'] }), { enemy: { ...NAKATRA, armour: 1000000 } });
    expect(e.hitChanceFor('Melee')!).toBeLessThan(MIN_HIT_CHANCE);
    cast(e, 'attack', 1);
    expect(hits(e, 'attack')).toEqual([{ amount: 0, tick: 1, miss: true }]);
    expect(e.missCount).toBe(1);
  });
});

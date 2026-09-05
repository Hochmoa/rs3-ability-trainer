/**
 * Invention perks – perks.json against the wiki, gizmo validation, non-stacking across gizmos, and the damage / adrenaline /
 * cooldown numbers of every simulated perk (docs/research/perks.md). The loadouts go through the real resolver with the
 * real perks.json / weapons.json / gear.json; expected numbers are computed from the wiki formulas next to the assertion.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import GEAR from '../../../public/data/gear.json';
import PERKS from '../../../public/data/perks.json';
import SETS from '../../../public/data/set-effects.json';
import WEAPONS from '../../../public/data/weapons.json';
import { Ability, GearItem, Gizmo, Loadout, Perk, SetEffect, Weapon, newLoadout } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { LoadoutData, loadoutWarnings, resolveLoadout } from './loadout-resolver';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;
const DATA: LoadoutData = {
  weaponById: new Map((WEAPONS as unknown as Weapon[]).map((w) => [w.id, w])),
  specById: new Map(),
  perkById: new Map((PERKS as unknown as Perk[]).map((p) => [p.id, p])),
  setEffectById: new Map((SETS as unknown as SetEffect[]).map((s) => [s.id, s])),
  gearById: new Map((GEAR as unknown as GearItem[]).map((g) => [g.id, g])),
  specEntity: () => {
    throw new Error('no special attacks in this spec');
  },
};
const ABILITY_BY_ID = new Map((ABILITIES as unknown as Ability[]).map((a) => [a.id, a]));

/** T90 two-handers: ability damage 264 + 132 + 14.4 × 90 = 1692 */
const SCYTHE = 'noxious-scythe';
const STAFF = 'noxious-staff';
/** T95 bow: 264 + 132 + 1368 = 1764 */
const BOW = 'bow-of-the-last-guardian';
const HATCHET = 'hatchet-of-bloom-and-blight';
const SHIELD = 'merciless-kiteshield';

function gizmo(perks: [string, number][], ancient = true): Gizmo {
  return { ancient, perks: perks.map(([perk, rank]) => ({ perk, rank })) };
}

interface Setup {
  two?: string;
  main?: string;
  off?: string;
  /** gizmos of the two-hander (2) or of main / off hand (1 each) */
  weapon?: Gizmo[];
  body?: Gizmo;
  legs?: Gizmo;
  /** armour gizmo on the shield in the off-hand */
  shield?: Gizmo;
}

function loadout(s: Setup): Loadout {
  const l = newLoadout('perks');
  // the numbers below assume level 99 and no poison: the loadout's default elder overload / weapon poison+++ are tested in consumables.spec.ts
  l.overload = 'none';
  l.weaponPoison = 0;
  if (s.two) l.equipment.twoHand = { kind: 'weapon', id: s.two, gizmos: s.weapon };
  if (s.main) l.equipment.mainHand = { kind: 'weapon', id: s.main, gizmos: s.weapon?.slice(0, 1) };
  if (s.off) l.equipment.offHand = { kind: 'weapon', id: s.off, gizmos: s.shield ? [s.shield] : s.weapon?.slice(1, 2) };
  // tank armour (no damage bonus), so the ability damage stays the bare 1692 of the scythe and the perk numbers stay readable
  if (s.body) l.equipment.body = { kind: 'gear', id: 'teralith-cuirass', gizmos: [s.body] };
  if (s.legs) l.equipment.legs = { kind: 'gear', id: 'teralith-leggings', gizmos: [s.legs] };
  return l;
}

const resolve = (s: Setup): ResolvedLoadout => resolveLoadout(loadout(s), DATA);
const warnings = (s: Setup): string[] => loadoutWarnings(loadout(s), DATA);

function ability(id: string): EngineEntity {
  const a = ABILITY_BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [], damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

function engine(ids: string[], l: ResolvedLoadout, opts: { random?: number; cfg?: Partial<EngineConfig> } = {}): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...opts.cfg, loadout: l });
  e.random = () => opts.random ?? 0.5;
  e.start(0);
  return e;
}

/** presses the ability on `tick` and runs the engine to the end of that tick */
function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, tick * T);
  e.update(tick * T);
}

type Hit = { key: string; amount: number; crit: boolean; dot: boolean; tick: number };
function hits(e: TrainerEngine, id?: string): Hit[] {
  return e.events.filter((x): x is { kind: 'hit' } & Hit => x.kind === 'hit' && (!id || x.key === (id.startsWith('perk:') ? id : 'ability:' + id)));
}

/** one basic attack with the scythe, damage of its hit */
function attackHit(l: ResolvedLoadout, random = 0.5, cfg: Partial<EngineConfig> = {}): Hit {
  const e = engine(['attack'], l, { random, cfg });
  cast(e, 'attack', 0);
  const h = hits(e, 'attack');
  expect(h.length).toBe(1);
  return h[0];
}

const AD = 1692;

// ---------------------------------------------------------------- data

describe('perks.json matches the wiki (Perks page table, September 2026)', () => {
  const expected: Record<string, { std: number; anc: number; gizmos: string[]; twoSlot?: boolean }> = {
    precise: { std: 5, anc: 6, gizmos: ['weapon'] },
    equilibrium: { std: 3, anc: 4, gizmos: ['armour', 'weapon'] },
    eruptive: { std: 3, anc: 4, gizmos: ['weapon'] },
    biting: { std: 3, anc: 4, gizmos: ['armour', 'weapon'] },
    aftershock: { std: 3, anc: 4, gizmos: ['weapon'] },
    crackling: { std: 3, anc: 4, gizmos: ['armour', 'weapon'] },
    lunging: { std: 3, anc: 4, gizmos: ['weapon'] },
    caroming: { std: 3, anc: 4, gizmos: ['weapon'] },
    flanking: { std: 3, anc: 4, gizmos: ['weapon'] },
    ultimatums: { std: 3, anc: 4, gizmos: ['armour', 'weapon'] },
    ruthless: { std: 0, anc: 3, gizmos: ['ancient-weapon'] },
    relentless: { std: 0, anc: 5, gizmos: ['ancient-armour', 'ancient-weapon'] },
    impatient: { std: 3, anc: 4, gizmos: ['armour', 'weapon'] },
    invigorating: { std: 3, anc: 4, gizmos: ['armour', 'weapon'] },
    spendthrift: { std: 5, anc: 6, gizmos: ['weapon'] },
    'planted-feet': { std: 1, anc: 1, gizmos: ['weapon'] },
    mobile: { std: 1, anc: 1, gizmos: ['armour', 'weapon'] },
    preparation: { std: 3, anc: 4, gizmos: ['armour'] },
    turtling: { std: 3, anc: 4, gizmos: ['armour'] },
    reflexes: { std: 1, anc: 1, gizmos: ['armour'] },
    'clear-headed': { std: 3, anc: 4, gizmos: ['armour', 'weapon'] },
    bulwark: { std: 3, anc: 4, gizmos: ['armour'] },
    'shield-bashing': { std: 3, anc: 4, gizmos: ['armour', 'weapon'] },
    'brief-respite': { std: 3, anc: 4, gizmos: ['armour'] },
    devoted: { std: 3, anc: 4, gizmos: ['armour'] },
    'enhanced-devoted': { std: 3, anc: 4, gizmos: ['armour'], twoSlot: true },
    'crystal-shield': { std: 3, anc: 4, gizmos: ['armour'] },
    absorbative: { std: 3, anc: 4, gizmos: ['armour'] },
    lucky: { std: 5, anc: 6, gizmos: ['armour'] },
    genocidal: { std: 1, anc: 1, gizmos: ['armour', 'weapon'] },
    'undead-slayer': { std: 1, anc: 1, gizmos: ['armour', 'weapon'] },
    'dragon-slayer': { std: 1, anc: 1, gizmos: ['armour', 'weapon'] },
    'demon-slayer': { std: 1, anc: 1, gizmos: ['armour', 'weapon'] },
    energising: { std: 3, anc: 4, gizmos: ['armour', 'weapon'] },
    efficient: { std: 3, anc: 4, gizmos: ['armour', 'tool', 'weapon'] },
    'enhanced-efficient': { std: 3, anc: 4, gizmos: ['armour', 'tool', 'weapon'], twoSlot: true },
    enlightened: { std: 3, anc: 4, gizmos: ['armour', 'tool', 'weapon'] },
    wise: { std: 3, anc: 4, gizmos: ['armour', 'tool', 'weapon'] },
    hoarding: { std: 1, anc: 1, gizmos: ['armour', 'tool', 'weapon'] },
    looting: { std: 1, anc: 1, gizmos: ['armour', 'weapon'] },
    'trophy-taker-s': { std: 5, anc: 6, gizmos: ['armour', 'weapon'] },
  };

  it('max ranks, ancient ranks, gizmo types and two-slot flags', () => {
    for (const [id, x] of Object.entries(expected)) {
      const p = DATA.perkById.get(id);
      expect(p, id).toBeDefined();
      expect([p!.maxRank, p!.maxRankAncient, p!.gizmos, p!.twoSlot], id).toEqual([x.std, x.anc, x.gizmos, !!x.twoSlot]);
    }
  });

  it('per-rank parameters', () => {
    const params = (id: string) => DATA.perkById.get(id)!.params as Record<string, unknown>;
    expect(params('precise')['minDamagePerRank']).toBe(0.015);
    expect(params('equilibrium')).toMatchObject({ abilityDamageBase: 0.06, abilityDamagePerRank: 0.02, noCrit: true });
    expect(params('eruptive')['abilityDamagePerRank']).toBe(0.005);
    expect(params('biting')['critChancePerRank']).toBe(0.02);
    expect(params('aftershock')).toMatchObject({ damagePerRank: 0.4, threshold: 50000, minIntervalTicks: 10, rollMin: 0.6, rollMax: 0.99 });
    expect(params('crackling')).toMatchObject({ damagePerRank: 0.5, cooldownTicks: 100 });
    expect(params('lunging')).toMatchObject({ abilities: ['combust', 'dismember'], base: 0.1, perRank: 0.03 });
    expect(params('caroming')).toMatchObject({ ricochetPerRank: 0.04, chainBase: 0.05, chainPerRank: 0.05 });
    expect(params('flanking')).toMatchObject({ abilities: ['soul-strike', 'backhand', 'impact', 'binding-shot'], perRank: 0.4 });
    expect(params('ultimatums')).toMatchObject({ ultimateBase: 0.03, ultimatePerRank: 0.01 });
    expect(params('ruthless')).toMatchObject({ perStackPerRank: 0.005, maxStacks: 5 });
    expect(params('relentless')).toMatchObject({ noCostChancePerRank: 0.01, lockoutTicks: 50 });
    expect(params('impatient')).toMatchObject({ chancePerRank: 0.09, bonus: 3 });
    expect(params('invigorating')['basicAttackMultPerRank']).toBe(0.05);
    expect(params('spendthrift')).toMatchObject({ chancePerRank: 0.01, damagePerRank: 0.01 });
    expect(params('planted-feet')).toMatchObject({ abilities: ['sunshine', 'death-s-swiftness'], durationTicks: 63, removesDot: true });
    expect(params('mobile')).toMatchObject({ abilities: ['surge', 'escape', 'dive', 'bladed-dive', 'barge', 'greater-barge'], cooldownMult: 0.5 });
    expect(params('preparation')).toMatchObject({ durationPerRank: 0.15, cooldownPerRank: 0.15 });
    expect(params('turtling')).toMatchObject({ durationPerRank: 0.1, cooldownPerRank: 0.1 });
    expect(params('reflexes')).toMatchObject({ durationMult: 0.5, cooldownMult: 0.5 });
    expect(params('clear-headed')['extraTicks']).toEqual([2, 3, 5, 6]);
    expect(params('bulwark')).toMatchObject({ durationPerRank: 0.06, minTicksPerRank: 1, noDamage: true });
    expect(params('shield-bashing')['perRank']).toBe(0.15);
    expect(params('brief-respite')).toMatchObject({ abilities: ['rejuvenate', 'guthix-s-blessing', 'ice-asylum'], cooldownPerRank: -0.05 });
    expect(params('devoted')['chancePerRank']).toBe(0.03);
    expect(params('enhanced-devoted')['chancePerRank']).toBe(0.045);
    for (const id of ['undead-slayer', 'dragon-slayer', 'demon-slayer']) expect(params(id)['bonus']).toBe(0.07);
  });

  it('the perks removed on 20 July 2026 are gone', () => {
    for (const id of ['junk-food', 'fatiguing', 'cautious', 'blunted', 'committed', 'antitheism', 'profane', 'inaccurate', 'mediocrity', 'undead-bait', 'demon-bait', 'dragon-bait', 'butterfingers', 'cheapskate', 'confused']) {
      expect(DATA.perkById.has(id), id).toBe(false);
    }
  });
});

// ---------------------------------------------------------------- gizmo validation

describe('gizmo validation (loadoutWarnings)', () => {
  it('a legal ancient setup gives no warning', () => {
    expect(
      warnings({
        two: SCYTHE,
        weapon: [gizmo([['precise', 6], ['aftershock', 4]]), gizmo([['lunging', 4], ['ultimatums', 4]])],
        body: gizmo([['biting', 4], ['crackling', 4]]),
        legs: gizmo([['impatient', 4], ['relentless', 5]]),
      }),
    ).toEqual([]);
  });

  it('rank limits: standard gizmos stop at the standard max, ancient gizmos one higher', () => {
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['precise', 6]], false)] })).toEqual(['Noxious scythe: Precise rank 6 exceeds the maximum of 5 (standard gizmo).']);
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['precise', 5]], false)] })).toEqual([]);
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['precise', 7]])] })).toEqual(['Noxious scythe: Precise rank 7 exceeds the maximum of 6.']);
    expect(warnings({ two: SCYTHE, body: gizmo([['biting', 4]], false) })[0]).toContain('Biting rank 4 exceeds the maximum of 3');
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['precise', 0]])] })).toEqual(['Noxious scythe: Precise rank must be at least 1.']);
  });

  it('ancient-only perks need an ancient gizmo', () => {
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['ruthless', 3]], false)] })).toEqual(['Noxious scythe: Ruthless needs an ancient gizmo.', 'Noxious scythe: Ruthless rank 3 exceeds the maximum of 0 (standard gizmo).']);
    expect(warnings({ two: SCYTHE, body: gizmo([['relentless', 5]], false) })).toContain('Teralith cuirass: Relentless needs an ancient gizmo.');
    expect(warnings({ two: SCYTHE, body: gizmo([['relentless', 5]]) })).toEqual([]);
  });

  it('weapon perks stay on weapon gizmos, armour perks on armour gizmos (a shield takes an armour gizmo)', () => {
    expect(warnings({ two: SCYTHE, body: gizmo([['precise', 6]]) })).toEqual(['Teralith cuirass: Precise cannot go on a armour gizmo.']);
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['turtling', 4]])] })).toEqual(['Noxious scythe: Turtling cannot go on a weapon gizmo.']);
    expect(warnings({ main: HATCHET, off: SHIELD, shield: gizmo([['precise', 6]]) })).toEqual(['Merciless kiteshield: Precise cannot go on a armour gizmo.']);
    expect(warnings({ main: HATCHET, off: SHIELD, shield: gizmo([['turtling', 4], ['bulwark', 4]]) })).toEqual([]);
  });

  it('two slots per gizmo; a two-slot perk fills the gizmo; no perk twice', () => {
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['precise', 6], ['aftershock', 4], ['lunging', 4]])] })).toEqual(['Noxious scythe: more than two perk slots used.']);
    expect(warnings({ two: SCYTHE, body: gizmo([['enhanced-devoted', 4], ['biting', 4]]) })).toEqual(['Teralith cuirass: more than two perk slots used (a two-slot perk cannot be paired with another perk).']);
    expect(warnings({ two: SCYTHE, body: gizmo([['enhanced-devoted', 4]]) })).toEqual([]);
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['precise', 6], ['precise', 5]])] })).toEqual(['Noxious scythe: Precise is in the gizmo twice.', 'Precise is on 2 gizmos: perks do not stack with themselves, only rank 6 counts.']);
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['nonsense', 1]])] })).toEqual(['Noxious scythe: unknown perk "nonsense".']);
  });

  it('the same perk on two gizmos does not stack – reported, not an error', () => {
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['precise', 6]]), gizmo([['precise', 4]])] })).toEqual(['Precise is on 2 gizmos: perks do not stack with themselves, only rank 6 counts.']);
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['biting', 4]])], body: gizmo([['biting', 3]]), legs: gizmo([['biting', 2]]) })).toEqual(['Biting is on 3 gizmos: perks do not stack with themselves, only rank 4 counts.']);
  });

  it('perks that cancel each other', () => {
    expect(warnings({ two: SCYTHE, body: gizmo([['devoted', 4]]), legs: gizmo([['enhanced-devoted', 4]]) })).toEqual(['Enhanced Devoted does not stack with Devoted – Devoted is wasted.']);
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['equilibrium', 4]])], body: gizmo([['biting', 4]]) })).toEqual(['Equilibrium prevents critical strikes – Biting has no effect.']);
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['shield-bashing', 4]])], body: gizmo([['bulwark', 4]]) })).toEqual(['Bulwark makes Debilitate deal no damage – Shield Bashing has no effect.']);
    expect(warnings({ two: SCYTHE, weapon: [gizmo([['efficient', 4]])], body: gizmo([['enhanced-efficient', 4]]) })).toEqual(['Enhanced Efficient does not stack with Efficient on the same item.']);
  });
});

// ---------------------------------------------------------------- non-stacking

describe('the highest rank of a perk counts, across all gizmos', () => {
  it('ability damage of the test weapons', () => {
    expect(resolve({ two: SCYTHE }).abilityDamage).toBe(AD);
    expect(resolve({ two: BOW }).abilityDamage).toBe(1764);
  });

  it('two Precise 6 gizmos = one Precise 6; Precise 6 + Precise 4 = Precise 6', () => {
    const one = resolve({ two: SCYTHE, weapon: [gizmo([['precise', 6]])] });
    const two = resolve({ two: SCYTHE, weapon: [gizmo([['precise', 6]]), gizmo([['precise', 6]])] });
    const mixed = resolve({ two: SCYTHE, weapon: [gizmo([['precise', 4]]), gizmo([['precise', 6]])] });
    expect([one.preciseRank, two.preciseRank, mixed.preciseRank]).toEqual([6, 6, 6]);
    // basic attack 110–130%, roll 0.5: Precise 6 lifts the minimum by 9% of the max → 121.7–130%
    const expected = Math.floor(AD * (121.7 + 0.5 * (130 - 121.7)) / 100);
    expect(expected).toBe(2129);
    expect(attackHit(one).amount).toBe(2129);
    expect(attackHit(two).amount).toBe(2129);
    expect(attackHit(mixed).amount).toBe(2129);
    expect(attackHit(resolve({ two: SCYTHE })).amount).toBe(Math.floor(AD * 1.2)); // 2030 without
  });

  it('Biting on weapon and both armour gizmos: +8% once, not +24%', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['biting', 4]])], body: gizmo([['biting', 4]]), legs: gizmo([['biting', 4]]) });
    expect(l.critChanceAdd).toBeCloseTo(0.08, 10);
  });

  it('Equilibrium on weapon and armour: one +14%', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['equilibrium', 4]])], body: gizmo([['equilibrium', 3]]) });
    expect(l.abilityDamageMult).toBeCloseTo(1.14, 10);
    expect(l.abilityDamage).toBe(Math.floor(AD * 1.14)); // 1928
  });
});

// ---------------------------------------------------------------- damage perks

describe('Precise / Equilibrium / Eruptive', () => {
  it('Precise 6 alone: min 121.7%, 2129 at roll 0.5; the minimum roll is the new minimum', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['precise', 6]])] });
    expect(attackHit(l, 0.5).amount).toBe(2129);
    expect(attackHit(l, 0.0, {}).amount).toBe(Math.floor(AD * 1.217 * 1.5)); // roll 0 also crits (10% base): 2058.9 × 1.5 → 3088
    expect(attackHit(l, 0.99).amount).toBe(Math.floor(AD * (121.7 + 0.99 * 8.3) / 100)); // 129.917% → 2198
  });

  it('Precise 5 (standard max) vs 6 (ancient)', () => {
    expect(attackHit(resolve({ two: SCYTHE, weapon: [gizmo([['precise', 5]], false)] })).amount).toBe(Math.floor(AD * (119.75 + 0.5 * 10.25) / 100)); // 2116
  });

  it('Equilibrium 4: ability damage stat × 1.14 (floored), nothing crits', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['equilibrium', 4]])] });
    expect(l.critDisabled).toBe(true);
    expect(attackHit(l, 0.5).amount).toBe(Math.floor(1928 * 1.2)); // 2313
    const low = attackHit(l, 0.0); // would be a crit without Equilibrium
    expect(low.crit).toBe(false);
    expect(low.amount).toBe(Math.floor(1928 * 1.1)); // 2120
    expect(attackHit(resolve({ two: SCYTHE }), 0.0).crit).toBe(true);
  });

  it('Equilibrium 3 (standard): +12%', () => {
    expect(resolve({ two: SCYTHE, weapon: [gizmo([['equilibrium', 3]], false)] }).abilityDamage).toBe(Math.floor(AD * 1.12)); // 1895
  });

  it('Equilibrium blocks guaranteed critical strikes too (Smoke Tendrils)', () => {
    const l = resolve({ two: STAFF, weapon: [gizmo([['equilibrium', 4]])] });
    const e = engine(['smoke-tendrils'], l);
    cast(e, 'smoke-tendrils', 0);
    e.update(12 * T);
    const h = hits(e, 'smoke-tendrils');
    expect(h.length).toBeGreaterThan(0);
    expect(h.every((x) => !x.crit)).toBe(true);
    const e2 = engine(['smoke-tendrils'], resolve({ two: STAFF }));
    cast(e2, 'smoke-tendrils', 0);
    e2.update(12 * T);
    expect(hits(e2, 'smoke-tendrils').every((x) => x.crit)).toBe(true);
  });

  it('Precise 6 + Equilibrium 4: 121.7–130% of 1928', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['precise', 6], ['equilibrium', 4]])] });
    expect(attackHit(l).amount).toBe(Math.floor(1928 * (121.7 + 0.5 * 8.3) / 100)); // 2426
  });

  it('Eruptive 4: ability damage × 1.02', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['eruptive', 4]])] });
    expect(l.abilityDamage).toBe(Math.floor(AD * 1.02)); // 1725
    expect(attackHit(l).amount).toBe(Math.floor(1725 * 1.2)); // 2070
  });

  it('Precise does not touch bleeds (Dismember) …', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['precise', 6]])] });
    const e = engine(['dismember'], l);
    cast(e, 'dismember', 0);
    e.update(20 * T);
    const h = hits(e, 'dismember');
    expect(h.length).toBe(8);
    expect(h.every((x) => x.dot && x.amount === Math.floor(AD * 0.3))).toBe(true); // 507
  });

  it('… but it does reach Bloat, whose DoT is a share of the Precise-rolled initial hit', () => {
    const l = { ...defaultResolvedLoadout(), style: 'Necromancy' as const, hasConduit: true, abilityDamage: 1000, preciseRank: 6 };
    const bloat = { ...ability('bloat'), damageMin: 135, damageMax: 165 };
    const e = new TrainerEngine([bloat], new Map([[bloat.key, bloat]]), { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: true, fullAdrenaline: true, loadout: l });
    e.random = () => 0.5;
    e.start(0);
    cast(e, 'bloat', 0);
    e.update(35 * T);
    const h = hits(e, 'bloat');
    expect(h[0].amount).toBe(Math.floor(1000 * (149.85 + 0.5 * (165 - 149.85)) / 100)); // initial hit: min 135 + 9% of 165 → 1574
    const dotMin = 135 / 4 + 0.09 * (165 / 4); // 25% of the hit, min lifted by 9% of its max
    expect(h[1].dot && h[1].amount).toBe(Math.floor(1000 * (dotMin + 0.5 * (165 / 4 - dotMin)) / 100)); // 393 (375 without Precise)
  });
});

describe('Biting', () => {
  it('Biting 4: +8% critical strike chance on top of the 10% base; rank 3 is +6%', () => {
    // random 0.17: crit with 18% chance (Biting 4), not with 16% (Biting 3) or 10% (none)
    const roll = Math.floor(AD * (110 + 0.17 * 20) / 100); // 1918
    const four = attackHit(resolve({ two: SCYTHE, weapon: [gizmo([['biting', 4]])] }), 0.17);
    expect(four.crit).toBe(true);
    expect(four.amount).toBe(Math.floor(AD * 1.134 * 1.5)); // 2878
    const three = attackHit(resolve({ two: SCYTHE, body: gizmo([['biting', 3]], false) }), 0.17);
    expect(three.crit).toBe(false);
    expect(three.amount).toBe(roll);
    expect(attackHit(resolve({ two: SCYTHE }), 0.17).crit).toBe(false);
  });

  it('Biting never crits a bleed', () => {
    const e = engine(['dismember'], resolve({ two: SCYTHE, weapon: [gizmo([['biting', 4]])] }), { random: 0.0 });
    cast(e, 'dismember', 0);
    e.update(20 * T);
    expect(hits(e, 'dismember').every((x) => x.dot && !x.crit)).toBe(true);
  });
});

describe('Aftershock', () => {
  /** the scythe with Aftershock, ability damage forced to 20 000 so 3 basic attacks (24 000 each) cross 50 000 */
  function loadoutAD(rank: number, ad = 20000): ResolvedLoadout {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['aftershock', rank]])] });
    l.abilityDamage = ad;
    return l;
  }

  it('explodes once 50,000 damage was dealt: rank 4 → 160% × (60–99%) of the ability damage, no crit', () => {
    const e = engine(['attack'], loadoutAD(4));
    for (let i = 0; i < 9; i++) cast(e, 'attack', 3 * i); // hits on ticks 0, 3, … 24: 24 000 each
    const a = hits(e, 'perk:aftershock');
    // 72 000 at tick 6 → explosion; then 46 000 (tick 9), 70 000 (tick 12, < 6 s after the last one: delayed), 94 000 (tick 15, delayed), tick 18 → explosion
    expect(a.map((x) => x.tick)).toEqual([6, 18]);
    expect(a.every((x) => !x.crit && !x.dot)).toBe(true);
    // roll 0.5 → 60% + 20 of the 40 steps → 80%
    expect(a[0].amount).toBe(Math.floor(0.4 * 4 * 0.8 * 20000)); // 25 600
  });

  it('the roll spans 60% … 99% in 1% steps; rank 3 is 120%', () => {
    const lo = engine(['attack'], loadoutAD(4), { random: 0.0 });
    for (let i = 0; i < 3; i++) cast(lo, 'attack', 3 * i);
    expect(hits(lo, 'perk:aftershock')[0].amount).toBe(Math.floor(1.6 * 0.6 * 20000)); // 19 200
    const hi = engine(['attack'], loadoutAD(4), { random: 0.999 }); // 129.98% hits: 25 996, 51 992 → explosion on the second hit
    for (let i = 0; i < 2; i++) cast(hi, 'attack', 3 * i);
    expect(hits(hi, 'perk:aftershock')[0].amount).toBe(Math.floor(1.6 * 0.99 * 20000)); // 31 680
    const r3 = engine(['attack'], loadoutAD(3));
    for (let i = 0; i < 3; i++) cast(r3, 'attack', 3 * i);
    expect(hits(r3, 'perk:aftershock')[0].amount).toBe(Math.floor(1.2 * 0.8 * 20000)); // 19 200
  });

  it('nothing without the perk; Equilibrium raises the explosion through the ability damage stat', () => {
    const none = engine(['attack'], resolve({ two: SCYTHE }));
    none.loadout.abilityDamage = 20000;
    for (let i = 0; i < 9; i++) cast(none, 'attack', 3 * i);
    expect(hits(none, 'perk:aftershock').length).toBe(0);
    const eq = resolve({ two: SCYTHE, weapon: [gizmo([['aftershock', 4], ['equilibrium', 4]])] });
    expect(eq.abilityDamage).toBe(1928);
    const e = engine(['attack'], eq);
    for (let i = 0; i < 25; i++) cast(e, 'attack', 3 * i); // 2313 per hit → 50 000 after 22 hits (tick 63)
    const a = hits(e, 'perk:aftershock');
    expect(a.length).toBe(1);
    expect(a[0].tick).toBe(63);
    expect(a[0].amount).toBe(Math.floor(1.6 * 0.8 * 1928)); // 2467
  });

  it('the stored damage survives a switch to another Aftershock weapon and resets on a weapon without it', () => {
    const withPerk = loadoutAD(4);
    const without = loadoutAD(4);
    without.aftershock = null;
    let next = withPerk;
    const e = engine(['attack'], withPerk, { cfg: { resolveWield: () => next } });
    cast(e, 'attack', 0);
    cast(e, 'attack', 3); // 48 000 stored
    e.setWield({ mainHand: null, offHand: null, twoHand: SCYTHE }); // re-resolves to `next` = still Aftershock
    cast(e, 'attack', 6);
    expect(hits(e, 'perk:aftershock').map((x) => x.tick)).toEqual([6]);
    next = without;
    e.setWield({ mainHand: null, offHand: null, twoHand: SCYTHE }); // no Aftershock: counter → 0
    next = withPerk;
    e.setWield({ mainHand: null, offHand: null, twoHand: SCYTHE });
    cast(e, 'attack', 9);
    cast(e, 'attack', 12); // 48 000 since the reset: no explosion yet
    expect(hits(e, 'perk:aftershock').map((x) => x.tick)).toEqual([6]);
    cast(e, 'attack', 15); // 72 000, but tick 15 is still inside the 6 s after the explosion at tick 6 → delayed
    expect(hits(e, 'perk:aftershock').map((x) => x.tick)).toEqual([6]);
    cast(e, 'attack', 18);
    expect(hits(e, 'perk:aftershock').map((x) => x.tick)).toEqual([6, 18]);
  });
});

describe('Crackling', () => {
  it('zaps 200% of the ability damage (rank 4) on the first attack, then on the first attack after 100 ticks', () => {
    const e = engine(['attack'], resolve({ two: SCYTHE, weapon: [gizmo([['crackling', 4]])] }));
    for (let i = 0; i <= 35; i++) cast(e, 'attack', 3 * i); // hits on ticks 0 … 105
    const z = hits(e, 'perk:crackling');
    expect(z.map((x) => x.tick)).toEqual([0, 102]); // tick 99 is still inside the cooldown, 102 is the next attack
    expect(z.every((x) => x.amount === 2 * AD && !x.crit && !x.dot)).toBe(true); // 3384
  });

  it('rank 3 (standard) is 150%; Precise and Berserk do not apply, Equilibrium does', () => {
    const e = engine(['attack'], resolve({ two: SCYTHE, body: gizmo([['crackling', 3], ['precise', 6]], false) })); // Precise on armour is ignored anyway
    cast(e, 'attack', 0);
    expect(hits(e, 'perk:crackling')[0].amount).toBe(Math.floor(1.5 * AD)); // 2538
    const eq = engine(['attack'], resolve({ two: SCYTHE, weapon: [gizmo([['crackling', 4], ['equilibrium', 4]])] }));
    cast(eq, 'attack', 0);
    expect(hits(eq, 'perk:crackling')[0].amount).toBe(2 * 1928);
    const zerk = engine(['berserk', 'attack'], resolve({ two: SCYTHE, weapon: [gizmo([['crackling', 4]])] }));
    cast(zerk, 'berserk', 0);
    cast(zerk, 'attack', 3);
    expect(zerk.hasBuff('berserk')).toBe(true);
    expect(hits(zerk, 'perk:crackling')[0].amount).toBe(2 * AD); // not × 1.75
    expect(hits(zerk, 'attack')[0].amount).toBe(Math.floor(AD * 1.2 * 1.75)); // the attack itself is
  });
});

describe('Lunging', () => {
  it('Lunging 4 on Dismember: every bleed hit × 1.22', () => {
    const e = engine(['dismember'], resolve({ two: SCYTHE, weapon: [gizmo([['lunging', 4]])] }));
    cast(e, 'dismember', 0);
    e.update(20 * T);
    const h = hits(e, 'dismember');
    expect(h.length).toBe(8);
    expect(h.every((x) => x.amount === Math.floor(AD * 0.3 * 1.22))).toBe(true); // 619 instead of 507
  });

  it('Lunging 3 on Combust: × 1.19; other bleeds untouched', () => {
    const e = engine(['combust'], resolve({ two: STAFF, weapon: [gizmo([['lunging', 3]], false)] }));
    cast(e, 'combust', 0);
    e.update(32 * T);
    const h = hits(e, 'combust');
    expect(h.length).toBe(10);
    expect(h[0].amount).toBe(Math.floor(AD * 0.3 * 1.19)); // 604
    expect(resolve({ two: SCYTHE, weapon: [gizmo([['lunging', 4]])] }).damageMultPerAbility['slaughter']).toBeUndefined();
  });
});

describe('Caroming', () => {
  it('Caroming 4 on Ricochet: +16% of the ability damage on each of the 3 hits (flat)', () => {
    const e = engine(['ricochet'], resolve({ two: BOW, weapon: [gizmo([['caroming', 4]])] }));
    cast(e, 'ricochet', 0);
    e.update(3 * T);
    const h = hits(e, 'ricochet').map((x) => x.amount);
    expect(h).toEqual([Math.floor(1764 * (0.8 + 0.16)), Math.floor(1764 * (0.175 + 0.16)), Math.floor(1764 * (0.175 + 0.16))]); // 1693, 590, 590
    const plain = engine(['ricochet'], resolve({ two: BOW }));
    cast(plain, 'ricochet', 0);
    plain.update(3 * T);
    expect(hits(plain, 'ricochet').map((x) => x.amount)).toEqual([Math.floor(1764 * 0.8), Math.floor(1764 * 0.175), Math.floor(1764 * 0.175)]); // 1411, 308, 308
  });
});

describe('Ultimatums', () => {
  it('Ultimatums 4 on Overpower: × 1.07; rank 1 × 1.04', () => {
    const e = engine(['overpower'], resolve({ two: SCYTHE, weapon: [gizmo([['ultimatums', 4]])] }));
    cast(e, 'overpower', 0);
    e.update(5 * T);
    expect(hits(e, 'overpower')[0].amount).toBe(Math.floor(AD * 5.45 * 1.07)); // 9866 instead of 9221
    const r1 = engine(['overpower'], resolve({ two: SCYTHE, body: gizmo([['ultimatums', 1]], false) }));
    cast(r1, 'overpower', 0);
    r1.update(5 * T);
    expect(hits(r1, 'overpower')[0].amount).toBe(Math.floor(AD * 5.45 * 1.04)); // 9590
  });

  it('does not touch basics', () => {
    expect(attackHit(resolve({ two: SCYTHE, weapon: [gizmo([['ultimatums', 4]])] })).amount).toBe(Math.floor(AD * 1.2));
  });
});

describe('Flanking', () => {
  it('Flanking 4 on Backhand: × 2.6 when the target is not facing the player, nothing otherwise', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['flanking', 4]])] });
    const away = engine(['backhand'], l, { cfg: { targetFacingAway: true } });
    cast(away, 'backhand', 0);
    away.update(2 * T);
    expect(hits(away, 'backhand')[0].amount).toBe(Math.floor(AD * 1.0 * 2.6)); // 4399
    const facing = engine(['backhand'], l);
    cast(facing, 'backhand', 0);
    facing.update(2 * T);
    expect(hits(facing, 'backhand')[0].amount).toBe(AD); // 1692
    const basic = engine(['attack'], l, { cfg: { targetFacingAway: true } });
    cast(basic, 'attack', 0);
    expect(hits(basic, 'attack')[0].amount).toBe(Math.floor(AD * 1.2)); // not a Flanking ability
  });
});

describe('Spendthrift', () => {
  it('Spendthrift 6: 6% chance of +6%; rank 5 does not proc at random 0.05', () => {
    // random 0.05 crits (10% base) and rolls 111%
    const six = attackHit(resolve({ two: SCYTHE, weapon: [gizmo([['spendthrift', 6]])] }), 0.05);
    expect(six.amount).toBe(Math.floor(AD * 1.11 * 1.06 * 1.5)); // 2986
    const five = attackHit(resolve({ two: SCYTHE, weapon: [gizmo([['spendthrift', 5]], false)] }), 0.05);
    expect(five.amount).toBe(Math.floor(AD * 1.11 * 1.5)); // 2817
  });
});

describe('Slayer perks', () => {
  it('Undead Slayer: +7% against undead, bleeds included; nothing against dragons', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['undead-slayer', 1]])] });
    expect(attackHit(l, 0.5, { targetType: 'undead' }).amount).toBe(Math.floor(AD * 1.2 * 1.07)); // 2172
    expect(attackHit(l, 0.5, { targetType: 'dragon' }).amount).toBe(Math.floor(AD * 1.2));
    expect(attackHit(l).amount).toBe(Math.floor(AD * 1.2));
    const e = engine(['dismember'], l, { cfg: { targetType: 'undead' } });
    cast(e, 'dismember', 0);
    e.update(20 * T);
    expect(hits(e, 'dismember')[0].amount).toBe(Math.floor(AD * 0.3 * 1.07)); // 543
  });
});

describe('Shield Bashing / Bulwark', () => {
  it('Shield Bashing 4: Debilitate × 1.6', () => {
    const e = engine(['debilitate'], resolve({ two: SCYTHE, weapon: [gizmo([['shield-bashing', 4]])] }));
    cast(e, 'debilitate', 0);
    expect(hits(e, 'debilitate')[0].amount).toBe(Math.floor(AD * 0.6 * 1.6)); // 1624 instead of 1015
  });

  it('Bulwark 2: Debilitate deals nothing, lasts +max(2, ⌊6% × 2⌋) ticks – 15 without a shield, 25 with a T90 shield', () => {
    const e = engine(['debilitate'], resolve({ two: SCYTHE, body: gizmo([['bulwark', 2]]) }));
    cast(e, 'debilitate', 0);
    expect(hits(e, 'debilitate').length).toBe(0);
    const b = e.buff('debilitate')!;
    expect(b.endTick! - b.startTick).toBe(15); // 13 + max(2, ⌊0.78⌋)
    const s = engine(['debilitate'], resolve({ main: HATCHET, off: SHIELD, shield: gizmo([['bulwark', 2]]) }));
    cast(s, 'debilitate', 0);
    const sb = s.buff('debilitate')!;
    expect(sb.endTick! - sb.startTick).toBe(25); // 23 + max(2, ⌊2.76⌋)
    const plain = engine(['debilitate'], resolve({ main: HATCHET, off: SHIELD }));
    cast(plain, 'debilitate', 0);
    const pb = plain.buff('debilitate')!;
    expect(pb.endTick! - pb.startTick).toBe(23);
  });
});

// ---------------------------------------------------------------- adrenaline perks

describe('Invigorating / Impatient / Relentless', () => {
  const noAdrenaline = { fullAdrenaline: false };

  it('Invigorating 4: the basic attack gives 9 × 1.2 = 10.8', () => {
    const e = engine(['attack'], resolve({ two: SCYTHE, weapon: [gizmo([['invigorating', 4]])] }), { cfg: noAdrenaline });
    cast(e, 'attack', 0);
    expect(e.adrenaline).toBeCloseTo(10.8, 10);
    const three = engine(['attack'], resolve({ two: SCYTHE, body: gizmo([['invigorating', 3]], false) }), { cfg: noAdrenaline });
    cast(three, 'attack', 0);
    expect(three.adrenaline).toBeCloseTo(10.35, 10);
  });

  it('Impatient 4: 36% chance of +3 on a basic; Invigorating multiplies after it (12 × 1.2 = 14.4)', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['impatient', 4], ['invigorating', 4]])] });
    const proc = engine(['attack'], l, { random: 0.3, cfg: noAdrenaline }); // 0.3 < 0.36
    cast(proc, 'attack', 0);
    expect(proc.adrenaline).toBeCloseTo(14.4, 10);
    const miss = engine(['attack'], l, { random: 0.4, cfg: noAdrenaline }); // 0.4 ≥ 0.36
    cast(miss, 'attack', 0);
    expect(miss.adrenaline).toBeCloseTo(10.8, 10);
    // Impatient 3 (standard max): 27%
    const r3 = engine(['attack'], resolve({ two: SCYTHE, weapon: [gizmo([['impatient', 3]], false)] }), { random: 0.3, cfg: noAdrenaline });
    cast(r3, 'attack', 0);
    expect(r3.adrenaline).toBeCloseTo(9, 10);
  });

  it('Invigorating only boosts the basic attack; Impatient works on every basic ability', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['impatient', 4], ['invigorating', 4]])] });
    const e = engine(['backhand'], l, { random: 0.3, cfg: noAdrenaline });
    cast(e, 'backhand', 0);
    e.update(2 * T);
    expect(e.adrenaline).toBeCloseTo(12, 10); // 9 + 3, no × 1.2
  });

  it('Relentless 5: 5% chance to keep the adrenaline of an ability that costs some, then locked for 50 ticks', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['relentless', 5]])] });
    const e = engine(['overpower', 'hurricane', 'hurricane'], l, { random: 0.04, cfg: { loop: false } }); // 0.04 < 0.05
    cast(e, 'overpower', 0);
    expect(e.adrenaline).toBe(100); // Overpower's 60 were not consumed
    cast(e, 'hurricane', 3);
    expect(e.adrenaline).toBe(75); // locked out: Hurricane costs its 25
    cast(e, 'hurricane', 50); // lockout over (Hurricane's cooldown 34 ticks is over too)
    expect(e.adrenaline).toBe(75);
    const r4 = engine(['overpower'], resolve({ two: SCYTHE, weapon: [gizmo([['relentless', 4]])] }), { random: 0.04 }); // 0.04 ≥ 0.04: no proc
    cast(r4, 'overpower', 0);
    expect(r4.adrenaline).toBe(40);
  });
});

// ---------------------------------------------------------------- cooldown / duration perks

describe('Planted Feet / Mobile / Turtling / Reflexes / Clear Headed / Preparation', () => {
  it('Planted Feet: Sunshine lasts 63 ticks and deals no periodic damage', () => {
    const pf = engine(['sunshine', 'magic'], resolve({ two: STAFF, weapon: [gizmo([['planted-feet', 1]])] }));
    cast(pf, 'sunshine', 0);
    pf.update(2 * T);
    const pfb = pf.buff('sunshine')!;
    expect(pfb.endTick! - pfb.startTick).toBe(63);
    pf.update(70 * T);
    expect(hits(pf, 'sunshine').length).toBe(0); // no periodic damage
    const plain = engine(['sunshine', 'magic'], resolve({ two: STAFF }));
    cast(plain, 'sunshine', 0);
    plain.update(2 * T);
    const pb = plain.buff('sunshine')!;
    expect(pb.endTick! - pb.startTick).toBe(50);
    plain.update(70 * T);
    expect(hits(plain, 'sunshine').length).toBe(17); // 10–20% every 3 ticks
  });

  it('Mobile: Surge 34 → 17 ticks', () => {
    const e = engine(['surge'], resolve({ two: SCYTHE, weapon: [gizmo([['mobile', 1]])] }));
    cast(e, 'surge', 0);
    expect(e.cooldownLeft('ability:surge', 0)).toBe(17);
    const plain = engine(['surge'], resolve({ two: SCYTHE }));
    cast(plain, 'surge', 0);
    expect(plain.cooldownLeft('ability:surge', 0)).toBe(34);
  });

  it('Turtling 4: Barricade 17 → 23 ticks, cooldown 100 → 140 (T90 shield)', () => {
    const e = engine(['barricade'], resolve({ main: HATCHET, off: SHIELD, body: gizmo([['turtling', 4]]) }));
    cast(e, 'barricade', 0);
    const b = e.buff('barricade')!;
    expect(b.endTick! - b.startTick).toBe(23); // ⌊17 × 1.4⌋
    expect(e.cooldownLeft('ability:barricade', 0)).toBe(140);
    const r2 = engine(['barricade'], resolve({ main: HATCHET, off: SHIELD, body: gizmo([['turtling', 2]], false) }));
    cast(r2, 'barricade', 0);
    expect(r2.buff('barricade')!.endTick! - r2.buff('barricade')!.startTick).toBe(20); // ⌊17 × 1.2⌋
    expect(r2.cooldownLeft('ability:barricade', 0)).toBe(120);
  });

  it('Reflexes halves Anticipation (17 → 8, cooldown 41 → 20); Clear Headed adds its ticks after the halving', () => {
    const r = engine(['anticipation'], resolve({ two: SCYTHE, body: gizmo([['reflexes', 1]]) }));
    cast(r, 'anticipation', 0);
    expect(r.buff('anticipation')!.endTick! - r.buff('anticipation')!.startTick).toBe(8);
    expect(r.cooldownLeft('ability:anticipation', 0)).toBe(20);
    const both = engine(['anticipation'], resolve({ two: SCYTHE, body: gizmo([['reflexes', 1], ['clear-headed', 4]]) }));
    cast(both, 'anticipation', 0);
    expect(both.buff('anticipation')!.endTick! - both.buff('anticipation')!.startTick).toBe(14); // 8 + 6, not ⌊(17 + 6) / 2⌋
  });

  it('Clear Headed: +2 / +3 / +5 / +6 ticks (wiki table) → 19 / 20 / 22 / 23', () => {
    for (const [rank, total] of [[1, 19], [2, 20], [3, 22], [4, 23]] as const) {
      const e = engine(['anticipation'], resolve({ two: SCYTHE, weapon: [gizmo([['clear-headed', rank]])] }));
      cast(e, 'anticipation', 0);
      expect(e.buff('anticipation')!.endTick! - e.buff('anticipation')!.startTick, 'rank ' + rank).toBe(total);
    }
  });

  it('Preparation perk 2: cooldown 34 → 44 ticks (duration ⌊16 × 1.3⌋ = 20 – the wiki table says 22, open)', () => {
    const e = engine(['preparation'], resolve({ main: HATCHET, off: SHIELD, body: gizmo([['preparation', 2]]) }));
    cast(e, 'preparation', 0);
    expect(e.cooldownLeft('ability:preparation', 0)).toBe(44);
    expect(e.buff('preparation')!.endTick! - e.buff('preparation')!.startTick).toBe(20);
  });

  it('Brief Respite 4: Rejuvenate / Guthix\'s Blessing cooldown × 0.8', () => {
    const l = resolve({ two: SCYTHE, body: gizmo([['brief-respite', 4]]) });
    expect(l.cooldownMult['rejuvenate']).toBeCloseTo(0.8, 10);
    expect(l.cooldownMult['guthix-s-blessing']).toBeCloseTo(0.8, 10);
  });
});

describe('resolved loadout bookkeeping', () => {
  it('every equipped perk is listed in items; Ruthless is stored but does not change damage', () => {
    const l = resolve({ two: SCYTHE, weapon: [gizmo([['ruthless', 3], ['precise', 6]])], body: gizmo([['devoted', 4]]) });
    expect([...l.items].sort()).toEqual(['devoted', 'precise', 'ruthless']);
    expect(l.ruthlessRank).toBe(3);
    expect(attackHit(l).amount).toBe(2129);
  });
});

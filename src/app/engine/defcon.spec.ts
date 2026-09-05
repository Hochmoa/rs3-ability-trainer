/**
 * Defence and Constitution abilities against docs/research/defence-constitution.md – Onslaught, Storm
 * Shards / Shatter, Reprisal recast, Transfigure lock, shield-tier durations, requirements, Limitless.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import { Ability } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const DATA = ABILITIES as unknown as Ability[];
const BY_ID = new Map(DATA.map((a) => [a.id, a]));
const T = TICK_MS;

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

const POTION: EngineEntity = { key: 'special:adrenaline-potion', kind: 'special', id: 'adrenaline-potion', name: 'Adrenaline potion', icon: '', gcd: false, adrenaline: 25, cooldownTicks: 200, sharedCooldown: 'pot', buffs: [] };

function make(ids: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}, random = 0.5, extra: EngineEntity[] = []): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map([...steps, ...extra].map((e) => [e.key, e]));
  const l = { ...defaultResolvedLoadout(), style: 'Melee' as const, has2h: true, abilityDamage: 1000, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: l });
  e.random = () => random;
  e.start(0);
  return e;
}

function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, id: string): { amount: number; tick: number; crit: boolean }[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'hit' }> => x.kind === 'hit' && x.key === 'ability:' + id).map((h) => ({ amount: h.amount, tick: h.tick, crit: h.crit }));
}

describe('constitution: Onslaught', () => {
  it('drains 25% per hit, goes on without adrenaline, ramps 18–22% per hit and lands all 26 hits', () => {
    const e = make(['onslaught']);
    cast(e, 'onslaught', 1);
    e.update(52 * T);
    const h = hits(e, 'onslaught');
    expect(h.length).toBe(26);
    expect(h[0]).toEqual({ amount: 1100, tick: 1, crit: false });
    expect(h[11].amount).toBe(1100 + 11 * 200); // hit 12: 298–340%
    expect(h[25].amount).toBe(1100 + 25 * 200);
    expect(e.adrenaline).toBe(0);
    expect(e.events.some((x) => x.kind === 'channel-cancelled')).toBe(false);
  });

  it('a potion during Onslaught cancels the rest', () => {
    const e = make(['onslaught'], {}, {}, 0.5, [POTION]);
    cast(e, 'onslaught', 1);
    e.press(POTION.key, 8 * T + 1); // off the GCD, processed on tick 9 – before the tick-9 hit lands
    e.update(12 * T);
    expect(e.events.some((x) => x.kind === 'channel-cancelled' && x.key === 'ability:onslaught' && x.hitsLost === 22)).toBe(true);
    expect(hits(e, 'onslaught').length).toBe(4);
  });
});

describe('constitution: Storm Shards and Shatter', () => {
  it('Storm Shards deals nothing and stores a stack (never an 11th); Shatter releases 80–90% per stack in one hit', () => {
    const e = make(['storm-shards', 'shatter'], {}, { prebuild: { stacks: { 'storm-shards': 9 }, spirits: [], abilities: [], prayers: [] } });
    cast(e, 'storm-shards', 1);
    expect(hits(e, 'storm-shards')).toEqual([]);
    expect(e.stack('storm-shards')).toBe(10);
    expect(e.requirementFailure(ability('storm-shards'), 4)).toContain('10 Storm Shards');
    cast(e, 'shatter', 4);
    expect(hits(e, 'shatter')).toEqual([{ amount: 8500, tick: 4, crit: false }]);
    expect(e.stack('storm-shards')).toBe(0);
    expect(e.cooldownLeft('ability:shatter', 4)).toBe(200);
  });
});

describe('defence: Reprisal, Transfigure, shields', () => {
  it('Reprisal pressed again while it runs releases it – no cost, no cooldown, inside the GCD', () => {
    const e = make(['reprisal', 'reprisal']);
    cast(e, 'reprisal', 1);
    expect(e.adrenaline).toBe(85);
    e.press('ability:reprisal', 2 * T + 1); // tick 3, still inside the GCD
    e.update(3 * T + 1);
    expect(e.hasBuff('reprisal')).toBe(false);
    expect(e.events.some((x) => x.kind === 'recast' && x.key === 'ability:reprisal')).toBe(true);
    expect(e.events.some((x) => x.kind === 'on-cooldown')).toBe(false);
    expect(e.adrenaline).toBe(85);
    expect(e.castTick).toBe(1);
  });

  it('Transfigure locks every ability for 10 ticks (Freedom included) and then makes you stun-immune; a stun-immune player cannot cast it', () => {
    const e = make(['transfigure', 'freedom', 'transfigure']);
    cast(e, 'transfigure', 1);
    e.press('ability:freedom', 3 * T + 1); // tick 4
    e.update(5 * T);
    expect(e.events.some((x) => x.kind === 'requirement' && x.key === 'ability:freedom')).toBe(true);
    expect(e.hasBuff('freedom')).toBe(false);
    e.update(11 * T);
    expect(e.hasBuff('transfigure')).toBe(false);
    cast(e, 'freedom', 12);
    expect(e.hasBuff('freedom')).toBe(true);
    expect(e.requirementFailure(ability('transfigure'), 12)).toContain('immune');
  });

  it('Reflect, Preparation and Immortality accept a defender; Barricade / Debilitate scale with the shield tier (defenders count half)', () => {
    const none = make(['reflect']);
    expect(none.requirementFailure(ability('reflect'), 0)).toContain('shield');
    const def = make(['preparation', 'immortality', 'barricade', 'debilitate'], { hasDefender: true, shieldTier: 45 });
    for (const id of ['preparation', 'immortality', 'reflect', 'barricade']) expect(def.requirementFailure(ability(id), 0)).toBeNull();
    cast(def, 'barricade', 1);
    expect(def.buff('barricade')?.endTick).toBe(1 + 12); // 8 + ⌊45/10⌋
    def.adrenaline = 100;
    cast(def, 'debilitate', 4);
    expect(def.buff('debilitate')?.endTick).toBe(4 + 18); // 13 + 1 + ⌊45/10⌋
    const shield = make(['barricade', 'debilitate'], { hasShield: true, shieldTier: 90 });
    cast(shield, 'barricade', 1);
    expect(shield.buff('barricade')?.endTick).toBe(1 + 17);
    shield.adrenaline = 100;
    cast(shield, 'debilitate', 4);
    expect(shield.buff('debilitate')?.endTick).toBe(4 + 23);
    const bare = make(['debilitate']);
    cast(bare, 'debilitate', 1);
    expect(bare.buff('debilitate')?.endTick).toBe(1 + 13);
  });

  it('Reflexes halves Anticipation to 8 ticks / 20 cooldown (floored); Limitless lets thresholds go at 15%', () => {
    const e = make(['anticipation'], { buffDurationMult: { anticipation: 0.5 }, cooldownMult: { anticipation: 0.5 } });
    cast(e, 'anticipation', 1);
    expect(e.buff('anticipation')?.endTick).toBe(1 + 8);
    expect(e.cooldownLeft('ability:anticipation', 1)).toBe(20);
    const l = make(['limitless', 'devotion']);
    l.adrenaline = 20;
    expect(l.costOf(ability('devotion')).need).toBe(50);
    l.press('ability:limitless', 1);
    l.update(T + 1);
    expect(l.costOf(ability('devotion')).need).toBe(15);
  });
});

describe('defence: Bone Shield from the pre-build', () => {
  it('a Greater Bone Shield active at the start stands in for a shield and gives Barricade its tier duration', () => {
    const e = make(['reflect', 'barricade'], {}, { prebuild: { stacks: {}, spirits: [], abilities: ['greater-bone-shield'], prayers: [] } }, 0.5, [ability('greater-bone-shield')]);
    expect(e.hasBuff('greater-bone-shield')).toBe(true);
    expect(e.requirementFailure(ability('reflect'), 0)).toBeNull();
    cast(e, 'barricade', 1);
    expect(e.buff('barricade')?.endTick).toBe(1 + 8 + Math.floor(49 / 10)); // tier ⌊50% × 99⌋ = 49
  });
});

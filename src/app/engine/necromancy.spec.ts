/**
 * Necromancy abilities against docs/research/necromancy.md – Touch of Death, Finger of Death at 6 Necrosis,
 * Bloat, Death Skulls bounces, Spectral Scythe casts, Blood Siphon, Haunted cap, spirits (Rage, poison,
 * first hits), Command Phantom Guardian × Valour, Split Soul, Life Transfer / Soul Sap requirements.
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

function make(ids: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}, random = 0.5): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const l = { ...defaultResolvedLoadout(), style: 'Necromancy' as const, hasConduit: true, abilityDamage: 1000, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true, fullAdrenaline: true, ...cfg, loadout: l });
  e.random = () => random;
  e.start(0);
  return e;
}

function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, key: string): { amount: number; tick: number; crit: boolean; dot: boolean }[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'hit' }> => x.kind === 'hit' && x.key === key).map((h) => ({ amount: h.amount, tick: h.tick, crit: h.crit, dot: h.dot }));
}

describe('necromancy: Necrosis and Finger of Death', () => {
  it('Touch of Death hits for 100% and grants 4 Necrosis; at 6+ Necrosis Finger of Death is free but still eats 6 stacks', () => {
    const e = make(['touch-of-death', 'finger-of-death'], {}, {}, 0.5);
    cast(e, 'touch-of-death', 1);
    expect(hits(e, 'ability:touch-of-death')).toEqual([{ amount: 1000, tick: 1, crit: false, dot: false }]);
    expect(e.stack('necrosis')).toBe(4);
    const f = make(['finger-of-death', 'finger-of-death', 'finger-of-death'], {}, { prebuild: { stacks: { necrosis: 12 }, spirits: [], abilities: [], prayers: [] } });
    f.adrenaline = 50;
    cast(f, 'finger-of-death', 1);
    expect(f.adrenaline).toBe(50);
    expect(f.stack('necrosis')).toBe(6);
    cast(f, 'finger-of-death', 4);
    expect(f.adrenaline).toBe(50);
    expect(f.stack('necrosis')).toBe(0);
    expect(f.costOf(ability('finger-of-death')).cost).toBe(60);
  });
});

describe('necromancy: Bloat, Death Skulls, Spectral Scythe, Blood Siphon', () => {
  it('Bloat: a 150% hit, then ten ticks of 25% of it (525% total); a recast restarts the DoT', () => {
    const e = make(['bloat', 'bloat']);
    cast(e, 'bloat', 1);
    e.update(32 * T);
    const h = hits(e, 'ability:bloat');
    expect(h[0]).toEqual({ amount: 1500, tick: 1, crit: false, dot: false });
    expect(h.slice(1).map((x) => [x.tick, x.amount])).toEqual([4, 7, 10, 13, 16, 19, 22, 25, 28, 31].map((t) => [t, 375]));
    expect(e.damageDealt).toBe(5250);
    const r = make(['bloat', 'bloat']);
    cast(r, 'bloat', 1);
    cast(r, 'bloat', 4);
    r.update(40 * T);
    const ticks = hits(r, 'ability:bloat').filter((x) => x.dot).map((x) => x.tick);
    expect(ticks).toEqual([4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]); // the tick landing on the recast still lands, then only the second cast's ticks
  });

  it('Death Skulls on one target: the skull lands three times (initial + two returns), four with Igneous Kal-Mor', () => {
    const e = make(['death-skulls']);
    cast(e, 'death-skulls', 1);
    e.update(12 * T);
    expect(hits(e, 'ability:death-skulls').map((x) => [x.tick, x.amount])).toEqual([[1, 2500], [5, 2500], [9, 2500]]);
    const ig = make(['death-skulls'], { hitsOverrides: { 'death-skulls': [0, 4, 8, 12] } });
    cast(ig, 'death-skulls', 1);
    ig.update(15 * T);
    expect(hits(ig, 'ability:death-skulls').map((x) => x.tick)).toEqual([1, 5, 9, 13]);
  });

  it('Spectral Scythe: 80%, 200%, then 250% scaled by the missing life points (up to 2x); the last cast rolls no soul', () => {
    const e = make(['spectral-scythe', 'spectral-scythe', 'spectral-scythe'], {}, { targetLifePoints: 10000 }, 0.1); // 0.1 < 25%: a soul on casts 1 and 2
    cast(e, 'spectral-scythe', 1);
    cast(e, 'spectral-scythe', 4);
    expect(hits(e, 'ability:spectral-scythe').map((x) => x.amount)).toEqual([736, 1840]); // 72 + 0.1·16 = 73.6%, 184%
    expect(e.stack('residual-souls')).toBe(2);
    // 10000 − 736 − 1840 = 7424 left → 25.76% missing
    cast(e, 'spectral-scythe', 7);
    expect(hits(e, 'ability:spectral-scythe')[2].amount).toBe(Math.floor(2300 * 1.2576 + 1e-6));
    expect(e.stack('residual-souls')).toBe(2);
  });

  it('Blood Siphon: four hits of 25% then a final 130% plus 70% of what the channel dealt', () => {
    const e = make(['blood-siphon']);
    cast(e, 'blood-siphon', 1);
    e.update(11 * T);
    expect(hits(e, 'ability:blood-siphon').map((x) => [x.tick, x.amount])).toEqual([[3, 250], [5, 250], [7, 250], [9, 250], [10, 1300 + 700]]);
  });
});

describe('necromancy: spirits', () => {
  it('Haunted adds 10% of a hit, capped at 20% of the ability damage', () => {
    const e = make(['command-vengeful-ghost', 'necromancy', 'finger-of-death'], {}, { prebuild: { stacks: { necrosis: 12 }, spirits: ['vengeful-ghost'], abilities: [], prayers: [] } });
    cast(e, 'command-vengeful-ghost', 1);
    expect(e.hasBuff('haunted')).toBe(true);
    cast(e, 'necromancy', 4);
    expect(hits(e, 'ability:necromancy')[0].amount).toBe(1100);
    cast(e, 'finger-of-death', 7);
    expect(hits(e, 'ability:finger-of-death')[0].amount).toBe(3200); // 3000 + min(300, 200)
  });

  it('Command Vengeful Ghost cannot be used again while the target is Haunted', () => {
    const e = make(['command-vengeful-ghost', 'command-vengeful-ghost'], {}, { prebuild: { stacks: {}, spirits: ['vengeful-ghost'], abilities: [], prayers: [] } });
    cast(e, 'command-vengeful-ghost', 1);
    expect(e.hasBuff('haunted')).toBe(true);
    expect(e.requirementFailure(ability('command-vengeful-ghost'), 4)).toContain('Haunted');
    cast(e, 'command-vengeful-ghost', 4);
    expect(e.events.some((x) => x.kind === 'requirement' && x.key === 'ability:command-vengeful-ghost')).toBe(true);
    expect(e.results.length).toBe(1);
  });

  it('the skeleton attacks from its 7th tick every 5 ticks, each attack adds Rage (+3%); the zombie poisons every 3 ticks', () => {
    const e = make(['conjure-skeleton-warrior', 'conjure-putrid-zombie']);
    cast(e, 'conjure-skeleton-warrior', 1);
    e.update(19 * T);
    const sk = hits(e, 'spirit:skeleton-warrior');
    expect(sk.map((x) => [x.tick, x.amount])).toEqual([[8, 250], [13, 257], [18, 265]]);
    expect(sk.every((x) => !x.crit)).toBe(true);
    cast(e, 'conjure-putrid-zombie', 20);
    e.update(35 * T);
    expect(hits(e, 'spirit:putrid-zombie').map((x) => x.tick)).toEqual([27, 33]);
    expect(hits(e, 'spirit:putrid-zombie-poison').map((x) => [x.tick, x.amount, x.dot])).toEqual([[29, 100, true], [32, 100, true], [35, 100, true]]);
  });

  it('Command Skeleton Warrior: ten spirit hits from the second tick on, building Rage with the auto attacks; Robes of the First Necromancer boost them', () => {
    // skeleton with 60 ticks left: conjured 10 ticks ago, its auto attacks land on ticks 2, 7, 12 (age 12, 17, 22)
    const e = make(['command-skeleton-warrior'], { conjureDamageMult: 1.14 }, { prebuild: { stacks: {}, spirits: ['skeleton-warrior'], abilities: [], prayers: [], remaining: { 'spirit:skeleton-warrior': 60 } } });
    cast(e, 'command-skeleton-warrior', 1);
    e.update(12 * T);
    const h = hits(e, 'ability:command-skeleton-warrior');
    expect(h.map((x) => x.tick)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const rageBefore = [1, 2, 3, 4, 6, 7, 8, 9, 10, 12]; // the auto attacks on ticks 7 and 12 add one each in between
    expect(h.map((x) => x.amount)).toEqual(rageBefore.map((r) => Math.floor(250 * 1.14 * (1 + 0.03 * r) + 1e-6)));
    expect(h.every((x) => !x.crit)).toBe(true);
    expect(e.spirits.get('skeleton-warrior')?.rage).toBe(13);
  });

  it('Command Phantom Guardian deals 50% × (1 + 0.2 × Valour) and spends the Valour; enemy attacks feed it', () => {
    const e = make(['command-phantom-guardian'], {}, { prebuild: { stacks: { valour: 25 }, spirits: ['phantom-guardian'], abilities: [], prayers: [] } });
    cast(e, 'command-phantom-guardian', 1);
    e.update(6 * T);
    expect(hits(e, 'ability:command-phantom-guardian')).toEqual([{ amount: 3000, tick: 5, crit: false, dot: false }]);
    expect(e.stack('valour')).toBe(0);
    const v = make(['necromancy'], {}, { prebuild: { stacks: {}, spirits: ['phantom-guardian'], abilities: [], prayers: [] }, enemy: { enabled: true, preset: null, name: 'x', styles: ['Melee'], pattern: 'cycle', streak: 1, intervalTicks: 5, warningTicks: 3, firstAttackTicks: 8, lifePoints: 0 } });
    v.update(28 * T);
    expect(v.stack('valour')).toBe(5); // attacks at 8, 13, 18, 23, 28
  });

  it('Life Transfer needs a spirit out; Soul Sap needs a conduit', () => {
    const e = make(['life-transfer']);
    expect(e.requirementFailure(ability('life-transfer'), 0)).toContain('spirit');
    const s = make(['soul-sap'], { hasConduit: false });
    expect(s.requirementFailure(ability('soul-sap'), 0)).toContain('conduit');
  });
});

describe('necromancy: Split Soul', () => {
  it('deals 400% of the Soul Split heal as extra damage (10% up to 2,000, 5% to 4,000)', () => {
    const e = make(['split-soul', 'necromancy', 'finger-of-death'], {}, { prebuild: { stacks: { necrosis: 12 }, spirits: [], abilities: [], prayers: ['soul-split'] } });
    cast(e, 'split-soul', 1);
    cast(e, 'necromancy', 4);
    expect(hits(e, 'ability:necromancy:split-soul')).toEqual([{ amount: 400, tick: 4, crit: false, dot: false }]);
    cast(e, 'finger-of-death', 7); // 3000: heal 200 + 50 → ×4
    expect(hits(e, 'ability:finger-of-death:split-soul')[0].amount).toBe(1000);
  });
});

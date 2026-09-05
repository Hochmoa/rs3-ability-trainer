/**
 * Ranged abilities against docs/research/ranged.md – damage numbers, Searing Winds, per-hit rolls,
 * Igneous overrides, guaranteed crits, movement cancelling Snipe, delayed Death's Swiftness.
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
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [],
    damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

/** ranged engine: ability damage 1000, mid rolls, no crits (random 0.5 ≥ 10%) */
function make(ids: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const l = { ...defaultResolvedLoadout(), style: 'Ranged' as const, weaponType: 'bow' as const, abilityDamage: 1000, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: l });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

/** press so that the cast lands on `tick` (an input is processed on the first tick at or after its arrival) */
function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, id: string): { amount: number; tick: number; crit: boolean }[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'hit' }> => x.kind === 'hit' && x.key === 'ability:' + id).map((h) => ({ amount: h.amount, tick: h.tick, crit: h.crit }));
}

describe('ranged: Galeshot and Searing Winds', () => {
  it('Galeshot hits (100%) and Searing Winds adds 20% of the ability damage to every ranged hit for 10 ticks', () => {
    const e = make(['galeshot', 'piercing-shot', 'piercing-shot']);
    cast(e, 'galeshot', 1);
    expect(hits(e, 'galeshot')).toEqual([{ amount: 1200, tick: 1, crit: false }]); // its own hit already lands under Searing Winds
    expect(e.buff('searing-winds')?.endTick).toBe(11);
    cast(e, 'piercing-shot', 4);
    expect(hits(e, 'piercing-shot').map((h) => h.amount)).toEqual([700, 700]); // 2 × 50% + 20%
    e.update(13 * T);
    cast(e, 'piercing-shot', 13);
    expect(hits(e, 'piercing-shot').slice(2).map((h) => h.amount)).toEqual([500, 500]); // buff over
  });

  it('a Snipe cast on the last Searing Winds tick keeps the bonus (snapshotted at the cast)', () => {
    const e = make(['galeshot', 'snipe']);
    cast(e, 'galeshot', 1); // Searing Winds ticks 1..10
    cast(e, 'snipe', 10);
    e.update(14 * T);
    expect(hits(e, 'snipe')).toEqual([{ amount: 3500, tick: 13, crit: false }]); // 330% + 20%
  });
});

describe('ranged: Ricochet arrows', () => {
  it('Ricochet on one target: 80% then two returning arrows of 17.5% a tick later (115% total)', () => {
    const e = make(['ricochet']);
    cast(e, 'ricochet', 1);
    e.update(3 * T);
    expect(hits(e, 'ricochet')).toEqual([{ amount: 800, tick: 1, crit: false }, { amount: 175, tick: 2, crit: false }, { amount: 175, tick: 2, crit: false }]);
    expect(e.damageDealt).toBe(1150);
  });

  it('Greater Ricochet: 80% + 2 × 17.5% + 4 × 5% = 135%; Caroming adds 4% of the ability damage per rank to every arrow', () => {
    const e = make(['greater-ricochet']);
    cast(e, 'greater-ricochet', 1);
    e.update(3 * T);
    expect(hits(e, 'greater-ricochet').map((h) => h.amount)).toEqual([800, 175, 175, 50, 50, 50, 50]);
    expect(e.damageDealt).toBe(1350);
    const c = make(['greater-ricochet'], { flatAddPerAbility: { 'greater-ricochet': 0.12 } }); // Caroming 3
    cast(c, 'greater-ricochet', 1);
    c.update(3 * T);
    expect(c.damageDealt).toBe(1350 + 7 * 120);
  });
});

describe('ranged: Deadshot, Shadow Tendrils', () => {
  it('Deadshot: 4 hits of 115%; Igneous Kal-Xil: 8 hits of 65% (the cape overrides the roll, not only the hit count)', () => {
    const e = make(['deadshot']);
    cast(e, 'deadshot', 1);
    expect(hits(e, 'deadshot').map((h) => h.amount)).toEqual([1150, 1150, 1150, 1150]);
    const ig = make(['deadshot'], { hitsOverrides: { deadshot: [0, 1, 1, 1, 1, 1, 1, 1] }, damageOverrides: { deadshot: { min: 55, max: 75 } } });
    cast(ig, 'deadshot', 1);
    ig.update(3 * T);
    const h = hits(ig, 'deadshot');
    expect(h.length).toBe(8);
    expect(h.every((x) => x.amount === 650)).toBe(true);
    expect(h.map((x) => x.tick)).toEqual([1, 2, 2, 2, 2, 2, 2, 2]);
  });

  it('Shadow Tendrils always crits (220% × 1.5) and extends Shadow Imbued by 6 ticks', () => {
    const e = make(['imbue-shadows', 'shadow-tendrils']);
    cast(e, 'imbue-shadows', 1);
    expect(e.buff('shadow-imbued')?.endTick).toBe(51);
    cast(e, 'shadow-tendrils', 4);
    expect(hits(e, 'shadow-tendrils')).toEqual([{ amount: 3300, tick: 4, crit: true }]);
    expect(e.buff('shadow-imbued')?.endTick).toBe(57);
  });
});

describe('ranged: Snipe and movement', () => {
  it('Escape during Snipe cancels the channel (the cooldown stays); nightmare gauntlets allow moving', () => {
    const e = make(['snipe', 'escape']);
    cast(e, 'snipe', 1);
    e.press('ability:escape', 2 * T + 1); // off the GCD, processed on tick 3
    e.update(6 * T);
    expect(e.events.some((x) => x.kind === 'channel-cancelled' && x.key === 'ability:snipe' && x.hitsLost === 1)).toBe(true);
    expect(hits(e, 'snipe')).toEqual([]);
    expect(e.cooldownLeft('ability:snipe', 3)).toBe(98);

    const g = make(['snipe', 'escape'], { items: new Set(['nightmare-gauntlets']) });
    cast(g, 'snipe', 1);
    g.press('ability:escape', 2 * T + 1);
    g.update(6 * T);
    expect(g.events.some((x) => x.kind === 'channel-cancelled')).toBe(false);
    expect(hits(g, 'snipe')).toEqual([{ amount: 3300, tick: 4, crit: false }]);
  });
});

describe("ranged: Death's Swiftness window", () => {
  it('starts one tick after the cast, lasts 50 ticks (63 with Planted Feet) and a Snipe cast on its last tick keeps the 1.5x', () => {
    const e = make(['death-s-swiftness', 'piercing-shot', 'snipe']);
    cast(e, 'death-s-swiftness', 1);
    expect(e.hasBuff('death-s-swiftness')).toBe(false); // not yet on the cast tick
    e.update(2 * T);
    expect(e.buff('death-s-swiftness')).toMatchObject({ startTick: 2, endTick: 52 });
    cast(e, 'piercing-shot', 4);
    expect(hits(e, 'piercing-shot').map((h) => h.amount)).toEqual([750, 750]);
    e.update(51 * T);
    cast(e, 'snipe', 51); // last buffed tick
    e.update(55 * T);
    expect(hits(e, 'snipe')).toEqual([{ amount: 4950, tick: 54, crit: false }]);
    cast(e, 'piercing-shot', 55);
    expect(hits(e, 'piercing-shot').slice(2).map((h) => h.amount)).toEqual([500, 500]);

    const pf = make(['death-s-swiftness'], { items: new Set(['planted-feet']) });
    cast(pf, 'death-s-swiftness', 1);
    pf.update(2 * T);
    expect(pf.buff('death-s-swiftness')?.endTick).toBe(65);
  });

  it('Corruption Shot ticks are never multiplied by Death\'s Swiftness', () => {
    const e = make(['death-s-swiftness', 'corruption-shot']);
    cast(e, 'death-s-swiftness', 1);
    e.adrenaline = 50; // the ultimate drained it
    cast(e, 'corruption-shot', 4);
    e.update(14 * T);
    expect(hits(e, 'corruption-shot').map((h) => h.amount)).toEqual([1000, 800, 600, 400, 200]);
  });
});

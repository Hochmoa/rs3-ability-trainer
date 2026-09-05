/**
 * The automatic basic attack in full manual (docs/research/mechanics.md §3): "used whenever other abilities are not being
 * cast" – when the GCD ends with nothing pressed or queued, the wielded style's basic attack fires and starts its own GCD,
 * so a late press costs a whole GCD, not a tick. Scoring keeps the tick the step was due at.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import { Ability } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { AUTO_ATTACK_KEY, EngineConfig, EngineEntity, EngineEvent, TICK_MS, TrainerEngine } from './trainer-engine';

const DATA = ABILITIES as unknown as Ability[];
const BY_ID = new Map(DATA.map((a) => [a.id, a]));
const T = TICK_MS;

function ability(id: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  const a = BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [], damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
    ...extra,
  };
}

/** necromancy engine with the four basic attacks in the catalog (like the app's), auto-attacks on unless the config says otherwise */
function make(steps: EngineEntity[], cfg: Partial<EngineConfig> = {}, loadout: Partial<ResolvedLoadout> = {}): TrainerEngine {
  const catalog = new Map(steps.map((e) => [e.key, e]));
  for (const id of ['attack', 'ranged', 'magic', 'necromancy']) if (!catalog.has('ability:' + id)) catalog.set('ability:' + id, ability(id));
  const l = { ...defaultResolvedLoadout(), style: 'Necromancy' as const, hasConduit: true, abilityDamage: 1000, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: false, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: l });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

/** press so that the input is processed on `tick`, advance to the end of that tick */
function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function autoAttacks(e: TrainerEngine): Extract<EngineEvent, { kind: 'auto-attack' }>[] {
  return e.events.filter((x): x is Extract<EngineEvent, { kind: 'auto-attack' }> => x.kind === 'auto-attack');
}

function hits(e: TrainerEngine, key: string): { amount: number; tick: number }[] {
  return e.events.filter((x): x is Extract<EngineEvent, { kind: 'hit' }> => x.kind === 'hit' && x.key === key).map((h) => ({ amount: h.amount, tick: h.tick }));
}

const TOD = ability('touch-of-death');
const SAP = ability('soul-sap');
const NECRO = ability('necromancy');
const SIPHON = ability('blood-siphon');

describe('automatic basic attack: a late press costs a whole GCD', () => {
  it('fires the wielded basic attack on the GCD end tick when nothing was pressed; the late ability waits for its GCD and is scored from the tick it was due', () => {
    const e = make([TOD, SAP], { fullAdrenaline: false });
    cast(e, 'touch-of-death', 1); // GCD ends at tick 4
    e.press('ability:soul-sap', 4 * T + 1); // arrives on tick 5 – one tick late
    e.update(7 * T + 1);
    expect(autoAttacks(e)).toEqual([{ kind: 'auto-attack', key: 'ability:necromancy', tick: 4, matched: false, expected: 'ability:soul-sap', dueTick: 4 }]);
    expect(hits(e, AUTO_ATTACK_KEY)).toEqual([{ amount: 1000, tick: 4 }]); // 90–110% at the mid roll
    expect(e.results.map((r) => r.key)).toEqual(['ability:touch-of-death', 'ability:soul-sap']); // the basic attack is not a rotation result
    expect(e.results[1]).toMatchObject({ outcome: 'late', lateTicks: 3, firedAtTick: 7, autoAttackBefore: true, wrong: 0 });
    expect(e.adrenaline).toBe(27); // ToD, the basic attack and Soul Sap generate 9% each
  });

  it('a press on the GCD end tick is not late and nothing slips in', () => {
    const e = make([TOD, SAP]);
    cast(e, 'touch-of-death', 1);
    cast(e, 'soul-sap', 4);
    expect(autoAttacks(e)).toEqual([]);
    expect(e.results[1]).toMatchObject({ key: 'ability:soul-sap', outcome: 'perfect', firedAtTick: 4 });
    expect(e.results[1].autoAttackBefore).toBeUndefined();
  });

  it('two idle GCDs: two basic attacks, the press is late from the first due tick', () => {
    const e = make([TOD, SAP]);
    cast(e, 'touch-of-death', 1);
    e.press('ability:soul-sap', 7 * T + 1); // tick 8
    e.update(10 * T + 1);
    expect(autoAttacks(e).map((a) => [a.tick, a.dueTick])).toEqual([[4, 4], [7, 4]]);
    expect(e.results[1]).toMatchObject({ key: 'ability:soul-sap', outcome: 'late', lateTicks: 6, firedAtTick: 10, autoAttackBefore: true });
  });

  it('a queued press blocks it, and so does a running channel – after the channel it fires at the channel end', () => {
    const q = make([TOD, SAP]);
    cast(q, 'touch-of-death', 1);
    cast(q, 'soul-sap', 2); // queued for tick 4
    q.update(4 * T + 1);
    expect(autoAttacks(q)).toEqual([]);
    expect(q.results[1]).toMatchObject({ key: 'ability:soul-sap', outcome: 'perfect', firedAtTick: 4 });

    const c = make([SIPHON, SAP]);
    cast(c, 'blood-siphon', 1); // 9-tick channel: hits until tick 10, the GCD ends at 4
    c.update(9 * T + 1);
    expect(autoAttacks(c)).toEqual([]);
    c.press('ability:soul-sap', 10 * T + 1); // tick 11, a tick after the channel
    c.update(13 * T + 1);
    expect(autoAttacks(c)).toEqual([{ kind: 'auto-attack', key: 'ability:necromancy', tick: 10, matched: false, expected: 'ability:soul-sap', dueTick: 10 }]);
    expect(c.results[1]).toMatchObject({ key: 'ability:soul-sap', outcome: 'late', lateTicks: 3, firedAtTick: 13, autoAttackBefore: true });
  });

  it('an "(auto)" step is completed by the basic attack itself', () => {
    const e = make([TOD, NECRO, SAP]);
    cast(e, 'touch-of-death', 1);
    e.update(4 * T + 1);
    expect(autoAttacks(e)).toEqual([{ kind: 'auto-attack', key: 'ability:necromancy', tick: 4, matched: true, expected: 'ability:necromancy', dueTick: 4 }]);
    expect(e.results[1]).toMatchObject({ key: 'ability:necromancy', outcome: 'perfect', firedAtTick: 4, auto: true, autoAttack: true });
    cast(e, 'soul-sap', 7);
    expect(e.results[2]).toMatchObject({ key: 'ability:soul-sap', outcome: 'perfect', firedAtTick: 7 });
    expect(e.results[2].autoAttackBefore).toBeUndefined();
  });

  it('a basic-attack step is satisfied by the basic attack of whatever style is wielded', () => {
    const e = make([NECRO, SAP], {}, { style: 'Melee', has2h: true });
    cast(e, 'attack', 1);
    expect(e.results[0]).toMatchObject({ key: 'ability:attack', outcome: 'perfect', firedAtTick: 1 });
    expect(e.events.some((x) => x.kind === 'wrong-fired')).toBe(false);
  });

  it('does nothing before the first cast, with autoAttacks off, or when the catalog has no basic attack for the style', () => {
    const idle = make([TOD]);
    idle.update(10 * T);
    expect(autoAttacks(idle)).toEqual([]);
    const off = make([TOD, SAP], { autoAttacks: false });
    cast(off, 'touch-of-death', 1);
    off.press('ability:soul-sap', 4 * T + 1);
    off.update(5 * T + 1);
    expect(autoAttacks(off)).toEqual([]);
    expect(off.results[1]).toMatchObject({ outcome: 'late', lateTicks: 1, firedAtTick: 5 });
    const none = new TrainerEngine([TOD, SAP], new Map([[TOD.key, TOD], [SAP.key, SAP]]), { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: false, fullAdrenaline: true, hitChanceDisabled: true, loadout: { ...defaultResolvedLoadout(), style: 'Necromancy', hasConduit: true, abilityDamage: 1000, items: new Set() } });
    none.start(0);
    cast(none, 'touch-of-death', 1);
    none.update(8 * T);
    expect(autoAttacks(none)).toEqual([]);
  });

  it('with ability queueing off the late press lands inside the basic attack\'s GCD and is ignored like any other press in a GCD', () => {
    const e = make([TOD, SAP], { abilityQueueing: false });
    cast(e, 'touch-of-death', 1);
    e.press('ability:soul-sap', 4 * T + 1); // tick 5: the basic attack fired on tick 4
    e.update(5 * T + 1);
    expect(autoAttacks(e)).toHaveLength(1);
    expect(e.events.at(-1)).toMatchObject({ kind: 'too-early', key: 'ability:soul-sap', ticksEarly: 2 });
    expect(e.results).toHaveLength(1);
    cast(e, 'soul-sap', 7);
    expect(e.results[1]).toMatchObject({ key: 'ability:soul-sap', outcome: 'late', lateTicks: 3, firedAtTick: 7, autoAttackBefore: true });
  });
});

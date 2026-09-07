/**
 * Threads of Fate over a group: "single-target Necromancy abilities to also hit up to 4 additional enemies within 4
 * tiles of the target", and Soul Sap then "will generate multiple stacks of Residual Souls, one per target hit"
 * (runescape.wiki/w/Threads_of_Fate). The enemy panel's target count says how many stand together.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_ENEMY, EnemyConfig } from '../core/models';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;
const SOUL_SAP: EngineEntity = { key: 'ability:soul-sap', id: 'soul-sap', kind: 'ability', name: 'Soul Sap', icon: '', gcd: true, style: 'Necromancy', abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, damageMin: 100, damageMax: 100, buffs: [] };
const THREADS: EngineEntity = { key: 'ability:threads-of-fate', id: 'threads-of-fate', kind: 'ability', name: 'Threads of Fate', icon: '', gcd: true, style: 'Necromancy', abilityType: 'Incantation', adrenaline: 0, cooldownTicks: 75, buffs: [] };

function make(targets: number, steps: EngineEntity[]): TrainerEngine {
  const enemy: EnemyConfig = { ...DEFAULT_ENEMY, targets };
  const cfg: EngineConfig = {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, enemy,
    loadout: { ...defaultResolvedLoadout(), style: 'Necromancy', hasConduit: true, abilityDamage: 1000 },
  };
  const e = new TrainerEngine(steps, new Map(steps.map((x) => [x.key, x] as const)), cfg);
  e.random = () => 0.5;
  e.start(0);
  return e;
}
function cast(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}
const hits = (e: TrainerEngine, key: string) => e.events.filter((x) => x.kind === 'hit' && x.key === key);

describe('Threads of Fate over several targets', () => {
  it('Soul Sap hits every enemy it reaches and yields one Residual Soul per target', () => {
    const e = make(5, [THREADS, SOUL_SAP]);
    cast(e, 'ability:threads-of-fate', 1);
    cast(e, 'ability:soul-sap', 4);
    e.update(10 * T);
    expect(hits(e, 'ability:soul-sap')).toHaveLength(5);
    expect(e.stack('residual-souls')).toBe(3); // three is the cap without a soulbound lantern
  });

  it('stops at four extra targets however many stand there', () => {
    const e = make(9, [THREADS, SOUL_SAP]);
    cast(e, 'ability:threads-of-fate', 1);
    cast(e, 'ability:soul-sap', 4);
    e.update(10 * T);
    expect(hits(e, 'ability:soul-sap')).toHaveLength(5);
  });

  it('a single target, or no Threads of Fate, is one hit', () => {
    const single = make(1, [THREADS, SOUL_SAP]);
    cast(single, 'ability:threads-of-fate', 1);
    cast(single, 'ability:soul-sap', 4);
    single.update(10 * T);
    expect(hits(single, 'ability:soul-sap')).toHaveLength(1);

    const noThreads = make(5, [SOUL_SAP]);
    cast(noThreads, 'ability:soul-sap', 1);
    noThreads.update(6 * T);
    expect(hits(noThreads, 'ability:soul-sap')).toHaveLength(1);
  });
});

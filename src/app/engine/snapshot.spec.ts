/**
 * A boss is a chain of phases: "Phase 2" starts with the adrenaline, stacks, conjures and buffs "Phase 1" ended with,
 * never from an empty bar. `snapshotPrebuild()` turns the state a session ends in into the pre-build of the next one
 * (the Train page's "Next from here").
 */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;
const ability = (id: string, extra: Partial<EngineEntity> = {}): EngineEntity => ({
  key: 'ability:' + id, id, kind: 'ability', name: id, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9,
  cooldownTicks: 0, damageMin: 100, damageMax: 100, buffs: [], ...extra,
});
const CONJURE = ability('conjure-skeleton-warrior', { adrenaline: 0 });
const SPLIT = ability('split-soul', { abilityType: 'Incantation', adrenaline: 0 });
const TOUCH = ability('touch-of-death');
const PRAYER: EngineEntity = { key: 'prayer:sorrow', id: 'sorrow', kind: 'prayer', name: 'Sorrow', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };

function make(steps: EngineEntity[]): TrainerEngine {
  const cfg: EngineConfig = {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: false, hitChanceDisabled: true,
    loadout: { ...defaultResolvedLoadout(), style: 'Necromancy', hasConduit: true, abilityDamage: 1000, startAdrenaline: 20 },
  };
  const e = new TrainerEngine(steps, new Map(steps.map((s) => [s.key, s] as const)), cfg);
  e.random = () => 0.5;
  e.start(0);
  return e;
}
function press(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

describe('snapshotPrebuild', () => {
  it('carries the adrenaline, the stacks, the conjures with their remaining time, the self buffs and the prayers', () => {
    const e = make([PRAYER, CONJURE, SPLIT, TOUCH]);
    press(e, PRAYER.key, 1);
    press(e, CONJURE.key, 2);
    press(e, SPLIT.key, 5);
    press(e, TOUCH.key, 8);
    e.update(12 * T);

    const pb = e.snapshotPrebuild();
    expect(pb.prayers).toEqual(['sorrow']);
    expect(pb.spirits).toEqual(['skeleton-warrior']);
    expect(pb.remaining?.['spirit:skeleton-warrior']).toBeGreaterThan(0);
    expect(pb.stacks['necrosis']).toBe(4); // Touch of Death grants four
    expect(pb.abilities).toContain('split-soul');
    expect(pb.adrenaline).toBe(e.adrenaline);
  });

  it('leaves out what has run out and stays empty for a session that did nothing', () => {
    const e = make([TOUCH]);
    const pb = e.snapshotPrebuild();
    expect(pb.spirits).toEqual([]);
    expect(pb.abilities).toEqual([]);
    expect(pb.stacks).toEqual({});
    expect(pb.remaining).toBeUndefined();
    expect(pb.adrenaline).toBe(20);
  });
});

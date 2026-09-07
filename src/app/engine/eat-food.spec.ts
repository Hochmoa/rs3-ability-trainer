/**
 * Eating during a rotation. Solid food costs 3% adrenaline since the Combat Style Modernisation of 2 March 2026
 * ("Consuming food: -3% (only when fighting a target)", runescape.wiki/w/Adrenaline); before it the penalty was 10%,
 * which is why the guides still reach for brews and blubber, whose cost is zero. Life points are not simulated, so
 * the action only charges the adrenaline.
 */
import { describe, expect, it } from 'vitest';
import { ACTIONS } from '../core/models';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;
const EAT: EngineEntity = { key: 'action:eat-food', id: 'eat-food', kind: 'action', name: 'Eat food', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
const A: EngineEntity = { key: 'ability:a', id: 'a', kind: 'ability', name: 'a', icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, damageMin: 100, damageMax: 100, buffs: [] };

function make(steps: EngineEntity[]): TrainerEngine {
  const cfg: EngineConfig = {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: false, hitChanceDisabled: true,
    loadout: { ...defaultResolvedLoadout(), style: 'Melee', abilityDamage: 1000, startAdrenaline: 50 },
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

describe('eating', () => {
  it('is a client action of its own', () => {
    expect(ACTIONS.map((a) => a.id)).toContain('eat-food');
  });

  it('costs 3% adrenaline and does not start the global cooldown', () => {
    const e = make([EAT, A]);
    press(e, EAT.key, 1);
    expect(e.adrenaline).toBe(47);
    expect(e.index).toBe(1);
    // the ability right after it is on time: eating is off the GCD
    press(e, A.key, 2);
    expect(e.events.filter((x) => x.kind === 'fired').length).toBe(2);
    expect(e.adrenaline).toBe(56);
  });

  it('never pushes the adrenaline below zero', () => {
    const e = make([EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT, EAT]);
    for (let i = 1; i <= 18; i++) press(e, EAT.key, i); // 18 x 3% against 50% to start with
    expect(e.adrenaline).toBe(0);
  });
});

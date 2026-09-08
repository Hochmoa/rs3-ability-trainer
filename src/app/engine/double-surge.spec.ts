/** Double Surge: Surge has a second charge with its own cooldown (runescape.wiki/w/Double_Surge) – an unlockable every loadout has, so the resolver always grants it. */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;
const SURGE: EngineEntity = { key: 'ability:surge', id: 'surge', kind: 'ability', name: 'Surge', icon: '', gcd: false, abilityType: 'Basic', adrenaline: 0, cooldownTicks: 34, buffs: [] };
const A: EngineEntity = { key: 'ability:a', id: 'a', kind: 'ability', name: 'a', icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, buffs: [] };

function make(chargesAdd: Record<string, number>): TrainerEngine {
  const cfg: EngineConfig = { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: true, loadout: { ...defaultResolvedLoadout(), chargesAdd }, hitChanceDisabled: true };
  const e = new TrainerEngine([SURGE, SURGE, A], new Map([[SURGE.key, SURGE], [A.key, A]]), cfg);
  e.random = () => 0.99;
  e.start(0);
  return e;
}
function press(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

describe('Double Surge', () => {
  it('with the second charge Surge fires twice in a row and the third press waits for the first charge', () => {
    const e = make({ surge: 1 });
    press(e, SURGE.key, 1);
    press(e, SURGE.key, 2);
    expect(e.events.filter((x) => x.kind === 'on-cooldown')).toEqual([]);
    expect(e.index).toBe(2);
    expect(e.cooldownLeft(SURGE.key, 3)).toBe(1 + 34 - 3);
  });

  it('without it the second Surge is on cooldown', () => {
    const e = make({});
    press(e, SURGE.key, 1);
    press(e, SURGE.key, 2);
    expect(e.events.some((x) => x.kind === 'on-cooldown')).toBe(true);
    expect(e.index).toBe(1);
  });
});

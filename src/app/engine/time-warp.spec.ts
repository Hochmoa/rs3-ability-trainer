/**
 * Kerapac's Time Warp, the extra action button of phase 2 on: ten seconds after the press adrenaline and every ability
 * cooldown go back to what they were, and the button itself has the game's 30 s cooldown (runescape.wiki/w/Time_Warp).
 */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineEntity, TICK_MS, TIME_WARP_ACTION, TIME_WARP_COOLDOWN_TICKS, TIME_WARP_TICKS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;
const WARP = 'action:' + TIME_WARP_ACTION;

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 40, damageMin: 100, damageMax: 100, buffs: [], ...extra };
}
const warp: EngineEntity = { key: WARP, id: TIME_WARP_ACTION, kind: 'action', name: 'Time Warp', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };

function make(steps: EngineEntity[]): TrainerEngine {
  const catalog = new Map(steps.map((e) => [e.key, e] as const));
  const e = new TrainerEngine(steps, catalog, {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: false, hitChanceDisabled: true,
    loadout: { ...defaultResolvedLoadout(), style: 'Magic', abilityDamage: 1000, startAdrenaline: 50 },
  });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

describe('Time Warp', () => {
  it('gives adrenaline and ability cooldowns back after 17 ticks, and the button then sits on its own 30 s cooldown', () => {
    const a = ability('a');
    const b = ability('b');
    const e = make([a, warp, b, ability('c')]); // c is never pressed: the session must still run when the reset comes
    e.press('a', 1);
    e.update(2 * T); // a cast on tick 1: adrenaline 59, a ready on tick 41
    e.press(WARP, 2 * T);
    e.update(3 * T);
    expect(e.timeWarpResetTick).toBe(2 + TIME_WARP_TICKS);
    expect(e.cooldownLeft(WARP, 2)).toBe(TIME_WARP_COOLDOWN_TICKS);
    e.press('b', 4 * T);
    e.update(20 * T); // b cast on tick 4: adrenaline 68; the reset on tick 19 puts it back to 59 and a's cooldown back to 39 left
    expect(e.adrenaline).toBe(59);
    expect(e.cooldownLeft('a', 19)).toBe(39);
    expect(e.timeWarpResetTick).toBeNull();
    expect(e.cooldownLeft(WARP, 19)).toBe(TIME_WARP_COOLDOWN_TICKS - 17); // the reset does not touch the button's own cooldown
  });

  it('a second press while the button cools down is refused as on cooldown', () => {
    const a = ability('a');
    const e = make([warp, a, warp]);
    e.press(WARP, 1);
    e.update(2 * T);
    e.press('a', 2 * T);
    e.update(6 * T);
    e.press(WARP, 6 * T);
    e.update(7 * T);
    expect(e.events.filter((x) => x.kind === 'time-warp' && x.phase === 'start')).toHaveLength(1);
    expect(e.events.some((x) => x.kind === 'on-cooldown' && x.key === WARP)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { EngineConfig, TrainerEngine } from './trainer-engine';

const base: EngineConfig = { pingMs: 0, jitterMs: 0, queueWindowTicks: 1, loop: false };

/** Engine with 3 steps, started at t=0, first ability fired at tick 1 (t=600) → GCD ends at tick 4 (t=2400). */
function afterFirstFire(cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const e = new TrainerEngine(['a', 'b', 'c'], { ...base, ...cfg });
  e.start(0);
  e.press('a', 100);
  e.update(600);
  expect(e.results.length).toBe(1);
  expect(e.castTick).toBe(1);
  e.events.length = 0;
  return e;
}

describe('TrainerEngine', () => {
  it('fires the first ability at the next tick after the press', () => {
    const e = new TrainerEngine(['a', 'b'], base);
    e.start(0);
    e.press('a', 100);
    e.update(599);
    expect(e.results.length).toBe(0);
    expect(e.isQueued).toBe(true);
    e.update(600);
    expect(e.results[0]).toMatchObject({ abilityId: 'a', outcome: 'perfect', firedAtTick: 1 });
    expect(e.index).toBe(1);
    expect(e.gcdEndTick).toBe(4);
  });

  it('queues a press in the last tick of the GCD and fires exactly when the GCD ends', () => {
    const e = afterFirstFire();
    e.press('b', 1900); // tick 4 = last GCD tick
    e.update(1900);
    expect(e.events[0]).toMatchObject({ kind: 'queued', fireTick: 4, marginMs: 500 });
    e.update(2399);
    expect(e.results.length).toBe(1);
    e.update(2400);
    expect(e.results[1]).toMatchObject({ abilityId: 'b', outcome: 'perfect', lateTicks: 0, offsetMs: 500, firedAtTick: 4 });
  });

  it('treats a press two ticks before the GCD end as too early with a 1-tick window', () => {
    const e = afterFirstFire();
    e.press('b', 1300); // tick 3
    e.update(1300);
    expect(e.events[0]).toMatchObject({ kind: 'too-early', ticksEarly: 1 });
    expect(e.isQueued).toBe(false);
    e.update(2400);
    expect(e.results.length).toBe(1);
    // the late follow-up press records the too-early count on the step
    e.press('b', 2500);
    e.update(3000);
    expect(e.results[1]).toMatchObject({ outcome: 'late', lateTicks: 1, tooEarly: 1 });
  });

  it('accepts the same early press with a 3-tick window (whole GCD)', () => {
    const e = afterFirstFire({ queueWindowTicks: 3 });
    e.press('b', 700); // tick 2, first tick of the GCD
    e.update(700);
    expect(e.events[0]).toMatchObject({ kind: 'queued', fireTick: 4 });
    e.update(2400);
    expect(e.results[1]).toMatchObject({ outcome: 'perfect' });
  });

  it('fires late presses at the tick they are processed', () => {
    const e = afterFirstFire();
    e.press('b', 2500); // tick 5
    e.update(2500);
    expect(e.results.length).toBe(1);
    e.update(3000);
    expect(e.results[1]).toMatchObject({ outcome: 'late', lateTicks: 1, offsetMs: 100, firedAtTick: 5 });
    e.press('c', 4300); // GCD ends tick 8 (t=4800), press processed at tick 8 → perfect
    e.update(4800);
    expect(e.results[2]).toMatchObject({ outcome: 'perfect', firedAtTick: 8 });
  });

  it('ping pushes a press across the tick boundary', () => {
    const e = afterFirstFire({ pingMs: 60 });
    e.press('b', 2380); // arrives at 2440 → tick 5 instead of 4
    e.update(2440);
    e.update(3000);
    expect(e.results[1]).toMatchObject({ outcome: 'late', lateTicks: 1, offsetMs: 40 });
  });

  it('jitter is bounded by jitterMs', () => {
    const e = new TrainerEngine(['a', 'b'], { ...base, pingMs: 60, jitterMs: 20 });
    e.random = () => 1; // +20 ms
    e.start(0);
    e.press('a', 520); // arrival 600 → tick 1
    e.update(600);
    expect(e.results[0].firedAtTick).toBe(1);
    e.random = () => 0; // -20 ms
    e.press('b', 2360); // arrival 2400 → tick 4 → perfect
    e.update(2400);
    expect(e.results[1]).toMatchObject({ outcome: 'perfect' });
  });

  it('counts wrong keys without firing anything', () => {
    const e = afterFirstFire();
    e.press('c', 1900);
    e.update(1900);
    expect(e.events[0]).toMatchObject({ kind: 'wrong', abilityId: 'c', expected: 'b' });
    expect(e.isQueued).toBe(false);
    e.press('b', 2000);
    e.update(2400);
    expect(e.results[1]).toMatchObject({ outcome: 'perfect', wrong: 1 });
  });

  it('finishes after the last step unless looping', () => {
    const e = afterFirstFire();
    e.press('b', 2000);
    e.update(2400);
    e.press('c', 4000);
    e.update(4200);
    expect(e.state).toBe('finished');
    expect(e.events.at(-1)).toMatchObject({ kind: 'finished' });
    expect(e.currentAbility).toBeUndefined();

    const l = afterFirstFire({ loop: true });
    l.press('b', 2000);
    l.update(2400);
    l.press('c', 4000);
    l.update(4200);
    expect(l.state).toBe('running');
    expect(l.index).toBe(0);
    expect(l.currentAbility).toBe('a');
  });

  it('reports tick and GCD phases', () => {
    const e = afterFirstFire();
    expect(e.tickPhase(900)).toBeCloseTo(0.5);
    expect(e.gcdPhase(600)).toBe(0);
    expect(e.gcdPhase(1500)).toBeCloseTo(0.5);
    expect(e.gcdPhase(2400)).toBe(1);
    expect(e.gcdRemainingMs(1200)).toBe(1200);
  });
});

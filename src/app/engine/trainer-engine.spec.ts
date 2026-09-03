import { describe, expect, it } from 'vitest';
import { EngineConfig, TrainerEngine } from './trainer-engine';

const off: EngineConfig = { pingMs: 0, jitterMs: 0, abilityQueueing: false, loop: false };
const on: EngineConfig = { ...off, abilityQueueing: true };

/** Engine with steps a,b,c started at t=0; 'a' fired at tick 1 (t=600) → GCD ends at tick 4 (t=2400). */
function afterFirstFire(cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const e = new TrainerEngine(['a', 'b', 'c'], { ...off, ...cfg });
  e.start(0);
  e.press('a', 100);
  e.update(600);
  expect(e.results.length).toBe(1);
  expect(e.castTick).toBe(1);
  e.events.length = 0;
  return e;
}

describe('TrainerEngine – common', () => {
  it('casts the first ability at the next tick after the press', () => {
    const e = new TrainerEngine(['a', 'b'], off);
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

  it('a press in the last GCD tick casts exactly when the GCD ends (both modes)', () => {
    for (const cfg of [off, on]) {
      const e = afterFirstFire(cfg);
      e.press('b', 1900); // processed at tick 4 = gcdEnd
      e.update(1900);
      expect(e.events[0]).toMatchObject({ kind: 'queued', fireTick: 4, marginMs: 500 });
      e.update(2399);
      expect(e.results.length).toBe(1);
      e.update(2400);
      expect(e.results[1]).toMatchObject({ abilityId: 'b', outcome: 'perfect', lateTicks: 0, offsetMs: 500, firedAtTick: 4 });
    }
  });

  it('late presses cast at the tick they are processed', () => {
    const e = afterFirstFire();
    e.press('b', 2500); // tick 5
    e.update(2500);
    expect(e.results.length).toBe(1);
    e.update(3000);
    expect(e.results[1]).toMatchObject({ outcome: 'late', lateTicks: 1, offsetMs: 100, firedAtTick: 5 });
    e.press('c', 4300); // GCD ends tick 8 (t=4800): processed at tick 8 → perfect
    e.update(4800);
    expect(e.results[2]).toMatchObject({ outcome: 'perfect', firedAtTick: 8 });
  });

  it('ping pushes a press across the tick boundary', () => {
    const e = afterFirstFire({ pingMs: 60 });
    e.press('b', 2380); // arrives 2440 → tick 5 instead of 4
    e.update(2440);
    e.update(3000);
    expect(e.results[1]).toMatchObject({ outcome: 'late', lateTicks: 1, offsetMs: 40 });
  });

  it('jitter is bounded by jitterMs', () => {
    const e = new TrainerEngine(['a', 'b'], { ...off, pingMs: 60, jitterMs: 20 });
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

  it('a wrong ability pressed after the GCD casts, starts a GCD and keeps the step', () => {
    const e = afterFirstFire();
    e.press('c', 2500); // tick 5, GCD over → c casts
    e.update(3000);
    expect(e.events[0]).toMatchObject({ kind: 'queued', abilityId: 'c', expected: 'b' });
    expect(e.events[1]).toMatchObject({ kind: 'wrong-fired', abilityId: 'c', expected: 'b', tick: 5 });
    expect(e.index).toBe(1);
    expect(e.castTick).toBe(5);
    e.press('b', 4700); // new GCD ends tick 8 (t=4800): last tick → perfect, but wrong=1 on the step
    e.update(4800);
    expect(e.results[1]).toMatchObject({ abilityId: 'b', outcome: 'perfect', wrong: 1 });
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

describe('TrainerEngine – ability queueing OFF', () => {
  it('ignores the expected ability pressed before the last tick (too early)', () => {
    const e = afterFirstFire();
    e.press('b', 1300); // tick 3
    e.update(1300);
    expect(e.events[0]).toMatchObject({ kind: 'too-early', ticksEarly: 1 });
    expect(e.isQueued).toBe(false);
    e.update(2400);
    expect(e.results.length).toBe(1);
    e.press('b', 2500);
    e.update(3000);
    expect(e.results[1]).toMatchObject({ outcome: 'late', lateTicks: 1, tooEarly: 1 });
  });

  it('ignores a wrong ability pressed during the GCD', () => {
    const e = afterFirstFire();
    e.press('c', 1300);
    e.update(1300);
    expect(e.events[0]).toMatchObject({ kind: 'wrong', abilityId: 'c', expected: 'b' });
    expect(e.castTick).toBe(1);
    e.press('b', 2000);
    e.update(2400);
    expect(e.results[1]).toMatchObject({ outcome: 'perfect', wrong: 1 });
  });

  it('a wrong ability in the last tick casts instead', () => {
    const e = afterFirstFire();
    e.press('c', 2000); // tick 4 → c casts at 4
    e.update(2400);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-fired', abilityId: 'c', tick: 4 });
    expect(e.castTick).toBe(4);
    expect(e.index).toBe(1);
  });
});

describe('TrainerEngine – ability queueing ON', () => {
  it('queues a press anywhere during the GCD and casts at the GCD end', () => {
    const e = afterFirstFire(on);
    e.press('b', 700); // tick 2, first GCD tick
    e.update(700);
    expect(e.events[0]).toMatchObject({ kind: 'queued', fireTick: 4, marginMs: 1700 });
    expect(e.isQueued).toBe(true);
    e.update(2400);
    expect(e.results[1]).toMatchObject({ outcome: 'perfect', offsetMs: 1700, firedAtTick: 4 });
  });

  it('repeated presses of the queued ability change nothing', () => {
    const e = afterFirstFire(on);
    e.press('b', 700);
    e.press('b', 1500);
    e.update(1500);
    expect(e.events.filter((x) => x.kind === 'queued').length).toBe(1);
    e.update(2400);
    expect(e.results.length).toBe(2);
  });

  it('a different ability pressed earlier in the GCD replaces the queued one', () => {
    const e = afterFirstFire(on);
    e.press('b', 700);
    e.press('c', 1300); // tick 3 → replaces b in the queue slot
    e.update(1300);
    expect(e.queuedAbility).toBe('c');
    expect(e.isQueued).toBe(false);
    e.update(2400);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-fired', abilityId: 'c', tick: 4 });
    expect(e.index).toBe(1);
  });

  it('bypass: another ability on the last tick casts now, the queued one stays queued for the next GCD end', () => {
    const e = afterFirstFire(on);
    e.press('b', 700); // queued for tick 4
    e.press('c', 2000); // tick 4 → c casts at 4, b waits until tick 7
    e.update(2400);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-fired', abilityId: 'c', tick: 4 });
    expect(e.queuedAbility).toBe('b');
    expect(e.isQueued).toBe(true);
    e.update(4199);
    expect(e.results.length).toBe(1);
    e.update(4200);
    expect(e.results[1]).toMatchObject({ abilityId: 'b', outcome: 'perfect', firedAtTick: 7, wrong: 1 });
    expect(e.queuedAbility).toBeNull();
  });
});

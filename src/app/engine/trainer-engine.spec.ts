import { describe, expect, it } from 'vitest';
import { DEFAULT_LOADOUT, Loadout } from '../core/models';
import { EngineConfig, EngineEntity, TrainerEngine } from './trainer-engine';

const off: EngineConfig = { pingMs: 0, jitterMs: 0, abilityQueueing: false, loop: false, loadout: { ...DEFAULT_LOADOUT } };
const on: EngineConfig = { ...off, abilityQueueing: true };

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, buffs: [], ...extra };
}
function prayer(key: string): EngineEntity {
  return { key, kind: 'prayer', name: key, icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [{ id: key, name: key, kind: 'Buff', on: 'self', icon: null, durationTicks: null }] };
}
function potion(key: string): EngineEntity {
  return { key, kind: 'special', name: key, icon: '', gcd: false, adrenaline: 25, cooldownTicks: 200, sharedCooldown: 'pot', buffs: [] };
}

const A = ability('a');
const B = ability('b');
const C = ability('c');
const ULT = ability('ult', { abilityType: 'Ultimate', adrenaline: -100, buffs: [{ id: 'buff:ult', name: 'Ult', kind: 'Buff', on: 'self', icon: null, durationTicks: 5 }] });
const ENH = ability('enh', { abilityType: 'Enhanced', adrenaline: -25, cooldownTicks: 10 });
const PRAY = prayer('pray');
const POT = potion('pot');
const CATALOG = new Map([A, B, C, ULT, ENH, PRAY, POT].map((e) => [e.key, e]));

function make(steps: EngineEntity[], cfg: Partial<EngineConfig> = {}, loadout: Partial<Loadout> = {}): TrainerEngine {
  return new TrainerEngine(steps, CATALOG, { ...off, ...cfg, loadout: { ...DEFAULT_LOADOUT, ...loadout } });
}

/** a,b,c started at t=0; 'a' cast at tick 1 (t=600) → GCD ends at tick 4 (t=2400). */
function afterFirstFire(cfg: Partial<EngineConfig> = {}, loadout: Partial<Loadout> = {}, steps = [A, B, C]): TrainerEngine {
  const e = make(steps, cfg, loadout);
  e.start(0);
  e.press('a', 100);
  e.update(600);
  expect(e.results.length).toBe(1);
  expect(e.castTick).toBe(1);
  e.events.length = 0;
  return e;
}

describe('timing – common', () => {
  it('casts the first ability at the next tick after the press', () => {
    const e = make([A, B]);
    e.start(0);
    e.press('a', 100);
    e.update(599); // the press is only processed on tick 1 (t=600) – nothing happens at arrival
    expect(e.results.length).toBe(0);
    expect(e.isQueued).toBe(false);
    e.update(600);
    expect(e.results[0]).toMatchObject({ key: 'a', outcome: 'perfect', firedAtTick: 1, adrenaline: 9 });
    expect(e.index).toBe(1);
    expect(e.gcdEndTick).toBe(4);
  });

  it('a press in the last GCD tick casts exactly when the GCD ends (both modes)', () => {
    for (const cfg of [off, on]) {
      const e = afterFirstFire(cfg);
      e.press('b', 1900);
      e.update(2399); // processed on tick 4 (t=2400), not before
      expect(e.events.length).toBe(0);
      expect(e.results.length).toBe(1);
      e.update(2400);
      expect(e.events[0]).toMatchObject({ kind: 'queued', fireTick: 4, marginMs: 500 });
      expect(e.results[1]).toMatchObject({ key: 'b', outcome: 'perfect', lateTicks: 0, offsetMs: 500, firedAtTick: 4 });
    }
  });

  it('late presses cast at the tick they are processed', () => {
    const e = afterFirstFire();
    e.press('b', 2500);
    e.update(3000);
    expect(e.results[1]).toMatchObject({ outcome: 'late', lateTicks: 1, offsetMs: 100, firedAtTick: 5 });
    e.press('c', 4300);
    e.update(4800);
    expect(e.results[2]).toMatchObject({ outcome: 'perfect', firedAtTick: 8 });
  });

  it('ping pushes a press across the tick boundary', () => {
    const e = afterFirstFire({ pingMs: 60 });
    e.press('b', 2380);
    e.update(3000);
    expect(e.results[1]).toMatchObject({ outcome: 'late', lateTicks: 1, offsetMs: 40 });
  });

  it('a wrong ability cast after the GCD starts a GCD and keeps the step', () => {
    const e = afterFirstFire();
    e.press('c', 2500);
    e.update(3000);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-fired', key: 'c', expected: 'b', tick: 5 });
    expect(e.index).toBe(1);
    expect(e.castTick).toBe(5);
    e.press('b', 4700);
    e.update(4800);
    expect(e.results[1]).toMatchObject({ key: 'b', outcome: 'perfect', wrong: 1 });
  });

  it('finishes after the last step unless looping', () => {
    const e = afterFirstFire();
    e.press('b', 2000);
    e.update(2400);
    e.press('c', 4000);
    e.update(4200);
    expect(e.state).toBe('finished');
    expect(e.currentStep).toBeUndefined();

    const l = afterFirstFire({ loop: true });
    l.press('b', 2000);
    l.update(2400);
    l.press('c', 4000);
    l.update(4200);
    expect(l.state).toBe('running');
    expect(l.index).toBe(0);
  });
});

describe('ability queueing OFF', () => {
  it('ignores the expected ability pressed before the last tick', () => {
    const e = afterFirstFire();
    e.press('b', 1300);
    e.update(1800); // processed on tick 3
    expect(e.events[0]).toMatchObject({ kind: 'too-early', ticksEarly: 1 });
    e.press('b', 2500);
    e.update(3000);
    expect(e.results[1]).toMatchObject({ outcome: 'late', tooEarly: 1 });
  });

  it('ignores a wrong ability pressed during the GCD', () => {
    const e = afterFirstFire();
    e.press('c', 1300);
    e.update(1800); // processed on tick 3
    expect(e.events[0]).toMatchObject({ kind: 'wrong', key: 'c', expected: 'b' });
    expect(e.castTick).toBe(1);
  });

  it('drops a press when adrenaline is missing', () => {
    const e = afterFirstFire({}, {}, [A, ULT, B]);
    e.press('ult', 2000);
    e.update(2400);
    expect(e.events[0]).toMatchObject({ kind: 'no-adrenaline', key: 'ult', need: 100, have: 9 });
    expect(e.results.length).toBe(1);
    expect(e.castTick).toBe(1);
  });

  it('drops a press while the ability is on cooldown', () => {
    const e = afterFirstFire({ loop: true }, { startAdrenaline: 50 }, [A, ENH]);
    e.press('enh', 2000);
    e.update(2400); // enh casts at tick 4, cooldown 10 → ready at 14
    expect(e.results[1]).toMatchObject({ key: 'enh', outcome: 'perfect', adrenaline: 34 });
    e.press('a', 3800);
    e.update(4200); // a at tick 7
    e.press('enh', 5600); // tick 10 – still 4 ticks of cooldown
    e.update(6000);
    expect(e.events.at(-1)).toMatchObject({ kind: 'on-cooldown', key: 'enh', readyInTicks: 4 });
    expect(e.results.length).toBe(3);
  });
});

describe('ability queueing ON', () => {
  it('queues a press anywhere during the GCD and casts at the GCD end', () => {
    const e = afterFirstFire(on);
    e.press('b', 700);
    e.update(1200); // processed on tick 2
    expect(e.events[0]).toMatchObject({ kind: 'queued', fireTick: 4, marginMs: 1700 });
    expect(e.isQueued).toBe(true);
    e.update(2400);
    expect(e.results[1]).toMatchObject({ outcome: 'perfect', offsetMs: 1700, firedAtTick: 4 });
  });

  it('pressing the queued ability again cancels the queue (not on the cast tick itself)', () => {
    const e = afterFirstFire(on);
    e.press('b', 700); // queued on tick 2 for tick 4
    e.press('b', 1300); // tick 3: toggles it off
    e.update(1800);
    expect(e.events.at(-1)).toMatchObject({ kind: 'unqueued', key: 'b' });
    expect(e.isQueued).toBe(false);
    e.update(2400);
    expect(e.results.length).toBe(1); // nothing cast
    e.press('b', 2000); // tick 4 = gcd end: casts
    e.press('b', 2100); // same tick again: no cancel
    e.update(2400);
    expect(e.results[1]).toMatchObject({ key: 'b', outcome: 'perfect', firedAtTick: 4 });
  });

  it('a different ability pressed earlier in the GCD replaces the queued one', () => {
    const e = afterFirstFire(on);
    e.press('b', 700);
    e.press('c', 1300);
    e.update(1800); // b processed on tick 2, c on tick 3
    expect(e.queuedKey).toBe('c');
    e.update(2400);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-fired', key: 'c', tick: 4 });
  });

  it('bypass: another ability on the last tick casts now, the queued one waits for the next GCD end', () => {
    const e = afterFirstFire(on);
    e.press('b', 700);
    e.press('c', 2000);
    e.update(2400);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-fired', key: 'c', tick: 4 });
    expect(e.queuedKey).toBe('b');
    e.update(4200);
    expect(e.results[1]).toMatchObject({ key: 'b', outcome: 'perfect', firedAtTick: 7, wrong: 1 });
  });

  it('keeps an ability queued until there is enough adrenaline', () => {
    const e = make([POT, ULT], on, { startAdrenaline: 80 });
    e.start(0);
    e.press('ult', 100);
    e.update(600); // would cast at tick 1, but 80 < 100
    expect(e.events.some((x) => x.kind === 'no-adrenaline')).toBe(true);
    expect(e.results.length).toBe(0);
    e.press('pot', 700); // tick 2 → 105 → capped 100, ult re-checked on the same tick and casts
    e.update(1200);
    expect(e.results.find((r) => r.key === 'pot')).toMatchObject({ outcome: 'done', adrenaline: 100 });
    expect(e.results.find((r) => r.key === 'ult')).toMatchObject({ outcome: 'perfect', firedAtTick: 2, adrenaline: 0 });
  });
});

describe('adrenaline', () => {
  it('basics add, enhanced/ultimates cost, capped at max', () => {
    const e = make([A, A, A, ENH, ULT], on, { startAdrenaline: 95 });
    e.start(0);
    e.press('a', 100);
    e.update(600);
    expect(e.adrenaline).toBe(100);
    e.press('a', 2000);
    e.update(2400);
    e.press('a', 3800);
    e.update(4200);
    e.press('enh', 5600);
    e.update(6000);
    expect(e.adrenaline).toBe(75);
    e.press('ult', 7400);
    e.update(7800);
    expect(e.events.some((x) => x.kind === 'no-adrenaline' && x.have === 75)).toBe(true);
    expect(e.results.length).toBe(4);
  });

  it('loadout: ring of vigour + conservation refund after an ultimate, fury of the small on basics', () => {
    const e = make([ULT, A], { ...on, loop: true }, { startAdrenaline: 100, ringOfVigour: true, conservationOfEnergy: true, furyOfTheSmall: true });
    e.start(0);
    e.press('ult', 100);
    e.update(600);
    expect(e.adrenaline).toBe(20);
    e.press('a', 2000);
    e.update(2400);
    expect(e.adrenaline).toBe(30);
    expect(e.buffs.map((b) => b.id)).toContain('buff:ult');
    e.update(600 * 6 + 1); // buff lasts 5 ticks from tick 1 → gone at tick 6
    expect(e.buffs.length).toBe(0);
  });

  it('impatient: +3% with the rolled chance', () => {
    const e = make([A], on, { impatientRank: 4 });
    e.random = () => 0.1; // < 0.36
    e.start(0);
    e.press('a', 100);
    e.update(600);
    expect(e.adrenaline).toBe(12);
  });

  it('max adrenaline grows with Heightened Senses and Vestments', () => {
    const e = make([A], on, { heightenedSenses: true, vestmentsOfHavoc: true });
    expect(e.maxAdrenaline).toBe(130);
  });
});

describe('off-GCD steps (prayers, potions)', () => {
  it('nothing happens instantly: an off-GCD press takes effect on the next tick, not at arrival', () => {
    const e = make([A, PRAY, B]);
    e.start(0);
    e.press('a', 100);
    e.update(600);
    e.press('pray', 700); // arrives at 700, processed at tick 2 = 1200
    e.update(1199);
    expect(e.results.length).toBe(1);
    expect(e.events.some((x) => x.kind === 'prayer')).toBe(false);
    e.update(1200);
    expect(e.results[1]).toMatchObject({ key: 'pray', outcome: 'done', firedAtTick: 2 });
    expect(e.events.some((x) => x.kind === 'prayer')).toBe(true);
  });

  it('a prayer step activates on its tick, stays as a buff and the ability after it is judged normally', () => {
    const e = make([A, PRAY, B]);
    e.start(0);
    e.press('a', 100);
    e.update(600);
    e.press('pray', 1000); // tick 2, during the GCD – fine, no GCD for prayers
    e.update(1200);
    expect(e.results[1]).toMatchObject({ key: 'pray', outcome: 'done', firedAtTick: 2 });
    expect(e.activePrayers.has('pray')).toBe(true);
    expect(e.index).toBe(2);
    e.press('b', 2000);
    e.update(2400);
    expect(e.results[2]).toMatchObject({ key: 'b', outcome: 'perfect' });
  });

  it('casting the ability before its prayer marks the prayer as missed', () => {
    const e = make([A, PRAY, B]);
    e.start(0);
    e.press('a', 100);
    e.update(600);
    e.press('b', 2000);
    e.update(2400);
    expect(e.events.some((x) => x.kind === 'missed' && x.keys.includes('pray'))).toBe(true);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['a', 'perfect'], ['pray', 'missed'], ['b', 'perfect']]);
    expect(e.state).toBe('finished');
  });

  it('a potion out of order still activates but counts as wrong; shared cooldown blocks a second one', () => {
    const e = make([A, B, POT]);
    e.start(0);
    e.press('pot', 100); // not in the current group (a is next)
    e.update(600);
    expect(e.events[0]).toMatchObject({ kind: 'wrong-fired', key: 'pot' });
    expect(e.adrenaline).toBe(25);
    e.press('a', 700);
    e.update(1200);
    e.press('pot', 1300);
    e.update(1800);
    expect(e.events.at(-1)).toMatchObject({ kind: 'on-cooldown', key: 'pot' });
  });
});

describe('PvME companions (same tick / 2t) and notes', () => {
  const NOTE: EngineEntity = { key: 'note:1', kind: 'action', name: 'improv', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], isNote: true };
  const TC: EngineEntity = { key: 'action:target-cycle', kind: 'action', name: 'tc', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
  const CAT = new Map([...CATALOG, [TC.key, TC]]);

  it('same-tick companion is perfect on the cast tick, late afterwards', () => {
    const e = new TrainerEngine([A, { ...POT, offsetTicks: 0 }, B], CAT, on);
    e.start(0);
    e.press('a', 100);
    e.press('pot', 300); // both processed at tick 1
    e.update(600);
    expect(e.results.map((r) => [r.key, r.outcome]).sort()).toEqual([['a', 'perfect'], ['pot', 'perfect']]);

    const l = new TrainerEngine([A, { ...POT, offsetTicks: 0 }, B], CAT, on);
    l.start(0);
    l.press('a', 100);
    l.update(600);
    l.press('pot', 700); // tick 2 → one tick late
    l.update(1200);
    expect(l.results[1]).toMatchObject({ key: 'pot', outcome: 'late', lateTicks: 1 });
  });

  it('"2t x" is perfect exactly two ticks after the previous input, early before', () => {
    const e = new TrainerEngine([A, { ...PRAY, offsetTicks: 2 }, B], CAT, on);
    e.start(0);
    e.press('a', 100);
    e.update(600); // a at tick 1
    e.press('pray', 1300); // tick 3 = 1 + 2
    e.update(1800);
    expect(e.results[1]).toMatchObject({ key: 'pray', outcome: 'perfect', lateTicks: 0 });

    const x = new TrainerEngine([A, { ...PRAY, offsetTicks: 2 }, B], CAT, on);
    x.start(0);
    x.press('a', 100);
    x.update(600);
    x.press('pray', 700); // tick 2 → one tick early
    x.update(1200);
    expect(x.results[1]).toMatchObject({ key: 'pray', outcome: 'early', lateTicks: -1 });
  });

  it('notes are skipped automatically and never missed', () => {
    const e = new TrainerEngine([NOTE, A, NOTE, TC, B], CAT, on);
    e.start(0);
    expect(e.currentStep?.key).toBe('note:1');
    e.press('a', 100);
    e.update(600);
    expect(e.index).toBe(3); // both notes done, tc expected
    e.press('b', 2000);
    e.update(2400);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['a', 'perfect'], ['action:target-cycle', 'missed'], ['b', 'perfect']]);
  });

  it('the generic spec key fires the spec the rotation expects for the wielded weapon', () => {
    const SPEC: EngineEntity = { key: 'spec:death-essence', kind: 'spec', name: 'Death Essence', icon: '', gcd: true, abilityType: 'Special', style: 'Necromancy', adrenaline: -30, cooldownTicks: 100, buffs: [] };
    const GENERIC: EngineEntity = { key: 'ability:weapon-special-attack', kind: 'ability', name: 'Weapon Special Attack', icon: '', gcd: true, abilityType: 'Special', style: 'Constitution', adrenaline: 0, cooldownTicks: 0, buffs: [] };
    const cat = new Map([...CAT, [SPEC.key, SPEC], [GENERIC.key, GENERIC]]);
    const e = new TrainerEngine([SPEC, A], cat, { ...on, loadout: { ...DEFAULT_LOADOUT, startAdrenaline: 50 }, weaponSetup: { start: 'Necromancy', types: { Melee: 'two-handed', Ranged: 'two-handed', Magic: 'two-handed', Necromancy: 'dual-wield' } } });
    e.start(0);
    e.press('ability:weapon-special-attack', 100);
    e.update(600);
    expect(e.results[0]).toMatchObject({ key: 'spec:death-essence', outcome: 'perfect', adrenaline: 20 });
  });
});

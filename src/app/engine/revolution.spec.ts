/**
 * Revolution combat mode against docs/research/revolution.md: leftmost usable slot of the first N main-bar slots fires when
 * the GCD is free, blocked slots are skipped, the type toggles, manual priority, automatic step results.
 */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, EngineEvent, RevolutionConfig, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key: 'ability:' + key, id: key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, buffs: [], ...extra };
}

const A = ability('a');
const B = ability('b', { cooldownTicks: 10 });
const C = ability('c');
const ENH = ability('enh', { abilityType: 'Enhanced', adrenaline: -25, cooldownTicks: 10 });
const THR = ability('thr', { abilityType: 'Threshold', adrenaline: -15, cooldownTicks: 10 });
const ULT = ability('ult', { abilityType: 'Ultimate', adrenaline: -100, cooldownTicks: 20 });
const SPEC = ability('weapon-special-attack', { abilityType: 'Special', adrenaline: -50 });
const SURGE = ability('surge', { gcd: false, adrenaline: 0, cooldownTicks: 34 });
const CHAN = ability('chan', { channel: { ticks: 5, hits: [0, 2, 4] }, damageMin: 20, damageMax: 40, cooldownTicks: 10 });
const PRAY: EngineEntity = { key: 'prayer:pray', id: 'pray', kind: 'prayer', name: 'pray', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
const CATALOG = new Map([A, B, C, ENH, THR, ULT, SPEC, SURGE, CHAN, PRAY].map((e) => [e.key, e]));

const REVO: RevolutionConfig = { slots: 9, basics: true, enhanced: true, thresholds: false, ultimates: false, bar: [] };

function make(steps: EngineEntity[], bar: (string | null)[], revo: Partial<RevolutionConfig> = {}, cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const config: EngineConfig = {
    pingMs: 0, jitterMs: 0, abilityQueueing: false, loop: false, loadout: defaultResolvedLoadout(),
    combatMode: 'revolution', revolution: { ...REVO, ...revo, bar: bar.map((k) => (k ? 'ability:' + k : null)) },
    ...cfg,
  };
  const e = new TrainerEngine(steps, CATALOG, config);
  e.random = () => 0.5;
  e.start(0);
  return e;
}

function autos(e: TrainerEngine): Extract<EngineEvent, { kind: 'auto' }>[] {
  return e.events.filter((x): x is Extract<EngineEvent, { kind: 'auto' }> => x.kind === 'auto');
}

describe('revolution: picking the next ability', () => {
  it('casts the leftmost usable slot on the first tick and again every time the GCD ends', () => {
    const e = make([A, A, A], ['a', 'b', 'c'], {}, { loop: true });
    e.update(T);
    expect(e.results[0]).toMatchObject({ key: 'ability:a', outcome: 'perfect', firedAtTick: 1, auto: true });
    expect(e.castTick).toBe(1);
    expect(autos(e)).toEqual([{ kind: 'auto', key: 'ability:a', tick: 1, matched: true, expected: 'ability:a' }]);
    e.update(4 * T - 1); // GCD still running: nothing
    expect(e.results.length).toBe(1);
    e.update(4 * T);
    expect(e.results[1]).toMatchObject({ key: 'ability:a', outcome: 'perfect', firedAtTick: 4, auto: true });
    e.update(7 * T);
    expect(e.results[2]).toMatchObject({ firedAtTick: 7, auto: true });
    expect(e.adrenaline).toBe(27);
  });

  it('skips a slot on cooldown and moves right', () => {
    const e = make([B, A, A], ['b', 'a'], {}, { loop: true });
    e.update(T);
    expect(e.results[0]).toMatchObject({ key: 'ability:b', firedAtTick: 1, auto: true });
    e.update(4 * T); // b is on its 10-tick cooldown → a
    expect(e.results[1]).toMatchObject({ key: 'ability:a', firedAtTick: 4, auto: true });
    e.update(7 * T);
    expect(e.results[2]).toMatchObject({ key: 'ability:a', firedAtTick: 7, auto: true });
  });

  it('skips a slot without enough adrenaline', () => {
    const e = make([A], ['ult', 'a'], { ultimates: true });
    e.update(T);
    expect(e.results[0]).toMatchObject({ key: 'ability:a', auto: true });
    const full = make([ULT], ['ult', 'a'], { ultimates: true }, { fullAdrenaline: true });
    full.update(T);
    expect(full.results[0]).toMatchObject({ key: 'ability:ult', auto: true });
    expect(full.adrenaline).toBe(0);
  });

  it('respects the number of slots', () => {
    const one = make([A], [null, 'a', 'b'], { slots: 1 });
    one.update(4 * T);
    expect(one.results.length).toBe(0);
    expect(one.castTick).toBeNull();
    const two = make([A], [null, 'a', 'b'], { slots: 2 });
    two.update(T);
    expect(two.results[0]).toMatchObject({ key: 'ability:a', auto: true });
    // slot 1 on cooldown and nothing else in range: Revolution waits
    const wait = make([B, B], ['b', 'a'], { slots: 1 });
    wait.update(4 * T);
    expect(wait.results.length).toBe(1);
    expect(wait.castTick).toBe(1);
  });

  it('never fires special attacks, off-GCD abilities or prayers, and does nothing in full manual', () => {
    const e = make([A], ['weapon-special-attack', 'surge', 'pray', 'a'], {}, { fullAdrenaline: true });
    e.update(T);
    expect(e.results[0]).toMatchObject({ key: 'ability:a', auto: true });
    expect(e.activePrayers.size).toBe(0);
    const manual = make([A], ['a'], {}, { combatMode: 'manual' });
    manual.update(4 * T);
    expect(manual.results.length).toBe(0);
    expect(manual.events.length).toBe(0);
  });

  it('waits for a channel to finish before the next ability', () => {
    const e = make([CHAN, A], ['chan', 'a']);
    e.update(T);
    expect(e.results[0]).toMatchObject({ key: 'ability:chan', auto: true, firedAtTick: 1 });
    e.update(4 * T); // GCD ended at tick 4, but the channel's last hit lands on tick 5
    expect(e.results.length).toBe(1);
    expect(e.channel?.key).toBe('ability:chan');
    e.update(5 * T); // last hit landed: the channel is over, Revolution moves on (chan is on cooldown) – on time, the ability is due at the channel's end
    expect(e.results[1]).toMatchObject({ key: 'ability:a', auto: true, firedAtTick: 5, outcome: 'perfect', lateTicks: 0 });
  });

  it('re-reads the bar after a weapon switch through resolveBar', () => {
    const e = make([A, C], ['a'], { resolveBar: (style) => (style === 'Magic' ? ['ability:c'] : ['ability:a']) });
    e.update(T);
    expect(e.results[0]).toMatchObject({ key: 'ability:a', auto: true });
    e.config.loadout.style = 'Magic';
    e.update(4 * T);
    expect(e.results[1]).toMatchObject({ key: 'ability:c', auto: true });
  });
});

describe('revolution: ability type toggles', () => {
  it('thresholds only with the toggle', () => {
    const off = make([A], ['thr', 'a'], { thresholds: false }, { fullAdrenaline: true });
    off.update(T);
    expect(off.results[0]).toMatchObject({ key: 'ability:a' });
    const on = make([THR], ['thr', 'a'], { thresholds: true }, { fullAdrenaline: true });
    on.update(T);
    expect(on.results[0]).toMatchObject({ key: 'ability:thr', auto: true });
    expect(on.adrenaline).toBe(85);
  });

  it('ultimates only with the toggle', () => {
    const off = make([A], ['ult', 'a'], { ultimates: false }, { fullAdrenaline: true });
    off.update(T);
    expect(off.results[0]).toMatchObject({ key: 'ability:a' });
    const on = make([ULT], ['ult', 'a'], { ultimates: true }, { fullAdrenaline: true });
    on.update(T);
    expect(on.results[0]).toMatchObject({ key: 'ability:ult', auto: true });
  });

  it('enhanced and basic abilities follow their toggles', () => {
    const noEnh = make([A], ['enh', 'a'], { enhanced: false }, { fullAdrenaline: true });
    noEnh.update(T);
    expect(noEnh.results[0]).toMatchObject({ key: 'ability:a' });
    const enh = make([ENH], ['enh', 'a'], { enhanced: true }, { fullAdrenaline: true });
    enh.update(T);
    expect(enh.results[0]).toMatchObject({ key: 'ability:enh', auto: true });
    const noBasics = make([A], ['a', 'b'], { basics: false });
    noBasics.update(4 * T);
    expect(noBasics.results.length).toBe(0);
  });
});

describe('revolution: manual input and scoring', () => {
  it('a manual press processed on the same tick wins over Revolution', () => {
    const e = make([B, A], ['a', 'b']);
    e.press('ability:b', 100);
    e.update(T);
    expect(e.results[0]).toMatchObject({ key: 'ability:b', outcome: 'perfect', firedAtTick: 1 });
    expect(e.results[0].auto).toBeUndefined();
    expect(autos(e)).toEqual([]);
    // the GCD end: a is the leftmost usable slot and the expected step
    e.update(4 * T);
    expect(e.results[1]).toMatchObject({ key: 'ability:a', auto: true, firedAtTick: 4 });
  });

  it('a queued manual ability fires instead of the Revolution choice (ability queueing on)', () => {
    const e = make([A, C], ['a', 'b'], {}, { abilityQueueing: true });
    e.update(T);
    expect(e.results[0]).toMatchObject({ key: 'ability:a', auto: true });
    e.press('ability:c', 2 * T + 100); // inside the GCD → queued for tick 4
    e.update(4 * T);
    expect(e.results[1]).toMatchObject({ key: 'ability:c', outcome: 'perfect', firedAtTick: 4 });
    expect(e.results[1].auto).toBeUndefined();
    expect(e.castTick).toBe(4);
    expect(autos(e).length).toBe(1);
  });

  it('with ability queueing off a press inside the GCD is too early and Revolution fires its own choice', () => {
    const e = make([A, C], ['a', 'b']);
    e.update(T);
    e.press('ability:c', 2 * T + 100);
    e.update(3 * T);
    expect(e.events.at(-1)).toMatchObject({ kind: 'too-early', key: 'ability:c' });
    e.update(4 * T);
    // Revolution cast a (not the expected c): logged as auto, not a wrong press, the rotation still waits for c
    expect(autos(e).at(-1)).toEqual({ kind: 'auto', key: 'ability:a', tick: 4, matched: false, expected: 'ability:c' });
    expect(e.events.some((x) => x.kind === 'wrong-fired')).toBe(false);
    expect(e.index).toBe(1);
    expect(e.results.length).toBe(1);
    // the player presses c on the next GCD end: perfect, no wrong / too-early counted from the auto cast
    e.press('ability:c', 6 * T + 100);
    e.update(7 * T);
    expect(e.results[1]).toMatchObject({ key: 'ability:c', outcome: 'perfect', firedAtTick: 7, wrong: 0, tooEarly: 1 });
    expect(e.results[1].auto).toBeUndefined();
  });

  it('a step completed by Revolution is reported as automatic, a manual one is not', () => {
    const e = make([A, B], ['a', 'b']);
    e.update(T);
    expect(e.results[0].auto).toBe(true);
    expect(e.events.find((x) => x.kind === 'fired')).toMatchObject({ result: { key: 'ability:a', auto: true } });
    e.press('ability:b', 3 * T + 100);
    e.update(4 * T);
    expect(e.results[1]).toMatchObject({ key: 'ability:b', outcome: 'perfect' });
    expect(e.results[1].auto).toBeUndefined();
    expect(e.state).toBe('finished');
  });
});

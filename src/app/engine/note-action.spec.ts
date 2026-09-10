/**
 * Notes that ask the player to do something ("enter the instance"). A plain note is skipped, this one stops the
 * rotation until it is pressed, and what it asks for takes time: the next ability is only due `actionTicks` later,
 * so walking into the instance is not scored as a late press.
 */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 0, cooldownTicks: 0, damageMin: 100, damageMax: 100, buffs: [], ...extra };
}

function note(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'action', name: key, icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], isNote: true, ...extra };
}

function make(steps: EngineEntity[]): TrainerEngine {
  const catalog = new Map(steps.map((e) => [e.key, e] as const));
  const cfg: EngineConfig = {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: false, hitChanceDisabled: true,
    loadout: { ...defaultResolvedLoadout(), style: 'Melee', abilityDamage: 1000, startAdrenaline: 100 },
  };
  const e = new TrainerEngine(steps, catalog, cfg);
  e.random = () => 0.5;
  e.start(0);
  return e;
}

function press(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

const outcomes = (e: TrainerEngine) => e.results.map((r) => r.name + ':' + r.outcome);

describe('notes that require an action', () => {
  it('a plain note is skipped, an action note is the current step until it is pressed', () => {
    const e = make([ability('a'), note('plain'), note('do', { awaitAction: true, actionTicks: 4 }), ability('b')]);
    press(e, 'a', 1);
    expect(e.currentStep?.key).toBe('do'); // the plain note was skipped, this one waits
    press(e, 'do', 2);
    expect(e.currentStep?.key).toBe('b');
    expect(outcomes(e)).toEqual(['a:perfect', 'do:done']);
  });

  it('the next ability is due after the action, not after the global cooldown', () => {
    const e = make([ability('a'), note('do', { awaitAction: true, actionTicks: 6 }), ability('b')]);
    press(e, 'a', 1);
    press(e, 'do', 2);
    // the GCD ended at tick 4, the action only at tick 8: pressing there is on time
    press(e, 'b', 8);
    expect(outcomes(e)).toEqual(['a:perfect', 'do:done', 'b:perfect']);
  });

  it('a press before the action is over is early, not perfect – the same lateness scale as everywhere', () => {
    const e = make([ability('a'), note('do', { awaitAction: true, actionTicks: 6 }), ability('b')]);
    press(e, 'a', 1);
    press(e, 'do', 2);
    press(e, 'b', 10);
    expect(e.results.at(-1)).toMatchObject({ name: 'b', outcome: 'late', lateTicks: 2 });
  });

  it('an action note that is never pressed counts as missed once the rotation moves on', () => {
    const e = make([ability('a'), note('do', { awaitAction: true, actionTicks: 4 }), ability('b')]);
    press(e, 'a', 1);
    press(e, 'b', 4);
    expect(e.results.map((r) => r.outcome)).toEqual(['perfect', 'missed', 'perfect']);
  });

  it('a same-tick step after a note that takes time is on time when pressed as soon as the note is done', () => {
    const cycle: EngineEntity = { key: 'action:target-cycle', id: 'target-cycle', kind: 'action', name: 'Target cycle', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], offsetTicks: 0 };
    const e = make([ability('a'), note('click clone', { awaitAction: true, actionTicks: 4 }), cycle, ability('b')]);
    press(e, 'a', 1);
    press(e, 'click clone', 4); // done on tick 4, takes until tick 8
    press(e, 'action:target-cycle', 8);
    press(e, 'b', 8);
    expect(outcomes(e)).toEqual(['a:perfect', 'click clone:done', 'Target cycle:perfect', 'b:perfect']);
  });

  it('an action note without a time costs no time', () => {
    const e = make([ability('a'), note('do', { awaitAction: true, actionTicks: 0 }), ability('b')]);
    press(e, 'a', 1);
    press(e, 'do', 2);
    press(e, 'b', 4);
    expect(outcomes(e)).toEqual(['a:perfect', 'do:done', 'b:perfect']);
  });
});

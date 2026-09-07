/**
 * Timing edge cases found while auto-playing PvME rotations through the UI (docs/research/dpm-comparison.md).
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import { Ability } from '../core/models';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const DATA = ABILITIES as unknown as Ability[];
const BY_ID = new Map(DATA.map((a) => [a.id, a]));
const T = TICK_MS;

function ability(id: string): EngineEntity {
  const a = BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return { key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type, adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [], damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined };
}

function make(ids: string[], hitDelayTicks = 0, style: 'Magic' | 'Melee' = 'Magic'): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: false, hitChanceDisabled: true, hitDelayTicks, loadout: { ...defaultResolvedLoadout(), style, abilityDamage: 1000 } });
  e.random = () => 0.5;
  e.start(0);
  e.adrenaline = 100;
  return e;
}

describe('presses right after the previous cast fired', () => {
  it('a press 5 ms after the cast tick is queued for the GCD end and scores perfect', () => {
    const e = make(['dragon-breath', 'greater-sonic-wave', 'dragon-breath']);
    e.press('ability:dragon-breath', 100); // processed on tick 1
    e.update(1 * T + 5);
    expect(e.results[0]).toMatchObject({ key: 'ability:dragon-breath', firedAtTick: 1 });
    e.press('ability:greater-sonic-wave', 1 * T + 5); // 5 ms after the cast fired
    e.update(4 * T + 5);
    expect(e.results[1]).toMatchObject({ key: 'ability:greater-sonic-wave', outcome: 'perfect', firedAtTick: 4 });
  });
});

describe('presses right after the previous cast fired (hit delay 2)', () => {
  it('is still perfect with the default 2-tick hit delay', () => {
    const e = make(['dragon-breath', 'greater-sonic-wave', 'wild-magic', 'greater-concentrated-blast'], 2);
    e.press('ability:dragon-breath', 100);
    e.update(1 * T + 5);
    e.press('ability:greater-sonic-wave', 1 * T + 5);
    e.update(4 * T + 5);
    expect(e.results[1]).toMatchObject({ key: 'ability:greater-sonic-wave', outcome: 'perfect', firedAtTick: 4 });
    e.press('ability:wild-magic', 4 * T + 5);
    e.update(7 * T + 5);
    expect(e.results[2]).toMatchObject({ key: 'ability:wild-magic', outcome: 'perfect', firedAtTick: 7 });
    e.press('ability:greater-concentrated-blast', 7 * T + 5);
    e.update(10 * T + 5);
    expect(e.results[3]).toMatchObject({ key: 'ability:greater-concentrated-blast', outcome: 'perfect', firedAtTick: 10 });
  });
});

describe('off-GCD ability during a channel', () => {
  it('Runic Charge inside Asphyxiate does not make the next ability late by the whole channel', () => {
    const e = make(['asphyxiate', 'runic-charge', 'greater-concentrated-blast']);
    e.press('ability:asphyxiate', 100);
    e.update(1 * T + 5); // fires on tick 1, channel 7 ticks: ends on tick 8
    expect(e.results[0]).toMatchObject({ key: 'ability:asphyxiate', firedAtTick: 1 });
    e.press('ability:runic-charge', 4 * T + 5); // off the GCD, mid-channel
    e.update(5 * T + 5);
    expect(e.results[1]).toMatchObject({ key: 'ability:runic-charge' });
    e.press('ability:greater-concentrated-blast', 8 * T - 100); // last tick of the channel
    e.update(8 * T + 5);
    expect(e.results[2]).toMatchObject({ key: 'ability:greater-concentrated-blast', firedAtTick: 8, outcome: 'perfect', lateTicks: 0 });
    expect(e.events.some((x) => x.kind === 'channel-cancelled')).toBe(false);
  });
});

describe('damage still in the air when the last input is done', () => {
  it('a bleed cast as the last step lands in full before the session finishes', () => {
    const e = make(['dismember'], 0, 'Melee');
    e.press('ability:dismember', 100);
    e.update(1 * T + 5); // fires on tick 1, 8 bleed hits every 2 ticks
    expect(e.state).toBe('running');
    expect(e.settling).toBe(true);
    e.update(10 * T);
    expect(e.state).toBe('running');
    e.update(20 * T);
    expect(e.state).toBe('finished');
    expect(e.events.filter((x) => x.kind === 'hit' && x.key === 'ability:dismember').length).toBe(8);
    expect(e.events.filter((x) => x.kind === 'finished').length).toBe(1);
  });

  it('a plain hit finishes on the tick it lands and presses in the meantime are ignored', () => {
    const e = make(['dragon-breath']);
    e.press('ability:dragon-breath', 100);
    e.update(1 * T + 5);
    e.press('ability:dragon-breath', 1 * T + 50);
    e.update(4 * T);
    expect(e.state).toBe('finished');
    expect(e.results.length).toBe(1);
    expect(e.events.some((x) => x.kind === 'wrong-fired' || x.kind === 'too-early')).toBe(false);
  });
});

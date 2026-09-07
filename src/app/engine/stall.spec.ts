/**
 * Ability stalling, the standard PvME opener: an ability is started out of range and released as the fight begins.
 * "When an ability is stalled, its adrenaline cost is consumed and its cooldown begins. Therefore it is possible for
 * the adrenaline and cooldown to be regained before the ability is released" (runescape.wiki/w/Ability_stalling).
 * The importer marks the pair ("sassault → … → rassault"), so the trainer plays it as two presses.
 */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: -25, cooldownTicks: 20, damageMin: 100, damageMax: 100, buffs: [], ...extra };
}

function make(steps: EngineEntity[], startAdrenaline = 100): TrainerEngine {
  const catalog = new Map(steps.map((e) => [e.key, e] as const));
  const cfg: EngineConfig = {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: false, hitChanceDisabled: true,
    loadout: { ...defaultResolvedLoadout(), style: 'Melee', abilityDamage: 1000, startAdrenaline },
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
const hits = (e: TrainerEngine, key: string) => e.events.filter((x) => x.kind === 'hit' && x.key === key);
const kinds = (e: TrainerEngine) => e.events.map((x) => x.kind);

describe('ability stalling', () => {
  it('the stall pays and starts the cooldown but lands nothing; the release lands it without paying again', () => {
    const stall = ability('a', { stall: true });
    const release = ability('a', { release: true });
    const e = make([stall, release]);
    press(e, 'a', 1);
    e.update(6 * T);
    expect(kinds(e)).toContain('stalled');
    expect(hits(e, 'a')).toHaveLength(0);
    expect(e.adrenaline).toBe(75); // 25 % paid at the stall
    expect(e.cooldownLeft('a', 2)).toBeGreaterThan(0);

    press(e, 'a', 8); // released while its own cooldown still runs – the stall paid for this cast
    e.update(14 * T);
    expect(e.events.some((x) => x.kind === 'on-cooldown')).toBe(false);
    expect(hits(e, 'a')).toHaveLength(1);
    expect(e.adrenaline).toBe(75); // no second cost
    expect(e.index).toBe(2);
  });

  it('a stall without a release stays paid for and lands nothing', () => {
    const e = make([ability('a', { stall: true }), ability('b')]);
    press(e, 'a', 1);
    e.update(10 * T);
    expect(hits(e, 'a')).toHaveLength(0);
    expect(e.adrenaline).toBe(75);
    expect(e.index).toBe(1); // the stall completed its step
  });

  it('an ordinary cast of the same ability is unaffected: it pays, lands and goes on cooldown', () => {
    const e = make([ability('a'), ability('b')]);
    press(e, 'a', 1);
    e.update(8 * T);
    expect(kinds(e)).not.toContain('stalled');
    expect(hits(e, 'a')).toHaveLength(1);
    expect(e.adrenaline).toBe(75);
    expect(e.cooldownLeft('a', 2)).toBeGreaterThan(0);
  });
});

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

  it('a special whose cooldown lives in a debuff starts it on the release, not on the stall', () => {
    // "For special attacks that track their cooldowns by a debuff (e.g. Crystal Rain cooldown) then the cooldown does
    // not begin, as the debuff is only applied when the special attack hits an enemy" (runescape.wiki/w/Ability_stalling)
    const spec = (extra: Partial<EngineEntity>): EngineEntity => ({
      key: 'spec:crystal-rain', id: 'crystal-rain', kind: 'spec', name: 'Crystal Rain', icon: '', gcd: true, style: 'Ranged',
      abilityType: 'Special', adrenaline: -30, cooldownTicks: 50, damageMin: 125, damageMax: 155, buffs: [], ...extra,
    });
    const steps = [spec({ stall: true }), spec({ release: true })];
    const e = new TrainerEngine(steps, new Map(steps.map((x) => [x.key, x] as const)), {
      pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: false, hitChanceDisabled: true,
      loadout: { ...defaultResolvedLoadout(), style: 'Ranged', abilityDamage: 1000, startAdrenaline: 100, weaponSpec: steps[0] },
    });
    e.random = () => 0.5;
    e.start(0);
    press(e, 'spec:crystal-rain', 1);
    e.update(6 * T);
    expect(kinds(e)).toContain('stalled');
    expect(e.cooldownLeft('spec:crystal-rain', 2)).toBe(0); // the arrow has not hit, so no debuff and no cooldown

    press(e, 'spec:crystal-rain', 8);
    e.update(14 * T);
    expect(hits(e, 'spec:crystal-rain').length).toBeGreaterThan(0);
    expect(e.cooldownLeft('spec:crystal-rain', 9)).toBe(49); // 50 ticks from the release
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

  it('the release is the click on the target, off the global cooldown: the next ability goes on the same tick', () => {
    // "If the global cooldown has passed since stalling the ability, then it is possible to use another ability on the
    // same tick as the click that releases the stalled ability" (runescape.wiki/w/Ability_stalling)
    const stall = ability('a', { stall: true });
    const release = ability('a', { release: true });
    const b = ability('b');
    const e = make([stall, release, b]);
    press(e, 'a', 1);
    e.update(6 * T);
    e.press('a', 3 * T + 1); // the release, on the tick the GCD ends ...
    e.press('b', 3 * T + 2); // ... and the next ability on the same tick
    e.update(9 * T);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['a', 'perfect'], ['a', 'done'], ['b', 'perfect']]);
    expect(hits(e, 'a')).toHaveLength(1);
    expect(hits(e, 'b')).toHaveLength(1);
    expect(e.index).toBe(3);
  });

  it('attacking releases the held cast on its own: no press of the stalled ability needed', () => {
    const stall = ability('a', { stall: true });
    const release = ability('a', { release: true });
    const b = ability('b');
    const e = make([stall, release, b]);
    press(e, 'a', 1);
    e.update(6 * T);
    press(e, 'b', 8); // the attack that releases it
    e.update(12 * T);
    expect(e.results.map((r) => r.key)).toEqual(['a', 'a', 'b']);
    expect(hits(e, 'a')).toHaveLength(1);
    expect(e.events.some((x) => x.kind === 'wrong-fired' || x.kind === 'wrong')).toBe(false);
    expect(e.index).toBe(3);
  });
});

/**
 * "Key drill only" (Martin, 26 Oct 2026): a practice mode in which only the keys and the global cooldown count.
 * The engine refuses nothing for want of a weapon, a prayer book, adrenaline, a cooldown or a potion in the
 * backpack; a press inside the global cooldown is still handled exactly as in the real game.
 */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 20, damageMin: 100, damageMax: 100, buffs: [], ...extra };
}

function make(steps: EngineEntity[], cfg: Partial<EngineConfig> = {}, startAdrenaline = 0): TrainerEngine {
  const catalog = new Map(steps.map((e) => [e.key, e] as const));
  const e = new TrainerEngine(steps, catalog, {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: false, hitChanceDisabled: true,
    keyDrill: true,
    loadout: { ...defaultResolvedLoadout(), style: 'Melee', abilityDamage: 1000, startAdrenaline },
    ...cfg,
  });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

/** presses `key` on `tick` and runs the clock past it */
function cast(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, tick * T);
  e.update(tick * T + 1);
}

describe('key drill only', () => {
  it('an ability of another style casts without the weapon for it', () => {
    const magic = ability('wrack', { style: 'Magic' });
    const e = make([magic]);
    cast(e, 'wrack', 1);
    expect(e.results.map((r) => r.key)).toEqual(['wrack']);
    expect(e.events.some((x) => x.kind === 'wrong-weapon')).toBe(false);
    expect(e.usable('wrack', 0)).toBe('ok');
  });

  it('an ultimate casts with an empty adrenaline bar and a special casts without the weapon special', () => {
    const ult = ability('ult', { abilityType: 'Ultimate', adrenaline: -100 });
    const spec: EngineEntity = { key: 'spec:x', id: 'x', kind: 'spec', name: 'x', icon: '', gcd: true, abilityType: 'Special', adrenaline: -50, cooldownTicks: 0, damageMin: 100, damageMax: 100, buffs: [] };
    const e = make([ult, spec], {}, 0);
    cast(e, 'ult', 1);
    cast(e, 'spec:x', 4);
    expect(e.results.map((r) => r.key)).toEqual(['ult', 'spec:x']);
    expect(e.events.some((x) => x.kind === 'no-adrenaline' || x.kind === 'wrong-weapon')).toBe(false);
  });

  it('a cooldown, a missing potion and a prayer of the other book refuse nothing', () => {
    const a = ability('a', { cooldownTicks: 50 });
    const pot: EngineEntity = { key: 'special:adrenaline-potion', id: 'adrenaline-potion', kind: 'special', name: 'pot', icon: '', gcd: false, abilityType: 'Basic', adrenaline: 25, cooldownTicks: 200, buffs: [] };
    const pray: EngineEntity = { key: 'prayer:soul-split', id: 'soul-split', kind: 'prayer', name: 'Soul Split', icon: '', gcd: false, abilityType: 'Basic', adrenaline: 0, cooldownTicks: 0, buffs: [] };
    const e = make([a, pot, pray, a], { hasItem: () => false, prayerBook: 'Prayers' });
    cast(e, 'a', 1);
    cast(e, 'special:adrenaline-potion', 2);
    cast(e, 'prayer:soul-split', 2);
    cast(e, 'a', 4); // 50-tick cooldown: refused in the game, cast in the drill
    expect(e.results.map((r) => r.key)).toEqual(['a', 'special:adrenaline-potion', 'prayer:soul-split', 'a']);
    expect(e.events.filter((x) => x.kind === 'on-cooldown' || x.kind === 'requirement' || x.kind === 'wrong-book')).toEqual([]);
  });

  it('the global cooldown still counts: a press inside it is too early (queueing off) and nothing casts', () => {
    const a = ability('a');
    const b = ability('b');
    const e = make([a, b]);
    cast(e, 'a', 1);
    cast(e, 'b', 2); // one tick after the cast: inside the 3-tick GCD
    expect(e.results.map((r) => r.key)).toEqual(['a']);
    expect(e.events.some((x) => x.kind === 'too-early' && x.key === 'b')).toBe(true);
    cast(e, 'b', 4);
    expect(e.results.map((r) => r.key)).toEqual(['a', 'b']);
  });

  it('is off by default: the same cast is refused for want of adrenaline', () => {
    const ult = ability('ult', { abilityType: 'Ultimate', adrenaline: -100 });
    const e = make([ult], { keyDrill: false }, 0);
    cast(e, 'ult', 1);
    expect(e.results).toHaveLength(0);
    expect(e.events.some((x) => x.kind === 'no-adrenaline')).toBe(true);
  });
});

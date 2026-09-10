/**
 * Two workarounds Martin asked for (10 Sep 2026) while the adrenaline economy of some guides is beyond the model:
 * "ignore adrenaline needs" casts whatever the bar shows, and "wait for my cast" stops the clock on the tick the next
 * step is due until the right key comes: buffs, cooldowns, adrenaline and the enemy wait with it, every other key is
 * refused, and a same-tick group ("release + naturalinstinct", "chaosroar + switches + bd") is waited for step by step.
 */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 20, damageMin: 100, damageMax: 100, buffs: [], ...extra };
}
function offGcd(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'ability', name: key, icon: '', gcd: false, abilityType: 'Basic', adrenaline: 0, cooldownTicks: 30, buffs: [], ...extra };
}

function make(steps: EngineEntity[], cfg: Partial<EngineConfig> = {}, startAdrenaline = 100): TrainerEngine {
  const catalog = new Map(steps.map((e) => [e.key, e] as const));
  catalog.set('x', ability('x'));
  const e = new TrainerEngine(steps, catalog, {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: false, hitChanceDisabled: true,
    loadout: { ...defaultResolvedLoadout(), style: 'Melee', abilityDamage: 1000, startAdrenaline },
    ...cfg,
  });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

describe('ignore adrenaline needs', () => {
  it('an ultimate casts with an empty bar; the cost is still taken and the bar floors at 0', () => {
    const ult = ability('ult', { abilityType: 'Ultimate', adrenaline: -100 });
    const e = make([ult], { ignoreAdrenaline: true }, 30);
    e.press('ult', 1);
    e.update(4 * T);
    expect(e.results.map((r) => r.key)).toEqual(['ult']);
    expect(e.adrenaline).toBe(0);
    expect(e.events.some((x) => x.kind === 'no-adrenaline')).toBe(false);
  });
});

describe('wait for my cast (step mode)', () => {
  it('the clock stops on the tick the step is due and runs again with the right key; a wrong key is refused', () => {
    const a = ability('a');
    const b = ability('b');
    const e = make([a, b], { stepMode: true });
    e.update(5 * T); // nothing pressed: the clock stops at once, on tick 0
    expect(e.frozen).toBe(true);
    expect(e.currentTick(9 * T)).toBe(0); // and stays there whatever the wall clock says
    e.press('x', 9 * T); // the wrong one
    e.update(9 * T + 1);
    expect(e.events.some((x) => x.kind === 'wrong' && x.key === 'x')).toBe(true);
    expect(e.results).toHaveLength(0);
    e.update(12 * T);
    expect(e.frozen).toBe(true); // stopped right back
    e.press('a', 12 * T);
    e.update(12 * T + 1);
    expect(e.results.map((r) => r.key)).toEqual(['a']);
    // the global cooldown of a runs on its own three ticks, then the clock stops for b
    e.update(12 * T + 3 * T + 1);
    expect(e.frozen).toBe(true);
    expect(e.index).toBe(1);
    e.update(30 * T);
    expect(e.currentTick(30 * T)).toBe(3); // frozen at the GCD end, tick 3 of the engine's own clock
  });

  it('nothing moves while the clock stands: buffs keep their remaining ticks', () => {
    const buff = ability('buff', { buffs: [{ id: 'my-buff', name: 'My buff', kind: 'Buff', on: 'self', icon: null, durationTicks: 10 }] });
    const b = ability('b');
    const e = make([buff, b], { stepMode: true });
    e.press('buff', 1);
    e.update(4 * T); // cast on tick 1, buff until tick 11; the clock stops at the GCD end (tick 4)
    expect(e.frozen).toBe(true);
    const left = (e.buff('my-buff')!.endTick ?? 0) - e.currentTick(4 * T);
    e.update(60 * T);
    expect((e.buff('my-buff')!.endTick ?? 0) - e.currentTick(60 * T)).toBe(left);
  });

  it('a same-tick group is waited for key by key: the companion is due on the cast tick, the clock stops for it too', () => {
    const a = ability('a');
    const s = offGcd('s', { offsetTicks: 0 });
    const c = ability('c');
    const e = make([a, s, c], { stepMode: true });
    e.press('a', 1);
    e.update(2 * T); // a cast on tick 1; s is due on tick 1 and unpressed: the clock stops on tick 1
    expect(e.frozen).toBe(true);
    expect(e.results.map((r) => r.key)).toEqual(['a']);
    e.press('c', 2 * T); // c too early (and s open): refused
    e.update(2 * T + 1);
    expect(e.results.map((r) => r.key)).toEqual(['a']);
    e.press('s', 3 * T);
    e.update(3 * T + 1);
    expect(e.results.map((r) => r.key)).toEqual(['a', 's']);
    expect(e.results[1].outcome).toBe('perfect'); // on the tick of a, as the "+" asks
    e.update(20 * T);
    expect(e.frozen).toBe(true); // at the GCD end of a, waiting for c
    e.press('c', 20 * T);
    e.update(30 * T);
    expect(e.results.map((r) => r.key)).toEqual(['a', 's', 'c']);
    expect(e.results[2].outcome).toBe('perfect');
  });

  it('a queued press casts on its own: the clock does not stop when the cast is already on its way', () => {
    const a = ability('a');
    const b = ability('b');
    const e = make([a, b], { stepMode: true });
    e.press('a', 1);
    e.update(T + 1);
    e.press('b', 2 * T); // inside the GCD: queued for tick 4
    e.update(10 * T);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['a', 'perfect'], ['b', 'perfect']]);
  });

  it('with ping, a press while the clock stands lands on the tick it stands on and the rotation goes on (a weapon switch first)', () => {
    const sword: EngineEntity = { key: 'weapon:sword', id: 'sword', kind: 'weapon', name: 'Sword', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], style: 'Melee' };
    const a = ability('a');
    const e = make([sword, a], { stepMode: true, pingMs: 60 });
    e.update(2 * T);
    expect(e.frozen).toBe(true);
    e.press('weapon:sword', 2 * T);
    e.update(2 * T + 20);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['weapon:sword', 'done']]);
    expect(e.frozen).toBe(true); // waiting for a on the same tick
    e.press('a', 3 * T);
    e.update(3 * T + 20);
    expect(e.results.map((r) => r.key)).toEqual(['weapon:sword', 'a']);
    expect(e.results[1].outcome).toBe('perfect');
  });

  it('no basic attack slips in on its own: with auto attacks on, the clock stops at the GCD end all the same', () => {
    const a = ability('a');
    const b = ability('b');
    const e = make([a, b], { stepMode: true, autoAttacks: true, loadout: { ...defaultResolvedLoadout(), style: 'Melee', abilityDamage: 1000, startAdrenaline: 100 } });
    e.press('a', 1);
    e.update(12 * T);
    expect(e.frozen).toBe(true);
    expect(e.currentTick(12 * T)).toBe(4); // a cast on tick 1, GCD end tick 4, stopped there
    expect(e.events.some((x) => x.kind === 'auto-attack')).toBe(false);
    expect(e.results.map((r) => r.key)).toEqual(['a']);
  });

  it('the expected ability still on cooldown: the clock runs on until it is ready and stops there', () => {
    const a = ability('a', { cooldownTicks: 40 });
    const b = ability('b');
    const e = make([a, b, a], { stepMode: true });
    e.press('a', 1);
    e.update(4 * T); // a cast on tick 1 (ready again on tick 41), the clock stops on tick 4 for b
    expect(e.frozen).toBe(true);
    e.press('b', 4 * T);
    e.update(12 * T); // b cast on tick 4, GCD end tick 7: a is due but 34 ticks from ready, so the clock keeps running
    expect(e.frozen).toBe(false);
    expect(e.currentTick(12 * T)).toBe(12);
    e.update(50 * T);
    expect(e.frozen).toBe(true);
    expect(e.currentTick(50 * T)).toBe(41); // stopped on the tick a came off cooldown
    e.press('a', 50 * T);
    e.update(50 * T + 1);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['a', 'perfect'], ['b', 'perfect'], ['a', 'perfect']]);
  });

  it('pressing the expected ability while its long cooldown runs does not end the session stuck: the press queues and casts when it is ready', () => {
    const a = ability('a', { cooldownTicks: 40 });
    const b = ability('b');
    const e = make([a, b, a, b], { stepMode: true });
    e.press('a', 1);
    e.update(4 * T);
    e.press('b', 4 * T);
    e.update(12 * T);
    e.press('a', 12 * T); // 29 ticks from ready: longer than STUCK_COOLDOWN_TICKS, which ends a normal session
    e.update(50 * T);
    expect(e.state).toBe('running');
    expect(e.frozen).toBe(true); // at the GCD end of the third cast, waiting for b
    expect(e.events.some((x) => x.kind === 'stuck')).toBe(false);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['a', 'perfect'], ['b', 'perfect'], ['a', 'perfect']]);
  });

  it('Bladed Dive written as a "+" companion completes its step during the GCD of the cast before it', () => {
    // "chaosroar + (switches) + bd to kerapac": Bladed Dive is off the GCD while one runs (rules-melee offGcdNoGain)
    const roar = ability('roar');
    const bd: EngineEntity = { key: 'ability:bladed-dive', id: 'bladed-dive', kind: 'ability', name: 'Bladed Dive', icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 34, damageMin: 25, damageMax: 125, buffs: [], offsetTicks: 0 };
    const next = ability('next');
    const e = make([roar, bd, next], { stepMode: true, loadout: { ...defaultResolvedLoadout(), style: 'Melee', abilityDamage: 1000, startAdrenaline: 100, hasDualWield: true } });
    e.press('roar', 1);
    e.update(2 * T); // cast on tick 1, GCD to 4; Bladed Dive is due on tick 1, the clock stops there
    expect(e.frozen).toBe(true);
    e.press('ability:bladed-dive', 2 * T);
    e.update(2 * T + 1);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['roar', 'perfect'], ['ability:bladed-dive', 'perfect']]);
    expect(e.events.some((x) => x.kind === 'wrong-fired')).toBe(false);
  });
});

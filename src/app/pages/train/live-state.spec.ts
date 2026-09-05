/**
 * The Train page's render loop asks the engine about every catalog entry once per server tick (catalogPass) and derives
 * the per-frame numbers arithmetically (cooldownViews). This spec pins two things: the per-tick pass loses nothing
 * against a pass on every frame (same usability, same cooldown ends inside a tick), and the engine work per second
 * drops by more than an order of magnitude against the old every-frame loop.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../../public/data/abilities.json';
import { Ability } from '../../core/models';
import { defaultResolvedLoadout } from '../../engine/loadout-resolved';
import { EngineEntity, TICK_MS, TrainerEngine } from '../../engine/trainer-engine';
import { catalogPass, cooldownViews, sameMorphs, sameUsable } from './live-state';

const DATA = ABILITIES as unknown as Ability[];

function ability(a: Ability): EngineEntity {
  return {
    key: 'ability:' + a.id, kind: 'ability', id: a.id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [], damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

/** an engine with a catalog like the app's: ~100 abilities of every style, a necromancy rotation, one cast at tick 1 */
function make(): { e: TrainerEngine; counts: Record<string, number> } {
  const catalog = new Map<string, EngineEntity>();
  for (const a of DATA.slice(0, 100)) catalog.set('ability:' + a.id, ability(a));
  const steps = ['touch-of-death', 'soul-sap', 'necromancy'].map((id) => catalog.get('ability:' + id)!);
  for (const s of steps) if (!s) throw new Error('fixture ability missing');
  const l = { ...defaultResolvedLoadout(), style: 'Necromancy' as const, hasConduit: true, abilityDamage: 1000 };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: false, fullAdrenaline: true, hitChanceDisabled: true, loadout: l });
  e.random = () => 0.5;
  e.start(0);
  const counts: Record<string, number> = { usable: 0, morphOf: 0, cooldownLeft: 0, cooldownTotalTicks: 0 };
  for (const m of Object.keys(counts) as (keyof TrainerEngine & keyof typeof counts)[]) {
    const orig = (e[m] as (...a: unknown[]) => unknown).bind(e);
    (e as unknown as Record<string, unknown>)[m] = (...a: unknown[]) => {
      counts[m]++;
      return orig(...a);
    };
  }
  e.press('ability:touch-of-death', 1);
  return { e, counts };
}

const FPS = 60;
const FRAMES = 60; // one second: ticks 0 and 1 (600 ms each), a cast at tick 1, its cooldown and GCD running
const total = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + b, 0);

describe('catalogPass per tick vs per frame', () => {
  it('inside a tick a fresh pass sees exactly what the per-tick pass saw; the cooldown seconds are the same arithmetic', () => {
    const { e } = make();
    let lastTick = -1;
    let cached = catalogPass(e, 0);
    for (let f = 0; f < FRAMES; f++) {
      const now = (f * 1000) / FPS;
      e.update(now);
      e.events.length = 0;
      const tick = e.currentTick(now);
      if (tick !== lastTick) {
        lastTick = tick;
        cached = catalogPass(e, tick);
      }
      const fresh = catalogPass(e, tick);
      expect(sameUsable(fresh.usable, cached.usable)).toBe(true);
      expect(sameMorphs(fresh.morphs, cached.morphs)).toBe(true);
      expect([...fresh.cooling]).toEqual([...cached.cooling]);
      const views = cooldownViews(e, cached.cooling, now);
      for (const [key, c] of cached.cooling) {
        // the old loop: remainingMs = tickTime(tick + cooldownLeft) - now, phase = 1 - remaining / total
        const remainingMs = e.tickTime(tick + e.cooldownLeft(key, tick)) - now;
        if (remainingMs <= 0) expect(views.has(key)).toBe(false);
        else {
          expect(views.get(key)!.cooldownS).toBeCloseTo(remainingMs / 1000, 9);
          expect(views.get(key)!.cooldownPhase).toBeCloseTo(Math.max(0, Math.min(1, 1 - remainingMs / (c.totalTicks * TICK_MS))), 9);
        }
      }
    }
    // the cast at tick 1 put Touch of Death on cooldown: the per-frame views carried it
    expect(cached.cooling.has('ability:touch-of-death')).toBe(true);
  });

  it('engine calls per second: the per-tick pass needs less than 5% of the every-frame loop', () => {
    const perFrame = make();
    for (let f = 0; f < FRAMES; f++) {
      const now = (f * 1000) / FPS;
      perFrame.e.update(now);
      catalogPass(perFrame.e, perFrame.e.currentTick(now)); // the old loop: every frame, plus a second morphOf loop
      for (const key of perFrame.e.catalog.keys()) perFrame.e.morphOf(key, perFrame.e.currentTick(now));
    }
    const perTick = make();
    let lastTick = -1;
    let cooling = new Map();
    for (let f = 0; f < FRAMES; f++) {
      const now = (f * 1000) / FPS;
      perTick.e.update(now);
      const tick = perTick.e.currentTick(now);
      if (tick !== lastTick) {
        lastTick = tick;
        cooling = catalogPass(perTick.e, tick).cooling;
      }
      cooldownViews(perTick.e, cooling, now);
    }
    const before = total(perFrame.counts);
    const after = total(perTick.counts);
    console.log(`engine calls in 1 s (100-entry catalog, 60 fps): every frame ${before} → per tick ${after} (${((after / before) * 100).toFixed(1)}%)`);
    expect(after).toBeLessThan(before * 0.05);
    expect(perTick.counts['usable']).toBe(200); // 100 entries × 2 ticks
  });
});

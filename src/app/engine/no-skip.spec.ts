/**
 * noSkip (Martin, 27 Oct 2026, after a hidden-mode session skipped a Sticky bomb he could not see): with it, a GCD
 * ability whose cast would leave an earlier off-GCD step unpressed is refused at its cast tick and the step is
 * named, instead of the step being marked missed and the rotation going on.
 */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 20, damageMin: 100, damageMax: 100, buffs: [], ...extra };
}
const bomb: EngineEntity = { key: 'special:sticky-bomb', id: 'sticky-bomb', kind: 'special', name: 'Sticky bomb', icon: '', gcd: false, abilityType: 'Basic', adrenaline: 0, cooldownTicks: 0, buffs: [] };

function make(steps: EngineEntity[], cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const catalog = new Map(steps.map((e) => [e.key, e] as const));
  const e = new TrainerEngine(steps, catalog, {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: false, hitChanceDisabled: true, keyDrill: true,
    loadout: { ...defaultResolvedLoadout(), style: 'Melee', abilityDamage: 1000, startAdrenaline: 100 },
    ...cfg,
  });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

function cast(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, tick * T);
  e.update(tick * T + 1);
}

describe('noSkip', () => {
  it('without it the bomb is marked missed and the rotation goes on (the old behaviour)', () => {
    const e = make([ability('a'), bomb, ability('b')]);
    cast(e, 'a', 1);
    cast(e, 'b', 4);
    expect(e.results.map((r) => r.key + ':' + r.outcome)).toEqual(['a:perfect', 'special:sticky-bomb:missed', 'b:perfect']);
  });

  it('with it the cast is refused, the bomb is named, and after the bomb the ability casts', () => {
    const e = make([ability('a'), bomb, ability('b')], { noSkip: true });
    cast(e, 'a', 1);
    cast(e, 'b', 4);
    const refused = e.events.find((x) => x.kind === 'skip-refused');
    expect(refused && refused.kind === 'skip-refused' ? refused.skipped : null).toEqual([1]);
    expect(e.results.map((r) => r.key)).toEqual(['a']);
    cast(e, 'special:sticky-bomb', 6);
    cast(e, 'b', 7);
    expect(e.results.map((r) => r.key + ':' + r.outcome)).toEqual(['a:perfect', 'special:sticky-bomb:done', 'b:late']);
    expect(e.events.filter((x) => x.kind === 'missed')).toEqual([]);
  });

  it('a plain note between the steps is no reason to refuse', () => {
    const note: EngineEntity = { key: 'note:1', id: '1', kind: 'ability', name: 'note', icon: '', gcd: false, abilityType: 'Basic', adrenaline: 0, cooldownTicks: 0, buffs: [], isNote: true };
    const e = make([ability('a'), note, ability('b')], { noSkip: true });
    cast(e, 'a', 1);
    cast(e, 'b', 4);
    expect(e.results.map((r) => r.key)).toEqual(['a', 'b']);
    expect(e.events.some((x) => x.kind === 'skip-refused')).toBe(false);
  });
});

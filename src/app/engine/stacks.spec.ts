import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { BUFF_BY_ID, STACK_DEFS, stackMax } from './rules';
import { StackId } from './rules-model';
import { EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const STACK_IDS: StackId[] = ['bloodlust', 'necrosis', 'residual-souls', 'storm-shards', 'death-spark', 'soul-reave', 'valour', 'glacial-embrace', 'essence-corruption', 'concentrated-crit', 'revenge'];

function ability(id: string, style: EngineEntity['style'], extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key: 'ability:' + id, kind: 'ability', id, name: id, icon: '', gcd: true, adrenaline: 9, cooldownTicks: 0, buffs: [], style, abilityType: 'Basic', ...extra };
}

function engine(steps: EngineEntity[], style: 'Melee' | 'Necromancy', caps: Partial<Record<StackId, number>> = {}): TrainerEngine {
  const loadout = defaultResolvedLoadout();
  loadout.style = style;
  loadout.hasConduit = style === 'Necromancy';
  loadout.stackCaps = caps;
  const e = new TrainerEngine(steps, new Map(steps.map((s) => [s.key, s])), { pingMs: 0, jitterMs: 0, abilityQueueing: false, loop: true, loadout });
  e.random = () => 0.99;
  e.start(0);
  return e;
}

/** presses the current step at the next tick and processes it */
function cast(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, tick * TICK_MS);
  e.update((tick + 1) * TICK_MS);
}

describe('stacks are buffs', () => {
  it('every StackId has a buff definition with a cap', () => {
    for (const id of STACK_IDS) {
      expect(STACK_DEFS[id], id).toBeDefined();
      expect(STACK_DEFS[id].stacks?.max, id).toBeGreaterThan(0);
      expect(BUFF_BY_ID.get(id)?.stacks?.max).toBe(STACK_DEFS[id].stacks?.max);
    }
  });

  it('a stack shows up as a buff with its counter and disappears at 0', () => {
    const touch = ability('touch-of-death', 'Necromancy');
    const finger = ability('finger-of-death', 'Necromancy', { abilityType: 'Enhanced', adrenaline: -60 });
    const e = engine([touch, finger], 'Necromancy');
    e.adrenaline = 100;
    expect(e.buffs.some((b) => b.id === 'necrosis')).toBe(false);
    cast(e, touch.key, 1);
    expect(e.stack('necrosis')).toBe(4);
    const buff = e.buff('necrosis');
    expect(buff?.stacks).toBe(4);
    expect(buff?.endTick).toBeNull();
    expect(buff?.name).toBe('Necrosis');
    cast(e, finger.key, 4); // consumes up to 6 → 0
    expect(e.stack('necrosis')).toBe(0);
    expect(e.buffs.some((b) => b.id === 'necrosis')).toBe(false);
  });

  it('caps come from the definition and can be raised by the loadout', () => {
    const sap = ability('soul-sap', 'Necromancy');
    const e = engine([sap], 'Necromancy');
    for (let t = 1; t <= 15; t += 3) cast(e, sap.key, t);
    expect(e.stack('residual-souls')).toBe(3);
    expect(stackMax('residual-souls')).toBe(3);
    const l = engine([sap], 'Necromancy', { 'residual-souls': 5 });
    for (let t = 1; t <= 15; t += 3) cast(l, sap.key, t);
    expect(l.stack('residual-souls')).toBe(5);
    expect(stackMax('residual-souls', { 'residual-souls': 5 })).toBe(5);
  });

  it('Volley of Souls fires one hit per stack held before the cast', () => {
    const sap = ability('soul-sap', 'Necromancy');
    const volley = ability('volley-of-souls', 'Necromancy', { abilityType: 'Enhanced', adrenaline: -15 });
    const e = engine([sap, sap, volley], 'Necromancy');
    e.adrenaline = 100;
    cast(e, sap.key, 1);
    cast(e, sap.key, 4);
    expect(e.stack('residual-souls')).toBe(2);
    cast(e, volley.key, 7);
    expect(e.results.at(-1)?.key).toBe(volley.key);
    expect(e.stack('residual-souls')).toBe(0);
  });
});

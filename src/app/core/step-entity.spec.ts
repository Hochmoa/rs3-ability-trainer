import { describe, expect, it } from 'vitest';
import { EngineEntity } from '../engine/trainer-engine';
import { Entity } from './data.service';
import { RotationStep } from './models';
import { noteEntity, stepToEngineEntity } from './step-entity';

const asphyx: Entity = { key: 'ability:asphyxiate', kind: 'ability', id: 'asphyxiate', name: 'Asphyxiate', icon: 'a.png', group: 'Magic' };
const toEngine = (e: Entity): EngineEntity => ({ key: e.key, kind: e.kind, id: e.id, name: e.name, icon: e.icon, gcd: true, adrenaline: -15, cooldownTicks: 33, buffs: [] });

describe('stepToEngineEntity – the PvME timing of a step reaches the engine', () => {
  it('a plain step is the catalog entity, untouched', () => {
    const ee = stepToEngineEntity({ kind: 'ability', id: 'asphyxiate' }, asphyx, toEngine);
    expect(ee).toEqual(toEngine(asphyx));
    expect(ee.offsetTicks).toBeUndefined();
    expect(ee.cancelAfterTicks).toBeUndefined();
    expect(ee.afterHits).toBeUndefined();
  });

  it('"+" becomes offset 0, "2t" its offset; an explicit offset wins over sameTick', () => {
    expect(stepToEngineEntity({ kind: 'ability', id: 'asphyxiate', sameTick: true }, asphyx, toEngine).offsetTicks).toBe(0);
    expect(stepToEngineEntity({ kind: 'ability', id: 'asphyxiate', offsetTicks: 2 }, asphyx, toEngine).offsetTicks).toBe(2);
    expect(stepToEngineEntity({ kind: 'ability', id: 'asphyxiate', offsetTicks: 2, sameTick: true }, asphyx, toEngine).offsetTicks).toBe(2);
  });

  it('"asphyx (4t) →" and "7 hit rapid" are copied (cancelAfterTicks / afterHits)', () => {
    const cut = stepToEngineEntity({ kind: 'ability', id: 'asphyxiate', cancelAfterTicks: 4 }, asphyx, toEngine);
    expect(cut.cancelAfterTicks).toBe(4);
    expect(cut.afterHits).toBeUndefined();
    const hits = stepToEngineEntity({ kind: 'ability', id: 'asphyxiate', afterHits: 7 }, asphyx, toEngine);
    expect(hits.afterHits).toBe(7);
    expect(hits.cancelAfterTicks).toBeUndefined();
  });

  it('does not mutate what the catalog returned', () => {
    const base = toEngine(asphyx);
    stepToEngineEntity({ kind: 'ability', id: 'asphyxiate', cancelAfterTicks: 3, sameTick: true }, asphyx, () => base);
    expect(base.cancelAfterTicks).toBeUndefined();
    expect(base.offsetTicks).toBeUndefined();
  });

  it('a note is an inert off-GCD entity the engine skips', () => {
    const step: RotationStep = { kind: 'note', id: '', note: 'Phase 2', phase: true };
    const note = noteEntity(step, 3);
    expect(note.key).toBe('note:3');
    expect(note.icon).toContain('phase');
    const ee = stepToEngineEntity(step, note, toEngine);
    expect(ee).toMatchObject({ key: 'note:3', kind: 'action', isNote: true, gcd: false, adrenaline: 0, cooldownTicks: 0 });
  });
});

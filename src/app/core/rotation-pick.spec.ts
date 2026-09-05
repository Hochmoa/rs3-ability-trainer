import { describe, expect, it } from 'vitest';
import { Rotation, StepResult } from './models';
import { nextRotation, pickRotation, presetSiblings, worstStep } from './rotation-pick';

const rot = (id: string, extra: Partial<Rotation> = {}): Rotation => ({ id, name: id, steps: [], updatedAt: 0, ...extra });

describe('pickRotation', () => {
  const list = [rot('a'), rot('b'), rot('c')];

  it('prefers the rotation the URL asks for', () => {
    expect(pickRotation(list, 'b', 'a')?.id).toBe('b');
  });

  it('keeps the current one when the URL names nothing or something unknown', () => {
    expect(pickRotation(list, null, 'c')?.id).toBe('c');
    expect(pickRotation(list, 'gone', 'c')?.id).toBe('c');
  });

  it('falls back to the first rotation, or null on an empty list', () => {
    expect(pickRotation(list, 'gone', 'gone')?.id).toBe('a');
    expect(pickRotation([], 'a', 'a')).toBeNull();
  });
});

describe('nextRotation', () => {
  const rasial = [
    rot('p4', { name: 'Rasial – Phase 4', presetId: 'rasial', presetIndex: 2 }),
    rot('pre', { name: 'Rasial – Pre-build', presetId: 'rasial', presetIndex: 0 }),
    rot('p13', { name: 'Rasial – Phase 1-3', presetId: 'rasial', presetIndex: 1 }),
    rot('other', { name: 'Zamorak – Phase 1', presetId: 'zamorak' }),
    rot('mine', { name: 'My rotation' }),
  ];

  it('orders the siblings of a preset by their guide index', () => {
    expect(presetSiblings(rasial, 'rasial').map((r) => r.id)).toEqual(['pre', 'p13', 'p4']);
  });

  it('returns the sibling after the current one, and null after the last', () => {
    expect(nextRotation(rasial, rasial[2])?.id).toBe('p4');
    expect(nextRotation(rasial, rasial[1])?.id).toBe('p13');
    expect(nextRotation(rasial, rasial[0])).toBeNull();
  });

  it('has no next for a rotation without a preset', () => {
    expect(nextRotation(rasial, rasial[4])).toBeNull();
    expect(nextRotation(rasial, null)).toBeNull();
  });

  it('orders by name with numbers compared as numbers when the index is missing (older imports)', () => {
    const list = [rot('b', { name: 'Boss – Phase 10', presetId: 'x' }), rot('a', { name: 'Boss – Phase 2', presetId: 'x' }), rot('c', { name: 'Boss – Phase 1', presetId: 'x' })];
    expect(presetSiblings(list, 'x').map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(nextRotation(list, list[1])?.id).toBe('b');
  });
});

describe('worstStep', () => {
  const res = (name: string, outcome: StepResult['outcome'], lateTicks = 0): StepResult => ({ step: 0, key: 'ability:' + name, name, kind: 'ability', outcome, lateTicks, offsetMs: 0, tooEarly: 0, wrong: 0, firedAtTick: 0, adrenaline: 0 });

  it('is the step with the most ticks off, early counted like late', () => {
    expect(worstStep([res('a', 'perfect'), res('b', 'late', 1), res('c', 'early', -2), res('d', 'late', 2)])?.name).toBe('c');
  });

  it('is null when nothing was late or early', () => {
    expect(worstStep([res('a', 'perfect'), res('b', 'done')])).toBeNull();
    expect(worstStep([])).toBeNull();
  });
});

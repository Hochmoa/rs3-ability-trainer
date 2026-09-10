import { describe, expect, it } from 'vitest';
import { Rotation, StepResult, inWarsRetreat } from './models';
import { chainRotations, nextRotation, pickRotation, setupRotations, worstStep } from './rotation-pick';

const rot = (id: string, extra: Partial<Rotation> = {}): Rotation => ({ id, name: id, steps: [], updatedAt: 0, setupId: 'own', ...extra });

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
    rot('p4', { name: 'Rasial – Phase 4', setupId: 'rasial', presetIndex: 2 }),
    rot('pre', { name: 'Rasial – Pre-build', setupId: 'rasial', presetIndex: 0 }),
    rot('p13', { name: 'Rasial – Phase 1-3', setupId: 'rasial', presetIndex: 1 }),
    rot('other', { name: 'Zamorak – Phase 1', setupId: 'zamorak' }),
    rot('mine', { name: 'My rotation' }),
  ];

  it('orders the rotations of a setup by their guide index', () => {
    expect(setupRotations(rasial, 'rasial').map((r) => r.id)).toEqual(['pre', 'p13', 'p4']);
  });

  it('returns the sibling after the current one, and null after the last', () => {
    expect(nextRotation(rasial, rasial[2])?.id).toBe('p4');
    expect(nextRotation(rasial, rasial[1])?.id).toBe('p13');
    expect(nextRotation(rasial, rasial[0])).toBeNull();
  });

  it('has no next for the only rotation of its setup', () => {
    expect(nextRotation(rasial, rasial[4])).toBeNull();
    expect(nextRotation(rasial, null)).toBeNull();
  });

  it('orders by name with numbers compared as numbers when the index is missing (older imports)', () => {
    const list = [rot('b', { name: 'Boss – Phase 10', setupId: 'x' }), rot('a', { name: 'Boss – Phase 2', setupId: 'x' }), rot('c', { name: 'Boss – Phase 1', setupId: 'x' })];
    expect(setupRotations(list, 'x').map((r) => r.id)).toEqual(['c', 'a', 'b']);
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

describe('chainRotations', () => {
  const rot = (id: string, name: string, steps: Rotation['steps'], presetIndex: number): Rotation => ({ id, name, steps, updatedAt: 0, setupId: 's', presetIndex });

  it('one rotation plays as it is, several become one with a click note between them', () => {
    const a = rot('a', 'Wars', [{ kind: 'ability', id: 'sever' }], 0);
    const b = rot('b', 'Phase 1', [{ kind: 'ability', id: 'cleave' }], 1);
    expect(chainRotations([a])).toBe(a);
    const c = chainRotations([a, b])!;
    expect(c.id).toBe('a');
    expect(c.name).toBe('Wars and 1 more');
    expect(c.steps).toEqual([{ kind: 'ability', id: 'sever' }, { kind: 'note', id: '', note: 'Next: Phase 1', requiresAction: true, actionTicks: 0 }, { kind: 'ability', id: 'cleave' }]);
  });

  it('a stall at the end of the pre-build meets its release at the start of the fight', () => {
    const a = rot('a', 'Wars', [{ kind: 'ability', id: 'meteor-strike', hint: 'stall' }], 0);
    const b = rot('b', 'Prior to Start', [{ kind: 'ability', id: 'meteor-strike', hint: 'release' }, { kind: 'ability', id: 'cleave' }], 1);
    const c = chainRotations([a, b])!;
    expect(c.steps[0]).toMatchObject({ id: 'meteor-strike', stall: true });
    expect(c.steps[2]).toMatchObject({ id: 'meteor-strike', release: true });
    // played alone, the stall has no release in reach and stays a plain cast
    expect(chainRotations([a])!.steps[0].stall).toBeUndefined();
  });
});

describe("in War's Retreat", () => {
  const rot = (name: string, warsRetreat?: boolean): Rotation => ({ id: 'x', name, steps: [], updatedAt: 0, setupId: 's', warsRetreat });

  it("the name decides when the player said nothing: Wars, War's Retreat, Pre-build, but not a boss phase or a warrior", () => {
    for (const n of ['Wars', "War's Retreat", "wars's retreat", 'melee wars reset (120 kph)', "Method 1 · War's Retreat", 'Prebuild', 'Kezalam · Pre-build']) expect(inWarsRetreat(rot(n)), n).toBe(true);
    for (const n of ['Phase 1', 'Prior to Start', '3 warriors 2 scouts', 'if no divert adren, end timewarp', 'Rasial']) expect(inWarsRetreat(rot(n)), n).toBe(false);
  });

  it("the player's answer wins over the name", () => {
    expect(inWarsRetreat(rot('Wars', false))).toBe(false);
    expect(inWarsRetreat(rot('Phase 1', true))).toBe(true);
  });

  it("a chained session remembers where each rotation starts and whether it is in War's Retreat", () => {
    const a: Rotation = { id: 'a', name: 'Wars', steps: [{ kind: 'ability', id: 'sever' }, { kind: 'ability', id: 'cleave' }], updatedAt: 0, setupId: 's', presetIndex: 0 };
    const b: Rotation = { id: 'b', name: 'Phase 1', steps: [{ kind: 'ability', id: 'assault' }], updatedAt: 0, setupId: 's', presetIndex: 1 };
    const c = chainRotations([a, b])!;
    expect(c.segments).toEqual([{ from: 0, name: 'Wars', warsRetreat: true }, { from: 3, name: 'Phase 1', warsRetreat: false }]);
    expect(chainRotations([a])!.segments).toBeUndefined();
  });
});

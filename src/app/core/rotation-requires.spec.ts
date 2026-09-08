import { describe, expect, it } from 'vitest';
import { RotationStep, emptyPrebuild } from './models';
import { prebuildFor, rotationAssumptions } from './rotation-requires';

const step = (id: string, kind: RotationStep['kind'] = 'ability'): RotationStep => ({ kind, id });
const texts = (steps: RotationStep[], pb?: Parameters<typeof rotationAssumptions>[1]) => rotationAssumptions(steps, pb).map((a) => a.id + ': ' + a.text);

describe('what a rotation assumes', () => {
  it('a command without its conjure is reported, with the conjure that would establish it', () => {
    const a = rotationAssumptions([step('touch-of-death'), step('command-skeleton-warrior')]);
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ step: 1, id: 'command-skeleton-warrior', from: 'conjure-skeleton-warrior', fix: { kind: 'spirit', spirit: 'skeleton-warrior' } });
    expect(a[0].text).toContain('Skeleton Warrior');
  });

  it('the conjure earlier in the rotation settles it – and Conjure Undead Army settles all three', () => {
    expect(texts([step('conjure-skeleton-warrior'), step('command-skeleton-warrior')])).toEqual([]);
    expect(texts([step('conjure-undead-army'), step('command-skeleton-warrior'), step('command-vengeful-ghost'), step('command-putrid-zombie')])).toEqual([]);
  });

  it('a conjure after the command does not help the command before it', () => {
    expect(texts([step('command-skeleton-warrior'), step('conjure-skeleton-warrior')])).toHaveLength(1);
  });

  it('the pre-build settles it: that is what a PvME fight rotation assumes', () => {
    const steps = [step('command-skeleton-warrior'), step('volley-of-souls')];
    expect(texts(steps)).toHaveLength(2);
    expect(texts(steps, { ...emptyPrebuild(), spirits: ['skeleton-warrior'], stacks: { 'residual-souls': 5 } })).toEqual([]);
  });

  it('a stack the rotation builds itself is not an assumption, too few pre-built ones are', () => {
    expect(texts([step('soul-sap'), step('volley-of-souls')])).toEqual([]);
    expect(texts([step('volley-of-souls')], { ...emptyPrebuild(), stacks: { 'residual-souls': 1 } })).toHaveLength(1);
  });

  it('the same missing conjure is reported once, however often the rotation commands', () => {
    expect(texts([step('command-skeleton-warrior'), step('touch-of-death'), step('command-skeleton-warrior')])).toHaveLength(1);
  });

  it('an ability bar chain names the cast that has to come first', () => {
    const a = rotationAssumptions([step('slaughter')]);
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ id: 'slaughter', from: 'dismember' });
    expect(rotationAssumptions([step('dismember'), step('slaughter'), step('destroy')])).toEqual([]);
  });

  it('notes and unknown steps are passed over', () => {
    expect(texts([{ kind: 'note', id: '', note: 'enter instance' }, step('touch-of-death'), step('not-an-ability')])).toEqual([]);
  });

  it('the pre-build it suggests holds the spirits and the stacks, capped by the loadout', () => {
    const steps = [step('command-skeleton-warrior'), step('volley-of-souls')];
    const pb = prebuildFor(emptyPrebuild(), rotationAssumptions(steps), () => 5);
    expect(pb.spirits).toEqual(['skeleton-warrior']);
    expect(pb.stacks['residual-souls']).toBe(2);
    expect(prebuildFor(emptyPrebuild(), rotationAssumptions(steps), () => 1).stacks['residual-souls']).toBe(1);
  });
});

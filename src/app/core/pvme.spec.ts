import { describe, expect, it } from 'vitest';
import { RotationStep } from './models';
import { parsePvme } from './pvme';

const ALIASES: Record<string, RotationStep[]> = {
  bloat: [{ kind: 'ability', id: 'bloat' }],
  vulnbomb: [{ kind: 'special', id: 'vulnerability-bomb' }],
  deathskulls: [{ kind: 'ability', id: 'death-skulls' }],
  necrobasic: [{ kind: 'ability', id: 'necromancy' }],
  touchofdeath: [{ kind: 'ability', id: 'touch-of-death' }],
  soulsap: [{ kind: 'ability', id: 'soul-sap' }],
  livingdeath: [{ kind: 'ability', id: 'living-death' }],
  adrenrenewal: [{ kind: 'special', id: 'adrenaline-renewal-potion' }],
  undeadslayer: [{ kind: 'ability', id: 'undead-slayer' }],
  volleyofsouls: [{ kind: 'ability', id: 'volley-of-souls' }],
  commandskeleton: [{ kind: 'ability', id: 'command-skeleton-warrior' }],
  omniguard: [{ kind: 'weapon', id: 'necromancy' }, { kind: 'spec', id: 'death-essence' }],
  deathguard90: [{ kind: 'weapon', id: 'necromancy' }, { kind: 'spec', id: 'death-grasp' }],
  spec: [{ kind: 'ability', id: 'weapon-special-attack' }],
  tc: [{ kind: 'action', id: 'target-cycle' }],
  turmoil: [{ kind: 'prayer', id: 'turmoil' }],
};
const resolve = (alias: string) => ALIASES[alias] ?? null;

const ids = (steps: RotationStep[]) => steps.map((s) => (s.kind === 'note' ? 'note:' + s.note : s.id + (s.sameTick ? '+' : '') + (s.offsetTicks !== undefined ? '@' + s.offsetTicks : '')));

describe('parsePvme', () => {
  it('splits ticks on arrows and same-tick actions on plus', () => {
    const r = parsePvme('(tc) bloat + vulnbomb → deathskulls → necrobasic → touchofdeath → soulsap', resolve);
    expect(ids(r.steps)).toEqual(['target-cycle', 'bloat+', 'vulnerability-bomb+', 'death-skulls', 'necromancy', 'touch-of-death', 'soul-sap']);
    expect(r.unknown).toEqual([]);
  });

  it('handles "2t x" offsets and weapon specs', () => {
    const r = parsePvme('deathskulls + 2t undeadslayer → volleyofsouls → omniguard spec → necrobasic → deathguard90 spec', resolve);
    expect(ids(r.steps)).toEqual([
      'death-skulls', 'undead-slayer+@2', 'volley-of-souls', 'necromancy', 'death-essence+', 'necromancy', 'necromancy', 'death-grasp+',
    ]);
  });

  it('turns prose and headings into notes', () => {
    const r = parsePvme('Phase 4\ncommandskeleton → deathskulls → improv with necrobasic / soulsap, build to 70%-80%', resolve);
    expect(r.steps[0]).toMatchObject({ kind: 'note', note: 'Phase 4', phase: true });
    expect(ids(r.steps).slice(1)).toEqual(['command-skeleton-warrior', 'death-skulls', 'note:improv with necrobasic / soulsap, build to 70%-80%']);
    expect(r.unknown).toEqual(['improv with necrobasic / soulsap, build to 70%-80%']);
  });

  it('accepts discord emoji syntax, ascii arrows and bullet lists', () => {
    const r = parsePvme('- <:livingdeath:123> + :adrenrenewal: -> touchofdeath', resolve);
    expect(ids(r.steps)).toEqual(['living-death', 'adrenaline-renewal-potion+', 'touch-of-death']);
  });

  it('keeps annotations as hints and (2t) waits as offsets', () => {
    const r = parsePvme('turmoil → (2t) → deathskulls (DW)', resolve);
    expect(r.steps[1]).toMatchObject({ id: 'death-skulls', offsetTicks: 2, hint: 'DW' });
  });

  it('keeps trailing prose after a known alias as a hint', () => {
    const r = parsePvme('deathskulls asap → soulsap', resolve);
    expect(r.steps[0]).toMatchObject({ id: 'death-skulls', hint: 'asap' });
  });
});

import { describe, expect, it } from 'vitest';
import { Loadout, Rotation, Setup, newLoadout, newSetup } from './models';
import { reconcileSetups, setupForRotation } from './setup-migration';

const loadout = (name: string, presetId?: string): Loadout => ({ ...newLoadout(name), presetId });
const rotation = (name: string, p: Partial<Rotation> = {}): Rotation => ({ id: name, name, steps: [{ kind: 'ability', id: 'sever' }], updatedAt: 1, setupId: '', ...p });
let n = 0;
const opts = { id: () => 'id' + ++n, now: () => 1000 };

describe('reconcileSetups – the old loadouts + rotations become setups', () => {
  it('a build before the setups: one setup per loadout, named from the boss prefix, the preset id carried over', () => {
    const nex = loadout('Nex – solo ranged', 'nex-ranged');
    const own = loadout('My melee');
    const out = reconcileSetups({ setups: [], loadouts: [nex, own], rotations: [], activeSetupId: null }, { ...opts, activeLoadoutId: nex.id, styleOf: (l) => (l.id === nex.id ? 'Ranged' : '') });
    expect(out.changed).toBe(true);
    expect(out.setups.map((s) => [s.boss, s.name, s.style, s.loadoutId, s.presetId])).toEqual([
      ['Nex', 'solo ranged', 'Ranged', nex.id, 'nex-ranged'],
      ['', 'My melee', '', own.id, undefined],
    ]);
    expect(out.activeSetupId).toBe(out.setups[0].id);
  });

  it('rotations find their setup by preset id, then by boss, else the general one – and lose the boss prefix', () => {
    const nex = loadout('Nex – solo ranged', 'nex-ranged');
    const own = loadout('Default');
    const rotations = [rotation('Nex – Blood Phase', { presetId: 'nex-ranged' }), rotation('Nex – copied from someone'), rotation('my opener')];
    const out = reconcileSetups({ setups: [], loadouts: [nex, own], rotations, activeSetupId: null }, opts);
    const nexSetup = out.setups.find((s) => s.boss === 'Nex')!;
    const general = out.setups.find((s) => !s.boss)!;
    expect(out.rotations.map((r) => [r.name, r.setupId])).toEqual([
      ['Blood Phase', nexSetup.id],
      ['copied from someone', nexSetup.id],
      ['my opener', general.id],
    ]);
    expect(out.rotations[0].presetId).toBeUndefined();
  });

  it('a rotation with no home gets a general setup made for it, with a fresh loadout', () => {
    const nex = loadout('Nex – solo ranged', 'nex-ranged');
    const out = reconcileSetups({ setups: [], loadouts: [nex], rotations: [rotation('my opener')], activeSetupId: null }, opts);
    expect(out.setups).toHaveLength(2);
    const general = out.setups.find((s) => !s.boss)!;
    expect(general.name).toBe('General');
    expect(out.loadouts.some((l) => l.id === general.loadoutId)).toBe(true);
    expect(out.rotations[0].setupId).toBe(general.id);
  });

  it('nothing to do: a consistent state comes back unchanged', () => {
    const l = loadout('Default');
    const s: Setup = newSetup({ id: 's1', loadoutId: l.id });
    const r = rotation('x', { setupId: 's1' });
    const out = reconcileSetups({ setups: [s], loadouts: [l], rotations: [r], activeSetupId: 's1' }, opts);
    expect(out.changed).toBe(false);
    expect(out.rotations[0]).toBe(r);
  });

  it('an empty browser gets one general setup with a default loadout', () => {
    const out = reconcileSetups({ setups: [], loadouts: [], rotations: [], activeSetupId: null }, opts);
    expect(out.setups).toHaveLength(1);
    expect(out.setups[0].boss).toBe('');
    expect(out.loadouts).toHaveLength(1);
    expect(out.activeSetupId).toBe(out.setups[0].id);
  });

  it('a setup whose loadout was lost gets a new one instead of pointing nowhere', () => {
    const s: Setup = newSetup({ id: 's1', boss: 'Nex', name: 'x', loadoutId: 'gone' });
    const out = reconcileSetups({ setups: [s], loadouts: [], rotations: [], activeSetupId: 's1' }, opts);
    expect(out.loadouts).toHaveLength(1);
    expect(out.setups[0].loadoutId).toBe(out.loadouts[0].id);
  });

  it('setupForRotation: preset id beats the boss prefix, the boss prefix beats the general setup', () => {
    const setups = [newSetup({ id: 'g', loadoutId: 'l0' }), newSetup({ id: 'a', boss: 'Nex', name: 'a', loadoutId: 'l1' }), newSetup({ id: 'b', boss: 'Nex', name: 'b', loadoutId: 'l2', presetId: 'p' })];
    expect(setupForRotation(setups, { name: 'Nex – x', presetId: 'p' })?.id).toBe('b');
    expect(setupForRotation(setups, { name: 'Nex – x' })?.id).toBe('a');
    expect(setupForRotation(setups, { name: 'x' })?.id).toBe('g');
  });
});

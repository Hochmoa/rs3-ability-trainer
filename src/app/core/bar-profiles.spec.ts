import { describe, expect, it } from 'vitest';
import { activateProfile, defaultActionBars, snapshotActiveProfile } from './models';

describe('action bar profiles', () => {
  it('a fresh setup has one "Default" profile mirroring the top level', () => {
    const s = defaultActionBars();
    expect(s.profiles?.map((p) => p.name)).toEqual(['Default']);
    expect(s.activeProfileId).toBe('default');
    expect(s.profiles![0].presets).toEqual(s.presets);
  });

  it('snapshot keeps the active profile current; activate swaps the top level and keeps the old one', () => {
    let s = defaultActionBars();
    s.presets[0].slots[0] = { kind: 'ability', id: 'sever' };
    s.presets[0].name = 'Melee main';
    s = snapshotActiveProfile(s);
    expect(s.profiles![0].presets[0].name).toBe('Melee main');

    const other = { ...s, profiles: [...s.profiles!, { ...defaultActionBars().profiles![0], id: 'necro', name: 'Necro' }] };
    const switched = activateProfile(other, 'necro');
    expect(switched.activeProfileId).toBe('necro');
    expect(switched.presets[0].name).toBe('Bar 1');
    expect(switched.presets[0].slots[0]).toBeNull();
    // the melee bars survive in their profile and come back
    const back = activateProfile(switched, 'default');
    expect(back.presets[0].name).toBe('Melee main');
    expect(back.presets[0].slots[0]).toEqual({ kind: 'ability', id: 'sever' });
    expect(back.profiles!.map((p) => p.id)).toEqual(['default', 'necro']);
  });

  it('a setup stored before profiles existed gets its Default profile on snapshot', () => {
    const s = { ...defaultActionBars(), profiles: undefined, activeProfileId: undefined };
    const out = snapshotActiveProfile(s);
    expect(out.profiles?.length).toBe(1);
    expect(out.activeProfileId).toBe('default');
  });
});

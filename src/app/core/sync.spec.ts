import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { newLoadout } from './models';
import { RotationRow, SetupRow, decideMerge, rotationFromRow, setupFromRow } from './sync.service';

describe('decideMerge – one local row against the server copy on login', () => {
  it('a row the server does not have: uploaded when never synced, deleted when it was (removed on another device)', () => {
    expect(decideMerge({ updatedAt: 1000 }, null)).toBe('upload');
    expect(decideMerge({ updatedAt: 1000, syncedAt: 900 }, null)).toBe('delete');
  });

  it('the server copy wins when the local one is older, equal or only newer within the clock skew', () => {
    expect(decideMerge({ updatedAt: 40_000, syncedAt: 40_000 }, 50_000)).toBe('download');
    expect(decideMerge({ updatedAt: 50_000, syncedAt: 50_000 }, 50_000)).toBe('download');
    expect(decideMerge({ updatedAt: 54_000, syncedAt: 50_000 }, 50_000)).toBe('download');
    expect(decideMerge({ updatedAt: 54_000 }, 50_000)).toBe('download');
  });

  it('a synced row edited after its last sync and clearly after the server copy is uploaded', () => {
    expect(decideMerge({ updatedAt: 60_000, syncedAt: 50_000 }, 50_000)).toBe('upload');
    // edited locally, but the server was edited later elsewhere: the server wins
    expect(decideMerge({ updatedAt: 60_000, syncedAt: 70_000 }, 70_000)).toBe('download');
    // syncedAt after updatedAt cannot happen after a save, but must not upload
    expect(decideMerge({ updatedAt: 60_000, syncedAt: 65_000 }, 50_000)).toBe('download');
  });

  it('a never-synced row (same id on both sides, e.g. a copy of a copy) is uploaded only when clearly newer', () => {
    expect(decideMerge({ updatedAt: 60_000 }, 50_000)).toBe('upload');
    expect(decideMerge({ updatedAt: 45_000 }, 50_000)).toBe('download');
  });
});

describe('rotationFromRow – a server row as a local rotation', () => {
  const row: RotationRow = { id: 'r1', setup_id: 's1', name: 'Blood Phase', steps: [{ kind: 'ability', id: 'sever' }], position: 2, updated_at: '2026-09-07T10:00:00.000Z' };

  it('takes the server fields and marks the rotation as synced at updated_at', () => {
    const ms = Date.parse(row.updated_at);
    expect(rotationFromRow(row, undefined)).toEqual({ id: 'r1', name: 'Blood Phase', steps: row.steps, updatedAt: ms, syncedAt: ms, setupId: 's1', presetIndex: 2 });
  });

  it('a row from before the setups (no setup_id) keeps the local setup, or none – the reconcile finds one', () => {
    expect(rotationFromRow({ ...row, setup_id: null, position: null }, { setupId: 'local' }).setupId).toBe('local');
    const r = rotationFromRow({ ...row, setup_id: null, position: null }, undefined);
    expect(r.setupId).toBe('');
    expect(r.presetIndex).toBeUndefined();
  });
});

describe('setupFromRow – a server row as a local setup', () => {
  const loadout = newLoadout('Nex – solo ranged');
  const row: SetupRow = { id: 's1', boss: 'Nex', name: 'solo ranged', style: 'Ranged', loadout, is_public: true, source_id: null, preset_id: 'nex-ranged', updated_at: '2026-09-07T10:00:00.000Z' };

  it('the loadout inside the row is the setup’s loadout, the origin stays what the browser knew', () => {
    const s = setupFromRow(row, { sourceName: 'Nex – solo ranged', sourceOwner: 'PVME', sourceOwnerKind: 'guide' });
    expect(s.loadoutId).toBe(loadout.id);
    expect(s).toMatchObject({ id: 's1', boss: 'Nex', name: 'solo ranged', style: 'Ranged', isPublic: true, presetId: 'nex-ranged', sourceOwner: 'PVME', sourceOwnerKind: 'guide' });
    expect(s.syncedAt).toBe(Date.parse(row.updated_at));
    expect(setupFromRow(row, undefined).sourceId).toBeUndefined();
  });
});

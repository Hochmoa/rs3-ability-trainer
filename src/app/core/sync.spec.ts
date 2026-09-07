import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { EXPLORE_GUIDES_LIMIT, EXPLORE_LIMIT, RotationRow, decideRotationMerge, exploreRange, rotationFromRow } from './sync.service';

describe('decideRotationMerge – one local rotation against the server copy on login', () => {
  it('a rotation the server does not have: uploaded when never synced, deleted when it was (removed on another device)', () => {
    expect(decideRotationMerge({ updatedAt: 1000 }, null)).toBe('upload');
    expect(decideRotationMerge({ updatedAt: 1000, syncedAt: 900 }, null)).toBe('delete');
  });

  it('the server copy wins when the local one is older, equal or only newer within the clock skew', () => {
    expect(decideRotationMerge({ updatedAt: 40_000, syncedAt: 40_000 }, 50_000)).toBe('download');
    expect(decideRotationMerge({ updatedAt: 50_000, syncedAt: 50_000 }, 50_000)).toBe('download');
    expect(decideRotationMerge({ updatedAt: 54_000, syncedAt: 50_000 }, 50_000)).toBe('download');
    expect(decideRotationMerge({ updatedAt: 54_000 }, 50_000)).toBe('download');
  });

  it('a synced rotation edited after its last sync and clearly after the server copy is uploaded', () => {
    expect(decideRotationMerge({ updatedAt: 60_000, syncedAt: 50_000 }, 50_000)).toBe('upload');
    // edited locally, but the server was edited later elsewhere: the server wins
    expect(decideRotationMerge({ updatedAt: 60_000, syncedAt: 70_000 }, 70_000)).toBe('download');
    // syncedAt after updatedAt cannot happen after a save, but must not upload
    expect(decideRotationMerge({ updatedAt: 60_000, syncedAt: 65_000 }, 50_000)).toBe('download');
  });

  it('a never-synced rotation (same id on both sides, e.g. a copy of a copy) is uploaded only when clearly newer', () => {
    expect(decideRotationMerge({ updatedAt: 60_000 }, 50_000)).toBe('upload');
    expect(decideRotationMerge({ updatedAt: 45_000 }, 50_000)).toBe('download');
  });
});

describe('rotationFromRow – a server row as a local rotation', () => {
  const row: RotationRow = {
    id: 'r1',
    name: 'Vorkath',
    steps: [{ kind: 'ability', id: 'sever' }],
    is_public: true,
    source_id: 'src',
    styles: ['Melee'],
    copies: 3,
    updated_at: '2026-09-07T10:00:00.000Z',
    owner_name: 'Vorkath',
    owner_kind: 'guide',
  };

  it('takes the server fields and marks the rotation as synced at updated_at', () => {
    const r = rotationFromRow(row, undefined);
    const ms = Date.parse(row.updated_at);
    expect(r).toEqual({
      id: 'r1',
      name: 'Vorkath',
      steps: row.steps,
      updatedAt: ms,
      syncedAt: ms,
      isPublic: true,
      sourceId: 'src',
      copies: 3,
      sourceName: undefined,
      sourceOwner: undefined,
      sourceOwnerKind: undefined,
    });
  });

  it('keeps where a copy came from – name, owner and whether the owner is a guide account – from the local side', () => {
    const r = rotationFromRow(row, {
      sourceName: 'Vorkath – full kill',
      sourceOwner: 'Vorkath',
      sourceOwnerKind: 'guide',
    });
    expect(r.sourceName).toBe('Vorkath – full kill');
    expect(r.sourceOwner).toBe('Vorkath');
    expect(r.sourceOwnerKind).toBe('guide');
    expect(rotationFromRow({ ...row, source_id: null }, undefined).sourceId).toBeUndefined();
  });
});

/**
 * The explorer used to ask for a fixed 500 guide rotations ordered by owner and name, so everything from about "S" on
 * (Sanctum, Solak, Telos, Vorago, Zamorak …) was unreachable under the Guides chip. It now fetches one page per
 * request and continues from the rows already shown.
 */
describe('exploreRange – paging through the explorer', () => {
  it('starts at the first row and asks for one page', () => {
    expect(exploreRange({})).toEqual([0, EXPLORE_LIMIT - 1]);
    expect(exploreRange({ guides: true })).toEqual([0, EXPLORE_GUIDES_LIMIT - 1]);
  });

  it('the following pages neither overlap nor skip a row', () => {
    const size = EXPLORE_GUIDES_LIMIT;
    const [, firstTo] = exploreRange({ guides: true });
    const [secondFrom, secondTo] = exploreRange({ guides: true, offset: size });
    expect(secondFrom).toBe(firstTo + 1);
    expect(secondTo - secondFrom + 1).toBe(size);
    // "Load more" passes the number of rows on screen, whatever it is
    expect(exploreRange({ guides: true, offset: 250 })).toEqual([250, 250 + size - 1]);
  });

  it('never asks for a negative row', () => {
    expect(exploreRange({ offset: -5 })).toEqual([0, EXPLORE_LIMIT - 1]);
  });
});

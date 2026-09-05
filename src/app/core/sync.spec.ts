import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { decideRotationMerge } from './sync.service';

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

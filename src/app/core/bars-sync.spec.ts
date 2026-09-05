import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { decideBarsMerge } from './bars-sync.service';

describe('decideBarsMerge', () => {
  it('uploads a locally edited setup when the server has none', () => {
    expect(decideBarsMerge({ updatedAt: 1000 }, null)).toBe('upload');
    expect(decideBarsMerge({}, null)).toBe('nothing');
  });

  it('downloads the server copy when local was never edited or is older', () => {
    expect(decideBarsMerge({}, 50_000)).toBe('download');
    expect(decideBarsMerge({ updatedAt: 40_000 }, 50_000)).toBe('download');
    expect(decideBarsMerge({ updatedAt: 52_000 }, 50_000)).toBe('download'); // within clock skew
  });

  it('uploads a never-synced setup edited clearly after the server copy', () => {
    expect(decideBarsMerge({ updatedAt: 60_000 }, 50_000)).toBe('upload');
  });

  it('uploads a synced setup only if edited after its last sync and after the server copy', () => {
    expect(decideBarsMerge({ updatedAt: 60_000, syncedAt: 50_000 }, 50_000)).toBe('upload');
    expect(decideBarsMerge({ updatedAt: 60_000, syncedAt: 70_000 }, 70_000)).toBe('download'); // server edited later elsewhere
    expect(decideBarsMerge({ updatedAt: 45_000, syncedAt: 40_000 }, 50_000)).toBe('download');
  });
});

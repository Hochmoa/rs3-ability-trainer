/**
 * Aimed abilities (Martin, 26 Oct 2026): Dive, Bladed Dive and the thrown bombs do nothing on the key alone in game,
 * the click on a tile or the target fires them. The train page asks for that click; this decides which keys need it.
 */
import { describe, expect, it } from 'vitest';
import { needsAim } from './aim';

describe('needsAim', () => {
  it('Dive, Bladed Dive and the thrown bombs need the click', () => {
    for (const key of ['ability:dive', 'ability:bladed-dive', 'special:vulnerability-bomb', 'special:sticky-bomb']) expect(needsAim(key), key).toBe(true);
  });

  it('Surge, Escape, ordinary abilities, prayers and potions fire on the key', () => {
    for (const key of ['ability:surge', 'ability:escape', 'ability:death-skulls', 'prayer:soul-split', 'special:adrenaline-potion', 'action:target-cycle', 'weapon:123']) {
      expect(needsAim(key), key).toBe(false);
    }
  });
});

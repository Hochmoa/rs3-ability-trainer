/**
 * Aimed abilities (Martin, 26 Oct 2026): Dive and Bladed Dive do nothing on the key alone in game, the click on a tile
 * fires them. Thrown bombs go at the selected target on the key. The train page asks for the click; this decides which keys need it.
 */
import { describe, expect, it } from 'vitest';
import { needsAim } from './aim';

describe('needsAim', () => {
  it('Dive and Bladed Dive need the click', () => {
    for (const key of ['ability:dive', 'ability:bladed-dive']) expect(needsAim(key), key).toBe(true);
  });

  it('Surge, Escape, ordinary abilities, prayers, potions and thrown bombs (they go at the selected target) fire on the key', () => {
    for (const key of ['ability:surge', 'ability:escape', 'ability:death-skulls', 'prayer:soul-split', 'special:adrenaline-potion', 'special:vulnerability-bomb', 'special:sticky-bomb', 'action:target-cycle', 'weapon:123']) {
      expect(needsAim(key), key).toBe(false);
    }
  });
});

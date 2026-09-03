import { describe, expect, it } from 'vitest';
import { PROTECTION, bookOf, togglePrayer } from './prayer-rules';

const set = (...ids: string[]) => new Set(ids);

describe('prayer rules', () => {
  it('toggles a prayer off when pressed again', () => {
    const r = togglePrayer(set('soul-split'), 'soul-split');
    expect(r.on).toBe(false);
    expect([...r.active]).toEqual([]);
  });

  it('overheads replace each other, Deflect Summoning stacks', () => {
    let r = togglePrayer(set('soul-split', 'deflect-summoning'), 'deflect-magic');
    expect(r.replaced).toEqual(['soul-split']);
    expect([...r.active].sort()).toEqual(['deflect-magic', 'deflect-summoning']);
    r = togglePrayer(set('protect-from-melee', 'protect-from-summoning'), 'smite');
    expect(r.replaced).toEqual(['protect-from-melee']);
  });

  it('Turmoil-tier curses exclude each other and saps/leeches; leeches of different stats stack', () => {
    let r = togglePrayer(set('turmoil', 'soul-split'), 'anguish');
    expect(r.replaced).toEqual(['turmoil']);
    expect(r.active.has('soul-split')).toBe(true);
    r = togglePrayer(set('leech-defence', 'sap-adrenaline'), 'malevolence');
    expect(r.replaced.sort()).toEqual(['leech-defence', 'sap-adrenaline']);
    r = togglePrayer(set('leech-defence'), 'leech-melee-strength');
    expect(r.replaced).toEqual([]);
    r = togglePrayer(set('leech-defence'), 'sap-defence');
    expect(r.replaced).toEqual(['leech-defence']);
    r = togglePrayer(set('turmoil'), 'fortitude');
    expect(r.replaced).toEqual(['turmoil']);
  });

  it('standard combined prayers switch off single stat prayers, Rapid Restore stacks with Rapid Renewal', () => {
    let r = togglePrayer(set('steel-skin', 'ultimate-strength', 'protect-from-magic'), 'piety');
    expect(r.replaced.sort()).toEqual(['steel-skin', 'ultimate-strength']);
    expect(r.active.has('protect-from-magic')).toBe(true);
    r = togglePrayer(set('rapid-restore', 'rapid-heal'), 'rapid-renewal');
    expect(r.replaced).toEqual(['rapid-heal']);
    expect(r.active.has('rapid-restore')).toBe(true);
  });

  it('knows the book of every protection prayer', () => {
    for (const id of Object.values(PROTECTION.Curses)) expect(bookOf(id)).toBe('Curses');
    for (const id of Object.values(PROTECTION.Prayers)) expect(bookOf(id)).toBe('Prayers');
    expect(bookOf('berserker')).toBe('Curses');
    expect(bookOf('protect-item')).toBe('Prayers');
  });
});

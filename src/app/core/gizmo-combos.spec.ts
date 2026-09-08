import { describe, expect, it } from 'vitest';
import PERKS from '../../../public/data/perks.json';
import { GIZMO_COMBOS, comboLabel, comboOf, combosFor, gizmoOf } from './gizmo-combos';
import { Perk } from './models';

const perkById = new Map((PERKS as Perk[]).map((p) => [p.id, p]));

describe('gizmo combos – what PvME players actually put in a gizmo', () => {
  it('every combo names known perks within the ancient rank limits', () => {
    for (const c of GIZMO_COMBOS) {
      expect(c.perks.length, c.id).toBeGreaterThan(0);
      expect(c.perks.length, c.id).toBeLessThanOrEqual(2);
      for (const p of c.perks) {
        const perk = perkById.get(p.perk);
        expect(perk, c.id + ': ' + p.perk).toBeDefined();
        expect(perk!.gizmos.some((g) => g === c.type || g === 'ancient-' + c.type), c.id + ': ' + p.perk + ' on a ' + c.type + ' gizmo').toBe(true);
        expect(p.rank, c.id).toBeLessThanOrEqual(perk!.maxRankAncient);
      }
    }
    expect(new Set(GIZMO_COMBOS.map((c) => c.id)).size).toBe(GIZMO_COMBOS.length);
  });

  it('lists best-in-slot first: P6AS1 / AS4E2 for weapons, B4 Mobile / R5C4 for armour', () => {
    expect(combosFor('weapon').slice(0, 2).map((c) => c.id)).toEqual(['p6as1', 'as4e2']);
    expect(combosFor('armour').map((c) => c.id)).toContain('b4mobile');
    expect(combosFor('armour').findIndex((c) => c.id === 'b3')).toBeGreaterThan(combosFor('armour').findIndex((c) => c.id === 'imp4devo4'));
  });

  it('recognises a stored gizmo as its combo regardless of perk order, and labels it by perk names', () => {
    const g = gizmoOf(GIZMO_COMBOS.find((c) => c.id === 'p6as1')!);
    expect(comboOf({ perks: [...g.perks].reverse() })?.id).toBe('p6as1');
    expect(comboOf({ perks: [{ perk: 'precise', rank: 4 }] })).toBeNull();
    expect(comboLabel(g.perks, perkById)).toBe('Precise 6 + Aftershock 1');
    expect(comboLabel([{ perk: 'biting', rank: 4 }, { perk: 'mobile', rank: 1 }], perkById)).toBe('Biting 4 + Mobile');
  });
});

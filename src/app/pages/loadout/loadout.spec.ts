import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { GearItem, ItemRef, WeaponSpec } from '../../core/models';
import { carriedEofAmulets } from './loadout';

const EOF: GearItem = { id: 'essence-of-finality-amulet-or', name: 'Essence of Finality amulet (or)', slot: 'neck', style: null, tier: 90, type: null, armour: 0, lifePoints: 0, passive: 'essence-of-finality' } as unknown as GearItem;
const CAPE: GearItem = { id: 'max-cape', name: 'Max cape', slot: 'cape', style: null, tier: 80, type: null, armour: 0, lifePoints: 0 } as unknown as GearItem;
const gearById = new Map<string, GearItem>([
  [EOF.id, EOF],
  [CAPE.id, CAPE],
]);
const spec = (id: string, name: string): WeaponSpec => ({ id, name, adrenaline: 100, cooldownTicks: 50, eof: { storable: true, notes: null } }) as unknown as WeaponSpec;
const specById = new Map<string, WeaponSpec>([
  ['massacre', spec('massacre', 'Massacre')],
  ['ice-asylum', spec('ice-asylum', 'Ice Asylum')],
]);

function loadout(neck: ItemRef | null, inventory: (ItemRef | null)[]) {
  return { equipment: neck ? { neck } : {}, inventory };
}

describe('carriedEofAmulets – every Essence of Finality the loadout holds', () => {
  it('lists the amulets in the backpack even when none is worn (the panel used to claim there were none)', () => {
    const l = loadout(null, [
      { kind: 'gear', id: EOF.id, spec: 'massacre' },
      null,
      { kind: 'gear', id: CAPE.id },
      { kind: 'gear', id: EOF.id, spec: 'ice-asylum' },
    ]);
    const found = carriedEofAmulets(l, gearById, specById);
    expect(found.map((a) => [a.where, a.index, a.spec?.name])).toEqual([
      ['backpack', 0, 'Massacre'],
      ['backpack', 3, 'Ice Asylum'],
    ]);
  });

  it('puts the worn one first and keeps the backpack in slot order', () => {
    const l = loadout({ kind: 'gear', id: EOF.id, spec: 'ice-asylum' }, [null, { kind: 'gear', id: EOF.id, spec: 'massacre' }]);
    const found = carriedEofAmulets(l, gearById, specById);
    expect(found.map((a) => a.where)).toEqual(['worn', 'backpack']);
    expect(found[0]).toMatchObject({ index: -1, name: EOF.name });
    expect(found[1].index).toBe(1);
  });

  it('an amulet without a stored special is listed with an empty one, an unknown spec id does not hide it', () => {
    const l = loadout({ kind: 'gear', id: EOF.id }, [{ kind: 'gear', id: EOF.id, spec: 'gone-from-the-game' }]);
    expect(carriedEofAmulets(l, gearById, specById).map((a) => a.spec)).toEqual([null, null]);
  });

  it('ignores everything that is not an Essence of Finality amulet', () => {
    const l = loadout({ kind: 'gear', id: CAPE.id }, [{ kind: 'weapon', id: 'noxious-scythe' }, { kind: 'special', id: 'super-restore' }, null]);
    expect(carriedEofAmulets(l, gearById, specById)).toEqual([]);
  });
});

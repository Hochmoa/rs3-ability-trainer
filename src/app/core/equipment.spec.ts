import { describe, expect, it } from 'vitest';
import { addItem, applyWield, equip, findInInventory, freeSlots, moveItem, unequip, wornIn, GearState, SlotOf } from './equipment';
import { EquipSlot, INVENTORY_SIZE, ItemRef } from './models';

const SLOTS: Record<string, EquipSlot> = {
  'omni-guard': 'mainHand',
  'soulbound-lantern': 'offHand',
  'bow-of-the-last-guardian': 'twoHand',
  'ring-of-vigour': 'ring',
  'vestments-of-havoc-hood': 'head',
};
const slotOf: SlotOf = (r) => SLOTS[r.id] ?? null;
const ref = (id: string, kind: ItemRef['kind'] = 'weapon'): ItemRef => ({ kind, id });

function empty(): GearState {
  return { equipment: {}, inventory: Array(INVENTORY_SIZE).fill(null) };
}

describe('equipment operations', () => {
  it('equips from the catalog into the matching slot', () => {
    const r = equip(empty(), ref('omni-guard'), slotOf);
    expect(r.error).toBeUndefined();
    expect(r.state.equipment.mainHand?.id).toBe('omni-guard');
  });

  it('refuses the wrong slot and unwearable items', () => {
    expect(equip(empty(), ref('omni-guard'), slotOf, null, 'offHand').error).toBeTruthy();
    expect(equip(empty(), ref('adrenaline-potion', 'special'), slotOf).error).toBeTruthy();
  });

  it('a two-handed weapon takes main and off hand off into the backpack', () => {
    let s = equip(empty(), ref('omni-guard'), slotOf).state;
    s = equip(s, ref('soulbound-lantern'), slotOf).state;
    s = addItem(s, ref('bow-of-the-last-guardian'), 5).state;
    const r = equip(s, s.inventory[5]!, slotOf, 5);
    expect(r.error).toBeUndefined();
    expect(r.state.equipment.twoHand?.id).toBe('bow-of-the-last-guardian');
    expect(r.state.equipment.mainHand).toBeNull();
    expect(r.state.equipment.offHand).toBeNull();
    // the freed slot 5 gets the first displaced weapon, the second goes to the first free slot
    expect(r.state.inventory[5]?.id).toBe('omni-guard');
    expect(r.state.inventory[0]?.id).toBe('soulbound-lantern');
  });

  it('a one-handed weapon takes the two-hander off', () => {
    let s = equip(empty(), ref('bow-of-the-last-guardian'), slotOf).state;
    s = equip(s, ref('omni-guard'), slotOf).state;
    expect(s.equipment.twoHand).toBeNull();
    expect(s.equipment.mainHand?.id).toBe('omni-guard');
    expect(findInInventory(s.inventory, ref('bow-of-the-last-guardian'))).toBe(0);
  });

  it('fails when the backpack has no room for the displaced item', () => {
    let s = equip(empty(), ref('omni-guard'), slotOf).state;
    for (let i = 0; i < INVENTORY_SIZE; i++) s = addItem(s, ref('adrenaline-potion', 'special')).state;
    expect(freeSlots(s.inventory)).toBe(0);
    const r = equip(s, ref('bow-of-the-last-guardian'), slotOf);
    expect(r.error).toMatch(/inventory space/);
    expect(r.state).toBe(s);
  });

  it('unequips into a chosen free slot, swaps with a fitting item, refuses a non-fitting one', () => {
    let s = equip(empty(), ref('omni-guard'), slotOf).state;
    s = unequip(s, 'mainHand', slotOf, 3).state;
    expect(s.inventory[3]?.id).toBe('omni-guard');
    expect(s.equipment.mainHand).toBeNull();
    s = equip(s, ref('ring-of-vigour', 'gear'), slotOf).state;
    expect(unequip(s, 'ring', slotOf, 3).error).toBeTruthy();
    s = addItem(s, ref('omni-guard'), 4).state; // second guard for swapping
    const r = unequip(s, 'mainHand', slotOf, 3);
    expect(r.error).toBeUndefined();
  });

  it('moves items between backpack slots', () => {
    let s = addItem(empty(), ref('omni-guard'), 0).state;
    s = addItem(s, ref('soulbound-lantern'), 1).state;
    s = moveItem(s, 0, 1).state;
    expect(s.inventory[0]?.id).toBe('soulbound-lantern');
    expect(s.inventory[1]?.id).toBe('omni-guard');
  });

  it('applyWield mirrors an engine weapon switch: old weapons go to the backpack, new ones come out of it', () => {
    let s = equip(empty(), ref('omni-guard'), slotOf).state;
    s = equip(s, ref('soulbound-lantern'), slotOf).state;
    s = addItem(s, { kind: 'weapon', id: 'bow-of-the-last-guardian', gizmos: [{ ancient: true, perks: [{ perk: 'precise', rank: 6 }] }] }, 7).state;
    s = applyWield(s, { mainHand: null, offHand: null, twoHand: 'bow-of-the-last-guardian' }, slotOf);
    expect(s.equipment.twoHand?.gizmos?.[0].perks[0].perk).toBe('precise'); // the instance with its perks moved
    expect(wornIn(s.equipment, ref('omni-guard'))).toBeNull();
    expect(findInInventory(s.inventory, ref('omni-guard'))).toBeGreaterThanOrEqual(0);
    expect(findInInventory(s.inventory, ref('soulbound-lantern'))).toBeGreaterThanOrEqual(0);
    s = applyWield(s, { mainHand: 'omni-guard', offHand: 'soulbound-lantern', twoHand: null }, slotOf);
    expect(s.equipment.twoHand).toBeNull();
    expect(s.equipment.mainHand?.id).toBe('omni-guard');
    expect(s.equipment.offHand?.id).toBe('soulbound-lantern');
    expect(findInInventory(s.inventory, ref('bow-of-the-last-guardian'))).toBeGreaterThanOrEqual(0);
  });

  it('applyWield conjures a weapon that is not carried', () => {
    const s = applyWield(empty(), { mainHand: 'omni-guard', offHand: null, twoHand: null }, slotOf);
    expect(s.equipment.mainHand?.id).toBe('omni-guard');
  });
});

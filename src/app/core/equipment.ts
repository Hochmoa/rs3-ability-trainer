/**
 * Pure equipment / backpack operations shared by the loadout page (drag & drop) and the train page
 * (click to equip / drink while training). Every function returns a new state; on failure the state is
 * unchanged and `error` says why (like the game's "You don't have enough inventory space").
 */
import { EquipSlot, Equipment, INVENTORY_SIZE, ItemRef, sameRef } from './models';

export interface GearState {
  equipment: Equipment;
  inventory: (ItemRef | null)[];
}

/** Which slot an item goes into (null = cannot be worn, e.g. a potion). */
export type SlotOf = (ref: ItemRef) => EquipSlot | null;

export interface GearResult {
  state: GearState;
  error?: string;
}

/** Slots the item in `slot` blocks / is blocked by. */
export function conflictingSlots(slot: EquipSlot): EquipSlot[] {
  if (slot === 'twoHand') return ['mainHand', 'offHand'];
  if (slot === 'mainHand' || slot === 'offHand') return ['twoHand'];
  return [];
}

export function normaliseInventory(inv: (ItemRef | null)[] | undefined): (ItemRef | null)[] {
  const out = Array.from({ length: INVENTORY_SIZE }, (_, i) => inv?.[i] ?? null);
  return out;
}

export function freeIndex(inv: (ItemRef | null)[], preferred?: number | null): number {
  if (preferred !== undefined && preferred !== null && preferred >= 0 && preferred < inv.length && !inv[preferred]) return preferred;
  return inv.findIndex((x) => !x);
}

export function freeSlots(inv: (ItemRef | null)[]): number {
  return inv.filter((x) => !x).length;
}

/** Index of the first inventory item with this kind + id, -1 if none. */
export function findInInventory(inv: (ItemRef | null)[], ref: Pick<ItemRef, 'kind' | 'id'>): number {
  return inv.findIndex((x) => x && x.kind === ref.kind && x.id === ref.id);
}

/** Slot an item is worn in, null if not worn. */
export function wornIn(eq: Equipment, ref: Pick<ItemRef, 'kind' | 'id'>): EquipSlot | null {
  for (const [slot, r] of Object.entries(eq) as [EquipSlot, ItemRef | null | undefined][]) if (r && r.kind === ref.kind && r.id === ref.id) return slot;
  return null;
}

function clone(s: GearState): GearState {
  return { equipment: { ...s.equipment }, inventory: normaliseInventory(s.inventory) };
}

/**
 * Wears `ref`. `from` = inventory index it comes from (the item is taken out of it; displaced items go back
 * there first), null = it comes from the catalog. `target` must match the item's own slot.
 */
export function equip(state: GearState, ref: ItemRef, slotOf: SlotOf, from: number | null = null, target?: EquipSlot | null): GearResult {
  const own = slotOf(ref);
  if (!own) return { state, error: 'This item cannot be worn.' };
  const slot = target ?? own;
  if (slot !== own) return { state, error: 'This item does not fit that slot.' };
  const s = clone(state);
  if (from !== null && from >= 0) s.inventory[from] = null;
  const displaced: ItemRef[] = [];
  for (const k of [slot, ...conflictingSlots(slot)]) {
    const cur = s.equipment[k];
    if (cur) displaced.push(cur);
    s.equipment[k] = null;
  }
  // displaced items go to the source slot first, then to free slots
  let preferred: number | null = from;
  for (const d of displaced) {
    const i = freeIndex(s.inventory, preferred);
    if (i < 0) return { state, error: 'Not enough inventory space to take off ' + displaced.length + (displaced.length === 1 ? ' item.' : ' items.') };
    s.inventory[i] = d;
    preferred = null;
  }
  s.equipment[slot] = ref;
  return { state: s };
}

/** Takes the item in `slot` off into the inventory (`to` = wanted index; a taken index swaps only when the other item fits the slot). */
export function unequip(state: GearState, slot: EquipSlot, slotOf: SlotOf, to: number | null = null): GearResult {
  const cur = state.equipment[slot];
  if (!cur) return { state };
  const s = clone(state);
  if (to !== null && to >= 0 && s.inventory[to]) {
    const other = s.inventory[to]!;
    if (slotOf(other) !== slot) return { state, error: 'That item does not fit the ' + slot + ' slot.' };
    s.inventory[to] = cur;
    s.equipment[slot] = other;
    return { state: s };
  }
  const i = freeIndex(s.inventory, to);
  if (i < 0) return { state, error: 'Not enough inventory space.' };
  s.inventory[i] = cur;
  s.equipment[slot] = null;
  return { state: s };
}

/** Moves / swaps two inventory slots. */
export function moveItem(state: GearState, from: number, to: number): GearResult {
  if (from === to || from < 0 || to < 0 || from >= INVENTORY_SIZE || to >= INVENTORY_SIZE) return { state };
  const s = clone(state);
  [s.inventory[from], s.inventory[to]] = [s.inventory[to], s.inventory[from]];
  return { state: s };
}

/** Puts a catalog item into the inventory (at `to` if that slot is free, else the first free slot). */
export function addItem(state: GearState, ref: ItemRef, to: number | null = null): GearResult {
  const s = clone(state);
  const i = freeIndex(s.inventory, to);
  if (i < 0) return { state, error: 'Your inventory is full.' };
  s.inventory[i] = ref;
  return { state: s };
}

export function removeItem(state: GearState, index: number): GearResult {
  const s = clone(state);
  s.inventory[index] = null;
  return { state: s };
}

export function removeWorn(state: GearState, slot: EquipSlot): GearResult {
  const s = clone(state);
  s.equipment[slot] = null;
  return { state: s };
}

/** Replaces the item at an inventory index / worn slot with an updated ref (perks, EoF spec). */
export function updateRef(state: GearState, where: { index: number } | { slot: EquipSlot }, ref: ItemRef): GearState {
  const s = clone(state);
  if ('index' in where) s.inventory[where.index] = ref;
  else s.equipment[where.slot] = ref;
  return s;
}

export interface WieldIds {
  mainHand: string | null;
  offHand: string | null;
  twoHand: string | null;
}

/**
 * Makes the worn weapons match `wield` (after an engine weapon switch): weapons leaving the hands go
 * into the backpack, the new ones are taken out of it (or conjured when they are not carried).
 */
export function applyWield(state: GearState, wield: WieldIds, slotOf: SlotOf): GearState {
  let s = clone(state);
  const wanted: [EquipSlot, string | null][] = wield.twoHand
    ? [['twoHand', wield.twoHand], ['mainHand', null], ['offHand', null]]
    : [['twoHand', null], ['mainHand', wield.mainHand], ['offHand', wield.offHand]];
  // take off first, so the freed inventory slots can receive nothing new by accident
  for (const [slot, id] of wanted) {
    const cur = s.equipment[slot];
    if (cur && cur.kind === 'weapon' && cur.id !== id) {
      const r = unequip(s, slot, slotOf);
      s = r.error ? removeWorn(s, slot).state : r.state; // full backpack: the weapon is simply gone for the session
    } else if (cur && cur.kind !== 'weapon') {
      s = removeWorn(s, slot).state;
    }
  }
  for (const [slot, id] of wanted) {
    if (!id || s.equipment[slot]?.id === id) continue;
    const i = findInInventory(s.inventory, { kind: 'weapon', id });
    const ref: ItemRef = i >= 0 ? s.inventory[i]! : { kind: 'weapon', id };
    const r = equip(s, ref, () => slot, i >= 0 ? i : null, slot);
    s = r.error ? updateRef(s, { slot }, ref) : r.state;
  }
  return s;
}

/** true when both states carry the same items in the same places */
export function sameState(a: GearState, b: GearState): boolean {
  const ia = normaliseInventory(a.inventory);
  const ib = normaliseInventory(b.inventory);
  for (let i = 0; i < ia.length; i++) if (!sameRef(ia[i], ib[i]) && (ia[i] || ib[i])) return false;
  const keys = new Set([...Object.keys(a.equipment), ...Object.keys(b.equipment)]) as Set<EquipSlot>;
  for (const k of keys) {
    const x = a.equipment[k];
    const y = b.equipment[k];
    if (!sameRef(x, y) && (x || y)) return false;
  }
  return true;
}

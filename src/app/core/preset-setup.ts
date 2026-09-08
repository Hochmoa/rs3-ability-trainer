import { KeybindLayout, applyLayout } from './keybind-layouts';
import { ActionBarSetup, BAR_POSITIONS, BAR_SLOTS, BarProfileData, EquipSlot, Equipment, INVENTORY_SIZE, ItemRef, Loadout, RotationStep, SPEC_KEY, Style4, defaultActionBars, entityKey, isStyle4, loadoutWeapons, newLoadout, profileData } from './models';

/** One PvME boss setup (public/data/presets.json, built by tools/fetch-presets.py). */
export interface BossPreset {
  id: string;
  boss: string;
  style: string;
  /** what tells the setups of one boss apart: "HM solo", "1000% group", "minion tank" ("" when the guide has one) */
  variant: string;
  /** boss – variant style, hybrids with every style: "Kerapac, the bound – HM solo magic/melee hybrid" */
  title: string;
  guide: string;
  presetUrl: string | null;
  notes: string;
  equipment: Partial<Record<EquipSlot | 'aura', ItemRef>>;
  inventory: (ItemRef | null)[];
  /** items of the PvME preset the trainer does not model (food, brews, familiars ...) */
  unknown: string[];
  /** Archaeology relics of the preset maker (RELICS ids); the rotations' adrenaline assumes them */
  relics?: string[];
  /** familiars.json id of the familiar the preset summons */
  familiar?: string | null;
  /** gear.json id for the ammunition slot (Ful arrows, Deathspore arrows ...) */
  ammo?: string | null;
  /** Invention perks the guide names ("biting4", "relentless5"); the preset maker itself stores no gizmos */
  perks?: { id: string; rank: number }[];
  rotations: { name: string; text: string }[];
  /** index into `rotations` that "Load a demo" opens; missing = the first playable fight rotation (demoRotationIndex) */
  demoRotation?: number;
}

/**
 * The rotation "Load a demo" lands on: the preset's `demoRotation` when set, else the first rotation that is a real
 * fight – no note or phase steps and at least 8 steps –, else the one with the most playable steps (a pre-build with
 * "enter instance" tiles is the wrong first impression).
 */
export function demoRotationIndex(p: Pick<BossPreset, 'demoRotation'>, parsed: { steps: RotationStep[] }[]): number {
  if (p.demoRotation !== undefined && p.demoRotation >= 0 && p.demoRotation < parsed.length) return p.demoRotation;
  const clean = parsed.findIndex((r) => r.steps.length >= 8 && !r.steps.some((s) => s.kind === 'note' || s.phase));
  if (clean >= 0) return clean;
  let best = 0;
  let bestSteps = -1;
  parsed.forEach((r, i) => {
    const n = r.steps.filter((s) => s.kind !== 'note').length;
    if (n > bestSteps) {
      best = i;
      bestSteps = n;
    }
  });
  return best;
}

/** where a perk may sit, from perks.json `gizmos` */
type GizmoKind = 'weapon' | 'armour';
const GIZMO_PERKS = 2; // a gizmo holds up to two perks

/**
 * Puts the guide's Invention perks on the gear: weapon perks into the wielded weapon's gizmos (a two-hander takes
 * two, a pair one each), the rest into the body and legs gizmos. Ancient perks make their gizmo ancient. Perks that
 * find no free gizmo are dropped – the loadout page can still add them by hand.
 */
export function applyPresetPerks(l: Loadout, perks: { id: string; rank: number }[], perkGizmos: (id: string) => string[] | undefined): void {
  const slots: { ref: ItemRef; kind: GizmoKind }[] = [];
  const eq = l.equipment ?? {};
  const add = (ref: ItemRef | null | undefined, kind: GizmoKind, times: number) => {
    for (let i = 0; i < times; i++) if (ref) slots.push({ ref, kind });
  };
  add(eq.twoHand, 'weapon', 2);
  add(eq.mainHand, 'weapon', 1);
  add(eq.offHand?.kind === 'weapon' ? eq.offHand : null, 'weapon', 1);
  add(eq.body, 'armour', 1);
  add(eq.legs, 'armour', 1);
  const gizmos = new Map<ItemRef, { ancient: boolean; perks: { perk: string; rank: number }[] }[]>();
  for (const { ref, kind } of slots) {
    void kind;
    if (!gizmos.has(ref)) gizmos.set(ref, []);
  }
  const free = (kind: GizmoKind) => slots.find((s) => {
    const list = gizmos.get(s.ref)!;
    const own = slots.filter((x) => x.ref === s.ref).length;
    return s.kind === kind && (list.length < own || list.some((g) => g.perks.length < GIZMO_PERKS));
  });
  for (const { id, rank } of perks) {
    const where = perkGizmos(id) ?? [];
    const ancient = where.some((g) => g.startsWith('ancient-')) && !where.some((g) => g === 'weapon' || g === 'armour');
    const kind: GizmoKind | null = where.some((g) => g.endsWith('weapon')) ? 'weapon' : where.some((g) => g.endsWith('armour')) ? 'armour' : null;
    const target = kind ? free(kind) : undefined;
    if (!target) continue;
    const list = gizmos.get(target.ref)!;
    const own = slots.filter((x) => x.ref === target.ref).length;
    let g = list.find((x) => x.perks.length < GIZMO_PERKS && x.ancient === ancient);
    if (!g && list.length < own) {
      g = { ancient, perks: [] };
      list.push(g);
    }
    if (!g) continue;
    g.ancient = g.ancient || ancient;
    g.perks.push({ perk: id, rank });
  }
  for (const [ref, list] of gizmos) {
    const kept = list.filter((g) => g.perks.length);
    if (kept.length) ref.gizmos = kept;
  }
}

/**
 * The worn items of a preset in the trainer's slots: the PvME preset keeps a two-hander in the main-hand slot and
 * knows no ammunition field, so every item is re-slotted with the catalog's `slotOf` (the gear panel draws this).
 */
export function presetEquipment(p: Pick<BossPreset, 'equipment' | 'ammo'>, slotOf: (ref: ItemRef) => EquipSlot | null): Equipment {
  const eq: Equipment = {};
  for (const ref of Object.values(p.equipment)) {
    if (!ref) continue;
    const slot = slotOf(ref);
    if (slot) eq[slot] = { ...ref };
  }
  if (eq.twoHand) {
    delete eq.mainHand;
    delete eq.offHand;
  }
  if (p.ammo && !eq.ammo) eq.ammo = { kind: 'gear', id: p.ammo };
  return eq;
}

/** The backpack of a preset, padded to the 28 slots the panel draws. */
export function presetInventory(p: Pick<BossPreset, 'inventory'>): (ItemRef | null)[] {
  return Array.from({ length: INVENTORY_SIZE }, (_, i) => (p.inventory[i] ? { ...p.inventory[i]! } : null));
}

/** The loadout of a preset: every item re-slotted (a two-hander sits in the main-hand slot of the PvME preset), the backpack as-is. */
export function presetLoadout(p: BossPreset, slotOf: (ref: ItemRef) => EquipSlot | null, perkGizmos: (id: string) => string[] | undefined = () => undefined): Loadout {
  const l: Loadout = newLoadout(p.title.slice(0, 40));
  l.presetId = p.id;
  const eq: Equipment = presetEquipment(p, slotOf);
  l.equipment = eq;
  l.inventory = presetInventory(p);
  l.prayerBook = 'Curses';
  // the preset maker keeps these next to the gear, and the rotations assume them: without Conservation of Energy and
  // Fury of the Small the adrenaline never adds up, and a familiar's scroll cannot be pressed without the familiar
  if (p.relics?.length) l.relics = [...p.relics];
  if (p.familiar) l.familiar = p.familiar;
  if (p.perks?.length) applyPresetPerks(l, p.perks, perkGizmos);
  return l;
}

/**
 * "X eofspec": the specials a rotation fires from an Essence of Finality are spread over the amulets the setup
 * carries – one special per amulet, as PvME plays it. The guide's own amulets already hold some of them (Nex solo
 * ranged wears Split Soul and carries Shadowfall), so those are left alone; empty amulets are filled in order, and
 * the specials with nowhere to go are returned for the caller to add an amulet for.
 * `amulets` is mutated: an empty one gets its `spec`.
 */
export function assignEofSpecs(amulets: ItemRef[], stored: string[]): string[] {
  const already = new Set(amulets.map((r) => r.spec).filter((x): x is string => !!x));
  const empty = amulets.filter((r) => !r.spec);
  const missing: string[] = [];
  for (const id of stored) {
    if (already.has(id)) continue;
    already.add(id);
    const free = empty.shift();
    if (free) free.spec = id;
    else missing.push(id);
  }
  return missing;
}

/** Entity keys of everything the rotations press on a bar, in order of first use (weapon switches and client actions are not bar slots). */
export function presetSlotKeys(rotations: { steps: RotationStep[] }[]): string[] {
  const keys: string[] = [];
  for (const r of rotations) {
    for (const s of r.steps) {
      if (s.kind === 'note' || s.kind === 'weapon' || s.kind === 'action') continue;
      const key = s.kind === 'spec' ? SPEC_KEY : entityKey(s.kind, s.id);
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys;
}

export interface PresetBars {
  setup: BarProfileData;
  barsNeeded: number;
  /** abilities that did not fit on the 5 bars */
  left: number;
  /** keys the layout added on top of the player's own */
  filled: number;
}

/**
 * The bar setup of a preset: empty bars with the abilities of the rotations on bars 1..n bound to the style, the
 * player's current keys kept and every slot still without a key filled from the layout (weapon switches of the
 * loadout included), so the preset can be played right away.
 */
export function presetBars(p: BossPreset, keys: string[], cur: ActionBarSetup, layout: KeybindLayout, loadout: Loadout): PresetBars {
  const fresh = defaultActionBars();
  const base: BarProfileData = { ...profileData(fresh), slotKeybinds: structuredClone(cur.slotKeybinds), weaponKeybinds: structuredClone(cur.weaponKeybinds), actionKeybinds: structuredClone(cur.actionKeybinds), layout: cur.layout };
  const style: Style4 = isStyle4(p.style) ? p.style : 'Melee';
  const barsNeeded = Math.min(BAR_POSITIONS, Math.ceil(keys.length / BAR_SLOTS));
  let placed = 0;
  for (let b = 0; b < barsNeeded; b++) {
    const preset = base.presets[b];
    preset.name = (p.boss.split(',')[0] + ' ' + p.style + ' ' + (b + 1)).slice(0, 30);
    for (let i = 0; i < BAR_SLOTS && placed < keys.length; i++, placed++) {
      const [kind, id] = splitKey(keys[placed]);
      preset.slots[i] = { kind, id } as RotationStep;
    }
    base.positions[b] = preset.id;
    base.bindings[style][b] = preset.id;
  }
  const { data, filled } = applyLayout(base, layout, { overwrite: false, weaponIds: loadoutWeapons(loadout) });
  return { setup: data, barsNeeded, left: keys.length - placed, filled };
}

function splitKey(key: string): [RotationStep['kind'], string] {
  const i = key.indexOf(':');
  return [key.slice(0, i) as RotationStep['kind'], key.slice(i + 1)];
}

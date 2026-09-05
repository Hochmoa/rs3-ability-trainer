import { KeybindLayout, applyLayout } from './keybind-layouts';
import { ActionBarSetup, BAR_POSITIONS, BAR_SLOTS, BarProfileData, EquipSlot, Equipment, INVENTORY_SIZE, ItemRef, Loadout, RotationStep, SPEC_KEY, Style4, defaultActionBars, entityKey, isStyle4, loadoutWeapons, newLoadout, profileData } from './models';

/** One PvME boss setup (public/data/presets.json, built by tools/fetch-presets.py). */
export interface BossPreset {
  id: string;
  boss: string;
  style: string;
  title: string;
  guide: string;
  presetUrl: string | null;
  notes: string;
  equipment: Partial<Record<EquipSlot | 'aura', ItemRef>>;
  inventory: (ItemRef | null)[];
  /** items of the PvME preset the trainer does not model (food, brews, familiars ...) */
  unknown: string[];
  rotations: { name: string; text: string }[];
}

/** The loadout of a preset: every item re-slotted (a two-hander sits in the main-hand slot of the PvME preset), the backpack as-is. */
export function presetLoadout(p: BossPreset, slotOf: (ref: ItemRef) => EquipSlot | null): Loadout {
  const l: Loadout = newLoadout(p.title.slice(0, 40));
  l.presetId = p.id;
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
  l.equipment = eq;
  l.inventory = Array.from({ length: INVENTORY_SIZE }, (_, i) => (p.inventory[i] ? { ...p.inventory[i]! } : null));
  l.prayerBook = 'Curses';
  return l;
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

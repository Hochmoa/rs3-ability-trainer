import { KeybindLayout } from './keybind-layouts';
import { isReservedKeybind, keybindKey, parseKeybind } from './keybind.util';
import { ActionBarSetup, BAR_POSITIONS, BAR_SLOTS, Keybind, RotationStep, SPEC_KEY, Style4, visiblePresets } from './models';

export interface PlaceResult {
  setup: ActionBarSetup;
  /** entity keys that got a slot, a weapon key or an action key */
  placed: string[];
  /** entity keys that found no free slot */
  left: string[];
  /** keys added from the layout */
  filled: number;
}

/**
 * "Auto-place on my bars": puts the entities of a rotation that are on no keybound slot onto the free slots of the
 * bars shown for `style` (main bar first), gives every slot it uses a key from `layout` when the slot has none
 * (keys nobody else uses), binds weapon switches to the layout's weapon keys and client actions to their layout key.
 * A position without a preset gets the first unused empty one. Pure – the setup passed in is not changed.
 */
export function placeOnBars(setup: ActionBarSetup, style: Style4, keys: string[], layout: KeybindLayout): PlaceResult {
  const s: ActionBarSetup = structuredClone(setup);
  s.actionKeybinds ??= {};
  while (s.slotKeybinds.length < BAR_POSITIONS) s.slotKeybinds.push(Array(BAR_SLOTS).fill(null));
  for (const row of s.slotKeybinds) while (row.length < BAR_SLOTS) row.push(null);

  const used = new Set<string>();
  for (const row of s.slotKeybinds) for (const kb of row) if (kb) used.add(keybindKey(kb));
  for (const kb of Object.values(s.weaponKeybinds)) if (kb) used.add(keybindKey(kb));
  for (const kb of Object.values(s.actionKeybinds)) if (kb) used.add(keybindKey(kb));
  let filled = 0;
  const take = (code: string | undefined): Keybind | null => {
    if (!code) return null;
    const kb = parseKeybind(code);
    if (isReservedKeybind(kb) || used.has(keybindKey(kb))) return null;
    used.add(keybindKey(kb));
    filled++;
    return kb;
  };

  // the bars of the style, in position order; an empty position gets an unused empty preset
  const slotsAt: ((RotationStep | null)[] | null)[] = visiblePresets(s, style).map((id, pos) => {
    if (id === null) {
      const inUse = new Set<number>([...s.positions, ...Object.values(s.bindings).flat()].filter((x): x is number => x !== null));
      const free = s.presets.find((p) => !inUse.has(p.id) && !p.slots.some(Boolean));
      if (!free) return null;
      s.positions[pos] = free.id;
      id = free.id;
    }
    return s.presets.find((p) => p.id === id)?.slots ?? null;
  });
  const findSlot = (kind: string, id: string): { pos: number; slot: number } | null => {
    for (let pos = 0; pos < slotsAt.length; pos++) {
      const i = slotsAt[pos]?.findIndex((st) => !!st && st.kind === kind && st.id === id) ?? -1;
      if (i >= 0) return { pos, slot: i };
    }
    return null;
  };
  const freeSlot = (): { pos: number; slot: number } | null => {
    for (let pos = 0; pos < slotsAt.length; pos++) {
      const i = slotsAt[pos]?.findIndex((st) => !st) ?? -1;
      if (i >= 0) return { pos, slot: i };
    }
    return null;
  };
  const keyFor = (at: { pos: number; slot: number }): void => {
    if (!s.slotKeybinds[at.pos][at.slot]) s.slotKeybinds[at.pos][at.slot] = take(layout.bars[at.pos]?.[at.slot]);
  };

  const placed: string[] = [];
  const left: string[] = [];
  for (const key of keys) {
    const i = key.indexOf(':');
    const kind = key.slice(0, i);
    const id = key.slice(i + 1);
    if (kind === 'note') continue;
    if (kind === 'weapon') {
      if (!s.weaponKeybinds[id]) {
        let kb: Keybind | null = null;
        for (const code of layout.weapons) if ((kb = take(code))) break;
        s.weaponKeybinds[id] = kb;
      }
      (s.weaponKeybinds[id] ? placed : left).push(key);
      continue;
    }
    if (kind === 'action') {
      if (!s.actionKeybinds[id]) s.actionKeybinds[id] = take(layout.actions[id]);
      (s.actionKeybinds[id] ? placed : left).push(key);
      continue;
    }
    // every weapon special fires from the one generic "Weapon Special Attack" slot
    const step: RotationStep = kind === 'spec' ? { kind: 'ability', id: SPEC_KEY.slice('ability:'.length) } : ({ kind, id } as RotationStep);
    let at = findSlot(step.kind, step.id);
    if (!at) {
      at = freeSlot();
      if (!at) {
        left.push(key);
        continue;
      }
      slotsAt[at.pos]![at.slot] = step;
    }
    keyFor(at);
    placed.push(key);
  }
  return { setup: s, placed, left, filled };
}

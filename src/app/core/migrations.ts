/**
 * Shape migrations for stored user data. Every returning user's IndexedDB (and every server copy) goes through these
 * on load; they are pure so `migrations.spec.ts` can feed them one fixture per build era.
 */
import { GearState, SlotOf, addItem, equip } from './equipment';
import { ActionBarSetup, DEFAULT_SETTINGS, Equipment, GearItem, INVENTORY_SIZE, ItemRef, Loadout, Rotation, RotationStep, Settings, defaultActionBars, newLoadout, snapshotActiveProfile } from './models';

/** Fills anything a stored setup lacks (older builds, new fields) with defaults. */
export function mergeActionBars(stored: Partial<ActionBarSetup>): ActionBarSetup {
  const d = defaultActionBars();
  const presets = d.presets.map((p) => {
    const s = stored.presets?.find((x) => x.id === p.id);
    return s ? { ...p, ...s, slots: Array.from({ length: p.slots.length }, (_, i) => s.slots?.[i] ?? null) } : p;
  });
  return snapshotActiveProfile({
    presets,
    positions: d.positions.map((p, i) => stored.positions?.[i] ?? p),
    bindings: { ...d.bindings, ...(stored.bindings ?? {}) },
    slotKeybinds: d.slotKeybinds.map((row, p) => row.map((kb, i) => (stored.slotKeybinds?.[p] ? stored.slotKeybinds[p][i] ?? null : kb))),
    weaponKeybinds: { ...(stored.weaponKeybinds ?? {}) },
    actionKeybinds: { ...(d.actionKeybinds ?? {}), ...(stored.actionKeybinds ?? {}) },
    layout: stored.layout,
    profiles: stored.profiles?.map((p) => ({ ...p })),
    activeProfileId: stored.activeProfileId,
    updatedAt: stored.updatedAt,
    syncedAt: stored.syncedAt,
  });
}

/** Older builds stored `queueWindowTicks` (1..3) instead of the in-game on/off setting. */
export function migrateSettings(stored: Partial<Settings> & { queueWindowTicks?: number }): Settings {
  const { queueWindowTicks, ...rest } = stored;
  // builds before the Revolution mode have no combatMode / revolution; a partial revolution object gets the missing toggles
  const s: Settings = { ...DEFAULT_SETTINGS, ...rest, revolution: { ...DEFAULT_SETTINGS.revolution, ...(rest.revolution ?? {}) }, coach: { ...DEFAULT_SETTINGS.coach, ...(rest.coach ?? {}) } };
  if (typeof queueWindowTicks === 'number' && typeof stored.abilityQueueing !== 'boolean') s.abilityQueueing = queueWindowTicks >= 3;
  return s;
}

/** Keeps only the step fields we know (kind, id and the PvME extras), dropping undefined values. */
export function cleanStep(s: RotationStep): RotationStep {
  const out: RotationStep = { kind: s.kind, id: s.id };
  if (s.note !== undefined) out.note = s.note;
  if (s.phase) out.phase = true;
  if (s.sameTick) out.sameTick = true;
  if (s.offsetTicks !== undefined) out.offsetTicks = s.offsetTicks;
  if (s.cancelAfterTicks) out.cancelAfterTicks = s.cancelAfterTicks;
  if (s.afterHits) out.afterHits = s.afterHits;
  if (s.hint && !s.hint.startsWith('/')) out.hint = s.hint; // "/ fingerofdeath": an "either – or" alternative from older imports, not a hint
  return out;
}

/** Older builds stored steps as plain ability ids. */
export function migrateRotation(r: Omit<Rotation, 'steps'> & { steps: (string | RotationStep)[] }): Rotation {
  return { ...r, steps: r.steps.map((s) => (typeof s === 'string' ? { kind: 'ability', id: s } : s)) };
}

/** Fills fields added after a loadout was saved. */
export function normaliseLoadout(l: Partial<Loadout>): Loadout {
  const base = newLoadout(l.name ?? 'Default');
  const out: Loadout = { ...base, ...l, id: l.id ?? base.id };
  out.items = [...(l.items ?? [])];
  out.relics = [...(l.relics ?? [])];
  out.familiar = l.familiar ?? null;
  out.switches = [...(l.switches ?? [])];
  out.prayerBook = l.prayerBook === 'Prayers' ? 'Prayers' : 'Curses';
  out.spellbook = l.spellbook === 'ancient' || l.spellbook === 'lunar' ? l.spellbook : 'standard';
  out.weaponGizmos = (l.weaponGizmos ?? base.weaponGizmos).map((g) => ({ ancient: !!g.ancient, perks: [...(g.perks ?? [])] }));
  out.armourGizmos = (l.armourGizmos ?? base.armourGizmos).map((g) => ({ ancient: !!g.ancient, perks: [...(g.perks ?? [])] }));
  while (out.weaponGizmos.length < 2) out.weaponGizmos.push({ ancient: false, perks: [] });
  while (out.armourGizmos.length < 2) out.armourGizmos.push({ ancient: false, perks: [] });
  if (l.equipment) {
    out.equipment = cleanEquipment(l.equipment);
    out.inventory = Array.from({ length: INVENTORY_SIZE }, (_, i) => cleanRef(l.inventory?.[i]));
  } else {
    // builds before the inventory: weapons in hand + switches (+ their gizmos) become worn / carried items
    const eq: Equipment = {};
    const g = (i: number) => (out.weaponGizmos[i]?.perks.length ? [out.weaponGizmos[i]] : undefined);
    if (l.twoHand) eq.twoHand = { kind: 'weapon', id: l.twoHand, gizmos: out.weaponGizmos.some((x) => x.perks.length) ? out.weaponGizmos.slice(0, 2) : undefined };
    else {
      if (l.mainHand) eq.mainHand = { kind: 'weapon', id: l.mainHand, gizmos: g(0) };
      if (l.offHand) eq.offHand = { kind: 'weapon', id: l.offHand, gizmos: g(1) };
    }
    out.equipment = eq;
    out.inventory = Array.from({ length: INVENTORY_SIZE }, (_, i) => (out.switches[i] ? { kind: 'weapon', id: out.switches[i] } : null));
  }
  // derived weapon fields for older readers (shared setups, sessions)
  const w = (r: ItemRef | null | undefined) => (r?.kind === 'weapon' ? r.id : null);
  out.twoHand = w(out.equipment.twoHand);
  out.mainHand = out.twoHand ? null : w(out.equipment.mainHand);
  out.offHand = out.twoHand ? null : w(out.equipment.offHand);
  out.switches = out.inventory.filter((r): r is ItemRef => r?.kind === 'weapon').map((r) => r.id).filter((id, i, a) => a.indexOf(id) === i);
  return out;
}

export function cleanRef(r: ItemRef | null | undefined): ItemRef | null {
  if (!r || typeof r.id !== 'string' || !['weapon', 'gear', 'special'].includes(r.kind)) return null;
  const out: ItemRef = { kind: r.kind, id: r.id };
  if (r.gizmos?.length) {
    out.gizmos = r.gizmos.map((g) => ({
      ancient: !!g.ancient,
      perks: (g.perks ?? []).filter((p) => p && typeof p.perk === 'string').map((p) => ({ perk: p.perk, rank: Math.max(1, Math.round(Number(p.rank) || 1)) })),
    }));
  }
  if (r.spec) out.spec = r.spec;
  return out;
}

function cleanEquipment(eq: Equipment): Equipment {
  const out: Equipment = {};
  for (const [slot, r] of Object.entries(eq) as [keyof Equipment, ItemRef | null | undefined][]) {
    const c = cleanRef(r);
    if (c) out[slot] = c;
  }
  if (out.twoHand) {
    delete out.mainHand;
    delete out.offHand;
  }
  return out;
}

/**
 * Loadouts saved before the inventory carried their gear as flags: `items` (passives such as the Ring of vigour),
 * `armourSet` + `armourPieces` and the Essence of Finality's `eofSpec`. Those become worn items – once the gear
 * catalog is there (`gear`, `slotOf`). Null = nothing to migrate.
 */
export function migrateLegacyGear(l: Loadout, gear: GearItem[], slotOf: SlotOf): Loadout | null {
  if (!l.items.length && !l.armourSet && !(l.eofSpec && !l.equipment.neck)) return null;
  let s: GearState = { equipment: l.equipment, inventory: l.inventory };
  const wear = (ref: ItemRef) => {
    const r = equip(s, ref, slotOf);
    if (!r.error) s = r.state;
    else s = addItem(s, ref).state;
  };
  for (const id of l.items) {
    const item = gear.find((g) => g.passive === id);
    if (item && !Object.values(s.equipment).some((r) => r?.id === item.id)) wear({ kind: 'gear', id: item.id });
  }
  if (l.armourSet) {
    const order = ['body', 'legs', 'head', 'hands', 'feet', 'cape'];
    const pieces = gear.filter((g) => g.set === l.armourSet).sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot) || b.tier - a.tier);
    let n = 0;
    const usedSlots = new Set<string>();
    for (const p of pieces) {
      if (n >= l.armourPieces) break;
      if (usedSlots.has(p.slot) || s.equipment[p.slot]) continue;
      wear({ kind: 'gear', id: p.id });
      usedSlots.add(p.slot);
      n++;
    }
  }
  if (l.eofSpec && !s.equipment.neck) {
    const eof = gear.find((g) => g.passive === 'essence-of-finality');
    if (eof) wear({ kind: 'gear', id: eof.id, spec: l.eofSpec });
  }
  return { ...l, equipment: s.equipment, inventory: s.inventory, items: [], armourSet: null, armourPieces: 0 };
}

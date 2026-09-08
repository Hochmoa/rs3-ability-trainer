/**
 * Every rotation and every loadout belongs to exactly one setup (boss + gear + rotations, `Setup` in models.ts).
 * Builds before Sept 2026 had loadouts and rotations side by side, tied only by the PvME preset id and the
 * "<boss> – <name>" naming; the server still hands out rotations without a setup after the schema change. This
 * makes the local state whole again, idempotently: `reconcileSetups` is run on every start-up and after every
 * sync and only reports `changed` when it had to touch something.
 */
import { splitName } from '../shared/picker-groups';
import { GENERAL_SETUP_NAME, Loadout, Rotation, Setup, newLoadout, newSetup } from './models';

export interface SetupState {
  setups: Setup[];
  loadouts: Loadout[];
  rotations: Rotation[];
  activeSetupId: string | null;
}

export interface ReconcileOptions {
  /** the loadout the older build had active – its setup becomes the active one when none is set */
  activeLoadoutId?: string | null;
  /** combat style of a loadout for a setup that gets none from its name ('' when the weapons are not known yet) */
  styleOf?: (l: Loadout) => string;
  now?: () => number;
  id?: () => string;
}

/** The setup a rotation without one belongs to: the one of its preset, else the first of its boss, else the general one. */
export function setupForRotation(setups: readonly Setup[], r: Pick<Rotation, 'name' | 'presetId'>): Setup | undefined {
  if (r.presetId) {
    const byPreset = setups.find((s) => s.presetId === r.presetId);
    if (byPreset) return byPreset;
  }
  const { group } = splitName(r.name);
  if (group) {
    const byBoss = setups.find((s) => s.boss === group);
    if (byBoss) return byBoss;
  }
  return setups.find((s) => !s.boss);
}

/** "Nex – solo ranged" → boss "Nex", name "solo ranged"; a rotation named after its boss loses the prefix */
function withoutBoss(name: string, boss: string): string {
  const { group, rest } = splitName(name);
  return boss && group === boss ? rest : name;
}

/**
 * Makes the state consistent:
 * - every loadout has a setup (one is made from the loadout's name: "Nex – solo ranged" → boss Nex), an older
 *   build's `presetId` on the loadout is kept on the setup
 * - every setup's loadout exists (a setup whose loadout is gone gets a fresh one)
 * - every rotation points to an existing setup (`setupForRotation`), the boss prefix of its name is dropped
 * - there is at least one setup, and an active one
 */
export function reconcileSetups(state: SetupState, opts: ReconcileOptions = {}): SetupState & { changed: boolean } {
  const now = opts.now ?? Date.now;
  const id = opts.id ?? (() => crypto.randomUUID());
  let changed = false;
  const setups = state.setups.map((s) => ({ ...s }));
  const loadouts = state.loadouts.map((l) => ({ ...l }));

  // loadouts without a setup – the state of every build before the setups
  for (const l of loadouts) {
    if (setups.some((s) => s.loadoutId === l.id)) continue;
    const { group, rest } = splitName(l.name);
    const style = opts.styleOf?.(l) ?? '';
    setups.push(newSetup({ id: id(), boss: group, name: group ? rest : l.name || GENERAL_SETUP_NAME, style, loadoutId: l.id, presetId: l.presetId, updatedAt: now() }));
    changed = true;
  }
  // setups whose loadout is gone
  for (const s of setups) {
    if (loadouts.some((l) => l.id === s.loadoutId)) continue;
    const l = newLoadout(s.name);
    loadouts.push(l);
    s.loadoutId = l.id;
    changed = true;
  }
  if (!setups.length) {
    const l = newLoadout('Default');
    loadouts.push(l);
    setups.push(newSetup({ id: id(), loadoutId: l.id, updatedAt: now() }));
    changed = true;
  }
  // a general setup exists once any rotation needs one
  const needsGeneral = state.rotations.some((r) => !setups.some((s) => s.id === r.setupId) && !setupForRotation(setups, r));
  if (needsGeneral) {
    const l = newLoadout('Default');
    loadouts.push(l);
    setups.push(newSetup({ id: id(), loadoutId: l.id, updatedAt: now() }));
    changed = true;
  }
  const rotations = state.rotations.map((r) => {
    if (setups.some((s) => s.id === r.setupId)) return r;
    const target = setupForRotation(setups, r)!;
    changed = true;
    const { presetId, ...rest } = r;
    void presetId;
    return { ...rest, setupId: target.id, name: withoutBoss(r.name, target.boss) };
  });

  let activeSetupId = state.activeSetupId;
  if (!activeSetupId || !setups.some((s) => s.id === activeSetupId)) {
    activeSetupId = setups.find((s) => s.loadoutId === opts.activeLoadoutId)?.id ?? setups[0].id;
    changed = true;
  }
  return { setups, loadouts, rotations, activeSetupId, changed };
}

export type Style = 'Melee' | 'Ranged' | 'Magic' | 'Necromancy' | 'Defence' | 'Constitution';
/** "Enhanced" replaced most Melee/Ranged/Magic thresholds in the Combat Style Modernisation (2 March 2026) */
export type AbilityType = 'Basic' | 'Enhanced' | 'Threshold' | 'Ultimate' | 'Special';

export const STYLES: Style[] = ['Melee', 'Ranged', 'Magic', 'Necromancy', 'Defence', 'Constitution'];

export interface Ability {
  id: string;
  structId: number | null;
  name: string;
  style: Style;
  type: AbilityType;
  level: number;
  target: string;
  equipment: string;
  members: boolean;
  basicAttack: boolean;
  /** +gain / -cost in percent, null if unknown */
  adrenaline: number | null;
  cooldownTicks: number | null;
  damageAvg: number | null;
  damageText: string;
  damageMin: number | null;
  damageMax: number | null;
  hits: number | null;
  channelled: boolean;
  /** effect duration from the ability text ("19.8s (33 ticks) duration") */
  durationTicks: number | null;
  description: string;
  /** buff ids (see Buff) applied by this ability */
  buffs: number[];
  icon: string;
  /** false for abilities usable during / not starting the global cooldown (Surge, Escape, ...) */
  triggersGcd: boolean;
}

export interface Buff {
  id: number;
  name: string;
  kind: 'Buff' | 'Debuff';
  category: string | null;
  desc: string;
  iconSelf: string | null;
  iconTarget: string | null;
  duration?: string;
  durationTicks?: number | null;
  trigger?: string;
  effects?: string;
}

export interface Prayer {
  id: string;
  name: string;
  book: 'Prayers' | 'Curses';
  level: number;
  drainPerHour: number | null;
  effect: string;
  description: string;
  adrenaline: number | null;
  icon: string;
}

export interface Special {
  id: string;
  name: string;
  kind: 'potion';
  adrenaline: number;
  adrenalineOverTime: number;
  overTimeTicks: number;
  cooldownTicks: number;
  sharedCooldown: string;
  level: number;
  description: string;
  icon: string;
}

export type EntityKind = 'ability' | 'prayer' | 'special';

/** Stable key used for keybinds and rotation steps: "ability:sever", "prayer:turmoil", "special:adrenaline-potion" */
export function entityKey(kind: EntityKind, id: string): string {
  return kind + ':' + id;
}

export function parseEntityKey(key: string): { kind: EntityKind; id: string } {
  const i = key.indexOf(':');
  if (i < 0) return { kind: 'ability', id: key }; // legacy keys were plain ability ids
  return { kind: key.slice(0, i) as EntityKind, id: key.slice(i + 1) };
}

export interface Keybind {
  /** KeyboardEvent.code, e.g. "KeyQ", "Digit1", "Numpad5" */
  code: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

export interface RotationStep {
  kind: EntityKind;
  id: string;
}

export interface Rotation {
  id: string;
  name: string;
  steps: RotationStep[];
  updatedAt: number;
  /** visible in the online explorer (missing = true) */
  isPublic?: boolean;
  /** origin when copied from the explorer */
  sourceId?: string;
  sourceName?: string;
  sourceOwner?: string;
  /** server updated_at (ms) of the last successful sync; missing = never synced */
  syncedAt?: number;
  /** explorer copy counter, read-only mirror */
  copies?: number;
}

export interface Settings {
  pingMs: number;
  jitterMs: number;
  /** in-game "Ability queueing": on = a press during the GCD is queued and casts when the GCD ends; off = ignored */
  abilityQueueing: boolean;
  loop: boolean;
}

export const DEFAULT_SETTINGS: Settings = { pingMs: 60, jitterMs: 20, abilityQueueing: false, loop: false };

// ---------------------------------------------------------------- equipment data (public/data/*.json)

export interface Weapon {
  id: string;
  name: string;
  style: Style;
  slot: 'main' | 'off' | '2h' | 'shield';
  type: string | null;
  tier: number;
  tierDamage: number;
  tierAccuracy: number;
  speed: number | null;
  attackStyle: string | null;
  range: number | null;
  damage: number;
  accuracy: number;
  abilityDamage: number | null;
  armour: number;
  lifePoints: number;
  charges: string | null;
  /** weapon special attack id (specs.json) */
  spec: string | null;
  innateMastery: boolean;
  icon: string | null;
  role: 'siphon' | 'conduit' | 'shield' | 'defender' | null;
}

export interface WeaponSpec {
  id: string;
  name: string;
  page: string;
  style: Style;
  target: string;
  weapons: string[];
  weaponIds: string[];
  /** adrenaline requirement = cost */
  adrenaline: number | null;
  cooldownTicks: number;
  ignoresGcd: boolean;
  channelled: boolean;
  damageText: string;
  damageMin: number | null;
  damageMax: number | null;
  durationTicks: number | null;
  description: string;
  buffs: { id: number; pagename: string }[];
  weaponIcons: string[];
  eof: { storable: boolean | 'unknown'; notes: string | null };
  members: boolean;
}

export interface Perk {
  id: string;
  name: string;
  gizmos: string[];
  maxRank: number;
  maxRankAncient: number;
  level: number | null;
  description: string;
  class: 'adrenaline' | 'cooldown' | 'damage' | 'defensive' | 'none';
  params: Record<string, unknown>;
  twoSlot: boolean;
  icon: string | null;
}

export interface SetEffectThreshold {
  pieces: number;
  class: string;
  text: string;
  effect: Record<string, unknown> & { kind: string };
}

export interface SetEffect {
  id: string;
  kind: 'set' | 'item';
  name: string;
  style: Style | null;
  source: string;
  /** sets */
  maxPieces?: number;
  thresholds?: SetEffectThreshold[];
  /** single items */
  slot?: string;
  class?: string;
  text?: string;
  effect?: Record<string, unknown> & { kind: string };
}

// ---------------------------------------------------------------- loadout

export interface GizmoPerk {
  perk: string;
  rank: number;
}

export interface Gizmo {
  ancient: boolean;
  perks: GizmoPerk[];
}

/** Everything outside the rotation: weapons, special attacks, armour set, item passives, perks, relics. */
export interface Loadout {
  id: string;
  name: string;
  /** start of a training session, 0..100 */
  startAdrenaline: number;
  /** weapon ids (weapons.json); twoHand excludes mainHand/offHand */
  mainHand: string | null;
  offHand: string | null;
  twoHand: string | null;
  /** special attack stored in the Essence of Finality amulet (specs.json id) */
  eofSpec: string | null;
  /** armour set (set-effects.json, kind "set") and how many pieces are worn */
  armourSet: string | null;
  armourPieces: number;
  /** single-item passives (set-effects.json, kind "item") */
  items: string[];
  /** two weapon gizmos (2h) or one per weapon (dual wield / 1h) */
  weaponGizmos: Gizmo[];
  /** body + legs (+ shield) */
  armourGizmos: Gizmo[];
  /** Archaeology relics: fury-of-the-small, conservation-of-energy, heightened-senses, persistent-rage */
  relics: string[];
  /** Necromancy talent Spirit Pact tier 0..3 */
  spiritPact: 0 | 1 | 2 | 3;
}

export const RELICS: { id: string; name: string; text: string }[] = [
  { id: 'fury-of-the-small', name: 'Fury of the Small', text: 'Basic abilities generate +1% adrenaline.' },
  { id: 'conservation-of-energy', name: 'Conservation of Energy', text: 'Regain 10% adrenaline after an ultimate (stacks with Ring of vigour).' },
  { id: 'heightened-senses', name: 'Heightened Senses', text: 'Maximum adrenaline +10%.' },
  { id: 'persistent-rage', name: 'Persistent Rage', text: 'Out of combat adrenaline builds up instead of draining (no effect in the trainer).' },
];

export function newLoadout(name = 'Default'): Loadout {
  return {
    id: crypto.randomUUID(),
    name,
    startAdrenaline: 0,
    mainHand: null,
    offHand: null,
    twoHand: null,
    eofSpec: null,
    armourSet: null,
    armourPieces: 0,
    items: [],
    weaponGizmos: [{ ancient: false, perks: [] }, { ancient: false, perks: [] }],
    armourGizmos: [{ ancient: false, perks: [] }, { ancient: false, perks: [] }],
    relics: [],
    spiritPact: 0,
  };
}

/** Loadout shape of builds before September 2026 (flags only). */
export interface LegacyLoadout {
  startAdrenaline: number;
  ringOfVigour: boolean;
  impatientRank: number;
  furyOfTheSmall: boolean;
  conservationOfEnergy: boolean;
  heightenedSenses: boolean;
  vestmentsOfHavoc: boolean;
}

export function migrateLegacyLoadout(old: Partial<LegacyLoadout>): Loadout {
  const l = newLoadout('Default');
  l.startAdrenaline = old.startAdrenaline ?? 0;
  if (old.ringOfVigour) l.items.push('ring-of-vigour');
  if (old.furyOfTheSmall) l.relics.push('fury-of-the-small');
  if (old.conservationOfEnergy) l.relics.push('conservation-of-energy');
  if (old.heightenedSenses) l.relics.push('heightened-senses');
  if (old.vestmentsOfHavoc) {
    l.armourSet = 'vestments-of-havoc';
    l.armourPieces = 4;
  }
  if (old.impatientRank) l.armourGizmos[0].perks.push({ perk: 'impatient', rank: old.impatientRank });
  return l;
}

export type StepOutcome = 'perfect' | 'late' | 'done' | 'missed';

export interface StepResult {
  step: number;
  key: string;
  name: string;
  kind: EntityKind;
  outcome: StepOutcome;
  lateTicks: number;
  /** perfect: ms the input arrived before the cast; late: ms after the earliest possible cast */
  offsetMs: number;
  tooEarly: number;
  wrong: number;
  firedAtTick: number;
  /** adrenaline after this step */
  adrenaline: number;
}

export interface Session {
  id?: number;
  rotationId: string;
  rotationName: string;
  startedAt: number;
  endedAt: number;
  settings: Settings;
  loadout?: Loadout;
  results: StepResult[];
}

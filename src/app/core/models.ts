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

/** Everything outside the rotation that changes adrenaline (numbers from runescape.wiki, Sept 2026). */
export interface Loadout {
  /** start of a training session, 0..100 */
  startAdrenaline: number;
  /** Ring of vigour (or its unlocked passive): +10% adrenaline back after an ultimate */
  ringOfVigour: boolean;
  /** Invention perk: rank × 9% chance that a basic ability gives +3% extra */
  impatientRank: 0 | 1 | 2 | 3 | 4;
  /** Archaeology relic: basic abilities generate +1% */
  furyOfTheSmall: boolean;
  /** Archaeology relic: +10% adrenaline back after an ultimate */
  conservationOfEnergy: boolean;
  /** Archaeology relic: maximum adrenaline +10% */
  heightenedSenses: boolean;
  /** Vestments of havoc 4-piece: maximum adrenaline +20% (melee weapon) */
  vestmentsOfHavoc: boolean;
}

export const DEFAULT_LOADOUT: Loadout = {
  startAdrenaline: 0,
  ringOfVigour: false,
  impatientRank: 0,
  furyOfTheSmall: false,
  conservationOfEnergy: false,
  heightenedSenses: false,
  vestmentsOfHavoc: false,
};

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

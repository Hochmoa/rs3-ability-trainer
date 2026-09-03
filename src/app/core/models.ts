export type Style = 'Melee' | 'Ranged' | 'Magic' | 'Necromancy' | 'Defence' | 'Constitution';
/** "Enhanced" replaced most Melee/Ranged/Magic thresholds in the Combat Style Modernisation (2 March 2026) */
export type AbilityType = 'Basic' | 'Enhanced' | 'Threshold' | 'Ultimate' | 'Special' | 'Incantation';

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
  kind: 'potion' | 'bomb';
  /** bombs: debuff put on the target */
  debuff?: { name: string; durationTicks: number; icon: string | null };
  adrenaline: number;
  adrenalineOverTime: number;
  overTimeTicks: number;
  cooldownTicks: number;
  sharedCooldown: string;
  level: number;
  description: string;
  icon: string;
}

export type EntityKind = 'ability' | 'prayer' | 'special' | 'weapon' | 'spec' | 'action';

/** Weapon special attack (runescape.wiki `infobox_weapon_special_attack`), e.g. Death Essence of the Omni guard. */
export interface Spec {
  id: string;
  name: string;
  /** combat style of the weapons it belongs to ("Necromancy", ...) */
  style: string;
  /** gear ids of the weapons that have this special */
  weapons: string[];
  adrenaline: number | null;
  cooldownTicks: number | null;
  damageMin: number | null;
  damageMax: number | null;
  damageText: string;
  target: string;
  description: string;
  icon: string;
}

/** Client actions that are keybinds but not abilities (target cycle). Defined in code, see ACTIONS. */
export interface Action {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACTIONS: Action[] = [
  { id: 'target-cycle', name: 'Target cycle', description: 'Switches to the next target (client keybind). Instant, no cooldown, no tick.', icon: 'assets/actions/target-cycle.png' },
];
/** pressing the "Weapon Special Attack" slot counts for whichever spec the rotation expects with the wielded weapon */
export const SPEC_KEY = 'ability:weapon-special-attack';

/** the four weapon styles that can be wielded / bound to action bars (Defence is not a weapon style) */
export type Style4 = 'Melee' | 'Ranged' | 'Magic' | 'Necromancy';
export const STYLES4: Style4[] = ['Melee', 'Ranged', 'Magic', 'Necromancy'];
/** shield = one-handed weapon + shield */
export type WeaponType = 'two-handed' | 'dual-wield' | 'shield';
export const WEAPON_TYPES: WeaponType[] = ['two-handed', 'dual-wield', 'shield'];

/** weapon-switch entity, id = style in lower case ("melee", "ranged", ...) */
export interface Weapon {
  id: string;
  name: string;
  style: Style4;
  description: string;
  icon: string;
}

export function isStyle4(s: string): s is Style4 {
  return (STYLES4 as string[]).includes(s);
}

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
  /** "note" = free text from an imported PvME rotation, not an input (id is empty) */
  kind: EntityKind | 'note';
  id: string;
  note?: string;
  /** notes: section heading ("Phase 2") */
  phase?: boolean;
  /** PvME "+": belongs to the same tick as the previous input */
  sameTick?: boolean;
  /** PvME "2t x": x is expected this many ticks after the previous input */
  offsetTicks?: number;
  /** annotation such as "(DW)" or trailing prose */
  hint?: string;
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

/** One saved action bar (in-game "Action bar preset 1..18"), 14 slots. */
export interface ActionBarPreset {
  id: number;
  name: string;
  slots: (RotationStep | null)[];
}

export const BAR_SLOTS = 14;
export const BAR_PRESETS = 18;
/** main bar + additional bars 1-4 */
export const BAR_POSITIONS = 5;
export const BAR_POSITION_NAMES = ['Main bar', 'Additional bar 1', 'Additional bar 2', 'Additional bar 3', 'Additional bar 4'];

export interface ActionBarSetup {
  presets: ActionBarPreset[];
  /** preset id shown at each position when no style binding applies (null = empty position) */
  positions: (number | null)[];
  /** per weapon style, per position: preset id, or null = position keeps its default preset */
  bindings: Record<Style4, (number | null)[]>;
  /** keybinds belong to position + slot, like in the game */
  slotKeybinds: (Keybind | null)[][];
  weaponKeybinds: Record<Style4, Keybind | null>;
  weapons: Record<Style4, WeaponType>;
  startWeapon: Style4;
  /** client keybinds that are not bar slots: "target-cycle", ... */
  actionKeybinds?: Record<string, Keybind | null>;
}

const MAIN_BAR_DEFAULT_CODES = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'];

export function defaultActionBars(): ActionBarSetup {
  const presets: ActionBarPreset[] = [];
  for (let i = 1; i <= BAR_PRESETS; i++) presets.push({ id: i, name: 'Bar ' + i, slots: Array(BAR_SLOTS).fill(null) });
  const slotKeybinds: (Keybind | null)[][] = [];
  for (let p = 0; p < BAR_POSITIONS; p++) {
    slotKeybinds.push(
      Array.from({ length: BAR_SLOTS }, (_, i) => (p === 0 && MAIN_BAR_DEFAULT_CODES[i] ? { code: MAIN_BAR_DEFAULT_CODES[i], ctrl: false, shift: false, alt: false } : null)),
    );
  }
  const none = () => Array(BAR_POSITIONS).fill(null) as (number | null)[];
  return {
    presets,
    positions: [1, 2, 3, 4, 5],
    bindings: { Melee: none(), Ranged: none(), Magic: none(), Necromancy: none() },
    slotKeybinds,
    weaponKeybinds: { Melee: null, Ranged: null, Magic: null, Necromancy: null },
    weapons: { Melee: 'two-handed', Ranged: 'two-handed', Magic: 'two-handed', Necromancy: 'two-handed' },
    startWeapon: 'Melee',
    actionKeybinds: { 'target-cycle': null },
  };
}

/** Preset ids visible at the 5 positions while wielding `style`. */
export function visiblePresets(setup: ActionBarSetup, style: Style4): (number | null)[] {
  return setup.positions.map((p, i) => setup.bindings[style]?.[i] ?? p);
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

export type StepOutcome = 'perfect' | 'late' | 'early' | 'done' | 'missed';

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

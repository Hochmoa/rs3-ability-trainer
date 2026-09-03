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
  /** start every session with full adrenaline (training-dummy style) */
  fullAdrenaline: boolean;
  /** +10% adrenaline every tick, so thresholds/ultimates can be practised without building up */
  rechargeAdrenaline: boolean;
  /** loadout pickers: hide weapons / sets / perks that are never used in current PvM (core/obscure.ts) */
  hideObscureEquipment: boolean;
  /** catalogs: hide abilities and prayers that are never used in current PvM (core/obscure.ts) */
  hideObscureAbilities: boolean;
}

/** Everything the Setups page shares and "Load this setup" replaces: all local data except the rotations. */
export interface SetupBundle {
  settings: Settings;
  loadouts: Loadout[];
  activeLoadoutId: string;
  enemy: EnemyConfig | null;
  keybinds: Record<string, Keybind>;
  actionBars: ActionBarSetup | null;
}

/** sync bookkeeping for settings + loadouts + enemy (one document on the server) */
export interface SetupMeta {
  /** last local edit (ms); missing = never edited */
  updatedAt?: number;
  /** server updated_at (ms) of the last successful sync; missing = never synced */
  syncedAt?: number;
}

export const DEFAULT_SETTINGS: Settings = {
  pingMs: 60,
  jitterMs: 20,
  abilityQueueing: false,
  loop: false,
  fullAdrenaline: false,
  rechargeAdrenaline: false,
  hideObscureEquipment: true,
  hideObscureAbilities: true,
};

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

// ---------------------------------------------------------------- gear (public/data/gear.json) + equipment

/** The worn slots of the in-game equipment screen. */
export type GearSlot = 'head' | 'cape' | 'neck' | 'ammo' | 'mainHand' | 'body' | 'offHand' | 'legs' | 'hands' | 'feet' | 'ring' | 'pocket' | 'aura' | 'sigil';
/** Keys of the equipment record: the worn slots plus "twoHand" – a two-handed weapon shows in the main-hand slot and blocks the off-hand. */
export type EquipSlot = GearSlot | 'twoHand';
export const GEAR_SLOTS: GearSlot[] = ['head', 'cape', 'neck', 'ammo', 'mainHand', 'body', 'offHand', 'legs', 'hands', 'feet', 'ring', 'pocket', 'aura', 'sigil'];
export const SLOT_NAMES: Record<EquipSlot, string> = {
  head: 'Head',
  cape: 'Cape',
  neck: 'Neck',
  ammo: 'Ammunition',
  mainHand: 'Main hand',
  twoHand: 'Two-handed',
  body: 'Body',
  offHand: 'Off-hand',
  legs: 'Legs',
  hands: 'Hands',
  feet: 'Feet',
  ring: 'Ring',
  pocket: 'Pocket',
  aura: 'Aura',
  sigil: 'Sigil',
};
/** backpack size, like in the game */
export const INVENTORY_SIZE = 28;

/** A wearable non-weapon item (gear.json): armour, capes, jewellery, ammo, pocket, aura, sigil. */
export interface GearItem {
  id: string;
  name: string;
  slot: Exclude<GearSlot, 'mainHand' | 'offHand'>;
  style: Style | 'Hybrid' | null;
  tier: number;
  type: string | null;
  armour: number;
  lifePoints: number;
  prayer: number;
  /** armour set it belongs to (set-effects.json, kind "set") */
  set: string | null;
  /** item passive (set-effects.json, kind "item") */
  passive: string | null;
  /** an "Augmented …" version exists: can hold Invention gizmos */
  augmentable: boolean;
  icon: string | null;
}

/** Weapons that count as pieces of an armour set (set-effects.json). */
export const WEAPON_SETS: Record<string, string> = {
  'roar-of-awakening': 'song-of-destruction',
  'ode-to-deceit': 'song-of-destruction',
};

/** One item instance in a slot or the inventory. */
export interface ItemRef {
  /** weapon = weapons.json (incl. shields and defenders), gear = gear.json, special = specials.json (potions, bombs) */
  kind: 'weapon' | 'gear' | 'special';
  id: string;
  /** Invention gizmos sitting on this item (2 for a two-handed weapon, otherwise 1) */
  gizmos?: Gizmo[];
  /** Essence of Finality amulet: the stored special attack (specs.json id) */
  spec?: string | null;
}

export type Equipment = Partial<Record<EquipSlot, ItemRef | null>>;

export function sameRef(a: ItemRef | null | undefined, b: ItemRef | null | undefined): boolean {
  return !!a && !!b && a.kind === b.kind && a.id === b.id;
}

/** Everything outside the rotation: worn equipment, backpack, prayer book, relics. */
export interface Loadout {
  id: string;
  name: string;
  /** start of a training session, 0..100 */
  startAdrenaline: number;
  /** worn items per slot */
  equipment: Equipment;
  /** backpack, INVENTORY_SIZE slots; weapons in it are switches, potions in it can be drunk while training */
  inventory: (ItemRef | null)[];
  /**
   * Weapons in hand at the start – derived from `equipment` on every save (kept for older readers such as
   * shared setups); twoHand excludes mainHand/offHand.
   */
  mainHand: string | null;
  offHand: string | null;
  twoHand: string | null;
  /** weapons carried in the inventory (derived from `inventory`); rotation steps "weapon:<id>" wield them */
  switches: string[];
  /** active prayer book – standard prayers or Ancient Curses; never mixed inside a session */
  prayerBook: 'Prayers' | 'Curses';
  /** special attack stored in the Essence of Finality amulet (specs.json id) */
  eofSpec: string | null;
  /** legacy (builds before the inventory): armour set and pieces worn – the loadout page moves them into `equipment` once */
  armourSet: string | null;
  armourPieces: number;
  /** legacy: single-item passives (set-effects.json, kind "item") – moved into `equipment` by the loadout page */
  items: string[];
  /** legacy: two weapon gizmos (2h) or one per weapon – now stored on the ItemRef */
  weaponGizmos: Gizmo[];
  /** legacy: body + legs gizmos – now stored on the ItemRef */
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
    equipment: {},
    inventory: Array(INVENTORY_SIZE).fill(null),
    mainHand: null,
    offHand: null,
    twoHand: null,
    switches: [],
    prayerBook: 'Curses',
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
  /** active prayer book – standard prayers or Ancient Curses; never mixed inside a session */
  prayerBook?: 'Prayers' | 'Curses';
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

/** wide = one row of 14 slots, compact = half width with two rows of 7 */
export type BarShape = 'wide' | 'compact';

export interface BarLayout {
  /** positions (0..4) in display order */
  order: number[];
  /** shape per position (index = position) */
  shape: BarShape[];
}

/** Normalised layout: every position exactly once, a shape for each. */
export function barLayout(setup: Pick<ActionBarSetup, 'layout'>): BarLayout {
  const all = Array.from({ length: BAR_POSITIONS }, (_, i) => i);
  const order = (setup.layout?.order ?? []).filter((p, i, a) => all.includes(p) && a.indexOf(p) === i);
  for (const p of all) if (!order.includes(p)) order.push(p);
  const shape = all.map((p) => setup.layout?.shape?.[p] ?? 'wide');
  return { order, shape };
}

export interface ActionBarSetup {
  presets: ActionBarPreset[];
  /** preset id shown at each position when no style binding applies (null = empty position) */
  positions: (number | null)[];
  /** per weapon style, per position: preset id, or null = position keeps its default preset */
  bindings: Record<Style4, (number | null)[]>;
  /** keybinds belong to position + slot, like in the game */
  slotKeybinds: (Keybind | null)[][];
  /** one key per carried weapon (weapon item id → key); legacy builds used the style names as keys */
  weaponKeybinds: Record<string, Keybind | null>;
  /** legacy (builds before the loadout held the weapons) – ignored */
  weapons?: Record<Style4, WeaponType>;
  startWeapon?: Style4;
  /** last local edit (ms); missing = never edited */
  updatedAt?: number;
  /** server updated_at (ms) of the last successful sync; missing = never synced */
  syncedAt?: number;
  /** client keybinds that are not bar slots: "target-cycle", ... */
  actionKeybinds?: Record<string, Keybind | null>;
  /** on-screen arrangement of the 5 positions (missing = all wide, in order) */
  layout?: BarLayout;
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
    weaponKeybinds: {},
    actionKeybinds: { 'target-cycle': null },
  };
}

/** Preset ids visible at the 5 positions while wielding `style`. */
export function visiblePresets(setup: ActionBarSetup, style: Style4): (number | null)[] {
  return setup.positions.map((p, i) => setup.bindings[style]?.[i] ?? p);
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
  l.prayerBook = old.prayerBook ?? 'Curses';
  return l;
}

/** Weapon ids a loadout carries: the starting set plus the switches. */
export function loadoutWeapons(l: Loadout): string[] {
  const out: string[] = [];
  if (l.equipment) {
    const eq = l.equipment;
    for (const r of [eq.twoHand, eq.mainHand, eq.offHand, ...(l.inventory ?? [])]) if (r?.kind === 'weapon' && !out.includes(r.id)) out.push(r.id);
    return out;
  }
  for (const id of [l.twoHand, l.mainHand, l.offHand, ...(l.switches ?? [])]) if (id && !out.includes(id)) out.push(id);
  return out;
}

/** Worn weapons of a loadout as ids (twoHand excludes mainHand/offHand). */
export function loadoutWield(l: Loadout): { mainHand: string | null; offHand: string | null; twoHand: string | null } {
  if (!l.equipment) return { mainHand: l.mainHand, offHand: l.offHand, twoHand: l.twoHand };
  const w = (r: ItemRef | null | undefined) => (r?.kind === 'weapon' ? r.id : null);
  const twoHand = w(l.equipment.twoHand);
  return { twoHand, mainHand: twoHand ? null : w(l.equipment.mainHand), offHand: twoHand ? null : w(l.equipment.offHand) };
}

/** Equipment slot a weapons.json item goes into. */
export function weaponSlot(w: Pick<Weapon, 'slot'>): EquipSlot {
  return w.slot === '2h' ? 'twoHand' : w.slot === 'main' ? 'mainHand' : 'offHand';
}

/** Simulated enemy for prayer training: attacks in a fixed rhythm, the matching overhead must be active on the hit tick. */
export type AttackPattern = 'random' | 'no-repeat' | 'cycle' | 'streak';

export interface EnemyConfig {
  enabled: boolean;
  /** preset id or null for custom */
  preset: string | null;
  name: string;
  styles: Style4[];
  pattern: AttackPattern;
  /** streak pattern: how many attacks of one style before switching */
  streak: number;
  /** ticks between two attacks (5 = 3.0 s like most bosses) */
  intervalTicks: number;
  /** the style of the next attack becomes visible this many ticks before it lands */
  warningTicks: number;
  /** first attack lands this many ticks after the session start */
  firstAttackTicks: number;
  /** life points of the target; 0 = unlimited (training dummy). Damage is tracked whether or not attacks are enabled. */
  lifePoints: number;
}

export const DEFAULT_ENEMY: EnemyConfig = {
  enabled: false,
  preset: null,
  name: 'Custom',
  styles: ['Melee', 'Magic'],
  pattern: 'no-repeat',
  streak: 3,
  intervalTicks: 5,
  warningTicks: 3,
  firstAttackTicks: 8,
  lifePoints: 0,
};

/** Boss presets from runescape.wiki (auto-attack styles and rate; specials are not simulated). */
export const ENEMY_PRESETS: EnemyConfig[] = [
  { ...DEFAULT_ENEMY, enabled: true, preset: 'nakatra', name: 'Nakatra, Devourer Eternal', styles: ['Magic', 'Ranged'], pattern: 'streak', streak: 3, intervalTicks: 5, warningTicks: 3, lifePoints: 800000 },
  { ...DEFAULT_ENEMY, enabled: true, preset: 'zamorak', name: 'Zamorak, Lord of Chaos', styles: ['Magic', 'Ranged'], pattern: 'random', intervalTicks: 5, warningTicks: 3, lifePoints: 300000 },
  { ...DEFAULT_ENEMY, enabled: true, preset: 'raksha', name: 'Raksha, the Shadow Colossus', styles: ['Melee', 'Ranged', 'Magic'], pattern: 'no-repeat', intervalTicks: 5, warningTicks: 3, lifePoints: 800000 },
  { ...DEFAULT_ENEMY, enabled: true, preset: 'rasial', name: 'Rasial, the First Necromancer', styles: ['Necromancy'], pattern: 'cycle', intervalTicks: 5, warningTicks: 3, lifePoints: 900000 },
  { ...DEFAULT_ENEMY, enabled: false, preset: 'dummy', name: 'Training dummy', styles: ['Melee'], pattern: 'cycle', intervalTicks: 5, warningTicks: 3, lifePoints: 0 },
];

export interface PrayerStats {
  /** ticks of the session */
  ticks: number;
  /** ticks (without an attack) in which Soul Split was active */
  soulSplitTicks: number;
  attacks: number;
  /** attacks that met the right overhead */
  prayed: number;
  /** attacks that landed without the right overhead */
  hits: number;
}

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
  enemy?: EnemyConfig;
  prayerStats?: PrayerStats;
  /** damage dealt in the session (engine/damage.ts numbers) */
  damage?: { total: number; hits: number; dps: number; killedAtMs: number | null };
}

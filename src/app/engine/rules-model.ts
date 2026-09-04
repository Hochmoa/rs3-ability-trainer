/**
 * Data model for ability interactions. The engine evaluates these at fixed hook points; it never
 * knows an ability by name. Every rule carries the wiki source for the tooltip.
 */
import { AbilityType, Spellbook, Style } from '../core/models';

/**
 * Stacking buffs ("stacks"): counters like Bloodlust or Necrosis. They are ordinary buffs whose
 * BuffDef carries `stacks: { max }`; timer-less ones stay until consumed. This union lists the ids
 * the rules may reference, the definitions (name, cap, icon, text) live in rules-buffs.ts.
 */
export type StackId =
  | 'bloodlust'
  | 'necrosis'
  | 'residual-souls'
  | 'storm-shards'
  | 'death-spark'
  | 'soul-reave'
  | 'valour'
  | 'glacial-embrace'
  | 'essence-corruption'
  | 'concentrated-crit'
  | 'revenge'
  | 'gravitate'
  | 'primordial-ice';

/** Which stacks a style shows as resources on the training page (also with 0 stacks). */
export const STYLE_STACKS: Record<Style, StackId[]> = {
  Melee: ['bloodlust'],
  Ranged: [],
  Magic: [],
  Necromancy: ['necrosis', 'residual-souls'],
  Defence: [],
  Constitution: ['storm-shards'],
};

/** A status effect the rules know about (durations verified on the wiki; see docs/research). */
export interface BuffDef {
  id: string;
  name: string;
  kind: 'Buff' | 'Debuff';
  on: 'self' | 'target';
  /** null = until removed / session end */
  durationTicks: number | null;
  /** wiki buff id, for the icon from buffs.json */
  wikiId?: number;
  /** stacking counter shown on the icon; `max` is the cap (loadout items may raise it); refreshOnGain: a timed stack restarts its timer whenever a stack is added (Essence Corruption) */
  stacks?: { max: number; refreshOnGain?: boolean };
  /** the debuff is a bleed on the target (Jaws of the Abyss, Champion's ring count them) */
  bleed?: boolean;
  /** flat damage added to every hit of `style` while at least `minStacks` are held: add + perStack × stacks (Essence Corruption 10+: 3 × stacks + Magic level) */
  damageAddPerStack?: { minStacks: number; perStack: number; add: number; style?: Style };
  /** adrenaline granted every tick while active (Meteor Strike) */
  adrenalinePerTick?: number;
  /** ... only while a weapon of this style is wielded */
  adrenalinePerTickStyle?: Style;
  /** critical strike chance added to hits (add ≥ 1 = guaranteed) of `style`; firstHitOnly = first hit of a multi-hit / channel; never for a hit of the cast that created the buff */
  crit?: { add: number; style?: Style; firstHitOnly?: boolean };
  /** critical strike chance per stack held (Concentrated Blast: the stacks are the percent) */
  critChancePerStack?: number;
  /** critical strike damage added while active (Channelled Might +15%) */
  critDamageAdd?: number;
  /** swapping the main-hand weapon removes it (Concentrated Blast stacks) */
  removedOnMainHandSwap?: boolean;
  /** non-bleed damage of `style` × (1 + per × stacks held) (Gravitate: +1% melee damage per stack) */
  damageMultPerStack?: { style: Style; per: number };
  /** every critical strike of `style` fires an extra hit `delayTicks` later, keyed "<hit key>:<suffix>" (Instability's Lightning Surge); the extra hit never chains */
  critProc?: { style: Style; damage: { min: number; max: number }; delayTicks: number; suffix: string };
  /** stun and bind immunity while active (Anticipation, Freedom, Transfigure's second phase) */
  stunImmune?: boolean;
  /** threshold abilities need this much adrenaline while active (Limitless 15) */
  thresholdNeed?: number;
  /** no ability can be used while active (Transfigure's self-stun) */
  locksAbilities?: boolean;
  /** duration from the shield tier (defenders count half): base + bonusIfAny + ⌊tier / 10⌋ · perTen (Barricade 8 + ⌊t/10⌋, Debilitate 13 / 14 + ⌊t/10⌋) */
  durationByShieldTier?: { base: number; perTen: number; bonusIfAny?: number };
  /** no timer: stays until it blocks / reflects a hit or is toggled off (Disruption Shield, Vengeance, bone shields, auto-cast selections) */
  untilConsumed?: boolean;
  /** bone shield: counts as a shield of tier ⌊share × Necromancy level⌋ (+ nexus bonus) for shield requirements and durations */
  shieldTierShare?: number;
  /** blocks incoming attacks: 'next' = one hit and the buff is consumed (Disruption Shield, Resonance, Divert), 'all' = every hit while active (Barricade) */
  absorbs?: 'next' | 'all';
  /** icon path override (else the wiki buff icon, else the source ability's icon) */
  icon?: string;
  /** effect description for the tooltip */
  text: string;
  source: string;
}

export interface Condition {
  /** buff with this id must be active */
  buff?: string;
  /** buff with this id must not be active */
  notBuff?: string;
  /** stack count at least */
  stackMin?: { stack: StackId; min: number };
  /** press was processed while the GCD was still running (off-GCD abilities) */
  duringGcd?: boolean;
  /** loadout item / set threshold active */
  item?: string;
  /** ... not active (Sunshine's periodic damage unless Planted Feet) */
  notItem?: string;
  /** main-hand (or 2h) style */
  style?: Style;
  /** probability 0..1 (rolled once per evaluation) */
  chance?: number;
  /** this ability's own charge/flag */
  flag?: string;
  /** at least this many ticks since the player's last attack (Greater Barge opener) */
  idleMin?: number;
  /** only for this hit index (0-based) of a multi-hit / channel */
  hit?: number;
  /** stack count at most */
  stackMax?: { stack: StackId; max: number };
  /** target life points below this share of its maximum (Punish 2.5x under 50%); false when the target has no life points */
  targetLpBelow?: number;
  /** the cast did not set this flag (Spectral Scythe's last cast rolls no soul) */
  notFlag?: string;
}

export type Effect =
  /** add stacks to a stacking buff; `cap` overrides the definition's max (Berserk: Bloodlust 8) */
  | { kind: 'stack'; stack: StackId; amount: number; cap?: number; when?: Condition }
  /** set the counter; 0 removes a timer-less stacking buff (Death Essence readies Death Spark only with an Omni guard in hand) */
  | { kind: 'stack-set'; stack: StackId; amount: number; when?: Condition }
  /** take stacks away (only when at least `min` are held); `then` runs after a successful consume */
  | { kind: 'consume-stack'; stack: StackId; amount: number | 'all'; min?: number; when?: Condition; then?: Effect[] }
  /** `untilSpirit`: the buff lives exactly as long as that conjured spirit (Haunted while the commanded ghost hits) */
  /** `delayTicks`: the buff appears that many ticks after the cast (Death's Swiftness / Sunshine start 1 tick later) */
  | { kind: 'buff'; id: string; durationTicks?: number; refresh?: boolean; when?: Condition; stacks?: number; untilSpirit?: string; delayTicks?: number }
  | { kind: 'extend-buff'; buff: string; ticks: number; maxTotal?: number; when?: Condition }
  /** Life Transfer: every active conjured spirit lives `ticks` longer */
  | { kind: 'extend-spirits'; ticks: number }
  | { kind: 'remove-buff'; id: string; when?: Condition }
  | { kind: 'cooldown-reset'; abilities: string[]; when?: Condition }
  | { kind: 'cooldown-reduce'; ability: string; ticks: number; when?: Condition }
  | { kind: 'adrenaline'; amount: number; when?: Condition }
  | { kind: 'adrenaline-per-tick'; amount: number; ticks: number; when?: Condition }
  | { kind: 'sequence-open'; group: string; step: number; windowTicks: number }
  | { kind: 'sequence-reset'; group: string }
  | { kind: 'flag'; flag: string; value: boolean }
  | { kind: 'conjure'; spirit: string; durationTicks: number }
  | { kind: 'dismiss'; spirit: string; reconjureAfterTicks?: number }
  | { kind: 'choose'; when: Condition; then: Effect[]; otherwise?: Effect[] }
  /** toggle: active → removed, else applied and every buff in `excludes` removed (bone shields, auto-cast spell selection) */
  | { kind: 'toggle-buff'; id: string; excludes?: string[] };

export interface Requirement {
  /** human text, e.g. "needs 2 Residual Souls" */
  text: string;
  buff?: string;
  notBuff?: string;
  stackMin?: { stack: StackId; min: number };
  /** stack count at most (Storm Shards cannot be cast at 10) */
  stackMax?: { stack: StackId; max: number };
  spirit?: string;
  spiritAgeMin?: number;
  /** any conjured spirit must be out (Life Transfer) */
  anySpirit?: boolean;
  sequence?: { group: string; step: number };
  adrenalineBelow?: number;
  adrenalineMin?: number;
  equipment?: '2h' | 'shield' | 'defender-or-shield' | 'conduit' | 'spec-weapon' | 'eof';
  /** offensive shield ability (Bash, Revenge): an active bone shield does not satisfy the shield requirement */
  offensive?: boolean;
  style?: Style;
  notStunImmune?: boolean;
  /** spell of this book: the loadout's spellbook must match */
  spellbook?: Spellbook;
}

export interface CostRule {
  /** flat override of the data cost */
  cost?: number;
  /** cost = base − per × min(stacks, maxStacks); the stacks are consumed. On a weapon special only the cost drops, the requirement stays (Icy Tempest) */
  perStack?: { stack: StackId; per: number; maxStacks: number; base: number };
  /** buff discount: consumed by the cast */
  buffDiscount?: { buff: string; amount: number };
  /** threshold ability: requirement 50 (15 during Limitless), drain 15 */
  threshold?: boolean;
  /** ultimate refund rules apply (Ring of vigour, Conservation) */
  ultimate?: boolean;
}

export interface CooldownRule {
  /** cooldown when the condition holds (e.g. Death Skulls 17 while Living Death) */
  ticks: number;
  when: Condition;
}

export interface BleedSpec {
  hits: number;
  everyTicks: number;
  startTicks?: number;
  /** the ability also lands a direct hit on the cast tick (Massacre) */
  direct?: boolean;
  /** abilities.json gives the total: divide it by `hits` (Bloat) */
  splitTotal?: boolean;
  /** per-hit factor of the base roll (Corruption Shot 1.0 / 0.8 / 0.6 / 0.4 / 0.2) */
  factors?: number[];
  /** roll of the DoT hits when it differs from the ability's (Massacre: flat 100% after a 110–130% opener) */
  damage?: { min: number; max: number };
  /** the cast starts no cooldown (Essence Corruption: a DoT dealt at once has its cooldown removed) */
  noCooldown?: boolean;
}

export interface ChannelSpec {
  /** total ticks the channel occupies */
  ticks: number;
  /** tick offsets (from the cast tick) at which hits land */
  hits: number[];
  /** moving does not cancel it */
  movable?: boolean;
  /** moving does not cancel it while this item (loadout passive id) is worn – Snipe with nightmare gauntlets */
  movableWith?: string;
  /** Onslaught: adrenaline drained per hit, channel ends when adrenaline is short */
  adrenalinePerHit?: number;
  /** Onslaught since the modernisation: with too little adrenaline the channel goes on (paid in life points) */
  continueWithoutAdrenaline?: boolean;
  /** Onslaught: hit n rolls (min + n · ramp.min) … (max + n · ramp.max) */
  damageRamp?: { min: number; max: number };
  /** these entity kinds cancel the channel when used (Onslaught: potions and weapon switches) */
  cancelledBy?: ('special' | 'weapon')[];
  /** effects only when every hit landed */
  onComplete?: Effect[];
  /** Endless Assault: when this holds at the cast the hits are dealt as an un-cancellable damage over time (still crit / style-buffed) */
  asDotWhen?: Condition;
  /** Blood Siphon: the last hit also deals this share of what the earlier hits of the channel dealt */
  finalAddsPriorShare?: number;
  /** every hit's roll × this (Tumeken's Asphyxiate: 8 hits at 0.6) */
  damageMult?: number;
  /** every hit is a critical strike (Smoke Tendrils) */
  guaranteedCrit?: boolean;
}

export interface AbilityRule {
  ability: string;
  /** shown in the tooltip; each line ends with the wiki URL in parentheses */
  notes: string[];
  /** never starts or obeys the GCD (Surge, Escape, Dive, Limitless, Runic Charge) */
  offGcd?: boolean;
  /** Bladed Dive / Provoke: inside the GCD no adrenaline and no GCD, outside a normal basic */
  offGcdNoGain?: boolean;
  /** independent charges (Backhand, Impact, Binding Shot) */
  charges?: number;
  /** replaces the data cooldown */
  cooldownTicks?: number;
  /** replaces the data adrenaline value */
  adrenaline?: number;
  requires?: Requirement[];
  cost?: CostRule;
  cooldownRules?: CooldownRule[];
  onCast?: Effect[];
  /** per hit; receives the hit index */
  onHit?: Effect[];
  /** non-channel multi-hit schedule (tick offsets), default [0] */
  hits?: number[];
  /** per-hit damage roll (% of ability damage) for multi-hits whose hits differ (Ricochet's returning arrows); index-aligned with `hits`, missing entries use the data roll; a hit whose `when` fails at the cast is skipped (Hurricane's Bloodlust hit) */
  hitDamage?: { min: number; max: number; when?: Condition }[];
  /** Greater Barge: +per tick since the last attack, up to maxTicks (snapshotted at the cast) */
  damageRamp?: { perTick: { min: number; max: number }; maxTicks: number };
  /** every hit is a critical strike (Shadow Tendrils) */
  guaranteedCrit?: boolean;
  /** the ability moves the player (Surge, Escape, Dive, Bladed Dive): cancels a channel that is not movable */
  moves?: boolean;
  channel?: ChannelSpec;
  /** the cast counts as this sequence step (group + step) and opens the next one */
  sequence?: { group: string; step: number; windowTicks: number; last?: boolean };
  /**
   * One ability with several casts in a row (Spectral Scythe): cast n uses stages[n-1]; the cooldown starts
   * with cast 1, later casts within the sequence window ignore it; the last cast resets the slot.
   */
  stages?: { cost: number; damage?: { min: number; max: number } }[];
  /** the hits are the conjured spirit's (Command Skeleton Warrior): no crit, Rage builds and applies, robes bonus */
  spiritHit?: string;
  /** bleed / burn: `hits` damage-over-time hits every `everyTicks` (first after `startTicks`, default everyTicks); no crits, no style buffs */
  bleed?: BleedSpec;
  /** a bleed that depends on the state at the cast (Sunshine's periodic damage unless Planted Feet, Combust instant with Kerapac's wraps); first match wins, else `bleed` */
  bleedWhen?: { when: Condition; bleed: BleedSpec }[];
  /** critical strike modifiers of the ability itself (Wild Magic +10% chance / +20% damage; Magma Tempest never crits) */
  crit?: { chanceAdd?: number; damageAdd?: number; never?: boolean };
  /** the ability's damage numbers are stored, not dealt (Storm Shards) */
  noDamage?: boolean;
  /** one hit of (stacks × min) … (stacks × max) % of the ability damage, capped (Shatter) */
  damagePerStack?: { stack: StackId; min: number; max: number; cap?: number };
  /** every hit's roll += stacks held at the cast × (min … max) % (Death Grasp +40% per Necrosis, Soul Crush +135–165% per Residual Soul, Icy Tempest); read before the cast effects consume the stacks */
  damageAddPerStack?: { stack: StackId; min: number; max: number };
  /** per-hit critical strike bonuses, index-aligned with `hits` (The Final Flurry: +25% / +25% / +50% chance and damage) */
  hitCrit?: ({ chanceAdd?: number; damageAdd?: number } | undefined)[];
  /** pressing again while this buff runs releases it: no cost, no cooldown, off the GCD (Reprisal) */
  recast?: { whileBuff: string };
  /** one hit per stack held (Volley of Souls) */
  hitsPerStack?: StackId;
  /** situational damage multipliers (Finger of Death 1.5x under Living Death) */
  damageRules?: {
    when: Condition;
    mult?: number;
    /** replaces the roll (Assault 170–190% with 4 Bloodlust) */
    damage?: { min: number; max: number };
    /** +per × missing life points % of the target, capped (Flurry with 4 Bloodlust: 1% per 1%, max 65%) */
    perMissingLp?: { per: number; max: number };
    /** × (1 + mult × stacks held when the cast started) – Command Phantom Guardian with Valour */
    perStackAtCast?: { stack: StackId; mult: number };
  }[];
  sharedCooldown?: string;
  /** buffs applied on cast (overrides the wiki buff link) */
  buffs?: string[];
  /** buffs applied per hit */
  hitBuffs?: string[];
  /** these Greater/base abilities cannot coexist on a bar */
  replaces?: string;
}

/** Style-wide behaviour (Bloodlust generation, Flow consumption ...). */
export interface GlobalRule {
  id: string;
  notes: string[];
  when: {
    style?: Style;
    styles?: Style[];
    type?: AbilityType;
    types?: AbilityType[];
    /** ability costs adrenaline */
    costing?: boolean;
    /** ability generates adrenaline */
    generating?: boolean;
    abilities?: string[];
    excludeAbilities?: string[];
    buff?: string;
    /** only GCD abilities */
    gcd?: boolean;
    /** loadout item / weapon passive active (Dark Shard of Leng's Primordial Ice) */
    item?: string;
    /** at least this many stacks held when the cast starts */
    stackMin?: { stack: StackId; min: number };
  };
  onCast?: Effect[];
  onHit?: Effect[];
  /** multiply the adrenaline gain of matching abilities (Meteor Strike ×1.5, Natural Instinct ×2) */
  gainMult?: number;
  /** add to the adrenaline gain (Living Death: Touch of Death +6) */
  gainAdd?: number;
  /** per-hit adrenaline (Shadow Imbued +5) */
  hitAdrenaline?: number;
  /** adrenaline per critical hit (Tsunami +8) */
  critAdrenaline?: number;
  /** consume this buff when the ability matches (Flow, Chaos Roar, Greater Fury) */
  consumes?: string;
  /** damage multiplier of the matching cast, taken before `consumes` removes the buff (Chaos Roar 1.75x); firstHitOnly = only the first hit of a channel / bleed */
  damageMult?: { mult: number; firstHitOnly?: boolean };
  /** cost discount taken from a buff before consuming it */
  discount?: number;
}

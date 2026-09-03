/**
 * Data model for ability interactions. The engine evaluates these at fixed hook points; it never
 * knows an ability by name. Every rule carries the wiki source for the tooltip.
 */
import { AbilityType, Style } from '../core/models';

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
  | 'revenge';

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
  /** stacking counter shown on the icon; `max` is the cap (loadout items may raise it) */
  stacks?: { max: number };
  /** adrenaline granted every tick while active (Meteor Strike) */
  adrenalinePerTick?: number;
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
}

export type Effect =
  /** add stacks to a stacking buff; `cap` overrides the definition's max (Berserk: Bloodlust 8) */
  | { kind: 'stack'; stack: StackId; amount: number; cap?: number; when?: Condition }
  /** set the counter; 0 removes a timer-less stacking buff */
  | { kind: 'stack-set'; stack: StackId; amount: number }
  /** take stacks away (only when at least `min` are held); `then` runs after a successful consume */
  | { kind: 'consume-stack'; stack: StackId; amount: number | 'all'; min?: number; when?: Condition; then?: Effect[] }
  /** `untilSpirit`: the buff lives exactly as long as that conjured spirit (Haunted while the commanded ghost hits) */
  | { kind: 'buff'; id: string; durationTicks?: number; refresh?: boolean; when?: Condition; stacks?: number; untilSpirit?: string }
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
  | { kind: 'choose'; when: Condition; then: Effect[]; otherwise?: Effect[] };

export interface Requirement {
  /** human text, e.g. "needs 2 Residual Souls" */
  text: string;
  buff?: string;
  notBuff?: string;
  stackMin?: { stack: StackId; min: number };
  spirit?: string;
  spiritAgeMin?: number;
  sequence?: { group: string; step: number };
  adrenalineBelow?: number;
  adrenalineMin?: number;
  equipment?: '2h' | 'shield' | 'defender-or-shield' | 'conduit' | 'spec-weapon' | 'eof';
  style?: Style;
  notStunImmune?: boolean;
}

export interface CostRule {
  /** flat override of the data cost */
  cost?: number;
  /** cost = base − per × min(stacks, maxStacks); the stacks are consumed */
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
}

export interface ChannelSpec {
  /** total ticks the channel occupies */
  ticks: number;
  /** tick offsets (from the cast tick) at which hits land */
  hits: number[];
  /** moving does not cancel it */
  movable?: boolean;
  /** Onslaught: adrenaline drained per hit, channel ends when adrenaline is short */
  adrenalinePerHit?: number;
  /** effects only when every hit landed */
  onComplete?: Effect[];
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
  channel?: ChannelSpec;
  /** the cast counts as this sequence step (group + step) and opens the next one */
  sequence?: { group: string; step: number; windowTicks: number; last?: boolean };
  /**
   * One ability with several casts in a row (Spectral Scythe): cast n uses stages[n-1]; the cooldown starts
   * with cast 1, later casts within the sequence window ignore it; the last cast resets the slot.
   */
  stages?: { cost: number }[];
  /** bleed / burn: `hits` damage-over-time hits every `everyTicks` (first after `startTicks`, default everyTicks); no crits, no style buffs */
  bleed?: BleedSpec;
  /** one hit per stack held (Volley of Souls) */
  hitsPerStack?: StackId;
  /** situational damage multipliers (Finger of Death 1.5x under Living Death) */
  damageRules?: { when: Condition; mult: number }[];
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
  /** cost discount taken from a buff before consuming it */
  discount?: number;
}

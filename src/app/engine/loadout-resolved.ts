/** What the engine needs to know about the player's equipment, perks, relics and unlocks. */
import { CombatSkill, DEFAULT_LEVELS, Familiar, Spellbook, Style, Style4 } from '../core/models';
import { baseLifePoints } from './damage';
import { ChannelSpec, StackId } from './rules-model';
import type { EngineEntity } from './trainer-engine';

/** An item effect rolled on every non-DoT hit of the player (Scripture of Ful / Wen / Jas, Dark Sliver of Leng). */
export interface HitProc {
  /** item id (set-effects.json) */
  id: string;
  chance: number;
  /** no second proc for this many ticks after one */
  cooldownTicks: number;
  /** only hits of this style roll it (Dark Sliver of Leng: melee) */
  style?: Style;
  /** self buff granted by the proc (Gladiator's Rage, Frostblades) */
  buff?: { id: string; durationTicks: number };
  /** extra hits: tick offset from the proc and roll in % of the ability damage (Scripture of Wen: 5 beams + shatter) */
  hits?: { offset: number; min: number; max: number }[];
  /** Scripture of Jas: `share` of all damage dealt within `windowTicks` after the proc is dealt again one tick later, capped */
  echo?: { windowTicks: number; share: number; cap: number };
  /** adrenaline granted at once (Deathmark 10) */
  adrenaline?: number;
  /** an extra hit of (base + perLpShare × current / max life points of the target) × ability damage on the same tick (Blood Forfeit 0.25 + 1 × share; a target without life points counts as full) */
  lpScaledHit?: { base: number; perLpShare: number };
}

/** Bow of the Last Guardian's passive (set-effects.json kind "perfect-equilibrium") */
export interface PerfectEquilibrium {
  /** hits needed for the bonus hit */
  stacks: number;
  /** ... while this buff runs (Balance by Force: 4) */
  stacksWithBuff: { buff: string; stacks: number };
  /** % of the ability damage the bonus hit rolls */
  abilityDamage: { min: number; max: number };
  /** share of the triggering hit's damage (before its critical strike) added to the bonus hit */
  hitShare: { min: number; max: number };
}

export interface ResolvedLoadout {
  startAdrenaline: number;
  /** 100 + Heightened Senses 10 + Vestments of havoc (4) 20 */
  maxAdrenaline: number;
  /** Ring of vigour 10 + Conservation of Energy 10, after an ultimate */
  ultimateRefund: number;
  /** Fury of the Small +1 on basics */
  basicGainAdd: number;
  impatientRank: number;
  /** Invigorating: basic attack adrenaline × (1 + 0.05 × rank) */
  invigoratingRank: number;
  relentlessRank: number;
  /** Ring of vigour: special attacks need and cost 90% */
  specCostMult: number;
  /** asylum surgeon's ring: chance that an adrenaline-costing ability costs `amount` less (30 s internal cooldown) */
  costReduction: { chance: number; amount: number; cooldownTicks: number } | null;
  /** channeller's ring: critical strike chance added to hit n (0-based) of a channel of `style`: (n + 1) × add */
  channelCritPerHit: { add: number; style: Style | null } | null;
  /** jaws of the abyss: adrenaline added to a damaging melee basic per bleed on the target */
  adrenalinePerBleed: number;
  /** champion's ring: critical strike chance added while the target bleeds */
  critVsBleeding: number;
  /** void knight: every player hit × this (conjured spirits excluded) */
  damageMult: number;
  /** ability id → multiplier of its damage-over-time hits (Song of Destruction (2): Combust, Corruption Blast × 1.3) */
  dotDamageMult: Record<string, number>;
  /** item procs rolled on every non-DoT hit */
  hitProcs: HitProc[];
  /** cinderbane gloves: chance per hit to poison the target; a poison hit is `pct` % of the ability damage × 0.65–1.3 */
  poison: { chance: number; pct: number } | null;
  /** set thresholds / items whose effect kind the simulation ignores (NOT_SIMULATED_EFFECT_KINDS in loadout-resolver.ts) */
  ignoredEffects: { id: string; kind: string }[];
  /** active item / set-threshold ids used in rule conditions ("planted-feet", "fleeting-boots", "gloves-of-passage", ...) */
  items: Set<string>;
  /** buff id → extra ticks (Berserk +10 with 3 Vestments, Barricade +3 Malletops, Anticipation Clear Headed ...) */
  buffDurationAdd: Record<string, number>;
  /** buff id → multiplier (Reflexes 0.5, Preparation perk 1.15^rank, Turtling) */
  buffDurationMult: Record<string, number>;
  /** ability id → cooldown multiplier (Mobile 0.5, Turtling, Preparation perk, Brief Respite) */
  cooldownMult: Record<string, number>;
  /** conjure lifetime: (base + add) × mult */
  conjureDurationAdd: number;
  conjureDurationMult: number;
  /** Robes of the First Necromancer (2): spirit damage × (1 + 0.07 per piece) */
  conjureDamageMult: number;
  /** stack caps changed by items (soulbound lantern: residual-souls 5) */
  stackCaps: Partial<Record<StackId, number>>;
  /** ability id → channel replacing the rule's (Tumeken's Asphyxiate) */
  channelOverrides: Record<string, ChannelSpec>;
  /** ability id → hit schedule replacing the rule's (Igneous capes) */
  hitsOverrides: Record<string, number[]>;
  /** ability id → damage roll replacing the data roll (Igneous capes: Deadshot 8 × 55–75%) */
  damageOverrides: Record<string, { min: number; max: number }>;
  /** ability id → share of the ability damage added to every hit (Caroming: Ricochet +4% per rank) */
  flatAddPerAbility: Record<string, number>;
  /** Ultimatums: damage of ultimate abilities × (1 + 0.03 + 0.01 per rank) */
  ultimateDamageMult: number;
  /** ability id → adrenaline per tick while channelling (Dracolich Rapid Fire) */
  channelAdrenalinePerTick: Record<string, number>;
  /** ability id → buffs a full channel grants (Dracolich infusion after Rapid Fire with a bow) */
  fullChannelBuffs: Record<string, { buff: string; durationTicks: number; requiresWeapon?: 'bow' | 'crossbow' }[]>;
  /** buff id → critical strike chance added while it is active (Dracolich infusion +20% / +40% ranged) */
  buffCritAdd: Record<string, { add: number; style?: Style }>;
  /** buff id → critical strike damage added while it is active, replacing the definition's (Tumeken 5: Channelled Might +35%) */
  buffCritDamageAdd: Record<string, number>;
  /** critical strike damage added to every hit (Fractured Staff of Armadyl +20%) */
  critDamageAdd: number;
  /** Vestments of havoc (2): adrenaline after a melee ultimate */
  adrenalineAfterUltimate: { style: Style; amount: number; overTicks: number; instantIfActive: number } | null;
  /** main-hand / 2h style */
  style: Style | null;
  has2h: boolean;
  hasShield: boolean;
  /** tier of the shield in the off-hand; a defender counts half; 0 without */
  shieldTier: number;
  hasDefender: boolean;
  /** necromancy siphon + conduit */
  hasConduit: boolean;
  /** a nexus (Deathwarden, Zemouregal's, the Devourer's) in the ammunition slot – the rune store of the bone shields */
  hasNexus: boolean;
  /** Zemouregal's nexus (Fortified Bones): levels added to an active bone shield */
  boneShieldLevelBonus: number;
  /** active spellbook – spells of another book cannot be cast */
  spellbook: Spellbook;
  weaponType: 'bow' | 'crossbow' | 'other' | null;
  /** special attack of the wielded weapon, as an entity */
  weaponSpec: EngineEntity | null;
  /** special attack stored in the Essence of Finality, as an entity */
  eofSpec: EngineEntity | null;
  /** player ability damage for the wielded weapons (engine/damage.ts abilityDamageOf: the boosted level of the style's damage skill, the weapons' tier part, the gear's damage bonus) */
  abilityDamage: number;
  /** level of the wielded style's damage skill the ability damage was computed with (Loadout.levels under the overload: 99 â†’ 116 / 118 / 120, Necromancy 120 â†’ 145) */
  combatLevel: number;
  /** every combat skill's level with the overload applied (base: Loadout.levels) */
  levels: Record<CombatSkill, number>;
  /** damage bonus (Strength / Ranged / Magic / Necromancy bonus) of the worn gear per style â€“ the b of the ability damage formula */
  damageBonus: Record<Style4, number>;
  /** life points the worn armour / shield adds to the maximum */
  lifePointsBonus: number;
  /** maximum life points: 100 Ã— Constitution level + the gear's bonus (Powerburst of vitality and Fortitude come on top in the engine) */
  maxLifePoints: number;
  /** amulet of zealots worn: single-stat prayers and leech curses boost damage by a further 10% */
  zealots: boolean;
  /** extra critical strike chance (Biting 2% per rank) */
  critChanceAdd: number;
  /** Precise: minimum hit +1.5% of the max per rank (not DoTs, except Bloat's initial hit) */
  preciseRank: number;
  /** Equilibrium (2024 version): ability damage +6% +2% per rank, no critical strikes – see abilityDamageMult / critDisabled */
  equilibriumRank: number;
  /**
   * Multiplier of the ability damage stat itself (Equilibrium 1.08–1.14, Eruptive 1.005 per rank). Applied to `abilityDamage`
   * at the end of `resolveLoadout`, so it reaches everything rolled from it: DoTs, conjures, Aftershock, Crackling.
   */
  abilityDamageMult: number;
  /** Equilibrium: nothing can critically strike */
  critDisabled: boolean;
  /** ability id → damage multiplier of every hit incl. DoTs (Lunging: Combust / Dismember ×1.13–1.22; Shield Bashing: Debilitate ×1.15–1.6; Bulwark: Debilitate ×0) */
  damageMultPerAbility: Record<string, number>;
  /** buff id → extra duration after the multiplier: max(minTicks, ⌊duration × share⌋) (Bulwark: Debilitate +6% per rank, at least 1 tick per rank) */
  buffDurationExtra: Record<string, { share: number; minTicks: number }>;
  /** Aftershock: every `threshold` damage dealt an explosion of rank × perRank × ⌊rollMin..rollMax⌋ of the ability damage, at most every `minIntervalTicks` */
  aftershock: { rank: number; perRank: number; threshold: number; minIntervalTicks: number; rollMin: number; rollMax: number } | null;
  /** Crackling: a zap of rank × perRank of the ability damage on the first attack after every `cooldownTicks` */
  crackling: { rank: number; perRank: number; cooldownTicks: number } | null;
  /** Spendthrift: rank % chance of +rank % damage on a non-DoT hit */
  spendthriftRank: number;
  /** Flanking: the listed abilities deal +40% per rank when the target is not facing the player (EngineConfig.targetFacingAway) */
  flanking: { rank: number; perRank: number; abilities: string[] } | null;
  /** Ruthless: +0.5% per rank per stack, 5 stacks, refreshed on kills – needs kills, only reported (see docs/research/perks.md) */
  ruthlessRank: number;
  /** damage multiplier against a target type (Undead / Dragon / Demon Slayer perks 1.07, Salve amulet (e) 1.2, Jas dragonbane arrows 1.3; applies to DoTs too) – EngineConfig.targetType picks one */
  targetTypeDamageMult: Partial<Record<'undead' | 'dragon' | 'demon', number>>;
  /** combat familiar out during the session: attacks on its own, its scroll is usable (familiars.json) */
  familiar: Familiar | null;
  /** every player hit of `style` × mult (Ful arrows: Ranged 1.15 without DoTs; scrimshaw of the elements / cruelty: Magic / Ranged 1.05 or 1.0666 with DoTs) */
  styleDamageMult: { style: Style; mult: number; dots: boolean }[];
  /** hits of `style` × mult while the target carries `buff` (Ashen Vow: melee 1.12 against the Flamebound Rival); `notAbility`: the ability that applies the mark boosts itself through its own rule */
  targetBuffDamageMult: { buff: string; style?: Style; mult: number; notAbility?: string }[];
  /** Bow of the Last Guardian: the Perfect Equilibrium passive (null without the bow) */
  perfectEquilibrium: PerfectEquilibrium | null;
  /** accuracy of the main-hand / two-handed weapon (weapons.json infobox value = ⌊2.5 × f(tier)⌋; 0 without a weapon) – engine/hit-chance.ts */
  weaponAccuracy: number;
  /** accuracy multipliers (defender 1.03, nihil familiar 1.05 for its style, Ful arrows 0.9 ranged); `style` missing = every style */
  accuracyMult: { style?: Style; mult: number }[];
  /** added to the hit chance of every hit (reaver's ring −0.05) */
  hitChanceAdd: number;
  /** ability id → added to its hit chance (Nightmare gauntlets: Snipe +0.25) */
  hitChanceAddPerAbility: Record<string, number>;
  /** added to the hit chance against a target type (Salve amulet +0.15 / (e) +0.2 vs undead, Jas dragonbane / demonbane arrows +0.2) – EngineConfig.targetType picks one */
  targetTypeHitChanceAdd: Partial<Record<'undead' | 'dragon' | 'demon', number>>;
}

export function defaultResolvedLoadout(): ResolvedLoadout {
  return {
    startAdrenaline: 0,
    maxAdrenaline: 100,
    ultimateRefund: 0,
    basicGainAdd: 0,
    impatientRank: 0,
    invigoratingRank: 0,
    relentlessRank: 0,
    specCostMult: 1,
    costReduction: null,
    channelCritPerHit: null,
    adrenalinePerBleed: 0,
    critVsBleeding: 0,
    damageMult: 1,
    dotDamageMult: {},
    hitProcs: [],
    poison: null,
    ignoredEffects: [],
    items: new Set(),
    buffDurationAdd: {},
    buffDurationMult: {},
    cooldownMult: {},
    conjureDurationAdd: 0,
    conjureDurationMult: 1,
    conjureDamageMult: 1,
    stackCaps: {},
    channelOverrides: {},
    hitsOverrides: {},
    damageOverrides: {},
    flatAddPerAbility: {},
    ultimateDamageMult: 1,
    channelAdrenalinePerTick: {},
    fullChannelBuffs: {},
    buffCritAdd: {},
    buffCritDamageAdd: {},
    critDamageAdd: 0,
    adrenalineAfterUltimate: null,
    style: null,
    has2h: false,
    hasShield: false,
    shieldTier: 0,
    hasDefender: false,
    hasConduit: false,
    hasNexus: false,
    boneShieldLevelBonus: 0,
    spellbook: 'standard',
    weaponType: null,
    weaponSpec: null,
    eofSpec: null,
    abilityDamage: 0,
    combatLevel: 99,
    levels: { ...DEFAULT_LEVELS },
    damageBonus: { Melee: 0, Ranged: 0, Magic: 0, Necromancy: 0 },
    lifePointsBonus: 0,
    maxLifePoints: baseLifePoints(DEFAULT_LEVELS.constitution),
    zealots: false,
    critChanceAdd: 0,
    preciseRank: 0,
    equilibriumRank: 0,
    abilityDamageMult: 1,
    critDisabled: false,
    damageMultPerAbility: {},
    buffDurationExtra: {},
    aftershock: null,
    crackling: null,
    spendthriftRank: 0,
    flanking: null,
    ruthlessRank: 0,
    targetTypeDamageMult: {},
    familiar: null,
    styleDamageMult: [],
    targetBuffDamageMult: [],
    perfectEquilibrium: null,
    weaponAccuracy: 0,
    accuracyMult: [],
    hitChanceAdd: 0,
    hitChanceAddPerAbility: {},
    targetTypeHitChanceAdd: {},
  };
}

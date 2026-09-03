/** What the engine needs to know about the player's equipment, perks, relics and unlocks. */
import { Style } from '../core/models';
import { ChannelSpec, StackId } from './rules-model';
import type { EngineEntity } from './trainer-engine';

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
  /** asylum surgeon's ring: chance that a threshold costs nothing */
  thresholdFreeChance: number;
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
  /** stack caps changed by items (soulbound lantern: residual-souls 5) */
  stackCaps: Partial<Record<StackId, number>>;
  /** ability id → channel replacing the rule's (Tumeken's Asphyxiate) */
  channelOverrides: Record<string, ChannelSpec>;
  /** ability id → hit schedule replacing the rule's (Igneous capes) */
  hitsOverrides: Record<string, number[]>;
  /** ability id → adrenaline per tick while channelling (Dracolich Rapid Fire) */
  channelAdrenalinePerTick: Record<string, number>;
  /** Vestments of havoc (2): adrenaline after a melee ultimate */
  adrenalineAfterUltimate: { style: Style; amount: number; overTicks: number; instantIfActive: number } | null;
  /** main-hand / 2h style */
  style: Style | null;
  has2h: boolean;
  hasShield: boolean;
  hasDefender: boolean;
  /** necromancy siphon + conduit */
  hasConduit: boolean;
  weaponType: 'bow' | 'crossbow' | 'other' | null;
  /** special attack of the wielded weapon, as an entity */
  weaponSpec: EngineEntity | null;
  /** special attack stored in the Essence of Finality, as an entity */
  eofSpec: EngineEntity | null;
  /** player ability damage for the wielded weapons (engine/damage.ts; level 99, no armour bonus) */
  abilityDamage: number;
  /** extra critical strike chance (Biting 2% per rank) */
  critChanceAdd: number;
  /** Precise: minimum hit +1.5% of the max per rank */
  preciseRank: number;
  /** Equilibrium: minimum hit +3% per rank, maximum −1% per rank */
  equilibriumRank: number;
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
    thresholdFreeChance: 0,
    items: new Set(),
    buffDurationAdd: {},
    buffDurationMult: {},
    cooldownMult: {},
    conjureDurationAdd: 0,
    conjureDurationMult: 1,
    stackCaps: {},
    channelOverrides: {},
    hitsOverrides: {},
    channelAdrenalinePerTick: {},
    adrenalineAfterUltimate: null,
    style: null,
    has2h: false,
    hasShield: false,
    hasDefender: false,
    hasConduit: false,
    weaponType: null,
    weaponSpec: null,
    eofSpec: null,
    abilityDamage: 0,
    critChanceAdd: 0,
    preciseRank: 0,
    equilibriumRank: 0,
  };
}

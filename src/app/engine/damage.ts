/**
 * Damage numbers – runescape.wiki "Ability damage" and "Critical strike" (state September 2026).
 * The trainer assumes level 99 in every combat skill and ignores armour / jewellery damage bonuses (b = 0):
 * the numbers are meant for kill times and DPS comparisons between rotations, not for exact max hits.
 */
import { OverloadChoice, Style, Weapon } from '../core/models';

/** f(level) = 145·ln(1 + 0.6·level/145) / ln(1.6) – the level curve since the Combat Style Modernisation */
export function levelCurve(level: number): number {
  return (145 * Math.log(1 + (0.6 * level) / 145)) / Math.log(1.6);
}

/** ⌊2.5·f(level)⌋ – the skill part of the main-hand / two-hand ability damage (264 at level 99, 310 at 120) */
export function levelPart(level = 99): number {
  return Math.floor(2.5 * levelCurve(level));
}

/** the trainer's base level in every combat skill */
export const BASE_LEVEL = 99;

/**
 * Overloads boost every combat level by ⌊level × pct⌋ + flat for the whole session (36 min per flask, reapplied every 15 s):
 * Overload 15% + 3, Supreme 16% + 4, Elder 17% + 5 (the salve boosts the same) – https://runescape.wiki/w/Elder_overload_potion.
 * The wiki's ability damage formula uses "the level including boosts", so at 99 an elder overload means level 120.
 */
export const OVERLOADS: Record<OverloadChoice, { pct: number; flat: number; name: string }> = {
  none: { pct: 0, flat: 0, name: 'none' },
  overload: { pct: 0.15, flat: 3, name: 'Overload (+15% + 3)' },
  supreme: { pct: 0.16, flat: 4, name: 'Supreme overload (+16% + 4)' },
  elder: { pct: 0.17, flat: 5, name: 'Elder overload (+17% + 5)' },
};

/** combat level under an overload: 99 → 116 / 118 / 120 */
export function boostedLevel(choice: OverloadChoice | undefined, base = BASE_LEVEL): number {
  const o = OVERLOADS[choice ?? 'none'];
  return base + Math.floor(base * o.pct) + o.flat;
}

/**
 * Weapon poison – https://runescape.wiki/w/Weapon_poison%2B%2B%2B and https://runescape.wiki/w/Poison: every tier has a 1/8
 * chance per hit to poison; tier 1 (weapon poison) hits for 20% of the ability damage, +5% per tier (+ 25%, ++ 30%, +++ 35%),
 * × 0.65–1.3 every 17 ticks. Cinderbane gloves add one tier to another poison source (+++ → 40%).
 * Kwuarm incense sticks: +2.5% poison damage per potency level, max +10% – https://runescape.wiki/w/Kwuarm_incense_sticks
 */
export const WEAPON_POISON_CHANCE = 0.125;
export const KWUARM_PER_POTENCY = 0.025;
export function poisonPct(tier: number): number {
  return 20 + 5 * (tier - 1);
}

/**
 * Player ability damage: weapons.json already carries the tier part of every weapon (9.6·t main hand,
 * 4.8·t off-hand, 14.4·t two-handed); the skill part is ⌊2.5·f⌋ for the main hand / two-hander and ⌊1.25·f⌋
 * for the off-hand or the second half of a two-hander.
 */
export function abilityDamageOf(main: Weapon | null, off: Weapon | null, two: Weapon | null, level = 99): number {
  const lp = levelPart(level);
  const half = Math.floor(1.25 * levelCurve(level));
  if (two) return lp + half + (two.abilityDamage ?? 0);
  let ad = 0;
  if (main) ad += lp + (main.abilityDamage ?? 0);
  if (off && off.slot !== 'shield') ad += half + (off.abilityDamage ?? 0);
  return ad;
}

/** critical strikes deal +50% at level 90+ (10% at level 1, scaling up to 50%) */
export function critMultiplier(level = 99): number {
  return 1 + Math.min(0.5, Math.max(0.1, 0.1 + ((level - 1) / 89) * 0.4));
}

/** base critical strike chance of every hit */
export const BASE_CRIT_CHANCE = 0.1;

/** self buffs that multiply the damage of one style (bleeds / burns excluded where the wiki says so); `unlessBuff`: another buff takes priority (Blackhole yields to Berserk) */
export const BUFF_DAMAGE_MULT: { buff: string; style: Style; mult: number; dots: boolean; unlessBuff?: string }[] = [
  // Scripture of Ful: +20% damage dealt, every style
  { buff: 'gladiator-s-rage', style: 'Melee', mult: 1.2, dots: true },
  { buff: 'gladiator-s-rage', style: 'Ranged', mult: 1.2, dots: true },
  { buff: 'gladiator-s-rage', style: 'Magic', mult: 1.2, dots: true },
  { buff: 'gladiator-s-rage', style: 'Necromancy', mult: 1.2, dots: true },
  { buff: 'berserk', style: 'Melee', mult: 1.75, dots: false },
  { buff: 'blackhole', style: 'Melee', mult: 1.25, dots: false, unlessBuff: 'berserk' },
  { buff: 'rampage', style: 'Melee', mult: 1.2, dots: false },
  { buff: 'enduring-ruin', style: 'Melee', mult: 1.1, dots: false },
  { buff: 'sunshine', style: 'Magic', mult: 1.5, dots: false },
  { buff: 'greater-sunshine', style: 'Magic', mult: 1.5, dots: false },
  { buff: 'death-s-swiftness', style: 'Ranged', mult: 1.5, dots: false },
  { buff: 'greater-death-s-swiftness', style: 'Ranged', mult: 1.5, dots: false },
];

/**
 * Self buffs that add a flat share of the ability damage to every hit of a style (Searing Winds: +20% of
 * ability damage per ranged hit, Frostblades: +24% per melee hit). Added to the roll before crits and style
 * multipliers, like the base damage. Snapshotted at the cast, so a Snipe cast on the last buff tick keeps it.
 */
export const BUFF_FLAT_ADD: { buff: string; style: Style; pct: number; dots: boolean }[] = [
  { buff: 'searing-winds', style: 'Ranged', pct: 20, dots: false },
  { buff: 'frostblades', style: 'Melee', pct: 24, dots: false },
];

/** self buffs that multiply one ability type of a style, DoTs included (Blast Infused: magic basics +8%) */
export const BUFF_TYPE_DAMAGE_MULT: { buff: string; style: Style; type: string; mult: number }[] = [{ buff: 'blast-infused', style: 'Magic', type: 'Basic', mult: 1.08 }];

/** target debuffs that raise the damage it takes (dotsOnly: bleed / burn hits only – Corrupted Wounds) */
export const TARGET_DAMAGE_MULT: { buff: string; mult: number; dotsOnly?: boolean }[] = [
  { buff: 'special:vulnerability-bomb', mult: 1.1 },
  { buff: 'vulnerability', mult: 1.1 }, // the Vulnerability spell (standard spellbook) – same debuff as the bomb
  { buff: 'corrupted-wounds', mult: 1.2, dotsOnly: true },
];

/** target debuffs that add a share of the hit, capped at a share of the player's ability damage (Haunted +10%, cap 20% AD) */
export const TARGET_DAMAGE_ADD: { buff: string; pct: number; capPctOfAd: number }[] = [{ buff: 'haunted', pct: 0.1, capPctOfAd: 0.2 }];

/**
 * Conjured spirits attack on their own: % of ability damage every n ticks from `firstTick` after the conjure
 * (wiki conjure pages); spirits cannot crit. The zombie also poisons every 3 ticks (typeless DoT).
 */
export const SPIRIT_ATTACKS: Record<string, { everyTicks: number; firstTick: number; min: number; max: number; poison?: { everyTicks: number; firstTick: number; min: number; max: number } }> = {
  'skeleton-warrior': { everyTicks: 5, firstTick: 7, min: 22, max: 28 },
  'putrid-zombie': { everyTicks: 6, firstTick: 7, min: 18, max: 22, poison: { everyTicks: 3, firstTick: 9, min: 8, max: 12 } },
  'vengeful-ghost': { everyTicks: 7, firstTick: 6, min: 18, max: 22 },
};

/**
 * Poison on a monster (cinderbane gloves): a hit every 10 s of the tier's share of the ability damage
 * (tier 1 20%, +5% per tier) × 0.65–1.3 – https://runescape.wiki/w/Poison
 */
export const POISON_EVERY_TICKS = 17;
export const POISON_ROLL = { min: 0.65, max: 1.3 };

/** Skeleton Warrior Rage: +3% damage per stack, max 25, one stack per skeleton attack */
export const RAGE_PER_STACK = 0.03;
export const RAGE_MAX = 25;

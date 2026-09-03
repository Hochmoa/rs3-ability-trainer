/**
 * Damage numbers – runescape.wiki "Ability damage" and "Critical strike" (state September 2026).
 * The trainer assumes level 99 in every combat skill and ignores armour / jewellery damage bonuses (b = 0):
 * the numbers are meant for kill times and DPS comparisons between rotations, not for exact max hits.
 */
import { Style, Weapon } from '../core/models';

/** f(level) = 145·ln(1 + 0.6·level/145) / ln(1.6) – the level curve since the Combat Style Modernisation */
export function levelCurve(level: number): number {
  return (145 * Math.log(1 + (0.6 * level) / 145)) / Math.log(1.6);
}

/** ⌊2.5·f(level)⌋ – the skill part of the main-hand / two-hand ability damage (264 at level 99) */
export function levelPart(level = 99): number {
  return Math.floor(2.5 * levelCurve(level));
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

/** self buffs that multiply the damage of one style (bleeds / burns excluded where the wiki says so) */
export const BUFF_DAMAGE_MULT: { buff: string; style: Style; mult: number; dots: boolean }[] = [
  { buff: 'berserk', style: 'Melee', mult: 1.75, dots: false },
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

/** Skeleton Warrior Rage: +3% damage per stack, max 25, one stack per skeleton attack */
export const RAGE_PER_STACK = 0.03;
export const RAGE_MAX = 25;

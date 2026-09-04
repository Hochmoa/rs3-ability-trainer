/**
 * Hit chance – runescape.wiki "Hit chance", "Armour rating", "Affinity", "Weapon accuracy" (state September 2026).
 * Sources and worked numbers: docs/research/hit-chance.md.
 *
 *   H = min(1, Aff / 100 × a / d + m)
 *   a = ⌊f(ℓ) + 2.5 × f(t)⌋   (ℓ = boosted skill level incl. prayer levels, t = weapon tier; wiki: "level bonus L + weapon tier bonus T")
 *   d = ⌊armour + f(Defence level)⌋
 *   f(x) = x³ / 1250 + 4x + 40
 *
 * Since 4 March 2024 hit chance is a damage multiplier against NPCs ("damage potential"): a hit deals H × its roll, and only
 * below 1 % every attack misses. The engine also offers the old "roll to hit" (PvP-style binary miss) as a model.
 */
import { CombatSkill, Style, Style4, Weapon, isStyle4 } from '../core/models';

/** f(x) = x³/1250 + 4x + 40 – the accuracy / armour curve of a level or tier */
export function accuracyCurve(x: number): number {
  return (x * x * x) / 1250 + 4 * x + 40;
}

/** weapon accuracy of a tier: 2.5 × f(t) = t³/500 + 10t + 100 (wiki "Weapon accuracy"; 2765 at tier 95, 1486 at 70) */
export function weaponAccuracyOf(tier: number): number {
  return 2.5 * accuracyCurve(tier);
}

/**
 * The accuracy stat of a weapon: 2.5 × f(accuracy tier), unrounded like the wiki's worked example (a Saradomin godsword's
 * 1,693.75, shown as 1,694 in its infobox); the weapons.json infobox value only when the data has no tier.
 */
export function weaponAccuracy(w: Pick<Weapon, 'accuracy' | 'tierAccuracy' | 'tier'> | null | undefined): number {
  if (!w) return 0;
  const t = w.tierAccuracy || w.tier;
  return t > 0 ? weaponAccuracyOf(t) : Math.max(0, w.accuracy);
}

/** a = ⌊f(level) + weapon accuracy⌋ – the wiki's "⌊f(99) + 2.5×f(75)⌋ = 2,905" for a Saradomin godsword at 99 Attack */
export function accuracyRating(level: number, weaponAcc: number): number {
  return Math.floor(accuracyCurve(Math.max(1, level)) + weaponAcc + 1e-9);
}

/** d = ⌊armour + f(Defence level)⌋ – the wiki's "⌊1,608 + f(70)⌋ = 2,202" for abyssal demons */
export function armourRating(defenceLevel: number, armour: number): number {
  return Math.floor(armour + accuracyCurve(Math.max(1, defenceLevel)) + 1e-9);
}

/** below this hit chance every attack misses (wiki: "If a player has under 1% hit chance, they will miss all their attacks") */
export const MIN_HIT_CHANCE = 0.01;

/** H = min(1, affinity/100 × a/d + m); a target without armour rating is always hit */
export function hitChance(affinity: number, accuracy: number, armour: number, add = 0): number {
  if (armour <= 0) return 1;
  return Math.max(0, Math.min(1, (affinity / 100) * (accuracy / armour) + add));
}

/** the skill whose level enters the accuracy of a style (wiki: Attack for melee, then Ranged / Magic / Necromancy) */
export function accuracySkillOf(style: Style | null | undefined): CombatSkill {
  switch (style) {
    case 'Ranged': return 'ranged';
    case 'Magic': return 'magic';
    case 'Necromancy': return 'necromancy';
    default: return 'attack';
  }
}

/** the four attack styles a target has an affinity for; Defence / Constitution abilities count as the wielded style */
export function affinityStyleOf(style: Style | null | undefined, wielded: Style | null | undefined): Style4 {
  if (style && isStyle4(style)) return style;
  if (wielded && isStyle4(wielded)) return wielded;
  return 'Melee';
}

/**
 * Prayers and curses add levels to the accuracy skill (prayers.json "+N levels (for accuracy)"; since the Combat Style
 * Modernisation they are level bonuses, not percentages). Leeches grow from +2 to +5 over 1–3 minutes – the maximum is used.
 */
export const PRAYER_ACCURACY_LEVELS: Record<string, { style: Style4; levels: number }> = {
  'clarity-of-thought': { style: 'Melee', levels: 2 },
  'improved-reflexes': { style: 'Melee', levels: 4 },
  'incredible-reflexes': { style: 'Melee', levels: 6 },
  chivalry: { style: 'Melee', levels: 7 },
  piety: { style: 'Melee', levels: 8 },
  turmoil: { style: 'Melee', levels: 10 },
  malevolence: { style: 'Melee', levels: 12 },
  'leech-melee-attack': { style: 'Melee', levels: 5 },
  'sharp-eye': { style: 'Ranged', levels: 2 },
  'hawk-eye': { style: 'Ranged', levels: 4 },
  'eagle-eye': { style: 'Ranged', levels: 6 },
  rigour: { style: 'Ranged', levels: 8 },
  anguish: { style: 'Ranged', levels: 10 },
  desolation: { style: 'Ranged', levels: 12 },
  'leech-ranged-attack': { style: 'Ranged', levels: 5 },
  'mystic-will': { style: 'Magic', levels: 2 },
  'mystic-lore': { style: 'Magic', levels: 4 },
  'mystic-might': { style: 'Magic', levels: 6 },
  augury: { style: 'Magic', levels: 8 },
  torment: { style: 'Magic', levels: 10 },
  affliction: { style: 'Magic', levels: 12 },
  'leech-magic-attack': { style: 'Magic', levels: 5 },
  'hand-of-judgement': { style: 'Necromancy', levels: 2 },
  'hand-of-fate': { style: 'Necromancy', levels: 4 },
  'hand-of-doom': { style: 'Necromancy', levels: 6 },
  sanctity: { style: 'Necromancy', levels: 8 },
  sorrow: { style: 'Necromancy', levels: 10 },
  ruination: { style: 'Necromancy', levels: 12 },
  'leech-necromancy-attack': { style: 'Necromancy', levels: 5 },
};

/** levels the active prayers add to the accuracy of `style` */
export function prayerAccuracyLevels(active: ReadonlySet<string>, style: Style4): number {
  let levels = 0;
  for (const id of active) {
    const p = PRAYER_ACCURACY_LEVELS[id];
    if (p && p.style === style) levels += p.levels;
  }
  return levels;
}

/** self buffs that add to the hit chance of some ability types (Icy Precision: +30% for ranged enhanced / ultimate / special, not for the cast that consumed the stacks) */
export const BUFF_HIT_CHANCE_ADD: { buff: string; style: Style; types: string[]; add: number; notGrantingCast: boolean }[] = [
  { buff: 'icy-precision', style: 'Ranged', types: ['Enhanced', 'Threshold', 'Ultimate', 'Special'], add: 0.3, notGrantingCast: true },
];

/** abilities whose damage over time bypasses hit chance (wiki: "Damage over time from normal and greater Sunshine") */
export const HIT_CHANCE_BYPASS_DOTS = new Set(['sunshine', 'greater-sunshine']);

/** off-hand defenders / reprisers / rebounders: accuracy × 1.03 (wiki hit chance modifier table) */
export const DEFENDER_ACCURACY_MULT = 1.03;

/** nihil familiars: +5% accuracy of their style (wiki: multiplier 1.05) */
export const NIHIL_ACCURACY: Record<string, Style4> = { 'blood-nihil': 'Melee', 'shadow-nihil': 'Ranged', 'smoke-nihil': 'Magic', 'ice-nihil': 'Necromancy' };
export const NIHIL_ACCURACY_MULT = 1.05;

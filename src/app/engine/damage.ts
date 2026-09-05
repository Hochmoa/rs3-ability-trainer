/**
 * Damage numbers – runescape.wiki "Ability damage", "Damage bonus", "Power armour", "Critical strike", "Life points" and the
 * prayer pages (state September 2026). Every input of the ability damage is the wiki's: the wielded weapons' tier part, the
 * boosted level of the style's damage skill, and the damage bonus b of the worn armour / jewellery.
 */
import { CombatSkill, DamageBonus, GearItem, OverloadChoice, Style, Style4, Weapon } from '../core/models';

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

/** skills an overload boosts (Constitution and Prayer are not combat-boosted by overloads) */
export const OVERLOAD_SKILLS: CombatSkill[] = ['attack', 'strength', 'ranged', 'magic', 'necromancy', 'defence'];

/** every skill's level with the overload applied */
export function boostedLevels(levels: Record<CombatSkill, number>, choice: OverloadChoice | undefined): Record<CombatSkill, number> {
  const out = { ...levels };
  for (const k of OVERLOAD_SKILLS) out[k] = boostedLevel(choice, levels[k]);
  return out;
}

/** the skill whose level enters the ability damage of a style (wiki: Strength for melee) */
export function damageSkillOf(style: Style | null | undefined): CombatSkill {
  switch (style) {
    case 'Ranged': return 'ranged';
    case 'Magic': return 'magic';
    case 'Necromancy': return 'necromancy';
    default: return 'strength';
  }
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
 * Player ability damage – runescape.wiki/w/Ability_damage, with f = levelCurve(level of the style's damage skill, boosts
 * included) and b = the damage bonus of the worn gear for that style:
 *   AD_mh = ⌊2.5·f⌋ + ⌊9.6·t_mh + b⌋
 *   AD_oh = ⌊0.5·(⌊2.5·f⌋ + ⌊9.6·t_oh + b⌋)⌋
 *   AD_2h = ⌊2.5·f⌋ + ⌊1.25·f⌋ + ⌊14.4·t_2h + 1.5·b⌋
 * weapons.json carries the wiki's tier part of every weapon (9.6·t main hand, 4.8·t off-hand = half of its 9.6·t_oh, 14.4·t
 * two-handed; defenders count as half their tier, hatchets and the like less). So b counts 1.5× with a two-hander or dual
 * wield and 1× with a main hand + shield; a shield adds no damage. Weapon speed does not enter the ability damage (only the
 * auto-attack "damage" stat). `capTier`: Ranged uses min(t, ammunition tier) – the weapon part is capped at that tier
 * (Magic's min(t, spell tier) is not modelled: no autocast spell is chosen in the loadout).
 */
export function abilityDamageOf(main: Weapon | null, off: Weapon | null, two: Weapon | null, level = 99, bonus = 0, capTier?: number): number {
  const lp = levelPart(level);
  const part = (w: Weapon, perTier: number): number => {
    const ad = w.abilityDamage ?? 0;
    return capTier !== undefined && capTier < w.tierDamage ? Math.min(ad, perTier * capTier) : ad;
  };
  if (two) return lp + Math.floor(1.25 * levelCurve(level)) + Math.floor(part(two, 14.4) + 1.5 * bonus + 1e-9);
  let ad = 0;
  if (main) ad += lp + Math.floor(part(main, 9.6) + bonus + 1e-9);
  if (off && off.slot !== 'shield') ad += Math.floor(0.5 * (lp + Math.floor(2 * part(off, 4.8) + bonus + 1e-9)));
  return ad;
}

/**
 * Power armour damage bonus by slot as a share of the item's damage tier – runescape.wiki/w/Power_armour ("Value by tier"):
 * helmet 25%, body 37.5%, legs 31.25%, gloves / boots 15.625%; jewellery: neck 57.5%, ring 37.5%; truncated to one decimal
 * (tier 90: 22.5 / 33.7 / 28.1 / 14.0 / 14.0 = 112.3). Only the fallback for items whose wiki row has no bonus fields –
 * gear.json carries the wiki's numbers (Vestments of havoc hood 27.5 = damage tier 110 × 25%).
 */
export const POWER_ARMOUR_SHARE: Partial<Record<GearItem['slot'], number>> = { head: 0.25, body: 0.375, legs: 0.3125, hands: 0.15625, feet: 0.15625, neck: 0.575, ring: 0.375 };

/** gear.json / weapons.json `bonus` key of a style */
export const BONUS_KEY: Record<Style4, keyof DamageBonus> = { Melee: 'melee', Ranged: 'ranged', Magic: 'magic', Necromancy: 'necromancy' };

/** damage bonus an item adds to the ability damage of `style`: the wiki's value, else the power armour tier table (tank / hybrid armour without a bonus: 0) */
export function damageBonusOf(item: GearItem, style: Style4): number {
  if (item.bonus) return item.bonus[BONUS_KEY[style]] ?? 0;
  if (!item.type?.includes('Power')) return 0;
  if (item.style && item.style !== 'Hybrid' && item.style !== style) return 0;
  const share = POWER_ARMOUR_SHARE[item.slot];
  return share ? Math.floor((item.damageTier ?? item.tier) * share * 10 + 1e-9) / 10 : 0;
}

/** gear.json id of the amulet of zealots: +10 to the damage boost of single-stat prayers and leech curses */
export const AMULET_OF_ZEALOTS = 'amulet-of-zealots';

/**
 * Critical strike damage by level of the style's damage skill (boosts included) – runescape.wiki/w/Critical_strike: +10% at
 * level 1, +15% at 20, then +5% per 10 levels up to +50% at 90 and no more above (linear in between: 10% + 0.5% per level over 10).
 */
export function critMultiplier(level = 99): number {
  return 1 + Math.min(0.5, Math.max(0.1, 0.1 + 0.005 * (level - 10)));
}

/** maximum life points from Constitution – runescape.wiki/w/Life_points: 100 per level (1,000 at level 10, 9,900 at 99); worn armour adds its life point bonus */
export const LP_PER_CONSTITUTION_LEVEL = 100;
export function baseLifePoints(constitution: number): number {
  return LP_PER_CONSTITUTION_LEVEL * Math.max(10, Math.floor(constitution));
}

/** Fortitude (Seren curse): the maximum rises by 10 plus 10 per Constitution level (1,000 at 99) – runescape.wiki/w/Fortitude */
export const FORTITUDE = 'fortitude';
export function fortitudeLifePoints(constitution: number): number {
  return 10 + 10 * constitution;
}

/**
 * Damage boost of the prayers and curses (prayers.json effect texts; runescape.wiki/w/Turmoil, /Piety, /Ultimate_Strength,
 * /Leech_Melee_Strength …): since the Combat Style Modernisation every one is a percentage of the style's damage, multiplied
 * onto the hits like Berserk / Sunshine (wiki "Ability damage": multiplicative damage buffs – not bleeds / DoTs or conjured
 * spirits). Boosts of one style add up before multiplying (Ultimate Strength 6 + Divine Rage 5 = +11%).
 * Standard book: Burst / Superhuman / Ultimate Strength +2 / +4 / +6% (Unstoppable / Unrelenting / Overpowering Force, Charge /
 * Super-charge / Overcharge, Decay / Hastened / Accelerated Decay likewise), Chivalry +7%, Piety / Rigour / Augury / Sanctity
 * +8%, Divine Rage +5% to all four styles. Curses: Turmoil / Anguish / Torment / Sorrow +10%, Malevolence / Desolation /
 * Affliction / Ruination +12%, Leech … Strength +2% rising to +8% over time; Sap curses drain the target only. The "+10 levels"
 * of the curses count for accuracy and armour, not for the level part of the ability damage.
 * Amulet of zealots: a flat +10 to single-stat prayers and leech curses (Ultimate Strength 16%, Leech 12–18%).
 */
export interface PrayerDamage {
  /** prayers.json id */
  prayer: string;
  style: Style4;
  /** damage boost in % (leech curses: at activation) */
  pct: number;
  /** single-stat prayer / leech curse: the amulet of zealots adds AMULET_OF_ZEALOTS_ADD */
  zealots?: boolean;
  /** leech curses: the boost rises to this over LEECH_RAMP_TICKS */
  max?: number;
}

export const PRAYER_DAMAGE: PrayerDamage[] = [
  // ---- standard prayers: single-stat
  { prayer: 'burst-of-strength', style: 'Melee', pct: 2, zealots: true },
  { prayer: 'superhuman-strength', style: 'Melee', pct: 4, zealots: true },
  { prayer: 'ultimate-strength', style: 'Melee', pct: 6, zealots: true },
  { prayer: 'unstoppable-force', style: 'Ranged', pct: 2, zealots: true },
  { prayer: 'unrelenting-force', style: 'Ranged', pct: 4, zealots: true },
  { prayer: 'overpowering-force', style: 'Ranged', pct: 6, zealots: true },
  { prayer: 'charge', style: 'Magic', pct: 2, zealots: true },
  { prayer: 'super-charge', style: 'Magic', pct: 4, zealots: true },
  { prayer: 'overcharge', style: 'Magic', pct: 6, zealots: true },
  { prayer: 'decay', style: 'Necromancy', pct: 2, zealots: true },
  { prayer: 'hastened-decay', style: 'Necromancy', pct: 4, zealots: true },
  { prayer: 'accelerated-decay', style: 'Necromancy', pct: 6, zealots: true },
  // ---- standard prayers: combined
  { prayer: 'chivalry', style: 'Melee', pct: 7 },
  { prayer: 'piety', style: 'Melee', pct: 8 },
  { prayer: 'rigour', style: 'Ranged', pct: 8 },
  { prayer: 'augury', style: 'Magic', pct: 8 },
  { prayer: 'sanctity', style: 'Necromancy', pct: 8 },
  { prayer: 'divine-rage', style: 'Melee', pct: 5 },
  { prayer: 'divine-rage', style: 'Ranged', pct: 5 },
  { prayer: 'divine-rage', style: 'Magic', pct: 5 },
  { prayer: 'divine-rage', style: 'Necromancy', pct: 5 },
  // ---- ancient curses
  { prayer: 'leech-melee-strength', style: 'Melee', pct: 2, max: 8, zealots: true },
  { prayer: 'leech-ranged-strength', style: 'Ranged', pct: 2, max: 8, zealots: true },
  { prayer: 'leech-magic-strength', style: 'Magic', pct: 2, max: 8, zealots: true },
  { prayer: 'leech-necromancy-strength', style: 'Necromancy', pct: 2, max: 8, zealots: true },
  { prayer: 'turmoil', style: 'Melee', pct: 10 },
  { prayer: 'anguish', style: 'Ranged', pct: 10 },
  { prayer: 'torment', style: 'Magic', pct: 10 },
  { prayer: 'sorrow', style: 'Necromancy', pct: 10 },
  { prayer: 'malevolence', style: 'Melee', pct: 12 },
  { prayer: 'desolation', style: 'Ranged', pct: 12 },
  { prayer: 'affliction', style: 'Magic', pct: 12 },
  { prayer: 'ruination', style: 'Necromancy', pct: 12 },
];

/** leech curses "increasing over time": the wiki gives no timing – assumed to climb 1% at a time, reaching the maximum after 60 s */
export const LEECH_RAMP_TICKS = 100;
export const AMULET_OF_ZEALOTS_ADD = 10;

/** total damage boost in % of the active prayers for a hit of `style`; `ticksActive(prayer)` = ticks since it was switched on (leech ramp) */
export function prayerDamagePct(active: ReadonlySet<string>, style: Style | null | undefined, zealots: boolean, ticksActive: (prayer: string) => number = () => 0): number {
  let pct = 0;
  for (const p of PRAYER_DAMAGE) {
    if (p.style !== style || !active.has(p.prayer)) continue;
    let v = p.pct;
    if (p.max !== undefined) v = Math.min(p.max, p.pct + Math.floor((p.max - p.pct) * Math.max(0, Math.min(1, ticksActive(p.prayer) / LEECH_RAMP_TICKS))));
    if (zealots && p.zealots) v += AMULET_OF_ZEALOTS_ADD;
    pct += v;
  }
  return pct;
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

/** self buffs that multiply one ability type of a style, DoTs included (Blast Infused: magic basics +8%; Icy Precision: ranged enhanced / threshold / ultimate / special +30%) */
export const BUFF_TYPE_DAMAGE_MULT: { buff: string; style: Style; type: string; mult: number }[] = [
  { buff: 'blast-infused', style: 'Magic', type: 'Basic', mult: 1.08 },
  { buff: 'icy-precision', style: 'Ranged', type: 'Enhanced', mult: 1.3 },
  { buff: 'icy-precision', style: 'Ranged', type: 'Threshold', mult: 1.3 },
  { buff: 'icy-precision', style: 'Ranged', type: 'Ultimate', mult: 1.3 },
  { buff: 'icy-precision', style: 'Ranged', type: 'Special', mult: 1.3 },
];

/**
 * Target debuffs that raise the damage it takes (dotsOnly: bleed / burn hits only – Corrupted Wounds). Entries with the same
 * `status` are one in-game status and count once: the Vulnerability spell and the vulnerability bomb both apply the
 * `vulnerability` buff ("Uses stacks: No" – a second application refreshes, https://runescape.wiki/w/Vulnerability_(status)).
 */
export const TARGET_DAMAGE_MULT: { buff: string; mult: number; dotsOnly?: boolean; status?: string }[] = [
  { buff: 'vulnerability', mult: 1.1, status: 'vulnerability' }, // spell (standard spellbook) and bomb (rules-consumables.ts)
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

import { Ability, Perk, Prayer, SetEffect, Weapon, WeaponSpec } from './models';
import { Entity } from './data.service';

/**
 * "Obscure" = practically never used in current PvM. The wiki data files contain everything the game
 * has (1900+ weapons, all 90 prayers, skilling abilities …); these predicates drive the
 * "hide obscure …" checkboxes so the pickers show what people actually put on their bars.
 * Heuristics, not truth – the checkbox can always be turned off.
 */

// ---------------------------------------------------------------- weapons

/** Daemonheim (Dungeoneering) gear sits at tier 98–100; nothing usable on the surface is above 95. */
const MAX_SURFACE_TIER = 95;
/** Below this, weapons only matter for early-game accounts; spec weapons of this tier are historic. */
const MIN_WEAPON_TIER = 60;
const TOOL_RE = /\b(hatchet|pickaxe|harpoon)\b/i;
/** Ornament / cosmetic / duplicate variants. */
const VARIANT_PREFIX_RE = /^(golden|lucky)\s/i;
/** Intermediate smithing upgrades ("Bane longsword + 3"); the base and the + 5 stay. */
const UPGRADE_STEP_RE = /\+\s?[1-4]$/;
/** Parenthesised variants are recolours, minigame copies or old versions – except these. */
const OK_PAREN_RE = /\((tier \d+|melee|ranged|magic)\)$/i;
const PAREN_RE = /\(/;

export function isObscureWeapon(w: Weapon): boolean {
  if (w.tier > MAX_SURFACE_TIER) return true;
  if (w.tier < MIN_WEAPON_TIER) return true;
  const n = w.name;
  if (TOOL_RE.test(n)) return true;
  if (VARIANT_PREFIX_RE.test(n)) return true;
  if (UPGRADE_STEP_RE.test(n)) return true;
  if (PAREN_RE.test(n) && !OK_PAREN_RE.test(n)) return true;
  return false;
}

/** A special attack is obscure when every weapon that has it is. */
export function isObscureSpec(s: WeaponSpec, weaponById: Map<string, Weapon>): boolean {
  const weapons = s.weaponIds.map((id) => weaponById.get(id)).filter((w): w is Weapon => !!w);
  if (!weapons.length) return false;
  return weapons.every(isObscureWeapon);
}

// ---------------------------------------------------------------- armour, items, perks

/** Set effects nobody brings to a boss anymore. */
const OBSCURE_SETS = new Set(['warpriest-armadyl-bandos', 'warpriest-tuska', 'void-knight']);

export function isObscureSetEffect(s: SetEffect): boolean {
  return OBSCURE_SETS.has(s.id);
}

/** Skilling / cosmetic / utility perks have class "none" in perks.json. */
export function isObscurePerk(p: Perk): boolean {
  return p.class === 'none';
}

// ---------------------------------------------------------------- abilities

/** Slayer passives, self-healing ultimates nobody uses, skilling abilities, PvP-only stuff. */
const OBSCURE_ABILITIES = new Set([
  'demon-slayer',
  'dragon-slayer',
  'undead-slayer',
  'kuradal-s-favour',
  'slayer-s-insight',
  'siphon',
  'golden-touch',
  'transfigure',
  'guthix-s-blessing',
  'ice-asylum',
  'revenge',
  'rejuvenate',
]);

export function isObscureAbility(a: Ability): boolean {
  return OBSCURE_ABILITIES.has(a.id);
}

// ---------------------------------------------------------------- prayers

/** Standard book: everything below Protect from Magic (37) is a small stat boost or a skilling prayer. */
const MIN_STANDARD_PRAYER_LEVEL = 36;
/** Curses: the Sap curses (50–61) and Berserker are PvP / niche. */
const MIN_CURSE_LEVEL = 62;
const OBSCURE_PRAYERS = new Set([
  // standard
  'smite',
  // curses
  'deflect-summoning',
  'leech-run-energy',
  'leech-adrenaline',
  'chronicle-attraction',
  'soul-link',
  'teamwork-protection',
  'wrath',
  'superheat-form',
]);
const LEECH_RE = /^leech-/;

export function isObscurePrayer(p: Prayer): boolean {
  if (OBSCURE_PRAYERS.has(p.id)) return true;
  if (p.book === 'Prayers') return p.level < MIN_STANDARD_PRAYER_LEVEL;
  return p.level < MIN_CURSE_LEVEL || LEECH_RE.test(p.id);
}

// ---------------------------------------------------------------- catalog entities

/** For catalogs (action bars, rotations): abilities, prayers and weapons; specials, specs and actions never hide. */
export function isObscureEntity(e: Entity, weaponById: Map<string, Weapon>): boolean {
  if (e.ability) return isObscureAbility(e.ability);
  if (e.prayer) return isObscurePrayer(e.prayer);
  if (e.weapon) return isObscureWeapon(e.weapon);
  if (e.spec) return isObscureSpec(e.spec, weaponById);
  return false;
}

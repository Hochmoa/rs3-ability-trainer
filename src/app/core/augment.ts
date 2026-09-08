/**
 * Which items are augmented and what they can hold.
 *
 * In the trainer an item that can be augmented always is (Martin, 2026-09-08). Nobody takes a tier 90 weapon to a
 * boss unaugmented, and the alternative would be a switch that every player has to flip on every item.
 *
 * The rules come from runescape.wiki/w/Augmentation (read 2026-09-08): weapons, shields, torso and leg armour of
 * tier 70 and above can be augmented, and each augmented item carries a fixed set of gizmos:
 *
 *   main hand or off hand   1 weapon gizmo    "can hold 1 gizmo, allowing up to 2 perks"
 *   two-handed weapon       2 weapon gizmos   "can hold 2 gizmos, allowing up to 4 perks (2 perks each)"
 *   shieldbow               1 weapon + 1 armour gizmo
 *   shield or defender      1 armour gizmo    "Augmented shields can take one armour gizmo."
 *   torso, legs             2 armour gizmos   "can hold two gizmos, allowing up to four perks (two on each)"
 *
 * Head, hands, feet, cape, jewellery and ammunition cannot be augmented at all, so they hold nothing.
 *
 * gear.json's `augmentable` flag only marks the pieces the fetcher found an "Augmented …" wiki page for, and it
 * misses obvious ones (Masterwork ranged body). The tier rule decides instead; the flag only ever adds.
 */
import { GearItem, Weapon } from './models';

export type GizmoType = 'weapon' | 'armour';

/** the tier from which the game allows augmentation */
export const AUGMENT_MIN_TIER = 70;

/** The gizmos a weapon carries once it is augmented, in the order the Gizmos dialog shows them. */
export function weaponGizmos(w: Pick<Weapon, 'slot' | 'tier' | 'type'>): GizmoType[] {
  if (w.tier < AUGMENT_MIN_TIER) return [];
  if (w.slot === 'shield' || w.type === 'Defender') return ['armour'];
  if (w.type === 'Shieldbow') return ['weapon', 'armour'];
  if (w.slot === '2h') return ['weapon', 'weapon'];
  return ['weapon'];
}

/** The gizmos an armour piece carries: torso and legs only, two armour gizmos each. */
export function gearGizmos(g: Pick<GearItem, 'slot' | 'tier' | 'augmentable'>): GizmoType[] {
  if (g.slot !== 'body' && g.slot !== 'legs') return [];
  return g.tier >= AUGMENT_MIN_TIER || g.augmentable ? ['armour', 'armour'] : [];
}

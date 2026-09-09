/**
 * Whether the weapons a loadout carries (worn or in the backpack) can meet an ability's equipment requirement
 * once the right ones are wielded. The Train page warns before a session about steps the loadout "cannot perform";
 * a switch in the backpack makes such a step playable, so it is no reason to warn (Martin, 9 Sep 2026).
 *
 * The rules mirror engine/loadout-resolver.ts for the worn case: dual wield = a main hand with an off-hand weapon
 * (not a shield), a defender counts as an off-hand weapon there too; a conduit needs a siphon in the main hand.
 */
import { Weapon } from './models';

/** the `equipment` values of engine/rules-model Requirement */
export type EquipmentNeed = '2h' | 'dw' | 'shield' | 'defender-or-shield' | 'conduit' | 'spec-weapon' | 'eof';

export function weaponsCanMeet(need: EquipmentNeed | string, weapons: readonly Weapon[]): boolean {
  const mains = weapons.filter((w) => w.slot === 'main');
  const offs = weapons.filter((w) => w.slot === 'off');
  const shields = weapons.filter((w) => w.slot === 'shield');
  switch (need) {
    case '2h': return weapons.some((w) => w.slot === '2h');
    case 'dw': return mains.length > 0 && offs.length > 0;
    case 'shield': return shields.length > 0;
    case 'defender-or-shield': return shields.length > 0 || offs.some((w) => w.role === 'defender');
    case 'conduit': return mains.some((w) => w.role === 'siphon') && offs.some((w) => w.role === 'conduit');
    case 'spec-weapon': return weapons.some((w) => !!w.spec);
    default: return true; // 'eof' and anything unknown: not about the weapons carried
  }
}

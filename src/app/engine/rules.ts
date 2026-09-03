/** Index of all interaction rules. */
import { BUFFS, BUFF_BY_ID } from './rules-buffs';
import { DEFCON_RULES } from './rules-defcon';
import { GLOBAL_RULES } from './rules-global';
import { MAGIC_RULES } from './rules-magic';
import { MELEE_RULES } from './rules-melee';
import { AbilityRule, GlobalRule } from './rules-model';
import { NECROMANCY_RULES } from './rules-necromancy';
import { RANGED_RULES } from './rules-ranged';

export const ABILITY_RULES: AbilityRule[] = [...MELEE_RULES, ...RANGED_RULES, ...MAGIC_RULES, ...NECROMANCY_RULES, ...DEFCON_RULES];
export const RULE_BY_ABILITY = new Map(ABILITY_RULES.map((r) => [r.ability, r]));
export const GLOBALS: GlobalRule[] = GLOBAL_RULES;
export { BUFFS, BUFF_BY_ID };

export function ruleFor(abilityId: string): AbilityRule | undefined {
  return RULE_BY_ABILITY.get(abilityId);
}

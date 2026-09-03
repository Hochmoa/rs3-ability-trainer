/** Index of all interaction rules. */
import { BUFFS, BUFF_BY_ID } from './rules-buffs';
import { DEFCON_RULES } from './rules-defcon';
import { GLOBAL_RULES } from './rules-global';
import { MAGIC_RULES } from './rules-magic';
import { MELEE_RULES } from './rules-melee';
import { AbilityRule, BuffDef, GlobalRule, StackId } from './rules-model';
import { NECROMANCY_RULES } from './rules-necromancy';
import { RANGED_RULES } from './rules-ranged';

export const ABILITY_RULES: AbilityRule[] = [...MELEE_RULES, ...RANGED_RULES, ...MAGIC_RULES, ...NECROMANCY_RULES, ...DEFCON_RULES];
export const RULE_BY_ABILITY = new Map(ABILITY_RULES.map((r) => [r.ability, r]));
export const GLOBALS: GlobalRule[] = GLOBAL_RULES;
export { BUFFS, BUFF_BY_ID };

export function ruleFor(abilityId: string): AbilityRule | undefined {
  return RULE_BY_ABILITY.get(abilityId);
}

/** definitions of the stacking buffs (Bloodlust, Necrosis ...), keyed by id */
export const STACK_DEFS = Object.fromEntries(BUFFS.filter((b) => b.stacks).map((b) => [b.id, b])) as Record<StackId, BuffDef>;

export function stackName(id: StackId): string {
  return STACK_DEFS[id]?.name ?? id;
}

/** cap of a stack: loadout override (Soulbound lantern) else the definition's max */
export function stackMax(id: StackId, caps?: Partial<Record<StackId, number>>): number {
  return caps?.[id] ?? STACK_DEFS[id]?.stacks?.max ?? Infinity;
}

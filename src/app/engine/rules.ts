/** Index of all interaction rules. */
import { Spellbook } from '../core/models';
import { BUFFS as BASE_BUFFS } from './rules-buffs';
import { DEFCON_RULES } from './rules-defcon';
import { FAMILIAR_BUFFS, SCROLL_RULES, scrollRuleFor } from './rules-familiars';
import { GLOBAL_RULES } from './rules-global';
import { MAGIC_RULES } from './rules-magic';
import { MELEE_RULES } from './rules-melee';
import { AbilityRule, BuffDef, GlobalRule, StackId } from './rules-model';
import { NECROMANCY_BUFFS, NECROMANCY_RULES } from './rules-necromancy';
import { RANGED_RULES } from './rules-ranged';
import { SPELL_BUFFS, SPELL_RULES } from './rules-spells';
import { SPEC_RULES } from './rules-specs';
import { ACTION_RULES, CONSUMABLE_BUFFS, SPECIAL_RULES } from './rules-consumables';

export const ABILITY_RULES: AbilityRule[] = [...MELEE_RULES, ...RANGED_RULES, ...MAGIC_RULES, ...NECROMANCY_RULES, ...DEFCON_RULES];
const RULE_BY_ABILITY = new Map(ABILITY_RULES.map((r) => [r.ability, r]));
/** weapon special attacks: `ability` is the specs.json id (rules-specs.ts) */
const SPEC_RULE_BY_ID = new Map(SPEC_RULES.map((r) => [r.ability, r]));
export const GLOBALS: GlobalRule[] = GLOBAL_RULES;
/** every status effect the rules know: the shared list plus the ones defined next to their rules */
export const BUFFS: BuffDef[] = [...BASE_BUFFS, ...NECROMANCY_BUFFS, ...SPELL_BUFFS, ...CONSUMABLE_BUFFS, ...FAMILIAR_BUFFS];
export const BUFF_BY_ID = new Map(BUFFS.map((b) => [b.id, b]));
/** spell rules ("spell:<id>" entities), keyed by spell id – kept apart from the ability rules */
const RULE_BY_SPELL = new Map(SPELL_RULES.map((r) => [r.ability, r]));
/** potions / bombs / devices ("special:<id>", specials.json id) and client actions ("action:<id>") – rules-consumables.ts */
const RULE_BY_SPECIAL = new Map(SPECIAL_RULES.map((r) => [r.ability, r]));
const RULE_BY_ACTION = new Map(ACTION_RULES.map((r) => [r.ability, r]));
export { SPELL_RULES };
export { SPEC_RULES };
export { SPECIAL_RULES, ACTION_RULES };
/** familiar scroll rules ("special:<scroll id>" entities of kind scroll), keyed by scroll id */
export { SCROLL_RULES, scrollRuleFor };

export function ruleFor(abilityId: string): AbilityRule | undefined {
  return RULE_BY_ABILITY.get(abilityId);
}

export function specialRuleFor(specialId: string): AbilityRule | undefined {
  return RULE_BY_SPECIAL.get(specialId);
}

export function actionRuleFor(actionId: string): AbilityRule | undefined {
  return RULE_BY_ACTION.get(actionId);
}

export function spellRuleFor(spellId: string): AbilityRule | undefined {
  return RULE_BY_SPELL.get(spellId);
}

/** spellbook a spell belongs to (from its rule's requirement); null when unknown */
export function spellBookOf(spellId: string): Spellbook | null {
  return RULE_BY_SPELL.get(spellId)?.requires?.find((q) => q.spellbook)?.spellbook ?? null;
}

export function specRuleFor(specId: string): AbilityRule | undefined {
  return SPEC_RULE_BY_ID.get(specId);
}

/** wiki buff ids the rules model themselves – the raw wiki buff link of an ability must not add a second icon */
export const MODELLED_WIKI_BUFFS = new Set(BUFFS.map((b) => b.wikiId).filter((id): id is number => id !== undefined));

/** definitions of the stacking buffs (Bloodlust, Necrosis ...), keyed by id */
export const STACK_DEFS = Object.fromEntries(BUFFS.filter((b) => b.stacks).map((b) => [b.id, b])) as Record<StackId, BuffDef>;

export function stackName(id: StackId): string {
  return STACK_DEFS[id]?.name ?? id;
}

/** cap of a stack: loadout override (Soulbound lantern) else the definition's max */
export function stackMax(id: StackId, caps?: Partial<Record<StackId, number>>): number {
  return caps?.[id] ?? STACK_DEFS[id]?.stacks?.max ?? Infinity;
}

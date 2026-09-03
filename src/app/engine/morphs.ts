/**
 * Abilities whose action-bar slot turns into another ability while a state holds, like in game:
 * Conjure X → Command X while the spirit is alive, Dismember → Slaughter → Massacre within the window.
 * Spectral Scythe stays one ability with three casts (stages) – see AbilityRule.stages.
 * Derived from the rules, so the engine never knows an ability by name.
 */
import { ABILITY_RULES } from './rules';
import { AbilityRule } from './rules-model';

/** morph target ability id → the ability whose slot shows it */
export const MORPH_SOURCE = new Map<string, string>();
/** slot ability id → abilities its slot can turn into */
export const MORPH_TARGETS = new Map<string, string[]>();

function link(source: string, target: string): void {
  if (source === target) return;
  MORPH_SOURCE.set(target, source);
  MORPH_TARGETS.set(source, [...(MORPH_TARGETS.get(source) ?? []), target]);
}

const bySequence = new Map<string, AbilityRule[]>();
for (const r of ABILITY_RULES) {
  if (r.sequence) bySequence.set(r.sequence.group, [...(bySequence.get(r.sequence.group) ?? []), r]);
  const conjures = (r.onCast ?? []).filter((e) => e.kind === 'conjure');
  if (conjures.length === 1 && r.ability.startsWith('conjure-')) link(r.ability, 'command-' + conjures[0].spirit);
}
for (const rules of bySequence.values()) {
  const first = rules.find((r) => r.sequence!.step === 1);
  if (!first) continue;
  for (const r of rules) if (r !== first) link(first.ability, r.ability);
}

/** Ability ids a bar slot with `abilityId` can fire (itself first). */
export function slotAbilities(abilityId: string): string[] {
  return [abilityId, ...(MORPH_TARGETS.get(abilityId) ?? [])];
}

/** The slot ability that shows `abilityId` when it is a morph target, else null. */
export function morphSourceOf(abilityId: string): string | null {
  return MORPH_SOURCE.get(abilityId) ?? null;
}

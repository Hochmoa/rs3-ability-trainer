/**
 * What a rotation assumes but never does itself.
 *
 * PvME writes fight rotations as they are played: "command skeleton warrior" with no conjure in front of it,
 * because the conjures happen in the pre-build before the boss is pulled. The same holds for a Residual Souls
 * cost, for the second half of a Dismember chain, and for every buff a phase carries over from the one before.
 * This walks the steps in order, asks the engine rules what each one needs (`AbilityRule.requires`) and what the
 * earlier steps produce (`onCast` / `onHit` effects), and reports what is left over – so the editor can warn and
 * the Train page can offer to put it into the pre-build.
 *
 * Only the requirements a rotation can establish are checked. Weapon, spellbook and adrenaline requirements are
 * loadout questions and are answered elsewhere (the Train page's equipment warnings).
 */
import { AbilityRule, Effect } from '../engine/rules-model';
import { actionRuleFor, ruleFor, scrollRuleFor, specRuleFor, specialRuleFor, spellRuleFor } from '../engine/rules';
import { Prebuild, RotationStep } from './models';

/** what the pre-build would have to hold for the step to work */
export type AssumptionFix = { kind: 'spirit'; spirit: string } | { kind: 'stacks'; stack: string; min: number };

export interface RotationAssumption {
  /** index of the step that needs it */
  step: number;
  /** ability id of that step */
  id: string;
  /** the rule's own wording: "needs an active Skeleton Warrior (6 ticks after the conjure)" */
  text: string;
  fix?: AssumptionFix;
  /** the ability that would establish it inside the rotation, when there is exactly one ("conjure-skeleton-warrior") */
  from?: string;
}

/** everything the steps before the current one have brought about */
interface Produced {
  spirits: Set<string>;
  buffs: Set<string>;
  stacks: Set<string>;
  /** "dismember:2" – the sequence step this cast opened */
  sequences: Set<string>;
}

/** the ability that conjures a spirit; Conjure Undead Army brings out all three at once */
const CONJURE_OF: Record<string, string> = {
  'skeleton-warrior': 'conjure-skeleton-warrior',
  'putrid-zombie': 'conjure-putrid-zombie',
  'vengeful-ghost': 'conjure-vengeful-ghost',
  'phantom-guardian': 'conjure-phantom-guardian',
};

/** the first cast of a chain that lives in one action bar slot (Dismember → Slaughter → Destroy, Spectral Scythe) */
const SEQUENCE_START: Record<string, string[]> = {
  dismember: ['dismember', 'slaughter', 'destroy'],
  'spectral-scythe': ['spectral-scythe'],
};

/** walks an effect list, `choose` and `consume-stack.then` included, and notes what it brings about */
function collect(effects: Effect[] | undefined, into: Produced): void {
  for (const e of effects ?? []) {
    switch (e.kind) {
      case 'conjure':
        into.spirits.add(e.spirit);
        break;
      case 'dismiss':
        into.spirits.delete(e.spirit);
        break;
      case 'buff':
      case 'toggle-buff':
        into.buffs.add(e.id);
        break;
      case 'extend-buff':
        into.buffs.add(e.buff);
        break;
      case 'stack':
      case 'stack-set':
        into.stacks.add(e.stack);
        break;
      case 'sequence-open':
        into.sequences.add(e.group + ':' + e.step);
        break;
      case 'choose':
        collect(e.then, into);
        collect(e.otherwise, into);
        break;
      case 'consume-stack':
        collect(e.then, into);
        break;
      default:
        break;
    }
  }
}

/** the rule of a step, whatever kind it is – a weapon special or a bomb produces stacks and buffs just like an ability */
function ruleOfStep(step: RotationStep): AbilityRule | undefined {
  switch (step.kind) {
    case 'ability':
      return ruleFor(step.id);
    case 'spec':
      return specRuleFor(step.id);
    case 'spell':
      return spellRuleFor(step.id);
    case 'special':
      return specialRuleFor(step.id) ?? scrollRuleFor(step.id);
    case 'action':
      return actionRuleFor(step.id);
    default:
      return undefined;
  }
}

/** what this rule brings about for the steps after it */
function produce(rule: AbilityRule | undefined, into: Produced): void {
  if (!rule) return;
  collect(rule.onCast, into);
  collect(rule.onHit, into);
  if (rule.sequence) into.sequences.add(rule.sequence.group + ':' + rule.sequence.step);
}

/** the buffs an ability grants (a pre-built Split Soul means the split-soul buff is up) */
function buffsOf(rule: AbilityRule | undefined): string[] {
  const into: Produced = { spirits: new Set(), buffs: new Set(), stacks: new Set(), sequences: new Set() };
  produce(rule, into);
  return [...into.buffs];
}

function fromPrebuild(pb: Prebuild | undefined): Produced {
  return {
    spirits: new Set(pb?.spirits ?? []),
    buffs: new Set([...(pb?.abilities ?? []), ...(pb?.abilities ?? []).flatMap((id) => buffsOf(ruleFor(id)))]),
    stacks: new Set(Object.entries(pb?.stacks ?? {}).filter(([, n]) => n > 0).map(([id]) => id)),
    sequences: new Set<string>(),
  };
}

/**
 * The requirements the rotation never establishes, in step order. `prebuild` is what the session starts with
 * (the Train page passes it, the editor has none), `stacksOf` the count a stack is pre-built with.
 */
export function rotationAssumptions(steps: RotationStep[], prebuild?: Prebuild): RotationAssumption[] {
  const have = fromPrebuild(prebuild);
  const stacks = prebuild?.stacks ?? {};
  const out: RotationAssumption[] = [];
  const seen = new Set<string>();
  const add = (a: RotationAssumption) => {
    const key = a.id + '|' + a.text;
    if (seen.has(key)) return; // a rotation that commands the same spirit five times says it once
    seen.add(key);
    out.push(a);
  };
  steps.forEach((step, i) => {
    if (step.kind === 'note') return;
    const rule = ruleOfStep(step);
    for (const req of rule?.requires ?? []) {
      if (req.spirit) {
        if (have.spirits.has(req.spirit)) continue;
        add({ step: i, id: step.id, text: req.text, fix: { kind: 'spirit', spirit: req.spirit }, from: CONJURE_OF[req.spirit] });
      } else if (req.anySpirit) {
        if (have.spirits.size) continue;
        add({ step: i, id: step.id, text: req.text, fix: { kind: 'spirit', spirit: 'skeleton-warrior' }, from: 'conjure-undead-army' });
      } else if (req.stackMin) {
        const { stack, min } = req.stackMin;
        if (have.stacks.has(stack) && (stacks[stack] ?? Infinity) >= min) continue;
        add({ step: i, id: step.id, text: req.text, fix: { kind: 'stacks', stack, min } });
      } else if (req.sequence) {
        const before = req.sequence.group + ':' + (req.sequence.step - 1);
        if (have.sequences.has(before)) continue;
        const chain = SEQUENCE_START[req.sequence.group];
        add({ step: i, id: step.id, text: req.text, from: chain?.[req.sequence.step - 2] });
      } else if (req.buff) {
        // the pre-build takes abilities, not buff ids: this one is only reported
        if (have.buffs.has(req.buff)) continue;
        add({ step: i, id: step.id, text: req.text });
      }
    }
    produce(rule, have);
  });
  return out;
}

/** The pre-build that would satisfy the assumptions, merged into `base`. */
export function prebuildFor(base: Prebuild, assumptions: RotationAssumption[], capOf: (stack: string) => number): Prebuild {
  const spirits = [...base.spirits];
  const abilities = [...base.abilities];
  const stacks = { ...base.stacks };
  for (const a of assumptions) {
    if (!a.fix) continue;
    if (a.fix.kind === 'spirit' && !spirits.includes(a.fix.spirit)) spirits.push(a.fix.spirit);
    if (a.fix.kind === 'stacks') {
      const cap = capOf(a.fix.stack);
      stacks[a.fix.stack] = Math.min(cap, Math.max(stacks[a.fix.stack] ?? 0, a.fix.min));
    }
  }
  return { ...base, spirits, abilities, stacks };
}

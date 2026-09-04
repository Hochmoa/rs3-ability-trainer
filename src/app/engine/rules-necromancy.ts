/** Necromancy ability interactions – docs/research/necromancy.md */
import { AbilityRule, BuffDef, Effect } from './rules-model';

const W = 'https://runescape.wiki/w/';

/** the trainer assumes level 99 in every combat skill (engine/damage.ts); the bone shields scale with the Necromancy level */
export const NECROMANCY_LEVEL = 99;
/** Zemouregal's nexus passive Fortified Bones: +15 levels on the Bone Shield */
export const FORTIFIED_BONES_BONUS = 15;

/** Bone shield tier for a share of the Necromancy level (Lesser 25%, Greater 50%) at the trainer's level, plus the nexus bonus. */
export function boneShieldTier(share: number, bonus = 0): number {
  return Math.floor(share * NECROMANCY_LEVEL) + bonus;
}

const BONE_SHIELD_TEXT = ' Enables the non-offensive shield abilities (Resonance, Divert, Preparation, Reflect, Debilitate, Immortality, Rejuvenate, Barricade) at the cost of necromancy runes – not Bash or Revenge. Toggle without a timer; the two bone shields replace each other.';

/** status effects of the necromancy rules that are not in rules-buffs.ts (docs/research/necromancy.md § bone shields) */
export const NECROMANCY_BUFFS: BuffDef[] = [
  { id: 'lesser-bone-shield', name: 'Lesser Bone Shield', kind: 'Buff', on: 'self', durationTicks: null, untilConsumed: true, shieldTierShare: 0.25, icon: 'assets/abilities/lesser-bone-shield.png',
    text: 'Counts as a shield of tier ⌊25% × Necromancy level⌋ – ' + boneShieldTier(0.25) + ' at level 99, +15 with Zemouregal\'s nexus.' + BONE_SHIELD_TEXT, source: W + 'Lesser_Bone_Shield' },
  { id: 'greater-bone-shield', name: 'Greater Bone Shield', kind: 'Buff', on: 'self', durationTicks: null, untilConsumed: true, shieldTierShare: 0.5, icon: 'assets/abilities/greater-bone-shield.png',
    text: 'Counts as a shield of tier ⌊50% × Necromancy level⌋ – ' + boneShieldTier(0.5) + ' at level 99, +15 with Zemouregal\'s nexus.' + BONE_SHIELD_TEXT, source: W + 'Greater_Bone_Shield' },
];

/** base conjure lifetime in ticks (42 s); Spirit Pact and Robes of the First Necromancer are applied by the loadout */
export const CONJURE_BASE_TICKS = 70;
/** a spirit can be commanded 6 ticks after the conjure cast */
export const COMMAND_READY_AFTER = 6;

/** Omni guard: for 30 s after Death Essence, Touch of Death / Finger of Death / Death Skulls ready Death Spark at once */
const READY_DEATH_SPARK: Effect = { kind: 'stack-set', stack: 'death-spark', amount: 5, when: { item: 'omni-guard', buff: 'death-essence' } };
const DEATH_ESSENCE_NOTE = 'Omni guard: for 30 s after Death Essence this ability readies Death Spark at once (' + W + 'Death_Spark_(status) )';
/** Devourer's Guard: for 30 s after Soul Crush, Soul Sap / Soul Strike / Volley of Souls / Spectral Scythe ready Soul Reave at once */
const READY_SOUL_REAVE: Effect = { kind: 'stack-set', stack: 'soul-reave', amount: 4, when: { item: 'devourer-s-guard', buff: 'soul-crush' } };
const SOUL_CRUSH_NOTE = "Devourer's Guard: for 30 s after Soul Crush this ability readies Soul Reave at once (" + W + 'Soul_Reave )';

function conjure(spirit: string, name: string, extra: string[] = []): AbilityRule {
  return {
    ability: 'conjure-' + spirit,
    requires: [{ text: 'needs a siphon and a conduit (necromancy main hand + off-hand)', equipment: 'conduit' }],
    notes: [
      name + ' lasts 42 s base (+6/12/18 s with Spirit Pact I/II/III, +20/25% with 4/5 Robes of the First Necromancer); the slot shows Command ' + name + ' while it is alive (' + W + 'Conjure_' + name.replace(/ /g, '_') + ' )',
      'Command ' + name + ' is first available 6 ticks after the conjure; unequipping the conduit dismisses every spirit (' + W + 'Conjuration )',
      ...extra,
    ],
    onCast: [{ kind: 'conjure', spirit, durationTicks: CONJURE_BASE_TICKS }],
  };
}

export const NECROMANCY_RULES: AbilityRule[] = [
  {
    ability: 'necromancy',
    hits: [0],
    notes: [
      'Basic attack: +9% adrenaline; under Living Death it also grants 2 Necrosis (' + W + 'Necromancy_(ability) )',
      'Omni guard: every basic attack adds a Death Spark stack; at 5 the next basic attack deals double damage and spends them (' + W + 'Death_Spark_(status) )',
      "Devourer's Guard: every basic attack adds a Soul Reave stack; at 4 the next basic attack grants a Residual Soul and spends them (" + W + 'Soul_Reave )',
    ],
    damageRules: [{ when: { flag: 'death-spark' }, mult: 2 }],
    onCast: [
      { kind: 'stack', stack: 'necrosis', amount: 2, when: { buff: 'living-death' } },
      {
        kind: 'choose',
        when: { item: 'omni-guard', stackMin: { stack: 'death-spark', min: 5 } },
        then: [{ kind: 'stack-set', stack: 'death-spark', amount: 0 }, { kind: 'flag', flag: 'death-spark', value: true }],
        otherwise: [{ kind: 'stack', stack: 'death-spark', amount: 1, when: { item: 'omni-guard' } }],
      },
      {
        kind: 'choose',
        when: { item: 'devourer-s-guard', stackMin: { stack: 'soul-reave', min: 4 } },
        then: [{ kind: 'stack-set', stack: 'soul-reave', amount: 0 }, { kind: 'flag', flag: 'soul-reave', value: true }],
        otherwise: [{ kind: 'stack', stack: 'soul-reave', amount: 1, when: { item: 'devourer-s-guard' } }],
      },
    ],
    onHit: [{ kind: 'stack', stack: 'residual-souls', amount: 1, when: { flag: 'soul-reave' } }],
  },
  {
    ability: 'touch-of-death',
    notes: ['Grants 4 Necrosis (cap 12) (' + W + 'Touch_of_Death )', 'Under Living Death +6% extra adrenaline (9% + 6%) and its cooldown was reset by the Living Death cast (' + W + 'Living_Death )', DEATH_ESSENCE_NOTE],
    onCast: [{ kind: 'stack', stack: 'necrosis', amount: 4 }, { kind: 'adrenaline', amount: 6, when: { buff: 'living-death' } }, READY_DEATH_SPARK],
  },
  {
    ability: 'soul-sap',
    requires: [{ text: 'needs a conduit (necromancy off-hand)', equipment: 'conduit' }],
    notes: ['Needs a conduit. Grants 1 Residual Soul per target hit (cap 3, 5 with the soulbound lantern) (' + W + 'Soul_Sap )', SOUL_CRUSH_NOTE],
    onCast: [READY_SOUL_REAVE],
    onHit: [{ kind: 'stack', stack: 'residual-souls', amount: 1 }],
  },
  {
    ability: 'finger-of-death',
    cost: { perStack: { stack: 'necrosis', per: 10, maxStacks: 6, base: 60 } },
    damageRules: [{ when: { buff: 'living-death' }, mult: 1.5 }],
    notes: ['Costs 60% adrenaline minus 10% per Necrosis stack, consuming up to 6 stacks (free at 6) (' + W + 'Finger_of_Death )', 'Under Living Death 1.5x damage (' + W + 'Living_Death )', DEATH_ESSENCE_NOTE],
    onCast: [READY_DEATH_SPARK],
  },
  conjure('skeleton-warrior', 'Skeleton Warrior'),
  {
    ability: 'command-skeleton-warrior',
    requires: [{ text: 'needs an active Skeleton Warrior (6 ticks after the conjure)', spirit: 'skeleton-warrior', spiritAgeMin: COMMAND_READY_AFTER }],
    hits: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    spiritHit: 'skeleton-warrior',
    notes: ['Requires the skeleton; 25-tick cooldown; "RAAAR!" a tick later, then the skeleton attacks on 10 consecutive ticks (spirit hits: no crit), each hit adds Rage (+3% damage, max 25) (' + W + 'Command_Skeleton_Warrior )'],
  },
  conjure('putrid-zombie', 'Putrid Zombie', ['Conjure Putrid Zombie has a 50-tick cooldown from the cast, which only matters after the zombie exploded early (' + W + 'Conjure_Putrid_Zombie )']),
  {
    ability: 'command-putrid-zombie',
    requires: [{ text: 'needs an active Putrid Zombie (6 ticks after the conjure)', spirit: 'putrid-zombie', spiritAgeMin: COMMAND_READY_AFTER }],
    hits: [4],
    spiritHit: 'putrid-zombie',
    notes: ['The zombie explodes 4 ticks later for 360–440% (spirit damage, no crit) and is removed; re-conjure at the earliest 50 ticks after the conjure (' + W + 'Command_Putrid_Zombie )'],
    onCast: [{ kind: 'dismiss', spirit: 'putrid-zombie', reconjureAfterTicks: 50 }],
  },
  conjure('vengeful-ghost', 'Vengeful Ghost'),
  {
    ability: 'command-vengeful-ghost',
    requires: [
      { text: 'needs an active Vengeful Ghost (6 ticks after the conjure)', spirit: 'vengeful-ghost', spiritAgeMin: COMMAND_READY_AFTER },
      { text: 'the target is already Haunted – wait for the ghost to expire', notBuff: 'haunted' },
    ],
    notes: ['From the next ghost hit on every hit applies Haunted (+10% damage taken, capped) for the rest of the ghost\'s life (' + W + 'Command_Vengeful_Ghost )'],
    onCast: [{ kind: 'buff', id: 'haunted', untilSpirit: 'vengeful-ghost' }],
  },
  conjure('phantom-guardian', 'Phantom Guardian', ['The guardian gains Valour whenever you take a hit (max 25) (' + W + 'Valour )']),
  {
    ability: 'command-phantom-guardian',
    requires: [{ text: 'needs an active Phantom Guardian (6 ticks after the conjure)', spirit: 'phantom-guardian', spiritAgeMin: COMMAND_READY_AFTER }],
    hits: [4],
    spiritHit: 'phantom-guardian',
    damageRules: [{ when: {}, perStackAtCast: { stack: 'valour', mult: 0.2 } }],
    notes: ['15-tick cooldown; hit 4 ticks later of 45–55% × (1 + 0.2 × Valour), consumes all Valour (' + W + 'Command_Phantom_Guardian )'],
    onCast: [{ kind: 'stack-set', stack: 'valour', amount: 0 }],
  },
  {
    ability: 'conjure-undead-army',
    requires: [{ text: 'needs a siphon and a conduit', equipment: 'conduit' }],
    notes: ['Conjures every selected spirit that is not active (skeleton, zombie, ghost; phantom guardian at level 106); unusable if all selected spirits are active (' + W + 'Conjure_Undead_Army )'],
    onCast: [
      { kind: 'conjure', spirit: 'skeleton-warrior', durationTicks: CONJURE_BASE_TICKS },
      { kind: 'conjure', spirit: 'putrid-zombie', durationTicks: CONJURE_BASE_TICKS },
      { kind: 'conjure', spirit: 'vengeful-ghost', durationTicks: CONJURE_BASE_TICKS },
    ],
  },
  {
    ability: 'bloat',
    bleed: { hits: 10, everyTicks: 3, direct: true, factors: Array(10).fill(0.25) },
    notes: ['20% adrenaline: a 135–165% hit, then Bloated – 10 hits of 25% of that hit every 3 ticks; recasting resets it; spreads on death; removed by Freedom (' + W + 'Bloat )'],
    onCast: [{ kind: 'buff', id: 'bloated', refresh: true }],
  },
  {
    ability: 'soul-strike',
    requires: [{ text: 'needs 1 Residual Soul', stackMin: { stack: 'residual-souls', min: 1 } }],
    notes: ['Consumes 1 Residual Soul; stuns and binds the target for 5 ticks (' + W + 'Soul_Strike )', SOUL_CRUSH_NOTE],
    onCast: [{ kind: 'consume-stack', stack: 'residual-souls', amount: 1 }, READY_SOUL_REAVE],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 5 }, { kind: 'buff', id: 'bound', durationTicks: 5 }],
  },
  {
    ability: 'spectral-scythe',
    sequence: { group: 'spectral-scythe', step: 1, windowTicks: 25 },
    stages: [{ cost: 10, damage: { min: 72, max: 88 } }, { cost: 20, damage: { min: 180, max: 220 } }, { cost: 30, damage: { min: 225, max: 275 } }],
    damageRules: [{ when: { flag: 'last-stage' }, perMissingLp: { per: 0.01, max: 1 } }],
    notes: [
      'Three casts in one slot: cast 1 (10%) starts the 25-tick cooldown and opens cast 2 (−20%) for 25 ticks, cast 2 opens cast 3 (−30%); cast 3 or an expired window resets to cast 1 (' + W + 'Spectral_Scythe )',
      'Casts 1 and 2 have a 25% chance per target to grant a Residual Soul; cast 3 deals up to 2x on low-health targets (' + W + 'Spectral_Scythe )',
      SOUL_CRUSH_NOTE,
    ],
    onCast: [READY_SOUL_REAVE],
    onHit: [{ kind: 'stack', stack: 'residual-souls', amount: 1, when: { chance: 0.25, notFlag: 'last-stage' } }],
  },
  {
    ability: 'volley-of-souls',
    hitsPerStack: 'residual-souls',
    requires: [{ text: 'needs 2 Residual Souls', stackMin: { stack: 'residual-souls', min: 2 } }],
    notes: ['Needs at least 2 Residual Souls and consumes all of them: one hit of 135–165% per soul (' + W + 'Volley_of_Souls )', SOUL_CRUSH_NOTE],
    onCast: [{ kind: 'consume-stack', stack: 'residual-souls', amount: 'all' }, READY_SOUL_REAVE],
  },
  {
    ability: 'blood-siphon',
    channel: { ticks: 9, hits: [2, 4, 6, 8, 9], finalAddsPriorShare: 0.7 },
    hitDamage: [{ min: 22, max: 28 }, { min: 22, max: 28 }, { min: 22, max: 28 }, { min: 22, max: 28 }, { min: 117, max: 143 }],
    notes: ['0% adrenaline, 75-tick cooldown, 9-tick channel: 4 AoE hits every 2 ticks healing 70%, then a final hit of 117–143% plus the healed amount; cancelled if the target dies or leaves range (' + W + 'Blood_Siphon )'],
  },
  {
    ability: 'death-skulls',
    hits: [0, 4, 8], // one target: the skull bounces monster → player → monster, so every second bounce lands
    cooldownRules: [{ ticks: 17, when: { buff: 'living-death' } }],
    notes: [
      '60% adrenaline, initial hit plus 4 bounces every 2 ticks (6 with Igneous Kal-Mor / Kal-Zuk) (' + W + 'Death_Skulls )',
      'While Living Death is active the cooldown is 17 ticks instead of 100, and the Living Death cast resets it (' + W + 'Living_Death )',
      DEATH_ESSENCE_NOTE,
    ],
    onCast: [READY_DEATH_SPARK],
  },
  // ---------------------------------------------------------------- incantations (durations from the wiki, Sept 2026)
  {
    ability: 'lesser-bone-shield',
    notes: [
      'Incantation (GCD), toggle: a Bone Shield of level ⌊25% × Necromancy⌋ (' + boneShieldTier(0.25) + ' at 99, +15 with Zemouregal\'s nexus) that lets the non-offensive shield abilities be used without a shield, paid in necromancy runes; Bash and Revenge stay locked (' + W + 'Lesser_Bone_Shield )',
      'Pressing it again or the Greater Bone Shield switches it off; with a real shield equipped no runes are used (' + W + 'Lesser_Bone_Shield )',
    ],
    onCast: [{ kind: 'toggle-buff', id: 'lesser-bone-shield', excludes: ['greater-bone-shield'] }],
  },
  {
    ability: 'greater-bone-shield',
    notes: [
      'Incantation (GCD), toggle: a Bone Shield of level ⌊50% × Necromancy⌋ (' + boneShieldTier(0.5) + ' at 99, +15 with Zemouregal\'s nexus) that lets the non-offensive shield abilities be used without a shield, paid in necromancy runes; Barricade / Debilitate durations scale with that tier; Bash and Revenge stay locked (' + W + 'Greater_Bone_Shield )',
      'Pressing it again or the Lesser Bone Shield switches it off; with a real shield equipped no runes are used (' + W + 'Greater_Bone_Shield )',
    ],
    onCast: [{ kind: 'toggle-buff', id: 'greater-bone-shield', excludes: ['lesser-bone-shield'] }],
  },
  {
    ability: 'invoke-death',
    notes: ['Incantation, 12 s (20 ticks): the next necromancy attack applies Death Mark – the target is executed below 25% life points (' + W + 'Invoke_Death )'],
    onCast: [{ kind: 'buff', id: 'invoke-death' }],
  },
  {
    ability: 'invoke-lord-of-bones',
    notes: ['Incantation, 1 minute (100 ticks): skeletal spirit attacks apply Shattering Bones (' + W + 'Invoke_Lord_of_Bones )'],
    onCast: [{ kind: 'buff', id: 'invoke-lord-of-bones' }],
  },
  {
    ability: 'split-soul',
    notes: ['Incantation, 20.4 s (34 ticks), 60 s cooldown: 400% of the Soul Split heal is dealt as damage instead (' + W + 'Split_Soul )'],
    onCast: [{ kind: 'buff', id: 'split-soul' }],
  },
  {
    ability: 'darkness',
    notes: ['Incantation, 12 minutes (1200 ticks): Aspect of Evasion, 20% chance to avoid damage; one aspect at a time (' + W + 'Darkness )'],
    onCast: [{ kind: 'buff', id: 'darkness' }],
  },
  {
    ability: 'threads-of-fate',
    notes: ['Incantation, 6.6 s (11 ticks), 45 s cooldown: single-target necromancy attacks also hit up to 4 more enemies (' + W + 'Threads_of_Fate )'],
    onCast: [{ kind: 'buff', id: 'threads-of-fate' }],
  },
  {
    ability: 'life-transfer',
    requires: [{ text: 'needs an active conjured spirit', anySpirit: true }],
    notes: ['Incantation, 45 s cooldown: costs 50% of your base life points and extends every active conjured spirit by 21 s (35 ticks) (' + W + 'Life_Transfer )'],
    onCast: [{ kind: 'extend-spirits', ticks: 35 }],
  },
  {
    ability: 'living-death',
    notes: [
      '100% adrenaline, 50 ticks: Death Skulls cooldown 17 ticks, Finger of Death 1.5x, Touch of Death +6% adrenaline, basic attack +2 Necrosis (' + W + 'Living_Death )',
      'On cast the cooldowns of Touch of Death and Death Skulls are reset to 0 (' + W + 'Living_Death )',
    ],
    onCast: [{ kind: 'buff', id: 'living-death' }, { kind: 'cooldown-reset', abilities: ['touch-of-death', 'death-skulls'] }],
  },
];

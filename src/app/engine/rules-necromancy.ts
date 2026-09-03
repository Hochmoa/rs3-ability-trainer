/** Necromancy ability interactions – docs/research/necromancy.md */
import { AbilityRule } from './rules-model';

const W = 'https://runescape.wiki/w/';

/** base conjure lifetime in ticks (42 s); Spirit Pact and Robes of the First Necromancer are applied by the loadout */
export const CONJURE_BASE_TICKS = 70;
/** a spirit can be commanded 6 ticks after the conjure cast */
export const COMMAND_READY_AFTER = 6;

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
    notes: ['Basic attack: +9% adrenaline; under Living Death it also grants 2 Necrosis (' + W + 'Necromancy_(ability) )'],
    onCast: [{ kind: 'stack', stack: 'necrosis', amount: 2, cap: 12, when: { buff: 'living-death' } }],
  },
  {
    ability: 'touch-of-death',
    notes: ['Grants 4 Necrosis (cap 12) (' + W + 'Touch_of_Death )', 'Under Living Death +6% extra adrenaline (9% + 6%) and its cooldown was reset by the Living Death cast (' + W + 'Living_Death )'],
    onCast: [{ kind: 'stack', stack: 'necrosis', amount: 4, cap: 12 }, { kind: 'adrenaline', amount: 6, when: { buff: 'living-death' } }],
  },
  {
    ability: 'soul-sap',
    notes: ['Grants 1 Residual Soul per target hit (cap 3, 5 with the soulbound lantern) (' + W + 'Soul_Sap )'],
    onHit: [{ kind: 'stack', stack: 'residual-souls', amount: 1, cap: 3 }],
  },
  {
    ability: 'finger-of-death',
    cost: { perStack: { stack: 'necrosis', per: 10, maxStacks: 6, base: 60 } },
    notes: ['Costs 60% adrenaline minus 10% per Necrosis stack, consuming up to 6 stacks (free at 6) (' + W + 'Finger_of_Death )', 'Under Living Death 1.5x damage (' + W + 'Living_Death )'],
  },
  conjure('skeleton-warrior', 'Skeleton Warrior'),
  {
    ability: 'command-skeleton-warrior',
    requires: [{ text: 'needs an active Skeleton Warrior (6 ticks after the conjure)', spirit: 'skeleton-warrior', spiritAgeMin: COMMAND_READY_AFTER }],
    hits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    notes: ['Requires the skeleton; 25-tick cooldown; the skeleton attacks on the 10 consecutive ticks after the "RAAAR!" tick, each hit adds Rage (+3% damage, max 25) (' + W + 'Command_Skeleton_Warrior )'],
  },
  conjure('putrid-zombie', 'Putrid Zombie', ['Conjure Putrid Zombie has a 50-tick cooldown from the cast, which only matters after the zombie exploded early (' + W + 'Conjure_Putrid_Zombie )']),
  {
    ability: 'command-putrid-zombie',
    requires: [{ text: 'needs an active Putrid Zombie (6 ticks after the conjure)', spirit: 'putrid-zombie', spiritAgeMin: COMMAND_READY_AFTER }],
    hits: [4],
    notes: ['The zombie explodes 4 ticks later for 360–440% and is removed; re-conjure at the earliest 50 ticks after the conjure (' + W + 'Command_Putrid_Zombie )'],
    onCast: [{ kind: 'dismiss', spirit: 'putrid-zombie', reconjureAfterTicks: 50 }],
  },
  conjure('vengeful-ghost', 'Vengeful Ghost'),
  {
    ability: 'command-vengeful-ghost',
    requires: [{ text: 'needs an active Vengeful Ghost (6 ticks after the conjure)', spirit: 'vengeful-ghost', spiritAgeMin: COMMAND_READY_AFTER }],
    notes: ['From the next ghost hit on every hit applies Haunted (+10% damage taken, capped) for the rest of the ghost\'s life (' + W + 'Command_Vengeful_Ghost )'],
    onCast: [{ kind: 'buff', id: 'haunted', refresh: true }],
  },
  conjure('phantom-guardian', 'Phantom Guardian', ['The guardian gains Valour whenever you take a hit (max 25) (' + W + 'Valour )']),
  {
    ability: 'command-phantom-guardian',
    requires: [{ text: 'needs an active Phantom Guardian (6 ticks after the conjure)', spirit: 'phantom-guardian', spiritAgeMin: COMMAND_READY_AFTER }],
    hits: [4],
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
    notes: ['20% adrenaline; DoT of 10 hits every 3 ticks; recasting resets it; spreads on death; removed by Freedom (' + W + 'Bloat )'],
    onHit: [{ kind: 'buff', id: 'bloated', refresh: true }],
  },
  {
    ability: 'soul-strike',
    requires: [{ text: 'needs 1 Residual Soul', stackMin: { stack: 'residual-souls', min: 1 } }],
    notes: ['Consumes 1 Residual Soul; stuns the target for 1 tick (' + W + 'Soul_Strike )'],
    onCast: [{ kind: 'consume-stack', stack: 'residual-souls', amount: 1 }],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 1 }],
  },
  {
    ability: 'spectral-scythe',
    sequence: { group: 'spectral-scythe', step: 1, windowTicks: 25 },
    notes: [
      'Three casts in one slot: cast 1 (10%) starts the 25-tick cooldown and opens cast 2 (−20%) for 25 ticks, cast 2 opens cast 3 (−30%); cast 3 or an expired window resets to cast 1 (' + W + 'Spectral_Scythe )',
      'Casts 1 and 2 have a 25% chance per target to grant a Residual Soul; cast 3 deals up to 2x on low-health targets (' + W + 'Spectral_Scythe )',
    ],
    onHit: [{ kind: 'stack', stack: 'residual-souls', amount: 1, cap: 3, when: { chance: 0.25 } }],
  },
  {
    ability: 'volley-of-souls',
    requires: [{ text: 'needs 2 Residual Souls', stackMin: { stack: 'residual-souls', min: 2 } }],
    notes: ['Needs at least 2 Residual Souls and consumes all of them: one hit of 135–165% per soul (' + W + 'Volley_of_Souls )'],
    onCast: [{ kind: 'consume-stack', stack: 'residual-souls', amount: 'all' }],
  },
  {
    ability: 'blood-siphon',
    channel: { ticks: 9, hits: [2, 4, 6, 8, 9] },
    notes: ['0% adrenaline, 75-tick cooldown, 9-tick channel: 4 AoE hits every 2 ticks healing 70%, then a final hit of 117–143% plus the healed amount; cancelled if the target dies or leaves range (' + W + 'Blood_Siphon )'],
  },
  {
    ability: 'death-skulls',
    hits: [0, 2, 4, 6, 8],
    cooldownRules: [{ ticks: 17, when: { buff: 'living-death' } }],
    notes: [
      '60% adrenaline, initial hit plus 4 bounces every 2 ticks (6 with Igneous Kal-Mor / Kal-Zuk) (' + W + 'Death_Skulls )',
      'While Living Death is active the cooldown is 17 ticks instead of 100, and the Living Death cast resets it (' + W + 'Living_Death )',
      'Omni guard: readies Death Spark for 30 s after Death Essence (' + W + 'Death_Spark_(status) )',
    ],
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

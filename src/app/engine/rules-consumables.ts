/**
 * Consumables that are pressed in rotations but are neither abilities nor potions with plain adrenaline numbers:
 * powerbursts, bombs and devices from public/data/specials.json ("special:<id>" entities) and the client actions of
 * core/models.ts ACTIONS ("action:<id>"). The always-on consumables (overloads, weapon poison, Kwuarm incense) live in
 * the loadout instead – engine/damage.ts and loadout-resolver.ts. Numbers: docs/research/mechanics.md § 12.
 */
import { AbilityRule, BuffDef } from './rules-model';

const W = 'https://runescape.wiki/w/';

/** shared cooldown group of every powerburst potion: 2 minutes (200 ticks) */
export const POWERBURST_COOLDOWN = 'powerburst';
export const POWERBURST_COOLDOWN_TICKS = 200;
/** a powerburst lasts 6 seconds */
export const POWERBURST_TICKS = 10;
/** Surge / Dive / Bladed Dive cooldown while the Powerburst of acceleration runs */
export const ACCELERATION_COOLDOWN_TICKS = 2;
/** the combat dummy stands for 60 seconds */
export const COMBAT_DUMMY_TICKS = 100;
/** adrenaline per tick while hitting the dummy – the engine's "recharge adrenaline" rate (trainer-engine.ts RECHARGE_PER_TICK) */
export const COMBAT_DUMMY_ADRENALINE_PER_TICK = 10;

export const CONSUMABLE_BUFFS: BuffDef[] = [
  { id: 'powerburst-of-vitality', name: 'Powerburst of vitality', kind: 'Buff', on: 'self', durationTicks: POWERBURST_TICKS, maxLifePointsMult: 2, icon: 'assets/specials/powerburst-of-vitality.png',
    text: 'Current and maximum life points doubled for 10 ticks (max 32,000); when it ends the maximum returns and the current life points are capped by it, so do not eat meanwhile. The trainer has no life point pool, so the factor is only exposed.', source: W + 'Powerburst_of_vitality' },
  { id: 'powerburst-of-acceleration', name: 'Powerburst of acceleration', kind: 'Buff', on: 'self', durationTicks: POWERBURST_TICKS, icon: 'assets/specials/powerburst-of-acceleration.png',
    text: 'For 10 ticks Surge, Dive and Bladed Dive have a 2-tick cooldown; Bladed Dive deals no damage. Escape is not affected (it no longer shares a cooldown with Surge outside PvP).', source: W + 'Powerburst_of_acceleration' },
  { id: 'combat-dummy', name: 'Combat dummy MKII', kind: 'Buff', on: 'self', durationTicks: COMBAT_DUMMY_TICKS, adrenalinePerTick: COMBAT_DUMMY_ADRENALINE_PER_TICK, icon: 'assets/actions/combat-dummy.png',
    text: 'A combat dummy stands for 100 ticks: hitting it builds adrenaline, modelled as +10% per tick (the game gives adrenaline per ability used on it, not per tick). No experience, no Reaper stacks.', source: W + 'Combat_dummy_MKII' },
];

/** rules keyed by specials.json id */
export const SPECIAL_RULES: AbilityRule[] = [
  {
    ability: 'powerburst-of-vitality',
    sharedCooldown: POWERBURST_COOLDOWN,
    cooldownTicks: POWERBURST_COOLDOWN_TICKS,
    notes: [
      'Doubles current and maximum life points for 6 seconds (10 ticks), max 32,000; afterwards both are halved back – eating during the burst is wasted (' + W + 'Powerburst_of_vitality )',
      'Off the global cooldown; drinking any powerburst starts the 2-minute (200-tick) cooldown shared by all powerbursts (' + W + 'Powerburst_of_vitality )',
    ],
    onCast: [{ kind: 'buff', id: 'powerburst-of-vitality' }],
  },
  {
    ability: 'powerburst-of-acceleration',
    sharedCooldown: POWERBURST_COOLDOWN,
    cooldownTicks: POWERBURST_COOLDOWN_TICKS,
    notes: [
      'Resets the cooldowns of Surge, Dive and Bladed Dive and sets them to 1.2 s (2 ticks) for 6 seconds (10 ticks); Bladed Dive deals no damage meanwhile. Escape is not reset (' + W + 'Powerburst_of_acceleration )',
      'Off the global cooldown; drinking any powerburst starts the 2-minute (200-tick) cooldown shared by all powerbursts (' + W + 'Powerburst_of_acceleration )',
    ],
    onCast: [{ kind: 'buff', id: 'powerburst-of-acceleration' }, { kind: 'cooldown-reset', abilities: ['surge', 'dive', 'bladed-dive'] }],
  },
  {
    ability: 'dominion-mine',
    charges: 2,
    cooldownTicks: 100,
    targetLpHit: { share: 0.2, cap: 10000, delayTicks: 8 },
    notes: [
      'Deployed on the ground: about 5 seconds (8 ticks) later it deals 20% of the target\'s maximum life points, cap 10,000, as one melee hit; Vulnerability adds 10% (' + W + 'Dominion_mine )',
      'Only monsters of combat level 138 or less trigger it – most bosses are immune; the trainer knows no target level and always detonates (' + W + 'Dominion_mine )',
      'Two mines per minute (100 ticks); off the global cooldown (' + W + 'Dominion_mine )',
    ],
  },
  {
    ability: 'sticky-bomb',
    notes: ['Thrown: binds monsters in a 3×3 area for 6 seconds (10 ticks), no damage; off the global cooldown, no cooldown (' + W + 'Sticky_bomb )'],
    onCast: [{ kind: 'buff', id: 'bound' }],
  },
];

/** rules keyed by core/models.ts ACTIONS id */
export const ACTION_RULES: AbilityRule[] = [
  {
    ability: 'combat-dummy',
    notes: [
      'Deploys a combat dummy for 60 seconds (100 ticks) to build or stall adrenaline before a fight; the trainer models it as +10% adrenaline per tick like the "recharge adrenaline" option (' + W + 'Combat_dummy_MKII )',
      'Instant, no global cooldown, no cooldown; no experience and no Reaper stacks (' + W + 'Combat_dummy_MKII )',
    ],
    onCast: [{ kind: 'buff', id: 'combat-dummy' }],
  },
];

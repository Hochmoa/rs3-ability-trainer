/** Defence and Constitution ability interactions – docs/research/defence-constitution.md */
import { AbilityRule } from './rules-model';

const W = 'https://runescape.wiki/w/';
const THRESHOLD = { threshold: true };

export const DEFCON_RULES: AbilityRule[] = [
  {
    ability: 'anticipation',
    notes: ['Normal GCD basic (+9%): stun immunity for 17 ticks and damage taken -10%; must be active before the stun (' + W + 'Anticipation )', 'Reflexes halves duration and cooldown; Clear Headed adds one second per rank (' + W + 'Reflexes )'],
    onCast: [{ kind: 'buff', id: 'anticipation' }],
  },
  {
    ability: 'bash',
    requires: [{ text: 'needs a shield or defender', equipment: 'defender-or-shield' }],
    notes: ['Needs a shield or defender (' + W + 'Bash )'],
  },
  {
    ability: 'provoke',
    offGcdNoGain: true,
    notes: ['Can be cast during the global cooldown, but then gives no adrenaline (' + W + 'Provoke )'],
    onCast: [{ kind: 'buff', id: 'provoke' }],
  },
  {
    ability: 'freedom',
    notes: ['Normal GCD basic (+9%): removes stuns, binds and bleeds, immunity for 10 ticks; the only ability usable while stunned; independent of Anticipation (' + W + 'Freedom )'],
    onCast: [{ kind: 'buff', id: 'freedom' }],
  },
  {
    ability: 'divert',
    sharedCooldown: 'resonance',
    requires: [{ text: 'needs a shield or defender', equipment: 'defender-or-shield' }],
    notes: ['Shares its 50-tick cooldown with Resonance; blocks the next hit and converts it to adrenaline (up to 50%, 100% under Natural Instinct) (' + W + 'Divert )'],
    onCast: [{ kind: 'buff', id: 'divert' }],
  },
  {
    ability: 'resonance',
    sharedCooldown: 'resonance',
    requires: [{ text: 'needs a shield or defender', equipment: 'defender-or-shield' }],
    notes: ['Shares its 50-tick cooldown with Divert; Preparation shortens it by 5 ticks per attack received (' + W + 'Resonance )'],
    onCast: [{ kind: 'buff', id: 'resonance' }],
  },
  {
    ability: 'preparation',
    requires: [{ text: 'needs a shield', equipment: 'shield' }],
    notes: ['Shield only, 16 ticks: every attack received reduces the Resonance/Divert cooldown by 5 ticks (' + W + 'Preparation )', 'Preparation perk: +15% duration and cooldown per rank (' + W + 'Preparation_(perk) )'],
    onCast: [{ kind: 'buff', id: 'preparation' }],
  },
  {
    ability: 'devotion',
    cost: THRESHOLD,
    notes: ['Threshold: needs 50% adrenaline (15% during Limitless), drains 15%; kills extend it by 8 ticks up to 32 (' + W + 'Devotion )'],
    onCast: [{ kind: 'buff', id: 'devotion' }],
  },
  {
    ability: 'revenge',
    cost: THRESHOLD,
    requires: [{ text: 'needs a shield or defender', equipment: 'defender-or-shield' }],
    notes: ['Threshold, shield/defender: +5% damage per attack received (max 10 stacks) for 32 ticks (' + W + 'Revenge )'],
    onCast: [{ kind: 'buff', id: 'revenge' }],
  },
  {
    ability: 'reflect',
    cost: THRESHOLD,
    notes: ['Threshold: halves damage taken and reflects 50% for 16 ticks; without a target it costs nothing (' + W + 'Reflect )'],
    onCast: [{ kind: 'buff', id: 'reflect' }],
  },
  {
    ability: 'debilitate',
    cost: THRESHOLD,
    notes: ['Threshold: the target deals 50% less damage; duration scales with the shield tier (T90 shield 23 ticks) (' + W + 'Debilitate )'],
    onHit: [{ kind: 'buff', id: 'debilitate' }],
  },
  {
    ability: 'immortality',
    requires: [{ text: 'needs a shield', equipment: 'shield' }],
    notes: ['Ultimate, shield only: damage taken -25% for 50 ticks and a one-time revival (' + W + 'Immortality )'],
    onCast: [{ kind: 'buff', id: 'immortality' }],
  },
  {
    ability: 'rejuvenate',
    sharedCooldown: 'rejuvenate',
    requires: [{ text: 'needs a shield', equipment: 'shield' }],
    notes: ['Ultimate, shield only: heals 40% over 17 ticks; shares its 500-tick cooldown with Guthix\'s Blessing and Ice Asylum (Brief Respite -5% per rank) (' + W + 'Rejuvenate )'],
    onCast: [{ kind: 'buff', id: 'rejuvenate' }],
  },
  {
    ability: 'barricade',
    requires: [{ text: 'needs a shield or defender', equipment: 'defender-or-shield' }],
    notes: ['Ultimate: blocks all damage for 8 + tier/10 ticks (T90: 17); Turtling +10% duration and cooldown per rank; Malletops totem +3/+6 ticks (' + W + 'Barricade )'],
    onCast: [{ kind: 'buff', id: 'barricade' }],
  },
  {
    ability: 'natural-instinct',
    notes: ['Ultimate, 34 ticks: adrenaline gains from basics (and Divert, Shadow Imbued, Tsunami) are doubled against monsters (' + W + 'Natural_Instinct )'],
    onCast: [{ kind: 'buff', id: 'natural-instinct' }],
  },
  {
    ability: 'limitless',
    offGcd: true,
    requires: [{ text: 'cannot be used at 60% adrenaline or more', adrenalineBelow: 60 }],
    notes: ['Ignores the global cooldown, 0% adrenaline, 150-tick cooldown, only below 60% adrenaline: for 10 ticks threshold abilities need 15% instead of 50% (' + W + 'Limitless )'],
    onCast: [{ kind: 'buff', id: 'limitless' }],
  },
  {
    ability: 'sacrifice',
    notes: ['Heals 25% of the damage dealt (100% if it kills) (' + W + 'Sacrifice )'],
  },
  {
    ability: 'siphon',
    notes: ['0% adrenaline: steals 10% adrenaline from a player, +10% against NPCs with adrenaline (' + W + 'Siphon_(Constitution_ability) )'],
  },
  {
    ability: 'tuska-s-wrath',
    notes: ['Against your Slayer assignment: 100 × Slayer level damage with a separate 200-tick empowered cooldown (' + W + "Tuska's_Wrath )"],
  },
  {
    ability: 'storm-shards',
    notes: ['Stores 80–90% ability damage per stack (max 10); Shatter releases them (' + W + 'Storm_Shards )', 'Freedom halves the stacks (' + W + 'Freedom )'],
    onHit: [{ kind: 'stack', stack: 'storm-shards', amount: 1, cap: 10 }],
  },
  {
    ability: 'shatter',
    cost: THRESHOLD,
    cooldownRules: [{ ticks: 0, when: { stackMax: { stack: 'storm-shards', max: 0 } } }],
    notes: ['Threshold: deals the stored Storm Shards damage (cap 30,000) and consumes all stacks; with 0 stacks the adrenaline is lost but no cooldown starts (' + W + 'Shatter )'],
    onCast: [{ kind: 'consume-stack', stack: 'storm-shards', amount: 'all' }],
  },
  {
    ability: 'reprisal',
    cost: THRESHOLD,
    notes: ['Threshold: stores all damage taken for 10 ticks and releases it (cap 30,000); recast outside the GCD to fire early (' + W + 'Reprisal )'],
    onCast: [{ kind: 'buff', id: 'reprisal' }],
  },
  {
    ability: 'transfigure',
    requires: [{ text: 'cannot be used while immune to stuns or stunned', notStunImmune: true }],
    notes: ['Ultimate: self-stun for 10 ticks, then heals 250% of the damage taken and grants 25 ticks of stun and bind immunity; cannot be used while stun-immune (Anticipation, Freedom) (' + W + 'Transfigure )'],
    onCast: [{ kind: 'buff', id: 'transfigure' }, { kind: 'buff', id: 'transfigure-immunity', durationTicks: 35 }],
  },
  {
    ability: 'guthix-s-blessing',
    sharedCooldown: 'rejuvenate',
    notes: ['Ultimate: heals 8% max life points every 3 ticks (5 times); shares its 500-tick cooldown with Rejuvenate and Ice Asylum (' + W + "Guthix's_Blessing )"],
    onCast: [{ kind: 'buff', id: 'guthix-s-blessing' }],
  },
  {
    ability: 'onslaught',
    adrenaline: 0,
    cost: { threshold: false, ultimate: false },
    requires: [{ text: 'needs 100% adrenaline', adrenalineMin: 100 }],
    channel: { ticks: 51, hits: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50], adrenalinePerHit: 25 },
    notes: [
      'Ultimate channel: a hit every 2 ticks (max 26), 25% adrenaline paid per hit instead of 100% up front; once adrenaline runs out the channel ends and you take damage instead; Ring of vigour and Conservation of Energy do not apply (' + W + 'Onslaught )',
      'Cancelled by moving, any other ability, food, potions or weapon swaps; ignores Berserk, Sunshine and Death\'s Swiftness (' + W + 'Onslaught )',
    ],
  },
  {
    ability: 'ice-asylum',
    sharedCooldown: 'rejuvenate',
    notes: ['Ultimate: heals up to 7% max life points every 6 ticks (6 times); shares its 500-tick cooldown with Rejuvenate and Guthix\'s Blessing (' + W + 'Ice_Asylum )'],
    onCast: [{ kind: 'buff', id: 'ice-asylum' }],
  },
  {
    ability: 'weapon-special-attack',
    requires: [{ text: 'needs a wielded weapon with a special attack', equipment: 'spec-weapon' }],
    notes: ['Fires the special attack of the wielded weapon: adrenaline requirement equals the cost, Ring of vigour reduces both to 90%; cooldowns and effects come from the weapon (' + W + 'Weapon_Special_Attack )'],
  },
  {
    ability: 'essence-of-finality',
    requires: [{ text: 'needs an Essence of Finality amulet with a stored special attack and a weapon of the same style', equipment: 'eof' }],
    notes: ['Fires the special attack stored in the Essence of Finality amulet; needs a wielded weapon of the same style; shares the cooldown with the weapon\'s own special (' + W + 'Essence_of_Finality )'],
  },
];

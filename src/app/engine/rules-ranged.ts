/** Ranged ability interactions – docs/research/ranged.md */
import { AbilityRule } from './rules-model';

const W = 'https://runescape.wiki/w/';

export const RANGED_RULES: AbilityRule[] = [
  {
    ability: 'escape',
    offGcd: true,
    notes: ['Ignores the global cooldown, no adrenaline, 34-tick cooldown (17 with Mobile); no longer shares a cooldown with Surge outside PvP (' + W + 'Escape )'],
  },
  {
    ability: 'ranged',
    hits: [0],
    notes: ['Basic attack: +9% adrenaline (' + W + 'Ranged_(ability) )', 'With fleeting boots every hit reduces the Snipe cooldown by 6 ticks (' + W + 'Fleeting_boots )'],
    onHit: [{ kind: 'cooldown-reduce', ability: 'snipe', ticks: 6, when: { item: 'fleeting-boots' } }],
  },
  {
    ability: 'piercing-shot',
    hits: [0, 0],
    notes: ['2 hits; every hit reduces the Snipe cooldown by 4 ticks (6 with fleeting boots) (' + W + 'Piercing_Shot )'],
    onHit: [
      { kind: 'cooldown-reduce', ability: 'snipe', ticks: 4 },
      { kind: 'cooldown-reduce', ability: 'snipe', ticks: 2, when: { item: 'fleeting-boots' } },
    ],
  },
  {
    ability: 'binding-shot',
    charges: 2,
    notes: ['Stuns the target for 2 ticks and binds it for 16; 2 charges at level 54 (' + W + 'Binding_Shot )'],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 2 }, { kind: 'buff', id: 'bound', durationTicks: 16 }],
  },
  {
    ability: 'galeshot',
    notes: ['Applies Searing Winds for 10 ticks: every ranged hit +20% ability damage flat (' + W + 'Galeshot )'],
    onCast: [{ kind: 'buff', id: 'searing-winds' }],
  },
  {
    ability: 'ricochet',
    hits: [0, 1, 1],
    notes: ['Hits up to 2 secondary targets; missing secondaries return to the primary as extra hits 1 tick later (' + W + 'Ricochet )'],
  },
  {
    ability: 'greater-ricochet',
    replaces: 'ricochet',
    hits: [0, 1, 1, 1, 1, 1, 1],
    notes: ['Hits up to 6 secondary targets; missing secondaries return to the primary 1 tick later (' + W + 'Greater_Ricochet )'],
  },
  {
    ability: 'snap-shot',
    cooldownTicks: 0,
    hits: [0, 0],
    notes: ['25% adrenaline, 2 hits, no cooldown besides the GCD since 9 March 2026 (' + W + 'Snap_Shot )'],
  },
  {
    ability: 'snipe',
    channel: { ticks: 3, hits: [3] },
    notes: [
      '0% adrenaline, 100-tick cooldown applied at the start of the 3-tick channel; cancelled by any other ability or by moving (nightmare gauntlets allow moving) (' + W + 'Snipe )',
      'Piercing Shot hits shorten the cooldown by 4 ticks (6 with fleeting boots) (' + W + 'Snipe )',
    ],
  },
  {
    ability: 'bombardment',
    cooldownTicks: 0,
    notes: ['25% adrenaline, 5x5 AoE, no cooldown besides the GCD since 9 March 2026 (' + W + 'Bombardment )'],
  },
  {
    ability: 'rapid-fire',
    channel: { ticks: 8, hits: [1, 2, 3, 4, 5, 6, 7, 8], movable: true },
    notes: [
      'Channelled: 8 hits, one per tick; you can move while channelling; cancelled by pressing another ability (' + W + 'Rapid_Fire )',
      'Binds the target for 10 ticks; every hit extends Searing Winds by 1 tick (max +8) (' + W + 'Rapid_Fire )',
      'Dracolich armour: +0.2 adrenaline per piece per tick while channelling (elite 0.5) (' + W + 'Dracolich_armour )',
    ],
    onCast: [{ kind: 'buff', id: 'bound', durationTicks: 10 }],
    onHit: [{ kind: 'extend-buff', buff: 'searing-winds', ticks: 1, maxTotal: 8 }],
  },
  {
    ability: 'corruption-shot',
    sharedCooldown: 'corruption',
    bleed: { hits: 5, everyTicks: 2, startTicks: 0, factors: [1, 0.8, 0.6, 0.4, 0.2] },
    notes: ['20% adrenaline; DoT of 5 hits every 2 ticks on up to 6 targets; shares its cooldown with Corruption Blast; removed by Freedom (' + W + 'Corruption_Shot )'],
    onHit: [{ kind: 'buff', id: 'corruption-shot', refresh: true }],
  },
  {
    ability: 'shadow-tendrils',
    notes: ['0% adrenaline, 75-tick cooldown, guaranteed critical strike with self-damage; extends Shadow Imbued by 6 ticks (' + W + 'Shadow_Tendrils )'],
    onCast: [{ kind: 'extend-buff', buff: 'shadow-imbued', ticks: 6 }],
  },
  {
    ability: 'imbue-shadows',
    notes: ['40% adrenaline: Shadow Imbued for 50 ticks – every ranged hit +5% adrenaline (+10% with Natural Instinct) (' + W + 'Imbue:_Shadows )'],
    onCast: [{ kind: 'buff', id: 'shadow-imbued' }],
  },
  {
    ability: 'deadshot',
    hits: [0, 0, 0, 0],
    notes: ['60% adrenaline, 4 hits of 105–125% (Igneous Kal-Xil / Kal-Zuk: 8 hits of 55–75%) (' + W + 'Deadshot )'],
  },
  {
    ability: 'death-s-swiftness',
    notes: [
      '100% adrenaline: ranged hits deal 1.5x for 50 ticks, self-buff since 16 March 2026; the buff starts 1 tick after the cast (' + W + "Death's_Swiftness )",
      'Planted Feet: 63 ticks (' + W + 'Planted_Feet )',
    ],
    onCast: [
      { kind: 'choose', when: { item: 'planted-feet' }, then: [{ kind: 'buff', id: 'death-s-swiftness', durationTicks: 63 }], otherwise: [{ kind: 'buff', id: 'death-s-swiftness' }] },
    ],
  },
  {
    ability: 'greater-death-s-swiftness',
    replaces: 'death-s-swiftness',
    notes: ['100% adrenaline: ranged hits deal 1.5x for 63 ticks; not affected by Planted Feet (' + W + "Greater_Death's_Swiftness )"],
    onCast: [{ kind: 'buff', id: 'greater-death-s-swiftness' }],
  },
];

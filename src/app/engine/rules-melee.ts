/** Melee ability interactions – docs/research/melee.md */
import { AbilityRule } from './rules-model';

const W = 'https://runescape.wiki/w/';

export const MELEE_RULES: AbilityRule[] = [
  {
    ability: 'attack',
    notes: ['Basic attack: +9% adrenaline, generates 1 Bloodlust, operates on the global cooldown (' + W + 'Attack_(ability) )'],
    hits: [0],
  },
  {
    ability: 'adaptive-strike',
    notes: ['+12% adrenaline, 2 hits (' + W + 'Adaptive_Strike )'],
    hits: [0, 0],
  },
  {
    ability: 'rend',
    notes: ['Generates 2 Bloodlust instead of 1 (' + W + 'Rend )', 'With gloves of passage: next melee attack +10% and the target takes +20% bleed damage (' + W + 'Rend )'],
    onCast: [
      { kind: 'stack', stack: 'bloodlust', amount: 1, when: { notBuff: 'berserk' } },
      { kind: 'stack', stack: 'bloodlust', amount: 2, cap: 8, when: { buff: 'berserk' } },
    ],
    onHit: [
      { kind: 'buff', id: 'enduring-ruin', when: { item: 'gloves-of-passage' } },
      { kind: 'buff', id: 'corrupted-wounds', when: { item: 'gloves-of-passage' } },
    ],
  },
  {
    ability: 'fury',
    notes: ['Next melee attack +25% critical strike chance (' + W + 'Fury )'],
    onHit: [{ kind: 'buff', id: 'fury' }],
  },
  {
    ability: 'greater-fury',
    replaces: 'fury',
    notes: ['120–140% hit; the next non-bleed melee hit within 25 ticks is a guaranteed critical strike; bleeds neither use nor consume it (' + W + 'Greater_Fury )'],
    hits: [0],
    onCast: [{ kind: 'buff', id: 'greater-fury' }],
  },
  {
    ability: 'backhand',
    charges: 2,
    notes: ['Stuns and binds the target for 3 ticks; 2 charges at level 54; the hit lands the tick after the activation (' + W + 'Backhand )'],
    hits: [1],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 3 }, { kind: 'buff', id: 'bound', durationTicks: 3 }],
  },
  {
    ability: 'punish',
    notes: ['2.5x damage against targets below 50% life points (' + W + 'Punish )'],
    damageRules: [{ when: { targetLpBelow: 0.5 }, mult: 2.5 }],
  },
  {
    ability: 'barge',
    notes: ['Binds the target for 11 ticks and clears your own bind; never shares a cooldown with Dive (' + W + 'Barge )', 'Mobile perk halves the cooldown (' + W + 'Mobile )'],
    hits: [1],
    onHit: [{ kind: 'buff', id: 'bound', durationTicks: 11 }],
  },
  {
    ability: 'greater-barge',
    replaces: 'barge',
    notes: [
      'Cast 8+ ticks after your last attack (or as an opener): Endless Assault for 10 ticks – the next Assault, Flurry or Greater Flurry becomes an un-cancellable damage over time (' + W + 'Greater_Barge )',
      '+5–7% damage per tick since the last attack, max 10 ticks (' + W + 'Greater_Barge )',
      'Binds the target for 11 ticks (' + W + 'Barge )',
    ],
    hits: [1],
    damageRamp: { perTick: { min: 5, max: 7 }, maxTicks: 10 },
    onCast: [{ kind: 'buff', id: 'endless-assault', when: { idleMin: 8 } }],
    onHit: [{ kind: 'buff', id: 'bound', durationTicks: 11 }],
  },
  {
    ability: 'chaos-roar',
    notes: ['Next damaging melee ability within 12 ticks deals 1.75x base damage (' + W + 'Chaos_Roar )'],
    onHit: [{ kind: 'buff', id: 'chaos-roar' }],
  },
  {
    ability: 'dive',
    moves: true,
    offGcd: true,
    sharedCooldown: 'dive',
    cooldownRules: [{ ticks: 2, when: { buff: 'powerburst-of-acceleration' } }],
    notes: [
      'Ignores the global cooldown, generates no adrenaline; shares its 34-tick cooldown with Bladed Dive (' + W + 'Dive )',
      'Powerburst of acceleration resets it and sets its cooldown to 2 ticks for 10 ticks (' + W + 'Powerburst_of_acceleration )',
    ],
  },
  {
    ability: 'bladed-dive',
    moves: true,
    offGcdNoGain: true,
    sharedCooldown: 'dive',
    adrenaline: 9,
    cooldownRules: [{ ticks: 2, when: { buff: 'powerburst-of-acceleration' } }],
    damageRules: [{ when: { buff: 'powerburst-of-acceleration' }, mult: 0 }],
    notes: [
      'Can be cast during the global cooldown, but then deals no damage and gives no adrenaline; does not generate Bloodlust (' + W + 'Bladed_Dive )',
      'Shares its cooldown with Dive; the cooldown resets if a damaged enemy dies within 10 ticks (' + W + 'Bladed_Dive )',
      'Powerburst of acceleration resets it and sets its cooldown to 2 ticks for 10 ticks, but it deals no damage meanwhile (' + W + 'Powerburst_of_acceleration )',
    ],
  },
  {
    ability: 'assault',
    channel: { ticks: 7, hits: [1, 3, 5, 7], asDotWhen: { buff: 'endless-assault' } },
    damageRules: [{ when: { flag: 'bloodlust' }, damage: { min: 170, max: 190 } }],
    notes: [
      'Channelled: 4 hits over 7 ticks (ticks 1, 3, 5, 7); can move while channelling; cancelled by pressing another ability after the GCD (' + W + 'Assault )',
      'Consumes 4 Bloodlust when you have at least 4: 170–190% per hit instead of 130–150% (' + W + 'Bloodlust )',
      'With Endless Assault it is dealt as an un-cancellable damage over time (' + W + 'Endless_Assault )',
    ],
    onCast: [
      { kind: 'consume-stack', stack: 'bloodlust', amount: 4, min: 4, then: [{ kind: 'flag', flag: 'bloodlust', value: true }] },
      { kind: 'remove-buff', id: 'endless-assault' },
    ],
  },
  {
    ability: 'hurricane',
    hits: [0, 0, 0],
    hitDamage: [{ min: 135, max: 165 }, { min: 155, max: 185 }, { min: 75, max: 95, when: { flag: 'bloodlust' } }],
    requires: [{ text: 'needs a two-handed weapon', equipment: '2h' }],
    notes: [
      'Two-handed only. Two hits; with 4 Bloodlust a third AoE hit of 75–95% (' + W + 'Hurricane )',
      'Its own cooldown is reduced by 5 ticks per enemy hit (' + W + 'Hurricane )',
    ],
    onCast: [{ kind: 'consume-stack', stack: 'bloodlust', amount: 4, min: 4, then: [{ kind: 'flag', flag: 'bloodlust', value: true }] }],
    onHit: [{ kind: 'cooldown-reduce', ability: 'hurricane', ticks: 5, when: { hit: 0 } }],
  },
  {
    ability: 'flurry',
    channel: { ticks: 8, hits: [1, 2, 3, 4, 5, 6, 7, 8], asDotWhen: { buff: 'endless-assault' } },
    damageRules: [{ when: { flag: 'bloodlust' }, perMissingLp: { per: 0.01, max: 0.65 } }],
    notes: [
      'Channelled: 8 hits on 8 consecutive ticks, AoE; stuns and binds the main target for 6 ticks (' + W + 'Flurry )',
      'Consumes 4 Bloodlust: +1% damage per 1% life points the target is missing, max +65% (' + W + 'Bloodlust )',
    ],
    onCast: [{ kind: 'consume-stack', stack: 'bloodlust', amount: 4, min: 4, then: [{ kind: 'flag', flag: 'bloodlust', value: true }] }, { kind: 'remove-buff', id: 'endless-assault' }],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 6, when: { hit: 0 } }, { kind: 'buff', id: 'bound', durationTicks: 6, when: { hit: 0 } }],
  },
  {
    ability: 'greater-flurry',
    replaces: 'flurry',
    channel: { ticks: 8, hits: [1, 2, 3, 4, 5, 6, 7, 8], asDotWhen: { buff: 'endless-assault' } },
    damageRules: [{ when: { flag: 'bloodlust' }, perMissingLp: { per: 0.01, max: 0.65 } }],
    notes: [
      'Channelled: 8 hits on 8 consecutive ticks (' + W + 'Greater_Flurry )',
      'Every hit extends an active Berserk by 1 tick, max +8 per cast (' + W + 'Greater_Flurry )',
      'Consumes 4 Bloodlust: +1% damage per 1% life points the target is missing, max +65% (' + W + 'Bloodlust )',
    ],
    onCast: [{ kind: 'consume-stack', stack: 'bloodlust', amount: 4, min: 4, then: [{ kind: 'flag', flag: 'bloodlust', value: true }] }, { kind: 'remove-buff', id: 'endless-assault' }],
    onHit: [
      { kind: 'extend-buff', buff: 'berserk', ticks: 1 }, // 8 hits per cast = the wiki's "+8 per cast"; a second cast extends again
      { kind: 'buff', id: 'stunned', durationTicks: 6, when: { hit: 0 } },
      { kind: 'buff', id: 'bound', durationTicks: 6, when: { hit: 0 } },
    ],
  },
  {
    ability: 'dismember',
    sequence: { group: 'dismember', step: 1, windowTicks: 40 },
    bleed: { hits: 8, everyTicks: 2 },
    notes: [
      'Bleed: 8 hits every 2 ticks; 0% adrenaline; 40-tick cooldown from the first cast (' + W + 'Dismember )',
      'Opens Slaughter in the same slot for 40 ticks; Slaughter opens Massacre; Massacre or 40 idle ticks reset the slot to Dismember (' + W + 'Dismember_(status,_buff) )',
    ],
    onCast: [{ kind: 'buff', id: 'dismember', refresh: true }],
  },
  {
    ability: 'slaughter',
    sequence: { group: 'dismember', step: 2, windowTicks: 40 },
    bleed: { hits: 6, everyTicks: 3 },
    cooldownTicks: 0,
    requires: [{ text: 'only within 40 ticks after Dismember', sequence: { group: 'dismember', step: 2 } }],
    notes: ['Second cast of the Dismember slot: 25% adrenaline, bleed of 6 hits every 3 ticks; all three bleeds can be active together (' + W + 'Slaughter )'],
    onCast: [{ kind: 'buff', id: 'slaughter', refresh: true }],
  },
  {
    ability: 'massacre',
    sequence: { group: 'dismember', step: 3, windowTicks: 40, last: true },
    bleed: { hits: 6, everyTicks: 4, direct: true, damage: { min: 100, max: 100 } },
    cooldownTicks: 0,
    requires: [{ text: 'only within 40 ticks after Slaughter', sequence: { group: 'dismember', step: 3 } }],
    notes: ['Third cast of the Dismember slot: 25% adrenaline, a 110–130% hit then a bleed of 6 hits of a flat 100% every 4 ticks; resets the slot to Dismember (' + W + 'Massacre )'],
    onCast: [{ kind: 'buff', id: 'massacre', refresh: true }],
  },
  {
    ability: 'overpower',
    hits: [3],
    cooldownRules: [{ ticks: 15, when: { buff: 'berserk' } }],
    notes: ['60% adrenaline. While Berserk is active the cooldown is 15 ticks instead of 50 (a running cooldown is not reset) (' + W + 'Berserk )', 'Igneous Kal-Ket / Kal-Zuk: two hits of 310–370%, both landing 3 ticks after the cast (' + W + 'Igneous_Kal-Zuk )'],
  },
  {
    ability: 'pulverise',
    requires: [{ text: 'needs a two-handed weapon', equipment: '2h' }],
    notes: ['Two-handed only, 60% adrenaline. Target deals 25% less damage for 50 ticks; killing an NPC with it gives +50% adrenaline (' + W + 'Pulverise )'],
    onHit: [{ kind: 'buff', id: 'pulverise' }],
  },
  {
    ability: 'berserk',
    notes: [
      '100% adrenaline, 33 ticks: melee damage 1.75x, damage taken 1.25x (' + W + 'Berserk )',
      'Grants 4 Bloodlust, raises the cap to 8 and doubles Bloodlust generation (' + W + 'Bloodlust )',
      'Overpower cooldown becomes 15 ticks; Greater Flurry hits extend Berserk (' + W + 'Berserk )',
      'Vestments of havoc (3 pieces): +10 ticks (' + W + 'Vestments_of_havoc_armour )',
    ],
    onCast: [{ kind: 'buff', id: 'berserk' }, { kind: 'stack', stack: 'bloodlust', amount: 4, cap: 8 }],
  },
  {
    ability: 'meteor-strike',
    notes: ['60% adrenaline, 220–250% hit. For 50 ticks +4.5% adrenaline per tick with a melee weapon and 1.5x adrenaline from melee basic abilities; recasting refreshes it (' + W + 'Meteor_Strike )'],
    hits: [0],
    onCast: [{ kind: 'buff', id: 'meteor-strike', refresh: true }],
  },
];

/** Magic ability interactions – docs/research/magic.md */
import { AbilityRule, Condition, Effect } from './rules-model';

const W = 'https://runescape.wiki/w/';

/** Song of Destruction (Roar of Awakening + Ode to Deceit): with 1+ Essence Corruption a DoT has a 30% chance to land at once and start no cooldown */
const ESSENCE_DUMP: Condition = { item: 'song-of-destruction:1', stackMin: { stack: 'essence-corruption', min: 1 }, chance: 0.3 };
const ESSENCE_NOTE = 'Song of Destruction (Roar of Awakening + Ode to Deceit): every hit adds an Essence Corruption stack; with 1+ stacks a 30% chance that all hits land at once and the cooldown is removed; 2 pieces: DoT damage ×1.3 (' + W + 'Template:Song_of_Destruction )';

/** Sonic Wave / Greater Sonic Wave: consume Anima Charged for the strong Flow, else the normal one. */
function sonicWave(normal: string, charged: string): Effect[] {
  return [
    {
      kind: 'choose',
      when: { buff: 'anima-charged' },
      then: [{ kind: 'remove-buff', id: 'anima-charged' }, { kind: 'buff', id: charged }],
      otherwise: [{ kind: 'buff', id: normal }],
    },
  ];
}

export const MAGIC_RULES: AbilityRule[] = [
  {
    ability: 'surge',
    moves: true,
    offGcd: true,
    cooldownRules: [{ ticks: 2, when: { buff: 'powerburst-of-acceleration' } }],
    notes: [
      'Ignores the global cooldown, no adrenaline; shares a cooldown with Escape only in PvP (' + W + 'Surge )',
      'Powerburst of acceleration resets it and sets its cooldown to 2 ticks for 10 ticks (' + W + 'Powerburst_of_acceleration )',
    ],
  },
  {
    ability: 'runic-charge',
    offGcd: true,
    notes: ['Ignores the global cooldown, 0% adrenaline, 50-tick cooldown: Anima Charged for 25 ticks (' + W + 'Runic_Charge )'],
    onCast: [{ kind: 'buff', id: 'anima-charged' }],
  },
  {
    ability: 'magic',
    hits: [0],
    notes: ['Basic attack (auto-cast spell): +9% adrenaline (' + W + 'Magic_(ability) )'],
  },
  {
    ability: 'sonic-wave',
    notes: ['On hit: Flow for 15 ticks – next adrenaline-costing Magic ability costs 10% less (35% if Anima Charged was consumed) (' + W + 'Sonic_Wave )'],
    onHit: sonicWave('flow', 'flow-charged'),
  },
  {
    ability: 'greater-sonic-wave',
    replaces: 'sonic-wave',
    notes: ['On hit: Greater Flow for 15 ticks – next adrenaline-costing Magic ability costs 20% less (45% if Anima Charged was consumed) (' + W + 'Greater_Sonic_Wave )'],
    onHit: sonicWave('greater-flow', 'greater-flow-charged'),
  },
  {
    ability: 'dragon-breath',
    notes: ['Consumes Anima Charged: 260–310% instead of 110–130% (' + W + 'Runic_Charge )', '1.25x damage against Combusted targets (' + W + 'Dragon_Breath )', 'Kerapac\'s wrist wraps: the next Combust within 6 s is instant (' + W + 'Combust )'],
    hits: [0],
    damageRules: [{ when: { buff: 'anima-charged' }, damage: { min: 260, max: 310 } }, { when: { buff: 'combust' }, mult: 1.25 }],
    onCast: [{ kind: 'buff', id: 'kerapac-window', when: { item: 'kerapac-s-wrist-wraps' } }],
  },
  {
    ability: 'impact',
    charges: 2,
    notes: ['Stuns and binds the target for 3 ticks; 2 charges at level 54 (' + W + 'Impact )'],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 3 }, { kind: 'buff', id: 'bound', durationTicks: 3 }],
  },
  {
    ability: 'combust',
    bleed: { hits: 10, everyTicks: 3 },
    bleedWhen: [
      { when: { buff: 'kerapac-window' }, bleed: { hits: 10, everyTicks: 0, startTicks: 0 } },
      { when: ESSENCE_DUMP, bleed: { hits: 10, everyTicks: 0, startTicks: 0, noCooldown: true } },
    ],
    damageRules: [{ when: { flag: 'instant' }, mult: 1.25 }, { when: { flag: 'conflagrate' }, mult: 1.4 }],
    notes: [
      'Burn: 10 hits every 3 ticks; re-applying refreshes it; removed by Freedom (' + W + 'Combust )',
      "Kerapac's wrist wraps: within 6 s after Dragon Breath all ten hits land at once at +25% (" + W + "Kerapac's_wrist_wraps )",
      'Conflagrate (Roar of Awakening special Soulfire): the next Combust within 25 ticks deals +40% and consumes it (' + W + 'Soulfire )',
      ESSENCE_NOTE,
    ],
    onCast: [
      { kind: 'buff', id: 'combust', refresh: true },
      { kind: 'choose', when: { buff: 'kerapac-window' }, then: [{ kind: 'remove-buff', id: 'kerapac-window' }, { kind: 'flag', flag: 'instant', value: true }] },
      { kind: 'choose', when: { buff: 'conflagrate' }, then: [{ kind: 'remove-buff', id: 'conflagrate' }, { kind: 'flag', flag: 'conflagrate', value: true }] },
    ],
  },
  {
    ability: 'chain',
    notes: ['Next single-target Magic ability within 10 ticks is copied to the secondary targets at 0.3x (' + W + 'Chain )'],
    onHit: [{ kind: 'buff', id: 'chain', refresh: true }],
  },
  {
    ability: 'greater-chain',
    replaces: 'chain',
    notes: ['Next single-target Magic ability within 10 ticks is copied to the secondary targets at 0.5x (' + W + 'Greater_Chain )'],
    onHit: [{ kind: 'buff', id: 'chain', refresh: true }],
  },
  {
    ability: 'concentrated-blast',
    channel: { ticks: 3, hits: [1, 2, 3] },
    notes: ['Channelled: 3 beams over 3 ticks; each beam +5% critical strike chance for the next Magic ability (+10% more per beam when Anima Charged, which it consumes); lost on a main-hand swap (' + W + 'Concentrated_Blast )'],
    onCast: [{ kind: 'choose', when: { buff: 'anima-charged' }, then: [{ kind: 'remove-buff', id: 'anima-charged' }, { kind: 'flag', flag: 'charged', value: true }] }],
    onHit: [{ kind: 'choose', when: { flag: 'charged' }, then: [{ kind: 'stack', stack: 'concentrated-crit', amount: 15 }], otherwise: [{ kind: 'stack', stack: 'concentrated-crit', amount: 5 }] }],
  },
  {
    ability: 'greater-concentrated-blast',
    replaces: 'concentrated-blast',
    channel: { ticks: 3, hits: [1, 2, 3] },
    notes: ['Channelled: 3 beams over 3 ticks; each beam +7% critical strike chance for the next Magic ability (+10% more per beam when Anima Charged); lost on a main-hand swap (' + W + 'Greater_Concentrated_Blast )'],
    onCast: [{ kind: 'choose', when: { buff: 'anima-charged' }, then: [{ kind: 'remove-buff', id: 'anima-charged' }, { kind: 'flag', flag: 'charged', value: true }] }],
    onHit: [{ kind: 'choose', when: { flag: 'charged' }, then: [{ kind: 'stack', stack: 'concentrated-crit', amount: 17 }], otherwise: [{ kind: 'stack', stack: 'concentrated-crit', amount: 7 }] }],
  },
  {
    ability: 'wild-magic',
    hits: [0, 0],
    crit: { chanceAdd: 0.1, damageAdd: 0.2 },
    notes: ['25% adrenaline, 2 hits with +10% crit chance and +20% crit damage (' + W + 'Wild_Magic )', 'Blast diffusion boots: Blast Infused for 10 ticks (' + W + 'Blast_Infused )'],
    onCast: [{ kind: 'buff', id: 'blast-infused', when: { item: 'blast-diffusion-boots' } }],
  },
  {
    ability: 'asphyxiate',
    channel: { ticks: 7, hits: [1, 3, 5, 7], onComplete: [{ kind: 'buff', id: 'channelled-might' }] },
    notes: [
      'Channelled: 4 hits over 7 ticks (ticks 1, 3, 5, 7); hits 1–3 stun the target, hit 4 binds it; cancelled by moving, a stun or another ability (' + W + 'Asphyxiate )',
      'A full channel grants Channelled Might: +15% critical strike damage for 6 ticks (5 Tumeken pieces: 15 ticks, +35%) (' + W + 'Channelled_Might )',
      'Tumeken\'s resplendence (4 pieces): 8 hits on 8 consecutive ticks at 40% less damage (' + W + 'Asphyxiate )',
    ],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 2, when: { hit: 0 } }, { kind: 'buff', id: 'stunned', durationTicks: 2, when: { hit: 1 } }, { kind: 'buff', id: 'stunned', durationTicks: 2, when: { hit: 2 } }, { kind: 'buff', id: 'bound', durationTicks: 2, when: { hit: 3 } }],
  },
  {
    ability: 'corruption-blast',
    sharedCooldown: 'corruption',
    bleed: { hits: 5, everyTicks: 2, startTicks: 0, factors: [1, 0.8, 0.6, 0.4, 0.2] },
    bleedWhen: [{ when: ESSENCE_DUMP, bleed: { hits: 5, everyTicks: 0, startTicks: 0, factors: [1, 0.8, 0.6, 0.4, 0.2], noCooldown: true } }],
    notes: ['20% adrenaline; DoT of 5 hits every 2 ticks; shares its cooldown with Corruption Shot; removed by Freedom (' + W + 'Corruption_Blast )', ESSENCE_NOTE],
    onCast: [{ kind: 'buff', id: 'corruption-blast', refresh: true }],
  },
  {
    ability: 'smoke-tendrils',
    channel: { ticks: 7, hits: [1, 3, 5, 7], guaranteedCrit: true },
    hitDamage: [{ min: 55, max: 65 }, { min: 65, max: 80 }, { min: 75, max: 95 }, { min: 85, max: 110 }],
    notes: ['0% adrenaline, 75-tick cooldown: 4 guaranteed critical strikes every 2 ticks (55–65%, 65–80%, 75–95%, 85–110%) with self-damage; another ability after the GCD cancels the rest; under Tsunami each crit gives +8% adrenaline (' + W + 'Smoke_Tendrils )'],
  },
  {
    ability: 'magma-tempest',
    sharedCooldown: 'magma-tempest',
    hits: [0, 2, 4, 6, 8, 10, 12, 14],
    crit: { never: true },
    notes: ['20% adrenaline, 5x5 area of 8 hits every 2 ticks over 16 ticks; shares its cooldown with the targeted version; hits cannot crit (' + W + 'Magma_Tempest )'],
  },
  {
    ability: 'omnipower',
    notes: ['60% adrenaline, one hit of 420–500% (Igneous Kal-Mej / Kal-Zuk: 4 hits of 120–150%) (' + W + 'Omnipower )'],
  },
  {
    ability: 'sunshine',
    notes: [
      '100% adrenaline: Magic attacks inside the 7x7 area deal 1.5x for 50 ticks (Combust, Corruption Blast, Onslaught excluded); the buff starts 1 tick after the cast; leaving the area removes it (' + W + 'Sunshine )',
      'Planted Feet: 63 ticks and no periodic damage (' + W + 'Planted_Feet )',
    ],
    bleedWhen: [{ when: { notItem: 'planted-feet' }, bleed: { hits: 17, everyTicks: 3, damage: { min: 10, max: 20 } } }],
    onCast: [
      { kind: 'choose', when: { item: 'planted-feet' }, then: [{ kind: 'buff', id: 'sunshine', durationTicks: 63, delayTicks: 1 }], otherwise: [{ kind: 'buff', id: 'sunshine', delayTicks: 1 }] },
    ],
  },
  {
    ability: 'greater-sunshine',
    replaces: 'sunshine',
    notes: ['100% adrenaline: Magic attacks inside the area deal 1.5x for 63 ticks; Planted Feet only removes the periodic damage (' + W + 'Greater_Sunshine )'],
    bleedWhen: [{ when: { notItem: 'planted-feet' }, bleed: { hits: 21, everyTicks: 3, damage: { min: 10, max: 20 } } }],
    onCast: [{ kind: 'buff', id: 'greater-sunshine', durationTicks: 62, delayTicks: 1 }],
  },
  {
    ability: 'tsunami',
    hits: [0],
    notes: ['100% adrenaline (12% less per Glacial Embrace stack, min 40%): 225–275% hit; for 50 ticks every Magic critical strike generates +8% adrenaline; recasting refreshes it (' + W + 'Tsunami )'],
    onCast: [{ kind: 'buff', id: 'tsunami', refresh: true }],
  },
];

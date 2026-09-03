/** Style-wide rules – docs/research/mechanics.md, melee.md, ranged.md, magic.md, necromancy.md */
import { GlobalRule } from './rules-model';

const W = 'https://runescape.wiki/w/';

export const GLOBAL_RULES: GlobalRule[] = [
  {
    id: 'bloodlust-generation',
    notes: ['Every basic melee ability except Bladed Dive grants 1 Bloodlust (Rend 2), cap 4; during Berserk twice as many and cap 8 (' + W + 'Bloodlust )'],
    when: { style: 'Melee', type: 'Basic', gcd: true, excludeAbilities: ['bladed-dive', 'dive'] },
    onCast: [
      { kind: 'stack', stack: 'bloodlust', amount: 1, when: { notBuff: 'berserk' } },
      { kind: 'stack', stack: 'bloodlust', amount: 2, cap: 8, when: { buff: 'berserk' } },
    ],
  },
  {
    id: 'occultist-ring',
    notes: ["Occultist's ring: every Necromancy ability cast has a 10% chance to grant 2 Necrosis (" + W + 'Necrosis )'],
    when: { style: 'Necromancy', gcd: true },
    onCast: [{ kind: 'stack', stack: 'necrosis', amount: 2, when: { item: 'occultist-s-ring', chance: 0.1 } }],
  },
  {
    id: 'zorgoth-soul-ring',
    notes: ["Zorgoth's soul ring: every Necromancy hit has a 5% chance to grant a Residual Soul (" + W + 'Residual_Soul )'],
    when: { style: 'Necromancy', gcd: true },
    onHit: [{ kind: 'stack', stack: 'residual-souls', amount: 1, when: { item: 'zorgoth-s-soul-ring', chance: 0.05 } }],
  },
  {
    id: 'meteor-strike-basics',
    notes: ['Meteor Strike: melee basic abilities generate 1.5x adrenaline (not the basic attack) (' + W + 'Meteor_Strike )'],
    when: { style: 'Melee', type: 'Basic', gcd: true, buff: 'meteor-strike', excludeAbilities: ['attack', 'bladed-dive', 'dive'] },
    gainMult: 1.5,
  },
  {
    id: 'chaos-roar-consume',
    notes: ['Chaos Roar is consumed by the next damaging melee ability (' + W + 'Chaos_Roar )'],
    when: { style: 'Melee', buff: 'chaos-roar', excludeAbilities: ['chaos-roar', 'dive', 'bladed-dive', 'berserk'] },
    consumes: 'chaos-roar',
    damageMult: { mult: 1.75, firstHitOnly: true },
  },
  {
    id: 'greater-fury-consume',
    notes: ['Greater Fury is consumed by the next non-bleed melee hit (' + W + 'Greater_Fury )'],
    when: { style: 'Melee', buff: 'greater-fury', excludeAbilities: ['greater-fury', 'fury', 'dive', 'bladed-dive', 'berserk', 'meteor-strike', 'dismember', 'slaughter', 'massacre'] },
    onHit: [{ kind: 'remove-buff', id: 'greater-fury', when: { hit: 0 } }],
  },
  {
    id: 'fury-consume',
    notes: ['Fury\'s +25% crit chance is consumed by the next melee attack (' + W + 'Fury )'],
    when: { style: 'Melee', buff: 'fury', excludeAbilities: ['fury', 'greater-fury', 'dive', 'bladed-dive', 'berserk', 'meteor-strike'] },
    onHit: [{ kind: 'remove-buff', id: 'fury', when: { hit: 0 } }],
  },
  {
    id: 'enduring-ruin-consume',
    notes: ['Gloves of passage: the +10% applies to the next melee attack (' + W + 'Enhanced_gloves_of_passage )'],
    when: { style: 'Melee', buff: 'enduring-ruin', excludeAbilities: ['rend', 'dive', 'bladed-dive'] },
    onHit: [{ kind: 'remove-buff', id: 'enduring-ruin', when: { hit: 0 } }],
  },
  {
    id: 'shadow-imbued',
    notes: ['Shadow Imbued: +5% adrenaline per ranged hit (+10% with Natural Instinct); Corruption Shot DoT and Shadow Tendrils self-damage excluded (' + W + 'Shadow_Imbued )'],
    when: { style: 'Ranged', buff: 'shadow-imbued', gcd: true, excludeAbilities: ['corruption-shot'] },
    hitAdrenaline: 5,
  },
  {
    id: 'anima-dragon-breath',
    notes: ['Dragon Breath consumes Anima Charged with its hit (260–310% instead of 110–130%) (' + W + 'Anima_Charged )'],
    when: { abilities: ['dragon-breath'], buff: 'anima-charged' },
    onHit: [{ kind: 'remove-buff', id: 'anima-charged', when: { hit: 0 } }],
  },
  {
    id: 'flow-consume',
    notes: ['Flow: the next Magic ability that costs adrenaline costs 10% less and consumes it (' + W + 'Flow )'],
    when: { style: 'Magic', costing: true, buff: 'flow' },
    consumes: 'flow',
    discount: 10,
  },
  {
    id: 'flow-charged-consume',
    notes: ['Flow after an Anima Charged Sonic Wave: 35% less (' + W + 'Flow )'],
    when: { style: 'Magic', costing: true, buff: 'flow-charged' },
    consumes: 'flow-charged',
    discount: 35,
  },
  {
    id: 'greater-flow-consume',
    notes: ['Greater Flow: the next Magic ability that costs adrenaline costs 20% less (' + W + 'Greater_Flow )'],
    when: { style: 'Magic', costing: true, buff: 'greater-flow' },
    consumes: 'greater-flow',
    discount: 20,
  },
  {
    id: 'greater-flow-charged-consume',
    notes: ['Greater Flow after an Anima Charged Greater Sonic Wave: 45% less (' + W + 'Greater_Flow )'],
    when: { style: 'Magic', costing: true, buff: 'greater-flow-charged' },
    consumes: 'greater-flow-charged',
    discount: 45,
  },
  {
    id: 'concentrated-crit-consume',
    notes: ['The Concentrated Blast crit bonus applies to the next Magic ability and is then removed (' + W + 'Concentrated_Blast )'],
    when: { style: 'Magic', buff: 'concentrated-crit', gcd: true, excludeAbilities: ['concentrated-blast', 'greater-concentrated-blast', 'sunshine', 'greater-sunshine'] },
    consumes: 'concentrated-crit',
  },
  {
    id: 'chain-consume',
    notes: ['Chain is consumed by the next single-target Magic ability (AoE abilities neither copy nor consume) (' + W + 'Greater_Chain )'],
    when: { style: 'Magic', buff: 'chain', gcd: true, excludeAbilities: ['chain', 'greater-chain', 'dragon-breath', 'tsunami', 'magma-tempest', 'corruption-blast', 'sunshine', 'greater-sunshine', 'surge', 'runic-charge'] },
    consumes: 'chain',
  },
  {
    id: 'tsunami-crits',
    notes: ['Tsunami: every Magic critical strike generates +8% adrenaline (+16% with Natural Instinct) (' + W + 'Tsunami )'],
    when: { style: 'Magic', buff: 'tsunami', gcd: true },
    critAdrenaline: 8,
  },
  {
    id: 'natural-instinct',
    notes: ['Natural Instinct: adrenaline from basic abilities is doubled against monsters (' + W + 'Natural_Instinct )'],
    when: { generating: true, buff: 'natural-instinct', gcd: true },
    gainMult: 2,
  },
  {
    id: 'rampage-no-gain',
    notes: ['Dragon battleaxe Rampage: abilities generate no adrenaline while it is active (' + W + 'Rampage )'],
    when: { generating: true, buff: 'rampage' },
    gainMult: 0,
  },
];

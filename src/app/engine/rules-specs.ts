/**
 * Weapon special attack interactions – docs/research/special-attacks.md (state September 2026, post Combat Style
 * Modernisation). `ability` is the specs.json id; the damage roll, adrenaline cost, cooldown and style come from
 * specs.json (fetched from the wiki bucket), the rules add hit schedules, resources, buffs and debuffs.
 *
 * Fired through the "Weapon Special Attack" / "Essence of Finality" slots (the engine merges the slot's requirements
 * with the spec's rule) or as a "spec:<id>" rotation step. Not simulated anywhere: hit chance / accuracy bonuses,
 * healing, prayer points, PvP-only effects, area damage beyond the single target, stat drains (shown as debuffs only).
 */
import { AbilityRule } from './rules-model';

const W = 'https://runescape.wiki/w/';

/** 1-minute target debuff applied by the hit (Defence / hit chance drains are informational) */
function debuff(id: string, page: string, text: string): AbilityRule {
  return { ability: id, hits: [0], notes: [text + ' (' + W + page + ' )'], onHit: [{ kind: 'buff', id }] };
}

/** self-buff special without a hit */
function selfBuff(id: string, page: string, text: string, durationTicks?: number): AbilityRule {
  return { ability: id, notes: [text + ' (' + W + page + ' )'], onCast: [{ kind: 'buff', id, durationTicks }] };
}

/** plain damaging special: one or more hits with the specs.json roll */
function hit(id: string, page: string, text: string, hits: number[] = [0]): AbilityRule {
  return { ability: id, hits, notes: [text + ' (' + W + page + ' )'] };
}

export const SPEC_RULES: AbilityRule[] = [
  // ---------------------------------------------------------------- magic
  debuff('claws-of-guthix', 'Claws_of_Guthix', '25% adrenaline: 200–240% hit; target Defence −5% and base hit chance +5 for 1 minute (stacks with Obliterate). Common EoF adrenaline dump for magic'),
  debuff('devour', 'Devour', '50% adrenaline: 200–240% hit; target healing −50% for 25 ticks'),
  debuff('flames-of-zamorak', 'Flames_of_Zamorak', '25% adrenaline: 200–240% hit; target Magic −5% and hit chance −5% for 1 minute'),
  hit('from-the-shadows', 'From_the_Shadows', '50% adrenaline: a wight attacks 5 times for 55–65% every 4 ticks (first hit assumed 1 tick after the cast; the wiki gives no start tick)', [1, 5, 9, 13, 17]),
  hit('iban-blast', 'Iban_Blast', '50% adrenaline: one 340–390% hit'),
  {
    ability: 'instability',
    hits: [0],
    notes: [
      '50% adrenaline, 100-tick cooldown: 120–140% hit, then for 50 ticks every Magic critical strike fires a Lightning Surge of 70–90% one tick later; a surge never chains (' + W + 'Instability )',
      'Only magic weapons proc it; unequipping the staff does not remove the self-buff (' + W + 'Instability )',
    ],
    onCast: [{ kind: 'buff', id: 'instability' }],
  },
  debuff('miasmic-barrage', 'Miasmic_Barrage', '50% adrenaline: 200–240% to the target and up to 8 more within 1 tile; enemies hit attack 1 tick slower for 25 ticks'),
  selfBuff('power-of-darkness', 'Power_of_Darkness', '100% adrenaline, 150-tick cooldown (prose; the infobox says none): damage taken −25% and 25% reflected for 33 ticks; needs no target; survives weapon / amulet swaps'),
  selfBuff('power-of-light', 'Power_of_Light', '100% adrenaline: melee damage taken −50% for 1 minute; needs no target; works from an Essence of Finality without the staff and survives swaps'),
  hit('reap', 'Reap', '45% adrenaline: 270–310% hit; +20% adrenaline on a killing blow (not simulated – the session ends with the kill)'),
  hit('rune-flame', 'Rune_Flame', '35% adrenaline: 120–140% hit with +25% hit chance (hit chance not simulated); the rune-providing benefit of a mindspike is lost when it is sacrificed to an EoF'),
  hit('saradomin-strike', 'Saradomin_Strike', '25% adrenaline: 200–240% hit; PvP only: target prayer −30%'),
  {
    ability: 'soulfire',
    bleed: { hits: 6, everyTicks: 3, direct: true, damage: { min: 170, max: 200 } },
    notes: [
      '35% adrenaline, 75-tick cooldown: 130–160% opener (crits, Sunshine), then 6 burn hits of 170–200% every 3 ticks (damage over time); 30% in PvP (' + W + 'Soulfire )',
      'Grants Conflagrate: the next Combust within 25 ticks deals +40% (' + W + 'Soulfire )',
      'Song of Destruction / Essence Corruption may deal all of it at once and refresh the cooldown – not simulated (' + W + 'Soulfire )',
    ],
    onCast: [{ kind: 'buff', id: 'soulfire', refresh: true }, { kind: 'buff', id: 'conflagrate' }],
  },
  {
    ability: 'tempest-of-armadyl',
    channel: { ticks: 5, hits: [1, 2, 3, 4, 5], damageRamp: { min: 5, max: 5 } },
    notes: ['50% adrenaline, channelled: 5 hits on 5 consecutive ticks of 45–55%, each +5% (45–55, 50–60 … 65–75, 275–325% in total); cancelled by another ability (' + W + 'Tempest_of_Armadyl )'],
  },
  {
    ability: 'the-last-command',
    hits: [0],
    damageRules: [{ when: {}, perMissingLp: { per: 0.01, max: 0.75 } }],
    notes: ['35% adrenaline: 240–280% hit, +1% per 1% life points the target is missing (max +75%); 70% in PvP (' + W + 'The_Last_Command )'],
  },

  // ---------------------------------------------------------------- melee
  hit('aimed-strike', 'Aimed_Strike', '35% adrenaline: 150–170% hit with +20% hit chance (not simulated)'),
  hit('armadyl-s-judgement', "Armadyl's_Judgement", '50% adrenaline: one 400–480% hit'),
  debuff('backstab', 'Backstab', '75% adrenaline: 150–170% hit (+100% hit chance if the target is not attacking you); target Defence −8%, base hit chance +2 for 1 minute'),
  {
    ability: 'blackhole',
    bleed: { hits: 11, everyTicks: 3 },
    notes: [
      '50% adrenaline, 100-tick cooldown, needs no target: melee attacks deal 1.25x for 33 ticks while you stand in the 7x7; the target takes 35–45% every 3 ticks (up to 11 hits, treated as a bleed) (' + W + 'Blackhole )',
      'Berserk takes priority over the 1.25x; Rampage multiplies with it (1.5x); the buff survives weapon switches (' + W + 'Blackhole )',
    ],
    onCast: [{ kind: 'buff', id: 'blackhole' }],
  },
  debuff('clobber', 'Clobber', '30% adrenaline: 90–110% hit; target Defence −5%, Magic −5%, Magic damage −10%, base hit chance +3 for 1 minute'),
  hit('disrupt', 'Disrupt', "60% adrenaline: 230–270% 'Magic' damage to the target and up to 9 within 1 tile, calculated with melee modifiers (Berserk applies)"),
  hit('draconic-blow', 'Draconic_Blow', '20% adrenaline: one 240–280% hit'),
  hit('draconic-cleave', 'Draconic_Cleave', '25% adrenaline: one 275–315% hit'),
  hit('draconic-puncture', 'Draconic_Puncture', '50% adrenaline (the spec page prose says 25%): 2 hits of 125–155% with +15% hit chance', [0, 0]),
  {
    ability: 'draconic-slash',
    hits: [0],
    notes: ['50% adrenaline: 240–280% hit with +25% hit chance; +25% hit chance with slash weapons for 1 minute (not simulated) (' + W + 'Draconic_Slash )'],
    onCast: [{ kind: 'buff', id: 'draconic-slash' }],
  },
  hit('energy-drain', 'Energy_Drain', '50% adrenaline: 75–85% hit; PvP only: drains run energy'),
  hit('favour-of-the-war-god', 'Favour_of_the_War_God', '100% adrenaline: 125–145% hit; restores prayer points worth 10% of the damage (prayer points not simulated)'),
  hit('feint', 'Feint', '25% adrenaline: 255–295% hit with +75% hit chance (not simulated)'),
  selfBuff('fishstabber', 'Fishstabber', '100% adrenaline: Fishing +3 – no combat effect'),
  {
    ability: 'get-over-here',
    notes: ['75% adrenaline, no damage: stuns and binds the target for 10 ticks; PvP: pulls the target (' + W + 'Get_Over_Here! )'],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 10 }, { kind: 'buff', id: 'bound', durationTicks: 10 }],
  },
  {
    ability: 'gravitate',
    notes: [
      '60% adrenaline, needs no target: for 50 ticks every melee ability hit adds a Gravitate stack (auto-attacks 2), max 20, +1% melee damage per stack (not bleeds); stacks with Berserk multiplicatively (' + W + 'Gravitate )',
      'Stacks and buff are cleared by a weapon switch (' + W + 'Gravitate )',
    ],
    onCast: [{ kind: 'buff', id: 'gravitate' }],
  },
  hit('healing-blade', 'Healing_Blade', '50% adrenaline: 185–215% hit; heals 50% of the damage and restores prayer worth 2.5% (life / prayer points not simulated)'),
  {
    ability: 'ice-cleave',
    hits: [0],
    notes: ['60% adrenaline: 185–215% hit that binds the target for 16 ticks (' + W + 'Ice_Cleave )'],
    onHit: [{ kind: 'buff', id: 'bound', durationTicks: 16 }],
  },
  {
    ability: 'icy-tempest',
    hits: [0, 0],
    hitDamage: [{ min: 115, max: 135 }, { min: 175, max: 205 }],
    damageAddPerStack: { stack: 'primordial-ice', min: 18, max: 22 },
    cost: { perStack: { stack: 'primordial-ice', per: 12, maxStacks: 10, base: 30 } },
    notes: [
      '30% adrenaline required; the cost drops by 12% per Primordial Ice stack (free from 3 stacks); 25-tick cooldown (' + W + 'Icy_Tempest )',
      'A 115–135% hit plus a 175–205% hit to the target and up to 9 within 1 tile, each +18–22% per Primordial Ice stack; consumes all stacks (475% average at 10) (' + W + 'Icy_Tempest )',
      'No halberd 5x5 from an Essence of Finality (' + W + 'Icy_Tempest )',
    ],
  },
  {
    ability: 'igneous-showdown',
    hits: [0, 0, 0, 0],
    hitDamage: [{ min: 260, max: 300 }, { min: 245, max: 265, when: { flag: 'rival', item: 'ek-zekkil' } }, { min: 245, max: 265, when: { flag: 'rival', item: 'ek-zekkil' } }, { min: 245, max: 265, when: { flag: 'rival', item: 'ek-zekkil' } }],
    damageRules: [{ when: { flag: 'rival', item: 'ek-zekkil' }, mult: 1.12 }],
    notes: [
      '50% adrenaline, 100-tick cooldown (governed by the Igneous Strike debuff): 260–300% hit that marks the target as your Flamebound Rival (' + W + 'Igneous_Showdown )',
      'Against your Flamebound Rival with a wielded Ek-ZekKil: 3 more hits of 245–265% in the same tick, +15% adrenaline (30% under Natural Instinct) and Ashen Vow +12% – none of it from an Essence of Finality (' + W + 'Igneous_Showdown )',
    ],
    onCast: [
      {
        kind: 'choose',
        when: { buff: 'flamebound-rival' },
        then: [
          { kind: 'flag', flag: 'rival', value: true },
          { kind: 'adrenaline', amount: 15, when: { item: 'ek-zekkil', notBuff: 'natural-instinct' } },
          { kind: 'adrenaline', amount: 30, when: { item: 'ek-zekkil', buff: 'natural-instinct' } },
        ],
      },
      { kind: 'buff', id: 'flamebound-rival', refresh: true },
    ],
  },
  hit('impale', 'Impale', '25% adrenaline: 130–150% hit with +10% hit chance (not simulated)'),
  {
    ability: 'liquefy',
    hits: [0],
    notes: ['50% adrenaline: 125–145% hit; Attack, Strength and Defence +3 +10% for 1 minute (stat boosts not simulated) (' + W + 'Liquefy )'],
    onCast: [{ kind: 'buff', id: 'liquefy' }],
  },
  debuff('obliterate', 'Obliterate', "50% adrenaline: 160–180% hit; target Defence −30% and base hit chance +5 for 1 minute (stacks with Claws of Guthix). Formerly 'Smash'; the EoF copy never degrades"),
  hit('powerstab', 'Powerstab', '50% adrenaline: 260–320% to everything within 2 tiles (7x7 with a halberd via EoF)'),
  {
    ability: 'quick-smash',
    offGcd: true,
    hits: [0],
    notes: ['50% adrenaline: 115–135% hit that can be cast during the global cooldown and does not start one (also from an Essence of Finality since 29 Nov 2021) (' + W + 'Quick_Smash )'],
  },
  {
    ability: 'rampage',
    notes: ['100% adrenaline, needs no target: melee damage 1.2x for 1 minute (multiplies with Berserk / Blackhole), hit chance −10%, other combat stats −10% (' + W + 'Rampage )'],
    onCast: [{ kind: 'buff', id: 'rampage' }],
  },
  hit('saradomin-s-lightning', "Saradomin's_Lightning", "100% adrenaline: 2 hits of 285–325% 'Magic' damage with melee modifiers", [0, 0]),
  {
    ability: 'shove',
    notes: ['25% adrenaline, no damage: stuns and binds the target for 6 ticks and knocks it back 1 tile (' + W + 'Shove )'],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 6 }, { kind: 'buff', id: 'bound', durationTicks: 6 }],
  },
  {
    ability: 'slice-dice',
    hits: [0, 0, 0, 0],
    hitDamage: [{ min: 180, max: 220 }, { min: 90, max: 110 }, { min: 45, max: 55 }, { min: 45, max: 55 }],
    notes: ['50% adrenaline: 4 hits of 180–220%, 90–110%, 45–55%, 45–55% (400% average); needs main-hand and off-hand claws, also for the EoF (' + W + 'Slice_%26_Dice )'],
  },
  {
    ability: 'spear-wall',
    hits: [0],
    notes: ['50% adrenaline: 105–125% to the target and up to 9 within 1 tile; damage taken −50% and 50% reflected for 8 ticks (' + W + 'Spear_Wall )'],
    onCast: [{ kind: 'buff', id: 'spear-wall' }],
  },
  debuff('sunder', 'Sunder', '50% adrenaline: 125–145% hit; base hit chance against the target +4 and its damage −10% for 1 minute'),
  {
    ability: 'sunfall-slam',
    hits: [0],
    notes: ["40% adrenaline, 100-tick cooldown: 290–300% to the target and up to 9 within 2 tiles; for 50 ticks melee abilities trigger Lesser Purifying Light – 45–55% to up to 2 extra enemies, nothing on a single target (" + W + 'Sunfall_Slam )'],
    onCast: [{ kind: 'buff', id: 'lesser-purifying-light' }],
  },
  hit('sweep', 'Sweep', '30% adrenaline: 2 hits of 120–150% in a cone (2x3 without halberd range via EoF)', [0, 0]),
  {
    ability: 'the-final-flurry',
    hits: [0, 0, 0],
    hitDamage: [{ min: 80, max: 100 }, { min: 80, max: 100 }, { min: 150, max: 180 }],
    hitCrit: [{ chanceAdd: 0.25, damageAdd: 0.25 }, { chanceAdd: 0.25, damageAdd: 0.25 }, { chanceAdd: 0.5, damageAdd: 0.5 }],
    notes: ['50% adrenaline: 3 hits of 80–100%, 80–100% and 150–180%; hits 1–2 +25% critical strike chance and damage, hit 3 +50% (491.25% average with crits) (' + W + 'The_Final_Flurry )'],
  },
  {
    ability: 'vine-call',
    bleed: { hits: 10, everyTicks: 3, direct: true, damage: { min: 20, max: 25 } },
    notes: [
      '60% adrenaline, 33-tick cooldown (prose; the infobox says none): 100–120% hit, then a 3x3 jade vine hits everything inside for 20–25% every 3 ticks, 10 times (treated as a bleed) (' + W + 'Vine_Call )',
      'No 5x5 with a halberd and no Masterwork Spear of Annihilation extension from an Essence of Finality (' + W + 'Vine_Call )',
    ],
    onCast: [{ kind: 'buff', id: 'vine-call', refresh: true }],
  },
  debuff('warstrike', 'Warstrike', "100% adrenaline: 225–265% hit; drains the target's combat stats by 0.5% of the damage"),
  debuff('weaken', 'Weaken_(special_attack)', '50% adrenaline: 75–85% hit; target Attack, Strength, Defence, hit chance and damage −6% (2x against demons) for 1 minute'),

  // ---------------------------------------------------------------- necromancy
  {
    ability: 'death-essence',
    hits: [0],
    notes: [
      '30% adrenaline, 100-tick cooldown: 360–440% hit; readies Death Spark on cast and for 50 ticks Touch of Death, Finger of Death and Death Skulls immediately ready it (' + W + 'Death_Essence )',
      'Death Spark needs a wielded Omni guard; the buff is removed by a main-hand swap; the wiki does not say whether the EoF copy works (' + W + 'Death_Spark_(status) )',
    ],
    onCast: [{ kind: 'buff', id: 'death-essence' }, { kind: 'stack-set', stack: 'death-spark', amount: 5, when: { item: 'omni-guard' } }],
  },
  {
    ability: 'death-grasp',
    hits: [0],
    damageAddPerStack: { stack: 'necrosis', min: 40, max: 40 },
    notes: ['25% adrenaline, 50-tick cooldown (shown as the Death guard debuff): 405–495% hit +40% per Necrosis stack (930% average at 12), consumes all Necrosis; stuns and binds for 8 ticks; 40% in PvP (' + W + 'Death_Grasp )'],
    onCast: [{ kind: 'consume-stack', stack: 'necrosis', amount: 'all' }],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 8 }, { kind: 'buff', id: 'bound', durationTicks: 8 }],
  },
  {
    ability: 'soul-crush',
    hits: [0],
    damageAddPerStack: { stack: 'residual-souls', min: 135, max: 165 },
    notes: [
      '25% adrenaline, 100-tick cooldown: 135–165% hit +135–165% per Residual Soul (900% average at 5), consumes all souls; 40% in PvP (' + W + 'Soul_Crush )',
      "Readies Soul Reave on cast and for 50 ticks Soul Sap, Soul Strike, Volley of Souls and Spectral Scythe immediately ready it; needs a wielded Devourer's Guard; removed by a main-hand swap (" + W + 'Soul_Reave )',
    ],
    onCast: [{ kind: 'consume-stack', stack: 'residual-souls', amount: 'all' }, { kind: 'buff', id: 'soul-crush' }, { kind: 'stack-set', stack: 'soul-reave', amount: 4, when: { item: 'devourer-s-guard' } }],
  },

  // ---------------------------------------------------------------- ranged
  {
    ability: 'aimed-shot',
    channel: { ticks: 5, hits: [5] },
    notes: ['35% adrenaline, channelled for 5 ticks, then one 300–360% hit with +75% hit chance; another ability cancels it (' + W + 'Aimed_Shot )'],
  },
  {
    ability: 'balance-by-force',
    hits: [0],
    notes: [
      '30% adrenaline, no cooldown: 235–255% hit (70% in PvP); for 50 ticks Perfect Equilibrium needs 4 stacks instead of 8; with 3+ stacks the spec hit triggers the passive (' + W + 'Balance_by_Force )',
      'The Perfect Equilibrium passive (12–16% + 33–37% of the triggering hit at 8 stacks) is not simulated and never triggers from an Essence of Finality (' + W + 'Perfect_Equilibrium )',
    ],
    onCast: [{ kind: 'buff', id: 'balance-by-force' }],
  },
  hit('balanced-shot', 'Balanced_Shot', '35% adrenaline: 170–190% hit; heals 60% of it over 25 ticks and adds 55–65% Magic damage with Guthix arrows (healing and ammunition not simulated)'),
  hit('chain-hit', 'Chain_Hit', '10% adrenaline: 55–65% hit that bounces up to 3 times between enemies within 3 tiles (single target: one hit); not affected by Locate / chinchompas'),
  {
    ability: 'crystal-rain',
    hits: [0, 1, 1, 1, 1],
    hitDamage: [{ min: 125, max: 155 }, { min: 125, max: 155, when: { chance: 0.04 } }, { min: 125, max: 155, when: { chance: 0.04 } }, { min: 125, max: 155, when: { chance: 0.04 } }, { min: 125, max: 155, when: { chance: 0.04 } }],
    notes: [
      '30% adrenaline, 50-tick cooldown once the first arrow hits: 5 arrows of 125–155%; arrow 1 always lands on the target, arrows 2–5 a tick later somewhere in the 5x5 (4% each against a 1x1 target) (' + W + 'Crystal_Rain )',
      'Works with chinchompas / Locate from an Essence of Finality; ammunition effects only on arrow 1 (' + W + 'Crystal_Rain )',
    ],
  },
  {
    ability: 'deep-burn',
    hits: [0],
    notes: ['25% adrenaline: 180–210% hit, stuns and binds for 5 ticks, then 6 hits every 2 ticks of 12.5% of the damage stored by Dark Burn (50% of damage taken) – 0 in the trainer (' + W + 'Deep_Burn )'],
    onHit: [{ kind: 'buff', id: 'stunned', durationTicks: 5 }, { kind: 'buff', id: 'bound', durationTicks: 5 }, { kind: 'buff', id: 'deep-burn' }],
  },
  hit('defiance', 'Defiance', '40% adrenaline: 225–275% hit; PvP only: +10% per active prayer'),
  hit('descent-of-darkness', 'Descent_of_Darkness', '65% adrenaline: 2 hits of 190–230%', [0, 0]),
  hit('destructive-shot', 'Destructive_Shot', '40% adrenaline: 2 hits of 160–180%; +55–65% Magic damage with Zamorak arrows (not simulated; via EoF they cap the damage at tier 55)', [0, 0]),
  hit('hamstring', 'Hamstring', '50% adrenaline: 150–170% hit; PvP only: no movement abilities for 9 s'),
  selfBuff('locate', 'Locate', '35% adrenaline, needs no target: for 18 ticks single-target ranged attacks also hit up to 5 enemies within 3 tiles; ends on a main-hand swap; must be cast from an equipped Decimation or the EoF'),
  selfBuff('mirrorback', 'Mirrorback', '100% adrenaline: a mirrorback spider halves damage taken and reflects 50% for 16 ticks (cap 10,000)'),
  {
    ability: 'phantom-strike',
    bleed: { hits: 6, everyTicks: 3, direct: true, damage: { min: 30, max: 40 } },
    notes: ['50% adrenaline: 120–140% hit, then 6 damage-over-time hits of 30–40% every 3 ticks (' + W + 'Phantom_strike )'],
    onCast: [{ kind: 'buff', id: 'phantom-strike', refresh: true }],
  },
  hit('powershot', 'Powershot', '35% adrenaline: 210–230% hit with +40% hit chance (not simulated)'),
  hit('restorative-shot', 'Restorative_Shot', '30% adrenaline: 135–145% hit; heals 100% of it over 25 ticks and adds 55–65% Magic damage with Saradomin arrows (not simulated)'),
  {
    ability: 'shadowfall',
    hits: [0, 0, 1],
    hitDamage: [{ min: 85, max: 105 }, { min: 85, max: 105 }, { min: 255, max: 295 }],
    notes: ['65% adrenaline: 2 arrows of 85–105% that mark the target, then the shadows strike for 255–295% (assumed 1 tick later; the wiki gives no timing) (' + W + 'Shadowfall )'],
  },
  debuff('soulshot', 'Soulshot', "50% adrenaline: 100–120% hit +2–200% by the target's Magic level (target levels are not simulated: base roll only); target Magic −5%"),
  {
    ability: 'split-soul',
    notes: ['25% adrenaline, needs no target: for 25 ticks 400% of what Soul Split would heal is dealt to the target instead; tied to the main-hand weapon (off-hand may be swapped); amulet of souls / EoF +18.75% average (not simulated) (' + W + 'Split_Soul_(special_attack) )'],
    onCast: [{ kind: 'buff', id: 'split-soul', durationTicks: 25 }],
  },
  hit('twin-shot', 'Twin_Shot', '35% adrenaline: 2 hits of 55–65% with +50% hit chance', [0, 0]),
  hit('twin-fang', 'Twin_fang', '50% adrenaline: 2 hits of 115–145% with −30% hit chance', [0, 0]),
];

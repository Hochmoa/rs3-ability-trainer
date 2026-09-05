/**
 * Familiar special moves (scrolls) – runescape.wiki familiar and scroll pages, state September 2026. A scroll is a
 * "special:<scroll id>" entity (public/data/familiars.json via DataService.scrollSpecial): off the global cooldown, costs
 * special move points instead of adrenaline and needs its familiar out (Loadout.familiar). `ability` is the scroll id.
 *
 * The familiar's own attacks are timed by the engine from familiars.json (like conjured spirits); only the scroll
 * effects live here. Healing and stuns are not simulated (nihil accuracy: loadout-resolver.ts) – those scrolls just spend their points.
 */
import { AbilityRule, BuffDef } from './rules-model';

const W = 'https://runescape.wiki/w/';

export const FAMILIAR_BUFFS: BuffDef[] = [
  { id: 'crit-i-kal', name: 'Crit-i-Kal', kind: 'Buff', on: 'self', durationTicks: 100, crit: { add: 0.05 },
    text: "Kal'gerion demon scroll: +5% critical strike chance for 60 seconds, every style. Recasting refreshes it.", source: W + "Kal'gerion_demon_(familiar)" },
  { id: 'death-from-above', name: 'Death From Above', kind: 'Buff', on: 'self', durationTicks: null, untilConsumed: true,
    text: "Ripper Demon scroll: the familiar's next attack deals 200–320% of its max hit.", source: W + 'Ripper_Demon_(familiar)' },
];

/** scroll without a simulated effect: spends its special move points (and starts its cooldown, if any) */
function pointsOnly(id: string, page: string, text: string): AbilityRule {
  return { ability: id, notes: [text + ' (' + W + page + ' )'] };
}

export const SCROLL_RULES: AbilityRule[] = [
  {
    ability: 'crit-i-kal',
    notes: ["30 special move points: +5% critical strike chance for 60 seconds (100 ticks) for you and allies in a 7x7; recasting refreshes it (" + W + "Kal'gerion_demon_(familiar) )"],
    onCast: [{ kind: 'buff', id: 'crit-i-kal', refresh: true }],
  },
  {
    ability: 'death-from-above',
    notes: ['20 special move points: the Ripper Demon jumps up and its next attack deals 200–320% of its max hit (' + W + 'Ripper_Demon_(familiar) )'],
    onCast: [{ kind: 'buff', id: 'death-from-above' }],
  },
  pointsOnly('blood-siphon', 'Blood_reaver_(familiar)', "15 special move points, 3 s cooldown: transfers 5% of the familiar's max life points (up to 1,000) to you – healing is not simulated"),
  pointsOnly('annihilate-blood', 'Blood_nihil_(familiar)', '20 special move points: attacks the target with a 50–60% chance to stun it for 3.6 s – the wiki gives no damage numbers, nothing extra is dealt'),
  pointsOnly('annihilate-ice', 'Ice_nihil_(familiar)', '20 special move points: attacks the target with a 50–60% chance to stun it for 3.6 s – the wiki gives no damage numbers, nothing extra is dealt'),
  pointsOnly('annihilate-smoke', 'Smoke_nihil_(familiar)', '20 special move points: attacks the target with a 50–60% chance to stun it for 3.6 s – the wiki gives no damage numbers, nothing extra is dealt'),
  pointsOnly('annihilate-shadow', 'Shadow_nihil_(familiar)', '20 special move points: attacks the target with a 50–60% chance to stun it for 3.6 s – the wiki gives no damage numbers, nothing extra is dealt'),
  pointsOnly('soul-food', 'Hellhound_(familiar)', '6 special move points: heals the hellhound for 10% of its max life points – not simulated'),
  pointsOnly('mammoth-feast', 'Pack_mammoth', "6 special move points: eats a piece of food from the mammoth's inventory and heals you without draining adrenaline – not simulated"),
];

const SCROLL_RULE_BY_ID = new Map(SCROLL_RULES.map((r) => [r.ability, r]));

export function scrollRuleFor(scrollId: string): AbilityRule | undefined {
  return SCROLL_RULE_BY_ID.get(scrollId);
}

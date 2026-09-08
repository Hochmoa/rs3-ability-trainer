/**
 * The Invention gizmo combinations PvM players actually use – what the Loadout page offers instead of letting a
 * gizmo be composed perk by perk (in the game one is bound to such combos too). Sources: the PvME perks guide
 * (github.com/pvme/pvme-guides, invention-and-perks/perks.txt, state 2026-07-27, the current recommendation
 * embeds) and runescape.wiki "Optimal PvM perk setup" (researched 2026-09-08).
 *
 * Naming follows PvME: P6AS1 = Precise 6 + Aftershock 1, AS4E2 = Aftershock 4 + Eruptive 2 (Eruptive is the
 * renamed old Equilibrium; the Equilibrium of 2026 is the necromancy armour perk that prevents crits).
 *
 * `tier` is the order the picker lists them in: bis → common → budget → niche.
 */
import { Gizmo, GizmoPerk, Perk } from './models';

export type GizmoType = 'weapon' | 'armour';
export type ComboTier = 'bis' | 'common' | 'budget' | 'niche';

export interface GizmoCombo {
  /** PvME shorthand, unique: "p6as1", "b4mobile" */
  id: string;
  type: GizmoType;
  /** "P6AS1" */
  short: string;
  perks: GizmoPerk[];
  /** ancient gizmo (Precise 6, Aftershock 4, rank 4 armour perks, Relentless, Ruthless need one) */
  ancient: boolean;
  tier: ComboTier;
  /** where PvME puts it: "main hand", "off-hand", "2h gizmo 1", "body", "legs", "shield" */
  where: string;
  /** one line of PvME context */
  note?: string;
}

const TIER_RANK: Record<ComboTier, number> = { bis: 0, common: 1, budget: 2, niche: 3 };

const w = (id: string, short: string, perks: [string, number][], tier: ComboTier, where: string, note?: string, ancient = true): GizmoCombo => ({
  id,
  type: 'weapon',
  short,
  perks: perks.map(([perk, rank]) => ({ perk, rank })),
  ancient,
  tier,
  where,
  note,
});
const a = (id: string, short: string, perks: [string, number][], tier: ComboTier, where: string, note?: string, ancient = true): GizmoCombo => ({ ...w(id, short, perks, tier, where, note, ancient), type: 'armour' });

export const GIZMO_COMBOS: GizmoCombo[] = [
  // ---------------------------------------------------------------- weapons
  w('p6as1', 'P6AS1', [['precise', 6], ['aftershock', 1]], 'bis', 'main hand · 2h gizmo 1', 'the standard main-hand gizmo of every style'),
  w('as4e2', 'AS4E2', [['aftershock', 4], ['eruptive', 2]], 'bis', 'off-hand · 2h gizmo 2', 'the standard off-hand / second 2h gizmo; defenders and reprisers too'),
  w('p6r1', 'P6R1', [['precise', 6], ['ruthless', 1]], 'bis', '2h gizmo 1', 'melee two-handers (Ek-ZekKil, masterwork 2h)'),
  w('p6c1', 'P6C1', [['precise', 6], ['caroming', 1]], 'bis', '2h gizmo 1', 'ranged two-handers (Bow of the Last Guardian, Eldritch crossbow)'),
  w('p6u4', 'P6U4', [['precise', 6], ['ultimatums', 4]], 'bis', '2h gizmo 1', 'Fractured Staff of Armadyl'),
  w('c4e2', 'C4E2', [['caroming', 4], ['eruptive', 2]], 'bis', 'off-hand', 'ranged off-hand with Greater Ricochet; magic caroming switch'),
  w('as4p2', 'AS4P2', [['aftershock', 4], ['precise', 2]], 'common', '2h gizmo 1 · main hand', 'halberds and AoE weapons (Tumeken’s Light, Laniakea’s spear), necromancy AoE'),
  w('e4r3', 'E4R3', [['eruptive', 4], ['ruthless', 3]], 'common', '2h gizmo 2 · off-hand', 'AoE / Slayer second gizmo'),
  w('c4as1', 'C4AS1', [['caroming', 4], ['aftershock', 1]], 'common', 'main hand', 'Greater Ricochet switch, Roar of Awakening'),
  w('f4e1', 'F4E1', [['flanking', 4], ['eruptive', 1]], 'common', 'off-hand', 'the flanking switch'),
  w('l4e2', 'L4E2', [['lunging', 4], ['eruptive', 2]], 'common', '2h gizmo 2 · off-hand', 'Masterwork Spear of Annihilation, Ode to Deceit'),
  w('as1pf', 'AS1PF', [['aftershock', 1], ['planted-feet', 1]], 'common', 'switch', 'Planted Feet switch (Sunspear, Ancient lantern), a standard gizmo is enough', false),
  w('p6', 'P6', [['precise', 6]], 'budget', 'main hand · 2h gizmo 1', 'the starter main-hand gizmo'),
  w('e4', 'E4', [['eruptive', 4]], 'budget', 'off-hand · 2h gizmo 2', 'the starter off-hand gizmo; defenders'),
  w('f4', 'F4', [['flanking', 4]], 'budget', 'switch', 'starter flanking switch'),
  w('pf', 'PF', [['planted-feet', 1]], 'budget', 'switch', 'starter Planted Feet switch, standard gizmo', false),
  w('l4as1', 'L4AS1', [['lunging', 4], ['aftershock', 1]], 'niche', 'main hand'),
  w('c4pf', 'C4PF', [['caroming', 4], ['planted-feet', 1]], 'niche', 'switch', 'magic Planted Feet switch'),
  w('as4pf', 'AS4PF', [['aftershock', 4], ['planted-feet', 1]], 'niche', 'switch'),
  w('as4i2', 'AS4I2', [['aftershock', 4], ['invigorating', 2]], 'niche', 'off-hand'),
  w('c4p2', 'C4P2', [['caroming', 4], ['precise', 2]], 'niche', 'off-hand'),
  w('p6e2', 'P6E2', [['precise', 6], ['eruptive', 2]], 'niche', '2h gizmo 1', 'expensive alternative to P6AS1'),
  w('p6e1', 'P6E1', [['precise', 6], ['eruptive', 1]], 'niche', '2h gizmo 1'),
  w('p6l1', 'P6L1', [['precise', 6], ['lunging', 1]], 'niche', 'main hand'),
  w('p6mobile', 'P6 Mobile', [['precise', 6], ['mobile', 1]], 'niche', 'defender'),
  w('as1', 'AS1', [['aftershock', 1]], 'niche', 'switch', 'spec-weapon switches'),
  w('as1mobile', 'AS1 Mobile', [['aftershock', 1], ['mobile', 1]], 'niche', 'off-hand', 'spec-weapon off-hand'),
  w('f4p2', 'F4P2', [['flanking', 4], ['precise', 2]], 'niche', 'off-hand'),
  w('pfmobile', 'PF Mobile', [['planted-feet', 1], ['mobile', 1]], 'niche', 'switch', 'Enhanced Excalibur', false),
  // ---------------------------------------------------------------- armour
  a('b4mobile', 'B4 Mobile', [['biting', 4], ['mobile', 1]], 'bis', 'body', 'the standard body gizmo 1 (melee, ranged, magic)'),
  a('relent5crack4', 'R5C4', [['relentless', 5], ['crackling', 4]], 'bis', 'body', 'the standard body gizmo 2 (melee, ranged, magic)'),
  a('imp4devo4', 'I4D4', [['impatient', 4], ['devoted', 4]], 'bis', 'legs', 'the standard legs gizmo 1'),
  a('ult4mobile', 'U4 Mobile', [['ultimatums', 4], ['mobile', 1]], 'bis', 'legs', 'legs gizmo 2 (melee, ranged)'),
  a('energising4invig3', 'En4In3', [['energising', 4], ['invigorating', 3]], 'bis', 'legs', 'legs gizmo 2 (magic)'),
  a('eq4mobile', 'EQ4 Mobile', [['equilibrium', 4], ['mobile', 1]], 'bis', 'body', 'necromancy body gizmo 1 (Equilibrium prevents crits, so never with Biting or the Dracolich set)'),
  a('c4u4', 'C4U4', [['crackling', 4], ['ultimatums', 4]], 'bis', 'body', 'necromancy body gizmo 2'),
  a('invig4mobile', 'In4 Mobile', [['invigorating', 4], ['mobile', 1]], 'bis', 'legs', 'necromancy legs gizmo 2'),
  a('b4undead', 'B4 Undead Slayer', [['biting', 4], ['undead-slayer', 1]], 'common', 'body', 'undead bosses (Rasial, Vorkath, Hermod)'),
  a('b4demon', 'B4 Demon Slayer', [['biting', 4], ['demon-slayer', 1]], 'common', 'body'),
  a('b4dragon', 'B4 Dragon Slayer', [['biting', 4], ['dragon-slayer', 1]], 'common', 'body'),
  a('b4geno', 'B4 Genocidal', [['biting', 4], ['genocidal', 1]], 'common', 'body', 'Slayer tasks'),
  a('b4reflexes', 'B4 Reflexes', [['biting', 4], ['reflexes', 1]], 'common', 'body'),
  a('b4cs1', 'B4CS1', [['biting', 4], ['crystal-shield', 1]], 'common', 'body'),
  a('imp4mobile', 'I4 Mobile', [['impatient', 4], ['mobile', 1]], 'common', 'legs'),
  a('imp4undead', 'I4 Undead Slayer', [['impatient', 4], ['undead-slayer', 1]], 'common', 'legs'),
  a('imp4geno', 'I4 Genocidal', [['impatient', 4], ['genocidal', 1]], 'common', 'legs'),
  a('ult4undead', 'U4 Undead Slayer', [['ultimatums', 4], ['undead-slayer', 1]], 'common', 'legs'),
  a('ult4geno', 'U4 Genocidal', [['ultimatums', 4], ['genocidal', 1]], 'common', 'legs'),
  a('ult4energising2', 'U4En2', [['ultimatums', 4], ['energising', 2]], 'common', 'legs'),
  a('eq4undead', 'EQ4 Undead Slayer', [['equilibrium', 4], ['undead-slayer', 1]], 'common', 'body', 'necromancy at undead bosses'),
  a('eq4geno', 'EQ4 Genocidal', [['equilibrium', 4], ['genocidal', 1]], 'common', 'body'),
  a('invig4undead', 'In4 Undead Slayer', [['invigorating', 4], ['undead-slayer', 1]], 'common', 'legs'),
  a('relent3crack4', 'C4R3', [['crackling', 4], ['relentless', 3]], 'common', 'body', 'cheaper than R5C4'),
  a('ed4', 'ED4', [['enhanced-devoted', 4]], 'common', 'legs', 'takes both slots; legs gizmo 2 alternative'),
  a('turt4', 'T4', [['turtling', 4]], 'bis', 'shield', 'the shield gizmo'),
  a('turt4ult4', 'T4U4', [['turtling', 4], ['ultimatums', 4]], 'common', 'shield'),
  a('turt4mobile', 'T4 Mobile', [['turtling', 4], ['mobile', 1]], 'common', 'shield'),
  a('lucky4abs2', 'L4Abs2', [['lucky', 4], ['absorbative', 2]], 'common', 'shield', 'spirit shields'),
  a('crack4', 'C4', [['crackling', 4]], 'budget', 'legs', 'starter legs gizmo 1'),
  a('b3', 'B3', [['biting', 3]], 'budget', 'body', 'starter body (standard gizmo)', false),
  a('eq1', 'EQ1', [['equilibrium', 1]], 'budget', 'body', 'starter body (standard gizmo, guaranteed at level 76+)', false),
  a('eq2', 'EQ2', [['equilibrium', 2]], 'budget', 'body', 'entry necromancy body', false),
  a('imp4', 'I4', [['impatient', 4]], 'budget', 'body · legs', 'starter (7 zamorak + 2 saradomin components)'),
  a('ed3', 'ED3', [['enhanced-devoted', 3]], 'budget', 'legs', 'standard gizmo', false),
  a('b2mobile', 'B2 Mobile', [['biting', 2], ['mobile', 1]], 'budget', 'body', 'standard gizmo', false),
  a('b2geno', 'B2 Genocidal', [['biting', 2], ['genocidal', 1]], 'budget', 'body', 'standard gizmo', false),
  a('b4', 'B4', [['biting', 4]], 'niche', 'body'),
  a('eq4', 'EQ4', [['equilibrium', 4]], 'niche', 'body'),
  a('invig4', 'In4', [['invigorating', 4]], 'niche', 'legs'),
  a('cs4', 'CS4', [['crystal-shield', 4]], 'niche', 'legs', 'tank'),
  a('abs4', 'Abs4', [['absorbative', 4]], 'niche', 'body', 'tank'),
  a('clearheaded4', 'CH4', [['clear-headed', 4]], 'niche', 'legs'),
  a('lucky6', 'L6', [['lucky', 6]], 'niche', 'body', 'Eldritch crossbow / Soul Split setups'),
  a('b4lucky1', 'B4L1', [['biting', 4], ['lucky', 1]], 'niche', 'body'),
  a('demonundead', 'Demon + Undead Slayer', [['demon-slayer', 1], ['undead-slayer', 1]], 'niche', 'any', 'Slayer, standard gizmo', false),
  a('genoundead', 'Genocidal + Undead Slayer', [['genocidal', 1], ['undead-slayer', 1]], 'niche', 'any', 'Slayer, standard gizmo', false),
];

/** the combos of one gizmo type, best first */
export function combosFor(type: GizmoType): GizmoCombo[] {
  return GIZMO_COMBOS.filter((c) => c.type === type).sort((x, y) => TIER_RANK[x.tier] - TIER_RANK[y.tier]); // stable: the table's order inside a tier
}

function sameKey(perks: GizmoPerk[]): string {
  return [...perks].map((p) => p.perk + ':' + p.rank).sort().join('|');
}

/** The combo a stored gizmo is, if it is one (the ancient flag is not compared – the perks decide). */
export function comboOf(g: Pick<Gizmo, 'perks'> | undefined): GizmoCombo | null {
  if (!g?.perks.length) return null;
  const key = sameKey(g.perks);
  return GIZMO_COMBOS.find((c) => sameKey(c.perks) === key) ?? null;
}

/** the gizmo a combo makes */
export function gizmoOf(c: GizmoCombo): Gizmo {
  return { ancient: c.ancient, perks: c.perks.map((p) => ({ ...p })) };
}

/** "Precise 6 + Aftershock 1" from the perk names (perks.json), the id when a perk is unknown */
export function comboLabel(perks: GizmoPerk[], perkById: Map<string, Perk>): string {
  return perks.map((p) => (perkById.get(p.perk)?.name ?? p.perk) + (p.rank > 1 || perkById.get(p.perk)?.maxRank !== 1 ? ' ' + p.rank : '')).join(' + ');
}

export const COMBO_TIER_LABEL: Record<ComboTier, string> = { bis: 'best in slot', common: 'common', budget: 'budget', niche: 'niche' };

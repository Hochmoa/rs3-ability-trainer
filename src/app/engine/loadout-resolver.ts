/**
 * Turns a saved Loadout (worn items, perks on them, relics) into the numbers the engine uses.
 * Effect kinds are the ones written in public/data/set-effects.json and perks.json.
 */
import { EquipSlot, Familiar, GearItem, Gizmo, ItemRef, Loadout, Perk, SetEffect, Style, WEAPON_SETS, Weapon, WeaponSpec, loadoutWield } from '../core/models';
import { abilityDamageOf } from './damage';
import { ruleFor } from './rules';
import { FORTIFIED_BONES_BONUS } from './rules-necromancy';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import type { EngineEntity } from './trainer-engine';

export interface LoadoutData {
  weaponById: Map<string, Weapon>;
  specById: Map<string, WeaponSpec>;
  perkById: Map<string, Perk>;
  setEffectById: Map<string, SetEffect>;
  /** gear.json (armour, jewellery ...); missing = only weapons are known */
  gearById?: Map<string, GearItem>;
  /** familiars.json; missing = the loadout's familiar is ignored */
  familiarById?: Map<string, Familiar>;
  specEntity: (spec: WeaponSpec) => EngineEntity;
}

/** The worn items with the data behind them. */
interface Worn {
  two: Weapon | null;
  main: Weapon | null;
  off: Weapon | null;
  /** worn gear items (not weapons) */
  gear: { slot: EquipSlot; ref: ItemRef; item: GearItem }[];
  /** gizmos with the type of gizmo they hold */
  gizmos: { type: 'weapon' | 'armour'; label: string; gizmo: Gizmo }[];
  /** set id -> pieces worn */
  sets: Map<string, number>;
  /** passive ids of worn items (rings, capes, weapon passives) */
  passives: Set<string>;
  eofSpec: string | null;
}

function worn(l: Loadout, data: LoadoutData): Worn {
  const w = loadoutWield(l);
  const two = w.twoHand ? data.weaponById.get(w.twoHand) ?? null : null;
  const main = w.mainHand ? data.weaponById.get(w.mainHand) ?? null : null;
  const off = w.offHand ? data.weaponById.get(w.offHand) ?? null : null;
  const out: Worn = { two, main, off, gear: [], gizmos: [], sets: new Map(), passives: new Set(), eofSpec: null };
  const eq = l.equipment ?? {};
  const legacy = !l.equipment;
  for (const wp of [two, main, off]) {
    if (!wp) continue;
    if (data.setEffectById.get(wp.id)?.kind === 'item') out.passives.add(wp.id);
    const set = WEAPON_SETS[wp.id];
    if (set) out.sets.set(set, (out.sets.get(set) ?? 0) + 1);
  }
  for (const [slot, ref] of Object.entries(eq) as [EquipSlot, ItemRef | null | undefined][]) {
    if (!ref) continue;
    if (ref.kind === 'gear') {
      const item = data.gearById?.get(ref.id);
      if (!item) continue;
      out.gear.push({ slot, ref, item });
      if (item.set) out.sets.set(item.set, (out.sets.get(item.set) ?? 0) + 1);
      if (item.passive) out.passives.add(item.passive);
      if (item.passive === 'essence-of-finality') out.eofSpec = ref.spec ?? l.eofSpec ?? null;
      for (const g of ref.gizmos ?? []) out.gizmos.push({ type: 'armour', label: item.name, gizmo: g });
    } else if (ref.kind === 'weapon') {
      const wp = data.weaponById.get(ref.id);
      const type = wp?.slot === 'shield' ? 'armour' : 'weapon';
      for (const g of ref.gizmos ?? []) out.gizmos.push({ type, label: wp?.name ?? ref.id, gizmo: g });
    }
  }
  if (legacy) {
    // loadouts saved before the inventory: flags instead of items
    for (const id of l.items ?? []) out.passives.add(id);
    if (l.armourSet) out.sets.set(l.armourSet, l.armourPieces);
    out.eofSpec = l.eofSpec;
    (l.weaponGizmos ?? []).forEach((g, i) => out.gizmos.push({ type: 'weapon', label: 'Weapon gizmo ' + (i + 1), gizmo: g }));
    (l.armourGizmos ?? []).forEach((g, i) => out.gizmos.push({ type: 'armour', label: 'Armour gizmo ' + (i + 1), gizmo: g }));
  } else {
    // legacy passives / set that the loadout page has not moved into slots yet still count
    for (const id of l.items ?? []) out.passives.add(id);
    if (l.armourSet && !out.sets.size) out.sets.set(l.armourSet, l.armourPieces);
    if (!out.eofSpec && l.eofSpec && !eq.neck) out.eofSpec = l.eofSpec;
  }
  return out;
}

/** Validation messages for the loadout page (gizmo rules etc.). */
export function loadoutWarnings(l: Loadout, data: LoadoutData): string[] {
  const out: string[] = [];
  const wn = worn(l, data);
  const { main, off } = wn;
  if (main && off && off.slot !== 'shield' && off.role !== 'defender' && main.style !== off.style) out.push('Main-hand and off-hand weapons have different combat styles.');
  const eof = wn.eofSpec ? data.specById.get(wn.eofSpec) : null;
  const style = mainStyle(l, data);
  if (eof && style && eof.style !== style) out.push('The Essence of Finality special (' + eof.style + ') needs a weapon of the same style.');
  for (const g of wn.gizmos) checkGizmo(g.gizmo, g.type, data, out, g.label);
  checkPerkConflicts(wn.gizmos, data, out);
  return out;
}

/** One gizmo: perk type, ancient-only perks, rank limits, two perk slots (a two-slot perk fills the gizmo), no perk twice. */
function checkGizmo(g: Gizmo, type: 'weapon' | 'armour', data: LoadoutData, out: string[], label: string): void {
  let slots = 0;
  const seen = new Set<string>();
  for (const p of g.perks) {
    const perk = data.perkById.get(p.perk);
    if (!perk) {
      out.push(label + ': unknown perk "' + p.perk + '".');
      continue;
    }
    if (seen.has(perk.id)) out.push(label + ': ' + perk.name + ' is in the gizmo twice.');
    seen.add(perk.id);
    const allowed = perk.gizmos.includes(type) || perk.gizmos.includes('ancient-' + type);
    if (!allowed) out.push(label + ': ' + perk.name + ' cannot go on a ' + type + ' gizmo.');
    if (!g.ancient && perk.gizmos.every((x) => x.startsWith('ancient-'))) out.push(label + ': ' + perk.name + ' needs an ancient gizmo.');
    const max = g.ancient ? perk.maxRankAncient : perk.maxRank;
    if (p.rank < 1) out.push(label + ': ' + perk.name + ' rank must be at least 1.');
    if (p.rank > max) out.push(label + ': ' + perk.name + ' rank ' + p.rank + ' exceeds the maximum of ' + max + (g.ancient ? '' : ' (standard gizmo)') + '.');
    slots += perk.twoSlot ? 2 : 1;
  }
  if (slots > 2) out.push(label + ': more than two perk slots used' + (g.perks.some((p) => data.perkById.get(p.perk)?.twoSlot) ? ' (a two-slot perk cannot be paired with another perk)' : '') + '.');
}

/**
 * Perks that clash across gizmos. Wiki (Perks): "These perks do not stack with themselves, and the gizmo with the highest
 * rank will take priority." – a repeated perk is not an error, but the lower rank is wasted. Devoted / Enhanced Devoted and
 * Efficient / Enhanced Efficient "do not stack"; Biting does nothing under Equilibrium; Shield Bashing does nothing under Bulwark.
 */
function checkPerkConflicts(gizmos: Worn['gizmos'], data: LoadoutData, out: string[]): void {
  const ranks = new Map<string, number[]>();
  for (const g of gizmos) for (const p of g.gizmo.perks) ranks.set(p.perk, [...(ranks.get(p.perk) ?? []), p.rank]);
  for (const [id, list] of ranks) {
    if (list.length < 2) continue;
    const perk = data.perkById.get(id);
    if (!perk) continue;
    out.push(perk.name + ' is on ' + list.length + ' gizmos: perks do not stack with themselves, only rank ' + Math.max(...list) + ' counts.');
  }
  const has = (id: string) => ranks.has(id);
  const pair = (a: string, b: string, text: string) => {
    if (has(a) && has(b)) out.push(text);
  };
  pair('devoted', 'enhanced-devoted', 'Enhanced Devoted does not stack with Devoted – Devoted is wasted.');
  pair('efficient', 'enhanced-efficient', 'Enhanced Efficient does not stack with Efficient on the same item.');
  pair('biting', 'equilibrium', 'Equilibrium prevents critical strikes – Biting has no effect.');
  pair('shield-bashing', 'bulwark', 'Bulwark makes Debilitate deal no damage – Shield Bashing has no effect.');
}

export function mainStyle(l: Loadout, data: LoadoutData): Style | null {
  const w = loadoutWield(l);
  const wp = w.twoHand ? data.weaponById.get(w.twoHand) : w.mainHand ? data.weaponById.get(w.mainHand) : null;
  return wp?.style ?? null;
}

export function resolveLoadout(l: Loadout, data: LoadoutData): ResolvedLoadout {
  const r = defaultResolvedLoadout();
  r.startAdrenaline = l.startAdrenaline;
  const wn = worn(l, data);
  const two = wn.two;
  const main = two ?? wn.main;
  const off = wn.off;
  r.style = main?.style ?? null;
  r.has2h = !!two;
  r.hasShield = off?.slot === 'shield';
  r.shieldTier = off?.slot === 'shield' ? off.tier : off?.role === 'defender' ? off.tier / 2 : 0;
  r.hasDefender = off?.role === 'defender';
  r.hasConduit = main?.role === 'siphon' && off?.role === 'conduit';
  r.weaponType = main ? weaponType(main) : null;
  r.abilityDamage = abilityDamageOf(two ? null : main, off, two);
  const specId = main?.spec ?? (off?.spec ?? null);
  if (specId) {
    const spec = data.specById.get(specId);
    if (spec) r.weaponSpec = data.specEntity(spec);
  }
  if (wn.eofSpec) {
    const spec = data.specById.get(wn.eofSpec);
    if (spec) r.eofSpec = data.specEntity(spec);
  }
  if (off?.name === 'Soulbound lantern' || off?.name.startsWith('Soulbound lantern')) r.stackCaps['residual-souls'] = 5;
  r.spellbook = l.spellbook ?? 'standard';
  // nexus in the ammunition slot: rune store of the bone shields; Zemouregal's adds 15 levels (Fortified Bones)
  for (const g of wn.gear) {
    if (g.slot !== 'ammo' || !g.item.id.includes('nexus')) continue;
    r.hasNexus = true;
    if (g.item.id === 'zemouregal-s-nexus') r.boneShieldLevelBonus = FORTIFIED_BONES_BONUS;
  }

  // relics (runescape.wiki/w/Relic_powers). Persistent Rage (out-of-combat adrenaline) and Berserker's Fury (up to +5.5%
  // damage the lower the life points – life points are not simulated) change nothing here; Shadow's Grace comes after the perks.
  const relics = l.relics ?? [];
  if (relics.includes('fury-of-the-small')) r.basicGainAdd += 1;
  if (relics.includes('conservation-of-energy')) r.ultimateRefund += 10;
  if (relics.includes('heightened-senses')) r.maxAdrenaline += 10;
  // Spirit Pact
  r.conjureDurationAdd += [0, 10, 20, 30][l.spiritPact] ?? 0;
  // familiar: attacks on its own (engine), Kal'gerion demon +1% critical strike chance
  const fam = l.familiar ? data.familiarById?.get(l.familiar) ?? null : null;
  if (fam) {
    r.familiar = fam;
    r.critChanceAdd += fam.critChanceAdd ?? 0;
  }

  // perks: highest rank per perk counts
  const ranks = new Map<string, number>();
  for (const g of wn.gizmos) {
    for (const p of g.gizmo.perks) ranks.set(p.perk, Math.max(ranks.get(p.perk) ?? 0, p.rank));
  }
  for (const [id, rank] of ranks) {
    const perk = data.perkById.get(id);
    if (!perk || rank <= 0) continue;
    r.items.add(id);
    applyPerk(r, perk, rank);
  }
  // Equilibrium / Eruptive raise the ability damage stat itself (wiki: "anything calculated from the ability damage stat")
  if (r.abilityDamageMult !== 1) r.abilityDamage = Math.floor(r.abilityDamage * r.abilityDamageMult + 1e-6);
  // Shadow's Grace: "Reduces the cooldown of Surge, Escape, Bladed Dive, Dive and Barge by 50%. It does not stack with the perk" (Mobile)
  if (relics.includes('shadow-s-grace')) for (const a of SHADOWS_GRACE_ABILITIES) r.cooldownMult[a] = Math.min(r.cooldownMult[a] ?? 1, 0.5);

  // armour set thresholds (every set with worn pieces)
  for (const [setId, pieces] of wn.sets) {
    const set = data.setEffectById.get(setId);
    const superiorOnly = wn.gear.filter((g) => g.item.set === setId).every((g) => g.item.id.startsWith('superior-'));
    for (const t of set?.thresholds ?? []) {
      if (pieces >= t.pieces) {
        const id = set!.id + ':' + t.pieces;
        r.items.add(id);
        if (!applyEffect(r, id, t.effect, pieces, set!.style, { superiorOnly })) r.ignoredEffects.push({ id, kind: t.effect.kind });
      }
    }
  }
  // single items
  const items = new Set(wn.passives);
  for (const id of [...items]) {
    const item = data.setEffectById.get(id);
    if (item?.effect?.kind === 'includes') for (const inc of item.effect['items'] as string[]) items.add(inc);
  }
  for (const id of items) {
    const item = data.setEffectById.get(id);
    if (!item?.effect) continue;
    r.items.add(id);
    if (!applyEffect(r, id, item.effect, 1, item.style, {})) r.ignoredEffects.push({ id, kind: item.effect.kind });
  }
  return r;
}

/**
 * Effect kinds of set-effects.json the simulation deliberately ignores, with the reason. gear.spec.ts checks that every
 * kind in the data is either applied by applyEffect() or listed here, so a new kind cannot go unnoticed.
 */
export const NOT_SIMULATED_EFFECT_KINDS: Record<string, string> = {
  'bolt-proc': 'enchanted bolt effects need ammunition modelling (Sirenic / Elite sirenic)',
  'damage-delay': 'incoming damage is not simulated (Trimmed masterwork)',
  'strength-bonus': 'ability damage ignores armour and strength bonuses (Achto)',
  'defensive-cooldown-reset-on-hit': 'incoming damage is not simulated (Achto)',
  'damage-taken': 'incoming damage is not simulated (Cryptbloom)',
  'proc': 'Croesus Deathspores / Fungal Shield depend on position and life points (Cryptbloom)',
  'death-mark': 'Death Mark executes below 20% life points – boss immunities are not modelled (Deathdealer)',
  'cooldown-chance': 'numbers are not documented on the wiki (Warpriest of Armadyl / Bandos)',
  'crit-proc': 'numbers are not documented on the wiki (Warpriest of Tuska)',
  'adrenaline-on-kill': 'the session ends with the kill (Ring of death)',
  'prayer': 'healing and damage taken are not simulated (Amulet of souls)',
  'spec-adrenaline': 'special attack side effects are not modelled – specs.json (Ek-ZekKil)',
};

/** abilities whose cooldown Shadow's Grace halves (runescape.wiki/w/Shadow's_Grace) */
export const SHADOWS_GRACE_ABILITIES = ['surge', 'escape', 'dive', 'bladed-dive', 'barge', 'greater-barge'];

/** Armour sets worn with how many pieces (for the loadout page). */
export function wornSets(l: Loadout, data: LoadoutData): { set: SetEffect; pieces: number }[] {
  const out: { set: SetEffect; pieces: number }[] = [];
  for (const [id, pieces] of worn(l, data).sets) {
    const set = data.setEffectById.get(id);
    if (set) out.push({ set, pieces });
  }
  return out;
}

/** Passive item effects in play (for the loadout page). */
export function wornPassives(l: Loadout, data: LoadoutData): SetEffect[] {
  return [...worn(l, data).passives].map((id) => data.setEffectById.get(id)).filter((x): x is SetEffect => !!x);
}

function weaponType(w: Weapon): 'bow' | 'crossbow' | 'other' {
  const n = w.name.toLowerCase();
  if (w.attackStyle === 'arrows' || (n.includes('bow') && !n.includes('crossbow'))) return 'bow';
  if (w.attackStyle === 'bolts' || n.includes('crossbow')) return 'crossbow';
  return 'other';
}

/**
 * One perk at its highest equipped rank (resolveLoadout already collapsed the gizmos: "perks do not stack with themselves,
 * the gizmo with the highest rank takes priority"). Numbers come from perks.json (tools/fetch-perks.py, docs/research/perks.md);
 * the fallbacks are the wiki values of September 2026.
 */
function applyPerk(r: ResolvedLoadout, perk: Perk, rank: number): void {
  const p = perk.params as Record<string, unknown>;
  const num = (key: string, fallback: number): number => (typeof p[key] === 'number' ? (p[key] as number) : fallback);
  const list = (key: string, fallback: string[]): string[] => (Array.isArray(p[key]) ? (p[key] as string[]) : fallback);
  const multAbilities = (ids: string[], mult: number) => {
    for (const a of ids) r.damageMultPerAbility[a] = (r.damageMultPerAbility[a] ?? 1) * mult;
  };
  switch (perk.id) {
    // ---- adrenaline
    case 'impatient': r.impatientRank = rank; break;
    case 'invigorating': r.invigoratingRank = rank; break;
    case 'relentless': r.relentlessRank = rank; break;
    // ---- cooldowns / durations
    case 'planted-feet': r.items.add('planted-feet'); break; // rules-magic / rules-ranged: Sunshine & Death's Swiftness 63 ticks, no periodic damage
    case 'mobile':
      for (const a of list('abilities', ['surge', 'escape', 'dive', 'bladed-dive', 'barge', 'greater-barge'])) r.cooldownMult[a] = num('cooldownMult', 0.5);
      break;
    case 'preparation':
      r.buffDurationMult['preparation'] = 1 + num('durationPerRank', 0.15) * rank;
      r.cooldownMult['preparation'] = 1 + num('cooldownPerRank', 0.15) * rank;
      break;
    case 'turtling':
      r.buffDurationMult['barricade'] = 1 + num('durationPerRank', 0.1) * rank;
      r.cooldownMult['barricade'] = 1 + num('cooldownPerRank', 0.1) * rank;
      break;
    case 'brief-respite':
      for (const a of list('abilities', ['rejuvenate', 'guthix-s-blessing', 'ice-asylum'])) r.cooldownMult[a] = 1 + num('cooldownPerRank', -0.05) * rank;
      break;
    case 'clear-headed': {
      // wiki table: +2 / +3 / +5 / +6 ticks, added after Reflexes halved the duration
      const table = list('extraTicks', []).map(Number);
      const extra = table.length ? table[Math.min(rank, table.length) - 1] : Math.ceil(rank * 1.5);
      r.buffDurationAdd['anticipation'] = (r.buffDurationAdd['anticipation'] ?? 0) + extra;
      break;
    }
    case 'reflexes':
      r.buffDurationMult['anticipation'] = num('durationMult', 0.5);
      r.cooldownMult['anticipation'] = num('cooldownMult', 0.5);
      break;
    case 'bulwark':
      // tB = t + max(R, ⌊t × 0.06 × R⌋); Debilitate deals no damage
      r.buffDurationExtra['debilitate'] = { share: num('durationPerRank', 0.06) * rank, minTicks: num('minTicksPerRank', 1) * rank };
      multAbilities(list('abilities', ['debilitate']), 0);
      break;
    // ---- damage
    case 'precise': r.preciseRank = rank; break;
    case 'equilibrium':
      r.equilibriumRank = rank;
      r.abilityDamageMult *= 1 + num('abilityDamageBase', 0.06) + num('abilityDamagePerRank', 0.02) * rank;
      r.critDisabled = true;
      break;
    case 'eruptive': r.abilityDamageMult *= 1 + num('abilityDamagePerRank', 0.005) * rank; break;
    case 'biting': r.critChanceAdd += num('critChancePerRank', 0.02) * rank; break;
    case 'ultimatums': r.ultimateDamageMult *= 1 + num('ultimateBase', 0.03) + num('ultimatePerRank', 0.01) * rank; break;
    case 'caroming':
      // "+4% ability damage per rank, with each hit" (flat); Chain's secondary targets are not simulated (single target)
      for (const a of ['ricochet', 'greater-ricochet']) r.flatAddPerAbility[a] = (r.flatAddPerAbility[a] ?? 0) + num('ricochetPerRank', 0.04) * rank;
      break;
    case 'lunging': multAbilities(list('abilities', ['combust', 'dismember']), 1 + num('base', 0.1) + num('perRank', 0.03) * rank); break;
    case 'shield-bashing': multAbilities(list('abilities', ['debilitate']), 1 + num('perRank', 0.15) * rank); break;
    case 'aftershock':
      r.aftershock = { rank, perRank: num('damagePerRank', 0.4), threshold: num('threshold', 50000), minIntervalTicks: num('minIntervalTicks', 10), rollMin: num('rollMin', 0.6), rollMax: num('rollMax', 0.99) };
      break;
    case 'crackling': r.crackling = { rank, perRank: num('damagePerRank', 0.5), cooldownTicks: num('cooldownTicks', 100) }; break;
    case 'spendthrift': r.spendthriftRank = rank; break;
    case 'flanking': r.flanking = { rank, perRank: num('perRank', 0.4), abilities: list('abilities', ['soul-strike', 'backhand', 'impact', 'binding-shot']) }; break;
    case 'ruthless': r.ruthlessRank = rank; break; // stacks need kills – reported, not simulated
    case 'undead-slayer': r.targetTypeDamageMult.undead = (r.targetTypeDamageMult.undead ?? 1) * (1 + num('bonus', 0.07)); break;
    case 'dragon-slayer': r.targetTypeDamageMult.dragon = (r.targetTypeDamageMult.dragon ?? 1) * (1 + num('bonus', 0.07)); break;
    case 'demon-slayer': r.targetTypeDamageMult.demon = (r.targetTypeDamageMult.demon ?? 1) * (1 + num('bonus', 0.07)); break;
    default:
      break; // Genocidal (Slayer task progress), Energising (accuracy), defensive perks (Devoted, Crystal Shield, Absorbative, Lucky …): no effect on the damage model
  }
}

/**
 * Applies one set-threshold / item effect from set-effects.json. Returns false for a kind the simulation does not
 * model (NOT_SIMULATED_EFFECT_KINDS); kinds that rules handle through `when: { item: id }` conditions return true.
 */
function applyEffect(r: ResolvedLoadout, id: string, effect: Record<string, unknown> & { kind: string }, pieces: number, style: Style | null, opts: { superiorOnly?: boolean }): boolean {
  const e = effect as Record<string, any>;
  switch (e['kind']) {
    case 'max-adrenaline':
      if (!e['requiresStyle'] || r.style === e['requiresStyle']) r.maxAdrenaline += Number(e['add']);
      break;
    case 'buff-duration':
      r.buffDurationAdd[e['buff']] = (r.buffDurationAdd[e['buff']] ?? 0) + Number(e['addTicks']);
      break;
    case 'buff-override':
      r.buffDurationAdd[e['buff']] = 0;
      r.buffDurationMult[e['buff']] = 1;
      // duration override: express as add relative to the rule default (Channelled Might 6 → 15)
      r.buffDurationAdd[e['buff']] = Number(e['durationTicks']) - 6;
      if (e['critDamage'] !== undefined) r.buffCritDamageAdd[e['buff']] = Number(e['critDamage']);
      break;
    case 'crit-in-sunshine':
      for (const b of ['sunshine', 'greater-sunshine']) r.buffCritAdd[b] = { add: (r.buffCritAdd[b]?.add ?? 0) + Number(e['perPiece']) * Math.min(pieces, 5), style: 'Magic' };
      break;
    case 'crit-chance':
      if (e['requiresWeapon'] && r.weaponType !== e['requiresWeapon']) break; // stalker's ring: bow only
      r.critChanceAdd += e['add'] !== undefined ? Number(e['add']) : Number(e['perPiece']) * Math.min(pieces, 5);
      break;
    case 'crit-damage':
      r.critDamageAdd += Number(e['add']);
      break;
    case 'channel-crit':
      r.channelCritPerHit = { add: Number(e['perHit']), style };
      break;
    case 'crit-vs-bleeding':
      r.critVsBleeding += Number(e['add']);
      break;
    case 'adrenaline-per-bleed':
      r.adrenalinePerBleed += Number(e['perBleed']);
      break;
    case 'damage':
      r.damageMult *= opts.superiorOnly && e['superiorMult'] !== undefined ? Number(e['superiorMult']) : Number(e['mult']);
      break;
    case 'dot-damage':
      for (const a of (e['abilities'] as string[]) ?? []) r.dotDamageMult[a] = (r.dotDamageMult[a] ?? 1) * Number(e['mult']);
      break;
    case 'proc-buff':
      r.hitProcs.push({ id, chance: Number(e['chance']), cooldownTicks: Number(e['cooldownTicks'] ?? 0), style: style ?? undefined, buff: { id: e['buff'], durationTicks: Number(e['durationTicks']) } });
      break;
    case 'proc-damage':
      r.hitProcs.push({ id, chance: Number(e['chance']), cooldownTicks: Number(e['cooldownTicks'] ?? 0), style: style ?? undefined, hits: e['hits'], echo: e['echo'] });
      break;
    case 'poison':
      r.poison = { chance: Number(e['chance']), pct: 20 + 5 * (Number(e['tier'] ?? 1) - 1) }; // tier 1 = 20% of the ability damage, +5% per tier
      break;
    case 'adrenaline-after-ultimate':
      r.adrenalineAfterUltimate = { style: e['style'] ?? style ?? 'Melee', amount: Number(e['amount']), overTicks: Number(e['overTicks']), instantIfActive: Number(e['instantIfActive']) };
      break;
    case 'conjure-duration':
      r.conjureDurationMult *= 1 + Number(e['perPiece']) * Math.min(pieces, 5);
      break;
    case 'conjure-damage':
      r.conjureDamageMult *= 1 + Number(e['perPiece']) * Math.min(pieces, 5);
      break;
    case 'conjure-duration-add':
      break; // Spirit Pact is read from loadout.spiritPact
    case 'channel-adrenaline-per-tick':
      r.channelAdrenalinePerTick[e['ability']] = (r.channelAdrenalinePerTick[e['ability']] ?? 0) + Number(e['perPiece']) * pieces;
      break;
    case 'buff-on-full-channel': {
      const list = (r.fullChannelBuffs[e['ability']] ??= []);
      list.push({ buff: e['buff'], durationTicks: Number(e['durationTicks']), requiresWeapon: e['requiresWeapon'] });
      if (e['critChance']) r.buffCritAdd[e['buff']] = { add: Number(e['critChance']), style: style ?? undefined };
      break;
    }
    case 'channel-override':
      r.channelOverrides[e['ability']] = { ticks: Math.max(...(e['hits'] as number[])), hits: e['hits'] as number[], onComplete: [{ kind: 'buff', id: 'channelled-might' }], damageMult: e['damageMult'] !== undefined ? Number(e['damageMult']) : undefined };
      break;
    case 'ability-override':
      if (e['hits']) {
        const base = ruleFor(e['ability'])?.hits?.[0] ?? 0; // Overpower lands at +3: both Igneous hits do
        r.hitsOverrides[e['ability']] = Array.from({ length: Number(e['hits']) }, (_, i) => (base > 0 ? base : i === 0 ? 0 : 1));
      }
      if (e['bounces']) r.hitsOverrides[e['ability']] = Array.from({ length: Number(e['bounces']) / 2 + 1 }, (_, i) => i * 4); // one target: every second bounce lands on it
      if (e['damageMin'] !== undefined && e['damageMax'] !== undefined) r.damageOverrides[e['ability']] = { min: Number(e['damageMin']), max: Number(e['damageMax']) };
      break;
    case 'vigour':
      r.ultimateRefund += Number(e['ultimateRefund']);
      r.specCostMult = Number(e['specCostMult']);
      break;
    case 'asylum':
      r.costReduction = { chance: Number(e['chance']), amount: Number(e['costReduce']), cooldownTicks: Number(e['cooldownTicks'] ?? 0) };
      break;
    case 'stack-cap':
      r.stackCaps[e['stack'] as keyof typeof r.stackCaps] = Number(e['cap']);
      break;
    case 'replaces-ability':
    case 'snipe-cdr':
    case 'snipe-mobile': // movement while sniping (channel movableWith); the +25% hit chance is not simulated
    case 'buff-on-cast':
    case 'buff-on-hit':
    case 'instant-dot-window':
    case 'death-spark': // rules-necromancy.ts: the basic attack builds and spends the stacks
    case 'soul-reave':
    case 'primordial-ice': // rules-global.ts: dark ice shard stacks on the item id
    case 'necrosis-chance': // rules-global.ts: occultist's ring / Zorgoth's soul ring
    case 'soul-chance':
    case 'essence-corruption': // rules-global.ts / rules-magic.ts / rules-buffs.ts on the "song-of-destruction:1" item id
      break; // handled by rule conditions on the item id
    case 'includes': // Igneous Kal-Zuk: the included items were added by resolveLoadout
    case 'eof': // worn() picked the stored special attack
      break;
    default:
      return false;
  }
  return true;
}

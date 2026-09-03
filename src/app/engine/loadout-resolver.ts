/**
 * Turns a saved Loadout (worn items, perks on them, relics) into the numbers the engine uses.
 * Effect kinds are the ones written in public/data/set-effects.json and perks.json.
 */
import { EquipSlot, GearItem, Gizmo, ItemRef, Loadout, Perk, SetEffect, Style, WEAPON_SETS, Weapon, WeaponSpec, loadoutWield } from '../core/models';
import { abilityDamageOf } from './damage';
import { ruleFor } from './rules';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import type { EngineEntity } from './trainer-engine';

export interface LoadoutData {
  weaponById: Map<string, Weapon>;
  specById: Map<string, WeaponSpec>;
  perkById: Map<string, Perk>;
  setEffectById: Map<string, SetEffect>;
  /** gear.json (armour, jewellery ...); missing = only weapons are known */
  gearById?: Map<string, GearItem>;
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
  return out;
}

function checkGizmo(g: Gizmo, type: 'weapon' | 'armour', data: LoadoutData, out: string[], label: string): void {
  let slots = 0;
  for (const p of g.perks) {
    const perk = data.perkById.get(p.perk);
    if (!perk) continue;
    const allowed = perk.gizmos.includes(type) || perk.gizmos.includes('ancient-' + type);
    if (!allowed) out.push(label + ': ' + perk.name + ' cannot go on a ' + type + ' gizmo.');
    if (!g.ancient && perk.gizmos.every((x) => x.startsWith('ancient-'))) out.push(label + ': ' + perk.name + ' needs an ancient gizmo.');
    const max = g.ancient ? perk.maxRankAncient : perk.maxRank;
    if (p.rank > max) out.push(label + ': ' + perk.name + ' rank ' + p.rank + ' exceeds the maximum of ' + max + (g.ancient ? '' : ' (standard gizmo)') + '.');
    slots += perk.twoSlot ? 2 : 1;
  }
  if (slots > 2) out.push(label + ': more than two perk slots used.');
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

  // relics
  if (l.relics.includes('fury-of-the-small')) r.basicGainAdd += 1;
  if (l.relics.includes('conservation-of-energy')) r.ultimateRefund += 10;
  if (l.relics.includes('heightened-senses')) r.maxAdrenaline += 10;
  // Spirit Pact
  r.conjureDurationAdd += [0, 10, 20, 30][l.spiritPact] ?? 0;

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

  // armour set thresholds (every set with worn pieces)
  for (const [setId, pieces] of wn.sets) {
    const set = data.setEffectById.get(setId);
    for (const t of set?.thresholds ?? []) {
      if (pieces >= t.pieces) {
        r.items.add(set!.id + ':' + t.pieces);
        applyEffect(r, t.effect, pieces, set!.style);
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
    applyEffect(r, item.effect, 1, item.style);
  }
  return r;
}

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

function applyPerk(r: ResolvedLoadout, perk: Perk, rank: number): void {
  const p = perk.params as Record<string, number | string[] | boolean>;
  switch (perk.id) {
    case 'impatient': r.impatientRank = rank; break;
    case 'invigorating': r.invigoratingRank = rank; break;
    case 'relentless': r.relentlessRank = rank; break;
    case 'planted-feet': r.items.add('planted-feet'); break;
    case 'caroming':
      for (const a of ['ricochet', 'greater-ricochet']) r.flatAddPerAbility[a] = (r.flatAddPerAbility[a] ?? 0) + Number(p['ricochetPerRank']) * rank;
      break;
    case 'ultimatums':
      r.ultimateDamageMult *= 1 + Number(p['ultimateBase']) + Number(p['ultimatePerRank']) * rank;
      break;
    case 'mobile':
      for (const a of (p['abilities'] as string[]) ?? []) r.cooldownMult[a] = 0.5;
      break;
    case 'preparation':
      r.buffDurationMult['preparation'] = 1 + 0.15 * rank;
      r.cooldownMult['preparation'] = 1 + 0.15 * rank;
      break;
    case 'turtling':
      r.buffDurationMult['barricade'] = 1 + 0.1 * rank;
      r.cooldownMult['barricade'] = 1 + 0.1 * rank;
      break;
    case 'brief-respite':
      for (const a of ['rejuvenate', 'guthix-s-blessing', 'ice-asylum']) r.cooldownMult[a] = 1 - 0.05 * rank;
      break;
    case 'clear-headed': r.buffDurationAdd['anticipation'] = (r.buffDurationAdd['anticipation'] ?? 0) + Math.round(rank * 1.67); break;
    case 'reflexes':
      r.buffDurationMult['anticipation'] = 0.5;
      r.cooldownMult['anticipation'] = 0.5;
      break;
    case 'bulwark': r.buffDurationMult['debilitate'] = 1 + 0.06 * rank; break;
    case 'biting': r.critChanceAdd += 0.02 * rank; break;
    case 'precise': r.preciseRank = rank; break;
    case 'equilibrium': r.equilibriumRank = rank; break;
    default:
      break; // other damage / defensive perks: stored for later
  }
}

function applyEffect(r: ResolvedLoadout, effect: Record<string, unknown> & { kind: string }, pieces: number, style: Style | null): void {
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
      break;
    case 'adrenaline-after-ultimate':
      r.adrenalineAfterUltimate = { style: e['style'] ?? style ?? 'Melee', amount: Number(e['amount']), overTicks: Number(e['overTicks']), instantIfActive: Number(e['instantIfActive']) };
      break;
    case 'conjure-duration':
      r.conjureDurationMult *= 1 + Number(e['perPiece']) * Math.min(pieces, 5);
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
      r.channelOverrides[e['ability']] = { ticks: Math.max(...(e['hits'] as number[])), hits: e['hits'] as number[], onComplete: [{ kind: 'buff', id: 'channelled-might' }] };
      break;
    case 'ability-override':
      if (e['hits']) {
        const base = ruleFor(e['ability'])?.hits?.[0] ?? 0; // Overpower lands at +3: both Igneous hits do
        r.hitsOverrides[e['ability']] = Array.from({ length: Number(e['hits']) }, (_, i) => (base > 0 ? base : i === 0 ? 0 : 1));
      }
      if (e['bounces']) r.hitsOverrides[e['ability']] = Array.from({ length: Number(e['bounces']) + 1 }, (_, i) => i * 2);
      if (e['damageMin'] !== undefined && e['damageMax'] !== undefined) r.damageOverrides[e['ability']] = { min: Number(e['damageMin']), max: Number(e['damageMax']) };
      break;
    case 'vigour':
      r.ultimateRefund += Number(e['ultimateRefund']);
      r.specCostMult = Number(e['specCostMult']);
      break;
    case 'asylum':
      r.thresholdFreeChance = Number(e['thresholdFreeChance']);
      break;
    case 'stack-cap':
      r.stackCaps[e['stack'] as keyof typeof r.stackCaps] = Number(e['cap']);
      break;
    case 'replaces-ability':
    case 'snipe-cdr':
    case 'buff-on-cast':
    case 'buff-on-hit':
    case 'instant-dot-window':
      break; // handled by rule conditions on the item id
    default:
      break; // damage-only / defensive: stored for later
  }
}

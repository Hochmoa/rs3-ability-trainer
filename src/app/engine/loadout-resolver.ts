/**
 * Turns a saved Loadout (ids of weapons, perks, sets, relics) into the numbers the engine uses.
 * Effect kinds are the ones written in public/data/set-effects.json and perks.json.
 */
import { Loadout, Perk, SetEffect, Style, Weapon, WeaponSpec } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import type { EngineEntity } from './trainer-engine';

export interface LoadoutData {
  weaponById: Map<string, Weapon>;
  specById: Map<string, WeaponSpec>;
  perkById: Map<string, Perk>;
  setEffectById: Map<string, SetEffect>;
  specEntity: (spec: WeaponSpec) => EngineEntity;
}

/** Validation messages for the loadout page (gizmo rules etc.). */
export function loadoutWarnings(l: Loadout, data: LoadoutData): string[] {
  const out: string[] = [];
  if (l.twoHand && (l.mainHand || l.offHand)) out.push('A two-handed weapon cannot be combined with a main-hand or off-hand item.');
  const main = l.mainHand ? data.weaponById.get(l.mainHand) : null;
  const off = l.offHand ? data.weaponById.get(l.offHand) : null;
  if (main && off && off.slot !== 'shield' && off.role !== 'defender' && main.style !== off.style) out.push('Main-hand and off-hand weapons have different combat styles.');
  const eof = l.eofSpec ? data.specById.get(l.eofSpec) : null;
  const style = mainStyle(l, data);
  if (eof && style && eof.style !== style) out.push('The Essence of Finality special (' + eof.style + ') needs a weapon of the same style.');
  const weaponGizmos = l.twoHand ? 2 : (l.mainHand ? 1 : 0) + (off && off.slot !== 'shield' ? 1 : 0);
  l.weaponGizmos.slice(0, 2).forEach((g, i) => {
    if (i >= weaponGizmos && g.perks.length) out.push('Weapon gizmo ' + (i + 1) + ' has no weapon to sit on.');
    checkGizmo(g, 'weapon', data, out, 'Weapon gizmo ' + (i + 1));
  });
  l.armourGizmos.forEach((g, i) => checkGizmo(g, 'armour', data, out, 'Armour gizmo ' + (i + 1)));
  return out;
}

function checkGizmo(g: Loadout['weaponGizmos'][number], type: 'weapon' | 'armour', data: LoadoutData, out: string[], label: string): void {
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
  const w = l.twoHand ? data.weaponById.get(l.twoHand) : l.mainHand ? data.weaponById.get(l.mainHand) : null;
  return w?.style ?? null;
}

export function resolveLoadout(l: Loadout, data: LoadoutData): ResolvedLoadout {
  const r = defaultResolvedLoadout();
  r.startAdrenaline = l.startAdrenaline;
  const two = l.twoHand ? data.weaponById.get(l.twoHand) : null;
  const main = two ?? (l.mainHand ? data.weaponById.get(l.mainHand) : null) ?? null;
  const off = l.offHand ? data.weaponById.get(l.offHand) : null;
  r.style = main?.style ?? null;
  r.has2h = !!two;
  r.hasShield = off?.slot === 'shield';
  r.hasDefender = off?.role === 'defender';
  r.hasConduit = main?.role === 'siphon' && off?.role === 'conduit';
  r.weaponType = main ? weaponType(main) : null;
  const specId = main?.spec ?? (off?.spec ?? null);
  if (specId) {
    const spec = data.specById.get(specId);
    if (spec) r.weaponSpec = data.specEntity(spec);
  }
  if (l.eofSpec) {
    const spec = data.specById.get(l.eofSpec);
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
  for (const g of [...l.weaponGizmos, ...l.armourGizmos]) {
    for (const p of g.perks) ranks.set(p.perk, Math.max(ranks.get(p.perk) ?? 0, p.rank));
  }
  for (const [id, rank] of ranks) {
    const perk = data.perkById.get(id);
    if (!perk || rank <= 0) continue;
    r.items.add(id);
    applyPerk(r, perk, rank);
  }

  // armour set thresholds
  if (l.armourSet) {
    const set = data.setEffectById.get(l.armourSet);
    for (const t of set?.thresholds ?? []) {
      if (l.armourPieces >= t.pieces) {
        r.items.add(set!.id + ':' + t.pieces);
        applyEffect(r, t.effect, l.armourPieces, set!.style);
      }
    }
  }
  // single items
  const items = new Set(l.items);
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
    default:
      break; // damage / defensive perks: stored for later
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
    case 'channel-override':
      r.channelOverrides[e['ability']] = { ticks: Math.max(...(e['hits'] as number[])), hits: e['hits'] as number[], onComplete: [{ kind: 'buff', id: 'channelled-might' }] };
      break;
    case 'ability-override':
      if (e['hits']) r.hitsOverrides[e['ability']] = Array.from({ length: Number(e['hits']) }, (_, i) => (i === 0 ? 0 : 1));
      if (e['bounces']) r.hitsOverrides[e['ability']] = Array.from({ length: Number(e['bounces']) + 1 }, (_, i) => i * 2);
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

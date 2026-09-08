/**
 * The Loadout page's catalog, ordered by how PvM players actually gear (docs/plan-setups.md, follow-up round).
 *
 * Every item carries a usage score – the number of PvME setups that wear or carry it (public/data/usage.json,
 * tools/usage-stats.py) – and the catalog sorts by it. "Hide obscure equipment" hides everything below
 * `USAGE_THRESHOLD` (core/obscure.ts), unless a search is typed. Items come in groups, like the game gives them
 * out: a two-hander alone, a main-hand with the off-hand it is wielded with (Roar of Awakening + Ode to Deceit),
 * an armour set with all its pieces. A set's score is its best piece's – one popular piece carries its set; a
 * pair's is its main hand's, so a rare main hand next to Soulbound lantern does not look common.
 */
import { EquipSlot, GearItem, ItemRef, SLOT_NAMES, STYLES4, SetEffect, Special, Style, UsageStats, Weapon } from './models';

export interface CatalogEntry {
  key: string;
  kind: 'single' | 'pair' | 'set';
  name: string;
  /** the items, in wear order (main hand then off-hand; head → feet for a set) */
  refs: ItemRef[];
  score: number;
  tier: number;
}

export interface CatalogSection {
  key: string;
  label: string;
  entries: CatalogEntry[];
}

export interface CatalogFilter {
  query: string;
  /** hide entries scoring below the threshold (ignored while a query is typed) */
  hide: boolean;
  threshold: number;
  /** tiered slots only: hide entries below this tier (a spec weapon, a set piece and a passive item ignore it) */
  minTier: number;
}

const ARMOUR_SLOTS: EquipSlot[] = ['head', 'body', 'legs', 'hands', 'feet'];
const ACCESSORY_SLOTS: EquipSlot[] = ['cape', 'neck', 'ring', 'ammo', 'pocket', 'sigil'];
const STYLE_LABEL = (s: string | null | undefined) => (s && (STYLES4 as string[]).includes(s) ? s : 'Any style');

export function itemUsage(usage: UsageStats | null, ref: Pick<ItemRef, 'kind' | 'id'>): number {
  return usage?.items[ref.kind + ':' + ref.id] ?? 0;
}

/** Entries sorted by score, then tier, then name; the ones below the threshold / tier / query dropped. */
function finish(entries: CatalogEntry[], f: CatalogFilter, opts: { tiered: boolean; exempt?: (e: CatalogEntry) => boolean }): CatalogEntry[] {
  const q = f.query.trim().toLowerCase();
  return entries
    .filter((e) => !q || e.name.toLowerCase().includes(q))
    .filter((e) => q || !f.hide || e.score >= f.threshold)
    .filter((e) => !opts.tiered || e.tier >= f.minTier || opts.exempt?.(e))
    .sort((a, b) => b.score - a.score || b.tier - a.tier || a.name.localeCompare(b.name));
}

function sections(byKey: Map<string, CatalogEntry[]>, order: string[], label: (key: string) => string, f: CatalogFilter, opts: { tiered: boolean; exempt?: (e: CatalogEntry) => boolean }): CatalogSection[] {
  return [...byKey]
    .sort(([a], [b]) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)))
    .map(([key, entries]) => ({ key, label: label(key), entries: finish(entries, f, opts) }))
    .filter((s) => s.entries.length);
}

// ---------------------------------------------------------------- weapons

/**
 * The off-hand a main-hand weapon is wielded with: the pair the PvME presets use most, else the "Off-hand X" of the
 * same name. A main-hand without either stays alone.
 */
export function offHandFor(main: Weapon, weapons: Weapon[], usage: UsageStats | null): Weapon | null {
  const byId = new Map(weapons.map((w) => [w.id, w]));
  let best: { off: Weapon; n: number } | null = null;
  for (const [key, n] of Object.entries(usage?.pairs ?? {})) {
    const [m, o] = key.split('|');
    const off = m === main.id ? byId.get(o) : undefined;
    if (off && (!best || n > best.n)) best = { off, n };
  }
  if (best) return best.off;
  const named = weapons.find((w) => w.slot === 'off' && w.name.toLowerCase() === 'off-hand ' + main.name.toLowerCase());
  return named ?? null;
}

/** Weapons by style: two-handers, main-hand + off-hand pairs, lone weapons; shields and defenders in their own section. */
export function weaponSections(weapons: Weapon[], usage: UsageStats | null, f: CatalogFilter): CatalogSection[] {
  const byKey = new Map<string, CatalogEntry[]>();
  const push = (key: string, e: CatalogEntry) => byKey.set(key, [...(byKey.get(key) ?? []), e]);
  const single = (w: Weapon): CatalogEntry => ({ key: 'weapon:' + w.id, kind: 'single', name: w.name, refs: [{ kind: 'weapon', id: w.id }], score: itemUsage(usage, { kind: 'weapon', id: w.id }), tier: w.tier });
  const paired = new Set<string>();
  for (const w of weapons) {
    if (w.slot === 'shield' || w.type === 'Defender') {
      push('shields', single(w));
      continue;
    }
    if (w.slot === 'main') {
      const off = offHandFor(w, weapons, usage);
      if (off) {
        paired.add(off.id);
        push(STYLE_LABEL(w.style), {
          key: 'pair:' + w.id + '|' + off.id,
          kind: 'pair',
          name: w.name + ' + ' + off.name,
          refs: [{ kind: 'weapon', id: w.id }, { kind: 'weapon', id: off.id }],
          // the main hand carries the pair's score: a rare main hand next to a common off-hand stays rare
          score: Math.max(usage?.pairs[w.id + '|' + off.id] ?? 0, itemUsage(usage, { kind: 'weapon', id: w.id })),
          tier: Math.max(w.tier, off.tier),
        });
        continue;
      }
    }
    if (w.slot === 'off' && paired.has(w.id)) continue;
    push(STYLE_LABEL(w.style), single(w));
  }
  // an off-hand that only ever shows up inside its pairs is not listed twice; one the presets also wield with other
  // mains, or alone, is (Dark Sliver of Leng sits behind four different main hands)
  for (const w of weapons) {
    if (w.slot !== 'off' || !paired.has(w.id)) continue;
    const inPairs = Object.entries(usage?.pairs ?? {}).filter(([k]) => k.endsWith('|' + w.id)).reduce((n, [, c]) => n + c, 0);
    if (itemUsage(usage, { kind: 'weapon', id: w.id }) > inPairs) push(STYLE_LABEL(w.style), single(w));
  }
  return sections(byKey, [...STYLES4, 'Any style', 'shields'], (k) => (k === 'shields' ? 'Shields & defenders' : k), f, { tiered: true, exempt: (e) => e.refs.some((r) => !!weapons.find((w) => w.id === r.id)?.spec) });
}

// ---------------------------------------------------------------- armour

/** Armour by style: every set as one entry with all its pieces, loose pieces alone. */
export function armourSections(gear: GearItem[], setById: Map<string, SetEffect>, usage: UsageStats | null, f: CatalogFilter): CatalogSection[] {
  const byKey = new Map<string, CatalogEntry[]>();
  const push = (key: string, e: CatalogEntry) => byKey.set(key, [...(byKey.get(key) ?? []), e]);
  const sets = new Map<string, GearItem[]>();
  for (const g of gear) {
    if (!ARMOUR_SLOTS.includes(g.slot)) continue;
    if (g.set) {
      sets.set(g.set, [...(sets.get(g.set) ?? []), g]);
      continue;
    }
    push(STYLE_LABEL(g.style), { key: 'gear:' + g.id, kind: 'single', name: g.name, refs: [{ kind: 'gear', id: g.id }], score: itemUsage(usage, { kind: 'gear', id: g.id }), tier: g.tier });
  }
  for (const [setId, pieces] of sets) {
    const ordered = [...pieces].sort((a, b) => ARMOUR_SLOTS.indexOf(a.slot) - ARMOUR_SLOTS.indexOf(b.slot) || b.tier - a.tier);
    const style = ordered.map((p) => p.style).find((s) => s && s !== 'Hybrid') ?? ordered[0].style;
    push(STYLE_LABEL(style), {
      key: 'set:' + setId,
      kind: ordered.length > 1 ? 'set' : 'single',
      name: setById.get(setId)?.name ?? ordered[0].name,
      refs: ordered.map((p) => ({ kind: 'gear', id: p.id })),
      score: Math.max(...ordered.map((p) => itemUsage(usage, { kind: 'gear', id: p.id }))),
      tier: Math.max(...ordered.map((p) => p.tier)),
    });
  }
  return sections(byKey, [...STYLES4, 'Any style'], (k) => k, f, { tiered: true, exempt: (e) => e.kind === 'set' || e.refs.some((r) => !!gear.find((g) => g.id === r.id)?.passive) });
}

// ---------------------------------------------------------------- accessories, potions

/** Capes, jewellery, ammunition, pocket items and sigils, one section per slot. */
export function accessorySections(gear: GearItem[], usage: UsageStats | null, f: CatalogFilter): CatalogSection[] {
  const byKey = new Map<string, CatalogEntry[]>();
  for (const g of gear) {
    if (!ACCESSORY_SLOTS.includes(g.slot)) continue;
    byKey.set(g.slot, [...(byKey.get(g.slot) ?? []), { key: 'gear:' + g.id, kind: 'single', name: g.name, refs: [{ kind: 'gear', id: g.id }], score: itemUsage(usage, { kind: 'gear', id: g.id }), tier: g.tier }]);
  }
  return sections(byKey, ACCESSORY_SLOTS, (k) => SLOT_NAMES[k as EquipSlot] ?? k, f, { tiered: false });
}

export function potionSections(specials: Special[], usage: UsageStats | null, f: CatalogFilter): CatalogSection[] {
  const entries = specials
    .filter((s) => s.kind !== 'scroll') // scrolls come with the familiar
    .map<CatalogEntry>((s) => ({ key: 'special:' + s.id, kind: 'single', name: s.name, refs: [{ kind: 'special', id: s.id }], score: itemUsage(usage, { kind: 'special', id: s.id }), tier: 0 }));
  const list = finish(entries, { ...f, hide: false }, { tiered: false });
  return list.length ? [{ key: 'potions', label: 'Potions & bombs', entries: list }] : [];
}

/** the style label a weapon or armour piece is filed under */
export function styleLabel(style: Style | 'Hybrid' | null | undefined): string {
  return STYLE_LABEL(style);
}

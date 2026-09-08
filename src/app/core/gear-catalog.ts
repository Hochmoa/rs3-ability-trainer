/**
 * The Loadout page's catalog, ordered by how PvM players actually gear (docs/plan-setups.md, follow-up round).
 *
 * Every item carries a usage score – the number of PvME setups that wear or carry it (public/data/usage.json,
 * tools/usage-stats.py) – and the catalog sorts by it. "Hide obscure equipment" hides everything below
 * `USAGE_THRESHOLD` (core/obscure.ts), unless a search is typed.
 *
 * Items come in groups, like the game gives them out, and every item sits in exactly one group – never once more
 * on its own: a two-hander alone, a main-hand with the off-hand that belongs to it (Roar of Awakening + Ode to
 * Deceit, Dark Shard + Dark Sliver of Leng), an armour set with all its pieces (a set effect, or pieces that share a name: Anima core of Sliske,
 * Masterwork ranged), and the variants of one item (the Igneous Kal-* capes; of several tiers of a piece only the
 * highest is offered). A group's score is its best piece's, so one popular piece
 * carries its set. `chosen` is what "wear the group" puts on: the best variant per slot.
 */
import { EquipSlot, GearItem, ItemRef, SLOT_NAMES, STYLES4, SetEffect, Special, Style, UsageStats, Weapon } from './models';

export type EntryKind = 'single' | 'pair' | 'set' | 'variants';

export interface CatalogEntry {
  key: string;
  kind: EntryKind;
  name: string;
  /** every item of the group, in wear order (main hand then off-hand; head → feet for a set; variants of a slot next to each other, best first) */
  refs: ItemRef[];
  /** what "wear the group" puts on: one item per slot – the best variant */
  chosen: ItemRef[];
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
  /** tiered slots only: hide entries below this tier (a spec weapon, a group and a passive item ignore it) */
  minTier: number;
}

const ARMOUR_SLOTS: EquipSlot[] = ['head', 'body', 'legs', 'hands', 'feet'];
const ACCESSORY_SLOTS: EquipSlot[] = ['cape', 'neck', 'ring', 'ammo', 'pocket', 'sigil'];
const SLOT_ORDER: EquipSlot[] = [...ARMOUR_SLOTS, ...ACCESSORY_SLOTS];
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

/** main-hand ↔ off-hand pairs the names do not give away (weapons.json ids) */
const WEAPON_PAIRS: [string, string][] = [
  ['roar-of-awakening', 'ode-to-deceit'],
  ['omni-guard', 'soulbound-lantern'],
  ['wand-of-the-praesul', 'imperium-core'],
  ['khopesh-of-tumeken', 'khopesh-of-elidinis'],
  ['blade-of-nymora', 'blade-of-avaryss'],
  ['death-guard-tier-90', 'skull-lantern-tier-90'],
  ['death-guard-tier-80', 'skull-lantern-tier-80'],
  ['death-guard-tier-70', 'skull-lantern-tier-70'],
];
/** the word a main-hand's name swaps for its off-hand's: Seismic wand → Seismic singularity, Dark Shard of Leng → Dark Sliver of Leng */
const TWIN_WORDS: [string, string[]][] = [
  ['wand', ['orb', 'book', 'singularity']],
  ['shard', ['sliver']],
  ['guard', ['lantern']],
  ['kiba', ['makigai']],
  ['katana', ['wakizashi']],
];
const OFF_HAND_WORD = /\boff[- ]hand\b\s*/g;

/**
 * Which off-hand goes with which main-hand – by what belongs together, not by what any preset happens to carry:
 * the "Off-hand X" of the same name (Off-hand drygore rapier, Primal off hand warhammer + 5), the twin word
 * (wand → orb / book / singularity, shard → sliver, guard → lantern, kiba → makigai, katana → wakizashi) and the
 * named pairs above (Roar of Awakening + Ode to Deceit, Omni guard + Soulbound lantern …). Every weapon is in at
 * most one pair. Returns off-hand id → main-hand id.
 */
export function pairWeapons(weapons: Weapon[]): Map<string, string> {
  const byId = new Map(weapons.map((w) => [w.id, w]));
  const offs = weapons.filter((w) => w.slot === 'off');
  const norm = (n: string) => n.toLowerCase().replace(OFF_HAND_WORD, '').replace(/\s+/g, ' ').trim();
  const offByName = new Map<string, Weapon>();
  for (const o of offs) if (!offByName.has(norm(o.name))) offByName.set(norm(o.name), o);
  const out = new Map<string, string>();
  const taken = new Set<string>();
  const pair = (main: Weapon, off: Weapon | undefined) => {
    if (!off || out.has(off.id) || taken.has(main.id) || off.style !== main.style) return false;
    out.set(off.id, main.id);
    taken.add(main.id);
    return true;
  };
  for (const [m, o] of WEAPON_PAIRS) {
    const main = byId.get(m);
    if (main) pair(main, byId.get(o));
  }
  for (const w of weapons) {
    if (w.slot !== 'main' || taken.has(w.id)) continue;
    const name = norm(w.name);
    if (pair(w, offByName.get(name))) continue;
    for (const [word, twins] of TWIN_WORDS) {
      if (!new RegExp('\\b' + word + '\\b').test(name)) continue;
      if (twins.some((t) => pair(w, offByName.get(name.replace(new RegExp('\\b' + word + '\\b'), t))))) break;
    }
  }
  return out;
}

/** the off-hand a main-hand is wielded with, null when it stands alone */
export function offHandFor(main: Weapon, weapons: Weapon[]): Weapon | null {
  for (const [off, m] of pairWeapons(weapons)) if (m === main.id) return weapons.find((w) => w.id === off) ?? null;
  return null;
}

/** Weapons by style: two-handers, main-hand + off-hand pairs, lone weapons – every weapon in exactly one entry; shields and defenders in their own section. */
export function weaponSections(weapons: Weapon[], usage: UsageStats | null, f: CatalogFilter): CatalogSection[] {
  const byKey = new Map<string, CatalogEntry[]>();
  const push = (key: string, e: CatalogEntry) => byKey.set(key, [...(byKey.get(key) ?? []), e]);
  const ref = (w: Weapon): ItemRef => ({ kind: 'weapon', id: w.id });
  const single = (w: Weapon): CatalogEntry => ({ key: 'weapon:' + w.id, kind: 'single', name: w.name, refs: [ref(w)], chosen: [ref(w)], score: itemUsage(usage, ref(w)), tier: w.tier });
  const byId = new Map(weapons.map((w) => [w.id, w]));
  const pairs = pairWeapons(weapons);
  const mainOf = new Map([...pairs].map(([off, main]) => [main, off]));
  for (const w of weapons) {
    if (w.slot === 'shield' || w.type === 'Defender') {
      push('shields', single(w));
      continue;
    }
    if (w.slot === 'off' && pairs.has(w.id)) continue; // shown inside its pair
    const off = w.slot === 'main' ? byId.get(mainOf.get(w.id) ?? '') : undefined;
    if (!off) {
      push(STYLE_LABEL(w.style), single(w));
      continue;
    }
    const refs = [ref(w), ref(off)];
    push(STYLE_LABEL(w.style), {
      key: 'pair:' + w.id + '|' + off.id,
      kind: 'pair',
      name: w.name + ' + ' + off.name,
      refs,
      chosen: refs,
      score: Math.max(itemUsage(usage, ref(w)), itemUsage(usage, ref(off))),
      tier: Math.max(w.tier, off.tier),
    });
  }
  return sections(byKey, [...STYLES4, 'Any style', 'shields'], (k) => (k === 'shields' ? 'Shields & defenders' : k), f, { tiered: true, exempt: (e) => e.kind !== 'single' || e.refs.some((r) => !!byId.get(r.id)?.spec) });
}

// ---------------------------------------------------------------- gear families

/** the words that name the slot inside an item name – what is left names the family */
const SLOT_WORDS =
  /\b(full helm|helm|helmet|hood|mask|coif|cowl|crown|hat|goggles|headpiece|platebody|chestplate|hauberk|robe top|body|top|cuirass|torso|tunic|platelegs|chaps|robe bottom|robe legs|bottoms|legs|tassets|greaves|leggings|chainskirt|plateskirt|skirt|gloves|gauntlets|vambraces|bracers|hand wraps?|wrist wraps|handwraps|boots|foot wraps|footwraps|shoes|sabatons|backpack|cape|cloak)\b/gi;
/** "(tier 90)", "(e)", "(alloy)" …: the same item in another tier or enchantment */
const VARIANT_SUFFIX = /\s*\((tier \d+|e|i|or|alloy|meagre|saturated|charged|uncharged)\)\s*$/i;
/** the TzHaar capes: one family per line, the style suffix is the variant */
const KAL_CAPE = /^((?:igneous |tokhaar-)?kal)-[a-z]+$/i;

/** The family an item belongs to: its name without slot word, tier / enchantment suffix and "Enhanced" prefix. */
export function familyKey(name: string): string {
  let key = name.toLowerCase().replace(VARIANT_SUFFIX, '').trim();
  const kal = KAL_CAPE.exec(key);
  if (kal) return kal[1];
  key = key.replace(/^enhanced\s+/, '');
  key = key.replace(SLOT_WORDS, ' ').replace(/\s+/g, ' ').trim();
  key = key.replace(/^of\s+/, '');
  return key;
}

/** the family's name for the catalog, built from a piece's name the same way but keeping its case */
export function familyLabel(name: string): string {
  let label = name.replace(VARIANT_SUFFIX, '').trim();
  const kal = KAL_CAPE.exec(label);
  if (kal) return kal[1] + '-*';
  label = label.replace(/^Enhanced\s+/i, '');
  label = label.replace(SLOT_WORDS, ' ').replace(/\s+/g, ' ').trim();
  label = label.replace(/^of\s+/i, '');
  return label ? label[0].toUpperCase() + label.slice(1) : name;
}

/**
 * Every gear item in exactly one family entry: pieces of one set effect, else pieces sharing a family name. A
 * family over several slots is a set (worn whole, best variant per slot); several items of one slot are variants
 * (one is worn); one item stands alone.
 */
export function gearEntries(gear: GearItem[], setById: Map<string, SetEffect>, usage: UsageStats | null): CatalogEntry[] {
  const families = new Map<string, GearItem[]>();
  for (const g of gear) {
    const key = g.set ? 'set:' + g.set : 'fam:' + familyKey(g.name);
    families.set(key, [...(families.get(key) ?? []), g]);
  }
  const ref = (g: GearItem): ItemRef => ({ kind: 'gear', id: g.id });
  const out: CatalogEntry[] = [];
  for (const [key, pieces] of families) {
    // of one piece in several tiers only the highest is offered (Deathdealer tier 90, not 70 and 80; Enhanced blast
    // diffusion boots, not the plain ones) – per style, so the Igneous Kal-* capes of every style stay
    const top = new Map<string, number>();
    for (const g of pieces) {
      const k = g.slot + '|' + (g.style ?? '');
      top.set(k, Math.max(top.get(k) ?? 0, g.tier));
    }
    const ordered = pieces
      .filter((g) => g.tier >= (top.get(g.slot + '|' + (g.style ?? '')) ?? 0))
      .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) || itemUsage(usage, ref(b)) - itemUsage(usage, ref(a)) || b.tier - a.tier || a.name.localeCompare(b.name));
    const slots = new Set(ordered.map((p) => p.slot));
    const chosen = [...slots].map((slot) => ordered.find((p) => p.slot === slot)!);
    const kind: EntryKind = ordered.length === 1 ? 'single' : slots.size > 1 ? 'set' : 'variants';
    const setName = key.startsWith('set:') ? setById.get(key.slice(4))?.name.replace(VARIANT_SUFFIX, '') : undefined;
    // variants of one item keep the best one's name (Gloves of passage · 2 variants); the TzHaar capes their line
    const variantsLabel = setName ?? (KAL_CAPE.test(ordered[0].name) ? familyLabel(ordered[0].name) : ordered[0].name.replace(VARIANT_SUFFIX, '').replace(/^Enhanced\s+/i, '').trim());
    const name = kind === 'single' ? ordered[0].name : kind === 'variants' ? variantsLabel + ' · ' + ordered.length + ' variants' : setName ?? familyLabel(ordered[0].name);
    out.push({
      key,
      kind,
      name,
      refs: ordered.map(ref),
      chosen: chosen.map(ref),
      score: Math.max(...ordered.map((p) => itemUsage(usage, ref(p)))),
      tier: Math.max(...ordered.map((p) => p.tier)),
    });
  }
  return out;
}

const gearStyle = (gear: Map<string, GearItem>, e: CatalogEntry) => {
  const styles = e.chosen.map((r) => gear.get(r.id)?.style);
  return STYLE_LABEL(styles.find((s) => s && s !== 'Hybrid') ?? styles[0]);
};

/** Armour by style: the families that hold a head / body / legs / hands / feet piece. */
export function armourSections(gear: GearItem[], setById: Map<string, SetEffect>, usage: UsageStats | null, f: CatalogFilter): CatalogSection[] {
  const byId = new Map(gear.map((g) => [g.id, g]));
  const byKey = new Map<string, CatalogEntry[]>();
  for (const e of gearEntries(gear, setById, usage)) {
    if (!e.refs.some((r) => ARMOUR_SLOTS.includes(byId.get(r.id)!.slot))) continue;
    const key = gearStyle(byId, e);
    byKey.set(key, [...(byKey.get(key) ?? []), e]);
  }
  return sections(byKey, [...STYLES4, 'Any style'], (k) => k, f, { tiered: true, exempt: (e) => e.kind !== 'single' || e.refs.some((r) => !!byId.get(r.id)?.passive) });
}

/** Capes, jewellery, ammunition, pocket items and sigils, one section per slot (the families without an armour piece). */
export function accessorySections(gear: GearItem[], usage: UsageStats | null, f: CatalogFilter): CatalogSection[] {
  const byId = new Map(gear.map((g) => [g.id, g]));
  const byKey = new Map<string, CatalogEntry[]>();
  for (const e of gearEntries(gear, new Map(), usage)) {
    const slot = byId.get(e.chosen[0].id)!.slot;
    if (!ACCESSORY_SLOTS.includes(slot) || e.refs.some((r) => ARMOUR_SLOTS.includes(byId.get(r.id)!.slot))) continue;
    byKey.set(slot, [...(byKey.get(slot) ?? []), e]);
  }
  return sections(byKey, ACCESSORY_SLOTS, (k) => SLOT_NAMES[k as EquipSlot] ?? k, f, { tiered: false });
}

export function potionSections(specials: Special[], usage: UsageStats | null, f: CatalogFilter): CatalogSection[] {
  const entries = specials
    .filter((s) => s.kind !== 'scroll') // scrolls come with the familiar
    .map<CatalogEntry>((s) => ({ key: 'special:' + s.id, kind: 'single', name: s.name, refs: [{ kind: 'special', id: s.id }], chosen: [{ kind: 'special', id: s.id }], score: itemUsage(usage, { kind: 'special', id: s.id }), tier: 0 }));
  const list = finish(entries, { ...f, hide: false }, { tiered: false });
  return list.length ? [{ key: 'potions', label: 'Potions & bombs', entries: list }] : [];
}

/** the style label a weapon or armour piece is filed under */
export function styleLabel(style: Style | 'Hybrid' | null | undefined): string {
  return STYLE_LABEL(style);
}

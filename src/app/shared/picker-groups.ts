/**
 * Grouping and filtering for the setup pickers (Train, Loadout and Rotations pages): with every PvME boss setup
 * added a player holds over a hundred setups, and a flat list of that size is not navigable, so every picker groups
 * by the boss and offers a search field.
 *
 * The boss comes from the setup's title, `"<boss> – <name>"` (setupTitle in core/models.ts). Entries without that
 * shape (the general setups) keep an empty group label and are listed first, so a handful of own setups still looks
 * like the plain list it was.
 */

/** what a setup title puts between the boss and the rest of the name (core/models.ts setupTitle) */
export const GROUP_SEPARATOR = ' · ';
/** builds up to Sept 2026 wrote a dash there; names stored back then still split correctly */
const LEGACY_SEPARATOR = ' – ';

export interface PickerEntry {
  id: string;
  name: string;
  /** set on everything that came from a PvME boss preset (presets.json id) */
  presetId?: string;
}

export interface PickerGroup<T extends PickerEntry> {
  /** the boss, '' for entries that carry no boss prefix */
  label: string;
  /** the entries of this group with the label they get inside it (the repeated boss prefix removed) */
  items: { item: T; label: string }[];
}

/**
 * Splits "Rasial, the First Necromancer – base rotation" into its boss and the rest. Only the first separator counts,
 * because a rotation name may carry more of them ("Zamorak – 4-man – p2 only").
 */
export function splitName(name: string): { group: string; rest: string } {
  const sep = name.includes(GROUP_SEPARATOR) ? GROUP_SEPARATOR : LEGACY_SEPARATOR;
  const i = name.indexOf(sep);
  if (i <= 0) return { group: '', rest: name };
  const rest = name.slice(i + sep.length).trim();
  return rest ? { group: name.slice(0, i).trim(), rest } : { group: '', rest: name };
}

/** the boss an entry belongs to, '' when it has none */
export function groupOf(item: PickerEntry): string {
  return splitName(item.name).group;
}

/**
 * Groups entries by boss, keeping the order they arrive in – both between the groups (first appearance) and inside
 * one. Entries without a boss come first, in one group labelled ''.
 */
export function groupEntries<T extends PickerEntry>(items: T[]): PickerGroup<T>[] {
  const byLabel = new Map<string, PickerGroup<T>>();
  const groups: PickerGroup<T>[] = [];
  const ungrouped: PickerGroup<T> = { label: '', items: [] };
  for (const item of items) {
    const { group, rest } = splitName(item.name);
    if (!group) {
      ungrouped.items.push({ item, label: item.name });
      continue;
    }
    let g = byLabel.get(group);
    if (!g) {
      g = { label: group, items: [] };
      byLabel.set(group, g);
      groups.push(g);
    }
    g.items.push({ item, label: rest });
  }
  return ungrouped.items.length ? [ungrouped, ...groups] : groups;
}

/** every boss that appears in the list, sorted for a filter dropdown */
export function groupLabels(items: PickerEntry[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const g = groupOf(item);
    if (g) set.add(g);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Narrows a list to the entries whose name contains every word of the query (case-insensitive, so "rasial pre" finds
 * "Rasial, the First Necromancer – prebuild"). `keep` is the entry the picker currently shows: it stays in the list
 * even when it does not match, so a `<select>` never loses its own selection while the player types.
 */
export function filterEntries<T extends PickerEntry>(items: T[], query: string, keep?: string | null): T[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((item) => {
    if (keep && item.id === keep) return true;
    const name = item.name.toLowerCase();
    return words.every((w) => name.includes(w));
  });
}

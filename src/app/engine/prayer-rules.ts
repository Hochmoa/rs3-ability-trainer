import { Style4 } from '../core/models';

export type PrayerBook = 'Prayers' | 'Curses';

/** Prayers that cannot be active together (runescape.wiki, see docs/plan-prayers.md). Ids are the slugs of data/prayers.json. */
interface Group {
  book: PrayerBook;
  name: string;
  ids: string[];
  /** activating a member also switches off every member of these groups */
  excludes?: string[];
}

const STANDARD_STAT_GROUPS = ['defence', 'strength', 'melee-accuracy', 'ranged-accuracy', 'ranged-damage', 'magic-accuracy', 'magic-damage', 'necro-accuracy', 'necro-damage'];

export const PRAYER_GROUPS: Group[] = [
  // ---- standard book
  { book: 'Prayers', name: 'overhead', ids: ['protect-from-melee', 'protect-from-ranged', 'protect-from-magic', 'protect-from-necromancy', 'retribution', 'redemption', 'smite'] },
  { book: 'Prayers', name: 'defence', ids: ['thick-skin', 'rock-skin', 'steel-skin'] },
  { book: 'Prayers', name: 'strength', ids: ['burst-of-strength', 'superhuman-strength', 'ultimate-strength'] },
  { book: 'Prayers', name: 'melee-accuracy', ids: ['clarity-of-thought', 'improved-reflexes', 'incredible-reflexes'] },
  { book: 'Prayers', name: 'ranged-accuracy', ids: ['sharp-eye', 'hawk-eye', 'eagle-eye'] },
  { book: 'Prayers', name: 'ranged-damage', ids: ['unstoppable-force', 'unrelenting-force', 'overpowering-force'] },
  { book: 'Prayers', name: 'magic-accuracy', ids: ['mystic-will', 'mystic-lore', 'mystic-might'] },
  { book: 'Prayers', name: 'magic-damage', ids: ['charge', 'super-charge', 'overcharge'] },
  { book: 'Prayers', name: 'necro-accuracy', ids: ['decay', 'hastened-decay', 'accelerated-decay'] },
  { book: 'Prayers', name: 'necro-damage', ids: ['hand-of-judgement', 'hand-of-fate', 'hand-of-doom'] },
  { book: 'Prayers', name: 'combined', ids: ['chivalry', 'piety', 'rigour', 'augury', 'sanctity', 'eclipsed-soul', 'divine-rage'], excludes: STANDARD_STAT_GROUPS },
  { book: 'Prayers', name: 'heal', ids: ['rapid-heal', 'rapid-renewal'] },
  // ---- ancient curses
  { book: 'Curses', name: 'overhead', ids: ['deflect-melee', 'deflect-ranged', 'deflect-magic', 'deflect-necromancy', 'soul-split', 'wrath'] },
  { book: 'Curses', name: 'boost', ids: ['turmoil', 'anguish', 'torment', 'sorrow', 'malevolence', 'desolation', 'affliction', 'ruination'], excludes: ['sap', 'leech', 'fortitude'] },
  { book: 'Curses', name: 'fortitude', ids: ['fortitude'], excludes: ['sap', 'leech', 'boost'] },
  { book: 'Curses', name: 'sap', ids: ['sap-melee-attack', 'sap-melee-strength', 'sap-ranged-attack', 'sap-ranged-strength', 'sap-magic-attack', 'sap-magic-strength', 'sap-necromancy-attack', 'sap-necromancy-strength', 'sap-defence', 'sap-adrenaline'], excludes: ['boost', 'fortitude'] },
  { book: 'Curses', name: 'leech', ids: ['leech-melee-attack', 'leech-melee-strength', 'leech-ranged-attack', 'leech-ranged-strength', 'leech-magic-attack', 'leech-magic-strength', 'leech-necromancy-attack', 'leech-necromancy-strength', 'leech-defence', 'leech-adrenaline', 'leech-run-energy'], excludes: ['boost', 'fortitude'] },
  { book: 'Curses', name: 'form', ids: ['light-form', 'dark-form'] },
  { book: 'Curses', name: 'team', ids: ['soul-link', 'teamwork-protection'] },
];

/** sap and leech of the same stat cannot be active together; other saps/leeches stack */
const STACKING_GROUPS = new Set(['sap', 'leech']);

/** which overhead protects against which attack style */
export const PROTECTION: Record<PrayerBook, Record<Style4, string>> = {
  Prayers: { Melee: 'protect-from-melee', Ranged: 'protect-from-ranged', Magic: 'protect-from-magic', Necromancy: 'protect-from-necromancy' },
  Curses: { Melee: 'deflect-melee', Ranged: 'deflect-ranged', Magic: 'deflect-magic', Necromancy: 'deflect-necromancy' },
};

export const SOUL_SPLIT = 'soul-split';

export function bookOf(prayerId: string): PrayerBook | null {
  for (const g of PRAYER_GROUPS) if (g.ids.includes(prayerId)) return g.book;
  return BOOK_HINT.get(prayerId) ?? null;
}

/** prayers outside every exclusion group still belong to a book */
const BOOK_HINT = new Map<string, PrayerBook>([
  ['protect-from-summoning', 'Prayers'], ['protect-item', 'Prayers'], ['rapid-restore', 'Prayers'],
  ['deflect-summoning', 'Curses'], ['berserker', 'Curses'], ['chronicle-attraction', 'Curses'], ['superheat-form', 'Curses'],
]);

export function groupsOf(prayerId: string): Group[] {
  return PRAYER_GROUPS.filter((g) => g.ids.includes(prayerId));
}

export interface PrayerToggle {
  active: Set<string>;
  /** true = switched on, false = switched off */
  on: boolean;
  /** prayers switched off because they conflict */
  replaced: string[];
}

/** Pressing prayer `id` with the given active set, like the in-game toggle with automatic deactivation of conflicts. */
export function togglePrayer(active: ReadonlySet<string>, id: string): PrayerToggle {
  const next = new Set(active);
  if (next.has(id)) {
    next.delete(id);
    return { active: next, on: false, replaced: [] };
  }
  const replaced: string[] = [];
  const mine = groupsOf(id);
  const excluded = new Set<string>(mine.flatMap((g) => g.excludes ?? []));
  for (const other of active) {
    if (other === id) continue;
    const theirs = groupsOf(other);
    let conflict = theirs.some((g) => excluded.has(g.name));
    if (!conflict) {
      for (const g of mine) {
        if (!g.ids.includes(other)) continue;
        // same group: exclusive, except saps/leeches which only clash per stat
        conflict = !STACKING_GROUPS.has(g.name) || sameStat(id, other);
        if (conflict) break;
      }
    }
    // sap and leech of the same stat clash across the two groups
    if (!conflict && isSapOrLeech(id) && isSapOrLeech(other) && sameStat(id, other)) conflict = true;
    if (conflict) {
      next.delete(other);
      replaced.push(other);
    }
  }
  next.add(id);
  return { active: next, on: true, replaced };
}

function isSapOrLeech(id: string): boolean {
  return id.startsWith('sap-') || id.startsWith('leech-');
}

/** "sap-melee-attack" and "leech-melee-attack" target the same stat */
function sameStat(a: string, b: string): boolean {
  const stat = (s: string) => s.replace(/^(sap|leech)-/, '');
  return stat(a) === stat(b);
}

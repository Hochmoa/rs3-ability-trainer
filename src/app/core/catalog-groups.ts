import { Entity } from './data.service';

/** One header row of a catalog: abilities of one type, or everything else of one catalog group. */
export interface CatalogGroup {
  key: string;
  label: string;
  /** an ability-type group (Basic, Enhanced …) – always gets a header, like the game's ability book */
  ability: boolean;
  entities: Entity[];
}

const TYPE_ORDER = ['Basic', 'Enhanced', 'Threshold', 'Ultimate', 'Incantation', 'Special'];
const GROUP_ORDER = ['Melee', 'Ranged', 'Magic', 'Necromancy', 'Defence', 'Constitution', 'Prayers', 'Curses', 'Special', 'Weapons', 'Specs', 'Actions'];

function rank(key: string): number {
  const [kind, name] = key.split(':', 2);
  const list = kind === 'type' ? TYPE_ORDER : GROUP_ORDER;
  const i = list.indexOf(name);
  return (kind === 'type' ? 0 : 100) + (i < 0 ? list.length : i);
}

/**
 * Groups a (sorted) catalog like the game's ability book: abilities by type – Basic → Enhanced →
 * Threshold → Ultimate → Incantation → Special – then everything else by its catalog group
 * (Prayers, Curses, Special, Weapons …). The order inside a group is the order of `list`.
 */
export function groupCatalog(list: Entity[]): CatalogGroup[] {
  const map = new Map<string, CatalogGroup>();
  for (const e of list) {
    const key = e.ability ? 'type:' + e.ability.type : 'group:' + e.group;
    let g = map.get(key);
    if (!g) {
      const label = e.ability ? (e.ability.type === 'Special' ? 'Special (weapon)' : e.ability.type) : e.group;
      g = { key, label, ability: !!e.ability, entities: [] };
      map.set(key, g);
    }
    g.entities.push(e);
  }
  return [...map.values()].sort((a, b) => rank(a.key) - rank(b.key));
}

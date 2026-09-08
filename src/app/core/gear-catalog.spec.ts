import { describe, expect, it } from 'vitest';
import { accessorySections, armourSections, familyKey, familyLabel, gearEntries, offHandFor, pairWeapons, potionSections, weaponSections } from './gear-catalog';
import { GearItem, SetEffect, Special, UsageStats, Weapon } from './models';

const weapon = (id: string, p: Partial<Weapon>): Weapon =>
  ({ id, name: id, style: 'Melee', slot: 'main', type: null, tier: 90, tierDamage: 90, tierAccuracy: 90, attackStyle: null, accuracy: 0, abilityDamage: 0, armour: 0, lifePoints: 0, bonus: null, spec: null, role: null, ...p }) as Weapon;
const gear = (id: string, p: Partial<GearItem>): GearItem => ({ id, name: id, slot: 'body', style: 'Melee', tier: 90, type: null, armour: 0, lifePoints: 0, prayer: 0, set: null, passive: null, augmentable: true, icon: null, ...p });
const usage: UsageStats = {
  presets: 10,
  items: { 'weapon:roar-of-awakening': 6, 'weapon:ode-to-deceit': 7, 'weapon:bolg': 23, 'weapon:sliver': 22, 'weapon:dba': 13, 'gear:havoc-top': 55, 'gear:kal-zuk': 91, 'gear:kal-ket': 9, 'gear:sliske-body': 4, 'gear:dd-top-90': 2, 'gear:dd-top-70': 1, 'gear:dd-hood-90': 2, 'special:vuln': 100 },
  pairs: { 'roar-of-awakening|ode-to-deceit': 7, 'dba|sliver': 13 },
  eofSpecs: {},
  specSteps: {},
};
const filter = { query: '', hide: true, threshold: 1, minTier: 1 };

const weapons = [
  weapon('roar-of-awakening', { name: 'Roar of Awakening', style: 'Magic' }),
  weapon('ode-to-deceit', { name: 'Ode to Deceit', style: 'Magic', slot: 'off' }),
  weapon('rebounder', { name: 'Kalphite rebounder', style: 'Magic', slot: 'off' }),
  weapon('bolg', { name: 'Bow of the Last Guardian', style: 'Ranged', slot: '2h' }),
  weapon('dba', { name: 'Dragon battleaxe', tier: 60 }),
  weapon('sliver', { name: 'Dark Sliver of Leng', slot: 'off', tier: 95 }),
  weapon('drygore', { name: 'Drygore rapier' }),
  weapon('drygore-off', { name: 'Off-hand drygore rapier', slot: 'off' }),
  weapon('shield', { name: 'Elysian spirit shield', slot: 'shield', type: 'Shield' }),
  weapon('junk', { name: 'Bronze dagger', tier: 1 }),
  weapon('keris', { name: 'Consecrated keris' }),
  weapon('shard', { name: 'Dark Shard of Leng', tier: 95 }),
  weapon('seismic', { name: 'Seismic wand', style: 'Magic' }),
  weapon('singularity', { name: 'Seismic singularity', style: 'Magic', slot: 'off' }),
  weapon('primal', { name: 'Primal warhammer + 5' }),
  weapon('primal-off', { name: 'Primal off hand warhammer + 5', slot: 'off' }),
];

describe('weaponSections – weapons in the groups they are wielded in, every weapon in one group', () => {
  it('pairs by what belongs together: the named pairs, the "Off-hand …" twin, the twin word – never by a preset', () => {
    const pairs = pairWeapons(weapons);
    expect(pairs.get('ode-to-deceit')).toBe('roar-of-awakening'); // named pair
    expect(pairs.get('sliver')).toBe('shard'); // shard → sliver, although the presets wield it with the battleaxe
    expect(pairs.get('drygore-off')).toBe('drygore'); // "Off-hand drygore rapier"
    expect(pairs.get('primal-off')).toBe('primal'); // "Primal off hand warhammer + 5"
    expect(pairs.get('singularity')).toBe('seismic'); // wand → singularity
    expect(pairs.has('rebounder')).toBe(false);
    expect(offHandFor(weapons[0], weapons)?.id).toBe('ode-to-deceit');
    expect(offHandFor(weapons[4], weapons)).toBeNull(); // the battleaxe stands alone
  });

  it('groups by style, sorts by usage then tier, hides what no preset uses, and lists nothing twice', () => {
    const s = weaponSections(weapons, usage, filter);
    expect(s.map((x) => x.label)).toEqual(['Melee', 'Ranged', 'Magic']);
    const magic = s.find((x) => x.label === 'Magic')!;
    expect(magic.entries.map((e) => [e.kind, e.name, e.score])).toEqual([['pair', 'Roar of Awakening + Ode to Deceit', 7]]);
    const melee = s.find((x) => x.label === 'Melee')!;
    expect(melee.entries.map((e) => e.name)).toEqual(['Dark Shard of Leng + Dark Sliver of Leng', 'Dragon battleaxe']);
    expect(melee.entries[0]).toMatchObject({ kind: 'pair', score: 22, tier: 95 });
    // the keris (score 0) stands alone and is hidden, the shield too
    expect(s.some((x) => x.label.startsWith('Shields'))).toBe(false);
    const all = weaponSections(weapons, usage, { ...filter, hide: false }).flatMap((x) => x.entries.flatMap((e) => e.refs.map((r) => r.id)));
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(weapons.length);
  });

  it('a search shows everything that matches, hidden or not', () => {
    const s = weaponSections(weapons, usage, { ...filter, query: 'drygore' });
    expect(s.flatMap((x) => x.entries.map((e) => e.name))).toEqual(['Drygore rapier + Off-hand drygore rapier']);
  });

  it('with hiding off the tier filter still applies, shields get their own section', () => {
    const s = weaponSections(weapons, usage, { ...filter, hide: false, minTier: 80 });
    expect(s.flatMap((x) => x.entries.map((e) => e.name))).not.toContain('Bronze dagger');
    expect(s.find((x) => x.label === 'Shields & defenders')?.entries[0].name).toBe('Elysian spirit shield');
  });
});

describe('gear families – sets, name families and variants', () => {
  it('the family key drops the slot word, the tier / enchantment suffix and "Enhanced"; the TzHaar capes are one family per line', () => {
    expect(familyKey('Anima core helm of Sliske')).toBe('anima core of sliske');
    expect(familyKey('Anima core body of Sliske')).toBe('anima core of sliske');
    expect(familyKey('Robe top of the First Necromancer')).toBe('the first necromancer');
    expect(familyKey('Masterwork ranged cowl')).toBe('masterwork ranged');
    expect(familyKey('Deathwarden robe top (tier 90)')).toBe('deathwarden');
    expect(familyKey('Enhanced blast diffusion boots')).toBe(familyKey('Blast diffusion boots'));
    expect(familyKey('Igneous Kal-Zuk')).toBe('igneous kal');
    expect(familyKey('Igneous Kal-Ket')).toBe('igneous kal');
    expect(familyKey('TokHaar-Kal-Xil')).toBe('tokhaar-kal');
    expect(familyKey('Salve amulet (e)')).toBe('salve amulet');
    expect(familyKey('Reaver’s ring')).toBe('reaver’s ring');
    expect(familyLabel('Anima core helm of Sliske')).toBe('Anima core of Sliske');
    expect(familyLabel('Igneous Kal-Mej')).toBe('Igneous Kal-*');
  });

  const sets = new Map<string, SetEffect>([
    ['havoc', { id: 'havoc', name: 'Vestments of Havoc', kind: 'set' } as SetEffect],
    ['deathdealer', { id: 'deathdealer', name: 'Deathdealer robes', kind: 'set' } as SetEffect],
  ]);
  const items = [
    gear('havoc-hood', { name: 'Vestments of havoc hood', slot: 'head', style: 'Necromancy', set: 'havoc', tier: 95 }),
    gear('havoc-top', { name: 'Vestments of havoc robe top', slot: 'body', style: 'Necromancy', set: 'havoc', tier: 95 }),
    gear('havoc-boots', { name: 'Vestments of havoc boots', slot: 'feet', style: 'Necromancy', set: 'havoc', tier: 95 }),
    gear('sliske-helm', { name: 'Anima core helm of Sliske', slot: 'head', style: 'Hybrid', tier: 80 }),
    gear('sliske-body', { name: 'Anima core body of Sliske', slot: 'body', style: 'Hybrid', tier: 80 }),
    gear('dd-hood-90', { name: 'Deathdealer hood (tier 90)', slot: 'head', style: 'Necromancy', set: 'deathdealer', tier: 90 }),
    gear('dd-top-90', { name: 'Deathdealer robe top (tier 90)', slot: 'body', style: 'Necromancy', set: 'deathdealer', tier: 90 }),
    gear('dd-top-70', { name: 'Deathdealer robe top (tier 70)', slot: 'body', style: 'Necromancy', set: 'deathdealer', tier: 70 }),
    gear('gloves', { name: 'Gloves of passage', slot: 'hands', style: 'Melee', tier: 90 }),
    gear('kal-zuk', { name: 'Igneous Kal-Zuk', slot: 'cape', style: 'Hybrid', tier: 95 }),
    gear('kal-ket', { name: 'Igneous Kal-Ket', slot: 'cape', style: 'Melee', tier: 85 }),
    gear('kal-mej', { name: 'Igneous Kal-Mej', slot: 'cape', style: 'Magic', tier: 85 }),
    gear('old', { name: 'Bronze platebody', slot: 'body', tier: 1 }),
  ];

  it('a set effect or a shared name makes a set; of several tiers of a piece only the highest is offered', () => {
    const entries = gearEntries(items, sets, usage);
    const havoc = entries.find((e) => e.key === 'set:havoc')!;
    expect(havoc).toMatchObject({ kind: 'set', name: 'Vestments of Havoc', score: 55 });
    expect(havoc.refs.map((r) => r.id)).toEqual(['havoc-hood', 'havoc-top', 'havoc-boots']);
    const sliske = entries.find((e) => e.name === 'Anima core of Sliske')!;
    expect(sliske.kind).toBe('set');
    expect(sliske.chosen.map((r) => r.id)).toEqual(['sliske-helm', 'sliske-body']);
    const dd = entries.find((e) => e.key === 'set:deathdealer')!;
    expect(dd.name).toBe('Deathdealer robes');
    expect(dd.refs.map((r) => r.id)).toEqual(['dd-hood-90', 'dd-top-90']); // the tier 70 top is not offered
    expect(dd.chosen.map((r) => r.id)).toEqual(['dd-hood-90', 'dd-top-90']);
    // every offered item in exactly one entry
    const all = entries.flatMap((e) => e.refs.map((r) => r.id));
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(items.length - 1);
  });

  it('the Igneous capes are one variants entry that wears the most used one', () => {
    const capes = accessorySections(items, usage, filter).find((s) => s.label === 'Cape')!;
    expect(capes.entries).toHaveLength(1);
    expect(capes.entries[0]).toMatchObject({ kind: 'variants', name: 'Igneous Kal-* · 3 variants', score: 91 });
    expect(capes.entries[0].chosen.map((r) => r.id)).toEqual(['kal-zuk']);
  });

  it('the armour tab holds the families with an armour piece, by style; loose unused pieces are hidden', () => {
    const s = armourSections(items, sets, usage, filter);
    expect(s.map((x) => [x.label, x.entries.map((e) => e.name)])).toEqual([
      ['Necromancy', ['Vestments of Havoc', 'Deathdealer robes']],
      ['Any style', ['Anima core of Sliske']],
    ]);
  });

  it('an id the data holds twice is listed once, and wearing a multi-style set stays in one style', () => {
    const dupes = [...items, gear('kal-zuk', { name: 'Igneous Kal-Zuk (copy)', slot: 'cape', style: 'Hybrid', tier: 95 })];
    const all = gearEntries(dupes, sets, usage).flatMap((e) => e.refs.map((r) => r.id));
    expect(all.filter((id) => id === 'kal-zuk')).toHaveLength(1);

    const achto = [
      gear('primeval-top', { name: 'Achto Primeval robe top', slot: 'body', style: 'Melee', set: 'achto', tier: 92 }),
      gear('primeval-legs', { name: 'Achto Primeval robe legs', slot: 'legs', style: 'Melee', set: 'achto', tier: 92 }),
      gear('tempest-top', { name: 'Achto Tempest cowl', slot: 'body', style: 'Ranged', set: 'achto', tier: 92 }),
      gear('tempest-legs', { name: 'Achto Tempest chaps', slot: 'legs', style: 'Ranged', set: 'achto', tier: 92 }),
    ];
    const e = gearEntries(achto, new Map([['achto', { id: 'achto', name: 'Achto', kind: 'set' } as SetEffect]]), null)[0];
    expect(e.refs).toHaveLength(4);
    const styles = new Set(e.chosen.map((r) => achto.find((g) => g.id === r.id)!.style));
    expect(styles.size).toBe(1);
  });

  it('potions sit in one section', () => {
    const pot = potionSections([{ id: 'vuln', name: 'Vulnerability bomb', kind: 'bomb' } as Special, { id: 'scroll', name: 'Scroll', kind: 'scroll' } as Special], usage, filter);
    expect(pot[0].entries.map((e) => e.name)).toEqual(['Vulnerability bomb']);
  });
});

import { describe, expect, it } from 'vitest';
import { accessorySections, armourSections, offHandFor, potionSections, weaponSections } from './gear-catalog';
import { GearItem, SetEffect, Special, UsageStats, Weapon } from './models';

const weapon = (id: string, p: Partial<Weapon>): Weapon =>
  ({ id, name: id, style: 'Melee', slot: 'main', type: null, tier: 90, tierDamage: 90, tierAccuracy: 90, attackStyle: null, accuracy: 0, abilityDamage: 0, armour: 0, lifePoints: 0, bonus: null, spec: null, role: null, ...p }) as Weapon;
const gear = (id: string, p: Partial<GearItem>): GearItem => ({ id, name: id, slot: 'body', style: 'Melee', tier: 90, type: null, armour: 0, lifePoints: 0, prayer: 0, set: null, passive: null, augmentable: true, icon: null, ...p });
const usage: UsageStats = { presets: 10, items: { 'weapon:roar': 6, 'weapon:ode': 7, 'weapon:bolg': 23, 'weapon:sliver': 22, 'weapon:dba': 13, 'gear:havoc-top': 55, 'gear:kal-zuk': 91, 'special:vuln': 100 }, pairs: { 'roar|ode': 7, 'roar|rebounder': 1, 'dba|sliver': 13, 'keris|sliver': 2 }, eofSpecs: {}, specSteps: {} };
const filter = { query: '', hide: true, threshold: 1, minTier: 1 };

const weapons = [
  weapon('roar', { name: 'Roar of Awakening', style: 'Magic' }),
  weapon('ode', { name: 'Ode to Deceit', style: 'Magic', slot: 'off' }),
  weapon('rebounder', { name: 'Kalphite rebounder', style: 'Magic', slot: 'off' }),
  weapon('bolg', { name: 'Bow of the Last Guardian', style: 'Ranged', slot: '2h' }),
  weapon('dba', { name: 'Dragon battleaxe', tier: 60 }),
  weapon('sliver', { name: 'Dark Sliver of Leng', slot: 'off', tier: 95 }),
  weapon('drygore', { name: 'Drygore rapier' }),
  weapon('drygore-off', { name: 'Off-hand drygore rapier', slot: 'off' }),
  weapon('shield', { name: 'Elysian spirit shield', slot: 'shield', type: 'Shield' }),
  weapon('junk', { name: 'Bronze dagger', tier: 1 }),
  weapon('keris', { name: 'Consecrated keris' }),
];

describe('weaponSections – weapons in the groups they are wielded in', () => {
  it('pairs a main-hand with the off-hand the presets use most, or with its "Off-hand …" twin', () => {
    expect(offHandFor(weapons[0], weapons, usage)?.id).toBe('ode');
    expect(offHandFor(weapons[6], weapons, usage)?.id).toBe('drygore-off');
    expect(offHandFor(weapons[9], weapons, usage)).toBeNull();
  });

  it('groups by style, sorts by usage then tier, and hides what no preset uses', () => {
    const s = weaponSections(weapons, usage, filter);
    expect(s.map((x) => x.label)).toEqual(['Melee', 'Ranged', 'Magic']);
    const magic = s.find((x) => x.label === 'Magic')!;
    expect(magic.entries.map((e) => [e.kind, e.name, e.score])).toEqual([['pair', 'Roar of Awakening + Ode to Deceit', 7]]);
    const melee = s.find((x) => x.label === 'Melee')!;
    expect(melee.entries[0]).toMatchObject({ kind: 'single', name: 'Dark Sliver of Leng', score: 22 });
    expect(melee.entries[1]).toMatchObject({ kind: 'pair', name: 'Dragon battleaxe + Dark Sliver of Leng', score: 13, tier: 95 });
    // the sliver also sits behind the keris (2) and alone (22 − 13 − 2 = 7 presets): listed on its own as well
    // Drygore (score 0) and the shield are hidden; the lone rebounder too
    expect(s.some((x) => x.label.startsWith('Shields'))).toBe(false);
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

describe('armourSections – sets as one entry', () => {
  const sets = new Map<string, SetEffect>([['havoc', { id: 'havoc', name: 'Vestments of Havoc', kind: 'set' } as SetEffect]]);
  const items = [
    gear('havoc-hood', { name: 'Havoc hood', slot: 'head', style: 'Necromancy', set: 'havoc', tier: 95 }),
    gear('havoc-top', { name: 'Havoc top', slot: 'body', style: 'Necromancy', set: 'havoc', tier: 95 }),
    gear('havoc-boots', { name: 'Havoc boots', slot: 'feet', style: 'Necromancy', set: 'havoc', tier: 95 }),
    gear('gloves', { name: 'Gloves of passage', slot: 'hands', style: 'Melee', tier: 90 }),
    gear('kal-zuk', { name: 'Igneous Kal-Zuk', slot: 'cape', style: null, tier: 99 }),
    gear('old', { name: 'Bronze platebody', slot: 'body', tier: 1 }),
  ];

  it('the pieces of a set are one entry in wear order, scored by the best piece', () => {
    const s = armourSections(items, sets, usage, filter);
    const necro = s.find((x) => x.label === 'Necromancy')!;
    expect(necro.entries).toHaveLength(1);
    expect(necro.entries[0]).toMatchObject({ kind: 'set', name: 'Vestments of Havoc', score: 55 });
    expect(necro.entries[0].refs.map((r) => r.id)).toEqual(['havoc-hood', 'havoc-top', 'havoc-boots']);
    // capes are accessories, not armour; unused loose pieces are hidden
    expect(s.flatMap((x) => x.entries.map((e) => e.name))).toEqual(['Vestments of Havoc']);
  });

  it('accessories sit in slot sections, potions in one', () => {
    const acc = accessorySections(items, usage, filter);
    expect(acc.map((x) => [x.label, x.entries.map((e) => e.name)])).toEqual([['Cape', ['Igneous Kal-Zuk']]]);
    const pot = potionSections([{ id: 'vuln', name: 'Vulnerability bomb', kind: 'bomb' } as Special, { id: 'scroll', name: 'Scroll', kind: 'scroll' } as Special], usage, filter);
    expect(pot[0].entries.map((e) => e.name)).toEqual(['Vulnerability bomb']);
  });
});

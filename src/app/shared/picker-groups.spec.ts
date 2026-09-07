import { describe, expect, it } from 'vitest';
import { filterEntries, groupEntries, groupLabels, groupOf, splitName } from './picker-groups';

const rotations = [
  { id: 'own', name: 'My warmup' },
  { id: 'r1', name: 'Rasial, the First Necromancer – prebuild', presetId: 'rasial' },
  { id: 'r2', name: 'Rasial, the First Necromancer – base rotation', presetId: 'rasial' },
  { id: 'z1', name: 'Zamorak, Lord of Chaos – 4-man – p2 only', presetId: 'zamorak' },
];

describe('picker grouping – the boss prefix the preset import writes', () => {
  it('splits on the first separator only, so a rotation name may carry more of them', () => {
    expect(splitName('Zamorak, Lord of Chaos – 4-man – p2 only')).toEqual({ group: 'Zamorak, Lord of Chaos', rest: '4-man – p2 only' });
    expect(splitName('My warmup')).toEqual({ group: '', rest: 'My warmup' });
    // a name that only ends in the separator has no group – the whole name stays the label
    expect(splitName('Half a name – ')).toEqual({ group: '', rest: 'Half a name – ' });
    expect(groupOf({ id: 'x', name: 'Telos – enrage 999' })).toBe('Telos');
  });

  it('keeps the incoming order and lists the entries without a boss first', () => {
    const groups = groupEntries(rotations);
    expect(groups.map((g) => g.label)).toEqual(['', 'Rasial, the First Necromancer', 'Zamorak, Lord of Chaos']);
    expect(groups[1].items.map((i) => i.label)).toEqual(['prebuild', 'base rotation']);
    // inside a group the repeated boss name is dropped, outside it the full name stays
    expect(groups[0].items[0].label).toBe('My warmup');
  });

  it('drops the empty group when every entry has a boss', () => {
    expect(groupEntries(rotations.slice(1)).map((g) => g.label)).toEqual(['Rasial, the First Necromancer', 'Zamorak, Lord of Chaos']);
    expect(groupEntries([]).length).toBe(0);
  });

  it('lists the bosses for a filter dropdown, sorted and without duplicates', () => {
    expect(groupLabels(rotations)).toEqual(['Rasial, the First Necromancer', 'Zamorak, Lord of Chaos']);
  });
});

describe('picker filtering', () => {
  it('matches every word of the query anywhere in the name, case-insensitively', () => {
    expect(filterEntries(rotations, 'rasial base').map((r) => r.id)).toEqual(['r2']);
    expect(filterEntries(rotations, '  ').map((r) => r.id)).toEqual(['own', 'r1', 'r2', 'z1']);
    expect(filterEntries(rotations, 'nothing here').length).toBe(0);
  });

  it('keeps the current selection reachable, so a select never loses what it shows', () => {
    expect(filterEntries(rotations, 'zamorak', 'r1').map((r) => r.id)).toEqual(['r1', 'z1']);
  });
});

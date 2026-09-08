import { describe, expect, it } from 'vitest';
import { EquipSlot, ItemRef, RotationStep } from './models';
import { BossPreset, assignEofSpecs, demoRotationIndex, presetLoadout } from './preset-setup';

const preset: BossPreset = {
  id: 'demo-boss-necromancy',
  boss: 'Demo boss, the Tester',
  style: 'Necromancy',
  variant: 't90',
  title: 'Demo t90',
  guide: '',
  presetUrl: null,
  notes: '',
  equipment: { mainHand: { kind: 'weapon', id: 'omni-guard' }, offHand: { kind: 'weapon', id: 'soulbound-lantern' }, head: { kind: 'gear', id: 'hood' } },
  inventory: [{ kind: 'weapon', id: 'ek-zekkil' }, null, { kind: 'special', id: 'vulnerability-bomb' }],
  unknown: [],
  rotations: [{ name: 'Opener', text: '' }],
};

const slotOf = (ref: ItemRef): EquipSlot | null => (ref.id === 'omni-guard' ? 'mainHand' : ref.id === 'soulbound-lantern' ? 'offHand' : ref.id === 'hood' ? 'head' : null);

const step = (kind: RotationStep['kind'], id: string): RotationStep => ({ kind, id });

describe('preset loadout', () => {
  it('re-slots the worn items, keeps the backpack and names the loadout after the preset', () => {
    const l = presetLoadout(preset, slotOf);
    expect(l.name).toBe('Demo t90');
    expect(l.presetId).toBe(preset.id);
    expect(l.equipment?.mainHand?.id).toBe('omni-guard');
    expect(l.equipment?.head?.id).toBe('hood');
    expect(l.inventory[0]?.id).toBe('ek-zekkil');
    expect(l.inventory[1]).toBeNull();
    expect(l.prayerBook).toBe('Curses');
  });

  it('takes the relics, the familiar and the ammunition the preset maker stores next to the gear', () => {
    const l = presetLoadout({ ...preset, relics: ['conservation-of-energy', 'fury-of-the-small'], familiar: 'kalgerion-demon', ammo: 'deathspore-arrows' }, slotOf);
    expect(l.relics).toEqual(['conservation-of-energy', 'fury-of-the-small']);
    expect(l.familiar).toBe('kalgerion-demon');
    expect(l.equipment?.ammo).toEqual({ kind: 'gear', id: 'deathspore-arrows' });
  });

  it('puts the perks a guide names on the gear: weapon perks on the weapon, the rest on body and legs', () => {
    const gizmos: Record<string, string[]> = { biting: ['armour', 'weapon'], 'planted-feet': ['weapon'], relentless: ['ancient-armour', 'ancient-weapon'], genocidal: ['armour', 'weapon'] };
    const two: BossPreset = {
      ...preset,
      equipment: { twoHand: { kind: 'weapon', id: 'ek-zekkil' }, body: { kind: 'gear', id: 'top' }, legs: { kind: 'gear', id: 'bottom' } },
      perks: [{ id: 'biting', rank: 4 }, { id: 'planted-feet', rank: 1 }, { id: 'relentless', rank: 5 }, { id: 'genocidal', rank: 1 }],
    };
    const slots = (r: ItemRef): EquipSlot | null => (r.id === 'ek-zekkil' ? 'twoHand' : r.id === 'top' ? 'body' : r.id === 'bottom' ? 'legs' : null);
    const l = presetLoadout(two, slots, (id) => gizmos[id]);
    const onWeapon = (l.equipment?.twoHand?.gizmos ?? []).flatMap((g) => g.perks.map((x) => x.perk));
    const onArmour = [...(l.equipment?.body?.gizmos ?? []), ...(l.equipment?.legs?.gizmos ?? [])].flatMap((g) => g.perks.map((x) => x.perk));
    expect(onWeapon).toContain('biting');
    expect(onWeapon).toContain('planted-feet');
    expect([...onWeapon, ...onArmour]).toContain('relentless');
    expect((l.equipment?.twoHand?.gizmos ?? []).find((g) => g.perks.some((x) => x.perk === 'relentless'))?.ancient ?? true).toBe(true);
    expect(l.equipment?.twoHand?.gizmos?.every((g) => g.perks.length <= 2)).toBe(true);
    expect((l.equipment?.twoHand?.gizmos ?? []).flatMap((g) => g.perks).find((x) => x.perk === 'biting')?.rank).toBe(4);
  });

  it('a preset without them keeps the loadout defaults, and worn ammunition wins over the preset maker field', () => {
    expect(presetLoadout(preset, slotOf).relics).toEqual([]);
    expect(presetLoadout(preset, slotOf).familiar ?? null).toBeNull();
    const worn: BossPreset = { ...preset, ammo: 'deathspore-arrows', equipment: { ...preset.equipment, ammo: { kind: 'gear', id: 'ful-arrow' } } };
    expect(presetLoadout(worn, (r) => (r.id === 'ful-arrow' ? 'ammo' : slotOf(r))).equipment?.ammo?.id).toBe('ful-arrow');
  });
});

describe('Essence of Finality amulets', () => {
  const eof = (spec?: string): ItemRef => ({ kind: 'gear', id: 'essence-of-finality-amulet', ...(spec ? { spec } : {}) });

  it("what the guide's own amulets already store is not stored a second time", () => {
    const amulets = [eof('split-soul'), eof('shadowfall')];
    expect(assignEofSpecs(amulets, ['split-soul', 'shadowfall'])).toEqual([]);
    expect(amulets.map((a) => a.spec)).toEqual(['split-soul', 'shadowfall']);
  });

  it('empty amulets are filled in order, one special each', () => {
    const amulets = [eof(), eof()];
    expect(assignEofSpecs(amulets, ['reap', 'devour'])).toEqual([]);
    expect(amulets.map((a) => a.spec)).toEqual(['reap', 'devour']);
  });

  it('a special with no amulet left is reported so the caller can add one', () => {
    const amulets = [eof('split-soul'), eof()];
    expect(assignEofSpecs(amulets, ['split-soul', 'reap', 'devour'])).toEqual(['devour']);
    expect(amulets.map((a) => a.spec)).toEqual(['split-soul', 'reap']);
  });

  it('the same special asked for twice needs one amulet', () => {
    const amulets = [eof()];
    expect(assignEofSpecs(amulets, ['reap', 'reap'])).toEqual([]);
    expect(amulets.map((a) => a.spec)).toEqual(['reap']);
  });
});

describe('demo rotation', () => {
  const ability = (n: number): RotationStep[] => Array.from({ length: n }, (_, i) => step('ability', 'a' + i));
  const note: RotationStep = { kind: 'note', id: '', note: 'enter instance' };
  const phase: RotationStep = { kind: 'note', id: '', note: 'Phase 4', phase: true };

  it("takes the preset's demoRotation when it is set and valid", () => {
    expect(demoRotationIndex({ demoRotation: 2 }, [{ steps: ability(9) }, { steps: ability(9) }, { steps: ability(3) }])).toBe(2);
    expect(demoRotationIndex({ demoRotation: 7 }, [{ steps: ability(9) }, { steps: ability(3) }])).toBe(0);
  });

  it('skips a pre-build with note tiles and picks the first clean fight of at least 8 steps', () => {
    expect(demoRotationIndex({}, [{ steps: [...ability(6), note] }, { steps: ability(5) }, { steps: ability(8) }, { steps: ability(20) }])).toBe(2);
  });

  it('falls back to the rotation with the most playable steps when every one has notes or a phase heading', () => {
    expect(demoRotationIndex({}, [{ steps: [...ability(8), note] }, { steps: [phase, ...ability(30), note] }, { steps: [...ability(12), phase] }])).toBe(1);
    expect(demoRotationIndex({}, [])).toBe(0);
  });
});

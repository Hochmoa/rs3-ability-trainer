/**
 * Table-driven checks of the stored-data migrations: one fixture per "build era" a returning user can bring along
 * (pre-revolution settings, string-step rotations, pre-inventory loadouts, flag-based gear, partial bar setups).
 */
import { describe, expect, it } from 'vitest';
import { cleanStep, mergeActionBars, migrateLegacyGear, migrateRotation, migrateSettings, normaliseLoadout } from './migrations';
import { DEFAULT_SETTINGS, GearItem, INVENTORY_SIZE, Loadout, Rotation, RotationStep, Settings, newLoadout } from './models';

describe('migrateSettings', () => {
  const cases: { era: string; stored: object; expect: Partial<Settings> }[] = [
    { era: 'empty object (first visit with consent)', stored: {}, expect: { ...DEFAULT_SETTINGS } },
    { era: 'pre-revolution build (no combatMode / revolution / coach / autoAttacks)', stored: { pingMs: 90, jitterMs: 0, abilityQueueing: false, loop: true }, expect: { pingMs: 90, jitterMs: 0, abilityQueueing: false, loop: true, combatMode: 'manual', revolution: DEFAULT_SETTINGS.revolution, coach: DEFAULT_SETTINGS.coach, autoAttacks: true } },
    { era: 'queueWindowTicks 3 = queueing on', stored: { queueWindowTicks: 3 }, expect: { abilityQueueing: true } },
    { era: 'queueWindowTicks 1 = queueing off', stored: { queueWindowTicks: 1 }, expect: { abilityQueueing: false } },
    { era: 'an explicit abilityQueueing wins over queueWindowTicks', stored: { queueWindowTicks: 1, abilityQueueing: true }, expect: { abilityQueueing: true } },
    { era: 'a partial revolution object gets the missing toggles', stored: { revolution: { slots: 4 } }, expect: { revolution: { ...DEFAULT_SETTINGS.revolution, slots: 4 } } },
    { era: 'a partial coach object keeps its values and fills the rest', stored: { coach: { callouts: true } }, expect: { coach: { ...DEFAULT_SETTINGS.coach, callouts: true } } },
  ];
  for (const c of cases) {
    it(c.era, () => {
      const out = migrateSettings(c.stored as Partial<Settings>);
      expect(out).toMatchObject(c.expect);
      expect('queueWindowTicks' in out).toBe(false);
      expect(Object.keys(out).sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
    });
  }
});

describe('migrateRotation – steps stored as plain ability ids', () => {
  it('turns strings into ability steps and leaves objects alone', () => {
    const r = migrateRotation({ id: 'r', name: 'x', updatedAt: 1, steps: ['sever', { kind: 'prayer', id: 'turmoil' }] });
    expect(r.steps).toEqual([{ kind: 'ability', id: 'sever' }, { kind: 'prayer', id: 'turmoil' }]);
  });

  it('is a no-op for current rotations', () => {
    const r: Rotation = { id: 'r', name: 'x', updatedAt: 1, steps: [{ kind: 'spec', id: 'death-essence', sameTick: true }] };
    expect(migrateRotation(r)).toEqual(r);
  });
});

describe('cleanStep – only the known step fields survive a save', () => {
  const cases: { what: string; step: RotationStep & Record<string, unknown>; expect: RotationStep }[] = [
    { what: 'a plain step', step: { kind: 'ability', id: 'sever' }, expect: { kind: 'ability', id: 'sever' } },
    { what: 'PvME timing: "+" and "2t"', step: { kind: 'ability', id: 'sever', sameTick: true, offsetTicks: 2 }, expect: { kind: 'ability', id: 'sever', sameTick: true, offsetTicks: 2 } },
    { what: 'PvME channel cuts: "(4t)" and "7 hit"', step: { kind: 'ability', id: 'asphyxiate', cancelAfterTicks: 4, afterHits: 7 }, expect: { kind: 'ability', id: 'asphyxiate', cancelAfterTicks: 4, afterHits: 7 } },
    { what: 'a note with a phase heading', step: { kind: 'note', id: '', note: 'Phase 2', phase: true }, expect: { kind: 'note', id: '', note: 'Phase 2', phase: true } },
    { what: 'a hint', step: { kind: 'ability', id: 'sever', hint: '(DW)' }, expect: { kind: 'ability', id: 'sever', hint: '(DW)' } },
    { what: '"/ alt" hints from older imports are dropped', step: { kind: 'ability', id: 'sever', hint: '/ fingerofdeath' }, expect: { kind: 'ability', id: 'sever' } },
    { what: 'false flags, zero cuts and unknown fields are dropped', step: { kind: 'ability', id: 'sever', sameTick: false, phase: false, cancelAfterTicks: 0, afterHits: 0, foo: 'bar' }, expect: { kind: 'ability', id: 'sever' } },
  ];
  for (const c of cases) {
    it(c.what, () => {
      expect(cleanStep(c.step)).toEqual(c.expect);
    });
  }
});

describe('normaliseLoadout', () => {
  it('pre-inventory two-hander: the weapon and its gizmos become worn, switches carried, derived fields set', () => {
    const l = normaliseLoadout({ id: 'l', name: 'Old', twoHand: 'omni-guard', switches: ['soulbound-lantern', 'soulbound-lantern'], weaponGizmos: [{ ancient: true, perks: [{ perk: 'precise', rank: 6 }] }] } as Partial<Loadout>);
    expect(l.equipment.twoHand).toEqual({ kind: 'weapon', id: 'omni-guard', gizmos: [{ ancient: true, perks: [{ perk: 'precise', rank: 6 }] }, { ancient: false, perks: [] }] });
    expect(l.inventory).toHaveLength(INVENTORY_SIZE);
    expect(l.inventory[0]).toEqual({ kind: 'weapon', id: 'soulbound-lantern' });
    expect(l.twoHand).toBe('omni-guard');
    expect(l.mainHand).toBeNull();
    expect(l.switches).toEqual(['soulbound-lantern']);
    expect(l.weaponGizmos).toHaveLength(2);
    expect(l.armourGizmos).toHaveLength(2);
    expect(l.prayerBook).toBe('Curses');
    expect(l.spellbook).toBe('standard');
  });

  it('pre-inventory dual wield: one gizmo per hand', () => {
    const l = normaliseLoadout({ mainHand: 'a', offHand: 'b', weaponGizmos: [{ ancient: false, perks: [{ perk: 'precise', rank: 4 }] }, { ancient: false, perks: [] }] } as Partial<Loadout>);
    expect(l.equipment.mainHand).toEqual({ kind: 'weapon', id: 'a', gizmos: [{ ancient: false, perks: [{ perk: 'precise', rank: 4 }] }] });
    expect(l.equipment.offHand).toEqual({ kind: 'weapon', id: 'b' });
    expect(l.mainHand).toBe('a');
    expect(l.offHand).toBe('b');
    expect(l.twoHand).toBeNull();
  });

  it('current era: refs are cleaned, the inventory padded, a two-hander clears the hands, unknown books fall back', () => {
    const l = normaliseLoadout({
      id: 'l',
      equipment: { twoHand: { kind: 'weapon', id: 'x' }, mainHand: { kind: 'weapon', id: 'y' }, neck: { kind: 'gear', id: 'eof', spec: 'death-essence' }, ring: { kind: 'bogus' as never, id: 'r' } },
      inventory: [{ kind: 'special', id: 'adrenaline-potion', gizmos: [{ ancient: false, perks: [{ perk: 'x', rank: '3' as never }] }] }, null, { kind: 'gear', id: 7 as never }],
      prayerBook: 'Zaros' as never,
      spellbook: 'lunar',
    } as Partial<Loadout>);
    expect(l.equipment.mainHand).toBeUndefined();
    expect(l.equipment.ring).toBeUndefined();
    expect(l.equipment.neck).toEqual({ kind: 'gear', id: 'eof', spec: 'death-essence' });
    expect(l.inventory).toHaveLength(INVENTORY_SIZE);
    expect(l.inventory[0]).toEqual({ kind: 'special', id: 'adrenaline-potion', gizmos: [{ ancient: false, perks: [{ perk: 'x', rank: 3 }] }] });
    expect(l.inventory[2]).toBeNull();
    expect(l.twoHand).toBe('x');
    expect(l.prayerBook).toBe('Curses');
    expect(l.spellbook).toBe('lunar');
    expect(l.name).toBe('Default');
    expect(l.id).toBe('l');
  });

  it('a full current loadout passes through unchanged', () => {
    const base = newLoadout('Mine');
    expect(normaliseLoadout(base)).toEqual(base);
  });
});

describe('migrateLegacyGear – flags become worn items', () => {
  const gear: GearItem[] = [
    { id: 'ring-of-vigour', name: 'Ring of vigour', slot: 'ring', style: null, tier: 70, type: null, armour: 0, lifePoints: 0, prayer: 0, set: null, passive: 'ring-of-vigour', augmentable: false, icon: null },
    { id: 'eof', name: 'Essence of Finality', slot: 'neck', style: null, tier: 80, type: null, armour: 0, lifePoints: 0, prayer: 0, set: null, passive: 'essence-of-finality', augmentable: false, icon: null },
    { id: 'set-body-90', name: 'Body 90', slot: 'body', style: 'Necromancy', tier: 90, type: null, armour: 0, lifePoints: 0, prayer: 0, set: 'first-necromancer', passive: null, augmentable: true, icon: null },
    { id: 'set-body-95', name: 'Body 95', slot: 'body', style: 'Necromancy', tier: 95, type: null, armour: 0, lifePoints: 0, prayer: 0, set: 'first-necromancer', passive: null, augmentable: true, icon: null },
    { id: 'set-legs', name: 'Legs', slot: 'legs', style: 'Necromancy', tier: 95, type: null, armour: 0, lifePoints: 0, prayer: 0, set: 'first-necromancer', passive: null, augmentable: true, icon: null },
    { id: 'set-head', name: 'Head', slot: 'head', style: 'Necromancy', tier: 95, type: null, armour: 0, lifePoints: 0, prayer: 0, set: 'first-necromancer', passive: null, augmentable: true, icon: null },
  ];
  const slotOf = (ref: { kind: string; id: string }) => (ref.kind === 'gear' ? gear.find((g) => g.id === ref.id)?.slot ?? null : null);

  it('returns null when there is nothing to migrate', () => {
    expect(migrateLegacyGear(newLoadout(), gear, slotOf)).toBeNull();
    const eofWorn = { ...newLoadout(), eofSpec: 'death-essence', equipment: { neck: { kind: 'gear' as const, id: 'eof', spec: 'death-essence' } } };
    expect(migrateLegacyGear(eofWorn, gear, slotOf)).toBeNull();
  });

  it('wears passives, the highest pieces of the armour set (body, legs, head … up to the count) and the EoF with its spec', () => {
    const l: Loadout = { ...newLoadout(), items: ['ring-of-vigour', 'unknown-passive'], armourSet: 'first-necromancer', armourPieces: 2, eofSpec: 'death-essence' };
    const out = migrateLegacyGear(l, gear, slotOf)!;
    expect(out.equipment.ring).toEqual({ kind: 'gear', id: 'ring-of-vigour' });
    expect(out.equipment.body).toEqual({ kind: 'gear', id: 'set-body-95' });
    expect(out.equipment.legs).toEqual({ kind: 'gear', id: 'set-legs' });
    expect(out.equipment.head).toBeUndefined();
    expect(out.equipment.neck).toEqual({ kind: 'gear', id: 'eof', spec: 'death-essence' });
    expect(out.items).toEqual([]);
    expect(out.armourSet).toBeNull();
    expect(out.armourPieces).toBe(0);
    expect(out.inventory.every((r) => r === null)).toBe(true);
    // running it again is a no-op
    expect(migrateLegacyGear(out, gear, slotOf)).toBeNull();
  });

  it('an occupied slot keeps what is worn; the set piece then skips that slot', () => {
    const l: Loadout = { ...newLoadout(), armourSet: 'first-necromancer', armourPieces: 1, equipment: { body: { kind: 'gear', id: 'other-body' } } };
    const out = migrateLegacyGear(l, gear, slotOf)!;
    expect(out.equipment.body).toEqual({ kind: 'gear', id: 'other-body' });
    expect(out.equipment.legs).toEqual({ kind: 'gear', id: 'set-legs' });
  });
});

describe('mergeActionBars – a partial stored setup is completed with defaults', () => {
  it('pads preset slots, keeps weapon keys and merges the default action keys', () => {
    const merged = mergeActionBars({
      presets: [{ id: 3, name: 'Necro', slots: [{ kind: 'ability', id: 'necromancy' }] }],
      positions: [3],
      weaponKeybinds: { sword: { code: 'Digit1', ctrl: false, shift: false, alt: false } },
      slotKeybinds: [[{ code: 'KeyQ', ctrl: false, shift: false, alt: false }]],
    });
    const preset = merged.presets.find((p) => p.id === 3)!;
    expect(preset.name).toBe('Necro');
    expect(preset.slots).toHaveLength(14);
    expect(preset.slots[0]).toEqual({ kind: 'ability', id: 'necromancy' });
    expect(preset.slots[13]).toBeNull();
    expect(merged.presets).toHaveLength(18);
    expect(merged.positions[0]).toBe(3);
    expect(merged.positions).toHaveLength(5);
    expect(merged.weaponKeybinds).toEqual({ sword: { code: 'Digit1', ctrl: false, shift: false, alt: false } });
    expect(merged.slotKeybinds[0][0]).toEqual({ code: 'KeyQ', ctrl: false, shift: false, alt: false });
    expect(merged.slotKeybinds[0][1]).toBeNull();
    expect(merged.slotKeybinds).toHaveLength(5);
    expect(merged.profiles?.length).toBeGreaterThan(0);
    expect(merged.activeProfileId).toBeDefined();
  });

  it('an empty object is the default setup', () => {
    const merged = mergeActionBars({});
    expect(merged.presets).toHaveLength(18);
    expect(merged.positions.every((p) => p !== undefined)).toBe(true);
  });
});

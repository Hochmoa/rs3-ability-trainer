import { describe, expect, it } from 'vitest';
import { MORPH_SOURCE, morphSourceOf, slotAbilities } from './morphs';
import { EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';
import { defaultResolvedLoadout } from './loadout-resolved';

function ability(id: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key: 'ability:' + id, kind: 'ability', id, name: id, icon: '', gcd: true, adrenaline: 9, cooldownTicks: 0, buffs: [], style: 'Necromancy', abilityType: 'Basic', ...extra };
}

function engine(steps: EngineEntity[], extra: EngineEntity[] = []): TrainerEngine {
  const catalog = new Map<string, EngineEntity>();
  for (const e of [...steps, ...extra]) catalog.set(e.key, e);
  const loadout = defaultResolvedLoadout();
  loadout.style = 'Necromancy';
  loadout.hasConduit = true;
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: false, loop: false, loadout, fullAdrenaline: true });
  e.random = () => 0.99;
  return e;
}

describe('morphing slots', () => {
  it('derives Conjure → Command and Dismember → Slaughter → Massacre from the rules', () => {
    expect(morphSourceOf('command-vengeful-ghost')).toBe('conjure-vengeful-ghost');
    expect(morphSourceOf('command-skeleton-warrior')).toBe('conjure-skeleton-warrior');
    expect(slotAbilities('dismember')).toEqual(['dismember', 'slaughter', 'massacre']);
    expect(MORPH_SOURCE.get('massacre')).toBe('dismember');
  });

  it('the conjure slot shows and fires Command Vengeful Ghost while the ghost lives', () => {
    const conjure = ability('conjure-vengeful-ghost', { abilityType: 'Enhanced', adrenaline: 0 });
    const command = ability('command-vengeful-ghost', { abilityType: 'Enhanced', adrenaline: 0 });
    const e = engine([conjure, command]);
    e.start(0);
    expect(e.morphOf(conjure.key, 0)).toBeNull();
    e.press(conjure.key, 0);
    e.update(TICK_MS);
    expect(e.index).toBe(1);
    expect(e.morphOf(conjure.key, 1)).toEqual({ key: command.key, stage: 1 });
    // pressing the conjure slot 6 ticks later fires Command Vengeful Ghost (the rotation's next step)
    e.update(7 * TICK_MS);
    e.press(conjure.key, 7 * TICK_MS);
    e.update(8 * TICK_MS);
    expect(e.results.map((r) => r.key)).toEqual([conjure.key, command.key]);
  });

  it('Spectral Scythe: three casts in one slot with rising cost, cooldown from the first cast only', () => {
    const scythe = ability('spectral-scythe', { abilityType: 'Enhanced', adrenaline: -10, cooldownTicks: 25 });
    const e = engine([scythe, scythe, scythe]);
    e.start(0);
    expect(e.costOf(scythe).cost).toBe(10);
    e.press(scythe.key, 0);
    e.update(TICK_MS);
    expect(e.morphOf(scythe.key, 1)).toEqual({ key: scythe.key, stage: 2 });
    expect(e.costOf(scythe).cost).toBe(20);
    expect(e.cooldownLeft(scythe.key, 1)).toBe(0);
    e.press(scythe.key, 3 * TICK_MS);
    e.update(4 * TICK_MS);
    expect(e.morphOf(scythe.key, 4)).toEqual({ key: scythe.key, stage: 3 });
    expect(e.costOf(scythe).cost).toBe(30);
    e.press(scythe.key, 6 * TICK_MS);
    e.update(7 * TICK_MS);
    expect(e.results.length).toBe(3);
    // back to cast 1, and the 25-tick cooldown from the first cast still runs
    expect(e.morphOf(scythe.key, 7)).toBeNull();
    expect(e.cooldownLeft(scythe.key, 7)).toBe(25 - 7);
  });
});

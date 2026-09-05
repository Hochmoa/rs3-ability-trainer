import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

function ability(id: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key: 'ability:' + id, kind: 'ability', id, name: id, icon: '', gcd: true, adrenaline: 9, cooldownTicks: 0, buffs: [], style: 'Necromancy', abilityType: 'Basic', ...extra };
}

describe('pre-build', () => {
  it('starts with stacks, a commandable spirit, an active buff, a prayer and adrenaline', () => {
    const command = ability('command-vengeful-ghost', { abilityType: 'Enhanced', adrenaline: 0 });
    const finger = ability('finger-of-death', { abilityType: 'Enhanced', adrenaline: -60 });
    const split = ability('split-soul', { abilityType: 'Incantation', adrenaline: 0, buffs: [{ id: 'buff:split', name: 'Split Soul', kind: 'Buff', on: 'self', icon: null, durationTicks: 33 }] });
    const catalog = new Map([command, finger, split].map((e) => [e.key, e]));
    const loadout = defaultResolvedLoadout();
    loadout.style = 'Necromancy';
    loadout.hasConduit = true;
    loadout.stackCaps['residual-souls'] = 5; // Soulbound lantern
    const e = new TrainerEngine([command, finger], catalog, {
      pingMs: 0,
      autoAttacks: false,
      jitterMs: 0,
      abilityQueueing: false,
      loop: false,
      loadout,
      prebuild: { adrenaline: 45, stacks: { necrosis: 12, 'residual-souls': 5 }, spirits: ['vengeful-ghost'], abilities: ['split-soul'], prayers: ['soul-split'] },
    });
    e.random = () => 0.99;
    e.start(0);
    expect(e.adrenaline).toBe(45);
    expect(e.stack('necrosis')).toBe(12);
    expect(e.stack('residual-souls')).toBe(5);
    expect(e.spirits.has('vengeful-ghost')).toBe(true);
    expect(e.hasBuff('buff:split')).toBe(true);
    expect(e.activePrayers.has('soul-split')).toBe(true);
    // the ghost can be commanded on the first tick, Finger of Death is free with 6+ necrosis
    e.press(command.key, 0);
    e.update(TICK_MS);
    expect(e.results.map((r) => r.key)).toEqual([command.key]);
    expect(e.costOf(finger).cost).toBe(0);
  });

  it('remaining time shortens a pre-built conjure and buff; the conjure is not commandable before it is 6 ticks old', () => {
    const command = ability('command-vengeful-ghost', { abilityType: 'Enhanced', adrenaline: 0 });
    const split = ability('split-soul', { abilityType: 'Incantation', adrenaline: 0 });
    const catalog = new Map([command, split].map((e) => [e.key, e]));
    const loadout = defaultResolvedLoadout();
    loadout.style = 'Necromancy';
    loadout.hasConduit = true;
    const e = new TrainerEngine([command], catalog, {
      pingMs: 0,
      autoAttacks: false,
      jitterMs: 0,
      abilityQueueing: false,
      loop: false,
      loadout,
      prebuild: { stacks: {}, spirits: ['vengeful-ghost'], abilities: ['split-soul'], prayers: [], remaining: { 'spirit:vengeful-ghost': 68, 'ability:split-soul': 10 } },
    });
    e.random = () => 0.99;
    e.start(0);
    expect(e.spirits.get('vengeful-ghost')?.endTick).toBe(68);
    expect(e.buff('split-soul')?.endTick).toBe(10);
    // 68 of 70 ticks left = conjured 2 ticks ago → Command needs 4 more ticks
    expect(e.requirementFailure(command, 0)).not.toBeNull();
    expect(e.requirementFailure(command, 4)).toBeNull();
  });

  it('Life Transfer extends every active spirit by 35 ticks', () => {
    const transfer = ability('life-transfer', { abilityType: 'Incantation', adrenaline: 0 });
    const catalog = new Map([[transfer.key, transfer]]);
    const loadout = defaultResolvedLoadout();
    loadout.style = 'Necromancy';
    loadout.hasConduit = true;
    const e = new TrainerEngine([transfer], catalog, {
      pingMs: 0,
      autoAttacks: false,
      jitterMs: 0,
      abilityQueueing: false,
      loop: false,
      loadout,
      prebuild: { stacks: {}, spirits: ['skeleton-warrior', 'vengeful-ghost'], abilities: [], prayers: [], remaining: { 'spirit:skeleton-warrior': 20 } },
    });
    e.random = () => 0.99;
    e.start(0);
    e.press(transfer.key, 0);
    e.update(TICK_MS);
    expect(e.spirits.get('skeleton-warrior')?.endTick).toBe(55);
    expect(e.spirits.get('vengeful-ghost')?.endTick).toBe(64 + 35);
    expect(e.buff('spirit-skeleton-warrior')?.endTick).toBe(55);
  });

  it('Haunted lasts as long as the commanded ghost and is extended by Life Transfer', () => {
    const command = ability('command-vengeful-ghost', { abilityType: 'Enhanced', adrenaline: 0 });
    const transfer = ability('life-transfer', { abilityType: 'Incantation', adrenaline: 0 });
    const catalog = new Map([command, transfer].map((e) => [e.key, e]));
    const loadout = defaultResolvedLoadout();
    loadout.style = 'Necromancy';
    loadout.hasConduit = true;
    const e = new TrainerEngine([command, transfer], catalog, {
      pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: true, loadout,
      prebuild: { stacks: {}, spirits: ['vengeful-ghost'], abilities: [], prayers: [], remaining: { 'spirit:vengeful-ghost': 20 } },
    });
    e.random = () => 0.99;
    e.start(0);
    e.press(command.key, 0);
    e.update(TICK_MS);
    expect(e.hasBuff('haunted')).toBe(false); // Haunted comes with the ghost's next hit (20 ticks left of 70: age 50, next hit at age 55 = tick 5)
    e.press(transfer.key, 4 * TICK_MS);
    e.update(4 * TICK_MS);
    expect(e.spirits.get('vengeful-ghost')?.endTick).toBe(55);
    e.update(5 * TICK_MS);
    expect(e.buff('haunted')).toMatchObject({ startTick: 5, endTick: 55 }); // bound to the (already extended) ghost
    e.update(56 * TICK_MS);
    expect(e.hasBuff('haunted')).toBe(false);
  });

  it('a DoT debuff starts on the cast and counts down instead of resetting on every DoT hit', () => {
    const bloat = ability('bloat', { abilityType: 'Enhanced', adrenaline: -20, damageMin: 135, damageMax: 165 });
    const catalog = new Map([[bloat.key, bloat]]);
    const loadout = defaultResolvedLoadout();
    loadout.style = 'Necromancy';
    loadout.hasConduit = true;
    const e = new TrainerEngine([bloat], catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: true, loadout });
    e.random = () => 0.99;
    e.start(0);
    e.adrenaline = 100;
    e.press(bloat.key, 0);
    e.update(TICK_MS);
    const end = e.buff('bloated')?.endTick;
    expect(end).toBe(30); // cast on tick 0, 10 hits every 3 ticks
    e.update(20 * TICK_MS); // several DoT hits later the timer is untouched
    expect(e.buff('bloated')?.endTick).toBe(end);
    e.update(32 * TICK_MS);
    expect(e.hasBuff('bloated')).toBe(false);
  });
});

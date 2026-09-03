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
    const e = new TrainerEngine([command, finger], catalog, {
      pingMs: 0,
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
});

/**
 * The adrenaline crystal in War's Retreat (runescape.wiki/w/Adrenaline_crystal_(War's_Retreat)): "the player will gain
 * 25% adrenaline every 1.8 seconds", "to 100% if the player has obtained War's Blessing 4", and the 2,000-kill upgrade
 * can "reset the cooldown of adrenaline potions". The Train page offers it as a button for rotations played in War's
 * Retreat; the engine treats a press as one 1.8 s channel that is never a wrong press and never a step.
 */
import { describe, expect, it } from 'vitest';
import { defaultResolvedLoadout } from './loadout-resolved';
import { CRYSTAL_ACTION, EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;
const CRYSTAL = 'action:' + CRYSTAL_ACTION;

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: -25, cooldownTicks: 20, damageMin: 100, damageMax: 100, buffs: [], ...extra };
}
const crystal: EngineEntity = { key: CRYSTAL, id: CRYSTAL_ACTION, kind: 'action', name: 'Adrenaline crystal', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
const potion: EngineEntity = { key: 'special:adrenaline-potion', id: 'adrenaline-potion', kind: 'special', name: 'Adrenaline potion', icon: '', gcd: false, adrenaline: 25, cooldownTicks: 200, buffs: [] };

function make(steps: EngineEntity[], startAdrenaline: number, crystalUpgraded: boolean): TrainerEngine {
  const catalog = new Map(steps.map((e) => [e.key, e] as const));
  catalog.set(CRYSTAL, crystal);
  catalog.set(potion.key, potion);
  const cfg: EngineConfig = {
    pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: false, hitChanceDisabled: true, crystalUpgraded,
    loadout: { ...defaultResolvedLoadout(), style: 'Melee', abilityDamage: 1000, startAdrenaline },
  };
  const e = new TrainerEngine(steps, catalog, cfg);
  e.random = () => 0.5;
  e.start(0);
  return e;
}
function press(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}
const kinds = (e: TrainerEngine) => e.events.map((x) => x.kind);

describe('the adrenaline crystal', () => {
  it('with War\'s Blessing 4 one use fills the adrenaline to 100% and is never a wrong press', () => {
    const ult = ability('ult', { abilityType: 'Ultimate', adrenaline: -100 });
    const e = make([ult], 0, true);
    press(e, CRYSTAL, 1);
    expect(e.adrenaline).toBe(100);
    expect(kinds(e)).toContain('crystal');
    expect(kinds(e)).not.toContain('wrong-fired');
    expect(e.results).toHaveLength(0); // no step completed by it
  });

  it('without the upgrade a use is one 1.8 s channel worth 25%', () => {
    const e = make([ability('a')], 0, false);
    press(e, CRYSTAL, 1);
    expect(e.adrenaline).toBe(25);
    press(e, CRYSTAL, 4);
    expect(e.adrenaline).toBe(50);
    const ev = e.events.find((x) => x.kind === 'crystal');
    expect(ev).toMatchObject({ kind: 'crystal', amount: 25, potionsReset: false });
  });

  it('the upgraded crystal takes the adrenaline potions off cooldown', () => {
    const e = make([ability('a')], 50, true);
    press(e, potion.key, 1);
    expect(e.cooldownLeft(potion.key, 2)).toBeGreaterThan(0);
    press(e, CRYSTAL, 3);
    expect(e.cooldownLeft(potion.key, 4)).toBe(0);
    expect(e.events.find((x) => x.kind === 'crystal')).toMatchObject({ potionsReset: true });
  });

  it('an ultimate that waited for adrenaline goes off once the crystal delivered it', () => {
    const ult = ability('ult', { abilityType: 'Ultimate', adrenaline: -100 });
    const e = make([ult], 20, true);
    press(e, 'ult', 1);
    expect(kinds(e)).toContain('no-adrenaline');
    expect(e.results).toHaveLength(0);
    press(e, CRYSTAL, 2); // the queued ultimate fires as soon as the crystal has paid for it
    e.update(12 * T);
    expect(kinds(e)).toContain('crystal');
    expect(e.results.map((r) => r.key)).toEqual(['ult']);
    expect(e.adrenaline).toBe(0);
  });
});

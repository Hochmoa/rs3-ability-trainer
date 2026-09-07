/**
 * The Revolution check of an action bar: which slots Revolution scans, which of them it can fire, and why the others
 * stay silent (docs/research/revolution.md).
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_REVOLUTION, RevolutionSettings } from '../core/models';
import { revolutionPlan } from './revolution-plan';
import { EngineEntity } from './trainer-engine';

const ability = (id: string, extra: Partial<EngineEntity> = {}): EngineEntity => ({
  key: 'ability:' + id, id, kind: 'ability', name: id, icon: '', gcd: true, abilityType: 'Basic', style: 'Melee',
  adrenaline: 9, cooldownTicks: 0, buffs: [], ...extra,
});
const CATALOG = new Map<string, EngineEntity>([
  ['ability:attack', ability('attack')],
  ['ability:slaughter', ability('slaughter', { abilityType: 'Enhanced', adrenaline: -25 })],
  ['ability:berserk', ability('berserk', { abilityType: 'Ultimate', adrenaline: -100 })],
  ['ability:surge', ability('surge', { gcd: false, style: 'Constitution' })],
  ['ability:greater-ricochet', ability('greater-ricochet', { style: 'Ranged' })],
  ['ability:weapon-special-attack', ability('weapon-special-attack')],
  ['ability:punish', ability('punish')],
  ['weapon:ek-zekkil', { key: 'weapon:ek-zekkil', id: 'ek-zekkil', kind: 'weapon', name: 'Ek-ZekKil', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] }],
]);
const get = (key: string) => CATALOG.get(key);
const settings = (extra: Partial<RevolutionSettings> = {}): RevolutionSettings => ({ ...DEFAULT_REVOLUTION, ...extra });

describe('revolutionPlan', () => {
  it('scans only the first slots and says why the others never fire', () => {
    const bar = ['ability:punish', 'ability:surge', 'ability:weapon-special-attack', 'weapon:ek-zekkil', 'ability:greater-ricochet', 'ability:attack'];
    const p = revolutionPlan(bar, get, settings({ slots: 5, basics: true, enhanced: false, thresholds: false, ultimates: false }), 'Melee');
    expect(p.scanned.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5]);
    expect(p.scanned[0]).toMatchObject({ name: 'punish', fires: true });
    expect(p.scanned[1].why).toContain('off the global cooldown');
    expect(p.scanned[2].why).toContain('never fires');
    expect(p.scanned[3].why).toContain('weapon switch');
    expect(p.scanned[4].why).toContain('Ranged ability while you wield Melee');
    expect(p.ignored.map((s) => s.slot)).toEqual([6]);
  });

  it('respects the type toggles', () => {
    const bar = ['ability:slaughter', 'ability:berserk'];
    const off = revolutionPlan(bar, get, settings({ slots: 4, enhanced: false, ultimates: false }), 'Melee');
    expect(off.scanned[0].why).toContain('enhanced abilities are switched off');
    expect(off.scanned[1].why).toContain('ultimate abilities are switched off');
    const on = revolutionPlan(bar, get, settings({ slots: 4, enhanced: true, ultimates: true }), 'Melee');
    expect(on.scanned.every((s) => s.fires)).toBe(true);
    expect(on.warnings.some((w) => w.includes('ultimate'))).toBe(true);
  });

  it('marks the basic attack as the last resort and warns when an ability sits outside the scanned range', () => {
    const p = revolutionPlan(['ability:attack', 'ability:punish', 'ability:slaughter'], get, settings({ slots: 2, enhanced: true }), 'Melee');
    expect(p.scanned[0]).toMatchObject({ name: 'attack', fires: true, lastResort: true });
    expect(p.warnings.some((w) => w.includes('last resort'))).toBe(true);
    expect(p.warnings.some((w) => w.includes('never scanned'))).toBe(true);
  });

  it('says so when nothing on the bar can fire', () => {
    const p = revolutionPlan(['ability:surge', null], get, settings({ slots: 2 }), 'Melee');
    expect(p.scanned[1].why).toBe('empty slot');
    expect(p.warnings[0]).toContain('nothing to fire');
  });
});

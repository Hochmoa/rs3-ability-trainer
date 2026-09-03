/**
 * Channelled abilities: progress, cancellation by the next real cast, Dracolich set effect on Rapid Fire.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import GEAR from '../../../public/data/gear.json';
import SETS from '../../../public/data/set-effects.json';
import WEAPONS from '../../../public/data/weapons.json';
import { Ability, EquipSlot, GearItem, ItemRef, SetEffect, Weapon, newLoadout } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { resolveLoadout } from './loadout-resolver';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const DATA = ABILITIES as unknown as Ability[];
const BY_ID = new Map(DATA.map((a) => [a.id, a]));

function ability(id: string): EngineEntity {
  const a = BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [],
  };
}

const T = TICK_MS;
/** Rapid Fire's adrenaline cost from the data (25 since the Combat Style Modernisation) */
const RF_COST = -(BY_ID.get('rapid-fire')!.adrenaline ?? 0);

function make(ids: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const l = { ...defaultResolvedLoadout(), ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true, ...cfg, loadout: l });
  e.random = () => 0.99;
  e.start(0);
  e.adrenaline = 100;
  return e;
}

/** Dracolich (5 pieces) + bow as the resolver would produce it */
function dracolich(weaponType: 'bow' | 'crossbow', pieces = 5): Partial<ResolvedLoadout> {
  return {
    style: 'Ranged',
    weaponType,
    channelAdrenalinePerTick: { 'rapid-fire': 0.2 * pieces },
    fullChannelBuffs: { 'rapid-fire': [{ buff: 'dracolich-infusion', durationTicks: 5, requiresWeapon: 'bow' }] },
    buffDurationAdd: { 'dracolich-infusion': pieces >= 5 ? 6 : pieces >= 4 ? 3 : 0 },
    buffCritAdd: { 'dracolich-infusion': { add: 0.2, style: 'Ranged' } },
  };
}

describe('channelled abilities', () => {
  it('Rapid Fire channels 8 hits over 8 ticks; the bar reports time progress and hits', () => {
    const e = make(['rapid-fire', 'piercing-shot'], dracolich('bow'));
    e.press('ability:rapid-fire', 1); // processed on tick 1
    e.update(1 * T);
    expect(e.channelProgress(1 * T)).toMatchObject({ key: 'ability:rapid-fire', phase: 0, hitsDone: 0, hits: 8 });
    e.update(5.5 * T); // hits at ticks 2..5 landed
    const mid = e.channelProgress(5.5 * T)!;
    expect(mid.hitsDone).toBe(4);
    expect(mid.phase).toBeCloseTo(4.5 / 8, 5);
    expect(mid.remainingMs).toBeCloseTo(3.5 * T, 5);
    e.update(10 * T);
    expect(e.channelProgress(10 * T)).toBeNull();
  });

  it('Dracolich: +0.2 adrenaline per piece per tick while channelling, Dracolich infusion after the full channel with a bow', () => {
    const e = make(['rapid-fire', 'piercing-shot'], dracolich('bow'));
    e.press('ability:rapid-fire', 1);
    e.update(10 * T);
    // 100 − cost + 8 hits × 1.0
    expect(e.adrenaline).toBeCloseTo(100 - RF_COST + 8, 5);
    const buff = e.buff('dracolich-infusion');
    expect(buff).toBeDefined();
    expect(buff!.endTick).toBe(9 + 5 + 6); // last hit tick 9, 3 s base + 1.8 s (4 pieces) + 1.8 s (5 pieces)
  });

  it('Dracolich infusion needs a bow – a crossbow gets the adrenaline but not the buff', () => {
    const e = make(['rapid-fire', 'piercing-shot'], dracolich('crossbow'));
    e.press('ability:rapid-fire', 1);
    e.update(10 * T);
    expect(e.adrenaline).toBeCloseTo(100 - RF_COST + 8, 5);
    expect(e.hasBuff('dracolich-infusion')).toBe(false);
  });

  it('the next ability that really casts cancels the channel: remaining hits, adrenaline and the infusion are lost', () => {
    const e = make(['rapid-fire', 'piercing-shot'], dracolich('bow'));
    e.press('ability:rapid-fire', 1);
    e.update(1 * T);
    e.press('ability:piercing-shot', 3 * T + 1); // processed tick 4 = end of the GCD → casts at tick 4
    e.update(10 * T);
    expect(e.events.some((x) => x.kind === 'channel-cancelled' && x.key === 'ability:rapid-fire' && x.hitsLost === 5)).toBe(true);
    expect(e.channelProgress(4 * T)).toBeNull();
    expect(e.hasBuff('dracolich-infusion')).toBe(false);
    // 100 − cost + 3 hits (ticks 2, 3, 4) × 1.0 + Piercing Shot's own adrenaline
    expect(e.adrenaline).toBeCloseTo(100 - RF_COST + 3 + (BY_ID.get('piercing-shot')!.adrenaline ?? 0), 5);
  });

  it('a press that does not cast (cooldown, queueing off) leaves the channel running', () => {
    const e = make(['rapid-fire', 'rapid-fire'], dracolich('bow'), { abilityQueueing: false });
    e.press('ability:rapid-fire', 1);
    e.update(1 * T);
    e.press('ability:rapid-fire', 4 * T + 1); // on cooldown → rejected
    e.update(10 * T);
    expect(e.events.some((x) => x.kind === 'on-cooldown')).toBe(true);
    expect(e.events.some((x) => x.kind === 'channel-cancelled')).toBe(false);
    expect(e.hasBuff('dracolich-infusion')).toBe(true);
    expect(e.buff('dracolich-infusion')!.endTick).toBe(20);
  });

  it('the loadout resolver reads the Dracolich set effect from set-effects.json (5 elite pieces + Bow of the Last Guardian)', () => {
    const gear = GEAR as unknown as GearItem[];
    const weapons = WEAPONS as unknown as Weapon[];
    const sets = SETS as unknown as SetEffect[];
    const l = newLoadout('test');
    const seen = new Set<string>();
    l.equipment = { twoHand: { kind: 'weapon', id: 'bow-of-the-last-guardian' } };
    for (const g of gear) {
      if (g.set === 'elite-dracolich' && !seen.has(g.slot)) {
        seen.add(g.slot);
        (l.equipment as Record<string, ItemRef>)[g.slot as EquipSlot] = { kind: 'gear', id: g.id };
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(5);
    const r = resolveLoadout(l, {
      weaponById: new Map(weapons.map((w) => [w.id, w])),
      specById: new Map(),
      perkById: new Map(),
      setEffectById: new Map(sets.map((s) => [s.id, s])),
      gearById: new Map(gear.map((g) => [g.id, g])),
      specEntity: () => { throw new Error('not needed'); },
    });
    expect(r.weaponType).toBe('bow');
    expect(r.channelAdrenalinePerTick['rapid-fire']).toBeCloseTo(0.5 * 5, 5);
    expect(r.fullChannelBuffs['rapid-fire']).toEqual([{ buff: 'dracolich-infusion', durationTicks: 5, requiresWeapon: 'bow' }]);
    expect(r.buffDurationAdd['dracolich-infusion']).toBe(6);
    expect(r.buffCritAdd['dracolich-infusion']).toEqual({ add: 0.4, style: 'Ranged' });
  });
});

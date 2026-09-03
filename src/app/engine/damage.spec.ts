import { describe, expect, it } from 'vitest';
import { abilityDamageOf, critMultiplier, levelPart } from './damage';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';
import { Weapon } from '../core/models';

function weapon(slot: Weapon['slot'], tier: number): Weapon {
  const ad = slot === '2h' ? 14.4 * tier : slot === 'main' ? 9.6 * tier : 4.8 * tier;
  return { id: 'w-' + slot, name: 'w', style: 'Necromancy', slot, type: null, tier, tierDamage: tier, tierAccuracy: tier, speed: null, attackStyle: null, range: null, damage: 0, accuracy: 0, abilityDamage: ad, armour: 0, lifePoints: 0, charges: null, spec: null, innateMastery: false, icon: null, role: null };
}

function ability(id: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key: 'ability:' + id, kind: 'ability', id, name: id, icon: '', gcd: true, adrenaline: 9, cooldownTicks: 0, buffs: [], style: 'Necromancy', abilityType: 'Basic', ...extra };
}

function engine(steps: EngineEntity[], opts: { lifePoints?: number; random?: number; style?: 'Melee' | 'Necromancy' } = {}): TrainerEngine {
  const catalog = new Map(steps.map((s) => [s.key, s]));
  const loadout = defaultResolvedLoadout();
  loadout.style = opts.style ?? 'Necromancy';
  loadout.abilityDamage = 1000;
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: false, loop: false, loadout, fullAdrenaline: true, targetLifePoints: opts.lifePoints });
  e.random = () => opts.random ?? 0.5;
  return e;
}

describe('ability damage', () => {
  it('matches the wiki formula at level 99 (weapons.json carries the tier part)', () => {
    expect(levelPart(99)).toBe(264);
    // T95 dual wield: 264 + 912 + 132 + 456; T95 two-hander: 264 + 132 + 1368 – the same
    expect(abilityDamageOf(weapon('main', 95), weapon('off', 95), null)).toBe(1764);
    expect(abilityDamageOf(null, null, weapon('2h', 95))).toBe(1764);
    // a shield adds nothing
    expect(abilityDamageOf(weapon('main', 95), weapon('shield', 95), null)).toBe(1176);
    expect(critMultiplier(99)).toBe(1.5);
  });
});

describe('hits and damage', () => {
  it('rolls each hit between min and max % of the ability damage and reports it', () => {
    const a = ability('a', { damageMin: 90, damageMax: 110 });
    const e = engine([a]);
    e.start(0);
    e.press(a.key, 0);
    e.update(TICK_MS);
    const hits = e.events.filter((x) => x.kind === 'hit');
    expect(hits.length).toBe(1);
    expect(hits[0].kind === 'hit' && hits[0].amount).toBe(1000); // random 0.5 → 100%
    expect(e.damageDealt).toBe(1000);
  });

  it('bleeds land their hits over time without crits', () => {
    const dismember = ability('dismember', { style: 'Melee', damageMin: 25, damageMax: 35 });
    const filler = ability('attack', { style: 'Melee' });
    const e = engine([dismember, filler], { random: 0.0, style: 'Melee' }); // random 0 → always "crit" if allowed, min roll; the session must stay open for the bleed
    e.start(0);
    e.press(dismember.key, 0);
    e.update(TICK_MS);
    expect(e.events.filter((x) => x.kind === 'hit').length).toBe(0); // first bleed hit 2 ticks after the cast
    e.update(17 * TICK_MS);
    const hits = e.events.filter((x) => x.kind === 'hit');
    expect(hits.length).toBe(8);
    expect(hits.every((h) => h.kind === 'hit' && h.dot && !h.crit)).toBe(true);
    expect(hits[0].kind === 'hit' && hits[0].amount).toBe(250);
  });

  it('Volley of Souls hits once per Residual Soul', () => {
    const sap = ability('soul-sap', { damageMin: 90, damageMax: 110 });
    const volley = ability('volley-of-souls', { abilityType: 'Enhanced', damageMin: 135, damageMax: 165 });
    const e = engine([sap, sap, sap, volley]);
    e.start(0);
    for (let i = 0; i < 3; i++) {
      e.press(sap.key, i * 3 * TICK_MS);
      e.update((i * 3 + 1) * TICK_MS);
    }
    e.update(10 * TICK_MS);
    expect(e.stack('residual-souls')).toBe(3);
    e.press(volley.key, 10 * TICK_MS);
    e.update(11 * TICK_MS);
    const volleyHits = e.events.filter((x) => x.kind === 'hit' && x.key === volley.key);
    expect(volleyHits.length).toBe(3);
    expect(e.stack('residual-souls')).toBe(0);
  });

  it('a target with life points dies and ends the session', () => {
    const a = ability('a', { damageMin: 100, damageMax: 100 });
    const e = engine([a, a, a], { lifePoints: 2500 });
    e.start(0);
    e.press(a.key, 0);
    e.update(TICK_MS);
    e.press(a.key, 3 * TICK_MS);
    e.update(4 * TICK_MS);
    expect(e.targetHp).toBe(500);
    e.press(a.key, 6 * TICK_MS);
    e.update(7 * TICK_MS);
    expect(e.targetHp).toBe(0);
    expect(e.killedTick).toBe(6);
    expect(e.state).toBe('finished');
    expect(e.events.some((x) => x.kind === 'killed')).toBe(true);
  });
});

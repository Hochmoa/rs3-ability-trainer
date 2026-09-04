/**
 * Magic abilities against docs/research/magic.md – Tsunami, Concentrated Blast crit stacks, Wild Magic,
 * Dragon Breath × Combust / Anima Charged, Smoke Tendrils, Magma Tempest, Sunshine DoT, Tumeken Asphyxiate,
 * Blast Infused, Kerapac's wrist wraps.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import { Ability } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const DATA = ABILITIES as unknown as Ability[];
const BY_ID = new Map(DATA.map((a) => [a.id, a]));
const T = TICK_MS;

function ability(id: string): EngineEntity {
  const a = BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0,
    buffs: a.buffs.filter((b) => b >= 0).map((b) => ({ id: 'buff:' + b, name: String(b), kind: 'Buff' as const, on: 'self' as const, icon: null, durationTicks: a.durationTicks ?? 3 })),
    damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

function make(ids: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}, random = 0.5): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const l = { ...defaultResolvedLoadout(), style: 'Magic' as const, abilityDamage: 1000, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: l });
  e.random = () => random;
  e.start(0);
  return e;
}

function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, id: string): { amount: number; tick: number; crit: boolean; dot: boolean }[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'hit' }> => x.kind === 'hit' && x.key === 'ability:' + id).map((h) => ({ amount: h.amount, tick: h.tick, crit: h.crit, dot: h.dot }));
}

describe('magic: Tsunami and crits', () => {
  it('Tsunami hits for 250% and its own crit already pays +8%; Smoke Tendrils then crits four times over 7 ticks with rising damage', () => {
    const e = make(['tsunami', 'smoke-tendrils'], {}, {}, 0.05); // 0.05 < 10%: every roll crits
    cast(e, 'tsunami', 1);
    expect(hits(e, 'tsunami')).toEqual([{ amount: Math.floor(227.5 * 10 * 1.5), tick: 1, crit: true, dot: false }]);
    expect(e.adrenaline).toBe(8);
    cast(e, 'smoke-tendrils', 4);
    e.update(12 * T);
    expect(hits(e, 'smoke-tendrils').map((h) => [h.tick, h.amount, h.crit])).toEqual([[5, Math.floor(555 * 1.5), true], [7, Math.floor(657.5 * 1.5), true], [9, Math.floor(760 * 1.5), true], [11, Math.floor(862.5 * 1.5), true]]);
    expect(e.adrenaline).toBe(8 + 32);
  });

  it('Concentrated Blast beams stack 5% crit chance each (15% with Anima Charged) for the next Magic ability; a main-hand swap loses them', () => {
    const e = make(['concentrated-blast', 'wild-magic', 'magic'], {}, {}, 0.12); // 0.12: no base crit, a crit once +5% or more is stacked
    cast(e, 'concentrated-blast', 1);
    e.update(4 * T);
    const beams = hits(e, 'concentrated-blast');
    expect(beams.map((h) => h.crit)).toEqual([false, true, true]); // beam 2 sees +5%, beam 3 +10%
    expect(e.stack('concentrated-crit')).toBe(15);
    cast(e, 'wild-magic', 4);
    expect(hits(e, 'wild-magic').map((h) => h.crit)).toEqual([true, true]); // 10% + 15% + 10% (Wild Magic)
    expect(e.stack('concentrated-crit')).toBe(0);
    cast(e, 'magic', 7);
    expect(hits(e, 'magic')[0].crit).toBe(false);

    const a = make(['runic-charge', 'concentrated-blast'], {}, {}, 0.12);
    a.press('ability:runic-charge', 1);
    a.update(T + 1);
    cast(a, 'concentrated-blast', 2);
    a.update(5 * T);
    expect(a.hasBuff('anima-charged')).toBe(false);
    expect(a.stack('concentrated-crit')).toBe(45);
  });

  it('Wild Magic: +10% crit chance and +20% crit damage on both hits; Channelled Might after a full Asphyxiate adds +15% crit damage', () => {
    const e = make(['wild-magic', 'asphyxiate', 'magic'], {}, {}, 0.15); // 0.15: Wild Magic crits (10% + 10%), plain magic does not
    cast(e, 'wild-magic', 1);
    expect(hits(e, 'wild-magic').map((h) => [h.amount, h.crit])).toEqual([[Math.floor(1295 * 1.7), true], [Math.floor(1295 * 1.7), true]]); // 129.5% roll × (1.5 + 0.2)
    e.adrenaline = 100;
    cast(e, 'asphyxiate', 4);
    e.update(12 * T);
    expect(e.buff('channelled-might')?.endTick).toBe(11 + 6);
    expect(hits(e, 'asphyxiate').map((h) => h.crit)).toEqual([false, false, false, false]);
    const c = make(['asphyxiate', 'magic'], {}, {}, 0.05);
    cast(c, 'asphyxiate', 1);
    c.update(9 * T);
    cast(c, 'magic', 9);
    expect(hits(c, 'magic')[0].amount).toBe(Math.floor(910 * 1.65)); // 91% × (1.5 + 0.15)
  });
});

describe('magic: Dragon Breath, Combust, Kerapac', () => {
  it('Dragon Breath deals 1.25x against a Combusted target and 260–310% when it consumes Anima Charged', () => {
    const e = make(['combust', 'runic-charge', 'dragon-breath', 'dragon-breath']);
    cast(e, 'combust', 1);
    e.press('ability:runic-charge', 2 * T + 1);
    e.update(3 * T);
    cast(e, 'dragon-breath', 4);
    expect(hits(e, 'dragon-breath')[0].amount).toBe(Math.floor(2850 * 1.25));
    expect(e.hasBuff('anima-charged')).toBe(false);
    e.update(16 * T);
    cast(e, 'dragon-breath', 16);
    expect(hits(e, 'dragon-breath')[1].amount).toBe(Math.floor(1200 * 1.25));
    e.update(40 * T);
    cast(e, 'dragon-breath', 40); // Combust over
    expect(hits(e, 'dragon-breath')[2].amount).toBe(1200);
  });

  it("Kerapac's wrist wraps: a Combust within 6 s after Dragon Breath lands all ten hits at once at +25%; Blast Infused adds 8% to magic basics", () => {
    const e = make(['dragon-breath', 'combust', 'wild-magic', 'magic'], { items: new Set(['kerapac-s-wrist-wraps', 'blast-diffusion-boots']) });
    cast(e, 'dragon-breath', 1);
    expect(e.buff('kerapac-window')?.endTick).toBe(11);
    cast(e, 'combust', 4);
    const c = hits(e, 'combust');
    expect(c.length).toBe(10);
    expect(c.every((h) => h.tick === 4 && h.dot && h.amount === Math.floor(300 * 1.25))).toBe(true);
    expect(e.hasBuff('kerapac-window')).toBe(false);
    cast(e, 'wild-magic', 7);
    expect(e.hasBuff('blast-infused')).toBe(true);
    cast(e, 'magic', 10);
    expect(hits(e, 'magic')[0].amount).toBe(1080);
  });
});

describe('magic: Magma Tempest, Sunshine, Tumeken', () => {
  it('Magma Tempest lands 8 hits every 2 ticks and never crits', () => {
    const e = make(['magma-tempest'], {}, {}, 0.01);
    cast(e, 'magma-tempest', 1);
    e.update(16 * T);
    expect(hits(e, 'magma-tempest').map((h) => [h.tick, h.amount, h.crit])).toEqual([1, 3, 5, 7, 9, 11, 13, 15].map((t) => [t, 351, false])); // 35.1% roll, no crit despite random 0.01
  });

  it('Sunshine: 17 periodic hits of 10–20% every 3 ticks (none with Planted Feet), unaffected by the 1.5x', () => {
    const e = make(['sunshine']);
    cast(e, 'sunshine', 1);
    e.update(55 * T);
    const dot = hits(e, 'sunshine');
    expect(dot.length).toBe(17);
    expect(dot[0]).toEqual({ amount: 150, tick: 4, crit: false, dot: true });
    expect(dot[16].tick).toBe(52);
    const pf = make(['sunshine'], { items: new Set(['planted-feet']) });
    cast(pf, 'sunshine', 1);
    pf.update(55 * T);
    expect(hits(pf, 'sunshine').length).toBe(0);
  });

  it("Tumeken's resplendence: Asphyxiate as 8 hits at 60%, Channelled Might 15 ticks with +35% crit damage, +1.5% crit per piece inside Sunshine", () => {
    const e = make(['asphyxiate', 'magic'], {
      channelOverrides: { asphyxiate: { ticks: 8, hits: [1, 2, 3, 4, 5, 6, 7, 8], onComplete: [{ kind: 'buff', id: 'channelled-might' }], damageMult: 0.6 } },
      buffDurationAdd: { 'channelled-might': 9 },
      buffCritDamageAdd: { 'channelled-might': 0.35 },
    }, {}, 0.05);
    cast(e, 'asphyxiate', 1);
    e.update(10 * T);
    const h = hits(e, 'asphyxiate');
    expect(h.map((x) => x.tick)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    expect(h.every((x) => x.amount === Math.floor(1210 * 0.6 * 1.5))).toBe(true); // 121% roll × 0.6, crit
    expect(e.buff('channelled-might')?.endTick).toBe(9 + 15);
    cast(e, 'magic', 10);
    expect(hits(e, 'magic')[0].amount).toBe(Math.floor(910 * 1.85));
  });
});

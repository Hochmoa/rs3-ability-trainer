/**
 * Melee abilities against docs/research/melee.md – Chaos Roar, (Greater) Fury, Bloodlust spenders, Endless
 * Assault, Massacre, Greater Flurry × Berserk, Greater Barge ramp, Punish, Meteor Strike, Igneous Overpower.
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
    // the wiki buff links come along like in the app – a modelled ability must still deal its hit
    buffs: a.buffs.filter((b) => b >= 0).map((b) => ({ id: 'buff:' + b, name: String(b), kind: 'Buff' as const, on: 'self' as const, icon: null, durationTicks: a.durationTicks ?? 3 })),
    damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

/** melee engine: ability damage 1000, mid rolls, no crits unless a buff guarantees them */
function make(ids: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}, random = 0.5): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const l = { ...defaultResolvedLoadout(), style: 'Melee' as const, has2h: true, abilityDamage: 1000, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true, fullAdrenaline: true, ...cfg, loadout: l });
  e.random = () => random;
  e.start(0);
  return e;
}

/** press so that the cast lands on `tick` */
function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, id: string): { amount: number; tick: number; crit: boolean }[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'hit' }> => x.kind === 'hit' && x.key === 'ability:' + id).map((h) => ({ amount: h.amount, tick: h.tick, crit: h.crit }));
}

describe('melee: Chaos Roar', () => {
  it('multiplies the next damaging melee ability by 1.75 – all hits of a multi-hit, only the first of a channel', () => {
    const e = make(['chaos-roar', 'attack', 'hurricane', 'chaos-roar', 'assault']);
    cast(e, 'chaos-roar', 1);
    expect(hits(e, 'chaos-roar')).toEqual([{ amount: 1100, tick: 1, crit: false }]);
    expect(e.buff('chaos-roar')?.endTick).toBe(13);
    cast(e, 'attack', 4);
    expect(hits(e, 'attack').map((h) => h.amount)).toEqual([2100]); // 120% × 1.75
    expect(e.hasBuff('chaos-roar')).toBe(false);
    cast(e, 'hurricane', 7); // no roar left: plain 150% + 170%
    expect(hits(e, 'hurricane').map((h) => h.amount)).toEqual([1500, 1700]);
    e.update(101 * T);
    cast(e, 'chaos-roar', 101);
    cast(e, 'assault', 104);
    e.update(112 * T);
    expect(hits(e, 'assault').map((h) => h.amount)).toEqual([2450, 1400, 1400, 1400]); // 140% × 1.75, then plain
  });

  it('Meteor Strike hits (235%), consumes Chaos Roar and gives +4.5% adrenaline per tick only with a melee weapon', () => {
    const e = make(['chaos-roar', 'meteor-strike']);
    cast(e, 'chaos-roar', 1);
    e.adrenaline = 60;
    cast(e, 'meteor-strike', 4);
    expect(hits(e, 'meteor-strike').map((h) => h.amount)).toEqual([Math.floor(2350 * 1.75)]);
    expect(e.hasBuff('chaos-roar')).toBe(false);
    expect(e.adrenaline).toBe(0);
    e.update(6 * T);
    expect(e.adrenaline).toBeCloseTo(9, 5); // ticks 5 and 6
    // switching to a magic weapon: the buff keeps running, the trickle stops
    (e as unknown as { config: { loadout: ResolvedLoadout } }).config.loadout.style = 'Magic';
    e.update(9 * T);
    expect(e.adrenaline).toBeCloseTo(9, 5);
  });
});

describe('melee: Fury and Greater Fury', () => {
  it('Greater Fury deals its 130% hit (no crit of its own) and guarantees the next melee hit a crit', () => {
    const e = make(['greater-fury', 'attack']);
    cast(e, 'greater-fury', 1);
    expect(hits(e, 'greater-fury')).toEqual([{ amount: 1300, tick: 1, crit: false }]);
    expect(e.buff('greater-fury')?.endTick).toBe(26);
    cast(e, 'attack', 4);
    expect(hits(e, 'attack')).toEqual([{ amount: 1800, tick: 4, crit: true }]);
    expect(e.hasBuff('greater-fury')).toBe(false);
  });

  it('Fury adds 25% crit chance to the next melee attack', () => {
    const e = make(['fury', 'attack', 'attack'], {}, {}, 0.3); // 0.3 ≥ 10% base, < 35% with Fury
    cast(e, 'fury', 1);
    expect(hits(e, 'fury')[0].crit).toBe(false);
    cast(e, 'attack', 4);
    expect(hits(e, 'attack')[0]).toEqual({ amount: 1740, tick: 4, crit: true }); // 116% roll × 1.5
    cast(e, 'attack', 7);
    expect(hits(e, 'attack')[1].crit).toBe(false);
  });
});

describe('melee: Bloodlust spenders', () => {
  it('Assault with 4 Bloodlust deals 170–190% per hit and spends the stacks; with 3 it stays 130–150%', () => {
    const e = make(['attack', 'attack', 'attack', 'attack', 'assault']);
    for (let t = 1; t <= 10; t += 3) cast(e, 'attack', t);
    expect(e.stack('bloodlust')).toBe(4);
    cast(e, 'assault', 13);
    e.update(21 * T);
    expect(hits(e, 'assault').map((h) => h.amount)).toEqual([1800, 1800, 1800, 1800]);
    expect(e.stack('bloodlust')).toBe(0);

    const s = make(['attack', 'attack', 'attack', 'assault']);
    for (let t = 1; t <= 7; t += 3) cast(s, 'attack', t);
    cast(s, 'assault', 10);
    s.update(18 * T);
    expect(hits(s, 'assault').map((h) => h.amount)).toEqual([1400, 1400, 1400, 1400]);
    expect(s.stack('bloodlust')).toBe(3);
  });

  it('Hurricane: 150% + 170%, a third hit of 85% with 4 Bloodlust, cooldown −5 per hit on the target', () => {
    const e = make(['hurricane']);
    cast(e, 'hurricane', 1);
    expect(hits(e, 'hurricane').map((h) => h.amount)).toEqual([1500, 1700]);
    expect(e.cooldownLeft('ability:hurricane', 1)).toBe(29);
    const b = make(['attack', 'attack', 'attack', 'attack', 'hurricane']);
    for (let t = 1; t <= 10; t += 3) cast(b, 'attack', t);
    cast(b, 'hurricane', 13);
    expect(hits(b, 'hurricane').map((h) => h.amount)).toEqual([1500, 1700, 850]);
    expect(b.stack('bloodlust')).toBe(0);
  });

  it('Flurry with 4 Bloodlust deals +1% per 1% life points the target is missing, max +65%', () => {
    const e = make(['attack', 'attack', 'attack', 'attack', 'flurry'], {}, { targetLifePoints: 10000 });
    for (let t = 1; t <= 10; t += 3) cast(e, 'attack', t); // 4 × 1200 → 5200 left = 48% missing
    cast(e, 'flurry', 13);
    e.update(22 * T);
    const f = hits(e, 'flurry').map((h) => h.amount);
    expect(f.length).toBe(8);
    expect(f[0]).toBe(Math.floor(650 * 1.48)); // every hit reads the target's current life points
    expect(f[7]).toBeGreaterThan(f[0]);
    expect(f[7]).toBeLessThanOrEqual(Math.floor(650 * 1.65));
  });

  it('Rend under Berserk grants 4 stacks (cap 8) and a basic after Berserk never clamps 5–8 stacks down', () => {
    const e = make(['berserk', 'rend', 'attack', 'attack']);
    cast(e, 'berserk', 1);
    expect(e.stack('bloodlust')).toBe(4);
    cast(e, 'rend', 4);
    expect(e.stack('bloodlust')).toBe(8);
    e.update(40 * T); // Berserk over
    expect(e.hasBuff('berserk')).toBe(false);
    cast(e, 'attack', 40);
    expect(e.stack('bloodlust')).toBe(8);
  });
});

describe('melee: Endless Assault, Massacre, Greater Flurry', () => {
  it('Greater Barge as an opener grants Endless Assault; the next Assault is then a DoT nothing cancels', () => {
    const e = make(['greater-barge', 'assault', 'attack']);
    cast(e, 'greater-barge', 1);
    expect(e.hasBuff('endless-assault')).toBe(true);
    e.update(3 * T);
    expect(hits(e, 'greater-barge').map((h) => h.amount)).toEqual([1450]); // 85% + 10 × 6% ramp for the opener, landing a tick later
    cast(e, 'assault', 4);
    expect(e.hasBuff('endless-assault')).toBe(false);
    expect(e.channel).toBeNull();
    cast(e, 'attack', 7);
    e.update(12 * T);
    expect(e.events.some((x) => x.kind === 'channel-cancelled')).toBe(false);
    expect(hits(e, 'assault').map((h) => h.tick)).toEqual([5, 7, 9, 11]);
    expect(hits(e, 'attack').length).toBe(1);
  });

  it('Greater Barge 4 ticks after the last attack ramps 4 × 6%, and gives no Endless Assault', () => {
    const e = make(['attack', 'greater-barge']);
    cast(e, 'attack', 1);
    cast(e, 'greater-barge', 5);
    expect(e.hasBuff('endless-assault')).toBe(false);
    e.update(7 * T);
    expect(hits(e, 'greater-barge').map((h) => h.amount)).toEqual([1090]);
  });

  it('Massacre: a 120% opener, then six bleed ticks of a flat 100%', () => {
    const e = make(['dismember', 'slaughter', 'massacre']);
    cast(e, 'dismember', 1);
    cast(e, 'slaughter', 4);
    cast(e, 'massacre', 7);
    e.update(32 * T);
    expect(hits(e, 'massacre').map((h) => [h.tick, h.amount])).toEqual([[7, 1200], [11, 1000], [15, 1000], [19, 1000], [23, 1000], [27, 1000], [31, 1000]]);
  });

  it('two Greater Flurries inside one Berserk extend it twice: 33 + 8 + 8 ticks', () => {
    const e = make(['berserk', 'greater-flurry', 'attack', 'greater-flurry']);
    cast(e, 'berserk', 1);
    expect(e.buff('berserk')?.endTick).toBe(34);
    e.adrenaline = 100;
    cast(e, 'greater-flurry', 4);
    e.update(13 * T);
    expect(e.buff('berserk')?.endTick).toBe(42);
    e.adrenaline = 100;
    cast(e, 'greater-flurry', 38);
    e.update(47 * T);
    expect(e.buff('berserk')?.endTick).toBe(50);
  });
});

describe('melee: Punish and Igneous Overpower', () => {
  it('Punish deals 2.5x once the target is below half its life points', () => {
    const e = make(['punish', 'attack', 'attack', 'attack', 'attack', 'attack', 'punish'], {}, { targetLifePoints: 10000 });
    cast(e, 'punish', 1);
    expect(hits(e, 'punish')[0].amount).toBe(1200);
    for (let t = 4; t <= 16; t += 3) cast(e, 'attack', t); // 5 × 1200 → 3800 left
    e.update(41 * T);
    cast(e, 'punish', 41);
    expect(hits(e, 'punish')[1].amount).toBe(3000);
  });

  it('Igneous Kal-Ket Overpower: two hits of 310% (280–340), both landing three ticks after the cast', () => {
    const e = make(['overpower'], { hitsOverrides: { overpower: [3, 3] }, damageOverrides: { overpower: { min: 280, max: 340 } } });
    cast(e, 'overpower', 1);
    e.update(5 * T);
    expect(hits(e, 'overpower')).toEqual([{ amount: 3100, tick: 4, crit: false }, { amount: 3100, tick: 4, crit: false }]);
  });

  it('Bladed Dive outside the GCD is a normal basic (starts the GCD, hits, +9%); inside the GCD it neither hits nor gains', () => {
    const e = make(['bladed-dive', 'attack']);
    e.adrenaline = 0;
    cast(e, 'bladed-dive', 1);
    expect(e.castTick).toBe(1);
    expect(e.adrenaline).toBe(9);
    expect(hits(e, 'bladed-dive').length).toBe(1);

    const g = make(['attack', 'bladed-dive']);
    g.adrenaline = 0;
    cast(g, 'attack', 1);
    g.press('ability:bladed-dive', 1 * T + 1); // inside the GCD: fires at once, no damage, no adrenaline
    g.update(3 * T);
    expect(hits(g, 'bladed-dive').length).toBe(0);
    expect(g.adrenaline).toBe(9); // only the attack's
    expect(g.castTick).toBe(1);
  });
});

describe('hit delay setting', () => {
  it('shifts ordinary hits by the configured ticks but leaves abilities with their own timing and DoT ticks alone', () => {
    const e = make(['punish', 'backhand', 'dismember', 'assault'], {}, { hitDelayTicks: 2 });
    cast(e, 'punish', 1);
    expect(hits(e, 'punish')).toEqual([]); // nothing on the cast tick
    e.update(3 * T + 1);
    expect(hits(e, 'punish').map((h) => h.tick)).toEqual([3]);
    cast(e, 'backhand', 4);
    e.update(5 * T + 1);
    expect(hits(e, 'backhand').map((h) => h.tick)).toEqual([5]);
    cast(e, 'dismember', 7);
    e.update(30 * T);
    expect(hits(e, 'dismember')[0].tick).toBe(9);
    cast(e, 'assault', 30);
    e.update(40 * T);
    expect(hits(e, 'assault').map((h) => h.tick)).toEqual([31, 33, 35, 37]);
  });
});

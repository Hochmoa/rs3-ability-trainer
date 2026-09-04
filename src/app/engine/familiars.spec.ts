/**
 * Combat familiars (public/data/familiars.json, rules-familiars.ts): attack cadence and flat damage, the Ripper Demon's
 * missing-life-points bonus, Death From Above, Crit-i-Kal, special move points (cost, regeneration, refusal) and the
 * scroll requirements; plus the invariants between the data file and the scroll rules.
 */
import { describe, expect, it } from 'vitest';
import FAMILIARS from '../../../public/data/familiars.json';
import { Familiar, scrollSpecial } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { resolveLoadout } from './loadout-resolver';
import { newLoadout } from '../core/models';
import { BUFF_BY_ID, SCROLL_RULES } from './rules';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const DATA = FAMILIARS as unknown as Familiar[];
const BY_ID = new Map(DATA.map((f) => [f.id, f]));
const T = TICK_MS;

function familiar(id: string): Familiar {
  const f = BY_ID.get(id);
  if (!f) throw new Error('unknown familiar ' + id);
  return f;
}

/** the scroll of a familiar as the engine sees it (DataService.toEngineEntity for a special of kind scroll) */
function scroll(f: Familiar): EngineEntity {
  const s = scrollSpecial(f);
  return { key: 'special:' + s.id, kind: 'special', id: s.id, name: s.name, icon: s.icon, gcd: false, adrenaline: 0, cooldownTicks: s.cooldownTicks, buffs: [], scroll: { familiar: f.id, specialPoints: s.specialPoints ?? 0 } };
}

/** a plain melee basic: one 100% hit, so a hit of 1000 ability damage is 1000 (1500 as a critical strike) */
const STRIKE: EngineEntity = { key: 'ability:strike', kind: 'ability', id: 'strike', name: 'Strike', icon: '', gcd: true, style: 'Melee', abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, buffs: [], damageMin: 100, damageMax: 100 };

function make(steps: EngineEntity[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}, random = 0.5): TrainerEngine {
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const l = { ...defaultResolvedLoadout(), style: 'Melee' as const, abilityDamage: 1000, ...loadout };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: l });
  e.random = () => random;
  e.start(0);
  return e;
}

function press(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function advance(e: TrainerEngine, tick: number): void {
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, key: string): { amount: number; tick: number; crit: boolean; dot: boolean }[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'hit' }> => x.kind === 'hit' && x.key === key).map((h) => ({ amount: h.amount, tick: h.tick, crit: h.crit, dot: h.dot }));
}

function requirements(e: TrainerEngine): string[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'requirement' }> => x.kind === 'requirement').map((x) => x.text);
}

describe('familiar attacks', () => {
  it('the Ripper Demon hits every 6 ticks from tick 6 for a flat 670–1341 (no crit, no ability damage, no style buffs)', () => {
    const e = make([], { familiar: familiar('ripper-demon'), abilityDamage: 5000 });
    advance(e, 20);
    expect(hits(e, 'familiar:ripper-demon')).toEqual([
      { amount: 1005, tick: 6, crit: false, dot: false },
      { amount: 1005, tick: 12, crit: false, dot: false },
      { amount: 1005, tick: 18, crit: false, dot: false },
    ]);
  });

  it('the Ripper Demon deals up to +5% the lower the target life points (×(1 + 0.05 × missing share))', () => {
    const e = make([], { familiar: familiar('ripper-demon') }, { targetLifePoints: 100000 });
    advance(e, 13);
    const h = hits(e, 'familiar:ripper-demon');
    expect(h[0].amount).toBe(1005); // full life points: no bonus
    expect(h[1].amount).toBe(Math.floor(1005.5 * (1 + 0.05 * (1005 / 100000)))); // 1006
  });

  it("the Kal'gerion demon hits every 4 ticks for 684–1368 and Vulnerability raises its hits by 10%", () => {
    const e = make([], { familiar: familiar('kalgerion-demon') });
    advance(e, 9);
    expect(hits(e, 'familiar:kalgerion-demon').map((h) => [h.tick, h.amount])).toEqual([[4, 1026], [8, 1026]]);
  });

  it('no familiar in the loadout: nothing attacks and scrolls are refused', () => {
    const dfa = scroll(familiar('ripper-demon'));
    const e = make([dfa]);
    press(e, dfa.key, 2);
    advance(e, 20);
    expect(e.events.filter((x) => x.kind === 'hit')).toEqual([]);
    expect(requirements(e)).toEqual(['needs the ripper demon familiar (Loadout page)']);
  });

  it('another familiar out: its scroll is refused, the loadout familiar keeps attacking', () => {
    const critikal = scroll(familiar('kalgerion-demon'));
    const e = make([critikal], { familiar: familiar('ripper-demon') });
    press(e, critikal.key, 2);
    advance(e, 7);
    expect(requirements(e)).toEqual(['needs the kalgerion demon familiar (Loadout page)']);
    expect(hits(e, 'familiar:ripper-demon').length).toBe(1);
  });
});

describe('scrolls', () => {
  it('Death From Above: 20 special move points, the next Ripper Demon attack deals 200–320% of the max hit, later ones are normal again', () => {
    const dfa = scroll(familiar('ripper-demon'));
    const e = make([dfa], { familiar: familiar('ripper-demon') });
    expect(e.familiarSpecial).toBe(60);
    press(e, dfa.key, 2);
    expect(e.familiarSpecial).toBe(40);
    expect(e.hasBuff('death-from-above')).toBe(true);
    advance(e, 13);
    expect(hits(e, 'familiar:ripper-demon').map((h) => [h.tick, h.amount])).toEqual([[6, Math.floor(1341 * 2.6)], [12, 1005]]);
    expect(e.hasBuff('death-from-above')).toBe(false);
  });

  it('Crit-i-Kal: 30 points, +5% critical strike chance for 100 ticks on top of the +1% the demon gives while it is out', () => {
    const critikal = scroll(familiar('kalgerion-demon'));
    const r = resolveLoadout({ ...newLoadout('f'), familiar: 'kalgerion-demon' }, { weaponById: new Map(), specById: new Map(), perkById: new Map(), setEffectById: new Map(), familiarById: BY_ID, specEntity: () => ({}) as EngineEntity });
    expect(r.familiar?.id).toBe('kalgerion-demon');
    expect(r.critChanceAdd).toBeCloseTo(0.01, 9);
    // a roll of 0.15 misses the 11% (10% base + 1% demon) but lands inside the 16% with the buff
    const without = make([STRIKE], { familiar: familiar('kalgerion-demon'), critChanceAdd: r.critChanceAdd }, {}, 0.15);
    press(without, STRIKE.key, 2);
    advance(without, 3);
    expect(hits(without, STRIKE.key)).toEqual([{ amount: 1000, tick: 2, crit: false, dot: false }]);
    const withBuff = make([critikal, STRIKE], { familiar: familiar('kalgerion-demon'), critChanceAdd: r.critChanceAdd }, {}, 0.15);
    press(withBuff, critikal.key, 1);
    expect(withBuff.familiarSpecial).toBe(30);
    press(withBuff, STRIKE.key, 2);
    advance(withBuff, 3);
    expect(hits(withBuff, STRIKE.key)).toEqual([{ amount: 1500, tick: 2, crit: true, dot: false }]);
    const buff = withBuff.buffs.find((b) => b.id === 'crit-i-kal');
    expect(buff?.endTick).toBe(101);
  });

  it('special move points: a scroll is refused below its cost, 15 points come back every 50 ticks', () => {
    const dfa = scroll(familiar('ripper-demon'));
    const e = make([dfa], { familiar: familiar('ripper-demon') });
    press(e, dfa.key, 1);
    press(e, dfa.key, 2);
    press(e, dfa.key, 3);
    expect(e.familiarSpecial).toBe(0);
    press(e, dfa.key, 4);
    expect(requirements(e)).toEqual(['needs 20 special move points (0 left)']);
    advance(e, 50);
    expect(e.familiarSpecial).toBe(15);
    advance(e, 100);
    expect(e.familiarSpecial).toBe(30);
    e.events.length = 0;
    press(e, dfa.key, 101);
    expect(requirements(e)).toEqual([]);
    expect(e.familiarSpecial).toBe(10);
  });

  it('Blood Siphon: 15 points and a 5-tick cooldown, nothing else is simulated', () => {
    const siphon = scroll(familiar('blood-reaver'));
    const e = make([siphon], { familiar: familiar('blood-reaver') });
    press(e, siphon.key, 2);
    expect(e.familiarSpecial).toBe(45);
    press(e, siphon.key, 4);
    expect(e.events.some((x) => x.kind === 'on-cooldown' && x.key === siphon.key)).toBe(true);
    expect(e.familiarSpecial).toBe(45);
    press(e, siphon.key, 7);
    expect(e.familiarSpecial).toBe(30);
    expect(e.buffs).toEqual([]);
  });

  it('scrolls do not touch the global cooldown or adrenaline', () => {
    const dfa = scroll(familiar('ripper-demon'));
    const e = make([STRIKE, dfa], { familiar: familiar('ripper-demon') }, { fullAdrenaline: false });
    press(e, STRIKE.key, 1);
    press(e, dfa.key, 2);
    expect(e.adrenaline).toBe(9);
    expect(e.gcdEndTick).toBe(4);
  });
});

describe('familiar data ↔ scroll rules', () => {
  it('every scroll rule belongs to a scroll in familiars.json and every scroll has a rule', () => {
    const scrolls = new Set(DATA.map((f) => f.scroll.id));
    expect(SCROLL_RULES.map((r) => r.ability).filter((id) => !scrolls.has(id))).toEqual([]);
    const ruled = new Set(SCROLL_RULES.map((r) => r.ability));
    expect([...scrolls].filter((id) => !ruled.has(id))).toEqual([]);
  });

  it('every buff a scroll rule applies is defined, every familiar has a positive attack cadence and damage', () => {
    const missing: string[] = [];
    for (const r of SCROLL_RULES) for (const eff of r.onCast ?? []) if (eff.kind === 'buff' && !BUFF_BY_ID.has(eff.id)) missing.push(r.ability + ' → ' + eff.id);
    expect(missing).toEqual([]);
    for (const f of DATA) {
      expect(f.attack.everyTicks).toBeGreaterThan(0);
      expect(f.attack.firstTick).toBeGreaterThan(0);
      expect(f.attack.damageMax).toBeGreaterThanOrEqual(f.attack.damageMin);
      expect(f.scroll.specialPoints).toBeGreaterThan(0);
    }
  });
});

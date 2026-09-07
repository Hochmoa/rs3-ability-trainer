/**
 * Weapon-shape rules the Combat Style Modernisation left in place: Flurry, Greater Flurry and Bladed Dive
 * "only work while dual-wielding" (runescape.wiki/w/Flurry), Adaptive Strike has one form per weapon shape
 * (runescape.wiki/w/Adaptive_Strike), and Darkfang splits the Ranged basic attack into two hits
 * (runescape.wiki/w/Gloomfire_bow).
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import GEAR from '../../../public/data/gear.json';
import PERKS from '../../../public/data/perks.json';
import SETS from '../../../public/data/set-effects.json';
import SPECS from '../../../public/data/specs.json';
import WEAPONS from '../../../public/data/weapons.json';
import { Ability, GearItem, ItemRef, Perk, SetEffect, Weapon, WeaponSpec, newLoadout, weaponSlot } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { LoadoutData, resolveLoadout } from './loadout-resolver';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const T = TICK_MS;
const BY_ID = new Map((ABILITIES as unknown as Ability[]).map((a) => [a.id, a]));
const DATA: LoadoutData = {
  weaponById: new Map((WEAPONS as unknown as Weapon[]).map((w) => [w.id, w])),
  specById: new Map((SPECS as unknown as WeaponSpec[]).map((s) => [s.id, s])),
  perkById: new Map((PERKS as unknown as Perk[]).map((p) => [p.id, p])),
  setEffectById: new Map((SETS as unknown as SetEffect[]).map((s) => [s.id, s])),
  gearById: new Map((GEAR as unknown as GearItem[]).map((g) => [g.id, g])),
  specEntity: (s) => ({
    key: 'spec:' + s.id, kind: 'spec', id: s.id, name: s.name, icon: '', gcd: true, style: s.style, abilityType: 'Special',
    adrenaline: -(s.adrenaline ?? 0), cooldownTicks: s.cooldownTicks, buffs: [],
  }),
};

function ability(id: string): EngineEntity {
  const a = BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, id, kind: 'ability', name: a.name, icon: '', gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [], damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
    channel: a.channelled && a.durationTicks ? { ticks: a.durationTicks, hits: [] as number[] } : undefined,
  };
}

function make(ids: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const l = { ...defaultResolvedLoadout(), style: 'Melee' as const, abilityDamage: 1000, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: l });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}
const hits = (e: TrainerEngine, key: string) => e.events.filter((x) => x.kind === 'hit' && x.key === key);

/** the resolved loadout for these weapon ids */
function resolve(ids: string[]): ResolvedLoadout {
  const l = newLoadout('t');
  l.overload = 'none';
  l.weaponPoison = 0;
  const eq = l.equipment as Record<string, ItemRef>;
  for (const id of ids) {
    const w = DATA.weaponById.get(id);
    if (!w) throw new Error('unknown weapon ' + id);
    eq[weaponSlot(w)] = { kind: 'weapon', id };
  }
  return resolveLoadout(l, DATA);
}

describe('dual wield', () => {
  it('a pair of weapons is dual wield, a two-hander and a shield are not', () => {
    expect(resolve(['dark-shard-of-leng', 'dark-sliver-of-leng']).hasDualWield).toBe(true);
    expect(resolve(['ek-zekkil']).hasDualWield).toBe(false);
    expect(resolve(['dark-shard-of-leng']).hasDualWield).toBe(false);
  });

  it('Flurry is refused with a two-hander and works with a pair', () => {
    const two = make(['flurry'], { has2h: true, hasDualWield: false });
    cast(two, 'flurry', 1);
    two.update(4 * T);
    expect(two.events.filter((x) => x.kind === 'requirement').map((x) => ('text' in x ? x.text : ''))).toEqual(['only works while dual-wielding']);
    expect(hits(two, 'ability:flurry')).toHaveLength(0);

    const dw = make(['flurry'], { hasDualWield: true });
    cast(dw, 'flurry', 1);
    dw.update(12 * T);
    expect(dw.events.some((x) => x.kind === 'requirement')).toBe(false);
    expect(hits(dw, 'ability:flurry').length).toBeGreaterThan(0);
  });

  it('Greater Flurry and Bladed Dive need the pair as well', () => {
    for (const id of ['greater-flurry', 'bladed-dive']) {
      const e = make([id], { has2h: true, hasDualWield: false });
      e.press('ability:' + id, 1);
      e.update(2 * T + 1);
      expect(e.events.filter((x) => x.kind === 'requirement').map((x) => 'text' in x && x.text)).toEqual(['only works while dual-wielding']);
    }
  });

  it('Adaptive Strike hits twice for 60–75% dual-wielding and once for 120–140% with a two-hander', () => {
    const dw = make(['adaptive-strike'], { hasDualWield: true });
    cast(dw, 'adaptive-strike', 1);
    dw.update(6 * T);
    const dwHits = hits(dw, 'ability:adaptive-strike');
    expect(dwHits).toHaveLength(2);
    for (const h of dwHits) expect('amount' in h && h.amount).toBeGreaterThanOrEqual(600);

    const two = make(['adaptive-strike'], { has2h: true, hasDualWield: false });
    cast(two, 'adaptive-strike', 1);
    two.update(6 * T);
    const twoHits = hits(two, 'ability:adaptive-strike');
    expect(twoHits).toHaveLength(1);
    expect('amount' in twoHits[0] && twoHits[0].amount).toBeGreaterThanOrEqual(1200);
  });
});

describe('Darkfang', () => {
  it('the Gloomfire bow and the Dark bow split the Ranged basic attack into two hits', () => {
    expect(resolve(['gloomfire-bow']).hitsOverrides['ranged']).toEqual([0, 0]);
    expect(resolve(['dark-bow']).hitsOverrides['ranged']).toEqual([0, 0]);
    expect(resolve(['bow-of-the-last-guardian']).hitsOverrides['ranged']).toBeUndefined();
  });

  it('the two hits count twice for everything that reacts to a hit', () => {
    const e = make(['ranged'], { style: 'Ranged', hitsOverrides: { ranged: [0, 0] } });
    cast(e, 'ranged', 1);
    e.update(6 * T);
    expect(hits(e, 'ability:ranged')).toHaveLength(2);
  });
});

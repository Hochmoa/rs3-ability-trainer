/**
 * Spells against docs/research/spells.md – Disruption Shield and Vengeance (Lunar), the spellbook requirement,
 * GCD spells (Vulnerability) and auto-cast selections (Exsanguinate / Incite Fear).
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import SPELLS from '../../../public/data/spells.json';
import { Ability, DEFAULT_ENEMY, EnemyConfig, Spell } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const ABILITY_BY_ID = new Map((ABILITIES as unknown as Ability[]).map((a) => [a.id, a]));
const SPELL_BY_ID = new Map((SPELLS as unknown as Spell[]).map((s) => [s.id, s]));
const T = TICK_MS;

function ability(id: string): EngineEntity {
  const a = ABILITY_BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return { key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type, adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [] };
}

/** the same shape DataService.toEngineEntity builds for a spell */
function spell(id: string): EngineEntity {
  const s = SPELL_BY_ID.get(id);
  if (!s) throw new Error('unknown spell ' + id);
  return { key: 'spell:' + id, kind: 'spell', id, name: s.name, icon: s.icon, gcd: s.gcd, adrenaline: 0, cooldownTicks: s.cooldownTicks, buffs: [], durationTicks: s.durationTicks ?? undefined };
}

const ENEMY: EnemyConfig = { ...DEFAULT_ENEMY, enabled: true, styles: ['Melee'], pattern: 'cycle', intervalTicks: 5, warningTicks: 3, firstAttackTicks: 4 };

function make(keys: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const entity = (k: string) => (k.startsWith('spell:') ? spell(k.slice(6)) : ability(k.replace(/^ability:/, '')));
  const steps = keys.map(entity);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  for (const id of ['disruption-shield', 'vengeance', 'vengeance-group', 'vulnerability', 'exsanguinate', 'incite-fear']) catalog.set('spell:' + id, spell(id));
  catalog.set('ability:anticipation', ability('anticipation'));
  const l = { ...defaultResolvedLoadout(), style: 'Magic' as const, has2h: true, spellbook: 'lunar' as const, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true, fullAdrenaline: true, ...cfg, loadout: l });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

function press(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function attacks(e: TrainerEngine) {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'attack' }> => x.kind === 'attack');
}

describe('spells: Disruption Shield', () => {
  it('is cast off the GCD, has no timer, cannot be recast while up and cools down for 100 ticks', () => {
    const e = make(['ability:anticipation', 'spell:disruption-shield']);
    press(e, 'ability:anticipation', 1);
    press(e, 'spell:disruption-shield', 2); // inside the GCD of Anticipation
    expect(e.hasBuff('disruption-shield')).toBe(true);
    expect(e.buff('disruption-shield')?.endTick).toBeNull();
    expect(e.results.map((r) => r.key)).toEqual(['ability:anticipation', 'spell:disruption-shield']);
    expect(e.cooldownLeft('spell:disruption-shield', 2)).toBe(100);
    expect(e.requirementFailure(spell('disruption-shield'), 3)).toContain('still active');
    e.update(60 * T);
    expect(e.hasBuff('disruption-shield')).toBe(true); // no timer
  });

  it('needs the Lunar spellbook', () => {
    const e = make(['spell:disruption-shield'], { spellbook: 'standard' });
    expect(e.usable('spell:disruption-shield', 0)).toBe('book');
    expect(e.requirementFailure(spell('disruption-shield'), 0)).toBe('needs the Lunar spellbook');
    press(e, 'spell:disruption-shield', 1);
    expect(e.hasBuff('disruption-shield')).toBe(false);
    expect(e.events.some((x) => x.kind === 'requirement' && x.key === 'spell:disruption-shield' && x.text === 'needs the Lunar spellbook')).toBe(true);
    const lunar = make(['spell:disruption-shield']);
    expect(lunar.usable('spell:disruption-shield', 0)).toBe('ok');
  });

  it('absorbs the next enemy attack – no unprayed hit, the shield is used up, later attacks land again', () => {
    const e = make(['spell:disruption-shield'], {}, { enemy: ENEMY });
    press(e, 'spell:disruption-shield', 1);
    e.update(4 * T + 1); // attack at tick 4
    expect(attacks(e)).toHaveLength(1);
    expect(attacks(e)[0]).toMatchObject({ tick: 4, prayed: false, absorbed: 'disruption-shield', reflected: false });
    expect(e.prayerStats).toMatchObject({ attacks: 1, prayed: 0, hits: 0, absorbed: 1 });
    expect(e.hasBuff('disruption-shield')).toBe(false);
    e.update(9 * T + 1); // attack at tick 9 lands
    expect(e.prayerStats).toMatchObject({ attacks: 2, hits: 1, absorbed: 1 });
    expect(attacks(e)[1].absorbed).toBeUndefined();
  });
});

describe('spells: Vengeance', () => {
  it('is cast off the GCD, lasts until a hit lands, cools down for 50 ticks shared with Vengeance Group', () => {
    const e = make(['spell:vengeance']);
    press(e, 'spell:vengeance', 1);
    expect(e.hasBuff('vengeance')).toBe(true);
    expect(e.buff('vengeance')?.endTick).toBeNull();
    expect(e.castTick).toBeNull(); // no GCD started
    expect(e.cooldownLeft('spell:vengeance', 1)).toBe(50);
    expect(e.cooldownLeft('spell:vengeance-group', 1)).toBe(50);
    expect(e.cooldownLeft('spell:vengeance', 51)).toBe(0);
    press(e, 'spell:vengeance', 10);
    expect(e.events.some((x) => x.kind === 'on-cooldown' && x.key === 'spell:vengeance')).toBe(true);
  });

  it('reflects the first hit that lands – the hit still counts – and is not used up by a hit Disruption Shield blocks', () => {
    const e = make(['spell:vengeance', 'spell:disruption-shield'], {}, { enemy: ENEMY });
    press(e, 'spell:vengeance', 1);
    press(e, 'spell:disruption-shield', 2);
    e.update(4 * T + 1);
    expect(attacks(e)[0]).toMatchObject({ absorbed: 'disruption-shield', reflected: false });
    expect(e.hasBuff('vengeance')).toBe(true);
    e.update(9 * T + 1);
    expect(attacks(e)[1]).toMatchObject({ prayed: false, reflected: true });
    expect(attacks(e)[1].absorbed).toBeUndefined();
    expect(e.hasBuff('vengeance')).toBe(false);
    expect(e.prayerStats).toMatchObject({ attacks: 2, hits: 1, absorbed: 1 });
  });

  it('needs the Lunar spellbook', () => {
    const e = make(['spell:vengeance'], { spellbook: 'ancient' });
    press(e, 'spell:vengeance', 1);
    expect(e.hasBuff('vengeance')).toBe(false);
    expect(e.events.some((x) => x.kind === 'requirement' && x.text === 'needs the Lunar spellbook')).toBe(true);
  });
});

describe('spells: GCD casts and auto-cast selections', () => {
  it('Vulnerability is a GCD cast of the standard book that applies the 100-tick debuff', () => {
    const e = make(['spell:vulnerability', 'ability:anticipation'], { spellbook: 'standard' });
    expect(e.isGcdStep(spell('vulnerability'))).toBe(true);
    press(e, 'spell:vulnerability', 1);
    expect(e.castTick).toBe(1);
    expect(e.buff('vulnerability')).toMatchObject({ on: 'target', endTick: 101 });
    expect(e.results[0]).toMatchObject({ key: 'spell:vulnerability', outcome: 'perfect' });
    expect(e.events.some((x) => x.kind === 'hit')).toBe(false);
  });

  it('selecting an Ancient auto-cast spell is instant and replaces the previous selection', () => {
    const e = make(['spell:exsanguinate', 'spell:incite-fear'], { spellbook: 'ancient' });
    press(e, 'spell:exsanguinate', 1);
    expect(e.hasBuff('autocast-exsanguinate')).toBe(true);
    expect(e.castTick).toBeNull();
    press(e, 'spell:incite-fear', 2);
    expect(e.hasBuff('autocast-exsanguinate')).toBe(false);
    expect(e.hasBuff('autocast-incite-fear')).toBe(true);
    expect(e.buff('autocast-incite-fear')?.endTick).toBeNull();
  });
});

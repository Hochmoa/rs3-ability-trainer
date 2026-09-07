/**
 * Magic support the Combat Style Modernisation left half-modelled: Incite Fear's Glacial Embrace stacks and the
 * Tsunami discount they give (runescape.wiki/w/Incite_Fear), and the aspects of power – only one at a time, with
 * Temporal Anomaly resetting magic cooldowns (runescape.wiki/w/Temporal_Anomaly).
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import SPELLS from '../../../public/data/spells.json';
import { Ability, Spell } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { ASPECTS, aspectEffects } from './rules-model';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const ABILITY_BY_ID = new Map((ABILITIES as unknown as Ability[]).map((a) => [a.id, a]));
const SPELL_BY_ID = new Map((SPELLS as unknown as Spell[]).map((s) => [s.id, s]));
const T = TICK_MS;

function ability(id: string): EngineEntity {
  const a = ABILITY_BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return { key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type, adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [] };
}
function spell(id: string): EngineEntity {
  const s = SPELL_BY_ID.get(id);
  if (!s) throw new Error('unknown spell ' + id);
  return { key: 'spell:' + id, kind: 'spell', id, name: s.name, icon: s.icon, gcd: s.gcd, adrenaline: 0, cooldownTicks: s.cooldownTicks, buffs: [], durationTicks: s.durationTicks ?? undefined };
}

function make(keys: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const entity = (k: string) => (k.startsWith('spell:') ? spell(k.slice(6)) : ability(k.replace(/^ability:/, '')));
  const steps = keys.map(entity);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  for (const id of ['incite-fear', 'animate-dead', 'vampyrism', 'penance', 'temporal-anomaly']) catalog.set('spell:' + id, spell(id));
  for (const id of ['tsunami', 'dragon-breath', 'sunshine', 'magic']) catalog.set('ability:' + id, ability(id));
  const l = { ...defaultResolvedLoadout(), style: 'Magic' as const, has2h: true, spellbook: 'ancient' as const, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: l });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

function press(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

describe('Incite Fear: Glacial Embrace', () => {
  it('every ability cast grants a stack, capped at 5, and the stacks expire 34 ticks after the last one', () => {
    const e = make(['spell:incite-fear', 'ability:magic'], { spellbook: 'ancient' });
    press(e, 'spell:incite-fear', 1);
    for (let i = 0; i < 7; i++) press(e, 'ability:magic', 4 + i * 3);
    expect(e.stack('glacial-embrace')).toBe(5);
    e.update((4 + 6 * 3 + 34) * T + 1);
    expect(e.stack('glacial-embrace')).toBe(0);
  });

  it('without Incite Fear selected no stack is built', () => {
    const e = make(['ability:magic'], { spellbook: 'ancient' });
    press(e, 'ability:magic', 1);
    expect(e.stack('glacial-embrace')).toBe(0);
  });
});

describe('Tsunami', () => {
  const costOf = (e: TrainerEngine) => e.costOf(e.catalog.get('ability:tsunami')!);

  it('costs 100% adrenaline without stacks and 40% at five, and keeps the stacks', () => {
    const e = make(['spell:incite-fear', 'ability:magic', 'ability:magic', 'ability:magic', 'ability:magic', 'ability:magic', 'ability:tsunami'], { spellbook: 'ancient' });
    expect(costOf(e)).toEqual({ need: 100, cost: 100 });
    press(e, 'spell:incite-fear', 1);
    for (let i = 0; i < 5; i++) press(e, 'ability:magic', 4 + i * 3);
    expect(e.stack('glacial-embrace')).toBe(5);
    expect(costOf(e)).toEqual({ need: 40, cost: 40 });
    press(e, 'ability:tsunami', 22);
    expect(e.hasBuff('tsunami')).toBe(true);
    expect(e.stack('glacial-embrace')).toBe(5); // "Using Tsunami does not consume Glacial Embrace stacks"
  });
});

describe('Frost Surge', () => {
  it('procs at five stacks, at most every 20 ticks, and reaches the other enemies', () => {
    const e = make(['spell:incite-fear', 'ability:magic', 'ability:magic', 'ability:magic', 'ability:magic', 'ability:magic', 'ability:magic', 'ability:magic'], { spellbook: 'ancient', abilityDamage: 1000 });
    press(e, 'spell:incite-fear', 1);
    for (let i = 0; i < 6; i++) press(e, 'ability:magic', 4 + i * 3);
    e.update(30 * 600);
    const procs = e.events.filter((x) => x.kind === 'hit' && x.key === 'proc:frost-surge');
    expect(procs.length).toBeGreaterThan(0);
    const ticks = [...new Set(procs.map((p) => ('tick' in p ? p.tick : 0)))].sort((a, b) => a - b);
    for (let i = 1; i < ticks.length; i++) expect(ticks[i] - ticks[i - 1]).toBeGreaterThanOrEqual(20);
  });

  it('does not proc below five stacks', () => {
    const e = make(['spell:incite-fear', 'ability:magic', 'ability:magic'], { spellbook: 'ancient', abilityDamage: 1000 });
    press(e, 'spell:incite-fear', 1);
    press(e, 'ability:magic', 4);
    press(e, 'ability:magic', 7);
    e.update(20 * 600);
    expect(e.events.some((x) => x.kind === 'hit' && x.key === 'proc:frost-surge')).toBe(false);
  });
});

describe('aspects of power', () => {
  it('a second aspect ends the first', () => {
    const e = make(['spell:animate-dead', 'spell:vampyrism'], { spellbook: 'ancient' });
    press(e, 'spell:animate-dead', 1);
    expect(e.hasBuff('animate-dead')).toBe(true);
    press(e, 'spell:vampyrism', 4);
    expect(e.hasBuff('vampyrism')).toBe(true);
    expect(e.hasBuff('animate-dead')).toBe(false);
  });

  it('every aspect removes the other four', () => {
    for (const id of ASPECTS) {
      const removed = aspectEffects(id).filter((x) => x.kind === 'remove-buff').map((x) => 'id' in x && x.id);
      expect(new Set(removed)).toEqual(new Set(ASPECTS.filter((a) => a !== id)));
      expect(aspectEffects(id).at(-1)).toEqual({ kind: 'buff', id });
    }
  });
});

describe('Temporal Anomaly', () => {
  /** 160 magic damage bonus = 20% chance, the cap */
  const bonus = { Melee: 0, Ranged: 0, Magic: 160, Necromancy: 0 };

  it('can reset the cooldown of the magic ability just cast', () => {
    const e = make(['spell:temporal-anomaly', 'ability:dragon-breath'], { damageBonus: bonus, spellbook: 'standard' });
    e.random = () => 0.1; // inside the 20% chance
    press(e, 'spell:temporal-anomaly', 1);
    press(e, 'ability:dragon-breath', 4);
    expect(e.cooldownLeft('ability:dragon-breath', 5)).toBe(0);
    expect(e.events.some((x) => x.kind === 'cooldown-reset')).toBe(true);
  });

  it('leaves the cooldown alone on an unlucky roll, without the aspect, and for Sunshine', () => {
    const unlucky = make(['spell:temporal-anomaly', 'ability:dragon-breath'], { damageBonus: bonus, spellbook: 'standard' });
    unlucky.random = () => 0.9;
    press(unlucky, 'spell:temporal-anomaly', 1);
    press(unlucky, 'ability:dragon-breath', 4);
    expect(unlucky.cooldownLeft('ability:dragon-breath', 5)).toBeGreaterThan(0);

    const noAspect = make(['ability:dragon-breath'], { damageBonus: bonus });
    noAspect.random = () => 0.1;
    press(noAspect, 'ability:dragon-breath', 1);
    expect(noAspect.cooldownLeft('ability:dragon-breath', 2)).toBeGreaterThan(0);

    const sunshine = make(['spell:temporal-anomaly', 'ability:sunshine'], { damageBonus: bonus, spellbook: 'standard' });
    sunshine.random = () => 0.1;
    press(sunshine, 'spell:temporal-anomaly', 1);
    press(sunshine, 'ability:sunshine', 4);
    expect(sunshine.cooldownLeft('ability:sunshine', 5)).toBeGreaterThan(0);
  });
});

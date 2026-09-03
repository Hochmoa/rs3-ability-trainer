/**
 * Invariants over the whole rule set – catches classes of mistakes (a buff nobody defined, a DoT that
 * refreshes on its own ticks, a rule for an ability that does not exist ...) instead of single cases.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import { Ability } from '../core/models';
import { BUFF_DAMAGE_MULT, TARGET_DAMAGE_MULT } from './damage';
import { MORPH_TARGETS } from './morphs';
import { ABILITY_RULES, BUFF_BY_ID, GLOBALS } from './rules';
import { AbilityRule, Condition, Effect, Requirement } from './rules-model';

const DATA = ABILITIES as unknown as Ability[];
const ABILITY_IDS = new Set(DATA.map((a) => a.id));

function buffsInCondition(c: Condition | undefined, out: Set<string>): void {
  if (!c) return;
  if (c.buff) out.add(c.buff);
  if (c.notBuff) out.add(c.notBuff);
}

function buffsInEffects(effects: Effect[] | undefined, out: Set<string>): void {
  for (const e of effects ?? []) {
    if ('when' in e) buffsInCondition(e.when, out);
    switch (e.kind) {
      case 'buff':
      case 'remove-buff':
        out.add(e.id);
        break;
      case 'extend-buff':
        out.add(e.buff);
        break;
      case 'consume-stack':
        buffsInEffects(e.then, out);
        break;
      case 'choose':
        buffsInEffects(e.then, out);
        buffsInEffects(e.otherwise, out);
        break;
    }
  }
}

function buffsInRule(r: AbilityRule): Set<string> {
  const out = new Set<string>();
  buffsInEffects(r.onCast, out);
  buffsInEffects(r.onHit, out);
  buffsInEffects(r.channel?.onComplete, out);
  for (const q of r.requires ?? []) {
    if (q.buff) out.add(q.buff);
    if (q.notBuff) out.add(q.notBuff);
  }
  for (const c of r.cooldownRules ?? []) buffsInCondition(c.when, out);
  for (const d of r.damageRules ?? []) buffsInCondition(d.when, out);
  if (r.cost?.buffDiscount) out.add(r.cost.buffDiscount.buff);
  for (const id of r.buffs ?? []) out.add(id);
  for (const id of r.hitBuffs ?? []) out.add(id);
  return out;
}

describe('rule set invariants', () => {
  it('every rule belongs to an ability that exists in the data', () => {
    const unknown = ABILITY_RULES.map((r) => r.ability).filter((id) => !ABILITY_IDS.has(id));
    expect(unknown).toEqual([]);
  });

  it('every buff a rule, global rule or damage table refers to is defined', () => {
    const missing = new Set<string>();
    for (const r of ABILITY_RULES) for (const id of buffsInRule(r)) if (!id.includes(':') && !BUFF_BY_ID.has(id)) missing.add(r.ability + ' → ' + id);
    for (const g of GLOBALS) {
      const out = new Set<string>();
      buffsInEffects(g.onCast, out);
      buffsInEffects(g.onHit, out);
      if (g.when.buff) out.add(g.when.buff);
      if (g.consumes) out.add(g.consumes);
      for (const id of out) if (!id.includes(':') && !BUFF_BY_ID.has(id)) missing.add(g.id + ' → ' + id);
    }
    for (const m of BUFF_DAMAGE_MULT) if (!BUFF_BY_ID.has(m.buff)) missing.add('BUFF_DAMAGE_MULT → ' + m.buff);
    for (const m of TARGET_DAMAGE_MULT) if (!m.buff.includes(':') && !BUFF_BY_ID.has(m.buff)) missing.add('TARGET_DAMAGE_MULT → ' + m.buff);
    expect([...missing]).toEqual([]);
  });

  it('every buff definition has a duration, or is a stack / spirit that ends on its own', () => {
    const odd = [...BUFF_BY_ID.values()].filter((b) => b.durationTicks === null && !b.stacks && !b.id.startsWith('spirit-')).map((b) => b.id);
    expect(odd).toEqual([]);
  });

  it('a DoT rule applies its debuff on the cast, never refreshed by its own ticks', () => {
    const bad = ABILITY_RULES.filter((r) => r.bleed && (r.onHit ?? []).some((e) => e.kind === 'buff' && e.refresh)).map((r) => r.ability);
    expect(bad).toEqual([]);
  });

  it('every requirement or condition on a spirit names a conjurable spirit with a spirit buff', () => {
    const spirits = new Set<string>();
    for (const r of ABILITY_RULES) for (const e of r.onCast ?? []) if (e.kind === 'conjure') spirits.add(e.spirit);
    const bad: string[] = [];
    for (const r of ABILITY_RULES) {
      for (const q of r.requires ?? []) if (q.spirit && !spirits.has(q.spirit)) bad.push(r.ability + ' requires ' + q.spirit);
      for (const e of r.onCast ?? []) {
        if (e.kind === 'dismiss' && !spirits.has(e.spirit)) bad.push(r.ability + ' dismisses ' + e.spirit);
        if (e.kind === 'buff' && e.untilSpirit && !spirits.has(e.untilSpirit)) bad.push(r.ability + ' until ' + e.untilSpirit);
      }
    }
    for (const s of spirits) if (!BUFF_BY_ID.has('spirit-' + s)) bad.push('no spirit buff for ' + s);
    expect(bad).toEqual([]);
  });

  it('every morph target is gated by a requirement or a sequence step', () => {
    const bad: string[] = [];
    for (const [source, targets] of MORPH_TARGETS) {
      for (const t of targets) {
        const rule = ABILITY_RULES.find((r) => r.ability === t);
        const gated = !!rule && (!!rule.sequence || (rule.requires ?? []).some((q: Requirement) => q.spirit));
        if (!gated) bad.push(source + ' → ' + t);
      }
    }
    expect(bad).toEqual([]);
  });

  it('a stacking buff that a rule consumes or checks is also generated somewhere', () => {
    const generated = new Set<string>();
    const used = new Set<string>();
    const walk = (effects: Effect[] | undefined) => {
      for (const e of effects ?? []) {
        if (e.kind === 'stack' || e.kind === 'stack-set') generated.add(e.stack);
        if (e.kind === 'consume-stack') used.add(e.stack);
        if ('when' in e && e.when?.stackMin) used.add(e.when.stackMin.stack);
      }
    };
    for (const r of ABILITY_RULES) {
      walk(r.onCast);
      walk(r.onHit);
      for (const q of r.requires ?? []) if (q.stackMin) used.add(q.stackMin.stack);
      if (r.cost?.perStack) used.add(r.cost.perStack.stack);
      if (r.hitsPerStack) used.add(r.hitsPerStack);
    }
    for (const g of GLOBALS) {
      walk(g.onCast);
      walk(g.onHit);
    }
    const orphans = [...used].filter((s) => !generated.has(s));
    expect(orphans).toEqual([]);
  });
});

/**
 * Cross-ability rules – every test mirrors a WHEN/THEN line of docs/research/*.md.
 * Abilities are built from the real data file so costs and cooldowns are the wiki values.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import { Ability } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TrainerEngine } from './trainer-engine';

const DATA = ABILITIES as unknown as Ability[];
const BY_ID = new Map(DATA.map((a) => [a.id, a]));

function ability(id: string): EngineEntity {
  const a = BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0,
    buffs: a.buffs.map((b) => ({ id: 'buff:' + b, name: String(b), kind: 'Buff' as const, on: 'self' as const, icon: null, durationTicks: a.durationTicks ?? 3 })),
  };
}

const T = 600;
const ON: Omit<EngineConfig, 'loadout'> = { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true };

/** Engine over the given ability ids; every id is also in the catalog. Deterministic RNG (no crits, no procs). */
function make(ids: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  const l = { ...defaultResolvedLoadout(), ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { ...ON, ...cfg, loadout: l });
  e.random = () => 0.99;
  e.start(0);
  return e;
}

/** Press + advance to the tick the cast lands (queueing on, so casts happen at the earliest legal tick). */
function cast(e: TrainerEngine, id: string, pressAt: number, until: number): void {
  e.press('ability:' + id, pressAt === 0 ? 1 : pressAt); // time 0 would be processed on tick 0; 1 ms later is tick 1
  e.update(until);
}

describe('melee: Bloodlust and Berserk', () => {
  it('basics generate Bloodlust (Rend 2), cap 4; Assault consumes 4', () => {
    const e = make(['attack', 'rend', 'fury', 'punish', 'assault'], { style: 'Melee' });
    cast(e, 'attack', 0, 1 * T);
    expect(e.stack('bloodlust')).toBe(1);
    cast(e, 'rend', 2 * T, 4 * T);
    expect(e.stack('bloodlust')).toBe(3);
    cast(e, 'fury', 5 * T, 7 * T);
    expect(e.stack('bloodlust')).toBe(4);
    cast(e, 'punish', 8 * T, 10 * T);
    expect(e.stack('bloodlust')).toBe(4); // capped
    cast(e, 'assault', 11 * T, 13 * T);
    expect(e.stack('bloodlust')).toBe(0);
  });

  it('Berserk: +4 stacks, cap 8, double generation, 33 ticks, Overpower cooldown 15', () => {
    const e = make(['berserk', 'attack', 'overpower'], { style: 'Melee', startAdrenaline: 100 });
    cast(e, 'berserk', 0, 1 * T);
    expect(e.hasBuff('berserk')).toBe(true);
    expect(e.buff('berserk')!.endTick).toBe(1 + 33);
    expect(e.stack('bloodlust')).toBe(4);
    cast(e, 'attack', 2 * T, 4 * T);
    expect(e.stack('bloodlust')).toBe(6);
    e.adrenaline = 100;
    cast(e, 'overpower', 5 * T, 7 * T);
    expect(e.cooldownLeft('ability:overpower', 7)).toBe(15);
  });

  it('Greater Flurry extends Berserk by 1 tick per hit, max 8', () => {
    const e = make(['berserk', 'greater-flurry'], { style: 'Melee', startAdrenaline: 100 });
    cast(e, 'berserk', 0, 1 * T);
    e.adrenaline = 100;
    cast(e, 'greater-flurry', 2 * T, 4 * T); // casts tick 4, hits ticks 5..12
    e.update(13 * T);
    expect(e.buff('berserk')!.endTick).toBe(34 + 8);
  });

  it('Dismember → Slaughter → Massacre sequence with 40-tick windows', () => {
    const e = make(['dismember', 'slaughter', 'massacre'], { style: 'Melee', startAdrenaline: 100 });
    expect(e.requirementFailure(ability('slaughter'), 0)).toContain('Dismember');
    cast(e, 'dismember', 0, 1 * T);
    expect(e.sequenceStep('dismember', 1)).toBe(2);
    expect(e.requirementFailure(ability('slaughter'), 2)).toBeNull();
    expect(e.requirementFailure(ability('massacre'), 2)).toContain('Slaughter');
    cast(e, 'slaughter', 2 * T, 4 * T);
    expect(e.sequenceStep('dismember', 4)).toBe(3);
    cast(e, 'massacre', 5 * T, 7 * T);
    expect(e.sequenceStep('dismember', 7)).toBe(1);
    expect(e.buffs.filter((b) => b.on === 'target').map((b) => b.id).sort()).toEqual(['dismember', 'massacre', 'slaughter']);
  });

  it('Hurricane needs a two-handed weapon and shortens its own cooldown per enemy hit', () => {
    const one = make(['hurricane'], { style: 'Melee', startAdrenaline: 100 });
    expect(one.requirementFailure(ability('hurricane'), 0)).toContain('two-handed');
    const e = make(['hurricane'], { style: 'Melee', has2h: true, startAdrenaline: 100 });
    cast(e, 'hurricane', 0, 1 * T);
    expect(e.cooldownLeft('ability:hurricane', 1)).toBe(34 - 5);
  });

  it('Greater Barge as an opener grants Endless Assault, consumed by Assault', () => {
    const e = make(['greater-barge', 'assault'], { style: 'Melee', startAdrenaline: 100 });
    cast(e, 'greater-barge', 0, 1 * T);
    expect(e.hasBuff('endless-assault')).toBe(true);
    cast(e, 'assault', 2 * T, 4 * T);
    expect(e.hasBuff('endless-assault')).toBe(false);
  });

  it('Meteor Strike: +4.5% per tick and 1.5x adrenaline from melee basic abilities', () => {
    const e = make(['meteor-strike', 'punish'], { style: 'Melee', startAdrenaline: 60 });
    cast(e, 'meteor-strike', 0, 1 * T);
    expect(e.adrenaline).toBe(0);
    e.update(3 * T); // ticks 2, 3
    expect(e.adrenaline).toBeCloseTo(9);
    cast(e, 'punish', 3 * T, 4 * T); // tick 4: +4.5 tick, +9×1.5
    expect(e.adrenaline).toBeCloseTo(9 + 4.5 + 13.5);
  });

  it('Bladed Dive during the GCD gives nothing; Dive shares its cooldown', () => {
    const e = make(['attack', 'bladed-dive', 'dive'], { style: 'Melee' });
    cast(e, 'attack', 0, 1 * T);
    const a = e.adrenaline;
    cast(e, 'bladed-dive', 2 * T, 2 * T); // inside the GCD (ticks 2, 3)
    expect(e.adrenaline).toBe(a);
    expect(e.stack('bloodlust')).toBe(1);
    expect(e.cooldownLeft('ability:dive', 2)).toBe(34);
  });
});

describe('ranged: Snipe economy and self-buffs', () => {
  it('Piercing Shot hits shorten Snipe by 4 ticks each (6 with fleeting boots)', () => {
    const e = make(['snipe', 'piercing-shot'], { style: 'Ranged' });
    cast(e, 'snipe', 0, 1 * T);
    expect(e.cooldownLeft('ability:snipe', 1)).toBe(100);
    cast(e, 'piercing-shot', 4 * T, 4 * T);
    expect(e.cooldownLeft('ability:snipe', 4)).toBe(100 - 3 - 8);
    const f = make(['snipe', 'piercing-shot'], { style: 'Ranged', items: new Set(['fleeting-boots']) });
    cast(f, 'snipe', 0, 1 * T);
    cast(f, 'piercing-shot', 4 * T, 4 * T);
    expect(f.cooldownLeft('ability:snipe', 4)).toBe(100 - 3 - 12);
  });

  it('Rapid Fire extends Searing Winds by 1 tick per hit (max 8) and Shadow Imbued pays 5% per hit', () => {
    const e = make(['galeshot', 'imbue-shadows', 'rapid-fire'], { style: 'Ranged', startAdrenaline: 100 });
    cast(e, 'galeshot', 0, 1 * T);
    expect(e.buff('searing-winds')!.endTick).toBe(11);
    cast(e, 'imbue-shadows', 2 * T, 4 * T);
    const before = e.adrenaline;
    cast(e, 'rapid-fire', 5 * T, 7 * T); // 8 hits ticks 8..15
    e.update(16 * T);
    expect(e.buff('searing-winds')!.endTick).toBe(11 + 8);
    expect(e.adrenaline).toBeCloseTo(before - 25 + 8 * 5);
  });

  it("Death's Swiftness lasts 63 ticks with Planted Feet", () => {
    const plain = make(['death-s-swiftness'], { style: 'Ranged', startAdrenaline: 100 });
    cast(plain, 'death-s-swiftness', 0, 2 * T); // the buff starts one tick after the cast
    expect(plain.buff('death-s-swiftness')!.endTick).toBe(52);
    const pf = make(['death-s-swiftness'], { style: 'Ranged', startAdrenaline: 100, items: new Set(['planted-feet']) });
    cast(pf, 'death-s-swiftness', 0, 2 * T);
    expect(pf.buff('death-s-swiftness')!.endTick).toBe(65);
  });

  it('Binding Shot has two charges', () => {
    const e = make(['binding-shot'], { style: 'Ranged' });
    cast(e, 'binding-shot', 0, 1 * T);
    expect(e.cooldownLeft('ability:binding-shot', 1)).toBe(0);
    cast(e, 'binding-shot', 2 * T, 4 * T);
    expect(e.cooldownLeft('ability:binding-shot', 4)).toBe(25 - 3);
  });
});

describe('magic: Runic Charge, Flow, Tsunami', () => {
  it('Runic Charge ignores the GCD; Sonic Wave consumes Anima Charged for a 35% Flow discount', () => {
    const e = make(['attack-magic', 'runic-charge', 'sonic-wave', 'asphyxiate'].map((x) => (x === 'attack-magic' ? 'magic' : x)), { style: 'Magic', startAdrenaline: 50 });
    cast(e, 'magic', 0, 1 * T);
    cast(e, 'runic-charge', 2 * T, 2 * T); // inside the GCD
    expect(e.hasBuff('anima-charged')).toBe(true);
    expect(e.castTick).toBe(1);
    cast(e, 'sonic-wave', 3 * T, 4 * T);
    expect(e.hasBuff('anima-charged')).toBe(false);
    expect(e.hasBuff('flow-charged')).toBe(true);
    const asphyx = ability('asphyxiate');
    expect(e.costOf(asphyx).cost).toBe(0); // 25 − 35 → 0
    const before = e.adrenaline;
    cast(e, 'asphyxiate', 6 * T, 7 * T);
    expect(e.adrenaline).toBe(before);
    expect(e.hasBuff('flow-charged')).toBe(false);
  });

  it('plain Flow gives 10% off the next costing Magic ability only', () => {
    const e = make(['sonic-wave', 'wild-magic', 'wild-magic'], { style: 'Magic', startAdrenaline: 60 });
    cast(e, 'sonic-wave', 0, 1 * T);
    expect(e.costOf(ability('wild-magic')).cost).toBe(15);
    cast(e, 'wild-magic', 2 * T, 4 * T);
    expect(e.costOf(ability('wild-magic')).cost).toBe(25);
  });

  it('Smoke Tendrils under Tsunami: 4 guaranteed crits = +32% adrenaline; a full Asphyxiate grants Channelled Might', () => {
    const e = make(['tsunami', 'smoke-tendrils', 'asphyxiate'], { style: 'Magic', startAdrenaline: 100 });
    cast(e, 'tsunami', 0, 1 * T);
    expect(e.adrenaline).toBe(0);
    cast(e, 'smoke-tendrils', 2 * T, 4 * T); // hits ticks 5..8
    e.update(9 * T);
    expect(e.adrenaline).toBe(32);
    cast(e, 'asphyxiate', 9 * T, 10 * T); // hits 11,13,15,17
    e.update(18 * T);
    expect(e.hasBuff('channelled-might')).toBe(true);
  });

  it('a new ability during a channel cancels the remaining hits (no Channelled Might)', () => {
    const e = make(['asphyxiate', 'magic'], { style: 'Magic', startAdrenaline: 100 });
    cast(e, 'asphyxiate', 0, 1 * T); // channel ticks 1..8, hits 2,4,6,8
    cast(e, 'magic', 3 * T, 4 * T); // GCD over at tick 4 → cast, cancels the channel
    expect(e.events.some((x) => x.kind === 'channel-cancelled' && x.hitsLost === 2)).toBe(true); // hits at ticks 2 and 4 landed, 6 and 8 lost
    e.update(10 * T);
    expect(e.hasBuff('channelled-might')).toBe(false);
  });
});

describe('necromancy: Living Death, Necrosis, souls, conjures', () => {
  it('Living Death resets Touch of Death and Death Skulls, Death Skulls gets a 17-tick cooldown', () => {
    const e = make(['touch-of-death', 'death-skulls', 'living-death', 'touch-of-death', 'death-skulls'], { style: 'Necromancy', startAdrenaline: 100 });
    cast(e, 'touch-of-death', 0, 1 * T);
    e.adrenaline = 100;
    cast(e, 'death-skulls', 2 * T, 4 * T);
    expect(e.cooldownLeft('ability:death-skulls', 4)).toBe(100);
    expect(e.cooldownLeft('ability:touch-of-death', 4)).toBe(24 - 3);
    e.adrenaline = 100;
    cast(e, 'living-death', 5 * T, 7 * T);
    expect(e.cooldownLeft('ability:death-skulls', 7)).toBe(0);
    expect(e.cooldownLeft('ability:touch-of-death', 7)).toBe(0);
    expect(e.hasBuff('living-death')).toBe(true);
    const before = e.adrenaline;
    cast(e, 'touch-of-death', 8 * T, 10 * T);
    expect(e.adrenaline).toBeCloseTo(before + 9 + 6);
    e.adrenaline = 100;
    cast(e, 'death-skulls', 11 * T, 13 * T);
    expect(e.cooldownLeft('ability:death-skulls', 13)).toBe(17);
  });

  it('Necrosis: Touch of Death +4, Finger of Death costs 60 − 10 per stack and consumes up to 6', () => {
    const e = make(['touch-of-death', 'touch-of-death', 'finger-of-death'], { style: 'Necromancy', startAdrenaline: 100 });
    expect(e.costOf(ability('finger-of-death')).cost).toBe(60);
    cast(e, 'touch-of-death', 0, 1 * T);
    expect(e.stack('necrosis')).toBe(4);
    expect(e.costOf(ability('finger-of-death')).cost).toBe(20);
    e.adrenaline = 100;
    cast(e, 'finger-of-death', 2 * T, 4 * T);
    expect(e.adrenaline).toBe(80);
    expect(e.stack('necrosis')).toBe(0);
  });

  it('Volley of Souls needs 2 Residual Souls and consumes all; Soul Sap grants 1 (cap 3, 5 with the lantern)', () => {
    const e = make(['soul-sap', 'soul-sap', 'volley-of-souls'], { style: 'Necromancy' });
    expect(e.requirementFailure(ability('volley-of-souls'), 0)).toContain('2 Residual Souls');
    cast(e, 'soul-sap', 0, 1 * T);
    cast(e, 'soul-sap', 2 * T, 10 * T); // 9-tick cooldown: queued until tick 10
    expect(e.stack('residual-souls')).toBe(2);
    expect(e.requirementFailure(ability('volley-of-souls'), 10)).toBeNull();
    cast(e, 'volley-of-souls', 11 * T, 13 * T);
    expect(e.stack('residual-souls')).toBe(0);
    const l = make(['soul-sap'], { style: 'Necromancy', stackCaps: { 'residual-souls': 5 } });
    for (let i = 0; i < 6; i++) cast(l, 'soul-sap', i * 10 * T, (i * 10 + 1) * T);
    expect(l.stack('residual-souls')).toBe(5);
  });

  it('Command needs its conjure, first 6 ticks after it; the zombie explodes and cannot be re-conjured for 50 ticks', () => {
    const e = make(['conjure-putrid-zombie', 'command-putrid-zombie', 'conjure-putrid-zombie'], { style: 'Necromancy', hasConduit: true });
    expect(e.requirementFailure(ability('command-putrid-zombie'), 0)).toContain('Putrid Zombie');
    cast(e, 'conjure-putrid-zombie', 0, 1 * T);
    expect(e.hasBuff('spirit-putrid-zombie')).toBe(true);
    expect(e.buff('spirit-putrid-zombie')!.endTick).toBe(1 + 70);
    expect(e.requirementFailure(ability('command-putrid-zombie'), 4)).toContain('6 ticks');
    expect(e.requirementFailure(ability('command-putrid-zombie'), 7)).toBeNull();
    cast(e, 'command-putrid-zombie', 6 * T, 7 * T);
    expect(e.spirits.has('putrid-zombie')).toBe(false);
    expect(e.requirementFailure(ability('conjure-putrid-zombie'), 10)).toContain('re-conjured');
    expect(e.requirementFailure(ability('conjure-putrid-zombie'), 51)).toBeNull();
  });

  it('conjure duration uses Spirit Pact and Robes of the First Necromancer from the loadout', () => {
    const e = make(['conjure-skeleton-warrior'], { style: 'Necromancy', hasConduit: true, conjureDurationAdd: 30, conjureDurationMult: 1.25 });
    cast(e, 'conjure-skeleton-warrior', 0, 1 * T);
    expect(e.buff('spirit-skeleton-warrior')!.endTick).toBe(1 + Math.round(100 * 1.25));
    expect(e.requirementFailure(ability('conjure-skeleton-warrior'), 2)).toContain('already active');
  });
});

describe('defence / constitution', () => {
  it('thresholds need 50% (15% with Limitless) and drain 15%; Limitless refuses at 60%+', () => {
    const e = make(['devotion', 'limitless'], { startAdrenaline: 40 });
    expect(e.costOf(ability('devotion'))).toEqual({ need: 50, cost: 15 });
    expect(e.requirementFailure(ability('limitless'), 0)).toBeNull();
    cast(e, 'limitless', 0, 1 * T); // processed on tick 1 like every input
    expect(e.hasBuff('limitless')).toBe(true);
    expect(e.costOf(ability('devotion')).need).toBe(15);
    cast(e, 'devotion', 1 * T, 1 * T);
    expect(e.adrenaline).toBe(25);
    const high = make(['limitless'], { startAdrenaline: 60 });
    expect(high.requirementFailure(ability('limitless'), 0)).toContain('60%');
  });

  it('Resonance and Divert share a cooldown and need a shield or defender', () => {
    const bare = make(['resonance'], {});
    expect(bare.requirementFailure(ability('resonance'), 0)).toContain('shield');
    const e = make(['resonance', 'divert'], { hasShield: true });
    cast(e, 'resonance', 0, 1 * T);
    expect(e.cooldownLeft('ability:divert', 1)).toBe(50);
  });

  it('Shatter with no Storm Shards drains adrenaline but starts no cooldown', () => {
    const e = make(['shatter', 'storm-shards', 'shatter'], { startAdrenaline: 100 });
    cast(e, 'shatter', 0, 1 * T);
    expect(e.adrenaline).toBe(85);
    expect(e.cooldownLeft('ability:shatter', 1)).toBe(0);
    cast(e, 'storm-shards', 2 * T, 4 * T);
    expect(e.stack('storm-shards')).toBe(1);
    cast(e, 'shatter', 5 * T, 7 * T);
    expect(e.stack('storm-shards')).toBe(0);
    expect(e.cooldownLeft('ability:shatter', 7)).toBe(200);
  });

  it('Onslaught pays 25% per hit and ends when adrenaline runs out', () => {
    const e = make(['onslaught'], { startAdrenaline: 100 });
    cast(e, 'onslaught', 0, 1 * T); // hits at ticks 1,3,5,7 → 100 → 0, 5th hit cancels
    e.update(10 * T);
    expect(e.adrenaline).toBe(0);
    expect(e.events.some((x) => x.kind === 'channel-cancelled')).toBe(true);
  });

  it('Anticipation is a normal GCD basic (+9%) and Provoke inside the GCD gives nothing', () => {
    const e = make(['anticipation', 'provoke'], {});
    cast(e, 'anticipation', 0, 1 * T);
    expect(e.adrenaline).toBe(9);
    expect(e.castTick).toBe(1);
    cast(e, 'provoke', 2 * T, 2 * T);
    expect(e.adrenaline).toBe(9);
    expect(e.castTick).toBe(1);
  });
});

describe('weapon special attacks', () => {
  it('Weapon Special Attack uses the loadout spec (cost ×0.9 with vigour, shared cooldown with the EoF copy)', () => {
    const spec: EngineEntity = { key: 'spec:instability', kind: 'spec', id: 'instability', name: 'Instability', icon: '', gcd: true, style: 'Magic', adrenaline: -50, cooldownTicks: 100, buffs: [] };
    const e = make(['weapon-special-attack', 'essence-of-finality'], { style: 'Magic', startAdrenaline: 100, weaponSpec: spec, eofSpec: spec, specCostMult: 0.9 });
    expect(e.costOf(ability('weapon-special-attack')).cost).toBe(45);
    cast(e, 'weapon-special-attack', 0, 1 * T);
    expect(e.adrenaline).toBe(55);
    expect(e.cooldownLeft('ability:essence-of-finality', 1)).toBe(100);
    const none = make(['weapon-special-attack'], {});
    expect(none.requirementFailure(ability('weapon-special-attack'), 0)).toContain('special attack');
  });
});

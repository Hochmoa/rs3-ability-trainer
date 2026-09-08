/**
 * The "stuck" marker: a press of the rotation's expected step that the engine refuses for good – a cooldown of
 * STUCK_COOLDOWN_TICKS or more, or a requirement the rotation cannot meet – ends the session with one 'stuck' event
 * (the rotation as written cannot be played from here: a game update changed the ability, or the trainer has a bug).
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import { Ability } from '../core/models';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EOF_KEY, EngineConfig, EngineEntity, EngineEvent, STUCK_COOLDOWN_TICKS, TICK_MS, TrainerEngine } from './trainer-engine';
import { SPEC_KEY } from '../core/models';

const T = TICK_MS;
const off: EngineConfig = { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: false, loop: false, loadout: defaultResolvedLoadout(), hitChanceDisabled: true };
const on: EngineConfig = { ...off, abilityQueueing: true };

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, id: key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, buffs: [], ...extra };
}
const A = ability('a');
const B = ability('b');
/** 24 s cooldown – a second press inside it is hopeless */
const LONG = ability('long', { cooldownTicks: 40 });
/** 5.4 s cooldown – cast at tick 1 it is ready at tick 10, so pressed at tick 7 there are 3 ticks left */
const SHORT = ability('short', { cooldownTicks: 9 });
/** a familiar scroll: needs the familiar out, which the loadout does not have */
const SCROLL: EngineEntity = { key: 'scroll', id: 'scroll', kind: 'special', name: 'Scroll', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], scroll: { familiar: 'ripper-demon', specialPoints: 10 } };

/** a weapon special attack: the loadout wields no weapon with it and stores nothing in the Essence of Finality */
const SPEC: EngineEntity = { key: 'spec:crystal-rain', id: 'crystal-rain', kind: 'spec', name: 'Crystal Rain', icon: '', gcd: true, style: 'Ranged', abilityType: 'Special', adrenaline: -30, cooldownTicks: 40, buffs: [] };
/** the generic special-attack slot step ("spec" in a PvME rotation) */
const GENERIC = ability('ability:weapon-special-attack', { id: 'weapon-special-attack', name: 'Weapon Special Attack', adrenaline: 0 });

function make(steps: EngineEntity[], cfg: Partial<EngineConfig> = {}, extra: EngineEntity[] = []): TrainerEngine {
  const catalog = new Map([A, B, LONG, SHORT, SCROLL, SPEC, GENERIC, ...extra].map((e) => [e.key, e]));
  const e = new TrainerEngine(steps, catalog, { ...off, ...cfg });
  e.random = () => 0.99;
  e.start(0);
  return e;
}
/** press `key` so that it is processed on `tick` */
function press(e: TrainerEngine, key: string, tick: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}
function kinds(e: TrainerEngine): string[] {
  return e.events.map((x) => x.kind);
}
function stuckEvents(e: TrainerEngine): Extract<EngineEvent, { kind: 'stuck' }>[] {
  return e.events.filter((x): x is Extract<EngineEvent, { kind: 'stuck' }> => x.kind === 'stuck');
}

describe('stuck marker', () => {
  it('STUCK_COOLDOWN_TICKS is 10 s', () => {
    expect(STUCK_COOLDOWN_TICKS).toBe(17);
  });

  for (const [label, cfg] of [
    ['queueing off', off],
    ['queueing on', on],
  ] as const) {
    it('the expected step on a long cooldown ends the session stuck (' + label + ')', () => {
      const e = make([LONG, B, LONG], cfg);
      press(e, 'long', 1); // long is ready again at tick 41
      press(e, 'b', 4);
      expect(e.results.length).toBe(2);
      expect(e.expectedAbility?.key).toBe('long');
      e.events.length = 0;
      press(e, 'long', 7); // 34 ticks left – hopeless
      // queueing on: the press queues, the cast tick finds the cooldown and gives up
      expect(kinds(e)).toEqual(cfg.abilityQueueing ? ['queued', 'on-cooldown', 'stuck', 'finished'] : ['on-cooldown', 'stuck', 'finished']);
      expect(stuckEvents(e)[0]).toEqual({ kind: 'stuck', key: 'long', step: 2, reason: 'cooldown', readyInTicks: 34, text: 'long is still on cooldown for 20.4 s' });
      expect(e.state).toBe('finished');
      expect(e.settling).toBe(false);
      expect(e.queuedKey).toBeNull();
      expect(e.stuck).toEqual({ key: 'long', step: 2, reason: 'cooldown', readyInTicks: 34, text: 'long is still on cooldown for 20.4 s' });
      expect(e.results.length).toBe(2);
    });

    it('a short cooldown is not stuck: the normal on-cooldown event, the session goes on (' + label + ')', () => {
      const e = make([SHORT, B, SHORT, A], cfg);
      press(e, 'short', 1); // ready again at tick 10
      press(e, 'b', 4);
      e.events.length = 0;
      press(e, 'short', 7); // 3 ticks left: refused (queueing off) / queued and cast at tick 10 (queueing on)
      expect(e.events[0]).toMatchObject(cfg.abilityQueueing ? { kind: 'queued', key: 'short' } : { kind: 'on-cooldown', key: 'short', readyInTicks: 3 });
      if (cfg.abilityQueueing) expect(e.events[1]).toMatchObject({ kind: 'on-cooldown', key: 'short', readyInTicks: 3 });
      expect(stuckEvents(e)).toEqual([]);
      expect(e.stuck).toBeNull();
      expect(e.state).toBe('running');
      e.update(10 * T + 1);
      expect(e.state).toBe('running');
      expect(stuckEvents(e)).toEqual([]);
      if (cfg.abilityQueueing) expect(e.results.length).toBe(3);
    });

    it('a wrong key on a long cooldown is a wrong press, not stuck (' + label + ')', () => {
      const e = make([LONG, B, A], cfg);
      press(e, 'long', 1);
      e.events.length = 0;
      press(e, 'long', 4); // expected is b
      expect(stuckEvents(e)).toEqual([]);
      expect(e.stuck).toBeNull();
      expect(e.state).toBe('running');
      if (!cfg.abilityQueueing) expect(kinds(e)).toEqual(['on-cooldown']);
      press(e, 'b', 7);
      expect(e.results.map((r) => r.key)).toContain('b');
    });
  }

  it('a requirement the rotation cannot meet ends the session stuck', () => {
    const e = make([A, SCROLL, B]);
    press(e, 'a', 1);
    e.events.length = 0;
    press(e, 'scroll', 2);
    expect(kinds(e)).toEqual(['requirement', 'stuck', 'finished']);
    expect(stuckEvents(e)[0]).toEqual({ kind: 'stuck', key: 'scroll', step: 1, reason: 'requirement', text: 'Scroll: needs the ripper demon familiar (Loadout page)' });
    expect(e.state).toBe('finished');
    expect(e.stuck?.reason).toBe('requirement');
  });

  it('a rule requirement of a GCD ability (a spirit that is already out) ends the session stuck', () => {
    const DATA = ABILITIES as unknown as Ability[];
    const a = DATA.find((x) => x.id === 'conjure-skeleton-warrior');
    if (!a) throw new Error('conjure-skeleton-warrior missing from abilities.json');
    const conjure: EngineEntity = { key: 'ability:' + a.id, kind: 'ability', id: a.id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type, adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [] };
    const catalog = new Map([[conjure.key, conjure]]);
    const loadout = { ...defaultResolvedLoadout(), style: 'Necromancy' as const, hasConduit: true };
    const e = new TrainerEngine([conjure, conjure], catalog, { ...on, fullAdrenaline: true, loadout });
    e.random = () => 0.5;
    e.start(0);
    press(e, conjure.key, 1);
    expect(e.results.length).toBe(1);
    e.events.length = 0;
    press(e, conjure.key, 4);
    expect(e.state).toBe('finished');
    expect(stuckEvents(e)).toEqual([{ kind: 'stuck', key: conjure.key, step: 1, reason: 'requirement', text: a.name + ': a skeleton warrior is already active' }]);
  });

  it('adrenaline is never stuck – it still comes', () => {
    const ULT = ability('ult', { abilityType: 'Ultimate', adrenaline: -100 });
    const catalog = new Map([A, ULT].map((x) => [x.key, x]));
    const e = new TrainerEngine([A, ULT], catalog, off);
    e.random = () => 0.99;
    e.start(0);
    press(e, 'a', 1);
    e.events.length = 0;
    press(e, 'ult', 4);
    expect(kinds(e)).toEqual(['no-adrenaline']);
    expect(e.state).toBe('running');
    expect(e.stuck).toBeNull();
  });

  it('emits the stuck event once: later presses and ticks change nothing', () => {
    const e = make([LONG, B, LONG, A]);
    press(e, 'long', 1);
    press(e, 'b', 4);
    press(e, 'long', 7);
    expect(stuckEvents(e).length).toBe(1);
    const n = e.events.length;
    press(e, 'long', 10);
    press(e, 'a', 13);
    e.update(60 * T);
    expect(e.events.length).toBe(n);
    expect(stuckEvents(e).length).toBe(1);
    expect(kinds(e).filter((k) => k === 'finished').length).toBe(1);
    expect(e.state).toBe('finished');
    expect(e.stuck?.step).toBe(2);
  });

  it('a spec whose weapon is not in hand nor stored in the EoF: three slot presses end the session stuck', () => {
    const e = make([SPEC, A]);
    press(e, SPEC_KEY, 1);
    press(e, SPEC_KEY, 2);
    expect(e.stuck).toBeNull();
    press(e, SPEC_KEY, 3);
    expect(e.stuck).toMatchObject({ key: SPEC.key, step: 0, reason: 'weapon' });
    expect(e.stuck?.text).toContain('not the special attack of the wielded weapon');
    expect(e.state).toBe('finished');
  });

  it('a generic "Weapon Special Attack" step is completed by the spec the slot fires', () => {
    const e = make([GENERIC, A], { loadout: { ...defaultResolvedLoadout(), weaponSpec: SPEC, startAdrenaline: 100 } });
    press(e, SPEC_KEY, 1);
    e.update(2 * T + 1);
    expect(kinds(e)).not.toContain('wrong-fired');
    expect(e.index).toBe(1);
    expect(e.stuck).toBeNull();
  });

  it('a spec stored in a second Essence of Finality in the backpack fires from the EoF slot', () => {
    const e = make([SPEC, A], { loadout: { ...defaultResolvedLoadout(), style: 'Ranged', eofSpecs: [SPEC], startAdrenaline: 100 } });
    press(e, EOF_KEY, 1);
    e.update(2 * T + 1);
    expect(kinds(e)).not.toContain('wrong-weapon');
    expect(e.stuck).toBeNull();
    expect(e.index).toBe(1);
  });

  it('a stored spec of another style than the wielded weapon cannot fire: three EoF presses end the session stuck', () => {
    const e = make([SPEC, A], { loadout: { ...defaultResolvedLoadout(), style: 'Melee', eofSpecs: [SPEC], startAdrenaline: 100 } });
    press(e, EOF_KEY, 1);
    press(e, EOF_KEY, 2);
    press(e, EOF_KEY, 3);
    expect(e.stuck).toMatchObject({ key: SPEC.key, reason: 'weapon' });
  });

  it('pressing the weapon special slot when the EoF one was due is an ordinary wrong key, not a stuck rotation', () => {
    // the setup can fire the special the step wants (a carried amulet holds it, the style fits): the player just
    // pressed the other special slot, so the session goes on – three of them do not end it
    const other: EngineEntity = { ...SPEC, key: 'spec:other', id: 'other', name: 'Other' };
    const e = make([SPEC, A], { loadout: { ...defaultResolvedLoadout(), style: 'Ranged', weaponSpec: other, eofSpecs: [SPEC], startAdrenaline: 100 } }, [other]);
    press(e, SPEC_KEY, 1);
    press(e, SPEC_KEY, 5);
    press(e, SPEC_KEY, 9);
    expect(e.stuck).toBeNull();
    expect(e.state).toBe('running');
    // and the right slot still completes the step
    press(e, EOF_KEY, 13);
    expect(e.index).toBe(1);
  });

  it('the slot holding another special than the one due: three presses end the session stuck, nothing fires', () => {
    const other: EngineEntity = { ...SPEC, key: 'spec:other', id: 'other', name: 'Other' };
    const e = make([SPEC, A, other], { loadout: { ...defaultResolvedLoadout(), style: 'Ranged', weaponSpec: other, startAdrenaline: 100 } }, [other]);
    press(e, SPEC_KEY, 1);
    press(e, SPEC_KEY, 2);
    expect(e.stuck).toBeNull();
    press(e, SPEC_KEY, 3);
    expect(kinds(e)).not.toContain('wrong-fired');
    expect(e.stuck).toMatchObject({ key: SPEC.key, reason: 'weapon' });
  });

  it('another special fired by its own key three times in a row while a special is due ends the session stuck', () => {
    const other: EngineEntity = { ...SPEC, key: 'spec:other', id: 'other', name: 'Other', cooldownTicks: 0 };
    const e = make([SPEC, A], { loadout: { ...defaultResolvedLoadout(), style: 'Ranged', weaponSpec: other, startAdrenaline: 100 } }, [other]);
    press(e, other.key, 1);
    press(e, other.key, 4);
    expect(e.stuck).toBeNull();
    press(e, other.key, 7);
    expect(kinds(e).filter((k) => k === 'wrong-fired').length).toBe(3);
    expect(e.stuck).toMatchObject({ key: SPEC.key, reason: 'weapon' });
    expect(e.stuck?.text).toContain('did not fire');
  });

  it('start() clears the marker', () => {
    const e = make([LONG, B, LONG]);
    press(e, 'long', 1);
    press(e, 'b', 4);
    press(e, 'long', 7);
    expect(e.stuck).not.toBeNull();
    e.start(100 * T);
    expect(e.stuck).toBeNull();
    expect(e.state).toBe('running');
  });
});

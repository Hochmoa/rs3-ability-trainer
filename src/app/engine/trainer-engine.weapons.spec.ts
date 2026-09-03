import { describe, expect, it } from 'vitest';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TrainerEngine, Wield } from './trainer-engine';

/** weapons the "loadout" knows: id → style / slot; resolving a wield = style + 2h flag of the main weapon */
const WEAPONS: Record<string, { style: 'Melee' | 'Magic'; slot: 'main' | 'off' | '2h'; spec?: string }> = {
  'melee-2h': { style: 'Melee', slot: '2h' },
  'melee-main': { style: 'Melee', slot: 'main' },
  'melee-off': { style: 'Melee', slot: 'off' },
  'magic-main': { style: 'Magic', slot: 'main', spec: 'magic-spec' },
  'magic-off': { style: 'Magic', slot: 'off' },
};
const MAGIC_SPEC: EngineEntity = { key: 'spec:magic-spec', kind: 'spec', id: 'magic-spec', name: 'Magic spec', icon: '', gcd: true, abilityType: 'Special', style: 'Magic', adrenaline: -25, cooldownTicks: 50, buffs: [] };

function resolve(w: Wield): ResolvedLoadout {
  const r = defaultResolvedLoadout();
  r.startAdrenaline = 100;
  const main = w.twoHand ?? w.mainHand;
  const m = main ? WEAPONS[main] : undefined;
  r.style = m?.style ?? null;
  r.has2h = !!w.twoHand;
  r.weaponSpec = m?.spec === 'magic-spec' ? MAGIC_SPEC : null;
  return r;
}

const START: Wield = { mainHand: null, offHand: null, twoHand: 'melee-2h' };
const cfg: EngineConfig = { pingMs: 0, jitterMs: 0, abilityQueueing: false, loop: false, loadout: resolve(START), startWield: START, resolveWield: resolve };

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, kind: 'ability', id: key, name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, buffs: [], style: 'Melee', ...extra };
}
function weapon(id: string): EngineEntity {
  const w = WEAPONS[id];
  return { key: 'weapon:' + id, kind: 'weapon', id, name: id, icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], weapon: { id, slot: w.slot, style: w.style } };
}

const SEVER = ability('sever');
const WRACK = ability('wrack', { style: 'Magic' });
const FREEDOM = ability('freedom', { style: 'Defence' });
const SPEC_SLOT = ability('weapon-special-attack', { style: 'Constitution', abilityType: 'Special', adrenaline: 0 });
const TO_MAGIC = weapon('magic-main');
const TO_MAGIC_OFF = weapon('magic-off');
const TO_MELEE_2H = weapon('melee-2h');
const CATALOG = new Map([SEVER, WRACK, FREEDOM, SPEC_SLOT, MAGIC_SPEC, TO_MAGIC, TO_MAGIC_OFF, TO_MELEE_2H].map((e) => [e.key, e]));

function make(steps: EngineEntity[], extra: Partial<EngineConfig> = {}): TrainerEngine {
  const e = new TrainerEngine(steps, CATALOG, { ...cfg, loadout: resolve(START), ...extra });
  e.start(0);
  return e;
}

describe('weapons as items', () => {
  it('starts with the loadout weapons and reports usability by style', () => {
    const e = make([SEVER]);
    expect(e.wield).toEqual(START);
    expect(e.style).toBe('Melee');
    expect(e.usable('sever', 0)).toBe('ok');
    expect(e.usable('wrack', 0)).toBe('weapon');
    expect(e.usable('freedom', 0)).toBe('ok'); // Defence works with any weapon
    expect(e.usable('ability:weapon-special-attack', 0)).toBe('ok'); // no spec on the 2h: engine reports the weapon slot itself as ok only via catalog key
  });

  it('a weapon-switch step is an off-GCD step that puts the item in hand and changes the style', () => {
    const e = make([SEVER, TO_MAGIC, WRACK]);
    e.press('sever', 100);
    e.update(600);
    e.press('weapon:magic-main', 700); // during the GCD – fine, no GCD for switches
    e.update(1200);
    expect(e.wield).toEqual({ mainHand: 'magic-main', offHand: null, twoHand: null });
    expect(e.style).toBe('Magic');
    expect(e.loadout.weaponSpec?.id).toBe('magic-spec');
    expect(e.results[1]).toMatchObject({ key: 'weapon:magic-main', outcome: 'done', firedAtTick: 2 });
    expect(e.events.some((x) => x.kind === 'weapon' && x.id === 'magic-main' && x.style === 'Magic')).toBe(true);
    expect(e.usable('wrack', 2)).toBe('ok');
    expect(e.usable('sever', 2)).toBe('weapon');
    e.press('wrack', 2000);
    e.update(2400);
    expect(e.results[2]).toMatchObject({ key: 'wrack', outcome: 'perfect' });
    expect(e.state).toBe('finished');
  });

  it('an off-hand switch keeps the main hand, a two-handed switch clears both hands', () => {
    const e = make([TO_MAGIC, TO_MAGIC_OFF, TO_MELEE_2H, SEVER]);
    e.press('weapon:magic-main', 100);
    e.press('weapon:magic-off', 200);
    e.update(600);
    expect(e.wield).toEqual({ mainHand: 'magic-main', offHand: 'magic-off', twoHand: null });
    e.press('weapon:melee-2h', 700);
    e.update(1200);
    expect(e.wield).toEqual({ mainHand: null, offHand: null, twoHand: 'melee-2h' });
    expect(e.style).toBe('Melee');
  });

  it('an ability with the wrong weapon is ignored and counted as wrong', () => {
    const e = make([SEVER, WRACK]);
    e.press('sever', 100);
    e.update(600);
    e.press('wrack', 2000); // still melee
    e.update(2400);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-weapon', key: 'wrack', reason: 'weapon' });
    expect(e.results.length).toBe(1);
    expect(e.castTick).toBe(1);
    e.press('weapon:magic-main', 2500);
    e.press('wrack', 2600);
    e.update(3000);
    expect(e.results.at(-1)).toMatchObject({ key: 'wrack', outcome: 'late', wrong: 2 }); // wrong-weapon + switch out of order
  });

  it('a queued ability fails when the weapon changes before it casts (queueing on)', () => {
    const e = make([SEVER, SEVER, TO_MAGIC], { abilityQueueing: true, loop: true });
    e.press('sever', 100);
    e.update(600);
    e.press('sever', 700); // queued for tick 4
    e.press('weapon:magic-main', 1300); // switch at tick 3 – out of order, still switches
    e.update(2400);
    expect(e.style).toBe('Magic');
    expect(e.events.some((x) => x.kind === 'wrong-weapon' && x.key === 'sever')).toBe(true);
    expect(e.results.filter((r) => r.key === 'sever').length).toBe(1);
  });

  it('the generic special-attack slot fires the wielded weapon\'s spec and a spec step needs that weapon', () => {
    const e = make([TO_MAGIC, MAGIC_SPEC, SEVER], { abilityQueueing: true });
    expect(e.usable('spec:magic-spec', 0)).toBe('weapon'); // 2h melee has no such spec
    e.press('weapon:magic-main', 100);
    e.press('ability:weapon-special-attack', 200);
    e.update(600);
    expect(e.results.map((r) => [r.key, r.outcome])).toEqual([['weapon:magic-main', 'done'], ['spec:magic-spec', 'perfect']]);
    expect(e.adrenaline).toBe(75);
  });
});

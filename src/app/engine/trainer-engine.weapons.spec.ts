import { describe, expect, it } from 'vitest';
import { DEFAULT_LOADOUT } from '../core/models';
import { EngineConfig, EngineEntity, TrainerEngine } from './trainer-engine';

const cfg: EngineConfig = {
  pingMs: 0,
  jitterMs: 0,
  abilityQueueing: false,
  loop: false,
  loadout: { ...DEFAULT_LOADOUT, startAdrenaline: 100 },
  weaponSetup: { start: 'Melee', types: { Melee: 'two-handed', Ranged: 'two-handed', Magic: 'dual-wield', Necromancy: 'two-handed' } },
};

function ability(key: string, extra: Partial<EngineEntity> = {}): EngineEntity {
  return { key, kind: 'ability', name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, buffs: [], style: 'Melee', equipment: 'Any', ...extra };
}
function weapon(style: 'Melee' | 'Ranged' | 'Magic' | 'Necromancy'): EngineEntity {
  return { key: 'weapon:' + style.toLowerCase(), kind: 'weapon', name: style + ' weapon', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], weapon: { style } };
}

const SEVER = ability('sever');
const WRACK = ability('wrack', { style: 'Magic' });
const FREEDOM = ability('freedom', { style: 'Defence', gcd: true });
const BASH = ability('bash', { style: 'Defence', equipment: 'Shield' });
const FLURRY = ability('flurry', { style: 'Melee', equipment: 'Dual wield' });
const TO_MAGIC = weapon('Magic');
const TO_MELEE = weapon('Melee');
const CATALOG = new Map([SEVER, WRACK, FREEDOM, BASH, FLURRY, TO_MAGIC, TO_MELEE].map((e) => [e.key, e]));

function make(steps: EngineEntity[], extra: Partial<EngineConfig> = {}): TrainerEngine {
  const e = new TrainerEngine(steps, CATALOG, { ...cfg, ...extra });
  e.start(0);
  return e;
}

describe('weapons', () => {
  it('starts with the configured weapon and reports usability reasons', () => {
    const e = make([SEVER]);
    expect(e.weapon).toBe('Melee');
    expect(e.weaponType).toBe('two-handed');
    expect(e.usable('sever', 0)).toBe('ok');
    expect(e.usable('wrack', 0)).toBe('weapon');
    expect(e.usable('freedom', 0)).toBe('ok'); // Defence works with any weapon
    expect(e.usable('bash', 0)).toBe('equipment'); // needs a shield
    expect(e.usable('flurry', 0)).toBe('equipment'); // needs dual wield
  });

  it('a weapon-switch step is an off-GCD step that changes the wielded style', () => {
    const e = make([SEVER, TO_MAGIC, WRACK]);
    e.press('sever', 100);
    e.update(600);
    e.press('weapon:magic', 700); // during the GCD – fine, no GCD for switches
    e.update(1200);
    expect(e.weapon).toBe('Magic');
    expect(e.weaponType).toBe('dual-wield');
    expect(e.results[1]).toMatchObject({ key: 'weapon:magic', outcome: 'done', firedAtTick: 2 });
    expect(e.events.some((x) => x.kind === 'weapon' && x.style === 'Magic')).toBe(true);
    expect(e.usable('wrack', 2)).toBe('ok');
    expect(e.usable('sever', 2)).toBe('weapon');
    e.press('wrack', 2000);
    e.update(2400);
    expect(e.results[2]).toMatchObject({ key: 'wrack', outcome: 'perfect' });
    expect(e.state).toBe('finished');
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
    e.press('weapon:magic', 2500);
    e.press('wrack', 2600);
    e.update(3000);
    expect(e.results.at(-1)).toMatchObject({ key: 'wrack', outcome: 'late', wrong: 2 }); // wrong-weapon + switch out of order
  });

  it('a queued ability fails when the weapon changes before it casts (queueing on)', () => {
    const e = make([SEVER, SEVER, TO_MAGIC], { abilityQueueing: true, loop: true });
    e.press('sever', 100);
    e.update(600);
    e.press('sever', 700); // queued for tick 4
    e.press('weapon:magic', 1300); // switch at tick 3 – out of order, still switches
    e.update(2400);
    expect(e.weapon).toBe('Magic');
    expect(e.events.some((x) => x.kind === 'wrong-weapon' && x.key === 'sever')).toBe(true);
    expect(e.results.filter((r) => r.key === 'sever').length).toBe(1);
  });

  it('equipment requirements follow the weapon type of the wielded style', () => {
    const e = make([FLURRY], { weaponSetup: { start: 'Melee', types: { Melee: 'dual-wield', Ranged: 'two-handed', Magic: 'two-handed', Necromancy: 'two-handed' } } });
    expect(e.usable('flurry', 0)).toBe('ok');
    expect(e.usable('bash', 0)).toBe('equipment');
  });
});

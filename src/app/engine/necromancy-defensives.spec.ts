/**
 * Bone shields and nexus (docs/research/necromancy.md § bone shields) and attacks absorbed by defensives:
 * Lesser / Greater Bone Shield stand in for a shield, scale Barricade / Debilitate, Zemouregal's nexus adds
 * 15 levels; Barricade / Resonance / Divert / Disruption Shield keep an attack out of the prayer score.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import GEAR from '../../../public/data/gear.json';
import SPELLS from '../../../public/data/spells.json';
import { Ability, DEFAULT_ENEMY, EnemyConfig, GearItem, Spell, newLoadout } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { resolveLoadout } from './loadout-resolver';
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
  const s = SPELL_BY_ID.get(id)!;
  return { key: 'spell:' + id, kind: 'spell', id, name: s.name, icon: s.icon, gcd: s.gcd, adrenaline: 0, cooldownTicks: s.cooldownTicks, buffs: [] };
}

const ENEMY: EnemyConfig = { ...DEFAULT_ENEMY, enabled: true, styles: ['Melee'], pattern: 'cycle', intervalTicks: 5, warningTicks: 3, firstAttackTicks: 4 };
const DEFENSIVES = ['lesser-bone-shield', 'greater-bone-shield', 'resonance', 'divert', 'preparation', 'reflect', 'debilitate', 'immortality', 'rejuvenate', 'barricade', 'bash', 'revenge'];

function make(ids: string[], loadout: Partial<ResolvedLoadout> = {}, cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((e) => [e.key, e]));
  for (const id of DEFENSIVES) catalog.set('ability:' + id, ability(id));
  catalog.set('spell:disruption-shield', spell('disruption-shield'));
  const l = { ...defaultResolvedLoadout(), style: 'Necromancy' as const, hasConduit: true, spellbook: 'lunar' as const, ...loadout, items: new Set(loadout.items ?? []) };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: l });
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

describe('necromancy: bone shields', () => {
  it('without a shield the defensives are locked; Greater Bone Shield (tier 49 at level 99) unlocks the non-offensive ones, not Bash / Revenge', () => {
    const e = make(['greater-bone-shield']);
    for (const id of ['resonance', 'barricade', 'reflect']) expect(e.requirementFailure(ability(id), 0)).toContain('shield');
    expect(e.shieldTier).toBe(0);
    press(e, 'ability:greater-bone-shield', 1);
    expect(e.hasBuff('greater-bone-shield')).toBe(true);
    expect(e.buff('greater-bone-shield')?.endTick).toBeNull();
    expect(e.castTick).toBe(1); // an incantation starts the GCD
    expect(e.boneShieldTier).toBe(49);
    expect(e.shieldTier).toBe(49);
    for (const id of ['resonance', 'divert', 'preparation', 'reflect', 'debilitate', 'immortality', 'rejuvenate', 'barricade']) expect(e.requirementFailure(ability(id), 2)).toBeNull();
    expect(e.requirementFailure(ability('bash'), 2)).toContain('bone shield does not count');
    expect(e.requirementFailure(ability('revenge'), 2)).toContain('bone shield does not count');
  });

  it('Barricade and Debilitate scale with the bone shield tier; Zemouregal\'s nexus adds 15 levels', () => {
    const e = make(['greater-bone-shield', 'barricade', 'debilitate']);
    press(e, 'ability:greater-bone-shield', 1);
    press(e, 'ability:barricade', 4);
    expect(e.buff('barricade')?.endTick).toBe(4 + 12); // 8 + ⌊49/10⌋
    e.adrenaline = 100;
    press(e, 'ability:debilitate', 7);
    expect(e.buff('debilitate')?.endTick).toBe(7 + 18); // 13 + 1 + ⌊49/10⌋
    const nexus = make(['lesser-bone-shield', 'barricade'], { hasNexus: true, boneShieldLevelBonus: 15 });
    press(nexus, 'ability:lesser-bone-shield', 1);
    expect(nexus.boneShieldTier).toBe(24 + 15); // ⌊25% × 99⌋ + Fortified Bones
    press(nexus, 'ability:barricade', 4);
    expect(nexus.buff('barricade')?.endTick).toBe(4 + 11);
    const real = make(['greater-bone-shield', 'barricade'], { hasShield: true, shieldTier: 90 });
    press(real, 'ability:greater-bone-shield', 1);
    expect(real.shieldTier).toBe(90); // a worn shield wins
  });

  it('the two bone shields replace each other and pressing the active one again toggles it off', () => {
    const e = make(['greater-bone-shield', 'lesser-bone-shield', 'lesser-bone-shield']);
    press(e, 'ability:greater-bone-shield', 1);
    press(e, 'ability:lesser-bone-shield', 4);
    expect(e.hasBuff('greater-bone-shield')).toBe(false);
    expect(e.hasBuff('lesser-bone-shield')).toBe(true);
    expect(e.boneShieldTier).toBe(24);
    press(e, 'ability:lesser-bone-shield', 7);
    expect(e.hasBuff('lesser-bone-shield')).toBe(false);
    expect(e.boneShieldTier).toBe(0);
    expect(e.requirementFailure(ability('resonance'), 8)).toContain('shield');
  });

  it('the loadout resolver finds the nexus in the ammunition slot and the Fortified Bones bonus of Zemouregal\'s nexus', () => {
    const gearById = new Map((GEAR as unknown as GearItem[]).map((g) => [g.id, g]));
    const data = { weaponById: new Map(), specById: new Map(), perkById: new Map(), setEffectById: new Map(), gearById, specEntity: () => ({}) as EngineEntity };
    const plain = resolveLoadout(newLoadout(), data);
    expect(plain).toMatchObject({ hasNexus: false, boneShieldLevelBonus: 0, spellbook: 'standard' });
    const l = newLoadout();
    l.spellbook = 'lunar';
    l.equipment.ammo = { kind: 'gear', id: 'deathwarden-nexus' };
    expect(resolveLoadout(l, data)).toMatchObject({ hasNexus: true, boneShieldLevelBonus: 0, spellbook: 'lunar' });
    l.equipment.ammo = { kind: 'gear', id: 'zemouregal-s-nexus' };
    expect(resolveLoadout(l, data)).toMatchObject({ hasNexus: true, boneShieldLevelBonus: 15 });
  });
});

describe('attacks absorbed by defensives', () => {
  it('Barricade keeps blocking for its whole duration – no hit, no prayer needed, the buff stays', () => {
    const e = make(['greater-bone-shield', 'barricade'], {}, { enemy: { ...ENEMY, firstAttackTicks: 6 } });
    press(e, 'ability:greater-bone-shield', 1);
    press(e, 'ability:barricade', 4); // 12 ticks with the tier-49 bone shield: 4..15
    e.update(11 * T + 1); // attacks at 6 and 11 fall inside
    expect(attacks(e).map((a) => a.absorbed)).toEqual(['barricade', 'barricade']);
    expect(e.hasBuff('barricade')).toBe(true);
    expect(e.prayerStats).toMatchObject({ attacks: 2, prayed: 0, hits: 0, absorbed: 2 });
    e.update(16 * T + 1); // Barricade ended: the attack at 16 lands
    expect(e.hasBuff('barricade')).toBe(false);
    expect(e.prayerStats).toMatchObject({ attacks: 3, hits: 1, absorbed: 2 });
  });

  it('Resonance blocks one hit and is used up; Disruption Shield takes priority over it', () => {
    const e = make(['greater-bone-shield', 'resonance'], {}, { enemy: ENEMY });
    press(e, 'ability:greater-bone-shield', 1);
    press(e, 'ability:resonance', 3);
    press(e, 'spell:disruption-shield', 3);
    e.update(4 * T + 1);
    expect(attacks(e)[0]).toMatchObject({ absorbed: 'disruption-shield' });
    expect(e.hasBuff('resonance')).toBe(true);
    e.update(9 * T + 1);
    expect(attacks(e)[1]).toMatchObject({ absorbed: 'resonance' });
    expect(e.hasBuff('resonance')).toBe(false);
    e.update(14 * T + 1);
    expect(attacks(e)[2].absorbed).toBeUndefined();
    expect(e.prayerStats).toMatchObject({ attacks: 3, hits: 1, absorbed: 2 });
  });
});

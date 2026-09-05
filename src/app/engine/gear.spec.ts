/**
 * Gear: every armour set threshold and item passive of public/data/set-effects.json, resolved from the real data files
 * (weapons.json, gear.json, set-effects.json, perks.json, specs.json) through resolveLoadout, plus engine runs for the
 * effects that change hits, adrenaline or cooldowns. The last block is a lint: a new effect kind in the data must be
 * applied by the resolver or listed in NOT_SIMULATED_EFFECT_KINDS.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import GEAR from '../../../public/data/gear.json';
import PERKS from '../../../public/data/perks.json';
import SETS from '../../../public/data/set-effects.json';
import SPECS from '../../../public/data/specs.json';
import WEAPONS from '../../../public/data/weapons.json';
import { Ability, EquipSlot, GearItem, ItemRef, Loadout, Perk, SetEffect, Weapon, WeaponSpec, emptyPrebuild, newLoadout, weaponSlot } from '../core/models';
import { ResolvedLoadout } from './loadout-resolved';
import { LoadoutData, NOT_SIMULATED_EFFECT_KINDS, SHADOWS_GRACE_ABILITIES, resolveLoadout } from './loadout-resolver';
import { EngineConfig, EngineEntity, TICK_MS, TrainerEngine } from './trainer-engine';

const ABILITY_DATA = ABILITIES as unknown as Ability[];
const BY_ID = new Map(ABILITY_DATA.map((a) => [a.id, a]));
const GEAR_DATA = GEAR as unknown as GearItem[];
const WEAPON_DATA = WEAPONS as unknown as Weapon[];
const SET_DATA = SETS as unknown as SetEffect[];
const T = TICK_MS;

const DATA: LoadoutData = {
  weaponById: new Map(WEAPON_DATA.map((w) => [w.id, w])),
  specById: new Map((SPECS as unknown as WeaponSpec[]).map((s) => [s.id, s])),
  perkById: new Map((PERKS as unknown as Perk[]).map((p) => [p.id, p])),
  setEffectById: new Map(SET_DATA.map((s) => [s.id, s])),
  gearById: new Map(GEAR_DATA.map((g) => [g.id, g])),
  specEntity: (s) => ({
    key: 'spec:' + s.id, kind: 'spec', id: s.id, name: s.name, icon: '', gcd: true, style: s.style, abilityType: 'Special',
    adrenaline: -(s.adrenaline ?? 0), cooldownTicks: s.cooldownTicks, buffs: [], damageMin: s.damageMin ?? undefined, damageMax: s.damageMax ?? undefined,
  }),
};

interface Wear {
  /** weapons.json ids, put into their slots */
  weapons?: string[];
  /** armour set (set-effects.json id) with this many pieces from gear.json, one per slot */
  set?: string;
  pieces?: number;
  /** only these pieces of the set qualify */
  pick?: (g: GearItem) => boolean;
  /** gear.json ids */
  gear?: string[];
  /** passives without a gear.json item (totems, talents, unlocks) – the loadout's legacy item list */
  items?: string[];
  /** Archaeology relics (RELICS ids) */
  relics?: string[];
  /** perks on the first weapon's gizmo */
  weaponPerks?: { perk: string; rank: number }[];
}

function wear(w: Wear): Loadout {
  const l = newLoadout('gear');
  // level 99, no weapon poison: the loadout's default elder overload / weapon poison+++ are tested in consumables.spec.ts
  l.overload = 'none';
  l.weaponPoison = 0;
  const eq = l.equipment as Record<string, ItemRef>;
  for (const id of w.weapons ?? []) {
    const wp = DATA.weaponById.get(id);
    if (!wp) throw new Error('unknown weapon ' + id);
    eq[weaponSlot(wp)] = { kind: 'weapon', id };
  }
  if (w.set) {
    const seen = new Set<string>();
    for (const g of GEAR_DATA) {
      if (g.set !== w.set || seen.has(g.slot) || (w.pick && !w.pick(g))) continue;
      if (seen.size >= (w.pieces ?? 99)) break;
      seen.add(g.slot);
      eq[g.slot] = { kind: 'gear', id: g.id };
    }
    if (w.pieces !== undefined && seen.size !== w.pieces) throw new Error('only ' + seen.size + ' pieces of ' + w.set);
  }
  for (const id of w.gear ?? []) {
    const g = DATA.gearById!.get(id);
    if (!g) throw new Error('unknown gear ' + id);
    eq[g.slot as EquipSlot] = { kind: 'gear', id };
  }
  l.items = [...(w.items ?? [])];
  l.relics = [...(w.relics ?? [])];
  if (w.weaponPerks?.length) {
    const first = w.weapons?.[0];
    const wp = first ? DATA.weaponById.get(first) : undefined;
    if (!wp) throw new Error('weaponPerks need a weapon');
    eq[weaponSlot(wp)] = { kind: 'weapon', id: wp.id, gizmos: [{ ancient: false, perks: [...w.weaponPerks] }] };
  }
  return l;
}

const resolve = (w: Wear): ResolvedLoadout => resolveLoadout(wear(w), DATA);

// ---------------------------------------------------------------- engine helpers (like melee.spec.ts)

function ability(id: string): EngineEntity {
  const a = BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0,
    buffs: a.buffs.filter((b) => b >= 0).map((b) => ({ id: 'buff:' + b, name: String(b), kind: 'Buff' as const, on: 'self' as const, icon: null, durationTicks: a.durationTicks ?? 3 })),
    damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

/** engine on a resolved loadout with ability damage 1000; `rnd.v` is the value every random roll returns */
function make(ids: string[], loadout: ResolvedLoadout, cfg: Partial<EngineConfig> = {}): { e: TrainerEngine; rnd: { v: number } } {
  const steps = ids.map(ability);
  const catalog = new Map(steps.map((x) => [x.key, x]));
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, autoAttacks: false, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, ...cfg, loadout: { ...loadout, abilityDamage: 1000 } });
  const rnd = { v: 0.5 };
  e.random = () => rnd.v;
  e.start(0);
  return { e, rnd };
}

function cast(e: TrainerEngine, id: string, tick: number): void {
  e.press('ability:' + id, (tick - 1) * T + 1);
  e.update(tick * T + 1);
}

function hits(e: TrainerEngine, key: string): { amount: number; tick: number; crit: boolean; dot: boolean }[] {
  return e.events.filter((x): x is Extract<typeof x, { kind: 'hit' }> => x.kind === 'hit' && x.key === key).map((h) => ({ amount: h.amount, tick: h.tick, crit: h.crit, dot: h.dot }));
}

const A = (e: TrainerEngine, id: string) => hits(e, 'ability:' + id);

// ---------------------------------------------------------------- armour sets

describe('gear: armour sets resolve from set-effects.json', () => {
  it('Vestments of havoc: 2 = Havoc regeneration after a melee ultimate, 3 = Berserk +10 ticks, 4 = 120% adrenaline with a melee weapon', () => {
    const two = resolve({ weapons: ['masterwork-2h-sword'], set: 'vestments-of-havoc', pieces: 2 });
    expect(two.adrenalineAfterUltimate).toEqual({ style: 'Melee', amount: 15, overTicks: 30, instantIfActive: 20 });
    expect(two.buffDurationAdd['berserk']).toBeUndefined();
    expect(two.maxAdrenaline).toBe(100);
    const three = resolve({ weapons: ['masterwork-2h-sword'], set: 'vestments-of-havoc', pieces: 3 });
    expect(three.buffDurationAdd['berserk']).toBe(10);
    expect(three.maxAdrenaline).toBe(100);
    const four = resolve({ weapons: ['masterwork-2h-sword'], set: 'vestments-of-havoc', pieces: 4 });
    expect(four.maxAdrenaline).toBe(120);
    expect([...four.items]).toEqual(expect.arrayContaining(['vestments-of-havoc:2', 'vestments-of-havoc:3', 'vestments-of-havoc:4']));
    // the +20% needs a melee weapon in hand
    expect(resolve({ weapons: ['masterwork-staff'], set: 'vestments-of-havoc', pieces: 4 }).maxAdrenaline).toBe(100);
  });

  it('Robes of the First Necromancer: +7% spirit damage per piece from 2, +5% spirit duration per piece from 4', () => {
    const r2 = resolve({ set: 'robes-of-the-first-necromancer', pieces: 2 });
    expect(r2.conjureDamageMult).toBeCloseTo(1.14, 9);
    expect(r2.conjureDurationMult).toBe(1);
    const r3 = resolve({ set: 'robes-of-the-first-necromancer', pieces: 3 });
    expect(r3.conjureDamageMult).toBeCloseTo(1.21, 9);
    expect(r3.conjureDurationMult).toBe(1);
    const r4 = resolve({ set: 'robes-of-the-first-necromancer', pieces: 4 });
    expect(r4.conjureDamageMult).toBeCloseTo(1.28, 9);
    expect(r4.conjureDurationMult).toBeCloseTo(1.2, 9);
    const r5 = resolve({ set: 'robes-of-the-first-necromancer', pieces: 5 });
    expect(r5.conjureDamageMult).toBeCloseTo(1.35, 9);
    expect(r5.conjureDurationMult).toBeCloseTo(1.25, 9);
    expect(resolve({ set: 'robes-of-the-first-necromancer', pieces: 1 }).conjureDamageMult).toBe(1);
  });

  it('Dracolich: 0.2 adrenaline per piece per Rapid Fire tick, infusion +20% crit for 5 ticks (+3 at 4, +3 more at 5) with a bow', () => {
    const one = resolve({ weapons: ['bow-of-the-last-guardian'], set: 'dracolich', pieces: 1 });
    expect(one.channelAdrenalinePerTick['rapid-fire']).toBeCloseTo(0.2, 9);
    expect(one.fullChannelBuffs['rapid-fire']).toBeUndefined();
    const three = resolve({ weapons: ['bow-of-the-last-guardian'], set: 'dracolich', pieces: 3 });
    expect(three.channelAdrenalinePerTick['rapid-fire']).toBeCloseTo(0.6, 9);
    expect(three.fullChannelBuffs['rapid-fire']).toEqual([{ buff: 'dracolich-infusion', durationTicks: 5, requiresWeapon: 'bow' }]);
    expect(three.buffCritAdd['dracolich-infusion']).toEqual({ add: 0.2, style: 'Ranged' });
    expect(three.buffDurationAdd['dracolich-infusion']).toBeUndefined();
    expect(resolve({ weapons: ['bow-of-the-last-guardian'], set: 'dracolich', pieces: 4 }).buffDurationAdd['dracolich-infusion']).toBe(3);
    const five = resolve({ weapons: ['bow-of-the-last-guardian'], set: 'dracolich', pieces: 5 });
    expect(five.buffDurationAdd['dracolich-infusion']).toBe(6);
    expect(five.channelAdrenalinePerTick['rapid-fire']).toBeCloseTo(1, 9);
    expect(five.weaponType).toBe('bow');
    expect(resolve({ weapons: ['eldritch-crossbow'], set: 'dracolich', pieces: 5 }).weaponType).toBe('crossbow');
  });

  it('Elite Dracolich: 0.5 per piece, infusion +40%', () => {
    const r = resolve({ weapons: ['bow-of-the-last-guardian'], set: 'elite-dracolich', pieces: 5 });
    expect(r.channelAdrenalinePerTick['rapid-fire']).toBeCloseTo(2.5, 9);
    expect(r.buffCritAdd['dracolich-infusion']).toEqual({ add: 0.4, style: 'Ranged' });
    expect(r.buffDurationAdd['dracolich-infusion']).toBe(6);
  });

  it("Tumeken's resplendence: 3 = +1.5% crit per piece in Sunshine, 4 = 8-hit Asphyxiate at 0.6, 5 = Channelled Might 15 ticks / +35%", () => {
    const three = resolve({ weapons: ['masterwork-staff'], set: 'tumeken-s-resplendence', pieces: 3 });
    expect(three.buffCritAdd['sunshine']).toEqual({ add: 0.045, style: 'Magic' });
    expect(three.buffCritAdd['greater-sunshine']).toEqual({ add: 0.045, style: 'Magic' });
    expect(three.channelOverrides['asphyxiate']).toBeUndefined();
    const four = resolve({ weapons: ['masterwork-staff'], set: 'tumeken-s-resplendence', pieces: 4 });
    expect(four.buffCritAdd['sunshine']!.add).toBeCloseTo(0.06, 9);
    expect(four.channelOverrides['asphyxiate']).toMatchObject({ ticks: 8, hits: [1, 2, 3, 4, 5, 6, 7, 8], damageMult: 0.6, onComplete: [{ kind: 'buff', id: 'channelled-might' }] });
    expect(four.buffDurationAdd['channelled-might']).toBeUndefined();
    const five = resolve({ weapons: ['masterwork-staff'], set: 'tumeken-s-resplendence', pieces: 5 });
    expect(five.buffCritAdd['sunshine']!.add).toBeCloseTo(0.075, 9);
    expect(five.buffDurationAdd['channelled-might']).toBe(9); // 6 → 15 ticks
    expect(five.buffCritDamageAdd['channelled-might']).toBe(0.35);
  });

  it('Tectonic +1% / Elite tectonic +2% critical strike chance per piece', () => {
    expect(resolve({ set: 'tectonic', pieces: 1 }).critChanceAdd).toBeCloseTo(0.01, 9);
    expect(resolve({ set: 'tectonic', pieces: 3 }).critChanceAdd).toBeCloseTo(0.03, 9);
    expect(resolve({ set: 'elite-tectonic', pieces: 2 }).critChanceAdd).toBeCloseTo(0.04, 9);
    expect(resolve({ set: 'elite-tectonic', pieces: 3 }).critChanceAdd).toBeCloseTo(0.06, 9);
  });

  it('Void knight: 4 pieces +5% damage, +7% with only superior pieces', () => {
    const superior = ['superior-void-knight-melee-helm', 'superior-void-knight-top', 'superior-void-knight-robe', 'superior-void-knight-gloves'];
    expect(resolve({ gear: superior }).damageMult).toBeCloseTo(1.07, 9);
    expect(resolve({ gear: ['void-knight-melee-helm', 'superior-void-knight-top', 'superior-void-knight-robe', 'superior-void-knight-gloves'] }).damageMult).toBeCloseTo(1.05, 9);
    expect(resolve({ gear: superior.slice(0, 3) }).damageMult).toBe(1);
  });

  it('Song of Destruction: Roar of Awakening + Ode to Deceit count as 1 and 2 pieces; DoTs × 1.3 with both', () => {
    const one = resolve({ weapons: ['roar-of-awakening'] });
    expect(one.items.has('song-of-destruction:1')).toBe(true);
    expect(one.items.has('song-of-destruction:2')).toBe(false);
    expect(one.dotDamageMult).toEqual({});
    const two = resolve({ weapons: ['roar-of-awakening', 'ode-to-deceit'] });
    expect(two.style).toBe('Magic');
    expect(two.items.has('song-of-destruction:2')).toBe(true);
    expect(two.dotDamageMult).toEqual({ combust: 1.3, 'corruption-blast': 1.3 });
    expect(two.ignoredEffects).toEqual([]);
  });

  it('sets the simulation cannot model report their ignored thresholds', () => {
    const ignored = (w: Wear) => resolve(w).ignoredEffects.map((x) => x.id + '=' + x.kind);
    expect(ignored({ weapons: ['eldritch-crossbow'], set: 'elite-sirenic', pieces: 3 })).toEqual(['elite-sirenic:2=bolt-proc', 'elite-sirenic:3=bolt-proc']);
    expect(ignored({ set: 'sirenic', pieces: 3 })).toEqual(['sirenic:2=bolt-proc']);
    expect(ignored({ set: 'trimmed-masterwork', pieces: 5 })).toEqual(['trimmed-masterwork:3=damage-delay']);
    expect(ignored({ set: 'achto', pieces: 5, pick: (g) => g.id.startsWith('achto-primeval') })).toEqual(['achto:1=strength-bonus', 'achto:3=defensive-cooldown-reset-on-hit']);
    expect(ignored({ set: 'cryptbloom', pieces: 5 })).toEqual(['cryptbloom:2=damage-taken', 'cryptbloom:4=proc', 'cryptbloom:5=proc']);
    expect(ignored({ set: 'deathdealer-t90', pieces: 5, pick: (g) => g.id.endsWith('tier-90') })).toEqual(['deathdealer-t90:1=death-mark']);
    expect(ignored({ set: 'warpriest-armadyl-bandos', pieces: 3, pick: (g) => g.id.includes('armadyl') })).toEqual(['warpriest-armadyl-bandos:3=cooldown-chance']);
    expect(ignored({ set: 'warpriest-tuska', pieces: 3 })).toEqual(['warpriest-tuska:3=crit-proc']);
  });
});

// ---------------------------------------------------------------- items

describe('gear: item passives resolve from set-effects.json', () => {
  it('Igneous capes: Overpower 2 × 280–340 (9 March 2026) at tick 3, Omnipower 4 × 120–150, Deadshot 8 × 55–75, Death Skulls 6 bounces; Kal-Zuk all four', () => {
    const ket = resolve({ gear: ['igneous-kal-ket'] });
    expect(ket.hitsOverrides['overpower']).toEqual([3, 3]);
    expect(ket.damageOverrides['overpower']).toEqual({ min: 280, max: 340 });
    expect(ket.hitsOverrides['omnipower']).toBeUndefined();
    const mej = resolve({ gear: ['igneous-kal-mej'] });
    expect(mej.hitsOverrides['omnipower']).toHaveLength(4);
    expect(mej.damageOverrides['omnipower']).toEqual({ min: 120, max: 150 });
    const xil = resolve({ gear: ['igneous-kal-xil'] });
    expect(xil.hitsOverrides['deadshot']).toHaveLength(8);
    expect(xil.damageOverrides['deadshot']).toEqual({ min: 55, max: 75 });
    const mor = resolve({ gear: ['igneous-kal-mor'] });
    expect(mor.hitsOverrides['death-skulls']).toEqual([0, 4, 8, 12]);
    const zuk = resolve({ gear: ['igneous-kal-zuk'] });
    expect(zuk.hitsOverrides['overpower']).toEqual([3, 3]);
    expect(zuk.hitsOverrides['omnipower']).toHaveLength(4);
    expect(zuk.hitsOverrides['deadshot']).toHaveLength(8);
    expect(zuk.hitsOverrides['death-skulls']).toEqual([0, 4, 8, 12]);
    expect([...zuk.items]).toEqual(expect.arrayContaining(['igneous-kal-zuk', 'igneous-kal-ket', 'igneous-kal-mej', 'igneous-kal-xil', 'igneous-kal-mor']));
  });

  it('rule-driven items are exposed by id: codices, fleeting boots, nightmare gauntlets, blast diffusion boots, Kerapac wraps, gloves of passage, occultist / Zorgoth rings', () => {
    const missing = (x: ResolvedLoadout, ids: string[]) => ids.filter((id) => !x.items.has(id));
    const r = resolve({ gear: ['fleeting-boots', 'kerapac-s-wrist-wraps', 'occultist-s-ring'], items: ['greater-sunshine-codex', 'greater-death-s-swiftness-codex'] });
    expect(missing(r, ['fleeting-boots', 'kerapac-s-wrist-wraps', 'occultist-s-ring', 'greater-sunshine-codex', 'greater-death-s-swiftness-codex'])).toEqual([]);
    expect(r.ignoredEffects).toEqual([]);
    const r2 = resolve({ gear: ['blast-diffusion-boots', 'gloves-of-passage', 'zorgoth-s-soul-ring'] });
    expect(missing(r2, ['blast-diffusion-boots', 'gloves-of-passage', 'zorgoth-s-soul-ring'])).toEqual([]);
    expect(r2.ignoredEffects).toEqual([]);
    const r3 = resolve({ gear: ['nightmare-gauntlets'] });
    expect(missing(r3, ['nightmare-gauntlets'])).toEqual([]);
    expect(r3.ignoredEffects).toEqual([]);
  });

  it('rings: vigour (refund 10, specs 90%), asylum (10% chance of −15, 50-tick lock), reaver (+5% crit), champion (+3% vs bleeding), channeller (+4% per channel hit), stalker (+3% with a bow only)', () => {
    const vigour = resolve({ gear: ['ring-of-vigour'] });
    expect(vigour.ultimateRefund).toBe(10);
    expect(vigour.specCostMult).toBe(0.9);
    const asylum = resolve({ gear: ['asylum-surgeon-s-ring'] });
    expect(asylum.costReduction).toEqual({ chance: 0.1, amount: 15, cooldownTicks: 50 });
    expect(resolve({ gear: ['reaver-s-ring'] }).critChanceAdd).toBeCloseTo(0.05, 9);
    expect(resolve({ gear: ['champion-s-ring'] }).critVsBleeding).toBeCloseTo(0.03, 9);
    expect(resolve({ weapons: ['masterwork-staff'], gear: ['channeller-s-ring'] }).channelCritPerHit).toEqual({ add: 0.04, style: 'Magic' });
    expect(resolve({ weapons: ['bow-of-the-last-guardian'], gear: ['stalker-s-ring'] }).critChanceAdd).toBeCloseTo(0.03, 9);
    expect(resolve({ weapons: ['eldritch-crossbow'], gear: ['stalker-s-ring'] }).critChanceAdd).toBe(0);
    expect(resolve({ gear: ['ring-of-death'] }).ignoredEffects).toEqual([{ id: 'ring-of-death', kind: 'adrenaline-on-kill' }]);
  });

  it('pocket: Erethdor +12% crit; the scriptures are hit procs (Ful buff, Wen 5 beams + shatter, Jas 20% echo)', () => {
    expect(resolve({ gear: ['erethdor-s-grimoire'] }).critChanceAdd).toBeCloseTo(0.12, 9);
    expect(resolve({ gear: ['scripture-of-ful'] }).hitProcs).toEqual([{ id: 'scripture-of-ful', chance: 0.066, cooldownTicks: 25, style: undefined, buff: { id: 'gladiator-s-rage', durationTicks: 25 } }]);
    const wen = resolve({ gear: ['scripture-of-wen'] }).hitProcs[0];
    expect(wen).toMatchObject({ id: 'scripture-of-wen', chance: 0.066, cooldownTicks: 26 });
    expect(wen.hits).toHaveLength(6);
    expect(wen.hits![5]).toEqual({ offset: 6, min: 240, max: 400 });
    expect(resolve({ gear: ['scripture-of-jas'] }).hitProcs[0]).toMatchObject({ id: 'scripture-of-jas', chance: 0.066, cooldownTicks: 25, echo: { windowTicks: 17, share: 0.2, cap: 30000 } });
  });

  it('head / hands / totem: Jaws +2 adrenaline per bleed, cinderbane 12.5% tier-2 poison (25% AD), Malletops Barricade +3', () => {
    expect(resolve({ gear: ['jaws-of-the-abyss'] }).adrenalinePerBleed).toBe(2);
    expect(resolve({ gear: ['cinderbane-gloves'] }).poison).toEqual({ chance: 0.125, pct: 25 });
    expect(resolve({ items: ['malletops-totem'] }).buffDurationAdd['barricade']).toBe(3);
  });

  it('weapon passives: FSOA +20% crit damage, Dark Sliver Frostblades proc on melee hits, Omni guard / Devourer / Soulbound lantern, Ek-ZekKil Ashen Vow', () => {
    expect(resolve({ weapons: ['fractured-staff-of-armadyl'] }).critDamageAdd).toBeCloseTo(0.2, 9);
    const sliver = resolve({ weapons: ['dark-shard-of-leng', 'dark-sliver-of-leng'] });
    expect(sliver.hitProcs).toEqual([{ id: 'dark-sliver-of-leng', chance: 0.02, cooldownTicks: 0, style: 'Melee', buff: { id: 'frostblades', durationTicks: 15 } }]);
    const omni = resolve({ weapons: ['omni-guard', 'soulbound-lantern'] });
    expect(omni.items.has('omni-guard')).toBe(true);
    expect(omni.items.has('soulbound-lantern')).toBe(true);
    expect(omni.stackCaps['residual-souls']).toBe(5);
    expect(omni.hasConduit).toBe(true);
    expect(omni.weaponSpec?.id).toBe('death-essence');
    const dev = resolve({ weapons: ['devourer-s-guard', 'soulbound-lantern'] });
    expect(dev.items.has('devourer-s-guard')).toBe(true);
    expect(dev.weaponSpec?.id).toBe('soul-crush');
    const ezk = resolve({ weapons: ['ek-zekkil'] });
    expect(ezk.ignoredEffects).toEqual([]);
    expect(ezk.items.has('ek-zekkil')).toBe(true);
    expect(ezk.targetBuffDamageMult).toEqual([{ buff: 'flamebound-rival', style: 'Melee', mult: 1.12, notAbility: 'igneous-showdown' }]);
  });

  it('neck / talents: Essence of Finality stores a spec, amulet of souls is documented, Spirit Pact is read from the loadout', () => {
    const l = wear({ weapons: ['masterwork-staff'], gear: ['essence-of-finality-amulet'] });
    l.equipment.neck!.spec = 'instability';
    const r = resolveLoadout(l, DATA);
    expect(r.eofSpec?.id).toBe('instability');
    expect(resolve({ gear: ['amulet-of-souls'] }).ignoredEffects).toEqual([{ id: 'amulet-of-souls', kind: 'prayer' }]);
    const pact = wear({});
    pact.spiritPact = 3;
    expect(resolveLoadout(pact, DATA).conjureDurationAdd).toBe(30);
  });
});

// ---------------------------------------------------------------- engine

describe('gear: effects in the engine', () => {
  it("asylum surgeon's ring: 10% chance that an ability costs 15% less, then 50 ticks without", () => {
    const { e, rnd } = make(['wild-magic'], resolve({ weapons: ['masterwork-staff'], gear: ['asylum-surgeon-s-ring'] }));
    rnd.v = 0.05;
    cast(e, 'wild-magic', 1);
    expect(e.adrenaline).toBe(90); // 25 − 15
    cast(e, 'wild-magic', 10); // inside the internal cooldown: full price
    expect(e.adrenaline).toBe(65);
    e.update(51 * T);
    cast(e, 'wild-magic', 52);
    expect(e.adrenaline).toBe(55);
    const { e: plain } = make(['wild-magic'], resolve({ weapons: ['masterwork-staff'] }));
    cast(plain, 'wild-magic', 1);
    expect(plain.adrenaline).toBe(75);
  });

  it('Omni guard: 5 basic attacks ready Death Spark, the next one deals double damage; Touch of Death readies it during Death Essence', () => {
    const { e } = make(['necromancy', 'touch-of-death'], resolve({ weapons: ['omni-guard', 'soulbound-lantern'] }));
    for (let i = 0; i < 5; i++) cast(e, 'necromancy', 1 + 3 * i);
    expect(e.stack('death-spark')).toBe(5);
    expect(A(e, 'necromancy').map((h) => h.amount)).toEqual([1000, 1000, 1000, 1000, 1000]);
    cast(e, 'necromancy', 16);
    expect(A(e, 'necromancy').at(-1)!.amount).toBe(2000);
    expect(e.stack('death-spark')).toBe(0);
    cast(e, 'necromancy', 19);
    expect(e.stack('death-spark')).toBe(1);
    expect(A(e, 'necromancy').at(-1)!.amount).toBe(1000);
    (e as unknown as { applyBuff: (id: string, tick: number, key: string) => void }).applyBuff('death-essence', 19, 'test');
    cast(e, 'touch-of-death', 22);
    expect(e.stack('death-spark')).toBe(5);
    // without the guard nothing builds
    const { e: plain } = make(['necromancy'], resolve({ weapons: ['devourer-s-guard', 'soulbound-lantern'] }));
    cast(plain, 'necromancy', 1);
    expect(plain.stack('death-spark')).toBe(0);
  });

  it("Devourer's Guard: 4 basic attacks ready Soul Reave, the next one grants a Residual Soul; Soul Strike readies it during Soul Crush", () => {
    const { e } = make(['necromancy', 'soul-strike'], resolve({ weapons: ['devourer-s-guard', 'soulbound-lantern'] }));
    for (let i = 0; i < 4; i++) cast(e, 'necromancy', 1 + 3 * i);
    expect(e.stack('soul-reave')).toBe(4);
    expect(e.stack('residual-souls')).toBe(0);
    cast(e, 'necromancy', 13);
    expect(e.stack('soul-reave')).toBe(0);
    expect(e.stack('residual-souls')).toBe(1);
    (e as unknown as { applyBuff: (id: string, tick: number, key: string) => void }).applyBuff('soul-crush', 13, 'test');
    cast(e, 'soul-strike', 16);
    expect(e.stack('residual-souls')).toBe(0);
    expect(e.stack('soul-reave')).toBe(4);
  });

  it("channeller's ring: +4% crit per Asphyxiate hit including the first", () => {
    const { e, rnd } = make(['asphyxiate'], resolve({ weapons: ['masterwork-staff'], gear: ['channeller-s-ring'] }));
    rnd.v = 0.2; // base 10% + 4% × (1, 2, 3, 4) → hits 3 and 4 crit
    cast(e, 'asphyxiate', 1);
    e.update(10 * T);
    expect(A(e, 'asphyxiate').map((h) => h.crit)).toEqual([false, false, true, true]);
    const { e: plain, rnd: r2 } = make(['asphyxiate'], resolve({ weapons: ['masterwork-staff'] }));
    r2.v = 0.2;
    cast(plain, 'asphyxiate', 1);
    plain.update(10 * T);
    expect(A(plain, 'asphyxiate').map((h) => h.crit)).toEqual([false, false, false, false]);
  });

  it('Jaws of the Abyss: damaging melee basics +2% adrenaline per bleed on the target', () => {
    const r = resolve({ weapons: ['masterwork-2h-sword'], gear: ['jaws-of-the-abyss'] });
    const { e } = make(['dismember', 'attack'], r, { fullAdrenaline: false });
    cast(e, 'attack', 1);
    expect(e.adrenaline).toBe(9);
    cast(e, 'dismember', 4);
    cast(e, 'attack', 7);
    expect(e.adrenaline).toBe(20); // 9 + 2 for the Dismember bleed
  });

  it("champion's ring: +3% crit chance while the target bleeds", () => {
    const { e, rnd } = make(['dismember', 'attack'], resolve({ weapons: ['masterwork-2h-sword'], gear: ['champion-s-ring'] }));
    rnd.v = 0.11;
    cast(e, 'attack', 1);
    cast(e, 'dismember', 4);
    cast(e, 'attack', 7);
    expect(A(e, 'attack').map((h) => h.crit)).toEqual([false, true]);
  });

  it('Void knight: every hit × 1.07 with superior pieces', () => {
    const { e } = make(['attack'], resolve({ weapons: ['masterwork-2h-sword'], gear: ['superior-void-knight-melee-helm', 'superior-void-knight-top', 'superior-void-knight-robe', 'superior-void-knight-gloves'] }));
    cast(e, 'attack', 1);
    expect(A(e, 'attack').map((h) => h.amount)).toEqual([1284]); // 120% × 1.07
  });

  it('Song of Destruction: Combust hits build Essence Corruption and deal × 1.3; 10+ stacks add 3 × stacks + 99 to magic hits; 1+ stacks: 30% chance to land at once without a cooldown', () => {
    const { e, rnd } = make(['combust', 'magic'], resolve({ weapons: ['roar-of-awakening', 'ode-to-deceit'] }));
    cast(e, 'combust', 1); // 0.5 ≥ 0.3: the normal burn
    e.update(32 * T);
    const burn = A(e, 'combust');
    expect(burn.map((h) => h.tick)).toEqual([4, 7, 10, 13, 16, 19, 22, 25, 28, 31]);
    expect(burn.map((h) => h.amount)).toEqual(Array(10).fill(390)); // 30% × 1000 × 1.3
    expect(burn.every((h) => h.dot && !h.crit)).toBe(true);
    expect(e.stack('essence-corruption')).toBe(10);
    expect(e.buff('essence-corruption')!.endTick).toBe(31 + 50); // 30 s from the last stack
    cast(e, 'magic', 34);
    expect(A(e, 'magic').map((h) => h.amount)).toEqual([1129]); // 100% + 3 × 10 + 99
    rnd.v = 0.2; // < 0.3: the next Combust lands at once
    cast(e, 'combust', 37);
    const dump = A(e, 'combust').slice(10);
    expect(dump.map((h) => h.tick)).toEqual(Array(10).fill(37));
    // (28.2% × 1000 + 99 + 3 × stacks) × 1.3 – every hit of the dump adds a stack before the next one rolls
    expect(dump.map((h) => h.amount)).toEqual(Array.from({ length: 10 }, (_, i) => Math.floor((282 + 99 + 3 * (10 + i)) * 1.3 + 1e-6)));
    expect(e.stack('essence-corruption')).toBe(20);
    expect(e.cooldownLeft('ability:combust', 38)).toBe(0);
    cast(e, 'combust', 40); // no cooldown: casts again
    expect(e.events.some((x) => x.kind === 'on-cooldown')).toBe(false);
    expect(A(e, 'combust')).toHaveLength(30);
  });

  it('Song of Destruction: with 25+ Essence Corruption a basic generates +1% adrenaline per tick over 6 ticks', () => {
    const r = resolve({ weapons: ['roar-of-awakening', 'ode-to-deceit'] });
    const { e } = make(['magic'], r, { fullAdrenaline: false, prebuild: { ...emptyPrebuild(), stacks: { 'essence-corruption': 25 } } });
    cast(e, 'magic', 1);
    expect(e.adrenaline).toBe(9);
    e.update(8 * T);
    expect(e.adrenaline).toBeCloseTo(15, 9);
    const { e: few } = make(['magic'], r, { fullAdrenaline: false, prebuild: { ...emptyPrebuild(), stacks: { 'essence-corruption': 24 } } });
    cast(few, 'magic', 1);
    few.update(8 * T);
    expect(few.adrenaline).toBe(9);
  });

  it("Scripture of Ful: 6.6% chance per hit for Gladiator's Rage (×1.2 for 25 ticks), no second proc while it runs", () => {
    const { e, rnd } = make(['attack'], resolve({ weapons: ['masterwork-2h-sword'], gear: ['scripture-of-ful'] }));
    rnd.v = 0.05; // procs (and crits)
    cast(e, 'attack', 1);
    expect(e.buff('gladiator-s-rage')?.endTick).toBe(26);
    rnd.v = 0.5;
    cast(e, 'attack', 4);
    rnd.v = 0.05;
    cast(e, 'attack', 7);
    expect(A(e, 'attack').map((h) => h.amount)).toEqual([1665, 1440, 1998]); // 111% × 1.5 crit; 120% × 1.2; 111% × 1.5 × 1.2
    expect(e.buff('gladiator-s-rage')?.endTick).toBe(26); // locked, not refreshed
  });

  it('Scripture of Wen: 5 beams of 2.4–4% on ticks 2–6 after the proc, a 240–400% shatter with the fifth', () => {
    const { e, rnd } = make(['attack'], resolve({ weapons: ['masterwork-2h-sword'], gear: ['scripture-of-wen'] }));
    rnd.v = 0.05;
    cast(e, 'attack', 1);
    rnd.v = 0.5;
    e.update(10 * T);
    const cold = hits(e, 'proc:scripture-of-wen');
    expect(cold.map((h) => h.tick)).toEqual([3, 4, 5, 6, 7, 7]);
    expect(cold.map((h) => h.amount)).toEqual([32, 32, 32, 32, 32, 3200]);
  });

  it('Scripture of Jas: 20% of the damage dealt in the 17 ticks after the proc is dealt again on tick 18', () => {
    const { e, rnd } = make(['attack'], resolve({ weapons: ['masterwork-2h-sword'], gear: ['scripture-of-jas'] }));
    rnd.v = 0.05;
    cast(e, 'attack', 1); // 1665, procs
    rnd.v = 0.5;
    for (const t of [4, 7, 10, 13, 16, 19]) cast(e, 'attack', t);
    e.update(20 * T);
    // the hits on ticks 4–16 (tick 18 is the end of the window, tick 19 is outside; the proccing hit itself is not tracked)
    expect(hits(e, 'proc:scripture-of-jas')).toEqual([{ amount: 1200, tick: 19, crit: false, dot: false }]); // 0.2 × 5 × 1200
  });

  it('cinderbane gloves: a poisoning hit on a poisoned target deals a poison hit at once; the poison ticks every 17 ticks', () => {
    const { e, rnd } = make(['attack'], resolve({ weapons: ['masterwork-2h-sword'], gear: ['cinderbane-gloves'] }));
    rnd.v = 0.05;
    cast(e, 'attack', 1); // applies the poison
    expect(e.hasBuff('poisoned')).toBe(true);
    cast(e, 'attack', 4); // re-applies it: extra hit
    e.update(20 * T);
    expect(hits(e, 'proc:poison')).toEqual([{ amount: 170, tick: 4, crit: false, dot: true }, { amount: 170, tick: 18, crit: false, dot: true }]); // 25% × 1000 × 0.6825
  });

  it('Dark Sliver of Leng: 2% chance on a melee hit for Frostblades (+24% of the ability damage per hit for 15 ticks)', () => {
    const { e, rnd } = make(['attack'], resolve({ weapons: ['dark-shard-of-leng', 'dark-sliver-of-leng'], gear: [] }));
    rnd.v = 0.01;
    cast(e, 'attack', 1);
    expect(e.buff('frostblades')?.endTick).toBe(16);
    rnd.v = 0.5;
    cast(e, 'attack', 4);
    expect(A(e, 'attack').map((h) => h.amount)).toEqual([1653, 1440]); // 110.2% × 1.5 crit; (120% + 24%)
  });

  it('Vestments of havoc (2): Berserk starts Havoc regeneration, a second melee ultimate while it runs gives 20% at once', () => {
    const { e } = make(['berserk', 'meteor-strike'], resolve({ weapons: ['masterwork-2h-sword'], set: 'vestments-of-havoc', pieces: 3 }));
    cast(e, 'berserk', 1);
    expect(e.adrenaline).toBe(0);
    expect(e.buff('berserk')?.endTick).toBe(1 + 43);
    expect(e.hasBuff('havoc-regeneration')).toBe(true);
    e.update(11 * T);
    expect(e.adrenaline).toBeCloseTo(5, 9); // 15 over 30 ticks: 0.5 per tick for 10 ticks
    e.adrenaline = 60;
    cast(e, 'meteor-strike', 12);
    expect(e.hasBuff('havoc-regeneration')).toBe(false);
    expect(e.adrenaline).toBeCloseTo(20.5, 9); // tick 12's 0.5 regeneration, then −60 + 20 at once
  });
});

// ---------------------------------------------------------------- lint

describe('gear: every effect kind in set-effects.json is applied or documented as not simulated', () => {
  it('resolves every set at full pieces and every item; ignored kinds are on the allow-list, allow-listed kinds are really ignored', () => {
    const kinds = new Set<string>();
    const ignored = new Set<string>();
    for (const s of SET_DATA) {
      if (s.kind === 'set') {
        for (const t of s.thresholds ?? []) kinds.add(t.effect.kind);
        const l = wear({});
        const eq = l.equipment as Record<string, ItemRef>;
        const seen = new Set<string>();
        for (const g of GEAR_DATA) {
          if (g.set !== s.id || seen.has(g.slot)) continue;
          seen.add(g.slot);
          eq[g.slot] = { kind: 'gear', id: g.id };
        }
        for (const w of WEAPON_DATA) if (DATA.setEffectById.get(s.id) && ['roar-of-awakening', 'ode-to-deceit'].includes(w.id) && s.id === 'song-of-destruction') eq[weaponSlot(w)] = { kind: 'weapon', id: w.id };
        const r = resolveLoadout(l, DATA);
        expect(r.items.has(s.id + ':' + (s.thresholds![0].pieces)), s.id + ' has no worn pieces in gear.json / weapons.json').toBe(true);
        for (const x of r.ignoredEffects) ignored.add(x.kind);
      } else {
        kinds.add(s.effect!.kind);
        const r = resolveLoadout(wear({ items: [s.id] }), DATA);
        expect(r.items.has(s.id)).toBe(true);
        for (const x of r.ignoredEffects) ignored.add(x.kind);
      }
    }
    const unknown = [...ignored].filter((k) => !(k in NOT_SIMULATED_EFFECT_KINDS));
    expect(unknown, 'effect kinds neither applied by applyEffect nor in NOT_SIMULATED_EFFECT_KINDS').toEqual([]);
    const stale = Object.keys(NOT_SIMULATED_EFFECT_KINDS).filter((k) => !ignored.has(k));
    expect(stale, 'allow-listed kinds that are applied after all (or no longer in the data)').toEqual([]);
    expect(kinds.size).toBeGreaterThan(20);
  });
});

describe('Archaeology relics (runescape.wiki/w/Relic_powers)', () => {
  it('Fury of the Small +1 on basics, Conservation of Energy +10 after ultimates, Heightened Senses +10 max adrenaline', () => {
    const r = resolve({ relics: ['fury-of-the-small', 'conservation-of-energy', 'heightened-senses'] });
    expect(r.basicGainAdd).toBe(1);
    expect(r.ultimateRefund).toBe(10);
    expect(r.maxAdrenaline).toBe(110);
  });

  it('Conservation of Energy stacks with the Ring of vigour (20 after an ultimate)', () => {
    expect(resolve({ gear: ['ring-of-vigour'], relics: ['conservation-of-energy'] }).ultimateRefund).toBe(20);
  });

  it("Shadow's Grace halves the Surge / Escape / Dive / Bladed Dive / Barge cooldowns and does not stack with Mobile", () => {
    const r = resolve({ relics: ['shadow-s-grace'] });
    for (const a of SHADOWS_GRACE_ABILITIES) expect(r.cooldownMult[a]).toBe(0.5);
    expect(r.cooldownMult['anticipation']).toBeUndefined();
    const both = resolve({ weapons: ['masterwork-staff'], weaponPerks: [{ perk: 'mobile', rank: 1 }], relics: ['shadow-s-grace'] });
    for (const a of SHADOWS_GRACE_ABILITIES) expect(both.cooldownMult[a]).toBe(0.5);
  });

  it("Persistent Rage (out of combat) and Berserker's Fury (life points) change nothing in the simulation", () => {
    const base = resolve({});
    const r = resolve({ relics: ['persistent-rage', 'berserker-s-fury'] });
    expect({ ...r, items: [...r.items] }).toEqual({ ...base, items: [...base.items] });
  });

  it('a loadout saved without relics or familiar resolves like an empty one', () => {
    const l = wear({});
    delete (l as Partial<Loadout>).relics;
    delete (l as Partial<Loadout>).familiar;
    expect(resolveLoadout(l, DATA).familiar).toBeNull();
  });
});

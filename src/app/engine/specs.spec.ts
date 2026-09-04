/**
 * Weapon special attacks – one scenario per spec in specs.json (docs/research/special-attacks.md) plus the
 * Weapon Special Attack / Essence of Finality slot mechanics. Ability damage 1000 and a fixed roll of 0.5, so a
 * hit of a–b % lands for (a + b) / 2 × 10 and nothing crits (10% base chance); random effects (Crystal Rain's
 * extra arrows, Primordial Ice) never trigger.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import SPECS from '../../../public/data/specs.json';
import { Ability, Prebuild, SPEC_KEY, Style, WeaponSpec } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { StackId } from './rules-model';
import { EOF_KEY, EngineConfig, EngineEntity, EngineEvent, TICK_MS, TrainerEngine } from './trainer-engine';

const DATA = SPECS as unknown as WeaponSpec[];
const SPEC_BY_ID = new Map(DATA.map((s) => [s.id, s]));
const ABILITY_BY_ID = new Map((ABILITIES as unknown as Ability[]).map((a) => [a.id, a]));
const T = TICK_MS;

/** engine view of a spec – the numbers DataService.specEntity derives from specs.json */
function spec(id: string): EngineEntity {
  const s = SPEC_BY_ID.get(id);
  if (!s) throw new Error('unknown spec ' + id);
  return {
    key: 'spec:' + id, kind: 'spec', id, name: s.name, icon: '', gcd: !s.ignoresGcd, style: s.style, abilityType: 'Special',
    adrenaline: -(s.adrenaline ?? 0), cooldownTicks: s.cooldownTicks, buffs: [],
    damageMin: s.damageMin ?? undefined, damageMax: s.damageMax ?? undefined,
    hits: s.damageMin !== null ? [0] : undefined, channel: s.channelled ? { ticks: 3, hits: [1, 2, 3] } : undefined,
  };
}

/** ability from abilities.json (the two slots, Combust, Berserk) */
function ability(id: string): EngineEntity {
  const a = ABILITY_BY_ID.get(id);
  if (!a) throw new Error('unknown ability ' + id);
  return {
    key: 'ability:' + id, kind: 'ability', id, name: a.name, icon: '', gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined, buffs: [],
  };
}

/** a plain basic of `style` hitting for a flat 100% */
function basic(id: string, style: Style): EngineEntity {
  return { key: 'ability:' + id, kind: 'ability', id, name: id, icon: '', gcd: true, style, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, buffs: [], damageMin: 100, damageMax: 100 };
}

interface Opts {
  stacks?: Partial<Record<StackId, number>>;
  items?: string[];
  loadout?: Partial<ResolvedLoadout>;
  random?: number;
  targetLifePoints?: number;
}

/** engine over the steps; the first spec step is the wielded weapon's spec unless the loadout says otherwise */
function make(steps: EngineEntity[], o: Opts = {}): TrainerEngine {
  const l: ResolvedLoadout = { ...defaultResolvedLoadout(), startAdrenaline: 100, abilityDamage: 1000, ...o.loadout, items: new Set(o.items ?? []) };
  const first = steps.find((s) => s.kind === 'spec');
  if (first && !l.weaponSpec && !l.eofSpec) l.weaponSpec = first;
  l.style ??= first?.style ?? l.weaponSpec?.style ?? l.eofSpec?.style ?? null;
  const prebuild: Prebuild | undefined = o.stacks ? { stacks: o.stacks as Record<string, number>, spirits: [], abilities: [], prayers: [] } : undefined;
  const cfg: EngineConfig = { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true, loadout: l, prebuild, targetLifePoints: o.targetLifePoints };
  const e = new TrainerEngine(steps, new Map(steps.map((s) => [s.key, s])), cfg);
  e.random = () => o.random ?? 0.5;
  e.start(0);
  return e;
}

/** press so that the input is processed on `tick` (1 ms into the tick before) and advance to `until` */
function cast(e: TrainerEngine, key: string, tick: number, until: number): void {
  e.press(key, (tick - 1) * T + 1);
  e.update(until * T);
}

/** [tick relative to the cast tick 1, amount] of every hit */
function hits(e: TrainerEngine, from = 1): [number, number][] {
  return e.events.filter((x): x is Extract<EngineEvent, { kind: 'hit' }> => x.kind === 'hit').map((h) => [h.tick - from, h.amount]);
}

function dot(first: number, every: number, n: number, amount: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => [first + i * every, amount]);
}

interface Row {
  hits: [number, number][];
  /** buffs active right after the cast */
  buffs?: string[];
  adrenaline: number;
  cooldown?: number;
}

const ROWS: Record<string, Row> = {
  // magic
  'claws-of-guthix': { hits: [[0, 2200]], buffs: ['claws-of-guthix'], adrenaline: 75 },
  devour: { hits: [[0, 2200]], buffs: ['devour'], adrenaline: 50 },
  'flames-of-zamorak': { hits: [[0, 2200]], buffs: ['flames-of-zamorak'], adrenaline: 75 },
  'from-the-shadows': { hits: [[1, 600], [5, 600], [9, 600], [13, 600], [17, 600]], adrenaline: 50 },
  'iban-blast': { hits: [[0, 3650]], adrenaline: 50 },
  instability: { hits: [[0, 1300]], buffs: ['instability'], adrenaline: 50, cooldown: 100 },
  'miasmic-barrage': { hits: [[0, 2200]], buffs: ['miasmic-barrage'], adrenaline: 50 },
  'power-of-darkness': { hits: [], buffs: ['power-of-darkness'], adrenaline: 0, cooldown: 150 },
  'power-of-light': { hits: [], buffs: ['power-of-light'], adrenaline: 0 },
  reap: { hits: [[0, 2900]], adrenaline: 55 },
  'rune-flame': { hits: [[0, 1300]], adrenaline: 65 },
  'saradomin-strike': { hits: [[0, 2200]], adrenaline: 75 },
  soulfire: { hits: [[0, 1450], ...dot(3, 3, 6, 1850)], buffs: ['soulfire', 'conflagrate'], adrenaline: 65, cooldown: 75 },
  'tempest-of-armadyl': { hits: [[1, 500], [2, 550], [3, 600], [4, 650], [5, 700]], adrenaline: 50 },
  'the-last-command': { hits: [[0, 2600]], adrenaline: 65 },
  // melee
  'aimed-strike': { hits: [[0, 1600]], adrenaline: 65 },
  'armadyl-s-judgement': { hits: [[0, 4400]], adrenaline: 50 },
  backstab: { hits: [[0, 1600]], buffs: ['backstab'], adrenaline: 25 },
  blackhole: { hits: dot(3, 3, 11, 400), buffs: ['blackhole'], adrenaline: 50, cooldown: 100 },
  clobber: { hits: [[0, 1000]], buffs: ['clobber'], adrenaline: 70 },
  disrupt: { hits: [[0, 2500]], adrenaline: 40 },
  'draconic-blow': { hits: [[0, 2600]], adrenaline: 80 },
  'draconic-cleave': { hits: [[0, 2950]], adrenaline: 75 },
  'draconic-puncture': { hits: [[0, 1400], [0, 1400]], adrenaline: 50 },
  'draconic-slash': { hits: [[0, 2600]], buffs: ['draconic-slash'], adrenaline: 50 },
  'energy-drain': { hits: [[0, 800]], adrenaline: 50 },
  'favour-of-the-war-god': { hits: [[0, 1350]], adrenaline: 0 },
  feint: { hits: [[0, 2750]], adrenaline: 75 },
  fishstabber: { hits: [], buffs: ['fishstabber'], adrenaline: 0 },
  'get-over-here': { hits: [], buffs: ['stunned', 'bound'], adrenaline: 25 },
  gravitate: { hits: [], buffs: ['gravitate'], adrenaline: 40 },
  'healing-blade': { hits: [[0, 2000]], adrenaline: 50 },
  'ice-cleave': { hits: [[0, 2000]], buffs: ['bound'], adrenaline: 40 },
  'icy-tempest': { hits: [[0, 1250], [0, 1900]], adrenaline: 70, cooldown: 25 },
  'igneous-showdown': { hits: [[0, 2800]], buffs: ['flamebound-rival'], adrenaline: 50, cooldown: 100 },
  impale: { hits: [[0, 1400]], adrenaline: 75 },
  liquefy: { hits: [[0, 1350]], buffs: ['liquefy'], adrenaline: 50 },
  obliterate: { hits: [[0, 1700]], buffs: ['obliterate'], adrenaline: 50 },
  powerstab: { hits: [[0, 2900]], adrenaline: 50 },
  'quick-smash': { hits: [[0, 1250]], adrenaline: 50 },
  rampage: { hits: [], buffs: ['rampage'], adrenaline: 0 },
  'saradomin-s-lightning': { hits: [[0, 3050], [0, 3050]], adrenaline: 0 },
  shove: { hits: [], buffs: ['stunned', 'bound'], adrenaline: 75 },
  'slice-dice': { hits: [[0, 2000], [0, 1000], [0, 500], [0, 500]], adrenaline: 50 },
  'spear-wall': { hits: [[0, 1150]], buffs: ['spear-wall'], adrenaline: 50 },
  sunder: { hits: [[0, 1350]], buffs: ['sunder'], adrenaline: 50 },
  'sunfall-slam': { hits: [[0, 2950]], buffs: ['lesser-purifying-light'], adrenaline: 60, cooldown: 100 },
  sweep: { hits: [[0, 1350], [0, 1350]], adrenaline: 70 },
  // hit 3: +50% crit chance (0.5 < 0.6 → crit) and +50% crit damage → 1650 × 2.0
  'the-final-flurry': { hits: [[0, 900], [0, 900], [0, 3300]], adrenaline: 50 },
  'vine-call': { hits: [[0, 1100], ...dot(3, 3, 10, 225)], buffs: ['vine-call'], adrenaline: 40, cooldown: 33 },
  warstrike: { hits: [[0, 2450]], buffs: ['warstrike'], adrenaline: 0 },
  weaken: { hits: [[0, 800]], buffs: ['weaken'], adrenaline: 50 },
  // necromancy
  'death-essence': { hits: [[0, 4000]], buffs: ['death-essence'], adrenaline: 70, cooldown: 100 },
  'death-grasp': { hits: [[0, 4500]], buffs: ['stunned', 'bound'], adrenaline: 75, cooldown: 50 },
  'soul-crush': { hits: [[0, 1500]], buffs: ['soul-crush'], adrenaline: 75, cooldown: 100 },
  // ranged
  'aimed-shot': { hits: [[5, 3300]], adrenaline: 65 },
  'balance-by-force': { hits: [[0, 2450]], buffs: ['balance-by-force'], adrenaline: 70 },
  'balanced-shot': { hits: [[0, 1800]], adrenaline: 65 },
  'chain-hit': { hits: [[0, 600]], adrenaline: 90 },
  'crystal-rain': { hits: [[0, 1400]], adrenaline: 70, cooldown: 50 },
  'deep-burn': { hits: [[0, 1950]], buffs: ['stunned', 'bound', 'deep-burn'], adrenaline: 75 },
  defiance: { hits: [[0, 2500]], adrenaline: 60 },
  'descent-of-darkness': { hits: [[0, 2100], [0, 2100]], adrenaline: 35 },
  'destructive-shot': { hits: [[0, 1700], [0, 1700]], adrenaline: 60 },
  hamstring: { hits: [[0, 1600]], adrenaline: 50 },
  locate: { hits: [], buffs: ['locate'], adrenaline: 65 },
  mirrorback: { hits: [], buffs: ['mirrorback'], adrenaline: 0 },
  'phantom-strike': { hits: [[0, 1300], ...dot(3, 3, 6, 350)], buffs: ['phantom-strike'], adrenaline: 50 },
  powershot: { hits: [[0, 2200]], adrenaline: 65 },
  'restorative-shot': { hits: [[0, 1400]], adrenaline: 70 },
  shadowfall: { hits: [[0, 950], [0, 950], [1, 2750]], adrenaline: 35 },
  soulshot: { hits: [[0, 1100]], buffs: ['soulshot'], adrenaline: 50 },
  'split-soul': { hits: [], buffs: ['split-soul'], adrenaline: 75 },
  'twin-shot': { hits: [[0, 600], [0, 600]], adrenaline: 65 },
  'twin-fang': { hits: [[0, 1300], [0, 1300]], adrenaline: 50 },
};

describe('every weapon special attack has a scenario', () => {
  it('specs.json and the scenario table agree', () => {
    expect(Object.keys(ROWS).sort()).toEqual(DATA.map((s) => s.id).sort());
  });

  it.each(Object.entries(ROWS))('%s', (id, row) => {
    const s = spec(id);
    const e = make([s]);
    cast(e, s.key, 1, 1);
    expect(e.results[0], 'cast').toMatchObject({ key: s.key, outcome: expect.stringMatching(/perfect|done/) });
    expect(e.adrenaline, 'adrenaline after the cast').toBe(row.adrenaline);
    for (const b of row.buffs ?? []) expect(e.hasBuff(b), 'buff ' + b).toBe(true);
    if (row.cooldown !== undefined) expect(e.cooldownLeft(s.key, 1), 'cooldown').toBe(row.cooldown);
    else expect(e.cooldownLeft(s.key, 1), 'cooldown').toBe(0);
    e.update(45 * T);
    expect(hits(e)).toEqual(row.hits);
  });

  it('buff durations follow the wiki (1 minute debuffs, 30 s self-buffs, stuns)', () => {
    const e = make([spec('death-grasp')]);
    cast(e, 'spec:death-grasp', 1, 1);
    expect(e.buff('stunned')!.endTick).toBe(1 + 8);
    expect(e.buff('bound')!.endTick).toBe(1 + 8);
    const p = make([spec('power-of-light')]);
    cast(p, 'spec:power-of-light', 1, 1);
    expect(p.buff('power-of-light')!.endTick).toBe(1 + 100);
    const r = make([spec('rampage')]);
    cast(r, 'spec:rampage', 1, 1);
    expect(r.buff('rampage')!.endTick).toBe(1 + 100);
    const o = make([spec('obliterate')]);
    cast(o, 'spec:obliterate', 1, 1);
    expect(o.buff('obliterate')!.endTick).toBe(1 + 100);
    const ss = make([spec('split-soul')]);
    cast(ss, 'spec:split-soul', 1, 1);
    expect(ss.buff('split-soul')!.endTick).toBe(1 + 25); // the spec, not the 34-tick incantation
  });
});

describe('resource specials', () => {
  it('Death Grasp: +40% per Necrosis stack, consumes them all (930% at 12)', () => {
    const e = make([spec('death-grasp')], { stacks: { necrosis: 12 } });
    cast(e, 'spec:death-grasp', 1, 1);
    expect(hits(e)).toEqual([[0, 9300]]);
    expect(e.stack('necrosis')).toBe(0);
  });

  it('Soul Crush: +135–165% per Residual Soul, consumes them, readies Soul Reave with the Devourer\'s Guard', () => {
    const e = make([spec('soul-crush')], { stacks: { 'residual-souls': 3 }, items: ['devourer-s-guard'] });
    cast(e, 'spec:soul-crush', 1, 1);
    expect(hits(e)).toEqual([[0, 6000]]);
    expect(e.stack('residual-souls')).toBe(0);
    expect(e.stack('soul-reave')).toBe(4);
    const eof = make([spec('soul-crush')], { stacks: { 'residual-souls': 3 } }); // no Devourer's Guard in hand: no Soul Reave
    cast(eof, 'spec:soul-crush', 1, 1);
    expect(eof.stack('soul-reave')).toBe(0);
  });

  it('Death Essence readies Death Spark only with a wielded Omni guard; a main-hand swap removes the buff', () => {
    const e = make([spec('death-essence')], { items: ['omni-guard'] });
    cast(e, 'spec:death-essence', 1, 1);
    expect(e.stack('death-spark')).toBe(5);
    expect(e.buff('death-essence')!.endTick).toBe(51);
    const none = make([spec('death-essence')]);
    cast(none, 'spec:death-essence', 1, 1);
    expect(none.stack('death-spark')).toBe(0);
    none.setWield({ mainHand: 'other', offHand: null, twoHand: null });
    expect(none.hasBuff('death-essence')).toBe(true); // no resolver → buffs stay; the removal is tested via switchWeapon below
  });

  it('Icy Tempest: +18–22% per Primordial Ice stack on both hits, cost −12 per stack, requirement unchanged', () => {
    const e = make([spec('icy-tempest')], { stacks: { 'primordial-ice': 5 } });
    expect(e.costOf(spec('icy-tempest'))).toEqual({ need: 30, cost: 0 });
    cast(e, 'spec:icy-tempest', 1, 1);
    expect(hits(e)).toEqual([[0, 2250], [0, 2900]]);
    expect(e.stack('primordial-ice')).toBe(0);
    expect(e.adrenaline).toBe(100);
    const two = make([spec('icy-tempest')], { stacks: { 'primordial-ice': 2 }, loadout: { startAdrenaline: 20 } });
    expect(two.costOf(spec('icy-tempest'))).toEqual({ need: 30, cost: 6 });
    cast(two, 'spec:icy-tempest', 1, 1);
    expect(two.results.length).toBe(0); // 20% adrenaline is short of the 30% requirement even though the cost is 6
    expect(two.events.some((x) => x.kind === 'no-adrenaline')).toBe(true);
    const vigour = make([spec('icy-tempest')], { stacks: { 'primordial-ice': 1 }, loadout: { specCostMult: 0.9 } });
    expect(vigour.costOf(spec('icy-tempest'))).toEqual({ need: 27, cost: 16 });
  });

  it('Primordial Ice builds from melee casts with the Dark Shard of Leng (10%), never from bleeds', () => {
    const slash = basic('slash', 'Melee');
    const e = make([slash, spec('icy-tempest')], { items: ['dark-shard-of-leng'], random: 0.05 });
    cast(e, 'ability:slash', 1, 1);
    expect(e.stack('primordial-ice')).toBe(1);
    const other = make([slash, spec('icy-tempest')], { random: 0.05 });
    cast(other, 'ability:slash', 1, 1);
    expect(other.stack('primordial-ice')).toBe(0);
  });

  it('Igneous Showdown: the second cast against the Flamebound Rival hits 4 times, +12% and refunds 15% – only with a wielded Ek-ZekKil', () => {
    const e = make([spec('igneous-showdown')], { items: ['ek-zekkil'], loadout: { cooldownMult: { 'igneous-showdown': 0 } } });
    cast(e, 'spec:igneous-showdown', 1, 1);
    expect(hits(e)).toEqual([[0, 2800]]);
    expect(e.adrenaline).toBe(50);
    cast(e, 'spec:igneous-showdown', 4, 4);
    expect(hits(e, 4).slice(1)).toEqual([[0, 3136], [0, 2856], [0, 2856], [0, 2856]]);
    expect(e.adrenaline).toBe(15);
    const eof = make([spec('igneous-showdown')], { loadout: { cooldownMult: { 'igneous-showdown': 0 } } });
    cast(eof, 'spec:igneous-showdown', 1, 1);
    cast(eof, 'spec:igneous-showdown', 4, 4);
    expect(hits(eof, 4).slice(1)).toEqual([[0, 2800]]);
    expect(eof.adrenaline).toBe(0);
  });

  it('Instability: a Magic critical strike fires a Lightning Surge a tick later, which never chains', () => {
    const blast = basic('blast', 'Magic');
    const e = make([spec('instability'), blast], { random: 0.05 }); // every hit crits, rolls at 5%
    cast(e, 'spec:instability', 1, 1);
    e.update(3 * T);
    // 121% crit → 1815, surge 71% crit → 1065
    expect(hits(e)).toEqual([[0, 1815], [1, 1065]]);
    expect(e.events.filter((x) => x.kind === 'hit').map((x) => (x as { key: string }).key)).toEqual(['spec:instability', 'spec:instability:lightning-surge']);
    cast(e, 'ability:blast', 4, 6);
    expect(hits(e, 4).slice(2)).toEqual([[0, 1500], [1, 1065]]);
    const melee = make([spec('instability'), basic('slash', 'Melee')], { random: 0.05, loadout: { style: 'Magic' } });
    cast(melee, 'spec:instability', 1, 1);
    melee.config.loadout.style = 'Melee';
    cast(melee, 'ability:slash', 4, 6);
    expect(hits(melee, 4).slice(2)).toEqual([[0, 1500]]); // a melee crit does not proc
  });

  it('Soulfire grants Conflagrate: the next Combust deals +40% and consumes it', () => {
    const e = make([spec('soulfire'), ability('combust')]);
    cast(e, 'spec:soulfire', 1, 1);
    cast(e, 'ability:combust', 4, 7);
    expect(e.hasBuff('conflagrate')).toBe(false);
    expect(hits(e, 4).filter(([t]) => t === 3).sort((a, b) => a[1] - b[1])).toEqual([[3, 420], [3, 1850]]); // Combust 300% × 1.4 next to the burn
  });

  it('Blackhole: melee 1.25x unless Berserk runs; Rampage 1.2x multiplies with both', () => {
    const slash = basic('slash', 'Melee');
    const e = make([spec('blackhole'), slash, ability('berserk'), spec('rampage')]);
    cast(e, 'spec:blackhole', 1, 1);
    cast(e, 'ability:slash', 4, 4);
    expect(hits(e).at(-1)).toEqual([3, 1250]);
    e.adrenaline = 100;
    cast(e, 'ability:berserk', 7, 7);
    cast(e, 'ability:slash', 10, 10);
    expect(hits(e).at(-1)).toEqual([9, 1750]);
    const r = make([spec('rampage'), slash, spec('blackhole')], { loadout: { weaponSpec: spec('rampage'), eofSpec: spec('blackhole'), style: 'Melee' } });
    cast(r, 'spec:rampage', 1, 1);
    r.adrenaline = 100;
    cast(r, 'spec:blackhole', 4, 4);
    cast(r, 'ability:slash', 7, 7);
    expect(hits(r).filter(([, a]) => a !== 400).at(-1)).toEqual([6, 1500]);
    expect(r.hasBuff('rampage')).toBe(true);
  });

  it('Gravitate: every melee ability hit adds a stack (+1% each), an auto-attack 2; bleeds are not boosted', () => {
    const slash = basic('slash', 'Melee');
    const auto = { ...basic('attack', 'Melee') };
    const e = make([spec('gravitate'), slash, auto]);
    cast(e, 'spec:gravitate', 1, 1);
    cast(e, 'ability:slash', 4, 4);
    cast(e, 'ability:slash', 7, 7);
    cast(e, 'ability:slash', 10, 10);
    expect(hits(e)).toEqual([[3, 1000], [6, 1010], [9, 1020]]);
    expect(e.stack('gravitate')).toBe(3);
    cast(e, 'ability:attack', 13, 13);
    expect(e.stack('gravitate')).toBe(5);
    expect(e.buff('gravitate')!.endTick).toBe(51);
  });

  it('The Last Command: +1% per 1% missing life points, max +75%', () => {
    const blast = basic('blast', 'Magic');
    const e = make([blast, spec('the-last-command')], { targetLifePoints: 10000 });
    cast(e, 'ability:blast', 1, 1);
    cast(e, 'spec:the-last-command', 4, 4);
    expect(hits(e).at(-1)).toEqual([3, 2860]);
    const low = make([blast, spec('the-last-command')], { targetLifePoints: 1100 });
    cast(low, 'ability:blast', 0, 1); // 1000 of 1100 gone: 91% missing, capped at 75%
    cast(low, 'spec:the-last-command', 4, 4);
    expect(hits(low).at(-1)).toEqual([3, 4550]);
  });

  it('Quick Smash can be cast during the global cooldown without starting one', () => {
    const slash = basic('slash', 'Melee');
    const e = make([slash, spec('quick-smash')], { loadout: { startAdrenaline: 50 } });
    cast(e, 'ability:slash', 1, 1);
    cast(e, 'spec:quick-smash', 2, 2);
    expect(e.results.map((r) => [r.key, r.outcome, r.firedAtTick])).toEqual([['ability:slash', 'perfect', 1], ['spec:quick-smash', 'done', 2]]);
    expect(e.castTick).toBe(1);
    expect(hits(e)).toEqual([[0, 1000], [1, 1250]]);
    expect(e.adrenaline).toBe(9); // 50 + 9 − 50
  });

  it('Aimed Shot is a 5-tick channel that another ability cancels', () => {
    const shot = basic('shot', 'Ranged');
    const e = make([spec('aimed-shot'), shot]);
    cast(e, 'spec:aimed-shot', 1, 1);
    expect(e.channel?.key).toBe('spec:aimed-shot');
    cast(e, 'ability:shot', 4, 4);
    expect(e.events.some((x) => x.kind === 'channel-cancelled' && x.key === 'spec:aimed-shot' && x.hitsLost === 1)).toBe(true);
    expect(hits(e)).toEqual([[3, 1000]]);
  });
});

describe('Weapon Special Attack and Essence of Finality slots', () => {
  const grasp = spec('death-grasp');
  const claws = spec('claws-of-guthix');

  it('cost equals the requirement, Ring of vigour makes both 90%, no ultimate refund', () => {
    const e = make([ability('weapon-special-attack')], { loadout: { weaponSpec: grasp, specCostMult: 0.9, ultimateRefund: 10 } });
    expect(e.costOf(ability('weapon-special-attack'))).toEqual({ need: 23, cost: 23 });
    cast(e, SPEC_KEY, 1, 1);
    expect(e.adrenaline).toBe(77);
    const r = make([ability('essence-of-finality')], { loadout: { eofSpec: spec('rampage'), style: 'Melee', ultimateRefund: 10 } });
    cast(r, EOF_KEY, 1, 1);
    expect(r.adrenaline).toBe(0);
    expect(r.hasBuff('rampage')).toBe(true);
  });

  it('the slots act with the spec\'s rule: Death Grasp through the EoF consumes Necrosis and stuns', () => {
    const e = make([ability('essence-of-finality')], { stacks: { necrosis: 12 }, loadout: { eofSpec: grasp, style: 'Necromancy' } });
    expect(e.ruleOf(ability('essence-of-finality'))?.requires?.map((r) => r.equipment)).toEqual(['eof']);
    cast(e, EOF_KEY, 1, 1);
    expect(e.results[0]).toMatchObject({ key: EOF_KEY, outcome: 'perfect' });
    expect(hits(e)).toEqual([[0, 9300]]);
    expect(e.stack('necrosis')).toBe(0);
    expect(e.hasBuff('stunned')).toBe(true);
    expect(e.cooldownLeft(EOF_KEY, 1)).toBe(50);
  });

  it('the weapon spec and its EoF copy share one cooldown', () => {
    const e = make([ability('weapon-special-attack'), ability('essence-of-finality')], { loadout: { weaponSpec: grasp, eofSpec: grasp, style: 'Necromancy' } });
    cast(e, SPEC_KEY, 1, 1);
    expect(e.cooldownLeft(EOF_KEY, 1)).toBe(50);
    expect(e.cooldownLeft(SPEC_KEY, 1)).toBe(50);
    expect(e.usable(EOF_KEY, 1)).toBe('cooldown');
    cast(e, EOF_KEY, 4, 4);
    expect(e.results.length).toBe(1);
    expect(e.events.some((x) => x.kind === 'on-cooldown' && x.key === EOF_KEY)).toBe(true);
  });

  it('the EoF needs a wielded weapon of the stored special\'s style', () => {
    const e = make([ability('essence-of-finality')], { loadout: { eofSpec: spec('armadyl-s-judgement'), style: 'Magic' } });
    expect(e.usable(EOF_KEY, 0)).toBe('weapon');
    expect(e.eofSpecReady()).toBeNull();
    cast(e, EOF_KEY, 1, 1);
    expect(e.results.length).toBe(0);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-weapon', key: EOF_KEY, reason: 'weapon' });
    expect(e.adrenaline).toBe(100);
    const none = make([ability('essence-of-finality')], { loadout: { style: 'Magic' } });
    expect(none.usable(EOF_KEY, 0)).toBe('requirement');
    expect(none.requirementFailure(ability('essence-of-finality'), 0)).toContain('Essence of Finality');
    const ok = make([ability('essence-of-finality')], { loadout: { eofSpec: claws, style: 'Magic' } });
    expect(ok.usable(EOF_KEY, 0)).toBe('ok');
    expect(ok.eofSpecReady()?.id).toBe('claws-of-guthix');
  });

  it('the generic slot needs a wielded weapon with a special attack', () => {
    const e = make([ability('weapon-special-attack')], { loadout: { style: 'Melee' } });
    expect(e.usable(SPEC_KEY, 0)).toBe('weapon');
    cast(e, SPEC_KEY, 1, 1);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-weapon', key: SPEC_KEY, reason: 'spec' });
  });

  it('both slots morph to the special they fire, even when it is not on a bar', () => {
    const e = make([ability('weapon-special-attack'), ability('essence-of-finality')], { loadout: { weaponSpec: grasp, eofSpec: claws, style: 'Necromancy' } });
    expect(e.morphOf(SPEC_KEY, 0)).toEqual({ key: 'spec:death-grasp', stage: 1 });
    expect(e.morphOf(EOF_KEY, 0)).toBeNull(); // magic special with a necromancy weapon
    expect(e.usable('spec:death-grasp', 0)).toBe('ok'); // resolved through the loadout, not the catalog
    cast(e, SPEC_KEY, 1, 1);
    expect(e.cooldownLeft('spec:death-grasp', 1)).toBe(50);
    expect(e.cooldownTotalTicks('spec:death-grasp')).toBe(50);
    const m = make([ability('essence-of-finality')], { loadout: { eofSpec: claws, style: 'Magic' } });
    expect(m.morphOf(EOF_KEY, 0)).toEqual({ key: 'spec:claws-of-guthix', stage: 1 });
    expect(m.morphOf(SPEC_KEY, 0)).toBeNull();
  });

  it('pressing a slot satisfies the spec step the rotation expects; a spec step is usable when only the EoF holds it', () => {
    const e = make([claws], { loadout: { eofSpec: claws, style: 'Magic' } });
    expect(e.usable('spec:claws-of-guthix', 0)).toBe('ok');
    cast(e, EOF_KEY, 1, 1);
    expect(e.results[0]).toMatchObject({ key: 'spec:claws-of-guthix', outcome: 'perfect' });
    expect(hits(e)).toEqual([[0, 2200]]);
    const w = make([grasp], { loadout: { weaponSpec: grasp, style: 'Necromancy' } });
    cast(w, SPEC_KEY, 1, 1);
    expect(w.results[0]).toMatchObject({ key: 'spec:death-grasp', outcome: 'perfect' });
    const wrong = make([claws], { loadout: { weaponSpec: grasp, style: 'Necromancy' } });
    expect(wrong.usable('spec:claws-of-guthix', 0)).toBe('weapon');
  });

  it('Quick Smash stays off the GCD through the generic slot', () => {
    const slash = basic('slash', 'Melee');
    const smash = spec('quick-smash');
    const e = make([slash, smash], { loadout: { weaponSpec: smash, style: 'Melee' } });
    cast(e, 'ability:slash', 1, 1);
    cast(e, SPEC_KEY, 2, 2);
    expect(e.results.map((r) => [r.key, r.firedAtTick])).toEqual([['ability:slash', 1], ['spec:quick-smash', 2]]);
    expect(e.castTick).toBe(1);
  });

  it('a main-hand swap removes Death Essence, Soul Crush, Locate and Gravitate but keeps Blackhole and Power of Light', () => {
    const swap: EngineEntity = { key: 'weapon:other', kind: 'weapon', id: 'other', name: 'other', icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], weapon: { id: 'other', slot: 'main', style: 'Melee' } };
    const steps = [spec('death-essence'), spec('locate'), spec('gravitate'), spec('blackhole'), spec('power-of-light'), swap];
    const e = make(steps, { loadout: { style: 'Necromancy', weaponSpec: steps[0] } });
    cast(e, 'spec:death-essence', 1, 1);
    for (const [i, id] of ['locate', 'gravitate', 'blackhole', 'power-of-light'].entries()) {
      e.adrenaline = 100;
      e.config.loadout.weaponSpec = spec(id);
      e.config.loadout.style = spec(id).style;
      cast(e, 'spec:' + id, 4 + 3 * i, 4 + 3 * i);
    }
    expect(['death-essence', 'locate', 'gravitate', 'blackhole', 'power-of-light'].map((b) => e.hasBuff(b))).toEqual([true, true, true, true, true]);
    cast(e, 'weapon:other', 17, 17);
    expect(['death-essence', 'locate', 'gravitate', 'blackhole', 'power-of-light'].map((b) => e.hasBuff(b))).toEqual([false, false, false, true, true]);
  });
});

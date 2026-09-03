import { describe, expect, it } from 'vitest';
import { DEFAULT_ENEMY, EnemyConfig } from '../core/models';
import { defaultResolvedLoadout } from './loadout-resolved';
import { EngineConfig, EngineEntity, TrainerEngine } from './trainer-engine';

const base: EngineConfig = { pingMs: 0, jitterMs: 0, abilityQueueing: false, loop: false, loadout: defaultResolvedLoadout(), prayerBook: 'Curses' };

function ability(key: string): EngineEntity {
  return { key, kind: 'ability', id: key, name: key, icon: '', gcd: true, abilityType: 'Basic', adrenaline: 9, cooldownTicks: 0, buffs: [], style: 'Defence' };
}
function prayer(id: string): EngineEntity {
  return { key: 'prayer:' + id, kind: 'prayer', id, name: id, icon: '', gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
}

const A = ability('a');
const B = ability('b');
const SS = prayer('soul-split');
const DM = prayer('deflect-melee');
const DMAG = prayer('deflect-magic');
const TURM = prayer('turmoil');
const PIETY = prayer('piety');
const CATALOG = new Map([A, B, SS, DM, DMAG, TURM, PIETY].map((e) => [e.key, e]));

function make(steps: EngineEntity[], cfg: Partial<EngineConfig> = {}): TrainerEngine {
  const e = new TrainerEngine(steps, CATALOG, { ...base, ...cfg });
  e.start(0);
  return e;
}

describe('prayers', () => {
  it('toggles prayers, replaces conflicting overheads and ignores the other book', () => {
    const e = make([A, B]);
    e.press('prayer:soul-split', 100);
    e.update(600);
    expect([...e.activePrayers]).toEqual(['soul-split']);
    e.press('prayer:deflect-melee', 700);
    e.update(1200);
    expect([...e.activePrayers]).toEqual(['deflect-melee']);
    expect(e.events.at(-1)).toMatchObject({ kind: 'prayer', id: 'deflect-melee', on: true, replaced: ['soul-split'] });
    e.press('prayer:deflect-melee', 1300);
    e.update(1800);
    expect(e.activePrayers.size).toBe(0);
    e.press('prayer:piety', 1900);
    e.update(2400);
    expect(e.events.at(-1)).toMatchObject({ kind: 'wrong-book', id: 'piety', book: 'Prayers' });
    expect(e.usable('prayer:piety', 0)).toBe('book');
    expect(e.usable('prayer:turmoil', 0)).toBe('ok');
  });

  it('a prayer step is done when pressed, or automatically when the prayer is already on', () => {
    const e = make([A, TURM, B]);
    e.press('prayer:turmoil', 100); // before A – early, allowed, no penalty
    e.press('a', 200);
    e.update(600);
    expect(e.results.map((r) => [r.key, r.outcome]).sort()).toEqual([['a', 'perfect'], ['prayer:turmoil', 'done']]);
    expect(e.index).toBe(2);
    e.press('b', 2000);
    e.update(2400);
    expect(e.results.at(-1)).toMatchObject({ key: 'b', outcome: 'perfect', wrong: 0 });
  });

  it('switching a prayer off again is free and never completes a step', () => {
    const e = make([A, SS, B]);
    e.press('a', 100);
    e.update(600);
    e.press('prayer:soul-split', 700);
    e.update(1200);
    expect(e.index).toBe(2);
    e.press('prayer:soul-split', 1300); // off again
    e.update(1800);
    expect(e.activePrayers.size).toBe(0);
    e.press('b', 2000);
    e.update(2400);
    expect(e.results.at(-1)).toMatchObject({ key: 'b', wrong: 0 });
    expect(e.results.filter((r) => r.key === 'prayer:soul-split').length).toBe(1);
  });
});

describe('incoming attacks', () => {
  const enemy: EnemyConfig = { ...DEFAULT_ENEMY, enabled: true, styles: ['Melee'], pattern: 'cycle', intervalTicks: 5, warningTicks: 3, firstAttackTicks: 4 };

  it('scores Soul Split ticks and prayed attacks, counts unprayed hits', () => {
    const e = make([A, B], { enemy, loop: true });
    expect(e.nextAttack).toMatchObject({ tick: 4, style: 'Melee', revealTick: 1 });
    e.press('prayer:soul-split', 100); // on from tick 1
    e.update(600 * 3); // ticks 1..3 with soul split
    expect(e.prayerStats).toMatchObject({ ticks: 3, soulSplitTicks: 3, attacks: 0 });
    e.press('prayer:deflect-melee', 1900); // tick 4 = attack tick, same tick counts
    e.update(2400);
    expect(e.events.at(-1)).toMatchObject({ kind: 'attack', style: 'Melee', tick: 4, prayed: true, needed: 'deflect-melee' });
    expect(e.prayerStats).toMatchObject({ attacks: 1, prayed: 1, hits: 0, soulSplitTicks: 3 });
    expect(e.nextAttack).toMatchObject({ tick: 9 });
    e.update(600 * 9); // still deflect melee: ticks 5-8 no soul split, attack 9 prayed
    expect(e.prayerStats).toMatchObject({ ticks: 9, attacks: 2, prayed: 2, soulSplitTicks: 3 });
    e.press('prayer:soul-split', 600 * 9 + 10);
    e.update(600 * 14); // attack at 14 lands on soul split → hit
    expect(e.prayerStats).toMatchObject({ attacks: 3, prayed: 2, hits: 1, soulSplitTicks: 7 });
  });

  it('patterns: no-repeat never repeats, streak switches after n, standard book uses protect prayers', () => {
    const e = make([A], { enemy: { ...enemy, styles: ['Melee', 'Magic', 'Ranged'], pattern: 'no-repeat', intervalTicks: 1, firstAttackTicks: 1 }, loop: true });
    const seen: string[] = [];
    for (let t = 1; t <= 30; t++) {
      e.update(600 * t);
      const ev = e.events.filter((x) => x.kind === 'attack');
      if (ev.length) seen.push((ev.at(-1) as { style: string }).style);
      e.events.length = 0;
    }
    expect(seen.length).toBe(30);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);

    const s = make([A], { enemy: { ...enemy, styles: ['Magic', 'Ranged'], pattern: 'streak', streak: 3, intervalTicks: 1, firstAttackTicks: 1 }, loop: true });
    const styles: string[] = [s.nextAttack!.style];
    for (let t = 1; t <= 6; t++) {
      s.update(600 * t);
      styles.push(s.nextAttack!.style);
    }
    expect(styles.slice(0, 6)).toEqual(['Magic', 'Magic', 'Magic', 'Ranged', 'Ranged', 'Ranged']);

    const p = make([A], { enemy, prayerBook: 'Prayers' });
    expect(p.protectionFor('Melee')).toBe('protect-from-melee');
  });
});

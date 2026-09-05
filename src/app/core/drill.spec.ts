import { describe, expect, it } from 'vitest';
import { Drill, DrillSource, DrillTarget, WEAPON_POS, buildPool } from './drill';
import { Keybind } from './models';

const kb = (code: string): Keybind => ({ code, ctrl: false, shift: false, alt: false });

const SOURCES: DrillSource[] = [
  { key: 'ability:sever', kind: 'ability', pos: 0, slot: 0, keybind: kb('Digit1') },
  { key: 'ability:greater-death-swiftness', aliases: ['ability:greater-death-swiftness', 'ability:death-swiftness'], kind: 'ability', pos: 0, slot: 1, keybind: kb('Digit2') },
  { key: 'ability:unbound', kind: 'ability', pos: 0, slot: 2, keybind: null },
  { key: 'prayer:soul-split', kind: 'prayer', pos: 1, slot: 0, keybind: kb('KeyQ') },
  { key: 'ability:tuska', kind: 'ability', pos: 2, slot: 3, keybind: kb('KeyW') },
  { key: 'weapon:omni-guard', kind: 'weapon', pos: WEAPON_POS, slot: 0, keybind: kb('F1') },
];

const ALL = { bars: [true, true, true, true, true], weapons: true, prayers: true, onlyKeys: null };

function target(key: string, code: string, i = 0): DrillTarget {
  return { key, aliases: [key], kind: 'ability', pos: 0, slot: i, bind: ':' + code, keyLabel: code };
}

const A = target('ability:a', 'KeyA', 0);
const B = target('ability:b', 'KeyB', 1);
const C = target('ability:c', 'KeyC', 2);

/** deterministic "random": walks through the given fractions */
function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('buildPool', () => {
  it('takes only keybound slots and keeps their key and label', () => {
    const pool = buildPool(SOURCES, ALL);
    expect(pool.map((t) => t.key)).toEqual(['ability:sever', 'ability:greater-death-swiftness', 'prayer:soul-split', 'ability:tuska', 'weapon:omni-guard']);
    expect(pool[0]).toMatchObject({ pos: 0, slot: 0, bind: ':Digit1', keyLabel: '1' });
  });

  it('respects the bar filter', () => {
    const pool = buildPool(SOURCES, { ...ALL, bars: [true, false, false, false, false] });
    expect(pool.map((t) => t.key)).toEqual(['ability:sever', 'ability:greater-death-swiftness', 'weapon:omni-guard']);
  });

  it('drops weapon switches and prayers when switched off', () => {
    expect(buildPool(SOURCES, { ...ALL, weapons: false }).some((t) => t.pos === WEAPON_POS)).toBe(false);
    expect(buildPool(SOURCES, { ...ALL, prayers: false }).some((t) => t.kind === 'prayer')).toBe(false);
  });

  it('keeps only the rotation entities, matching morph targets through the aliases', () => {
    const pool = buildPool(SOURCES, { ...ALL, onlyKeys: new Set(['ability:death-swiftness', 'ability:tuska', 'ability:not-on-a-bar']) });
    expect(pool.map((t) => t.key)).toEqual(['ability:greater-death-swiftness', 'ability:tuska']);
  });
});

describe('Drill', () => {
  it('refuses an empty pool', () => {
    expect(() => new Drill([], { paceMs: 0, rounds: 0 })).toThrow();
  });

  it('never asks the same entity twice in a row', () => {
    const d = new Drill([A, B, C], { paceMs: 0, rounds: 0 });
    d.start(0);
    let last = d.current!.key;
    for (let i = 0; i < 300; i++) {
      d.press({ bind: d.current!.bind }, i);
      expect(d.current!.key).not.toBe(last);
      last = d.current!.key;
    }
  });

  it('a single-entity pool keeps asking for it instead of getting stuck', () => {
    const d = new Drill([A], { paceMs: 0, rounds: 0 });
    d.start(0);
    d.press({ bind: A.bind }, 10);
    expect(d.current).toBe(A);
    expect(d.hits).toBe(1);
  });

  it('measures the reaction from the prompt to the correct press; a wrong key is a miss that keeps the prompt', () => {
    const d = new Drill([A, B], { paceMs: 0, rounds: 0 }, seq(0));
    d.start(1000);
    expect(d.current).toBe(A);
    expect(d.press({ bind: B.bind }, 1200)).toBe('miss');
    expect(d.current).toBe(A);
    expect(d.misses).toBe(1);
    expect(d.streak).toBe(0);
    expect(d.press({ bind: A.bind }, 1500)).toBe('hit');
    expect(d.reactions).toEqual([500]);
    expect(d.hits).toBe(1);
    expect(d.current).toBe(B);
    expect(d.shownAt).toBe(1500);
  });

  it('the same entity fired from elsewhere counts as a hit', () => {
    const d = new Drill([A, B], { paceMs: 0, rounds: 0 }, seq(0));
    d.start(0);
    expect(d.press({ bind: ':KeyZ', key: 'ability:a' }, 5)).toBe('hit');
  });

  it('waiting for the press: a tick never moves on', () => {
    const d = new Drill([A, B], { paceMs: 0, rounds: 0 }, seq(0));
    d.start(0);
    expect(d.tick(100000)).toBe(false);
    expect(d.current).toBe(A);
    expect(d.misses).toBe(0);
  });

  it('fixed cadence moves on without a press and counts a miss', () => {
    const d = new Drill([A, B], { paceMs: 1200, rounds: 0 }, seq(0));
    d.start(0);
    expect(d.tick(1199)).toBe(false);
    expect(d.remainingMs(1199)).toBe(1);
    expect(d.tick(1200)).toBe(true);
    expect(d.current).toBe(B);
    expect(d.shownAt).toBe(1200);
    expect(d.misses).toBe(1);
    expect(d.round).toBe(2);
    expect(d.summary().targets.find((t) => t.key === 'ability:a')?.timeouts).toBe(1);
  });

  it('a streak survives hits and breaks on a miss; the best one is kept', () => {
    const d = new Drill([A, B], { paceMs: 0, rounds: 0 }, seq(0));
    d.start(0);
    d.press({ bind: d.current!.bind }, 1);
    d.press({ bind: d.current!.bind }, 2);
    d.press({ bind: d.current!.bind }, 3);
    expect(d.streak).toBe(3);
    d.press({ bind: ':Nope' }, 4);
    expect(d.streak).toBe(0);
    expect(d.bestStreak).toBe(3);
  });

  it('finishes after the configured rounds, never when endless', () => {
    const d = new Drill([A, B], { paceMs: 0, rounds: 3 }, seq(0));
    d.start(0);
    d.press({ bind: d.current!.bind }, 1);
    d.press({ bind: d.current!.bind }, 2);
    expect(d.finished).toBe(false);
    d.press({ bind: d.current!.bind }, 3);
    expect(d.finished).toBe(true);
    expect(d.current).toBeNull();
    expect(d.press({ bind: A.bind }, 4)).toBe('ignored');

    const e = new Drill([A, B], { paceMs: 600, rounds: 0 }, seq(0));
    e.start(0);
    for (let i = 1; i <= 100; i++) e.tick(i * 600);
    expect(e.finished).toBe(false);
    expect(e.round).toBe(101);
  });

  it('summary sorts the worst offenders first: miss rate, then the slowest', () => {
    const d = new Drill([A, B, C], { paceMs: 0, rounds: 0 }, seq(0, 0, 0, 0));
    // A up: two wrong keys, then hit after 900 ms
    d.start(0);
    d.press({ bind: B.bind }, 100);
    d.press({ bind: C.bind }, 200);
    d.press({ bind: A.bind }, 900);
    // next is B (rng 0 skips A): hit after 300 ms
    expect(d.current).toBe(B);
    d.press({ bind: B.bind }, 1200);
    // A again: quick hit
    expect(d.current).toBe(A);
    d.press({ bind: A.bind }, 1300);
    // B again: slow hit (A is prompted once more afterwards, unanswered)
    expect(d.current).toBe(B);
    d.press({ bind: B.bind }, 2300);
    const s = d.summary();
    expect(s.hits).toBe(4);
    expect(s.misses).toBe(2);
    expect(s.accuracy).toBe(67);
    expect(s.avgMs).toBe(Math.round((900 + 300 + 100 + 1000) / 4));
    expect(s.targets.map((t) => t.key)).toEqual(['ability:a', 'ability:b']);
    expect(s.targets[0]).toMatchObject({ asked: 3, hits: 2, wrong: 2, misses: 2, missRate: 0.5, avgMs: 500 });
    expect(s.targets[1]).toMatchObject({ asked: 2, hits: 2, misses: 0, missRate: 0, avgMs: 650 });
  });
});

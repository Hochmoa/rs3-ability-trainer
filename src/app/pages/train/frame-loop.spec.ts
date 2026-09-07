/**
 * The Train page's loop against a browser that stops painting. A window behind another window keeps
 * `document.hidden === false` and still receives zero animation frames; the session must keep advancing anyway, which
 * is what these specs drive a real TrainerEngine through.
 */
import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../../public/data/abilities.json';
import { Ability } from '../../core/models';
import { defaultResolvedLoadout } from '../../engine/loadout-resolved';
import { EngineEntity, TICK_MS, TrainerEngine } from '../../engine/trainer-engine';
import { FALLBACK_MS, FRAME_STALL_MS, FrameLoop, FrameLoopDeps, WATCHDOG_MS } from './frame-loop';

const DATA = ABILITIES as unknown as Ability[];

function ability(a: Ability): EngineEntity {
  return {
    key: 'ability:' + a.id, kind: 'ability', id: a.id, name: a.name, icon: a.icon, gcd: a.triggersGcd, style: a.style, abilityType: a.type,
    adrenaline: a.adrenaline ?? 0, cooldownTicks: a.cooldownTicks ?? 0, buffs: [], damageMin: a.damageMin ?? undefined, damageMax: a.damageMax ?? undefined,
  };
}

/** the app's engine with a necromancy rotation, started at 0 */
function engine(): TrainerEngine {
  const catalog = new Map<string, EngineEntity>();
  for (const a of DATA.slice(0, 100)) catalog.set('ability:' + a.id, ability(a));
  const steps = ['touch-of-death', 'soul-sap', 'necromancy'].map((id) => catalog.get('ability:' + id)!);
  for (const s of steps) if (!s) throw new Error('fixture ability missing');
  const l = { ...defaultResolvedLoadout(), style: 'Necromancy' as const, hasConduit: true, abilityDamage: 1000 };
  const e = new TrainerEngine(steps, catalog, { pingMs: 0, jitterMs: 0, abilityQueueing: true, loop: true, fullAdrenaline: true, hitChanceDisabled: true, loadout: l });
  e.random = () => 0.5;
  e.start(0);
  return e;
}

/**
 * A fake browser whose clock only moves when the spec says so. `frames` decides whether a requested animation frame is
 * ever delivered – false is the occluded window that reports itself as visible.
 */
class FakeBrowser {
  now = 0;
  frames = true;
  hidden = false;
  /** the pending animation-frame callback, if the fake delivers frames */
  private pending: ((now: number) => void) | null = null;
  private nextHandle = 1;
  private timers = new Map<number, { fn: () => void; ms: number; due: number }>();
  /** every interval that was started, for the "never two sources at once" check */
  liveIntervals = 0;

  readonly deps: FrameLoopDeps = {
    now: () => this.now,
    requestFrame: (cb) => {
      this.pending = cb;
      return this.nextHandle++;
    },
    cancelFrame: () => (this.pending = null),
    startInterval: (fn, ms) => {
      const h = this.nextHandle++;
      this.timers.set(h, { fn, ms, due: this.now + ms });
      this.liveIntervals++;
      return h;
    },
    stopInterval: (h) => {
      if (this.timers.delete(h)) this.liveIntervals--;
    },
    hidden: () => this.hidden,
  };

  /** runs the clock forward in 10 ms steps, firing the due intervals and (when `frames`) one frame per 16 ms */
  advance(ms: number): void {
    const end = this.now + ms;
    let nextFrame = this.now + 16;
    while (this.now < end) {
      this.now = Math.min(end, this.now + 10);
      for (const [h, t] of [...this.timers]) {
        while (t.due <= this.now) {
          t.due += t.ms;
          if (this.timers.has(h)) t.fn();
        }
      }
      if (this.frames && this.now >= nextFrame) {
        nextFrame = this.now + 16;
        const cb = this.pending;
        this.pending = null;
        cb?.(this.now);
      }
    }
  }
}

describe('FrameLoop – the session survives a browser that stops painting', () => {
  it('drives the engine from the interval when no animation frame arrives, although the page calls itself visible', () => {
    const e = engine();
    const browser = new FakeBrowser();
    browser.frames = false; // occluded window: rAF is requested and never called back
    let ticks = 0;
    const loop = new FrameLoop((now) => {
      ticks++;
      e.update(now);
      e.events.length = 0;
      return e.state === 'running';
    }, browser.deps);
    loop.start();

    browser.advance(3000); // five server ticks
    expect(browser.hidden).toBe(false);
    expect(loop.onFallback).toBe(true);
    // ~100 ms per tick, minus the stall the watchdog waits out first
    expect(ticks).toBeGreaterThan(20);
    expect(e.currentTick(browser.now)).toBe(Math.floor(3000 / TICK_MS));
  });

  it('a key press pending in an unpainted window is processed instead of queued forever', () => {
    const e = engine();
    const browser = new FakeBrowser();
    browser.frames = false;
    const loop = new FrameLoop((now) => {
      e.update(now);
      e.events.length = 0;
      return e.state === 'running';
    }, browser.deps);
    loop.start();

    browser.advance(FRAME_STALL_MS + WATCHDOG_MS * 2);
    const step = e.index;
    e.press('ability:touch-of-death', browser.now);
    browser.advance(TICK_MS * 2);
    expect(e.index).toBe(step + 1);
  });

  it('stops the interval as soon as frames come back and never runs both at once', () => {
    const browser = new FakeBrowser();
    browser.frames = false;
    let both = 0;
    const loop = new FrameLoop(() => {
      // one source only: the watchdog interval plus the fallback interval is two timers, three would be one too many
      if (browser.liveIntervals > 2) both++;
      return true;
    }, browser.deps);
    loop.start();

    browser.advance(1000);
    expect(loop.onFallback).toBe(true);
    browser.frames = true;
    browser.advance(1000);
    expect(loop.onFallback).toBe(false);
    expect(both).toBe(0);

    // and back again when the window is occluded a second time
    browser.frames = false;
    browser.advance(FRAME_STALL_MS + WATCHDOG_MS * 2);
    expect(loop.onFallback).toBe(true);
    loop.stop();
    expect(browser.liveIntervals).toBe(0);
  });

  it('a hidden tab gets the fallback from the visibility event, without waiting for the watchdog', () => {
    const browser = new FakeBrowser();
    browser.frames = false;
    const loop = new FrameLoop(() => true, browser.deps);
    loop.start();
    expect(loop.onFallback).toBe(false); // fresh frame, nothing stalled yet

    browser.hidden = true;
    loop.syncVisibility();
    expect(loop.onFallback).toBe(true);
    expect(FALLBACK_MS).toBeLessThan(TICK_MS); // the fallback still lands on every server tick
    loop.stop();
  });

  it('a tick that reports the session is over stops every timer', () => {
    const browser = new FakeBrowser();
    browser.frames = false;
    let ticks = 0;
    const loop = new FrameLoop(() => ++ticks < 3, browser.deps);
    loop.start();
    browser.advance(2000);
    expect(ticks).toBe(3);
    expect(loop.running).toBe(false);
    expect(browser.liveIntervals).toBe(0);
  });
});

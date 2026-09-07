/**
 * Drives the training session's tick from `requestAnimationFrame` and keeps it running when frames stop arriving.
 *
 * A browser window that sits behind another window is not "hidden": `document.hidden` stays false, `visibilityState`
 * stays "visible" and `hasFocus()` may even be true, yet the browser can deliver zero animation frames. The old loop
 * ran the engine only inside the frame callback and started its interval on `visibilitychange`, so an occluded window
 * queued every key press and never processed one – the session lied without a word of feedback.
 *
 * This loop therefore watches the age of the last animation frame instead of the visibility state: once no frame has
 * arrived for `FRAME_STALL_MS`, an interval drives the tick, and the first frame that comes back stops it again. Only
 * one of the two ever drives the tick, so no timestamp is ticked twice.
 */

/** no animation frame for this long while a session runs = the frames stalled and the interval takes over */
export const FRAME_STALL_MS = 250;
/** how often the fallback interval ticks the engine (a server tick is 600 ms, so this still lands on every one) */
export const FALLBACK_MS = 100;
/** how often the watchdog looks at the age of the last animation frame */
export const WATCHDOG_MS = 100;

/** Everything the loop takes from the environment, so a spec can fake a browser that delivers no frames. */
export interface FrameLoopDeps {
  now: () => number;
  requestFrame: (cb: (now: number) => void) => number;
  cancelFrame: (handle: number) => void;
  startInterval: (fn: () => void, ms: number) => number;
  stopInterval: (handle: number) => void;
  /** a hidden tab never paints: it is treated as stalled at once instead of after `FRAME_STALL_MS` */
  hidden: () => boolean;
}

/** The real browser: animation frames, `window.setInterval` and the document's visibility. */
export function browserFrameLoopDeps(doc: Document): FrameLoopDeps {
  return {
    now: () => performance.now(),
    requestFrame: (cb) => requestAnimationFrame(cb),
    cancelFrame: (h) => cancelAnimationFrame(h),
    startInterval: (fn, ms) => window.setInterval(fn, ms),
    stopInterval: (h) => window.clearInterval(h),
    hidden: () => doc.hidden,
  };
}

export class FrameLoop {
  private raf = 0;
  private watchdog = 0;
  private fallback = 0;
  private lastFrameAt = 0;
  private active = false;

  /**
   * @param tick runs one step of the session and returns whether the loop should keep going
   * @param deps the browser (or a fake one in the specs)
   */
  constructor(
    private readonly tick: (now: number) => boolean,
    private readonly deps: FrameLoopDeps,
  ) {}

  /** whether the interval currently drives the tick because animation frames are missing */
  get onFallback(): boolean {
    return this.fallback !== 0;
  }

  get running(): boolean {
    return this.active;
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.lastFrameAt = this.deps.now();
    this.raf = this.deps.requestFrame(this.onFrame);
    this.watchdog = this.deps.startInterval(this.check, WATCHDOG_MS);
    this.check();
  }

  stop(): void {
    if (!this.active && !this.raf && !this.watchdog && !this.fallback) return;
    this.active = false;
    if (this.raf) this.deps.cancelFrame(this.raf);
    this.raf = 0;
    if (this.watchdog) this.deps.stopInterval(this.watchdog);
    this.watchdog = 0;
    this.stopFallback();
  }

  /** called on `visibilitychange`: a tab that just went hidden gets the fallback without waiting for the watchdog */
  syncVisibility(): void {
    this.check();
  }

  /** the watchdog: does the age of the last frame (or a hidden tab) call for the fallback interval? */
  private readonly check = (): void => {
    if (!this.active) return;
    const stalled = this.deps.hidden() || this.deps.now() - this.lastFrameAt > FRAME_STALL_MS;
    if (stalled) this.startFallback();
    else this.stopFallback();
  };

  private readonly onFrame = (now: number): void => {
    this.raf = 0;
    this.lastFrameAt = now;
    // frames are back: the interval stops before this tick, so the two never drive the engine in the same moment
    this.stopFallback();
    if (!this.active) return;
    if (this.tick(now)) this.raf = this.deps.requestFrame(this.onFrame);
    else this.stop();
  };

  private readonly onFallbackTick = (): void => {
    if (!this.active) return;
    if (!this.tick(this.deps.now())) this.stop();
  };

  private startFallback(): void {
    if (this.fallback) return;
    this.fallback = this.deps.startInterval(this.onFallbackTick, FALLBACK_MS);
  }

  private stopFallback(): void {
    if (!this.fallback) return;
    this.deps.stopInterval(this.fallback);
    this.fallback = 0;
  }
}

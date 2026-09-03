import { StepResult } from '../core/models';

/** One RS3 game tick / server cycle. */
export const TICK_MS = 600;
/** Global cooldown in ticks (1.8 s). */
export const GCD_TICKS = 3;

export interface EngineConfig {
  pingMs: number;
  jitterMs: number;
  /** In-game "Ability queueing" setting. On: a press during the GCD is queued and fires when the GCD ends. Off: it is ignored. */
  abilityQueueing: boolean;
  loop: boolean;
}

export type EngineEvent =
  /** ability accepted; fires at fireTick (queued during the GCD, or cast on the tick it was processed) */
  | { kind: 'queued'; abilityId: string; expected: string; fireTick: number; marginMs: number }
  /** the expected ability fired – step done */
  | { kind: 'fired'; result: StepResult }
  /** a different ability fired (started a GCD) – step not done */
  | { kind: 'wrong-fired'; abilityId: string; expected: string; tick: number }
  /** queueing off: press of the expected ability during the GCD, ignored */
  | { kind: 'too-early'; abilityId: string; ticksEarly: number }
  /** queueing off: press of a different ability during the GCD, ignored */
  | { kind: 'wrong'; abilityId: string; expected: string }
  | { kind: 'finished' };

interface PendingInput {
  abilityId: string;
  pressedAt: number;
  arrival: number;
}

/** The single queue slot of the game: one ability waiting to be cast at `tick`. */
interface Pending {
  abilityId: string;
  tick: number;
  arrival: number;
  /** in-game bypass: the ability that stays queued for the next GCD end after this one casts */
  bypassed?: Pending;
}

/**
 * Pure timing model of the trainer. All times are milliseconds on one monotonic clock
 * (performance.now()); the caller feeds `now` into press()/update().
 *
 * Server tick k happens at t0 + k * TICK_MS. A key press at client time t reaches the
 * server at t + ping (+ jitter) and is processed at the first tick at or after that
 * (`tickP`). The last cast started the GCD at `castTick`; abilities may be cast again
 * from `gcdEnd = castTick + GCD_TICKS`.
 *
 * - tickP > gcdEnd (GCD over): the ability casts at tickP. Expected ability → late by
 *   (tickP − gcdEnd) ticks, or perfect if there was no GCD.
 * - tickP == gcdEnd (press in the last GCD tick): casts exactly at gcdEnd → perfect.
 * - tickP < gcdEnd: queueing off → ignored ("too early" / "wrong"). Queueing on →
 *   queued, casts at gcdEnd → perfect. A later press replaces the queued ability,
 *   except the in-game bypass: a different ability pressed on the last tick casts
 *   instead, and the queued one stays queued for the next GCD end.
 * - A wrong ability that casts starts a GCD like any other; the step is not advanced.
 */
export class TrainerEngine {
  state: 'idle' | 'running' | 'finished' = 'idle';
  t0 = 0;
  index = 0;
  castTick: number | null = null;
  results: StepResult[] = [];
  /** Events since the last drain; the UI empties this array. */
  readonly events: EngineEvent[] = [];
  random: () => number = Math.random;

  private inflight: PendingInput[] = [];
  private pending: Pending | null = null;
  private tooEarly = 0;
  private wrong = 0;

  constructor(readonly steps: string[], public config: EngineConfig) {}

  start(now: number): void {
    this.t0 = now;
    this.index = 0;
    this.castTick = null;
    this.results = [];
    this.inflight = [];
    this.pending = null;
    this.tooEarly = 0;
    this.wrong = 0;
    this.events.length = 0;
    this.state = 'running';
  }

  stop(): void {
    if (this.state === 'running') this.state = 'finished';
  }

  get currentAbility(): string | undefined {
    return this.steps[this.index];
  }

  /** Ability waiting in the queue slot, if any. */
  get queuedAbility(): string | null {
    return this.pending?.abilityId ?? null;
  }

  /** True when the expected ability is queued / about to cast. */
  get isQueued(): boolean {
    return this.pending !== null && this.pending.abilityId === this.currentAbility;
  }

  get gcdEndTick(): number | null {
    return this.castTick === null ? null : this.castTick + GCD_TICKS;
  }

  tickTime(tick: number): number {
    return this.t0 + tick * TICK_MS;
  }

  /** Tick at which an input arriving at the server at `time` is processed. */
  tickOf(time: number): number {
    return Math.ceil((time - this.t0) / TICK_MS);
  }

  /** 0..1 progress of the current tick. */
  tickPhase(now: number): number {
    const p = ((now - this.t0) % TICK_MS) / TICK_MS;
    return p < 0 ? 0 : p;
  }

  /** 0..1 progress of the GCD; 1 when no GCD is running. */
  gcdPhase(now: number): number {
    if (this.castTick === null) return 1;
    const p = (now - this.tickTime(this.castTick)) / (GCD_TICKS * TICK_MS);
    return Math.max(0, Math.min(1, p));
  }

  gcdRemainingMs(now: number): number {
    const end = this.gcdEndTick;
    return end === null ? 0 : Math.max(0, this.tickTime(end) - now);
  }

  press(abilityId: string, now: number): void {
    if (this.state !== 'running') return;
    const jitter = this.config.jitterMs > 0 ? (this.random() * 2 - 1) * this.config.jitterMs : 0;
    const arrival = now + Math.max(0, this.config.pingMs + jitter);
    this.inflight.push({ abilityId, pressedAt: now, arrival });
  }

  update(now: number): void {
    if (this.state !== 'running') return;
    this.inflight.sort((a, b) => a.arrival - b.arrival);
    // interleave casts and inputs in time order
    for (;;) {
      const next = this.inflight[0];
      const castAt = this.pending ? this.tickTime(this.pending.tick) : Infinity;
      if (castAt <= now && (!next || castAt <= next.arrival)) {
        this.cast();
        if (this.state !== 'running') return;
      } else if (next && next.arrival <= now) {
        this.inflight.shift();
        this.handle(next);
      } else {
        break;
      }
    }
  }

  private handle(input: PendingInput): void {
    const expected = this.steps[this.index];
    const tickP = this.tickOf(input.arrival);
    const gcdEnd = this.gcdEndTick;

    if (gcdEnd === null || tickP > gcdEnd) {
      // no GCD running when the input is processed: cast on that tick
      this.accept(input, tickP, expected);
      return;
    }
    if (tickP === gcdEnd) {
      // last tick of the GCD: casts exactly when the GCD ends
      if (this.pending && this.pending.abilityId !== input.abilityId && this.config.abilityQueueing) {
        // bypass: the pressed ability casts now, the queued one waits for the next GCD end
        const queued = this.pending;
        this.accept(input, gcdEnd, expected);
        this.pending!.bypassed = queued;
      } else {
        this.accept(input, gcdEnd, expected);
      }
      return;
    }
    // earlier during the GCD
    if (!this.config.abilityQueueing) {
      if (input.abilityId === expected) {
        this.tooEarly++;
        this.events.push({ kind: 'too-early', abilityId: input.abilityId, ticksEarly: gcdEnd - tickP });
      } else {
        this.wrong++;
        this.events.push({ kind: 'wrong', abilityId: input.abilityId, expected });
      }
      return;
    }
    if (this.pending?.abilityId === input.abilityId) return; // already queued – repeated presses change nothing
    this.accept(input, gcdEnd, expected);
  }

  private accept(input: PendingInput, tick: number, expected: string): void {
    this.pending = { abilityId: input.abilityId, tick, arrival: input.arrival };
    const gcdEnd = this.gcdEndTick;
    const marginMs = gcdEnd === null ? 0 : this.tickTime(gcdEnd) - input.arrival;
    this.events.push({ kind: 'queued', abilityId: input.abilityId, expected, fireTick: tick, marginMs });
  }

  private cast(): void {
    const p = this.pending!;
    this.pending = p.bypassed ? { ...p.bypassed, tick: p.tick + GCD_TICKS } : null;
    const expected = this.steps[this.index];
    const gcdEnd = this.gcdEndTick;
    this.castTick = p.tick;

    if (p.abilityId !== expected) {
      this.wrong++;
      this.events.push({ kind: 'wrong-fired', abilityId: p.abilityId, expected, tick: p.tick });
      return;
    }
    const lateTicks = gcdEnd === null ? 0 : Math.max(0, p.tick - gcdEnd);
    const result: StepResult = {
      step: this.index,
      abilityId: expected,
      outcome: lateTicks ? 'late' : 'perfect',
      lateTicks,
      offsetMs: gcdEnd === null ? 0 : Math.round(Math.abs(this.tickTime(gcdEnd) - p.arrival)),
      tooEarly: this.tooEarly,
      wrong: this.wrong,
      firedAtTick: p.tick,
    };
    this.results.push(result);
    this.events.push({ kind: 'fired', result });
    this.tooEarly = 0;
    this.wrong = 0;
    this.index++;
    if (this.index >= this.steps.length) {
      if (this.config.loop) {
        this.index = 0;
      } else {
        this.state = 'finished';
        this.events.push({ kind: 'finished' });
      }
    }
  }
}

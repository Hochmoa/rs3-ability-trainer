import { StepResult } from '../core/models';

/** One RS3 game tick / server cycle. */
export const TICK_MS = 600;
/** Global cooldown in ticks (1.8 s). */
export const GCD_TICKS = 3;

export interface EngineConfig {
  pingMs: number;
  jitterMs: number;
  queueWindowTicks: number;
  loop: boolean;
}

export type EngineEvent =
  | { kind: 'queued'; abilityId: string; fireTick: number; marginMs: number }
  | { kind: 'fired'; result: StepResult }
  | { kind: 'too-early'; abilityId: string; ticksEarly: number }
  | { kind: 'wrong'; abilityId: string; expected: string }
  | { kind: 'finished' };

interface PendingInput {
  abilityId: string;
  pressedAt: number;
  arrival: number;
}

interface PendingFire {
  tick: number;
  outcome: 'perfect' | 'late';
  lateTicks: number;
  offsetMs: number;
}

/**
 * Pure timing model of the trainer. All times are milliseconds on one monotonic clock
 * (performance.now()); the caller feeds `now` into press()/update().
 *
 * Server tick k happens at t0 + k * TICK_MS. A key press at client time t reaches the
 * server at t + ping (+ jitter) and is processed at the first tick at or after that.
 * The ability that fired last started the GCD at castTick; the next one may fire at
 * castTick + GCD_TICKS. Presses processed within the queue window before that tick are
 * queued and fire exactly then ("perfect"); earlier presses are ignored ("too early");
 * later presses fire at the tick they were processed ("late by n ticks").
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
  private pendingFire: PendingFire | null = null;
  private tooEarly = 0;
  private wrong = 0;

  constructor(readonly steps: string[], public config: EngineConfig) {}

  start(now: number): void {
    this.t0 = now;
    this.index = 0;
    this.castTick = null;
    this.results = [];
    this.inflight = [];
    this.pendingFire = null;
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

  get isQueued(): boolean {
    return this.pendingFire !== null;
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
    while (this.inflight.length && this.inflight[0].arrival <= now) {
      this.handle(this.inflight.shift()!);
    }
    if (this.pendingFire && now >= this.tickTime(this.pendingFire.tick)) {
      this.fire();
    }
  }

  private handle(input: PendingInput): void {
    const expected = this.steps[this.index];
    if (input.abilityId !== expected) {
      this.wrong++;
      this.events.push({ kind: 'wrong', abilityId: input.abilityId, expected });
      return;
    }
    if (this.pendingFire) return; // already queued – repeated presses change nothing
    const tickP = this.tickOf(input.arrival);
    const gcdEnd = this.gcdEndTick;
    if (gcdEnd === null) {
      this.pendingFire = { tick: tickP, outcome: 'perfect', lateTicks: 0, offsetMs: 0 };
      this.events.push({ kind: 'queued', abilityId: input.abilityId, fireTick: tickP, marginMs: 0 });
    } else if (tickP <= gcdEnd) {
      const earliest = gcdEnd - this.config.queueWindowTicks + 1;
      if (tickP >= earliest) {
        const marginMs = this.tickTime(gcdEnd) - input.arrival;
        this.pendingFire = { tick: gcdEnd, outcome: 'perfect', lateTicks: 0, offsetMs: marginMs };
        this.events.push({ kind: 'queued', abilityId: input.abilityId, fireTick: gcdEnd, marginMs });
      } else {
        this.tooEarly++;
        this.events.push({ kind: 'too-early', abilityId: input.abilityId, ticksEarly: earliest - tickP });
      }
    } else {
      this.pendingFire = {
        tick: tickP,
        outcome: 'late',
        lateTicks: tickP - gcdEnd,
        offsetMs: input.arrival - this.tickTime(gcdEnd),
      };
    }
  }

  private fire(): void {
    const pf = this.pendingFire!;
    this.pendingFire = null;
    const result: StepResult = {
      step: this.index,
      abilityId: this.steps[this.index],
      outcome: pf.outcome,
      lateTicks: pf.lateTicks,
      offsetMs: Math.round(pf.offsetMs),
      tooEarly: this.tooEarly,
      wrong: this.wrong,
      firedAtTick: pf.tick,
    };
    this.results.push(result);
    this.events.push({ kind: 'fired', result });
    this.castTick = pf.tick;
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

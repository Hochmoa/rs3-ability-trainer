/**
 * The session trace: everything a training session did, in order, with the engine's state at every input and
 * at every decision the engine took. Martin (9 Sep 2026): "wenn was spinnt sag ich 'schau die letzte interaction
 * an'". The trace is what gets looked at then: it is kept in this browser (the last few) and, signed in, uploaded
 * with the account (session_traces), where tools/trace-report.py turns it into a readable timeline.
 *
 * What goes in: the setup, the rotation's steps, the loadout and the bars as the session started; then every
 * press (key or click, what it resolved to), every engine event (fired, wrong, queued, cooldown, requirement,
 * hit …), every gear change while training, every feedback line, and the end. Inputs and the decisive engine
 * events carry a state snapshot (TrainerEngine.debugState): step, adrenaline, GCD, wield, buffs, stacks, spirits,
 * cooldowns, the held stall, the channel, the queue. Hits and attacks do not, they are many and change nothing
 * the snapshot of the next input would not show.
 */
import { ActionBarData, EnemyConfig, Loadout, Prebuild, RotationStep, Settings } from './models';

/** compact engine state (TrainerEngine.debugState) */
export interface EngineDebugState {
  tick: number;
  step: number;
  expected: string | null;
  adrenaline: number;
  gcdEnd: number | null;
  castTick: number | null;
  busyUntil: number | null;
  settleUntil: number | null;
  wield: { mainHand: string | null; offHand: string | null; twoHand: string | null };
  queued: string | null;
  inflight: string[];
  held: { key: string; tick: number } | null;
  channel: { key: string; endTick: number; hits: number; hitsDone: number } | null;
  /** [id, stacks, endTick] */
  buffs: [string, number, number | null][];
  /** [spirit, endTick] */
  spirits: [string, number][];
  /** [key, readyTick] for everything still cooling down */
  cooldowns: [string, number][];
  /** [key, readyTicks[]] for charges still coming back */
  charges: [string, number[]][];
  prayers: string[];
  targetHp: number;
  damageDealt: number;
}

export interface TraceEvent {
  /** ms since the session started */
  t: number;
  tick: number;
  kind: string;
  /** engine event / input details */
  [key: string]: unknown;
  state?: EngineDebugState;
}

export interface SessionTrace {
  id: string;
  build: string;
  startedAt: number;
  endedAt: number | null;
  reason: 'finished' | 'stopped' | 'stuck' | null;
  setup: { boss: string; name: string; style: string };
  rotation: { id: string; name: string; chained: boolean };
  steps: RotationStep[];
  settings: Settings;
  loadout: Loadout;
  bars: ActionBarData;
  prebuild: Prebuild | null;
  enemy: EnemyConfig | null;
  /** the live equipment + backpack when the session ended (weapon switches, drunk potions) */
  liveAtEnd: { equipment: Loadout['equipment']; inventory: Loadout['inventory'] } | null;
  events: TraceEvent[];
}

/** engine events that carry a state snapshot: they are the decisions worth checking */
const DECISIVE = new Set(['fired', 'wrong-fired', 'stalled', 'too-early', 'wrong', 'no-adrenaline', 'on-cooldown', 'requirement', 'channel-cancelled', 'wrong-weapon', 'weapon', 'prayer', 'wrong-book', 'recast', 'missed', 'auto', 'auto-attack', 'stuck', 'queued', 'unqueued', 'cooldown-reset', 'killed', 'finished']);
/** a runaway session (Revolution on a dummy for an hour) must not fill the storage */
export const TRACE_EVENT_CAP = 6000;

export class TraceRecorder {
  readonly trace: SessionTrace;
  private readonly t0: number;
  private lastFeedback = '';

  constructor(meta: Omit<SessionTrace, 'id' | 'endedAt' | 'reason' | 'liveAtEnd' | 'events'>, now: number) {
    this.t0 = now;
    this.trace = { ...meta, id: crypto.randomUUID(), endedAt: null, reason: null, liveAtEnd: null, events: [] };
  }

  /** a press: `key` is the entity key it resolved to, `source` how it came in ("key F1", "click", "tap", "note") */
  input(key: string, source: string, now: number, state: EngineDebugState): void {
    this.push({ t: this.ms(now), tick: state.tick, kind: 'input', key, source, state });
  }

  /** a press the bars could not resolve (an unbound key): worth knowing when "nothing happened" */
  unbound(label: string, now: number, tick: number): void {
    this.push({ t: this.ms(now), tick, kind: 'unbound', label });
  }

  event(ev: { kind: string } & Record<string, unknown>, now: number, tick: number, state: (() => EngineDebugState) | null): void {
    const entry: TraceEvent = { t: this.ms(now), tick, ...ev };
    if (state && DECISIVE.has(ev.kind)) entry.state = state();
    this.push(entry);
  }

  feedback(text: string, cls: string | undefined, now: number, tick: number): void {
    if (text === this.lastFeedback) return;
    this.lastFeedback = text;
    this.push({ t: this.ms(now), tick, kind: 'feedback', text, cls: cls ?? '' });
  }

  /** a click in the gear panel while training: wield / drink / wear / take off, with what the backpack holds after it */
  gear(action: string, item: string, now: number, tick: number, inventory: Loadout['inventory'], state: EngineDebugState): void {
    this.push({ t: this.ms(now), tick, kind: 'gear', action, item, inventory: inventory.map((r) => (r ? r.kind + ':' + r.id : null)), state });
  }

  end(reason: SessionTrace['reason'], now: number, live: SessionTrace['liveAtEnd']): SessionTrace {
    this.trace.endedAt = Date.now();
    this.trace.reason = reason;
    this.trace.liveAtEnd = live;
    this.push({ t: this.ms(now), tick: -1, kind: 'end', reason });
    return this.trace;
  }

  private push(e: TraceEvent): void {
    if (this.trace.events.length >= TRACE_EVENT_CAP) return;
    this.trace.events.push(e);
  }

  private ms(now: number): number {
    return Math.round(now - this.t0);
  }
}

/** "Nex · solo ranged, Phase 1, 9 Sep 14:02, 312 events" for the Settings page */
export function traceSummary(t: SessionTrace): string {
  const when = new Date(t.startedAt);
  const stamp = when.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const title = [t.setup.boss, t.setup.name].filter(Boolean).join(' · ');
  return [title, t.rotation.name, stamp, t.events.length + ' events' + (t.reason ? ', ' + t.reason : '')].filter(Boolean).join(' · ');
}

import { AbilityType, DEFAULT_LOADOUT, EntityKind, Loadout, SPEC_KEY, StepResult, Style4, WeaponType, isStyle4 } from '../core/models';

/** One RS3 game tick / server cycle. */
export const TICK_MS = 600;
/** Global cooldown in ticks (1.8 s). */
export const GCD_TICKS = 3;

export interface EngineConfig {
  pingMs: number;
  jitterMs: number;
  /** In-game "Ability queueing" setting. On: a press during the GCD is queued and casts when the GCD ends. Off: it is ignored. */
  abilityQueueing: boolean;
  loop: boolean;
  loadout: Loadout;
  /** wielded weapon at session start and the weapon type per style (2h / dual wield / one-hand + shield) */
  weaponSetup?: { start: Style4; types: Record<Style4, WeaponType> };
}

export type UsableReason = 'ok' | 'weapon' | 'equipment' | 'adrenaline' | 'cooldown';

/** A status effect an entity applies when it casts / activates. */
export interface EngineBuff {
  id: string;
  name: string;
  kind: 'Buff' | 'Debuff';
  on: 'self' | 'target';
  icon: string | null;
  /** null = until the session ends (prayers) */
  durationTicks: number | null;
}

/** Everything the engine needs to know about a pressable thing (ability, prayer, potion). */
export interface EngineEntity {
  key: string;
  kind: EntityKind;
  name: string;
  icon: string;
  /** true for abilities that start / obey the global cooldown */
  gcd: boolean;
  abilityType?: AbilityType;
  /** +gain / -cost in percent */
  adrenaline: number;
  /** internal cooldown after use */
  cooldownTicks: number;
  /** group name for shared cooldowns (adrenaline potions) */
  sharedCooldown?: string;
  adrenalineOverTime?: { amount: number; ticks: number };
  buffs: EngineBuff[];
  /** abilities: combat style ("Melee", ..., "Defence", "Constitution") */
  style?: string;
  /** abilities: wiki equipment requirement ("Any", "Two-handed", "Dual wield", "Shield", ...) */
  equipment?: string;
  /** weapon-switch entities: the style wielded after the switch */
  weapon?: { style: Style4 };
  /** rotation steps only: PvME "+" (0) / "2t" (2) – expected this many ticks after the previous input's tick */
  offsetTicks?: number;
  /** rotation steps only: free text from an imported rotation, skipped automatically */
  isNote?: boolean;
}

export interface ActiveBuff extends EngineBuff {
  startTick: number;
  endTick: number | null;
  sourceKey: string;
}

export type EngineEvent =
  /** entity accepted; casts at fireTick (queued during the GCD, or on the tick it was processed) */
  | { kind: 'queued'; key: string; expected: string; fireTick: number; marginMs: number }
  /** the expected step finished – GCD ability cast or off-GCD thing activated */
  | { kind: 'fired'; result: StepResult }
  /** something other than the expected step was cast / activated */
  | { kind: 'wrong-fired'; key: string; expected: string; tick: number }
  /** queueing off: press of the expected ability during the GCD, ignored */
  | { kind: 'too-early'; key: string; ticksEarly: number }
  /** queueing off: press of another ability during the GCD, ignored */
  | { kind: 'wrong'; key: string; expected: string }
  /** not enough adrenaline for the ability */
  | { kind: 'no-adrenaline'; key: string; need: number; have: number }
  /** entity still on its own (or shared) cooldown */
  | { kind: 'on-cooldown'; key: string; readyInTicks: number }
  /** off-GCD steps skipped because the next GCD ability cast first */
  | { kind: 'missed'; keys: string[] }
  /** ability needs another weapon style / weapon type – ignored like in the game */
  | { kind: 'wrong-weapon'; key: string; reason: 'weapon' | 'equipment' }
  /** weapon switched */
  | { kind: 'weapon'; style: Style4 }
  | { kind: 'finished' };

interface PendingInput {
  key: string;
  pressedAt: number;
  arrival: number;
}

/** The single queue slot of the game: one ability waiting to be cast at `tick`. */
interface Pending {
  key: string;
  tick: number;
  arrival: number;
  /** in-game bypass: the ability that stays queued for the next GCD end after this one casts */
  bypassed?: Pending;
  /** a "waiting for adrenaline / cooldown" event was already emitted */
  notified?: boolean;
}

/**
 * Pure timing + resource model of the trainer. All times are milliseconds on one monotonic
 * clock (performance.now()); the caller feeds `now` into press()/update().
 *
 * Ticks: server tick k happens at t0 + k * TICK_MS. A key press at client time t reaches the
 * server at t + ping (+ jitter) and is processed at the first tick at or after that (`tickP`).
 *
 * GCD abilities: the last cast started the GCD at `castTick`; the next cast is possible from
 * `gcdEnd = castTick + GCD_TICKS`. Press processed after the GCD → casts on that tick (late).
 * Press processed on the last GCD tick → casts at gcdEnd (perfect). Earlier: queueing off →
 * ignored; queueing on → queued for gcdEnd (perfect). A wrong ability that casts starts a GCD
 * like any other. Adrenaline and the ability's own cooldown are checked when it would cast:
 * queueing on keeps it queued until it is possible, queueing off drops the press.
 *
 * Off-GCD steps (prayers, potions, Surge, ...) activate on the tick they are processed. They
 * belong to the group of off-GCD steps directly before the next GCD ability and may be pressed
 * in any order inside that group; whatever is still open when that ability casts is "missed".
 */
export class TrainerEngine {
  state: 'idle' | 'running' | 'finished' = 'idle';
  t0 = 0;
  /** first step that is not done yet */
  index = 0;
  castTick: number | null = null;
  adrenaline = 0;
  weapon: Style4 = 'Melee';
  results: StepResult[] = [];
  buffs: ActiveBuff[] = [];
  /** Events since the last drain; the UI empties this array. */
  readonly events: EngineEvent[] = [];
  random: () => number = Math.random;

  private inflight: PendingInput[] = [];
  private pending: Pending | null = null;
  private done = new Set<number>();
  private tooEarly = 0;
  private wrong = 0;
  private readyTick = new Map<string, number>();
  private overTime: { key: string; perTick: number; untilTick: number }[] = [];
  private lastTick = 0;
  /** tick of the last input that counted (cast or off-GCD activation) – reference for "+" / "2t" companions */
  private lastInputTick: number | null = null;

  constructor(
    readonly steps: EngineEntity[],
    readonly catalog: Map<string, EngineEntity>,
    public config: EngineConfig,
  ) {}

  get maxAdrenaline(): number {
    const l = this.config.loadout ?? DEFAULT_LOADOUT;
    return 100 + (l.heightenedSenses ? 10 : 0) + (l.vestmentsOfHavoc ? 20 : 0);
  }

  start(now: number): void {
    this.t0 = now;
    this.index = 0;
    this.castTick = null;
    this.weapon = this.config.weaponSetup?.start ?? 'Melee';
    this.adrenaline = Math.max(0, Math.min(this.maxAdrenaline, this.config.loadout?.startAdrenaline ?? 0));
    this.results = [];
    this.buffs = [];
    this.inflight = [];
    this.pending = null;
    this.done.clear();
    this.tooEarly = 0;
    this.wrong = 0;
    this.readyTick.clear();
    this.overTime = [];
    this.lastTick = 0;
    this.lastInputTick = null;
    this.events.length = 0;
    this.state = 'running';
  }

  stop(): void {
    if (this.state === 'running') this.state = 'finished';
  }

  /** The step the player should do next (first open step). */
  get currentStep(): EngineEntity | undefined {
    return this.steps[this.index];
  }

  /** The next GCD ability the rotation expects. */
  get expectedAbility(): EngineEntity | undefined {
    for (let i = this.index; i < this.steps.length; i++) {
      if (this.steps[i].gcd) return this.steps[i];
    }
    return undefined;
  }

  isDone(stepIndex: number): boolean {
    return this.done.has(stepIndex);
  }

  /** Entity key waiting in the queue slot, if any. */
  get queuedKey(): string | null {
    return this.pending?.key ?? null;
  }

  /** True when the expected ability is queued / about to cast. */
  get isQueued(): boolean {
    return this.pending !== null && this.pending.key === this.expectedAbility?.key;
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

  currentTick(now: number): number {
    return Math.floor((now - this.t0) / TICK_MS);
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

  get weaponType(): WeaponType {
    return this.config.weaponSetup?.types[this.weapon] ?? 'two-handed';
  }

  /** Why an entity could not be used at `tick` (weapon and equipment first, like the greyed-out bar in the game). */
  usable(key: string, tick: number): UsableReason {
    const e = this.catalog.get(key);
    if (!e) return 'ok';
    if (e.kind === 'ability' || e.kind === 'spec') {
      // utility abilities off the GCD (Surge, Escape, Dive) work with any weapon; only real casts need the style
      if (e.gcd && e.style && isStyle4(e.style) && e.style !== this.weapon) return 'weapon';
      const eq = (e.equipment ?? 'Any').toLowerCase();
      const t = this.weaponType;
      if (eq.startsWith('two-handed') && t !== 'two-handed') return 'equipment';
      if (eq.startsWith('dual wield') && t !== 'dual-wield') return 'equipment';
      if (eq.startsWith('shield') && t !== 'shield') return 'equipment';
    }
    if (this.cooldownLeft(key, tick) > 0) return 'cooldown';
    if (e.adrenaline < 0 && this.adrenaline < -e.adrenaline) return 'adrenaline';
    return 'ok';
  }

  /** Ticks until `key` is off its own / shared cooldown at `tick` (0 = ready). */
  cooldownLeft(key: string, tick: number): number {
    const e = this.catalog.get(key);
    let ready = this.readyTick.get(key) ?? 0;
    if (e?.sharedCooldown) ready = Math.max(ready, this.readyTick.get('shared:' + e.sharedCooldown) ?? 0);
    return Math.max(0, ready - tick);
  }

  press(key: string, now: number): void {
    if (this.state !== 'running') return;
    const jitter = this.config.jitterMs > 0 ? (this.random() * 2 - 1) * this.config.jitterMs : 0;
    const arrival = now + Math.max(0, this.config.pingMs + jitter);
    this.inflight.push({ key, pressedAt: now, arrival });
  }

  update(now: number): void {
    if (this.state !== 'running') return;
    this.inflight.sort((a, b) => a.arrival - b.arrival);
    for (;;) {
      const next = this.inflight[0];
      const castAt = this.pending ? this.tickTime(this.pending.tick) : Infinity;
      const tickAt = this.tickTime(this.lastTick + 1);
      // advance server ticks (over-time adrenaline, buff expiry) before anything scheduled later
      if (tickAt <= now && tickAt <= castAt && (!next || tickAt <= next.arrival)) {
        this.advanceTick(this.lastTick + 1);
      } else if (castAt <= now && (!next || castAt <= next.arrival)) {
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

  // ---------------------------------------------------------------- input handling

  private handle(input: PendingInput): void {
    if (input.key === SPEC_KEY) {
      // the generic special-attack slot fires whatever spec the wielded weapon has; the rotation says which one
      const spec = this.steps.find((s, i) => i >= this.index && !this.done.has(i) && s.kind === 'spec' && s.style === this.weapon);
      if (spec) input = { ...input, key: spec.key };
    }
    const entity = this.catalog.get(input.key);
    if (!entity) return;
    const tickP = this.tickOf(input.arrival);
    const gear = this.usable(entity.key, tickP);
    if (gear === 'weapon' || gear === 'equipment') {
      this.wrong++;
      this.events.push({ kind: 'wrong-weapon', key: entity.key, reason: gear });
      return;
    }
    if (!entity.gcd) {
      this.handleOffGcd(entity, tickP);
      return;
    }
    const expected = this.expectedAbility?.key ?? '';
    const gcdEnd = this.gcdEndTick;

    if (gcdEnd === null || tickP > gcdEnd) {
      this.accept(input, tickP, expected);
      return;
    }
    if (tickP === gcdEnd) {
      if (this.pending && this.pending.key !== input.key && this.config.abilityQueueing) {
        const queued = this.pending;
        this.accept(input, gcdEnd, expected);
        if (this.pending) this.pending.bypassed = queued;
      } else {
        this.accept(input, gcdEnd, expected);
      }
      return;
    }
    // earlier during the GCD
    if (!this.config.abilityQueueing) {
      if (input.key === expected) {
        this.tooEarly++;
        this.events.push({ kind: 'too-early', key: input.key, ticksEarly: gcdEnd - tickP });
      } else {
        this.wrong++;
        this.events.push({ kind: 'wrong', key: input.key, expected });
      }
      return;
    }
    if (this.pending?.key === input.key) return; // already queued – repeated presses change nothing
    this.accept(input, gcdEnd, expected);
  }

  /** Queueing off: check adrenaline / cooldown now; queueing on: the cast waits until possible. */
  private accept(input: PendingInput, tick: number, expected: string): void {
    const entity = this.catalog.get(input.key)!;
    if (!this.config.abilityQueueing) {
      const cd = this.cooldownLeft(entity.key, tick);
      if (cd > 0) {
        this.countWrongPress(entity.key, expected);
        this.events.push({ kind: 'on-cooldown', key: entity.key, readyInTicks: cd });
        return;
      }
      if (entity.adrenaline < 0 && this.adrenaline < -entity.adrenaline) {
        this.countWrongPress(entity.key, expected);
        this.events.push({ kind: 'no-adrenaline', key: entity.key, need: -entity.adrenaline, have: this.adrenaline });
        return;
      }
    }
    this.pending = { key: entity.key, tick, arrival: input.arrival };
    const gcdEnd = this.gcdEndTick;
    const marginMs = gcdEnd === null ? 0 : this.tickTime(gcdEnd) - input.arrival;
    this.events.push({ kind: 'queued', key: entity.key, expected, fireTick: tick, marginMs });
  }

  private countWrongPress(key: string, expected: string): void {
    if (key === expected) this.tooEarly++;
    else this.wrong++;
  }

  private handleOffGcd(entity: EngineEntity, tick: number): void {
    const cd = this.cooldownLeft(entity.key, tick);
    if (cd > 0) {
      this.wrong++;
      this.events.push({ kind: 'on-cooldown', key: entity.key, readyInTicks: cd });
      return;
    }
    // does it satisfy an open off-GCD step in the current group?
    let stepIndex = this.openOffGcdStep(this.index, entity.key);
    let ref = this.lastInputTick;
    // "bloat + vulnbomb": the companion may arrive on the same tick, before the ability itself casts
    if (stepIndex < 0 && this.pending && tick >= this.pending.tick) {
      const j = this.steps.findIndex((s, i) => i >= this.index && s.gcd && s.key === this.pending!.key);
      if (j >= 0) {
        stepIndex = this.openOffGcdStep(j + 1, entity.key);
        ref = this.pending.tick;
      }
    }
    this.activate(entity, tick);
    if (stepIndex < 0) {
      this.wrong++;
      this.events.push({ kind: 'wrong-fired', key: entity.key, expected: this.currentStep?.key ?? '', tick });
      return;
    }
    this.done.add(stepIndex);
    const step = this.steps[stepIndex];
    let outcome: StepResult['outcome'] = 'done';
    let deviation = 0;
    if (step.offsetTicks !== undefined && ref !== null) {
      deviation = tick - (ref + step.offsetTicks);
      outcome = deviation === 0 ? 'perfect' : deviation > 0 ? 'late' : 'early';
    }
    this.lastInputTick = Math.max(tick, this.lastInputTick ?? 0);
    const result: StepResult = {
      step: stepIndex,
      key: entity.key,
      name: entity.name,
      kind: entity.kind,
      outcome,
      lateTicks: deviation,
      offsetMs: 0,
      tooEarly: 0,
      wrong: 0,
      firedAtTick: tick,
      adrenaline: this.adrenaline,
    };
    this.results.push(result);
    this.events.push({ kind: 'fired', result });
    this.advanceIndex();
  }

  /** First open off-GCD step with `key` in the group starting at `from` (stops at the next GCD ability). */
  private openOffGcdStep(from: number, key: string): number {
    for (let i = from; i < this.steps.length; i++) {
      const s = this.steps[i];
      if (s.gcd) break;
      if (!this.done.has(i) && !s.isNote && s.key === key) return i;
    }
    return -1;
  }

  // ---------------------------------------------------------------- casting

  private cast(): void {
    const p = this.pending!;
    const entity = this.catalog.get(p.key)!;
    // the weapon may have changed since the press: the queued ability just fails, like in the game
    const gear = this.usable(entity.key, p.tick);
    if (gear === 'weapon' || gear === 'equipment') {
      this.pending = p.bypassed ? { ...p.bypassed, tick: p.tick } : null;
      this.wrong++;
      this.events.push({ kind: 'wrong-weapon', key: entity.key, reason: gear });
      return;
    }
    // queueing on: wait until adrenaline and cooldown allow it
    const cd = this.cooldownLeft(entity.key, p.tick);
    const need = entity.adrenaline < 0 ? -entity.adrenaline : 0;
    if (cd > 0 || this.adrenaline < need) {
      if (!p.notified) {
        if (cd > 0) this.events.push({ kind: 'on-cooldown', key: entity.key, readyInTicks: cd });
        else this.events.push({ kind: 'no-adrenaline', key: entity.key, need, have: this.adrenaline });
        p.notified = true;
      }
      p.tick += Math.max(1, cd); // re-check on the next possible tick
      return;
    }
    this.pending = p.bypassed ? { ...p.bypassed, tick: p.tick + GCD_TICKS } : null;
    const expected = this.expectedAbility;
    const gcdEnd = this.gcdEndTick;
    this.castTick = p.tick;
    this.lastInputTick = p.tick;
    this.activate(entity, p.tick);

    if (!expected || entity.key !== expected.key) {
      this.wrong++;
      this.events.push({ kind: 'wrong-fired', key: entity.key, expected: expected?.key ?? '', tick: p.tick });
      return;
    }
    // off-GCD steps of this group that were not done are missed
    const expectedIndex = this.steps.indexOf(expected, this.index);
    const missed: string[] = [];
    for (let i = this.index; i < expectedIndex; i++) {
      if (this.steps[i].isNote) {
        this.done.add(i);
        continue;
      }
      if (!this.done.has(i)) {
        missed.push(this.steps[i].key);
        this.done.add(i);
        this.results.push({
          step: i, key: this.steps[i].key, name: this.steps[i].name, kind: this.steps[i].kind, outcome: 'missed',
          lateTicks: 0, offsetMs: 0, tooEarly: 0, wrong: 0, firedAtTick: p.tick, adrenaline: this.adrenaline,
        });
      }
    }
    if (missed.length) this.events.push({ kind: 'missed', keys: missed });

    const lateTicks = gcdEnd === null ? 0 : Math.max(0, p.tick - gcdEnd);
    const result: StepResult = {
      step: expectedIndex,
      key: entity.key,
      name: entity.name,
      kind: entity.kind,
      outcome: lateTicks ? 'late' : 'perfect',
      lateTicks,
      offsetMs: gcdEnd === null ? 0 : Math.round(Math.abs(this.tickTime(gcdEnd) - p.arrival)),
      tooEarly: this.tooEarly,
      wrong: this.wrong,
      firedAtTick: p.tick,
      adrenaline: this.adrenaline,
    };
    this.results.push(result);
    this.events.push({ kind: 'fired', result });
    this.done.add(expectedIndex);
    this.tooEarly = 0;
    this.wrong = 0;
    this.advanceIndex();
  }

  /** Apply the effects of an entity that just cast / activated at `tick`. */
  private activate(entity: EngineEntity, tick: number): void {
    const l = this.config.loadout ?? DEFAULT_LOADOUT;
    if (entity.weapon) {
      this.weapon = entity.weapon.style;
      this.events.push({ kind: 'weapon', style: entity.weapon.style });
    }
    if (entity.cooldownTicks > 0) this.readyTick.set(entity.key, tick + entity.cooldownTicks);
    if (entity.sharedCooldown) this.readyTick.set('shared:' + entity.sharedCooldown, tick + entity.cooldownTicks);

    let delta = entity.adrenaline;
    if (entity.kind === 'ability' && entity.gcd && entity.abilityType === 'Basic' && entity.adrenaline > 0) {
      if (l.furyOfTheSmall) delta += 1;
      if (l.impatientRank > 0 && this.random() < 0.09 * l.impatientRank) delta += 3;
    }
    if (entity.abilityType === 'Ultimate' && entity.adrenaline < 0) {
      if (l.ringOfVigour) delta += 10;
      if (l.conservationOfEnergy) delta += 10;
    }
    this.adrenaline = Math.max(0, Math.min(this.maxAdrenaline, this.adrenaline + delta));
    if (entity.adrenalineOverTime && entity.adrenalineOverTime.ticks > 0) {
      this.overTime.push({
        key: entity.key,
        perTick: entity.adrenalineOverTime.amount / entity.adrenalineOverTime.ticks,
        untilTick: tick + entity.adrenalineOverTime.ticks,
      });
    }
    for (const b of entity.buffs) {
      this.buffs = this.buffs.filter((x) => x.id !== b.id);
      this.buffs.push({ ...b, startTick: tick, endTick: b.durationTicks === null ? null : tick + b.durationTicks, sourceKey: entity.key });
    }
  }

  private advanceTick(tick: number): void {
    this.lastTick = tick;
    for (const o of this.overTime) {
      if (tick <= o.untilTick) this.adrenaline = Math.min(this.maxAdrenaline, this.adrenaline + o.perTick);
    }
    this.overTime = this.overTime.filter((o) => tick < o.untilTick);
    this.buffs = this.buffs.filter((b) => b.endTick === null || b.endTick > tick);
  }

  private advanceIndex(): void {
    for (;;) {
      while (this.index < this.steps.length && this.done.has(this.index)) this.index++;
      if (this.index < this.steps.length && this.steps[this.index].isNote) {
        this.done.add(this.index);
        continue;
      }
      break;
    }
    if (this.index >= this.steps.length) {
      if (this.config.loop) {
        this.index = 0;
        this.done.clear();
      } else {
        this.state = 'finished';
        this.events.push({ kind: 'finished' });
      }
    }
  }
}

import { AbilityType, EntityKind, StepResult, Style } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { BUFF_BY_ID, GLOBALS, ruleFor } from './rules';
import { AbilityRule, ChannelSpec, Condition, Effect, GlobalRule, Requirement, StackId } from './rules-model';

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
  loadout: ResolvedLoadout;
}

/** A status effect an entity applies when it casts / activates (data-driven fallback when no rule buff exists). */
export interface EngineBuff {
  id: string;
  name: string;
  kind: 'Buff' | 'Debuff';
  on: 'self' | 'target';
  icon: string | null;
  /** null = until the session ends (prayers) */
  durationTicks: number | null;
}

/** Everything the engine needs to know about a pressable thing (ability, prayer, potion, weapon special). */
export interface EngineEntity {
  key: string;
  kind: EntityKind | 'spec';
  /** ability / spec id used to look up rules */
  id: string;
  name: string;
  icon: string;
  /** true for abilities that start / obey the global cooldown */
  gcd: boolean;
  style?: Style;
  abilityType?: AbilityType;
  /** +gain / -cost in percent */
  adrenaline: number;
  /** internal cooldown after use */
  cooldownTicks: number;
  /** group name for shared cooldowns (adrenaline potions) */
  sharedCooldown?: string;
  adrenalineOverTime?: { amount: number; ticks: number };
  /** data buffs (wiki link) used when the rules define none */
  buffs: EngineBuff[];
  /** weapon specials: channel from the spec data */
  channel?: ChannelSpec;
  /** weapon specials: hit schedule */
  hits?: number[];
}

export interface ActiveBuff {
  id: string;
  name: string;
  kind: 'Buff' | 'Debuff';
  on: 'self' | 'target';
  icon: string | null;
  startTick: number;
  endTick: number | null;
  stacks: number;
  /** ticks added by extend-buff (for maxTotal) */
  extended: number;
  sourceKey: string;
}

export interface Spirit {
  spirit: string;
  sinceTick: number;
  endTick: number;
}

export interface ActiveChannel {
  key: string;
  castTick: number;
  endTick: number;
  hits: number;
  hitsDone: number;
  cancelled: boolean;
}

export type EngineEvent =
  | { kind: 'queued'; key: string; expected: string; fireTick: number; marginMs: number }
  | { kind: 'fired'; result: StepResult }
  | { kind: 'wrong-fired'; key: string; expected: string; tick: number }
  | { kind: 'too-early'; key: string; ticksEarly: number }
  | { kind: 'wrong'; key: string; expected: string }
  | { kind: 'no-adrenaline'; key: string; need: number; have: number }
  | { kind: 'on-cooldown'; key: string; readyInTicks: number }
  /** a rule requirement is not met (stacks, spirit, sequence, equipment ...) */
  | { kind: 'requirement'; key: string; text: string }
  | { kind: 'channel-cancelled'; key: string; hitsLost: number }
  | { kind: 'missed'; keys: string[] }
  | { kind: 'finished' };

interface PendingInput {
  key: string;
  pressedAt: number;
  arrival: number;
}

interface Pending {
  key: string;
  tick: number;
  arrival: number;
  bypassed?: Pending;
  notified?: boolean;
}

interface ScheduledHit {
  key: string;
  entity: EngineEntity;
  rule: AbilityRule | undefined;
  tick: number;
  index: number;
  total: number;
  channel: ActiveChannel | null;
  guaranteedCrit: boolean;
}

interface SequenceState {
  /** step that is open now (2 = Slaughter after Dismember) */
  openStep: number;
  untilTick: number;
}

/**
 * Pure timing + resource model of the trainer. All times are milliseconds on one monotonic clock;
 * the caller feeds `now` into press()/update(). See docs/interactions-design.md.
 */
export class TrainerEngine {
  state: 'idle' | 'running' | 'finished' = 'idle';
  t0 = 0;
  index = 0;
  castTick: number | null = null;
  adrenaline = 0;
  results: StepResult[] = [];
  buffs: ActiveBuff[] = [];
  stacks = new Map<StackId, number>();
  spirits = new Map<string, Spirit>();
  channel: ActiveChannel | null = null;
  readonly events: EngineEvent[] = [];
  random: () => number = Math.random;

  private inflight: PendingInput[] = [];
  private pending: Pending | null = null;
  private done = new Set<number>();
  private tooEarly = 0;
  private wrong = 0;
  private readyTick = new Map<string, number>();
  private chargeReady = new Map<string, number[]>();
  private sequences = new Map<string, SequenceState>();
  private reconjureReady = new Map<string, number>();
  private scheduled: ScheduledHit[] = [];
  private overTime: { key: string; perTick: number; untilTick: number }[] = [];
  private lastTick = 0;
  private lastAttackTick = -1000;
  private relentlessLockUntil = -1;

  constructor(
    readonly steps: EngineEntity[],
    readonly catalog: Map<string, EngineEntity>,
    public config: EngineConfig,
  ) {
    config.loadout ??= defaultResolvedLoadout();
  }

  get loadout(): ResolvedLoadout {
    return this.config.loadout;
  }

  get maxAdrenaline(): number {
    return this.loadout.maxAdrenaline;
  }

  start(now: number): void {
    this.t0 = now;
    this.index = 0;
    this.castTick = null;
    this.adrenaline = Math.max(0, Math.min(this.maxAdrenaline, this.loadout.startAdrenaline));
    this.results = [];
    this.buffs = [];
    this.stacks.clear();
    this.spirits.clear();
    this.channel = null;
    this.inflight = [];
    this.pending = null;
    this.done.clear();
    this.tooEarly = 0;
    this.wrong = 0;
    this.readyTick.clear();
    this.chargeReady.clear();
    this.sequences.clear();
    this.reconjureReady.clear();
    this.scheduled = [];
    this.overTime = [];
    this.lastTick = 0;
    this.lastAttackTick = -1000;
    this.relentlessLockUntil = -1;
    this.events.length = 0;
    this.state = 'running';
  }

  stop(): void {
    if (this.state === 'running') this.state = 'finished';
  }

  // ---------------------------------------------------------------- read-only views

  get currentStep(): EngineEntity | undefined {
    return this.steps[this.index];
  }

  get expectedAbility(): EngineEntity | undefined {
    for (let i = this.index; i < this.steps.length; i++) {
      if (this.isGcdStep(this.steps[i])) return this.steps[i];
    }
    return undefined;
  }

  isDone(stepIndex: number): boolean {
    return this.done.has(stepIndex);
  }

  get queuedKey(): string | null {
    return this.pending?.key ?? null;
  }

  get isQueued(): boolean {
    return this.pending !== null && this.pending.key === this.expectedAbility?.key;
  }

  get gcdEndTick(): number | null {
    return this.castTick === null ? null : this.castTick + GCD_TICKS;
  }

  stack(id: StackId): number {
    return this.stacks.get(id) ?? 0;
  }

  hasBuff(id: string): boolean {
    return this.buffs.some((b) => b.id === id);
  }

  buff(id: string): ActiveBuff | undefined {
    return this.buffs.find((b) => b.id === id);
  }

  /** Which step of a sequence slot is currently shown (1 = base ability). */
  sequenceStep(group: string, tick: number): number {
    const s = this.sequences.get(group);
    return s && tick <= s.untilTick ? s.openStep : 1;
  }

  tickTime(tick: number): number {
    return this.t0 + tick * TICK_MS;
  }

  tickOf(time: number): number {
    return Math.ceil((time - this.t0) / TICK_MS);
  }

  currentTick(now: number): number {
    return Math.floor((now - this.t0) / TICK_MS);
  }

  tickPhase(now: number): number {
    const p = ((now - this.t0) % TICK_MS) / TICK_MS;
    return p < 0 ? 0 : p;
  }

  gcdPhase(now: number): number {
    if (this.castTick === null) return 1;
    const p = (now - this.tickTime(this.castTick)) / (GCD_TICKS * TICK_MS);
    return Math.max(0, Math.min(1, p));
  }

  gcdRemainingMs(now: number): number {
    const end = this.gcdEndTick;
    return end === null ? 0 : Math.max(0, this.tickTime(end) - now);
  }

  /** Ticks until `key` is off its own / shared cooldown at `tick` (0 = ready). */
  cooldownLeft(key: string, tick: number): number {
    const e = this.catalog.get(key);
    if (!e) return 0;
    const rule = this.ruleOf(e);
    const acting = this.specFor(e) ?? e;
    if (rule?.charges) {
      const ready = this.chargeReady.get(e.key) ?? [];
      const available = ready.filter((t) => t <= tick).length + (rule.charges - ready.length);
      if (available > 0) return 0;
      return Math.max(0, Math.min(...ready) - tick);
    }
    let ready = this.readyTick.get(acting.key) ?? 0;
    const shared = rule?.sharedCooldown ?? acting.sharedCooldown;
    if (shared) ready = Math.max(ready, this.readyTick.get('shared:' + shared) ?? 0);
    return Math.max(0, ready - tick);
  }

  /** Remaining internal cooldown of an entity in ms at `now`. */
  cooldownRemainingMs(key: string, now: number): number {
    const tick = this.currentTick(now);
    const left = this.cooldownLeft(key, tick);
    if (left <= 0) return 0;
    return Math.max(0, this.tickTime(tick + left) - now);
  }

  /** The adrenaline this entity needs right now (requirement) and what it costs. */
  costOf(e: EngineEntity): { need: number; cost: number } {
    const rule = this.ruleOf(e);
    const spec = this.specFor(e);
    if (spec) {
      const c = Math.round((spec.adrenaline < 0 ? -spec.adrenaline : 0) * this.loadout.specCostMult);
      return { need: c, cost: c };
    }
    if (this.isThreshold(e, rule)) {
      return { need: this.hasBuff('limitless') ? 15 : 50, cost: 15 };
    }
    let cost = rule?.adrenaline !== undefined ? Math.max(0, -rule.adrenaline) : e.adrenaline < 0 ? -e.adrenaline : 0;
    if (rule?.cost?.cost !== undefined) cost = rule.cost.cost;
    if (rule?.cost?.perStack) {
      const p = rule.cost.perStack;
      cost = Math.max(0, p.base - p.per * Math.min(this.stack(p.stack), p.maxStacks));
    }
    for (const g of this.matchingGlobals(e)) {
      if (g.discount && g.consumes && this.hasBuff(g.consumes) && cost > 0) cost = Math.max(0, cost - g.discount);
    }
    return { need: cost, cost };
  }

  /** First unmet requirement of an entity at `tick`, or null. */
  requirementFailure(e: EngineEntity, tick: number): string | null {
    const rule = this.ruleOf(e);
    for (const r of rule?.requires ?? []) {
      if (!this.requirementMet(r, tick)) return r.text;
    }
    for (const eff of rule?.onCast ?? []) {
      if (eff.kind === 'conjure' && e.id !== 'conjure-undead-army') {
        if (this.spirits.has(eff.spirit)) return 'a ' + eff.spirit.replace(/-/g, ' ') + ' is already active';
        const ready = this.reconjureReady.get(eff.spirit) ?? 0;
        if (ready > tick) return 'cannot be re-conjured for ' + (ready - tick) + ' more ticks';
      }
    }
    if (e.id === 'conjure-undead-army' && ['skeleton-warrior', 'putrid-zombie', 'vengeful-ghost'].every((s) => this.spirits.has(s))) {
      return 'all spirits are already active';
    }
    return null;
  }

  // ---------------------------------------------------------------- input

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
      if (tickAt <= now && tickAt <= castAt && (!next || tickAt <= next.arrival)) {
        this.advanceTick(this.lastTick + 1);
      } else if (castAt <= now && (!next || castAt <= next.arrival)) {
        this.castPending();
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
    const entity = this.catalog.get(input.key);
    if (!entity) return;
    const tickP = this.tickOf(input.arrival);
    const gcdEnd = this.gcdEndTick;
    const gcdRunning = gcdEnd !== null && tickP < gcdEnd && tickP > (this.castTick ?? -1);
    const rule = this.ruleOf(entity);
    if (!entity.gcd || rule?.offGcd || (rule?.offGcdNoGain && gcdRunning)) {
      this.handleOffGcd(entity, tickP, gcdRunning);
      return;
    }
    const expected = this.expectedAbility?.key ?? '';
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
    if (this.pending?.key === input.key) return;
    this.accept(input, gcdEnd, expected);
  }

  /** Queueing off: everything is checked now; queueing on: the cast waits until possible. */
  private accept(input: PendingInput, tick: number, expected: string): void {
    const entity = this.catalog.get(input.key)!;
    if (!this.config.abilityQueueing) {
      const blocked = this.blocker(entity, tick);
      if (blocked) {
        if (input.key === expected) this.tooEarly++;
        else this.wrong++;
        this.events.push(blocked);
        return;
      }
    }
    this.pending = { key: entity.key, tick, arrival: input.arrival };
    const gcdEnd = this.gcdEndTick;
    const marginMs = gcdEnd === null ? 0 : this.tickTime(gcdEnd) - input.arrival;
    this.events.push({ kind: 'queued', key: entity.key, expected, fireTick: tick, marginMs });
  }

  /** Why an entity cannot cast at `tick` (cooldown, adrenaline, rule requirement), or null. */
  private blocker(entity: EngineEntity, tick: number): EngineEvent | null {
    const cd = this.cooldownLeft(entity.key, tick);
    if (cd > 0) return { kind: 'on-cooldown', key: entity.key, readyInTicks: cd };
    const req = this.requirementFailure(entity, tick);
    if (req) return { kind: 'requirement', key: entity.key, text: req };
    const { need } = this.costOf(entity);
    if (need > 0 && this.adrenaline < need) return { kind: 'no-adrenaline', key: entity.key, need, have: this.adrenaline };
    return null;
  }

  private handleOffGcd(entity: EngineEntity, tick: number, insideGcd: boolean): void {
    const blocked = this.blocker(entity, tick);
    if (blocked) {
      this.wrong++;
      this.events.push(blocked);
      return;
    }
    let stepIndex = -1;
    for (let i = this.index; i < this.steps.length; i++) {
      const s = this.steps[i];
      if (this.isGcdStep(s)) break;
      if (!this.done.has(i) && s.key === entity.key) {
        stepIndex = i;
        break;
      }
    }
    this.activate(entity, tick, { offGcd: true, noGain: insideGcd && !!this.ruleOf(entity)?.offGcdNoGain });
    if (stepIndex < 0) {
      this.wrong++;
      this.events.push({ kind: 'wrong-fired', key: entity.key, expected: this.currentStep?.key ?? '', tick });
      return;
    }
    this.done.add(stepIndex);
    const result: StepResult = {
      step: stepIndex, key: entity.key, name: entity.name, kind: entity.kind as EntityKind, outcome: 'done',
      lateTicks: 0, offsetMs: 0, tooEarly: 0, wrong: 0, firedAtTick: tick, adrenaline: this.adrenaline,
    };
    this.results.push(result);
    this.events.push({ kind: 'fired', result });
    this.advanceIndex();
  }

  /** Off-GCD abilities (Surge, Provoke ...) do not count as GCD steps in a rotation group. */
  isGcdStep(e: EngineEntity): boolean {
    if (!e.gcd) return false;
    const rule = this.ruleOf(e);
    return !rule?.offGcd;
  }

  // ---------------------------------------------------------------- casting

  private castPending(): void {
    const p = this.pending!;
    const entity = this.catalog.get(p.key)!;
    const blocked = this.blocker(entity, p.tick);
    if (blocked) {
      if (!p.notified) {
        this.events.push(blocked);
        p.notified = true;
      }
      p.tick += Math.max(1, blocked.kind === 'on-cooldown' ? blocked.readyInTicks : 1);
      return;
    }
    this.pending = p.bypassed ? { ...p.bypassed, tick: p.tick + GCD_TICKS } : null;
    const expected = this.expectedAbility;
    const gcdEnd = this.gcdEndTick;
    this.castTick = p.tick;
    this.activate(entity, p.tick, { offGcd: false, noGain: false });

    if (!expected || entity.key !== expected.key) {
      this.wrong++;
      this.events.push({ kind: 'wrong-fired', key: entity.key, expected: expected?.key ?? '', tick: p.tick });
      return;
    }
    const expectedIndex = this.steps.indexOf(expected, this.index);
    const missed: string[] = [];
    for (let i = this.index; i < expectedIndex; i++) {
      if (!this.done.has(i)) {
        missed.push(this.steps[i].key);
        this.done.add(i);
        this.results.push({
          step: i, key: this.steps[i].key, name: this.steps[i].name, kind: this.steps[i].kind as EntityKind, outcome: 'missed',
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
      kind: entity.kind as EntityKind,
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

  /** Apply everything an entity does when it casts / activates at `tick`. */
  private activate(entity: EngineEntity, tick: number, opt: { offGcd: boolean; noGain: boolean }): void {
    const rule = this.ruleOf(entity);
    const spec = this.specFor(entity);
    const acting = spec ?? entity; // weapon special attacks act with the spec's numbers
    const globals = this.matchingGlobals(entity);

    // a new GCD ability cuts a running channel
    if (!opt.offGcd && this.channel && !this.channel.cancelled && tick < this.channel.endTick) this.cancelChannel();

    // cooldown (charges, own, shared)
    const cdTicks = this.cooldownFor(acting, rule, tick);
    if (rule?.charges) {
      const list = (this.chargeReady.get(entity.key) ?? []).filter((t) => t > tick);
      if (list.length < rule.charges) list.push(tick + cdTicks);
      this.chargeReady.set(entity.key, list);
    } else if (cdTicks > 0) {
      this.readyTick.set(acting.key, tick + cdTicks);
    }
    const shared = rule?.sharedCooldown ?? acting.sharedCooldown;
    if (shared && cdTicks > 0) this.readyTick.set('shared:' + shared, tick + cdTicks);

    // adrenaline
    const { cost } = this.costOf(entity);
    const baseCost = rule?.adrenaline !== undefined ? Math.max(0, -rule.adrenaline) : acting.adrenaline < 0 ? -acting.adrenaline : 0;
    // a Flow-type discount is used up even when it brings the cost to 0
    if (baseCost > 0 || this.isThreshold(entity, rule)) {
      for (const g of globals) if (g.consumes && g.discount && this.hasBuff(g.consumes)) this.removeBuff(g.consumes);
    }
    let delta = 0;
    if (cost > 0) {
      let paid = cost;
      if (this.loadout.relentlessRank > 0 && tick >= this.relentlessLockUntil && this.random() < 0.01 * this.loadout.relentlessRank) {
        paid = 0;
        this.relentlessLockUntil = tick + 50;
      }
      if (this.isThreshold(entity, rule) && this.loadout.thresholdFreeChance > 0 && this.random() < this.loadout.thresholdFreeChance) paid = 0;
      delta -= paid;
      if (rule?.cost?.perStack) {
        const p = rule.cost.perStack;
        this.stacks.set(p.stack, this.stack(p.stack) - Math.min(this.stack(p.stack), p.maxStacks));
      }
      if (entity.abilityType === 'Ultimate' && rule?.cost?.ultimate !== false && !spec) {
        delta += this.loadout.ultimateRefund;
        const havoc = this.loadout.adrenalineAfterUltimate;
        if (havoc && entity.style === havoc.style) {
          if (this.hasBuff('havoc-regeneration')) {
            this.removeBuff('havoc-regeneration');
            this.overTime = this.overTime.filter((o) => o.key !== 'havoc');
            delta += havoc.instantIfActive;
          } else {
            this.applyBuff('havoc-regeneration', tick, entity.key, havoc.overTicks);
            this.overTime.push({ key: 'havoc', perTick: havoc.amount / havoc.overTicks, untilTick: tick + havoc.overTicks });
          }
        }
      }
    } else if (!opt.noGain) {
      const base = rule?.adrenaline ?? acting.adrenaline;
      if (base > 0) {
        let gain = base;
        if (entity.abilityType === 'Basic' && entity.gcd) {
          gain += this.loadout.basicGainAdd;
          if (this.loadout.impatientRank > 0 && this.random() < 0.09 * this.loadout.impatientRank) gain += 3;
          if (this.isBasicAttack(entity) && this.loadout.invigoratingRank > 0) gain *= 1 + 0.05 * this.loadout.invigoratingRank;
        }
        for (const g of globals) {
          if (g.gainAdd) gain += g.gainAdd;
          if (g.gainMult !== undefined) gain *= g.gainMult;
        }
        delta += gain;
      }
    }
    this.addAdrenaline(delta);
    if (acting.adrenalineOverTime && acting.adrenalineOverTime.ticks > 0) {
      this.overTime.push({ key: acting.key, perTick: acting.adrenalineOverTime.amount / acting.adrenalineOverTime.ticks, untilTick: tick + acting.adrenalineOverTime.ticks });
    }

    // buffs: rules first, wiki data as fallback
    const ruleAppliesBuffs = !!rule?.buffs || !!rule?.onCast?.some((e) => e.kind === 'buff' || e.kind === 'choose' || e.kind === 'conjure') || !!rule?.onHit?.some((e) => e.kind === 'buff' || e.kind === 'choose') || !!rule?.hitBuffs;
    if (rule?.buffs) {
      for (const id of rule.buffs) this.applyBuff(id, tick, entity.key);
    } else if (!ruleAppliesBuffs) {
      for (const b of acting.buffs) this.applyDataBuff(b, tick, entity.key);
    }

    // effects
    for (const eff of rule?.onCast ?? []) this.applyEffect(eff, tick, entity, 0);
    for (const g of globals) {
      for (const eff of g.onCast ?? []) this.applyEffect(eff, tick, entity, 0);
      if (g.consumes && !g.discount && this.hasBuff(g.consumes)) this.removeBuff(g.consumes);
    }

    // sequences
    if (rule?.sequence) {
      if (rule.sequence.last) this.sequences.delete(rule.sequence.group);
      else this.sequences.set(rule.sequence.group, { openStep: rule.sequence.step + 1, untilTick: tick + rule.sequence.windowTicks });
    }

    // hits / channel
    const channel = this.loadout.channelOverrides[entity.id] ?? rule?.channel ?? acting.channel;
    const hits = this.loadout.hitsOverrides[entity.id] ?? rule?.hits ?? acting.hits ?? (this.isDamaging(acting, rule) ? [0] : undefined);
    if (channel) {
      this.channel = { key: entity.key, castTick: tick, endTick: tick + channel.ticks, hits: channel.hits.length, hitsDone: 0, cancelled: false };
      channel.hits.forEach((offset, i) =>
        this.scheduled.push({ key: entity.key, entity, rule, tick: tick + offset, index: i, total: channel.hits.length, channel: this.channel, guaranteedCrit: !!channel.guaranteedCrit }),
      );
      this.lastAttackTick = tick;
    } else if (hits) {
      hits.forEach((offset, i) =>
        this.scheduled.push({ key: entity.key, entity, rule, tick: tick + offset, index: i, total: hits.length, channel: null, guaranteedCrit: false }),
      );
      this.lastAttackTick = tick;
    }
    this.processHits(tick);
  }

  /** Abilities that hit the target (for hit effects) unless the rule/data says otherwise. */
  private isDamaging(acting: EngineEntity, rule: AbilityRule | undefined): boolean {
    if (acting.kind === 'prayer' || acting.kind === 'special') return false;
    if (rule?.offGcd) return false;
    if (rule?.onHit || rule?.hitBuffs) return true;
    // self-buff abilities (Berserk, Sunshine ...) have wiki buffs and no hit line; keep them hit-less
    return acting.buffs.length === 0 && !rule?.buffs && !rule?.onCast?.some((e) => e.kind === 'buff' || e.kind === 'conjure');
  }

  private processHits(tick: number): void {
    const due = this.scheduled.filter((h) => h.tick <= tick).sort((a, b) => a.tick - b.tick || a.index - b.index);
    this.scheduled = this.scheduled.filter((h) => h.tick > tick);
    for (const h of due) {
      const ch = h.channel ? this.loadout.channelOverrides[h.entity.id] ?? h.rule?.channel ?? h.entity.channel : undefined;
      if (h.channel) {
        if (h.channel.cancelled) continue;
        if (ch?.adrenalinePerHit) {
          if (this.adrenaline < ch.adrenalinePerHit) {
            this.cancelChannel();
            continue;
          }
          this.addAdrenaline(-ch.adrenalinePerHit);
        }
        h.channel.hitsDone++;
      }
      this.onHit(h);
      if (h.channel && h.channel.hitsDone === h.channel.hits) {
        for (const eff of ch?.onComplete ?? []) this.applyEffect(eff, h.tick, h.entity, h.index);
        if (this.channel === h.channel) this.channel = null;
      }
    }
  }

  private onHit(h: ScheduledHit): void {
    const globals = this.matchingGlobals(h.entity);
    for (const eff of h.rule?.onHit ?? []) this.applyEffect(eff, h.tick, h.entity, h.index);
    for (const id of h.rule?.hitBuffs ?? []) this.applyBuff(id, h.tick, h.entity.key);
    const crit = h.guaranteedCrit || (this.hasBuff('greater-fury') && h.index === 0 && h.entity.style === 'Melee') || this.random() < 0.1;
    for (const g of globals) {
      for (const eff of g.onHit ?? []) this.applyEffect(eff, h.tick, h.entity, h.index);
      if (g.hitAdrenaline) this.addAdrenaline(g.hitAdrenaline * (this.hasBuff('natural-instinct') ? 2 : 1));
      if (g.critAdrenaline && crit) this.addAdrenaline(g.critAdrenaline * (this.hasBuff('natural-instinct') ? 2 : 1));
    }
    const perTick = this.loadout.channelAdrenalinePerTick[h.entity.id];
    if (perTick && h.channel) this.addAdrenaline(perTick);
  }

  private cancelChannel(): void {
    const ch = this.channel;
    if (!ch || ch.cancelled) return;
    ch.cancelled = true;
    const lost = this.scheduled.filter((h) => h.channel === ch).length;
    this.scheduled = this.scheduled.filter((h) => h.channel !== ch);
    this.events.push({ kind: 'channel-cancelled', key: ch.key, hitsLost: lost });
    this.channel = null;
  }

  // ---------------------------------------------------------------- effects

  private applyEffect(eff: Effect, tick: number, entity: EngineEntity, hitIndex: number): void {
    if ('when' in eff && eff.when && eff.kind !== 'choose' && !this.conditionMet(eff.when, tick, hitIndex)) return;
    switch (eff.kind) {
      case 'stack': {
        const cap = this.loadout.stackCaps[eff.stack] ?? eff.cap ?? Infinity;
        this.stacks.set(eff.stack, Math.min(cap, this.stack(eff.stack) + eff.amount));
        break;
      }
      case 'stack-set':
        this.stacks.set(eff.stack, eff.amount);
        break;
      case 'consume-stack': {
        const have = this.stack(eff.stack);
        if (eff.min !== undefined && have < eff.min) break;
        const take = eff.amount === 'all' ? have : Math.min(have, eff.amount);
        if (take <= 0) break;
        this.stacks.set(eff.stack, have - take);
        for (const e of eff.then ?? []) this.applyEffect(e, tick, entity, hitIndex);
        break;
      }
      case 'buff':
        this.applyBuff(eff.id, tick, entity.key, eff.durationTicks, eff.stacks, eff.refresh ?? true);
        break;
      case 'extend-buff': {
        const b = this.buff(eff.buff);
        if (b && b.endTick !== null) {
          const room = eff.maxTotal === undefined ? eff.ticks : Math.max(0, eff.maxTotal - b.extended);
          const add = Math.min(eff.ticks, room);
          b.endTick += add;
          b.extended += add;
        }
        break;
      }
      case 'remove-buff':
        this.removeBuff(eff.id);
        break;
      case 'cooldown-reset':
        for (const id of eff.abilities) {
          this.readyTick.delete('ability:' + id);
          this.chargeReady.delete('ability:' + id);
        }
        break;
      case 'cooldown-reduce': {
        const key = 'ability:' + eff.ability;
        const ready = this.readyTick.get(key);
        if (ready !== undefined && ready > tick) this.readyTick.set(key, Math.max(tick, ready - eff.ticks));
        break;
      }
      case 'adrenaline':
        this.addAdrenaline(eff.amount);
        break;
      case 'adrenaline-per-tick':
        this.overTime.push({ key: entity.key, perTick: eff.amount, untilTick: tick + eff.ticks });
        break;
      case 'sequence-open':
        this.sequences.set(eff.group, { openStep: eff.step, untilTick: tick + eff.windowTicks });
        break;
      case 'sequence-reset':
        this.sequences.delete(eff.group);
        break;
      case 'flag':
        break;
      case 'conjure': {
        if (this.spirits.has(eff.spirit)) break;
        const duration = Math.round((eff.durationTicks + this.loadout.conjureDurationAdd) * this.loadout.conjureDurationMult);
        this.spirits.set(eff.spirit, { spirit: eff.spirit, sinceTick: tick, endTick: tick + duration });
        this.applyBuff('spirit-' + eff.spirit, tick, entity.key, duration);
        break;
      }
      case 'dismiss': {
        const s = this.spirits.get(eff.spirit);
        this.spirits.delete(eff.spirit);
        this.removeBuff('spirit-' + eff.spirit);
        if (s && eff.reconjureAfterTicks) this.reconjureReady.set(eff.spirit, s.sinceTick + eff.reconjureAfterTicks);
        break;
      }
      case 'choose':
        for (const e of this.conditionMet(eff.when, tick, hitIndex) ? eff.then : eff.otherwise ?? []) this.applyEffect(e, tick, entity, hitIndex);
        break;
    }
  }

  private conditionMet(c: Condition, tick: number, hitIndex: number): boolean {
    if (c.buff && !this.hasBuff(c.buff)) return false;
    if (c.notBuff && this.hasBuff(c.notBuff)) return false;
    if (c.stackMin && this.stack(c.stackMin.stack) < c.stackMin.min) return false;
    if (c.stackMax && this.stack(c.stackMax.stack) > c.stackMax.max) return false;
    if (c.item && !this.loadout.items.has(c.item)) return false;
    if (c.style && this.loadout.style !== c.style) return false;
    if (c.chance !== undefined && this.random() >= c.chance) return false;
    if (c.idleMin !== undefined && tick - this.lastAttackTick < c.idleMin) return false;
    if (c.hit !== undefined && hitIndex !== c.hit) return false;
    if (c.duringGcd !== undefined) {
      const running = this.gcdEndTick !== null && tick < this.gcdEndTick;
      if (running !== c.duringGcd) return false;
    }
    return true;
  }

  private requirementMet(r: Requirement, tick: number): boolean {
    if (r.buff && !this.hasBuff(r.buff)) return false;
    if (r.notBuff && this.hasBuff(r.notBuff)) return false;
    if (r.stackMin && this.stack(r.stackMin.stack) < r.stackMin.min) return false;
    if (r.spirit) {
      const s = this.spirits.get(r.spirit);
      if (!s) return false;
      if (r.spiritAgeMin !== undefined && tick - s.sinceTick < r.spiritAgeMin) return false;
    }
    if (r.sequence && this.sequenceStep(r.sequence.group, tick) !== r.sequence.step) return false;
    if (r.adrenalineBelow !== undefined && this.adrenaline >= r.adrenalineBelow) return false;
    if (r.adrenalineMin !== undefined && this.adrenaline < r.adrenalineMin) return false;
    if (r.notStunImmune && (this.hasBuff('anticipation') || this.hasBuff('freedom') || this.hasBuff('transfigure-immunity'))) return false;
    if (r.style && this.loadout.style !== r.style) return false;
    if (r.equipment) {
      const l = this.loadout;
      switch (r.equipment) {
        case '2h': if (!l.has2h) return false; break;
        case 'shield': if (!l.hasShield) return false; break;
        case 'defender-or-shield': if (!l.hasShield && !l.hasDefender) return false; break;
        case 'conduit': if (!l.hasConduit) return false; break;
        case 'spec-weapon': if (!l.weaponSpec) return false; break;
        case 'eof': if (!l.eofSpec || (l.style && l.eofSpec.style && l.eofSpec.style !== l.style)) return false; break;
      }
    }
    return true;
  }

  private applyBuff(id: string, tick: number, sourceKey: string, durationOverride?: number, stacks?: number, refresh = true): void {
    const def = BUFF_BY_ID.get(id);
    let duration: number | null = durationOverride ?? def?.durationTicks ?? 3;
    if (duration !== null) {
      duration += this.loadout.buffDurationAdd[id] ?? 0;
      duration = Math.round(duration * (this.loadout.buffDurationMult[id] ?? 1));
    }
    const existing = this.buff(id);
    if (existing) {
      if (stacks) existing.stacks += stacks;
      if (refresh && duration !== null) {
        existing.endTick = tick + duration;
        existing.extended = 0;
      }
      return;
    }
    this.buffs.push({
      id,
      name: def?.name ?? id,
      kind: def?.kind ?? 'Buff',
      on: def?.on ?? 'self',
      icon: def?.icon ?? null,
      startTick: tick,
      endTick: duration === null ? null : tick + duration,
      stacks: stacks ?? 0,
      extended: 0,
      sourceKey,
    });
  }

  private applyDataBuff(b: EngineBuff, tick: number, sourceKey: string): void {
    this.buffs = this.buffs.filter((x) => x.id !== b.id);
    this.buffs.push({ id: b.id, name: b.name, kind: b.kind, on: b.on, icon: b.icon, startTick: tick, endTick: b.durationTicks === null ? null : tick + b.durationTicks, stacks: 0, extended: 0, sourceKey });
  }

  private removeBuff(id: string): void {
    this.buffs = this.buffs.filter((b) => b.id !== id);
  }

  private addAdrenaline(delta: number): void {
    this.adrenaline = Math.max(0, Math.min(this.maxAdrenaline, this.adrenaline + delta));
  }

  private advanceTick(tick: number): void {
    this.lastTick = tick;
    for (const o of this.overTime) {
      if (tick <= o.untilTick) this.addAdrenaline(o.perTick);
    }
    this.overTime = this.overTime.filter((o) => tick < o.untilTick);
    for (const b of this.buffs) {
      const def = BUFF_BY_ID.get(b.id);
      if (def?.adrenalinePerTick) this.addAdrenaline(def.adrenalinePerTick);
    }
    this.buffs = this.buffs.filter((b) => b.endTick === null || b.endTick > tick);
    for (const [name, s] of [...this.spirits]) {
      if (s.endTick <= tick) {
        this.spirits.delete(name);
        this.removeBuff('spirit-' + name);
      }
    }
    for (const [group, s] of [...this.sequences]) {
      if (s.untilTick < tick) this.sequences.delete(group);
    }
    this.processHits(tick);
    if (this.channel && !this.channel.cancelled && this.channel.endTick <= tick && this.channel.hitsDone >= this.channel.hits) this.channel = null;
  }

  private advanceIndex(): void {
    while (this.index < this.steps.length && this.done.has(this.index)) this.index++;
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

  // ---------------------------------------------------------------- helpers

  ruleOf(e: EngineEntity): AbilityRule | undefined {
    return e.kind === 'ability' ? ruleFor(e.id) : undefined;
  }

  /** Weapon Special Attack / Essence of Finality steps act as the loadout's spec. */
  specFor(e: EngineEntity): EngineEntity | null {
    if (e.id === 'weapon-special-attack') return this.loadout.weaponSpec;
    if (e.id === 'essence-of-finality') return this.loadout.eofSpec;
    return null;
  }

  private isThreshold(e: EngineEntity, rule: AbilityRule | undefined): boolean {
    if (rule?.cost?.threshold === false) return false;
    return e.abilityType === 'Threshold' || !!rule?.cost?.threshold;
  }

  private isBasicAttack(e: EngineEntity): boolean {
    return e.id === 'attack' || e.id === 'ranged' || e.id === 'magic' || e.id === 'necromancy';
  }

  private cooldownFor(acting: EngineEntity, rule: AbilityRule | undefined, tick: number): number {
    let ticks = rule?.cooldownTicks ?? acting.cooldownTicks;
    for (const r of rule?.cooldownRules ?? []) {
      if (this.conditionMet(r.when, tick, 0)) ticks = r.ticks;
    }
    const mult = this.loadout.cooldownMult[acting.id];
    if (mult !== undefined) ticks = Math.round(ticks * mult);
    return ticks;
  }

  private matchingGlobals(e: EngineEntity): GlobalRule[] {
    if (e.kind !== 'ability') return [];
    const rule = ruleFor(e.id);
    return GLOBALS.filter((g) => {
      const w = g.when;
      if (w.abilities && !w.abilities.includes(e.id)) return false;
      if (w.excludeAbilities?.includes(e.id)) return false;
      if (w.style && e.style !== w.style) return false;
      if (w.styles && (!e.style || !w.styles.includes(e.style))) return false;
      if (w.type && e.abilityType !== w.type) return false;
      if (w.types && (!e.abilityType || !w.types.includes(e.abilityType))) return false;
      if (w.gcd && (!e.gcd || rule?.offGcd)) return false;
      if (w.costing && !(e.adrenaline < 0 || this.isThreshold(e, rule))) return false;
      if (w.generating && !((rule?.adrenaline ?? e.adrenaline) > 0)) return false;
      if (w.buff && !this.hasBuff(w.buff)) return false;
      return true;
    });
  }
}

import { COMMAND_READY_AFTER, CONJURE_BASE_TICKS } from './rules-necromancy';
import { AbilityType, EnemyConfig, EntityKind, PrayerStats, Prebuild, SPEC_KEY, StepResult, Style, Style4, isStyle4 } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { PROTECTION, PrayerBook, SOUL_SPLIT, bookOf, togglePrayer } from './prayer-rules';
import { BASE_CRIT_CHANCE, BUFF_DAMAGE_MULT, BUFF_FLAT_ADD, SPIRIT_ATTACKS, TARGET_DAMAGE_MULT, critMultiplier } from './damage';
import { MORPH_TARGETS } from './morphs';
import { BUFF_BY_ID, MODELLED_WIKI_BUFFS, GLOBALS, ruleFor } from './rules';
import { AbilityRule, ChannelSpec, Condition, Effect, GlobalRule, Requirement, StackId } from './rules-model';

/** One RS3 game tick / server cycle. */
export const TICK_MS = 600;
/** Global cooldown in ticks (1.8 s). */
export const GCD_TICKS = 3;

/** The weapons in hand: item ids from weapons.json. A two-handed weapon excludes main/off hand. */
export interface Wield {
  mainHand: string | null;
  offHand: string | null;
  twoHand: string | null;
}

/** adrenaline gained per tick with the "recharge adrenaline" trainer option */
export const RECHARGE_PER_TICK = 10;

export interface EngineConfig {
  pingMs: number;
  jitterMs: number;
  /** In-game "Ability queueing" setting. On: a press during the GCD is queued and casts when the GCD ends. Off: it is ignored. */
  abilityQueueing: boolean;
  loop: boolean;
  /** start with full adrenaline instead of the loadout's start value */
  fullAdrenaline?: boolean;
  /** +10% adrenaline at every server tick (like hitting a training dummy while resting) */
  rechargeAdrenaline?: boolean;
  /** resolved loadout for the weapons wielded at the start */
  loadout: ResolvedLoadout;
  /** weapons wielded at the start; weapon-switch steps change it */
  startWield?: Wield;
  /** re-resolves the loadout after a weapon switch (style, spec, shield, conduit ...) */
  resolveWield?: (wield: Wield) => ResolvedLoadout;
  /** potions / bombs need to be in the backpack: entity key ("special:adrenaline-potion") → carried? (missing = everything is carried) */
  hasItem?: (key: string) => boolean;
  /** life points of the target; the session ends when they reach 0 (missing / 0 = unlimited) */
  targetLifePoints?: number;
  /** state the session starts with (stacks, spirits, buffs, prayers, adrenaline) */
  prebuild?: Prebuild;
  /** prayer book of the session (default Curses); prayers of the other book are ignored */
  prayerBook?: PrayerBook;
  /** simulated enemy; only used when enabled */
  enemy?: EnemyConfig;
}

export type UsableReason = 'ok' | 'weapon' | 'book' | 'adrenaline' | 'cooldown' | 'requirement';

export interface IncomingAttack {
  tick: number;
  style: Style4;
  /** the style is visible from this tick on */
  revealTick: number;
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

/** Everything the engine needs to know about a pressable thing (ability, prayer, potion, weapon, weapon special, client action). */
export interface EngineEntity {
  key: string;
  kind: EntityKind;
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
  /** damage per hit in % of ability damage (abilities.json / specs.json) */
  damageMin?: number;
  damageMax?: number;
  /** effect duration from the wiki text (used for pre-built incantations without a modelled buff) */
  durationTicks?: number;
  /** weapon-switch entities: the item that goes into the hand */
  weapon?: { id: string; slot: 'main' | 'off' | '2h'; style: Style };
  /** rotation steps only: PvME "+" (0) / "2t" (2) – expected this many ticks after the previous input's tick */
  offsetTicks?: number;
  /** rotation steps only: free text from an imported rotation, skipped automatically */
  isNote?: boolean;
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
  /** bound to this conjured spirit: ends with it, extended with it (Haunted) */
  spirit?: string;
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
  /** the queued ability was pressed again and taken out of the queue */
  | { kind: 'unqueued'; key: string }
  /** the expected step finished – GCD ability cast or off-GCD thing activated */
  | { kind: 'fired'; result: StepResult }
  | { kind: 'wrong-fired'; key: string; expected: string; tick: number }
  | { kind: 'too-early'; key: string; ticksEarly: number }
  | { kind: 'wrong'; key: string; expected: string }
  | { kind: 'no-adrenaline'; key: string; need: number; have: number }
  | { kind: 'on-cooldown'; key: string; readyInTicks: number }
  /** a rule requirement is not met (stacks, spirit, sequence, equipment ...) */
  | { kind: 'requirement'; key: string; text: string }
  | { kind: 'channel-cancelled'; key: string; hitsLost: number }
  /** ability needs another weapon style / the wielded weapon has no such special – ignored like in the game */
  | { kind: 'wrong-weapon'; key: string; reason: 'weapon' | 'spec' }
  /** weapon switched */
  | { kind: 'weapon'; id: string; style: Style }
  /** prayer toggled; `replaced` = conflicting prayers that were switched off */
  | { kind: 'prayer'; id: string; on: boolean; replaced: string[] }
  /** prayer of the other book – ignored */
  | { kind: 'wrong-book'; id: string; book: PrayerBook }
  /** enemy attack landed */
  | { kind: 'attack'; style: Style4; tick: number; prayed: boolean; needed: string }
  | { kind: 'missed'; keys: string[] }
  /** a hit landed on the target (key = source ability / "spirit:<name>") */
  | { kind: 'hit'; key: string; amount: number; crit: boolean; dot: boolean; tick: number }
  /** the target's life points reached 0 */
  | { kind: 'killed'; tick: number }
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
  /** damage-over-time hit: no crit, no style buff */
  dot?: boolean;
  /** % of ability damage rolled for this hit; missing = the ability has no damage numbers */
  damage?: { min: number; max: number } | null;
  /** style buff multiplier (Berserk, Sunshine, Death's Swiftness) as it was at the cast – a channel or delayed hit keeps it */
  mult: number;
  /** share of the ability damage added flat (Searing Winds, Frostblades, Caroming), snapshotted at the cast */
  flat: number;
  /** multiplier of a consumed buff (Chaos Roar) taken at the cast */
  castMult: number;
  /** flags the cast set (Bloodlust spent) – conditions of its hits read them */
  flags: Set<string>;
}

interface SequenceState {
  /** step that is open now (2 = Slaughter after Dismember) */
  openStep: number;
  untilTick: number;
}

/**
 * Pure timing + resource model of the trainer. All times are milliseconds on one monotonic clock;
 * the caller feeds `now` into press()/update(). See docs/interactions-design.md.
 *
 * Rotation semantics: GCD abilities are judged against the global cooldown (perfect / late / too early),
 * off-GCD steps (prayers, potions, weapon switches, Surge, target cycle ...) belong to the group before
 * the next GCD ability; steps with `offsetTicks` (PvME "+" / "2t") are scored against the previous input's
 * tick. Notes are skipped. Prayers are free actions judged by the prayer score, not as wrong presses.
 */
export class TrainerEngine {
  state: 'idle' | 'running' | 'finished' = 'idle';
  t0 = 0;
  index = 0;
  castTick: number | null = null;
  adrenaline = 0;
  results: StepResult[] = [];
  buffs: ActiveBuff[] = [];
  spirits = new Map<string, Spirit>();
  /** buffs that start a few ticks after their cast (Death's Swiftness, Sunshine) */
  private deferred: { tick: number; apply: () => void }[] = [];
  /** flags set by the cast being activated (consume-stack → flag) */
  private castFlags = new Set<string>();
  channel: ActiveChannel | null = null;
  /** weapons in hand */
  wield: Wield = { mainHand: null, offHand: null, twoHand: null };
  /** ids of the active prayers (e.g. "soul-split") */
  activePrayers = new Set<string>();
  prayerStats: PrayerStats = { ticks: 0, soulSplitTicks: 0, attacks: 0, prayed: 0, hits: 0 };
  nextAttack: IncomingAttack | null = null;
  /** life points left on the target (0 when unlimited) */
  targetHp = 0;
  damageDealt = 0;
  hitCount = 0;
  killedTick: number | null = null;
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
  /** tick of the last input that counted (cast or off-GCD activation) – reference for "+" / "2t" companions */
  private lastInputTick: number | null = null;
  private attackHistory: Style4[] = [];
  private cycleIndex = 0;

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

  get prayerBook(): PrayerBook {
    return this.config.prayerBook ?? 'Curses';
  }

  /** combat style of the wielded weapon (null = nothing in hand) */
  get style(): Style | null {
    return this.loadout.style;
  }

  /** overhead that protects against `style` in the session's book */
  protectionFor(style: Style4): string {
    return PROTECTION[this.prayerBook][style];
  }

  start(now: number): void {
    this.t0 = now;
    this.index = 0;
    this.castTick = null;
    this.wield = { mainHand: null, offHand: null, twoHand: null, ...(this.config.startWield ?? {}) };
    this.adrenaline = this.config.fullAdrenaline ? this.maxAdrenaline : Math.max(0, Math.min(this.maxAdrenaline, this.loadout.startAdrenaline));
    this.results = [];
    this.buffs = [];
    this.deferred = [];
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
    this.lastInputTick = null;
    this.activePrayers = new Set();
    this.prayerStats = { ticks: 0, soulSplitTicks: 0, attacks: 0, prayed: 0, hits: 0 };
    this.attackHistory = [];
    this.cycleIndex = 0;
    this.nextAttack = null;
    this.targetHp = this.config.targetLifePoints ?? 0;
    this.damageDealt = 0;
    this.hitCount = 0;
    this.killedTick = null;
    this.applyPrebuild();
    this.events.length = 0;
    this.state = 'running';
    const enemy = this.config.enemy;
    if (enemy?.enabled && enemy.styles.length) this.scheduleAttack(Math.max(1, enemy.firstAttackTicks));
    this.advanceIndex();
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

  /** counter of a stacking buff (Bloodlust, Necrosis ...); 0 when it is not active */
  stack(id: StackId): number {
    return this.buff(id)?.stacks ?? 0;
  }

  /** cap of a stack: loadout override (Soulbound lantern) else the definition's max */
  stackCap(id: StackId): number {
    return this.loadout.stackCaps[id] ?? BUFF_BY_ID.get(id)?.stacks?.max ?? Infinity;
  }

  hasBuff(id: string): boolean {
    return this.buffs.some((b) => b.id === id);
  }

  /** The running channel at `now`: progress by time (0..1), hits landed so far, time left. Null when nothing channels. */
  channelProgress(now: number): { key: string; phase: number; hitsDone: number; hits: number; remainingMs: number } | null {
    const ch = this.channel;
    if (!ch || ch.cancelled) return null;
    const start = this.tickTime(ch.castTick);
    const end = this.tickTime(ch.endTick);
    if (now >= end && ch.hitsDone >= ch.hits) return null;
    const phase = end > start ? Math.max(0, Math.min(1, (now - start) / (end - start))) : 1;
    return { key: ch.key, phase, hitsDone: ch.hitsDone, hits: ch.hits, remainingMs: Math.max(0, end - now) };
  }

  buff(id: string): ActiveBuff | undefined {
    return this.buffs.find((b) => b.id === id);
  }

  /** Which step of a sequence slot is currently shown (1 = base ability). */
  sequenceStep(group: string, tick: number): number {
    const s = this.sequences.get(group);
    return s && tick <= s.untilTick ? s.openStep : 1;
  }

  /** Current cast number of a staged ability (Spectral Scythe 1..3); expired windows are cleaned every tick. */
  private stageOf(rule: AbilityRule | undefined): number {
    if (!rule?.stages || !rule.sequence) return 1;
    return this.sequences.get(rule.sequence.group)?.openStep ?? 1;
  }

  /**
   * What a bar slot with `key` shows right now: another ability (Command X while the spirit lives,
   * Slaughter after Dismember) or a later cast of the same one (Spectral Scythe 2/3). Null = unchanged.
   */
  morphOf(key: string, tick: number): { key: string; stage: number } | null {
    const e = this.catalog.get(key);
    if (!e || e.kind !== 'ability') return null;
    const rule = ruleFor(e.id);
    if (rule?.stages && rule.sequence) {
      const stage = this.sequenceStep(rule.sequence.group, tick);
      return stage > 1 ? { key, stage } : null;
    }
    for (const target of MORPH_TARGETS.get(e.id) ?? []) {
      const tr = ruleFor(target);
      if (!tr) continue;
      if (tr.sequence && this.sequenceStep(tr.sequence.group, tick) === tr.sequence.step) return { key: 'ability:' + target, stage: tr.sequence.step };
      const spirit = tr.requires?.find((r) => r.spirit)?.spirit;
      if (spirit && this.spirits.has(spirit)) return { key: 'ability:' + target, stage: 1 };
    }
    return null;
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
    if (rule?.stages && this.stageOf(rule) > 1) return 0;
    let ready = this.readyTick.get(acting.key) ?? 0;
    const shared = rule?.sharedCooldown ?? acting.sharedCooldown;
    if (shared) ready = Math.max(ready, this.readyTick.get('shared:' + shared) ?? 0);
    // Command X right after the conjure: the game shows it as a short cooldown on the morphed slot
    const age = rule?.requires?.find((r) => r.spirit && r.spiritAgeMin !== undefined);
    if (age) {
      const sp = this.spirits.get(age.spirit!);
      if (sp) ready = Math.max(ready, sp.sinceTick + age.spiritAgeMin!);
    }
    return Math.max(0, ready - tick);
  }

  /** Length of the cooldown a slot sweep should show for `key` (its own cooldown, or the conjure-to-command wait). */
  cooldownTotalTicks(key: string): number {
    const e = this.catalog.get(key);
    if (!e) return 0;
    const rule = this.ruleOf(e);
    const own = rule?.cooldownTicks ?? (this.specFor(e) ?? e).cooldownTicks ?? 0;
    const age = rule?.requires?.find((r) => r.spirit && r.spiritAgeMin !== undefined);
    return own || age?.spiritAgeMin || 0;
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
    if (rule?.stages) cost = rule.stages[Math.min(this.stageOf(rule), rule.stages.length) - 1].cost;
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

  /** Why the wielded weapon cannot use this entity: wrong style, or a spec the weapon does not have. */
  weaponFailure(e: EngineEntity): 'weapon' | 'spec' | null {
    if (e.kind === 'spec') return this.loadout.weaponSpec?.id === e.id ? null : 'spec';
    if (e.kind !== 'ability') return null;
    // utility abilities off the GCD (Surge, Escape, Dive) work with any weapon; only real casts need the style
    if (this.isGcdStep(e) && e.style && isStyle4(e.style) && this.style !== e.style) return 'weapon';
    if (e.id === 'weapon-special-attack' && !this.loadout.weaponSpec) return 'spec';
    return null;
  }

  /** Why an entity could not be used at `tick` (for the greyed-out bars), weapon first like in the game. */
  usable(key: string, tick: number): UsableReason {
    const e = this.catalog.get(key);
    if (!e) return 'ok';
    if (e.kind === 'prayer') {
      const book = bookOf(prayerId(key));
      return book && book !== this.prayerBook ? 'book' : 'ok';
    }
    if (this.weaponFailure(e)) return 'weapon';
    const b = this.blocker(e, tick);
    if (!b) return 'ok';
    return b.kind === 'on-cooldown' ? 'cooldown' : b.kind === 'no-adrenaline' ? 'adrenaline' : 'requirement';
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
      // nothing happens instantly: an input is processed by the server on the first tick at or after its arrival
      const inputAt = next ? this.tickTime(this.tickOf(next.arrival)) : Infinity;
      const castAt = this.pending ? this.tickTime(this.pending.tick) : Infinity;
      const tickAt = this.tickTime(this.lastTick + 1);
      if (inputAt <= now && inputAt <= tickAt && inputAt <= castAt) {
        // inputs of a tick come first (a prayer switched on this tick counts for this tick's attack)
        this.inflight.shift();
        this.handle(next!);
      } else if (tickAt <= now && tickAt <= castAt) {
        // advance server ticks (over-time adrenaline, buff expiry) before anything scheduled later
        this.advanceTick(this.lastTick + 1);
      } else if (castAt <= now) {
        this.castPending();
        if (this.state !== 'running') return;
      } else {
        break;
      }
    }
  }

  private handle(input: PendingInput): void {
    if (input.key === SPEC_KEY) {
      // the generic special-attack slot fires the wielded weapon's spec; a rotation step written as that spec counts
      const wielded = this.loadout.weaponSpec?.id;
      const spec = wielded ? this.steps.find((s, i) => i >= this.index && !this.done.has(i) && s.kind === 'spec' && s.id === wielded) : undefined;
      if (spec) input = { ...input, key: spec.key };
    }
    let entity = this.catalog.get(input.key);
    if (!entity) return;
    const tickP = this.tickOf(input.arrival);
    // the slot fires what it shows: Command X while the spirit lives, Slaughter after Dismember
    const morph = this.morphOf(input.key, tickP);
    if (morph && morph.key !== input.key) {
      const target = this.catalog.get(morph.key);
      if (target) {
        input = { ...input, key: morph.key };
        entity = target;
      }
    }
    const wf = this.weaponFailure(entity);
    if (wf) {
      this.wrong++;
      this.events.push({ kind: 'wrong-weapon', key: entity.key, reason: wf });
      return;
    }
    const gcdEnd = this.gcdEndTick;
    const gcdRunning = gcdEnd !== null && tickP < gcdEnd && tickP > (this.castTick ?? -1);
    const rule = this.ruleOf(entity);
    // Bladed Dive / Provoke: off the GCD only while one runs, otherwise a normal basic
    if ((!entity.gcd && !rule?.offGcdNoGain) || rule?.offGcd || (rule?.offGcdNoGain && gcdRunning)) {
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
    if (this.pending?.key === input.key) {
      // pressing the queued ability again cancels the queue – in game only if the icon disappears at least one
      // tick before the cast, so on the cast tick itself the press changes nothing
      if (tickP < this.pending.tick) {
        this.pending = null;
        this.events.push({ kind: 'unqueued', key: input.key });
      }
      return;
    }
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
    if (entity.kind === 'special' && this.config.hasItem && !this.config.hasItem(entity.key)) return { kind: 'requirement', key: entity.key, text: 'not in your inventory' };
    const cd = this.cooldownLeft(entity.key, tick);
    if (cd > 0) return { kind: 'on-cooldown', key: entity.key, readyInTicks: cd };
    const req = this.requirementFailure(entity, tick);
    if (req) return { kind: 'requirement', key: entity.key, text: req };
    const { need } = this.costOf(entity);
    if (need > 0 && this.adrenaline < need) return { kind: 'no-adrenaline', key: entity.key, need, have: this.adrenaline };
    return null;
  }

  private handleOffGcd(entity: EngineEntity, tick: number, insideGcd: boolean): void {
    if (entity.kind === 'prayer') {
      const id = prayerId(entity.key);
      const book = bookOf(id);
      if (book && book !== this.prayerBook) {
        this.wrong++;
        this.events.push({ kind: 'wrong-book', id, book });
        return;
      }
      // a prayer that is already on and wanted later in the rotation: leave it, the step completes on its own
      if (this.activePrayers.has(id) && this.openOffGcdStep(this.index, entity.key) < 0 && this.steps.some((s, i) => i >= this.index && !this.done.has(i) && s.key === entity.key)) {
        return;
      }
    }
    const blocked = this.blocker(entity, tick);
    if (blocked) {
      this.wrong++;
      this.events.push(blocked);
      return;
    }
    // does it satisfy an open off-GCD step in the current group?
    let stepIndex = this.openOffGcdStep(this.index, entity.key);
    let ref = this.lastInputTick;
    // "bloat + vulnbomb": the companion may arrive on the same tick, before the ability itself casts
    if (stepIndex < 0 && this.pending && tick >= this.pending.tick) {
      const j = this.steps.findIndex((s, i) => i >= this.index && this.isGcdStep(s) && s.key === this.pending!.key);
      if (j >= 0) {
        stepIndex = this.openOffGcdStep(j + 1, entity.key);
        ref = this.pending.tick;
      }
    }
    this.activate(entity, tick, { offGcd: true, noGain: insideGcd && !!this.ruleOf(entity)?.offGcdNoGain });
    if (entity.kind === 'prayer' && !this.activePrayers.has(prayerId(entity.key))) {
      // switched the prayer off – never completes a step; counts as wrong if the rotation wanted it on
      if (stepIndex >= 0) this.wrong++;
      return;
    }
    if (stepIndex < 0) {
      // prayers are free actions (flicking, Soul Split): never a wrong press; the prayer score judges them
      if (entity.kind === 'prayer') return;
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
      if (this.isGcdStep(s)) break;
      if (!this.done.has(i) && !s.isNote && s.key === key) return i;
    }
    return -1;
  }

  /** Off-GCD abilities (Surge, Provoke ...), prayers, potions, weapon switches and notes are not GCD steps. */
  isGcdStep(e: EngineEntity): boolean {
    if (!e.gcd || e.isNote) return false;
    const rule = this.ruleOf(e);
    return !rule?.offGcd;
  }

  // ---------------------------------------------------------------- casting

  private castPending(): void {
    const p = this.pending!;
    const entity = this.catalog.get(p.key)!;
    // the weapon may have changed since the press: the queued ability just fails, like in the game
    const wf = this.weaponFailure(entity);
    if (wf) {
      this.pending = p.bypassed ? { ...p.bypassed, tick: p.tick } : null;
      this.wrong++;
      this.events.push({ kind: 'wrong-weapon', key: entity.key, reason: wf });
      return;
    }
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
    this.lastInputTick = p.tick;
    this.activate(entity, p.tick, { offGcd: false, noGain: false });

    if (!expected || entity.key !== expected.key) {
      this.wrong++;
      this.events.push({ kind: 'wrong-fired', key: entity.key, expected: expected?.key ?? '', tick: p.tick });
      return;
    }
    const expectedIndex = this.steps.indexOf(expected, this.index);
    const missed: string[] = [];
    for (let i = this.index; i < expectedIndex; i++) {
      if (this.steps[i].isNote || this.autoSatisfied(i, p.tick)) {
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

  /** A prayer step whose prayer is already active counts as done (records a result once). */
  private autoSatisfied(i: number, tick: number): boolean {
    const s = this.steps[i];
    if (this.done.has(i)) return true;
    if (s.kind !== 'prayer' || !this.activePrayers.has(prayerId(s.key))) return false;
    this.done.add(i);
    const result: StepResult = {
      step: i, key: s.key, name: s.name, kind: s.kind, outcome: 'done', lateTicks: 0, offsetMs: 0, tooEarly: 0, wrong: 0,
      firedAtTick: tick, adrenaline: this.adrenaline,
    };
    this.results.push(result);
    this.events.push({ kind: 'fired', result });
    return true;
  }

  /** Apply everything an entity does when it casts / activates at `tick`. */
  private activate(entity: EngineEntity, tick: number, opt: { offGcd: boolean; noGain: boolean }): void {
    if (entity.kind === 'prayer') {
      const id = prayerId(entity.key);
      const t = togglePrayer(this.activePrayers, id);
      this.activePrayers = t.active;
      this.events.push({ kind: 'prayer', id, on: t.on, replaced: t.replaced });
      return;
    }
    if (entity.weapon) {
      this.switchWeapon(entity.weapon);
      return;
    }
    if (entity.kind === 'action') return; // target cycle etc.: nothing to simulate

    const rule = this.ruleOf(entity);
    // Volley of Souls: one hit per stack held before the cast effects consume them
    const stacksBefore = rule?.hitsPerStack ? this.stack(rule.hitsPerStack) : 0;
    const spec = this.specFor(entity);
    const acting = spec ?? entity; // weapon special attacks act with the spec's numbers
    const globals = this.matchingGlobals(entity);

    // a new GCD ability cuts a running channel; a movement ability cuts one that cannot be channelled while moving
    if (this.channel && !this.channel.cancelled && tick < this.channel.endTick) {
      if (!opt.offGcd) this.cancelChannel();
      else if (rule?.moves) {
        const chRule = this.ruleOf(this.catalog.get(this.channel.key)!);
        const chSpec = this.loadout.channelOverrides[this.channel.key.slice(this.channel.key.indexOf(':') + 1)] ?? chRule?.channel ?? this.catalog.get(this.channel.key)?.channel;
        const movable = !!chSpec?.movable || (!!chSpec?.movableWith && this.loadout.items.has(chSpec.movableWith));
        if (!movable) this.cancelChannel();
      }
    }

    // cooldown (charges, own, shared)
    const stage = this.stageOf(rule);
    const cdTicks = rule?.stages && stage > 1 ? 0 : this.cooldownFor(acting, rule, tick);
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
    if (rule?.cost?.perStack) {
      const p = rule.cost.perStack;
      this.setStacks(p.stack, this.stack(p.stack) - Math.min(this.stack(p.stack), p.maxStacks), tick, entity.key);
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
    const appliesBuff = (e: Effect) => e.kind === 'buff' || e.kind === 'choose' || e.kind === 'conjure' || e.kind === 'stack' || e.kind === 'stack-set';
    const ruleAppliesBuffs = !!rule?.buffs || !!rule?.onCast?.some(appliesBuff) || !!rule?.onHit?.some(appliesBuff) || !!rule?.hitBuffs;
    if (rule?.buffs) {
      for (const id of rule.buffs) this.applyBuff(id, tick, entity.key);
    } else if (!ruleAppliesBuffs) {
      for (const b of acting.buffs) if (!this.modelledDataBuff(b)) this.applyDataBuff(b, tick, entity.key);
    }

    // what the cast's hits inherit before the effects change the state: a consumed buff's multiplier (Chaos Roar),
    // Endless Assault turning a channel into a DoT, the idle ticks of Greater Barge
    const channelSpecEarly = this.loadout.channelOverrides[entity.id] ?? rule?.channel ?? acting.channel;
    const asDot = !!channelSpecEarly?.asDotWhen && this.conditionMet(channelSpecEarly.asDotWhen, tick, 0);
    let castMult = 1;
    for (const g of globals) if (g.damageMult && (!g.consumes || this.hasBuff(g.consumes))) castMult *= g.damageMult.mult;
    const castMultFirstOnly = globals.some((g) => g.damageMult?.firstHitOnly);
    const idleTicks = tick - this.lastAttackTick;
    this.castFlags = new Set();

    // effects
    for (const eff of rule?.onCast ?? []) this.applyEffect(eff, tick, entity, 0);
    for (const g of globals) {
      for (const eff of g.onCast ?? []) this.applyEffect(eff, tick, entity, 0);
      if (g.consumes && !g.discount && this.hasBuff(g.consumes)) this.removeBuff(g.consumes);
    }
    const flags = this.castFlags;

    // sequences (staged abilities advance by their current cast and reset after the last one)
    if (rule?.sequence) {
      const last = rule.stages ? stage >= rule.stages.length : rule.sequence.last;
      const step = rule.stages ? stage : rule.sequence.step;
      if (last) this.sequences.delete(rule.sequence.group);
      else this.sequences.set(rule.sequence.group, { openStep: step + 1, untilTick: tick + rule.sequence.windowTicks });
    }

    // hits / channel (a cast inside the GCD that gives no adrenaline – Bladed Dive – deals no damage either)
    const channel = opt.noGain ? undefined : channelSpecEarly;
    let hits = opt.noGain ? undefined : this.loadout.hitsOverrides[entity.id] ?? rule?.hits ?? acting.hits ?? (this.isDamaging(acting, rule) ? [0] : undefined);
    if (rule?.hitsPerStack) hits = Array(Math.max(1, stacksBefore)).fill(0);
    const override = this.loadout.damageOverrides[entity.id];
    let damage = override ?? (acting.damageMin !== undefined && acting.damageMax !== undefined ? { min: acting.damageMin, max: acting.damageMax } : null);
    if (damage && rule?.damageRamp) {
      const k = Math.max(0, Math.min(rule.damageRamp.maxTicks, idleTicks));
      damage = { min: damage.min + k * rule.damageRamp.perTick.min, max: damage.max + k * rule.damageRamp.perTick.max };
    }
    // style buffs and flat bonuses count as they are at the cast (a Snipe cast on the last Death's Swiftness tick keeps the 1.5x)
    const mult = this.styleMultiplier(acting.style, false);
    const dotMult = this.styleMultiplier(acting.style, true);
    const flat = this.flatShare(acting.style, entity.id, false);
    const hitDamage = (i: number) => {
      const h = rule?.hitDamage?.[i];
      return h ? { min: h.min, max: h.max } : damage;
    };
    const hitWanted = (i: number) => {
      const w = rule?.hitDamage?.[i]?.when;
      return !w || this.conditionMet(w, tick, i, flags);
    };
    const multAt = (i: number) => (castMultFirstOnly && i > 0 ? 1 : castMult);
    if (channel && asDot) {
      // Endless Assault: the channel's hits land on their normal ticks but nothing can cancel them
      channel.hits.forEach((offset, i) =>
        this.scheduled.push({ key: entity.key, entity, rule, tick: tick + offset, index: i, total: channel.hits.length, channel: null, guaranteedCrit: !!channel.guaranteedCrit || !!rule?.guaranteedCrit, damage: hitDamage(i), mult, flat, castMult: multAt(i), flags }),
      );
      this.lastAttackTick = tick;
    } else if (channel) {
      this.channel = { key: entity.key, castTick: tick, endTick: tick + channel.ticks, hits: channel.hits.length, hitsDone: 0, cancelled: false };
      channel.hits.forEach((offset, i) =>
        this.scheduled.push({ key: entity.key, entity, rule, tick: tick + offset, index: i, total: channel.hits.length, channel: this.channel, guaranteedCrit: !!channel.guaranteedCrit || !!rule?.guaranteedCrit, damage: hitDamage(i), mult, flat, castMult: multAt(i), flags }),
      );
      this.lastAttackTick = tick;
    } else if (rule?.bleed) {
      const b = rule.bleed;
      const per = b.damage ?? (damage && b.splitTotal ? { min: damage.min / b.hits, max: damage.max / b.hits } : damage);
      // a recast restarts the DoT: the previous cast's remaining ticks are dropped
      this.scheduled = this.scheduled.filter((h) => !(h.dot && h.key === entity.key));
      if (b.direct) this.scheduled.push({ key: entity.key, entity, rule, tick, index: 0, total: 1, channel: null, guaranteedCrit: !!rule?.guaranteedCrit, damage, mult, flat, castMult, flags });
      for (let i = 0; i < b.hits; i++) {
        const f = b.factors?.[i] ?? 1;
        const offset = (b.startTicks ?? b.everyTicks) + i * b.everyTicks;
        this.scheduled.push({ key: entity.key, entity, rule, tick: tick + offset, index: i, total: b.hits, channel: null, guaranteedCrit: false, dot: true, damage: per ? { min: per.min * f, max: per.max * f } : null, mult: dotMult, flat: 0, castMult: b.direct ? 1 : multAt(i), flags });
      }
      this.lastAttackTick = tick;
    } else if (hits) {
      hits.forEach((offset, i) => {
        if (!hitWanted(i)) return;
        this.scheduled.push({ key: entity.key, entity, rule, tick: tick + offset, index: i, total: hits.length, channel: null, guaranteedCrit: !!rule?.guaranteedCrit, damage: hitDamage(i), mult, flat, castMult, flags });
      });
      this.lastAttackTick = tick;
    }
    this.processHits(tick);
  }

  /** Puts a weapon item in hand and re-resolves the loadout (style, spec, shield, conduit ...). */
  private switchWeapon(w: { id: string; slot: 'main' | 'off' | '2h'; style: Style }): void {
    if (w.slot === '2h') this.wield = { mainHand: null, offHand: null, twoHand: w.id };
    else if (w.slot === 'main') this.wield = { ...this.wield, mainHand: w.id, twoHand: null };
    else this.wield = { ...this.wield, offHand: w.id, twoHand: null };
    if (this.config.resolveWield) this.refreshLoadout();
    else this.config.loadout = { ...this.config.loadout, style: w.style };
    this.events.push({ kind: 'weapon', id: w.id, style: w.style });
  }

  /** Sets the weapons in hand directly (taking a weapon off in the gear panel) and re-resolves the loadout. */
  setWield(w: Wield): void {
    this.wield = { ...w };
    if (this.config.resolveWield) this.refreshLoadout();
  }

  /** Re-resolves the loadout through `resolveWield` – call after armour / jewellery changed while training. */
  refreshLoadout(): void {
    if (!this.config.resolveWield) return;
    const start = this.loadout.startAdrenaline;
    this.config.loadout = this.config.resolveWield(this.wield);
    this.config.loadout.startAdrenaline = start;
    this.adrenaline = Math.min(this.adrenaline, this.maxAdrenaline);
  }

  /** Abilities that hit the target (for hit effects) unless the rule/data says otherwise. */
  private isDamaging(acting: EngineEntity, rule: AbilityRule | undefined): boolean {
    if (acting.kind === 'prayer' || acting.kind === 'special' || acting.kind === 'action' || acting.kind === 'weapon') return false;
    if (rule?.offGcd) return false;
    if (rule?.onHit || rule?.hitBuffs) return true;
    // self-buff abilities (Berserk, Sunshine ...) have wiki buffs and no hit line; keep them hit-less. A wiki link to a
    // buff the rules model themselves (Bloodlust on Punish, Necrosis on Touch of Death) says nothing about damage.
    return !acting.buffs.some((b) => !this.modelledDataBuff(b)) && !rule?.buffs && !rule?.onCast?.some((e) => e.kind === 'buff' || e.kind === 'conjure');
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
        // set effects that need the full channel (Dracolich infusion: Rapid Fire with a bow)
        for (const fb of this.loadout.fullChannelBuffs[h.entity.id] ?? []) {
          if (fb.requiresWeapon && this.loadout.weaponType !== fb.requiresWeapon) continue;
          this.applyBuff(fb.buff, h.tick, h.entity.key, fb.durationTicks);
        }
        if (this.channel === h.channel) this.channel = null;
      }
    }
  }

  private onHit(h: ScheduledHit): void {
    const globals = this.matchingGlobals(h.entity);
    for (const eff of h.rule?.onHit ?? []) this.applyEffect(eff, h.tick, h.entity, h.index);
    for (const id of h.rule?.hitBuffs ?? []) this.applyBuff(id, h.tick, h.entity.key);
    let critAdd = this.loadout.critChanceAdd;
    for (const [id, c] of Object.entries(this.loadout.buffCritAdd)) if ((!c.style || c.style === h.entity.style) && this.hasBuff(id)) critAdd += c.add;
    for (const b of this.buffs) {
      const c = BUFF_BY_ID.get(b.id)?.crit;
      if (!c || (c.style && c.style !== h.entity.style) || (c.firstHitOnly && h.index !== 0)) continue;
      if (b.sourceKey === h.key && b.startTick === (h.channel?.castTick ?? h.tick)) continue; // granted by this very cast
      critAdd += c.add;
    }
    const crit = !h.dot && (h.guaranteedCrit || critAdd >= 1 || this.random() < BASE_CRIT_CHANCE + critAdd);
    if (h.damage) this.dealHit(h, crit);
    for (const g of globals) {
      for (const eff of g.onHit ?? []) this.applyEffect(eff, h.tick, h.entity, h.index);
      if (g.hitAdrenaline) this.addAdrenaline(g.hitAdrenaline * (this.hasBuff('natural-instinct') ? 2 : 1));
      if (g.critAdrenaline && crit) this.addAdrenaline(g.critAdrenaline * (this.hasBuff('natural-instinct') ? 2 : 1));
    }
    const perTick = this.loadout.channelAdrenalinePerTick[h.entity.id];
    if (perTick && h.channel) this.addAdrenaline(perTick);
  }

  /** Puts the pre-built state in place at tick 0 (see Prebuild). */
  private applyPrebuild(): void {
    const pb = this.config.prebuild;
    if (!pb) return;
    if (pb.adrenaline !== undefined) this.adrenaline = Math.max(0, Math.min(this.maxAdrenaline, pb.adrenaline));
    for (const [stack, n] of Object.entries(pb.stacks ?? {})) if (n > 0) this.setStacks(stack as StackId, n, 0, 'prebuild');
    for (const spirit of pb.spirits ?? []) {
      const duration = Math.round((CONJURE_BASE_TICKS + this.loadout.conjureDurationAdd) * this.loadout.conjureDurationMult);
      // remaining lifetime from the pre-build; default: conjured 6 ticks ago, so it is commandable right away
      const left = Math.max(1, Math.min(duration, pb.remaining?.['spirit:' + spirit] ?? duration - COMMAND_READY_AFTER));
      this.spirits.set(spirit, { spirit, sinceTick: left - duration, endTick: left });
      this.applyBuff('spirit-' + spirit, 0, 'prebuild', left);
    }
    for (const id of pb.abilities ?? []) {
      const e = this.catalog.get('ability:' + id);
      if (!e) continue;
      const left = pb.remaining?.['ability:' + id];
      const ruleBuffs = (ruleFor(id)?.onCast ?? []).filter((eff): eff is Extract<Effect, { kind: 'buff' }> => eff.kind === 'buff');
      for (const b of e.buffs) if (!this.modelledDataBuff(b)) this.applyDataBuff(left !== undefined && b.durationTicks !== null ? { ...b, durationTicks: Math.min(left, b.durationTicks) } : b, 0, e.key);
      for (const eff of ruleBuffs) {
        const full = eff.durationTicks ?? BUFF_BY_ID.get(eff.id)?.durationTicks ?? null;
        this.applyEffect(left !== undefined && full !== null ? { ...eff, durationTicks: Math.min(left, full) } : eff, 0, e, 0);
      }
      // abilities without a modelled buff still show as active for their wiki duration
      if (!e.buffs.length && !ruleBuffs.length) this.applyDataBuff({ id: e.key, name: e.name, kind: 'Buff', on: 'self', icon: e.icon, durationTicks: left ?? e.durationTicks ?? null }, 0, e.key);
    }
    for (const id of pb.prayers ?? []) {
      if (this.activePrayers.has(id)) continue;
      const t = togglePrayer(this.activePrayers, id);
      this.activePrayers = t.active;
    }
  }

  /** Rolls and applies the damage of one hit (engine/damage.ts). */
  private dealHit(h: ScheduledHit, crit: boolean): void {
    const l = this.loadout;
    let { min, max } = h.damage!;
    const rules = (h.rule?.damageRules ?? []).filter((d) => this.conditionMet(d.when, h.tick, h.index, h.flags));
    for (const d of rules) if (d.damage) ({ min, max } = d.damage);
    if (!h.dot) {
      if (l.preciseRank) min = Math.min(max, min + 0.015 * l.preciseRank * max);
      if (l.equilibriumRank) {
        min = Math.min(max, min + 0.03 * l.equilibriumRank * max);
        max = max * (1 - 0.01 * l.equilibriumRank);
      }
    }
    let amount = ((min + this.random() * Math.max(0, max - min)) / 100 + h.flat) * l.abilityDamage;
    if (crit) amount *= critMultiplier();
    const style = h.entity.style;
    amount *= h.mult;
    if (h.entity.abilityType === 'Ultimate' && !h.dot) amount *= l.ultimateDamageMult;
    amount *= h.castMult;
    for (const m of TARGET_DAMAGE_MULT) if ((!m.dotsOnly || h.dot) && this.hasBuff(m.buff)) amount *= m.mult;
    for (const d of rules) {
      if (d.mult !== undefined) amount *= d.mult;
      if (d.perMissingLp) {
        const lp = this.config.targetLifePoints;
        const missing = lp ? Math.max(0, 1 - this.targetHp / lp) * 100 : 0;
        amount *= 1 + Math.min(d.perMissingLp.max, d.perMissingLp.per * missing);
      }
    }
    this.applyDamage(h.key, Math.floor(amount + 1e-6), crit, !!h.dot, h.tick); // epsilon: 0.175 + 0.12 is 0.29499… in floating point
  }

  /** product of the active style buffs (Berserk, Sunshine, Death's Swiftness) for a hit of `style` */
  private styleMultiplier(style: Style | undefined, dot: boolean): number {
    let mult = 1;
    for (const m of BUFF_DAMAGE_MULT) if (m.style === style && (m.dots || !dot) && this.hasBuff(m.buff)) mult *= m.mult;
    return mult;
  }

  /** flat share of the ability damage added to every hit: active flat buffs (Searing Winds) plus item bonuses per ability (Caroming) */
  private flatShare(style: Style | undefined, abilityId: string, dot: boolean): number {
    let flat = this.loadout.flatAddPerAbility[abilityId] ?? 0;
    for (const f of BUFF_FLAT_ADD) if (f.style === style && (f.dots || !dot) && this.hasBuff(f.buff)) flat += f.pct / 100;
    return flat;
  }

  private applyDamage(key: string, amount: number, crit: boolean, dot: boolean, tick: number): void {
    if (amount <= 0) return;
    this.damageDealt += amount;
    this.hitCount++;
    this.events.push({ kind: 'hit', key, amount, crit, dot, tick });
    if (this.targetHp > 0) {
      this.targetHp = Math.max(0, this.targetHp - amount);
      if (this.targetHp === 0 && this.killedTick === null) {
        this.killedTick = tick;
        this.events.push({ kind: 'killed', tick });
        this.state = 'finished';
        this.events.push({ kind: 'finished' });
      }
    }
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

  // ---------------------------------------------------------------- enemy attacks (prayer training)

  private scheduleAttack(tick: number): void {
    const enemy = this.config.enemy!;
    const styles = enemy.styles;
    const last = this.attackHistory.at(-1);
    let style: Style4;
    switch (enemy.pattern) {
      case 'cycle':
        style = styles[this.cycleIndex % styles.length];
        this.cycleIndex++;
        break;
      case 'streak': {
        const n = Math.max(1, enemy.streak);
        const run = this.attackHistory.length;
        style = styles[Math.floor(run / n) % styles.length];
        break;
      }
      case 'no-repeat': {
        const pool = styles.length > 1 && last ? styles.filter((s) => s !== last) : styles;
        style = pool[Math.floor(this.random() * pool.length)];
        break;
      }
      default:
        style = styles[Math.floor(this.random() * styles.length)];
    }
    this.attackHistory.push(style);
    this.nextAttack = { tick, style, revealTick: tick - Math.max(0, enemy.warningTicks) };
  }

  // ---------------------------------------------------------------- effects

  private applyEffect(eff: Effect, tick: number, entity: EngineEntity, hitIndex: number): void {
    if ('when' in eff && eff.when && eff.kind !== 'choose' && !this.conditionMet(eff.when, tick, hitIndex)) return;
    switch (eff.kind) {
      case 'stack': {
        const cap = eff.cap ?? this.stackCap(eff.stack);
        this.setStacks(eff.stack, this.stack(eff.stack) + eff.amount, tick, entity.key, cap);
        break;
      }
      case 'stack-set':
        this.setStacks(eff.stack, eff.amount, tick, entity.key);
        break;
      case 'consume-stack': {
        const have = this.stack(eff.stack);
        if (eff.min !== undefined && have < eff.min) break;
        const take = eff.amount === 'all' ? have : Math.min(have, eff.amount);
        if (take <= 0) break;
        this.setStacks(eff.stack, have - take, tick, entity.key);
        for (const e of eff.then ?? []) this.applyEffect(e, tick, entity, hitIndex);
        break;
      }
      case 'buff': {
        if (eff.untilSpirit) {
          const s = this.spirits.get(eff.untilSpirit);
          if (!s) break;
          this.applyBuff(eff.id, tick, entity.key, Math.max(1, s.endTick - tick), eff.stacks, true);
          const b = this.buff(eff.id);
          if (b) b.spirit = eff.untilSpirit;
          break;
        }
        if (eff.delayTicks) {
          const at = tick + eff.delayTicks;
          this.deferred.push({ tick: at, apply: () => this.applyBuff(eff.id, at, entity.key, eff.durationTicks, eff.stacks, eff.refresh ?? true) });
          break;
        }
        this.applyBuff(eff.id, tick, entity.key, eff.durationTicks, eff.stacks, eff.refresh ?? true);
        break;
      }
      case 'extend-spirits': {
        for (const s of this.spirits.values()) {
          s.endTick += eff.ticks;
          for (const b of this.buffs) if ((b.id === 'spirit-' + s.spirit || b.spirit === s.spirit) && b.endTick !== null) b.endTick += eff.ticks;
        }
        break;
      }
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
        if (eff.value) this.castFlags.add(eff.flag);
        else this.castFlags.delete(eff.flag);
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
        this.buffs = this.buffs.filter((b) => b.spirit !== eff.spirit);
        if (s && eff.reconjureAfterTicks) this.reconjureReady.set(eff.spirit, s.sinceTick + eff.reconjureAfterTicks);
        break;
      }
      case 'choose':
        for (const e of this.conditionMet(eff.when, tick, hitIndex) ? eff.then : eff.otherwise ?? []) this.applyEffect(e, tick, entity, hitIndex);
        break;
    }
  }

  private conditionMet(c: Condition, tick: number, hitIndex: number, flags: Set<string> = this.castFlags): boolean {
    if (c.buff && !this.hasBuff(c.buff)) return false;
    if (c.flag !== undefined && !flags.has(c.flag)) return false;
    if (c.targetLpBelow !== undefined) {
      const lp = this.config.targetLifePoints;
      if (!lp || this.targetHp / lp >= c.targetLpBelow) return false;
    }
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
    // null = no timer (stacks, spirits until dismissed); unknown buffs default to one GCD
    let duration: number | null = durationOverride !== undefined ? durationOverride : def ? def.durationTicks : 3;
    if (duration !== null) {
      duration += this.loadout.buffDurationAdd[id] ?? 0;
      duration = Math.round(duration * (this.loadout.buffDurationMult[id] ?? 1));
    }
    const cap = def?.stacks ? this.stackCap(id as StackId) : Infinity;
    const existing = this.buff(id);
    if (existing) {
      if (stacks) existing.stacks = Math.min(cap, existing.stacks + stacks);
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
      stacks: Math.min(cap, stacks ?? 0),
      extended: 0,
      sourceKey,
    });
  }

  /** Sets the counter of a stacking buff (capped; a rule may raise the cap, e.g. Berserk); 0 removes a timer-less one, like in the game. */
  private setStacks(id: StackId, n: number, tick: number, sourceKey: string, cap = this.stackCap(id)): void {
    const existing = this.buff(id);
    // adding never pushes a count above the cap, but a count already above it (Bloodlust 5–8 after Berserk) is kept
    const value = Math.max(0, Math.min(Math.max(cap, existing?.stacks ?? 0), Math.round(n)));
    if (value <= 0) {
      if (!existing) return;
      if ((BUFF_BY_ID.get(id)?.durationTicks ?? null) === null) this.removeBuff(id);
      else existing.stacks = 0;
      return;
    }
    if (existing) {
      existing.stacks = value;
      return;
    }
    this.applyBuff(id, tick, sourceKey, undefined, 0, false);
    const b = this.buff(id);
    if (b) b.stacks = value;
  }

  /** A wiki buff link ("buff:<wiki id>") the rules already model (Residual Soul, Necrosis, Berserk ...) – no second icon. */
  private modelledDataBuff(b: EngineBuff): boolean {
    return b.id.startsWith('buff:') && MODELLED_WIKI_BUFFS.has(Number(b.id.slice(5)));
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
    const due = this.deferred.filter((d) => d.tick <= tick);
    this.deferred = this.deferred.filter((d) => d.tick > tick);
    for (const d of due) d.apply();
    if (this.config.rechargeAdrenaline) this.addAdrenaline(RECHARGE_PER_TICK);
    for (const o of this.overTime) {
      if (tick <= o.untilTick) this.addAdrenaline(o.perTick);
    }
    this.overTime = this.overTime.filter((o) => tick < o.untilTick);
    for (const b of this.buffs) {
      const def = BUFF_BY_ID.get(b.id);
      if (def?.adrenalinePerTick && (!def.adrenalinePerTickStyle || this.loadout.style === def.adrenalinePerTickStyle)) this.addAdrenaline(def.adrenalinePerTick);
    }
    this.buffs = this.buffs.filter((b) => b.endTick === null || b.endTick > tick);
    // conjured spirits attack on their own (Necromancy Spirit damage, no crits)
    for (const [name, s] of this.spirits) {
      const a = SPIRIT_ATTACKS[name];
      if (!a || tick <= s.sinceTick || (tick - s.sinceTick) % a.everyTicks !== 0 || tick > s.endTick) continue;
      let amount = ((a.min + this.random() * (a.max - a.min)) / 100) * this.loadout.abilityDamage;
      for (const m of TARGET_DAMAGE_MULT) if (this.hasBuff(m.buff)) amount *= m.mult;
      this.applyDamage('spirit:' + name, Math.floor(amount), false, false, tick);
    }
    for (const [name, s] of [...this.spirits]) {
      if (s.endTick <= tick) {
        this.spirits.delete(name);
        this.removeBuff('spirit-' + name);
        this.buffs = this.buffs.filter((b) => b.spirit !== name);
      }
    }
    for (const [group, s] of [...this.sequences]) {
      if (s.untilTick < tick) this.sequences.delete(group);
    }
    this.processHits(tick);
    if (this.channel && !this.channel.cancelled && this.channel.endTick <= tick && this.channel.hitsDone >= this.channel.hits) this.channel = null;

    // prayer score + enemy attacks
    this.prayerStats.ticks++;
    if (this.nextAttack && this.nextAttack.tick === tick) {
      const { style } = this.nextAttack;
      const needed = this.protectionFor(style);
      const prayed = this.activePrayers.has(needed);
      this.prayerStats.attacks++;
      if (prayed) this.prayerStats.prayed++;
      else this.prayerStats.hits++;
      this.events.push({ kind: 'attack', style, tick, prayed, needed });
      this.scheduleAttack(tick + Math.max(1, this.config.enemy!.intervalTicks));
    } else if (this.activePrayers.has(SOUL_SPLIT)) {
      this.prayerStats.soulSplitTicks++;
    }
  }

  private advanceIndex(): void {
    for (;;) {
      while (this.index < this.steps.length && this.done.has(this.index)) this.index++;
      if (this.index < this.steps.length && this.steps[this.index].isNote) {
        this.done.add(this.index);
        continue;
      }
      if (this.index < this.steps.length && this.autoSatisfied(this.index, this.lastTick)) continue;
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

  // ---------------------------------------------------------------- helpers

  ruleOf(e: EngineEntity): AbilityRule | undefined {
    return e.kind === 'ability' ? ruleFor(e.id) : undefined;
  }

  /** Weapon Special Attack / Essence of Finality steps act as the wielded weapon's spec; spec steps act as themselves. */
  specFor(e: EngineEntity): EngineEntity | null {
    if (e.kind === 'spec') return this.loadout.weaponSpec?.id === e.id ? this.loadout.weaponSpec : e;
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

/** "prayer:soul-split" → "soul-split" */
function prayerId(key: string): string {
  return key.replace(/^prayer:/, '');
}

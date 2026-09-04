import { COMMAND_READY_AFTER, CONJURE_BASE_TICKS } from './rules-necromancy';
import { AbilityType, CombatMode, EnemyConfig, EntityKind, FAMILIAR_SPECIAL_MAX, FAMILIAR_SPECIAL_REGEN, Familiar, PrayerStats, Prebuild, RevolutionSettings, SPEC_KEY, StepResult, Style, Style4, isStyle4 } from '../core/models';
import { ResolvedLoadout, defaultResolvedLoadout } from './loadout-resolved';
import { PROTECTION, PrayerBook, SOUL_SPLIT, bookOf, togglePrayer } from './prayer-rules';
import { BASE_CRIT_CHANCE, BUFF_DAMAGE_MULT, BUFF_FLAT_ADD, BUFF_TYPE_DAMAGE_MULT, POISON_EVERY_TICKS, POISON_ROLL, RAGE_MAX, RAGE_PER_STACK, SPIRIT_ATTACKS, TARGET_DAMAGE_ADD, TARGET_DAMAGE_MULT, critMultiplier } from './damage';
import { BUFF_HIT_CHANCE_ADD, HIT_CHANCE_BYPASS_DOTS, MIN_HIT_CHANCE, accuracyRating, accuracySkillOf, affinityStyleOf, armourRating, hitChance, prayerAccuracyLevels } from './hit-chance';
import { MORPH_TARGETS } from './morphs';
import { BUFF_BY_ID, MODELLED_WIKI_BUFFS, GLOBALS, actionRuleFor, ruleFor, scrollRuleFor, specRuleFor, specialRuleFor, spellBookOf, spellRuleFor } from './rules';
import { boneShieldTier } from './rules-necromancy';
import { AbilityRule, ChannelSpec, Condition, Effect, GlobalRule, Requirement, StackId } from './rules-model';

/** the Essence of Finality slot: fires the special stored in the amulet with a weapon of the same style */
export const EOF_KEY = 'ability:essence-of-finality';
/** hit key of the Bow of the Last Guardian's Perfect Equilibrium bonus hit */
export const PERFECT_EQUILIBRIUM_KEY = 'passive:perfect-equilibrium';

/** rules of the two special-attack slots merged with the rule of the spec they fire (slot requirements + spec behaviour) */
const WRAPPER_RULES = new Map<string, AbilityRule>();
function wrapperRule(slot: AbilityRule | undefined, specId: string): AbilityRule | undefined {
  const spec = specRuleFor(specId);
  if (!spec || !slot) return spec ?? slot;
  const k = slot.ability + '|' + specId;
  let merged = WRAPPER_RULES.get(k);
  if (!merged) {
    merged = { ...spec, ability: slot.ability, notes: [...slot.notes, ...spec.notes], requires: [...(slot.requires ?? []), ...(spec.requires ?? [])] };
    WRAPPER_RULES.set(k, merged);
  }
  return merged;
}

/** does any of these effects (also inside choose / consume-stack) apply a buff or conjure? */
function appliesBuff(effects: Effect[] | undefined): boolean {
  return (effects ?? []).some((e) => e.kind === 'buff' || e.kind === 'toggle-buff' || e.kind === 'conjure' || (e.kind === 'choose' && (appliesBuff(e.then) || appliesBuff(e.otherwise))) || (e.kind === 'consume-stack' && appliesBuff(e.then)));
}

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
  /**
   * ticks between a cast and its damage for ordinary hits (all offsets 0): the game lands the hitsplat a moment after the
   * ability. Rules with their own offsets (Snipe 3, Backhand 1, Death Skulls bounces …), channels, DoTs and conjured
   * spirits are not shifted. Default 0.
   */
  hitDelayTicks?: number;
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
  /** in-game "Combat Mode"; 'revolution' needs `revolution` (missing = full manual) */
  combatMode?: CombatMode;
  /** Revolution options + the main bar it scans (docs/research/revolution.md) */
  revolution?: RevolutionConfig;
  /** the target is not facing the player (Flanking perk applies) */
  targetFacingAway?: boolean;
  /** what the target is (Undead / Dragon / Demon Slayer perks apply) */
  targetType?: 'undead' | 'dragon' | 'demon';
  /** every hit lands in full – no hit chance against `enemy` (docs/research/hit-chance.md); missing = hit chance is simulated when an enemy is set */
  hitChanceDisabled?: boolean;
  /**
   * 'scaled' (default): the wiki's PvM "damage potential" – a hit deals hit chance × its roll, under 1% every attack misses.
   * 'roll': the pre-2024 / PvP model – every hit rolls against the hit chance and either lands in full or misses.
   */
  hitChanceModel?: 'scaled' | 'roll';
}

/**
 * Revolution: on every tick with a free GCD (and no manual input pending, no channel running) the engine casts the leftmost
 * usable ability of the first `slots` slots of the main bar. Only GCD abilities of the enabled types fire; special attacks,
 * Regenerate, off-GCD abilities, prayers, potions and weapon switches never do.
 */
export interface RevolutionConfig extends RevolutionSettings {
  /** ordered slot keys of the main bar ("ability:sever"), null = empty slot; missing = nothing to fire */
  bar?: (string | null)[];
  /** the main bar is bound per weapon style: re-read it after a weapon switch (missing = `bar` for every style) */
  resolveBar?: (style: Style | null) => (string | null)[];
}

/** abilities Revolution never triggers although they are GCD abilities (wiki patch notes) */
export const REVOLUTION_NEVER = new Set(['weapon-special-attack', 'essence-of-finality', 'regenerate']);

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
  /** familiar scroll (special of kind "scroll"): needs this familiar out (ResolvedLoadout.familiar) and costs special move points */
  scroll?: { familiar: string; specialPoints: number };
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
  /** Skeleton Warrior: Rage stacks (+3% per attack, max 25) */
  rage: number;
}

export interface ActiveChannel {
  key: string;
  castTick: number;
  endTick: number;
  hits: number;
  hitsDone: number;
  cancelled: boolean;
  /** damage the channel's hits dealt so far (Blood Siphon's last hit adds a share of it) */
  dealt: number;
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
  /** enemy attack landed; `absorbed` = buff that blocked it (Disruption Shield, Barricade, Resonance, Divert), `reflected` = Vengeance went off */
  | { kind: 'attack'; style: Style4; tick: number; prayed: boolean; needed: string; absorbed?: string; reflected?: boolean }
  /** an ability with a running buff was pressed again and released it (Reprisal) */
  | { kind: 'recast'; key: string; tick: number }
  | { kind: 'missed'; keys: string[] }
  /** a hit landed on the target (key = source ability / "spirit:<name>"); `miss` = it missed (amount 0, no on-hit effects) */
  | { kind: 'hit'; key: string; amount: number; crit: boolean; dot: boolean; tick: number; miss?: boolean }
  /** the target's life points reached 0 */
  | { kind: 'killed'; tick: number }
  /** Revolution cast `key` on its own; `matched` = it was the expected step (a 'fired' result with auto: true follows) */
  | { kind: 'auto'; key: string; tick: number; matched: boolean; expected: string }
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
  /** chosen by Revolution, not pressed */
  auto?: boolean;
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
  /** the hit is the conjured spirit's (Command Skeleton Warrior): no crit, Rage, robes */
  spirit?: string;
  /** critical strike chance from buffs the cast consumed (Concentrated Blast stacks) */
  critAdd: number;
  /** an item proc's hit (Scripture of Wen): no rule or global effects, no further procs */
  proc?: boolean;
  /** absolute damage added after the roll, before the critical strike (Perfect Equilibrium: 33–37% of the triggering hit) */
  addAbs?: number;
  /** the hit adds no Perfect Equilibrium stack (the bonus hit itself) */
  noStack?: boolean;
  /** tick of the cast that scheduled the hit (a bleed's later ticks follow the first one's hit roll) */
  castTick?: number;
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
  /** special move points of the familiar (0..60, +15 every 30 s); scrolls spend them */
  familiarSpecial = FAMILIAR_SPECIAL_MAX;
  /** buffs that start a few ticks after their cast (Death's Swiftness, Sunshine) */
  private deferred: { tick: number; apply: () => void }[] = [];
  /** flags set by the cast being activated (consume-stack → flag) */
  private castFlags = new Set<string>();
  channel: ActiveChannel | null = null;
  /** weapons in hand */
  wield: Wield = { mainHand: null, offHand: null, twoHand: null };
  /** ids of the active prayers (e.g. "soul-split") */
  activePrayers = new Set<string>();
  prayerStats: PrayerStats = { ticks: 0, soulSplitTicks: 0, attacks: 0, prayed: 0, hits: 0, absorbed: 0 };
  nextAttack: IncomingAttack | null = null;
  /** life points left on the target (0 when unlimited) */
  targetHp = 0;
  damageDealt = 0;
  hitCount = 0;
  /** player hits that missed (hit chance) */
  missCount = 0;
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
  /** Aftershock: damage dealt since the last explosion, and the tick from which the next one may fire */
  private aftershockStored = 0;
  private aftershockReadyTick = 0;
  /** Crackling: the first attack from this tick on zaps */
  private cracklingReadyTick = 0;
  /** asylum surgeon's ring: no second cost reduction before this tick */
  private costReductionLockUntil = -1;
  /** item proc id → no second proc before this tick */
  private procLockUntil = new Map<string, number>();
  /** Scripture of Jas windows: damage dealt until `untilTick`, `share` of it dealt one tick later */
  private echoes: { key: string; untilTick: number; share: number; cap: number; dealt: number }[] = [];
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

  /** factor on the player's current and maximum life points from active buffs (Powerburst of vitality 2); the trainer has no life point pool yet */
  get maxLifePointsMult(): number {
    let mult = 1;
    for (const b of this.buffs) mult *= BUFF_BY_ID.get(b.id)?.maxLifePointsMult ?? 1;
    return mult;
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
    this.familiarSpecial = FAMILIAR_SPECIAL_MAX;
    this.channel = null;
    this.inflight = [];
    this.pending = null;
    this.done.clear();
    this.tooEarly = 0;
    this.wrong = 0;
    this.readyTick.clear();
    this.chargeReady.clear();
    this.sequences.clear();
    this.aftershockStored = 0;
    this.aftershockReadyTick = 0;
    this.cracklingReadyTick = 0;
    this.missCount = 0;
    this.reconjureReady.clear();
    this.scheduled = [];
    this.overTime = [];
    this.lastTick = 0;
    this.lastAttackTick = -1000;
    this.relentlessLockUntil = -1;
    this.costReductionLockUntil = -1;
    this.procLockUntil.clear();
    this.echoes = [];
    this.lastInputTick = null;
    this.activePrayers = new Set();
    this.prayerStats = { ticks: 0, soulSplitTicks: 0, attacks: 0, prayed: 0, hits: 0, absorbed: 0 };
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
    // the special-attack slots show the wielded / stored weapon's special, like the ability name changes in game
    if (e.id === 'weapon-special-attack' || e.id === 'essence-of-finality') {
      const spec = e.id === 'weapon-special-attack' ? this.loadout.weaponSpec : this.eofSpecReady();
      return spec ? { key: spec.key, stage: 1 } : null;
    }
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
    const e = this.entityOf(key);
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
    const e = this.entityOf(key);
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
    const out = this.baseCostOf(e);
    // Feasting Spores (Deathspore arrows): the cast is free, the requirement stays
    for (const g of this.matchingGlobals(e)) if (g.costMult !== undefined && (!g.consumes || this.hasBuff(g.consumes))) out.cost = Math.round(out.cost * g.costMult);
    return out;
  }

  private baseCostOf(e: EngineEntity): { need: number; cost: number } {
    const rule = this.ruleOf(e);
    const spec = this.specFor(e);
    if (spec) {
      // requirement = cost, Ring of vigour ×0.9 on both; Icy Tempest: the cost drops per Primordial Ice stack, the requirement stays
      const base = spec.adrenaline < 0 ? -spec.adrenaline : 0;
      const p = rule?.cost?.perStack;
      const cost = p ? Math.max(0, p.base - p.per * Math.min(this.stack(p.stack), p.maxStacks)) : base;
      return { need: Math.round(base * this.loadout.specCostMult), cost: Math.round(cost * this.loadout.specCostMult) };
    }
    if (this.isThreshold(e, rule)) {
      let need = 50;
      for (const b of this.buffs) {
        const n = BUFF_BY_ID.get(b.id)?.thresholdNeed;
        if (n !== undefined) need = Math.min(need, n);
      }
      return { need, cost: 15 };
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
    if (e.kind === 'spec') return this.loadout.weaponSpec?.id === e.id || this.eofSpecReady()?.id === e.id ? null : 'spec';
    if (e.kind !== 'ability') return null;
    // the stored special needs a wielded weapon of its own style – greyed out like in the game
    if (e.id === 'essence-of-finality' && this.loadout.eofSpec && !this.eofSpecReady()) return 'weapon';
    // utility abilities off the GCD (Surge, Escape, Dive) work with any weapon; only real casts need the style
    if (this.isGcdStep(e) && e.style && isStyle4(e.style) && this.style !== e.style) return 'weapon';
    if (e.id === 'weapon-special-attack' && !this.loadout.weaponSpec) return 'spec';
    return null;
  }

  /** Why an entity could not be used at `tick` (for the greyed-out bars), weapon first like in the game. */
  usable(key: string, tick: number): UsableReason {
    const e = this.entityOf(key);
    if (!e) return 'ok';
    if (e.kind === 'prayer') {
      const book = bookOf(prayerId(key));
      return book && book !== this.prayerBook ? 'book' : 'ok';
    }
    if (e.kind === 'spell') {
      const book = spellBookOf(e.id);
      if (book && book !== this.loadout.spellbook) return 'book';
    }
    if (this.weaponFailure(e)) return 'weapon';
    const b = this.blocker(e, tick);
    if (!b) return 'ok';
    return b.kind === 'on-cooldown' ? 'cooldown' : b.kind === 'no-adrenaline' ? 'adrenaline' : 'requirement';
  }

  // ---------------------------------------------------------------- input

  /** keys pressed but not yet processed by the server (the game shows them as "clicked" until their tick) */
  get inflightKeys(): string[] {
    return this.inflight.map((i) => i.key);
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
    const slot = input.key === SPEC_KEY || input.key === EOF_KEY;
    if (slot) {
      // the special-attack / Essence of Finality slot fires the wielded / stored weapon's spec; a rotation step written as that spec counts
      const fired = input.key === SPEC_KEY ? this.loadout.weaponSpec?.id : this.eofSpecReady()?.id;
      const spec = fired ? this.steps.find((s, i) => i >= this.index && !this.done.has(i) && s.kind === 'spec' && s.id === fired) : undefined;
      if (spec) input = { ...input, key: spec.key };
    }
    let entity = this.catalog.get(input.key);
    if (!entity) return;
    const tickP = this.tickOf(input.arrival);
    // the slot fires what it shows: Command X while the spirit lives, Slaughter after Dismember (the special-attack slots act through specFor)
    const morph = slot ? null : this.morphOf(input.key, tickP);
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
    if (rule?.recast && this.hasBuff(rule.recast.whileBuff)) {
      this.removeBuff(rule.recast.whileBuff);
      this.events.push({ kind: 'recast', key: entity.key, tick: tickP });
      return;
    }
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
      // queueing off: the game ignores every press inside the global cooldown, whatever the key – players spam
      // the next ability until it goes off, so this is neither a cast nor a mistake
      if (input.key === expected) this.tooEarly++;
      this.events.push({ kind: 'too-early', key: input.key, ticksEarly: gcdEnd - tickP });
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
    if (entity.scroll) {
      const fam = this.loadout.familiar;
      if (!fam || fam.id !== entity.scroll.familiar) return { kind: 'requirement', key: entity.key, text: 'needs the ' + entity.scroll.familiar.replace(/-/g, ' ') + ' familiar (Loadout page)' };
    } else if (entity.kind === 'special' && this.config.hasItem && !this.config.hasItem(entity.key)) {
      return { kind: 'requirement', key: entity.key, text: 'not in your inventory' };
    }
    const lock = this.buffs.find((b) => BUFF_BY_ID.get(b.id)?.locksAbilities);
    if (lock && entity.kind !== 'prayer') return { kind: 'requirement', key: entity.key, text: 'no abilities while ' + lock.name + ' stuns you' };
    const cd = this.cooldownLeft(entity.key, tick);
    if (cd > 0) return { kind: 'on-cooldown', key: entity.key, readyInTicks: cd };
    if (entity.scroll && this.familiarSpecial < entity.scroll.specialPoints) return { kind: 'requirement', key: entity.key, text: 'needs ' + entity.scroll.specialPoints + ' special move points (' + this.familiarSpecial + ' left)' };
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
    // a Revolution choice that became unusable in the meantime is dropped; the bar is scanned again next tick
    if (p.auto && (this.weaponFailure(entity) || this.blocker(entity, p.tick))) {
      this.pending = null;
      return;
    }
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

    const matched = !!expected && entity.key === expected.key;
    if (p.auto) this.events.push({ kind: 'auto', key: entity.key, tick: p.tick, matched, expected: expected?.key ?? '' });
    if (!expected || entity.key !== expected.key) {
      // Revolution's own choice is not a player mistake: no wrong counter, the rotation keeps waiting for the expected step
      if (p.auto) return;
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
    if (p.auto) result.auto = true;
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
    if (this.channel && !this.channel.cancelled && tick < this.channel.endTick && (entity.weapon || entity.kind === 'special')) {
      const chRule = this.ruleOf(this.catalog.get(this.channel.key)!);
      if (chRule?.channel?.cancelledBy?.includes(entity.weapon ? 'weapon' : 'special')) this.cancelChannel();
    }
    if (entity.weapon) {
      this.switchWeapon(entity.weapon);
      return;
    }
    const rule = this.ruleOf(entity);
    if (entity.kind === 'action' && !rule) return; // target cycle etc.: nothing to simulate (the combat dummy has a rule)
    // Volley of Souls: one hit per stack held before the cast effects consume them
    const stacksBefore = rule?.hitsPerStack ? this.stack(rule.hitsPerStack) : 0;
    // Death Grasp / Soul Crush / Icy Tempest: the per-stack damage is read before the cost or the cast effects consume the stacks
    const addStacks = rule?.damageAddPerStack ? this.stack(rule.damageAddPerStack.stack) : 0;
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
      for (const g of globals) if (g.consumes && (g.discount || g.costMult !== undefined) && this.hasBuff(g.consumes)) this.removeBuff(g.consumes);
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
      const red = this.loadout.costReduction; // asylum surgeon's ring: 10% chance of −15%, 30 s internal cooldown
      if (red && paid > 0 && tick >= this.costReductionLockUntil && this.random() < red.chance) {
        paid = Math.max(0, paid - red.amount);
        this.costReductionLockUntil = tick + red.cooldownTicks;
      }
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
          // Jaws of the Abyss: damaging melee basics +2% per bleed on the target
          if (entity.style === 'Melee' && this.loadout.adrenalinePerBleed && this.isDamaging(acting, rule)) gain += this.loadout.adrenalinePerBleed * this.bleedsOnTarget();
        }
        for (const g of globals) {
          if (g.gainAdd) gain += g.gainAdd;
          if (g.gainMult !== undefined) gain *= g.gainMult;
        }
        delta += gain;
      }
    }
    this.addAdrenaline(delta);
    if (entity.scroll) this.familiarSpecial = Math.max(0, this.familiarSpecial - entity.scroll.specialPoints);
    if (acting.adrenalineOverTime && acting.adrenalineOverTime.ticks > 0) {
      this.overTime.push({ key: acting.key, perTick: acting.adrenalineOverTime.amount / acting.adrenalineOverTime.ticks, untilTick: tick + acting.adrenalineOverTime.ticks });
    }

    // buffs: rules first, wiki data as fallback
    const appliesBuff = (e: Effect) => e.kind === 'buff' || e.kind === 'toggle-buff' || e.kind === 'remove-buff' || e.kind === 'choose' || e.kind === 'conjure' || e.kind === 'stack' || e.kind === 'stack-set';
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
    const bleedEarly = rule?.bleedWhen?.find((b) => this.conditionMet(b.when, tick, 0))?.bleed ?? rule?.bleed;
    if (bleedEarly?.noCooldown) {
      // Essence Corruption: a DoT dealt at once starts no cooldown
      this.readyTick.delete(acting.key);
      if (shared) this.readyTick.delete('shared:' + shared);
    }
    let castMult = 1;
    for (const g of globals) if (g.damageMult && (!g.consumes || this.hasBuff(g.consumes))) castMult *= g.damageMult.mult;
    const castMultFirstOnly = globals.some((g) => g.damageMult?.firstHitOnly);
    let consumedCritAdd = 0;
    for (const g of globals) {
      if (!g.consumes || g.discount || !this.hasBuff(g.consumes)) continue;
      const def = BUFF_BY_ID.get(g.consumes);
      if (def?.critChancePerStack) consumedCritAdd += def.critChancePerStack * this.stack(g.consumes as StackId);
      if (def?.crit && (!def.crit.style || def.crit.style === acting.style)) consumedCritAdd += def.crit.add;
    }
    const idleTicks = tick - this.lastAttackTick;
    this.castFlags = new Set();
    if (rule?.stages && stage >= rule.stages.length) this.castFlags.add('last-stage');
    const stacksAtCast = rule?.damagePerStack ? this.stack(rule.damagePerStack.stack) : 0;
    for (const d of rule?.damageRules ?? []) if (d.perStackAtCast) castMult *= 1 + d.perStackAtCast.mult * this.stack(d.perStackAtCast.stack);

    // effects
    for (const eff of rule?.onCast ?? []) this.applyEffect(eff, tick, entity, 0);
    for (const g of globals) {
      for (const eff of g.onCast ?? []) this.applyEffect(eff, tick, entity, 0);
      if (g.consumes && !g.discount && g.costMult === undefined && this.hasBuff(g.consumes)) this.removeBuff(g.consumes);
    }
    // Dominion mine: a share of the target's maximum life points (capped) a few ticks later; Vulnerability applies
    if (rule?.targetLpHit) {
      const t = rule.targetLpHit;
      const at = tick + t.delayTicks;
      const key = entity.key;
      this.deferred.push({
        tick: at,
        apply: () => {
          const max = this.config.targetLifePoints;
          let amount = max ? Math.min(t.cap, Math.floor(t.share * max)) : t.cap;
          for (const m of TARGET_DAMAGE_MULT) if (!m.dotsOnly && this.hasBuff(m.buff)) amount *= m.mult;
          this.applyDamage(key, Math.floor(amount), false, false, at);
        },
      });
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
    const bleed = opt.noGain ? undefined : bleedEarly;
    let hits = opt.noGain || rule?.noDamage ? undefined : this.loadout.hitsOverrides[entity.id] ?? rule?.hits ?? acting.hits ?? (this.isDamaging(acting, rule) ? [0] : undefined);
    if (rule?.hitsPerStack) hits = Array(Math.max(1, stacksBefore)).fill(0);
    const override = this.loadout.damageOverrides[entity.id];
    let damage: { min: number; max: number } | null = override ?? rule?.stages?.[Math.min(stage, rule.stages.length) - 1]?.damage ?? (acting.damageMin !== undefined && acting.damageMax !== undefined ? { min: acting.damageMin, max: acting.damageMax } : null);
    if (rule?.damagePerStack) {
      const n = stacksAtCast;
      damage = n > 0 ? { min: rule.damagePerStack.min * n, max: rule.damagePerStack.max * n } : null;
      if (damage && hits === undefined) hits = [0];
    }
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
      let d = h ? { min: h.min, max: h.max } : damage;
      const add = rule?.damageAddPerStack;
      if (d && add && addStacks > 0) d = { min: d.min + add.min * addStacks, max: d.max + add.max * addStacks };
      const m = channel?.damageMult;
      if (d && m !== undefined) d = { min: d.min * m, max: d.max * m };
      const ramp = channel?.damageRamp;
      if (d && ramp) d = { min: d.min + i * ramp.min, max: d.max + i * ramp.max };
      return d;
    };
    const hitWanted = (i: number) => {
      const w = rule?.hitDamage?.[i]?.when;
      return !w || this.conditionMet(w, tick, i, flags);
    };
    const multAt = (i: number) => (castMultFirstOnly && i > 0 ? 1 : castMult);
    if (channel && asDot) {
      // Endless Assault: the channel's hits land on their normal ticks but nothing can cancel them
      channel.hits.forEach((offset, i) =>
        this.scheduled.push({ key: entity.key, entity: acting, rule, tick: tick + offset, index: i, total: channel.hits.length, channel: null, guaranteedCrit: !!channel.guaranteedCrit || !!rule?.guaranteedCrit, damage: hitDamage(i), mult, flat, castMult: multAt(i), flags, critAdd: consumedCritAdd, castTick: tick }),
      );
      this.lastAttackTick = tick;
    } else if (channel) {
      this.channel = { key: entity.key, castTick: tick, endTick: tick + channel.ticks, hits: channel.hits.length, hitsDone: 0, cancelled: false, dealt: 0 };
      channel.hits.forEach((offset, i) =>
        this.scheduled.push({ key: entity.key, entity: acting, rule, tick: tick + offset, index: i, total: channel.hits.length, channel: this.channel, guaranteedCrit: !!channel.guaranteedCrit || !!rule?.guaranteedCrit, damage: hitDamage(i), mult, flat, castMult: multAt(i), flags, critAdd: consumedCritAdd, castTick: tick }),
      );
      this.lastAttackTick = tick;
    } else if (bleed) {
      const b = bleed;
      const per = b.damage ?? (damage && b.splitTotal ? { min: damage.min / b.hits, max: damage.max / b.hits } : damage);
      // a recast restarts the DoT: the previous cast's remaining ticks are dropped
      this.scheduled = this.scheduled.filter((h) => !(h.dot && h.key === entity.key));
      if (b.direct) this.scheduled.push({ key: entity.key, entity: acting, rule, tick: tick + this.hitDelay(), index: 0, total: 1, channel: null, guaranteedCrit: !!rule?.guaranteedCrit, damage, mult, flat, castMult, flags, critAdd: consumedCritAdd, castTick: tick });
      for (let i = 0; i < b.hits; i++) {
        const f = b.factors?.[i] ?? 1;
        const offset = (b.startTicks ?? b.everyTicks) + i * b.everyTicks;
        this.scheduled.push({ key: entity.key, entity: acting, rule, tick: tick + offset, index: i, total: b.hits, channel: null, guaranteedCrit: false, dot: true, damage: per ? { min: per.min * f, max: per.max * f } : null, mult: dotMult, flat: 0, castMult: b.direct ? 1 : multAt(i), flags, critAdd: 0, castTick: tick });
      }
      this.lastAttackTick = tick;
    } else if (hits) {
      // an ordinary hit (no timing of its own) lands after the configured hit delay
      const delay = hits.every((o) => o === 0) ? this.hitDelay() : 0;
      hits.forEach((offset, i) => {
        if (!hitWanted(i)) return;
        this.scheduled.push({ key: entity.key, entity: acting, rule, tick: tick + offset + delay, index: i, total: hits.length, channel: null, guaranteedCrit: !!rule?.guaranteedCrit, damage: hitDamage(i), mult, flat, castMult, flags, spirit: rule?.spiritHit, critAdd: consumedCritAdd, castTick: tick });
      });
      this.lastAttackTick = tick;
    }
    this.processHits(tick);
  }

  /** configured delay of ordinary hits, clamped to 0..5 ticks */
  private hitDelay(): number {
    const d = this.config.hitDelayTicks ?? 0;
    return Number.isFinite(d) ? Math.max(0, Math.min(5, Math.round(d))) : 0;
  }

  /** Puts a weapon item in hand and re-resolves the loadout (style, spec, shield, conduit ...). */
  private switchWeapon(w: { id: string; slot: 'main' | 'off' | '2h'; style: Style }): void {
    if (w.slot !== 'off') this.buffs = this.buffs.filter((b) => !BUFF_BY_ID.get(b.id)?.removedOnMainHandSwap);
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
    // "switching to a different weapon without the perk resets the stored damage to zero" (Aftershock)
    if (!this.config.loadout.aftershock) this.aftershockStored = 0;
  }

  /** Abilities that hit the target (for hit effects) unless the rule/data says otherwise. */
  private isDamaging(acting: EngineEntity, rule: AbilityRule | undefined): boolean {
    if (acting.kind === 'prayer' || acting.kind === 'special' || acting.kind === 'action' || acting.kind === 'weapon' || acting.kind === 'spell') return false;
    if (rule?.offGcd) return false;
    if (rule?.onHit || rule?.hitBuffs) return true;
    // self-buff abilities (Berserk, Sunshine ...) have wiki buffs and no hit line; keep them hit-less. A wiki link to a
    // buff the rules model themselves (Bloodlust on Punish, Necrosis on Touch of Death) says nothing about damage.
    return !acting.buffs.some((b) => !this.modelledDataBuff(b)) && !rule?.buffs && !appliesBuff(rule?.onCast);
  }

  private processHits(tick: number): void {
    const due = this.scheduled.filter((h) => h.tick <= tick).sort((a, b) => a.tick - b.tick || a.index - b.index);
    this.scheduled = this.scheduled.filter((h) => h.tick > tick);
    for (const h of due) {
      const ch = h.channel ? this.loadout.channelOverrides[h.entity.id] ?? h.rule?.channel ?? h.entity.channel : undefined;
      if (h.channel) {
        if (h.channel.cancelled) continue;
        if (ch?.adrenalinePerHit) {
          if (this.adrenaline < ch.adrenalinePerHit && !ch.continueWithoutAdrenaline) {
            this.cancelChannel();
            continue;
          }
          this.addAdrenaline(-Math.min(this.adrenaline, ch.adrenalinePerHit));
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
    const globals = h.proc ? [] : this.matchingGlobals(h.entity);
    let critAdd = this.loadout.critChanceAdd;
    for (const [id, c] of Object.entries(this.loadout.buffCritAdd)) if ((!c.style || c.style === h.entity.style) && this.hasBuff(id)) critAdd += c.add;
    const chCrit = this.loadout.channelCritPerHit; // channeller's ring: +4% per channel hit, the first included
    if (chCrit && h.channel && (!chCrit.style || chCrit.style === h.entity.style)) critAdd += chCrit.add * (h.index + 1);
    if (this.loadout.critVsBleeding && this.bleedsOnTarget() > 0) critAdd += this.loadout.critVsBleeding; // champion's ring
    for (const b of this.buffs) {
      const def = BUFF_BY_ID.get(b.id);
      if (def?.critChancePerStack) critAdd += def.critChancePerStack * b.stacks;
      const c = def?.crit;
      if (!c || (c.style && c.style !== h.entity.style) || (c.firstHitOnly && h.index !== 0)) continue;
      if (b.sourceKey === h.key && b.startTick === (h.channel?.castTick ?? h.tick)) continue; // granted by this very cast
      critAdd += c.add;
    }
    critAdd += h.critAdd + (h.rule?.crit?.chanceAdd ?? 0) + (h.rule?.hitCrit?.[h.index]?.chanceAdd ?? 0);
    // hit chance (docs/research/hit-chance.md) is rolled before the critical strike, so a pinned random keeps the crit roll's meaning
    const roll = this.hitRoll(h);
    if (roll.miss) {
      // a miss: no damage, no on-hit effects (stacks, bleeds, procs, poison); the later ticks of a missed bleed never come.
      // Crackling bypasses hit chance ("triggers on the next attack"), so it still fires.
      this.missCount++;
      this.events.push({ kind: 'hit', key: h.key, amount: 0, crit: false, dot: !!h.dot, tick: h.tick, miss: true });
      if (h.castTick !== undefined) this.scheduled = this.scheduled.filter((x) => !(x.dot && x.key === h.key && x.castTick === h.castTick));
      if (!h.dot && !h.spirit) this.crackle(h.tick);
      return;
    }
    // Equilibrium: "prevents critically striking" – even guaranteed crits (Smoke Tendrils) are ordinary hits
    const crit = !this.loadout.critDisabled && !h.dot && !h.spirit && !h.rule?.crit?.never && (h.guaranteedCrit || critAdd >= 1 || this.random() < BASE_CRIT_CHANCE + critAdd);
    if (!h.dot && !h.spirit) this.crackle(h.tick);
    const outerFlags = this.castFlags;
    this.castFlags = h.flags; // the hit's own effects see the flags of its cast
    for (const eff of h.rule?.onHit ?? []) this.applyEffect(eff, h.tick, h.entity, h.index);
    this.castFlags = outerFlags;
    for (const id of h.rule?.hitBuffs ?? []) this.applyBuff(id, h.tick, h.entity.key);
    const preCrit = h.damage ? this.dealHit(h, crit, roll.scale) : 0;
    // a direct hit: not damage over time, not a conjured spirit's, not an item proc's (ammunition effects count these)
    const direct = !!h.damage && !h.dot && !h.spirit && !h.proc;
    // Instability: a critical strike of the buff's style fires an extra hit a tick later (never from that extra hit itself)
    if (crit && h.damage && !h.dot && !h.spirit) {
      for (const b of this.buffs) {
        const p = BUFF_BY_ID.get(b.id)?.critProc;
        if (!p || p.style !== h.entity.style || h.key.endsWith(':' + p.suffix)) continue;
        this.scheduled.push({ ...h, key: h.key + ':' + p.suffix, rule: undefined, tick: h.tick + Math.max(1, p.delayTicks), index: 0, total: 1, channel: null, guaranteedCrit: false, damage: { ...p.damage }, flat: 0, castMult: 1, critAdd: 0, flags: new Set() });
      }
    }
    for (const g of globals) {
      for (const eff of g.onHit ?? []) this.applyEffect(eff, h.tick, h.entity, h.index);
      if (direct) for (const eff of g.onDirectHit ?? []) this.applyEffect(eff, h.tick, h.entity, h.index);
      if (g.hitAdrenaline) this.addAdrenaline(g.hitAdrenaline * (this.hasBuff('natural-instinct') ? 2 : 1));
      if (g.critAdrenaline && crit) this.addAdrenaline(g.critAdrenaline * (this.hasBuff('natural-instinct') ? 2 : 1));
    }
    const perTick = this.loadout.channelAdrenalinePerTick[h.entity.id];
    if (perTick && h.channel) this.addAdrenaline(perTick);
    if (direct) {
      this.rollHitProcs(h);
      this.perfectEquilibrium(h, preCrit);
    }
  }

  /**
   * Bow of the Last Guardian: every direct ranged hit adds a Perfect Equilibrium stack; at 8 (4 during Balance by Force) a bonus
   * hit of 12–16% ability damage plus 33–37% of the triggering hit (before its critical strike: "Perfect Equilibrium now stores
   * damage before critical strikes roll") lands on the same tick and the stacks reset. The bonus hit can crit, counts as an arrow
   * (Deathspore stacks, bolt procs) and never adds a stack itself. Stacks survive unequipping the bow; only the bow builds them.
   */
  private perfectEquilibrium(h: ScheduledHit, preCrit: number): void {
    const pe = this.loadout.perfectEquilibrium;
    if (!pe || h.noStack || h.entity.style !== 'Ranged') return;
    const need = this.hasBuff(pe.stacksWithBuff.buff) ? pe.stacksWithBuff.stacks : pe.stacks;
    const stacks = this.stack('perfect-equilibrium') + 1;
    if (stacks < need) {
      this.setStacks('perfect-equilibrium', stacks, h.tick, PERFECT_EQUILIBRIUM_KEY);
      return;
    }
    this.setStacks('perfect-equilibrium', 0, h.tick, PERFECT_EQUILIBRIUM_KEY);
    const share = (pe.hitShare.min + this.random() * (pe.hitShare.max - pe.hitShare.min)) / 100;
    const entity: EngineEntity = { key: PERFECT_EQUILIBRIUM_KEY, kind: 'ability', id: 'perfect-equilibrium', name: 'Perfect Equilibrium', icon: '', gcd: false, style: 'Ranged', adrenaline: 0, cooldownTicks: 0, buffs: [] };
    this.scheduled.push({ key: PERFECT_EQUILIBRIUM_KEY, entity, rule: undefined, tick: h.tick, index: 0, total: 1, channel: null, guaranteedCrit: false, damage: { ...pe.abilityDamage }, mult: this.styleMultiplier('Ranged', false), flat: 0, castMult: 1, flags: new Set(), critAdd: 0, addAbs: share * preCrit, noStack: true });
  }

  /** bleeds on the target (Dismember, Slaughter, Massacre) – Jaws of the Abyss and the champion's ring count them */
  private bleedsOnTarget(): number {
    return this.buffs.filter((b) => BUFF_BY_ID.get(b.id)?.bleed).length;
  }

  /** Item procs on a player hit: Scripture of Ful / Wen / Jas, Dark Sliver of Leng, cinderbane poison. */
  private rollHitProcs(h: ScheduledHit): void {
    const l = this.loadout;
    for (const p of l.hitProcs) {
      if (p.style && p.style !== h.entity.style) continue;
      if ((this.procLockUntil.get(p.id) ?? -1) > h.tick) continue;
      if (this.random() >= p.chance) continue;
      this.procLockUntil.set(p.id, h.tick + p.cooldownTicks);
      const key = 'proc:' + p.id;
      if (p.buff) this.applyBuff(p.buff.id, h.tick, key, p.buff.durationTicks);
      if (p.adrenaline) this.addAdrenaline(p.adrenaline);
      if (p.lpScaledHit) {
        // Blood Forfeit: (25% + 100% × current / max life points) of the ability damage; no life points configured = full health
        const lp = this.config.targetLifePoints;
        const lpShare = lp ? this.targetHp / lp : 1;
        this.applyDamage(key, Math.floor((p.lpScaledHit.base + p.lpScaledHit.perLpShare * lpShare) * this.loadout.abilityDamage + 1e-6), false, false, h.tick);
      }
      for (const x of p.hits ?? []) {
        this.scheduled.push({ key, entity: h.entity, rule: undefined, tick: h.tick + x.offset, index: 0, total: 1, channel: null, guaranteedCrit: false, damage: { min: x.min, max: x.max }, mult: 1, flat: 0, castMult: 1, flags: new Set(), critAdd: 0, proc: true });
      }
      if (p.echo) this.echoes.push({ key, untilTick: h.tick + p.echo.windowTicks, share: p.echo.share, cap: p.echo.cap, dealt: 0 });
    }
    if (l.poison && this.random() < l.poison.chance) {
      if (this.hasBuff('poisoned')) this.poisonHit(h.tick); // re-applying poison deals an extra poison hit at once
      this.applyBuff('poisoned', h.tick, 'proc:poison');
    }
  }

  /** one poison hit: pct% of the ability damage × 0.65–1.3 (typeless damage over time) */
  private poisonHit(tick: number): void {
    const p = this.loadout.poison;
    if (!p) return;
    const amount = (p.pct / 100) * this.loadout.abilityDamage * (POISON_ROLL.min + this.random() * (POISON_ROLL.max - POISON_ROLL.min));
    this.applyDamage('proc:poison', Math.floor(amount), false, true, tick);
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
      this.spirits.set(spirit, { spirit, sinceTick: left - duration, endTick: left, rage: 0 });
      this.applyBuff('spirit-' + spirit, 0, 'prebuild', left);
    }
    for (const id of pb.abilities ?? []) {
      const e = this.catalog.get('ability:' + id);
      if (!e) continue;
      const left = pb.remaining?.['ability:' + id];
      const ruleBuffs = (ruleFor(id)?.onCast ?? []).filter((eff): eff is Extract<Effect, { kind: 'buff' | 'toggle-buff' }> => eff.kind === 'buff' || eff.kind === 'toggle-buff');
      for (const b of e.buffs) if (!this.modelledDataBuff(b)) this.applyDataBuff(left !== undefined && b.durationTicks !== null ? { ...b, durationTicks: Math.min(left, b.durationTicks) } : b, 0, e.key);
      for (const eff of ruleBuffs) {
        if (eff.kind === 'toggle-buff') {
          // incantations (bone shields, auto-cast spells): nothing is up at the start, so the toggle switches it on
          this.applyEffect(eff, 0, e, 0);
          continue;
        }
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

  /**
   * Hit chance of one scheduled hit: miss / scale of its damage (docs/research/hit-chance.md). Conjured spirits ("always deal
   * 100% of their damage potential"), item procs, the Sunshine DoT and hits without damage bypass it; in the roll model a
   * bleed's later ticks follow the first tick's roll.
   */
  private hitRoll(h: ScheduledHit): { miss: boolean; scale: number; chance: number | null } {
    const none = { miss: false, scale: 1, chance: null };
    if (!h.damage || h.spirit || h.proc) return none;
    if (h.dot && HIT_CHANCE_BYPASS_DOTS.has(h.entity.id)) return none;
    const model = this.config.hitChanceModel ?? 'scaled';
    if (h.dot && h.index > 0 && model === 'roll') return none;
    const chance = this.hitChanceFor(h.entity.style, h.entity.id, h.entity.abilityType, h.key, h.castTick ?? h.tick);
    if (chance === null) return none;
    if (chance < MIN_HIT_CHANCE) return { miss: true, scale: 0, chance };
    if (model === 'roll') return this.random() < chance ? { miss: false, scale: 1, chance } : { miss: true, scale: 0, chance };
    return { miss: false, scale: chance, chance };
  }

  /**
   * Hit chance (0..1) of a hit of `style` against the configured enemy with the active prayers, buffs and gear; null = not
   * simulated (no enemy config / hitChanceDisabled). H = min(1, affinity/100 × accuracy / armour rating + additive bonuses),
   * accuracy = ⌊f(level + prayer levels) + weapon accuracy⌋ × multipliers (defender, nihil, Ful arrows) – engine/hit-chance.ts.
   * `sourceKey` / `castTick` name the cast so Icy Precision skips the ability that consumed the Icy Chill stacks.
   */
  hitChanceFor(style: Style | null | undefined, abilityId?: string, abilityType?: AbilityType, sourceKey?: string, castTick?: number): number | null {
    const enemy = this.config.enemy;
    if (this.config.hitChanceDisabled || !enemy) return null;
    const l = this.loadout;
    const st = affinityStyleOf(style, l.style);
    const level = l.levels[accuracySkillOf(st)] + prayerAccuracyLevels(this.activePrayers, st);
    let accuracy = accuracyRating(level, l.weaponAccuracy);
    for (const m of l.accuracyMult) if (!m.style || m.style === st) accuracy *= m.mult;
    const armour = armourRating(enemy.defenceLevel ?? 1, enemy.armour ?? 0);
    let add = l.hitChanceAdd + (abilityId ? l.hitChanceAddPerAbility[abilityId] ?? 0 : 0);
    if (this.config.targetType) add += l.targetTypeHitChanceAdd[this.config.targetType] ?? 0;
    for (const x of BUFF_HIT_CHANCE_ADD) {
      if (x.style !== st || !abilityType || !x.types.includes(abilityType)) continue;
      const b = this.buff(x.buff);
      if (!b || (x.notGrantingCast && sourceKey !== undefined && b.sourceKey === sourceKey && b.startTick === castTick)) continue;
      add += x.add;
    }
    return hitChance(enemy.affinity?.[st] ?? 100, accuracy, armour, add);
  }

  /** Rolls and applies the damage of one hit (engine/damage.ts). Returns what the hit would have dealt without its critical strike (Perfect Equilibrium stores that). `hitScale`: the hit chance the damage potential is scaled by. */
  private dealHit(h: ScheduledHit, crit: boolean, hitScale = 1): number {
    const l = this.loadout;
    let { min, max } = h.damage!;
    const rules = (h.rule?.damageRules ?? []).filter((d) => this.conditionMet(d.when, h.tick, h.index, h.flags));
    for (const d of rules) if (d.damage) ({ min, max } = d.damage);
    // Precise: "Increases your minimum damage by 1.5% per rank of your maximum damage." Not DoTs – except Bloat, whose
    // DoT is a share of its (Precise-rolled) initial hit. Equilibrium / Eruptive live in the ability damage stat (resolver).
    if (l.preciseRank && (!h.dot || h.entity.id === 'bloat')) min = Math.min(max, min + 0.015 * l.preciseRank * max);
    let amount = ((min + this.random() * Math.max(0, max - min)) / 100 + h.flat) * l.abilityDamage;
    // Lunging (Combust / Dismember, every bleed hit), Shield Bashing / Bulwark (Debilitate)
    const perAbility = l.damageMultPerAbility[h.entity.id];
    if (perAbility !== undefined) amount *= perAbility;
    // Flanking: "+40% more damage per rank to targets that are not facing you"
    if (l.flanking && this.config.targetFacingAway && l.flanking.abilities.includes(h.entity.id)) amount *= 1 + l.flanking.perRank * l.flanking.rank;
    // Spendthrift: "1% chance per rank to deal 1% extra damage per rank" – not bleeds
    if (l.spendthriftRank && !h.dot && !h.spirit && this.random() < 0.01 * l.spendthriftRank) amount *= 1 + 0.01 * l.spendthriftRank;
    // Undead / Dragon / Demon Slayer: +7% against that type, bleeds included
    const typeMult = this.config.targetType ? l.targetTypeDamageMult[this.config.targetType] : undefined;
    if (typeMult !== undefined) amount *= typeMult;
    if (!h.spirit) {
      // flat damage from held stacks (Essence Corruption 10+: 3 × stacks + Magic level on magic hits)
      for (const b of this.buffs) {
        const d = BUFF_BY_ID.get(b.id)?.damageAddPerStack;
        if (d && b.stacks >= d.minStacks && (!d.style || d.style === h.entity.style)) amount += d.add + d.perStack * b.stacks;
      }
    }
    if (h.spirit) {
      const sp = this.spirits.get(h.spirit);
      amount *= l.conjureDamageMult;
      if (sp) {
        amount *= 1 + RAGE_PER_STACK * sp.rage;
        sp.rage = Math.min(RAGE_MAX, sp.rage + 1);
      }
    }
    const style = h.entity.style;
    if (!h.proc) for (const m of BUFF_TYPE_DAMAGE_MULT) if (m.style === style && m.type === h.entity.abilityType && this.hasBuff(m.buff)) amount *= m.mult;
    amount *= h.mult;
    if (h.entity.abilityType === 'Ultimate' && !h.dot && !h.proc) amount *= l.ultimateDamageMult;
    amount *= h.castMult;
    if (h.dot) amount *= l.dotDamageMult[h.entity.id] ?? 1; // Song of Destruction (2): Combust / Corruption Blast × 1.3
    if (!h.spirit && !h.proc) {
      // Ful arrows (ranged × 1.15, not DoTs), scrimshaw of the elements / cruelty (× 1.05 / 1.0666, DoTs included)
      for (const m of l.styleDamageMult) if (m.style === style && (m.dots || !h.dot)) amount *= m.mult;
      // Ashen Vow: melee × 1.12 against the Flamebound Rival (Igneous Showdown's own hits are boosted by its rule)
      for (const m of l.targetBuffDamageMult) if ((!m.style || m.style === style) && m.notAbility !== h.entity.id && this.hasBuff(m.buff)) amount *= m.mult;
    }
    if (h.addAbs) amount += h.addAbs; // Perfect Equilibrium: the share of the triggering hit
    let critFactor = 1;
    if (crit) {
      let critMult = critMultiplier() + l.critDamageAdd + (h.rule?.crit?.damageAdd ?? 0) + (h.rule?.hitCrit?.[h.index]?.damageAdd ?? 0);
      for (const b of this.buffs) {
        const add = l.buffCritDamageAdd[b.id] ?? BUFF_BY_ID.get(b.id)?.critDamageAdd;
        if (add) critMult += add;
      }
      amount *= critMult;
      critFactor = critMult;
    }
    if (!h.spirit) amount *= l.damageMult; // Void knight +5% / +7%
    for (const m of TARGET_DAMAGE_MULT) if ((!m.dotsOnly || h.dot) && this.hasBuff(m.buff)) amount *= m.mult;
    // hit chance as a damage multiplier (wiki "damage potential"); Haunted's extra damage "is not reduced if the player has less than 100% accuracy"
    amount *= hitScale;
    amount += this.targetDamageAdd(amount);
    for (const d of rules) {
      if (d.mult !== undefined) amount *= d.mult;
      if (d.perMissingLp) {
        const lp = this.config.targetLifePoints;
        const missing = lp ? Math.max(0, 1 - this.targetHp / lp) * 100 : 0;
        amount *= 1 + Math.min(d.perMissingLp.max, d.perMissingLp.per * missing);
      }
    }
    if (h.channel) {
      const spec = this.loadout.channelOverrides[h.entity.id] ?? h.rule?.channel ?? h.entity.channel;
      if (spec?.finalAddsPriorShare && h.index === h.total - 1) amount += spec.finalAddsPriorShare * h.channel.dealt;
    }
    if (h.rule?.damagePerStack?.cap) amount = Math.min(amount, h.rule.damagePerStack.cap);
    const dealt = Math.floor(amount + 1e-6); // epsilon: 0.175 + 0.12 is 0.29499… in floating point
    if (h.channel) h.channel.dealt += dealt;
    this.applyDamage(h.key, dealt, crit, !!h.dot, h.tick);
    this.splitSoul(h, dealt);
    return Math.floor(amount / critFactor + 1e-6);
  }

  /** Haunted: +10% of the hit, capped at 20% of the ability damage */
  private targetDamageAdd(amount: number): number {
    let add = 0;
    for (const t of TARGET_DAMAGE_ADD) if (this.hasBuff(t.buff)) add += Math.min(t.pct * amount, t.capPctOfAd * this.loadout.abilityDamage);
    return add;
  }

  /** Split Soul: 400% of what Soul Split would heal from this hit is dealt to the target (Soul Split tiers: 10% up to 2,000, 5% to 4,000, 1.25% above) */
  private splitSoul(h: ScheduledHit, dealt: number): void {
    if (h.dot || h.spirit || !this.hasBuff('split-soul') || !this.activePrayers.has(SOUL_SPLIT)) return;
    const heal = dealt <= 2000 ? 0.1 * dealt : dealt <= 4000 ? 200 + 0.05 * (dealt - 2000) : 300 + 0.0125 * (dealt - 4000);
    const extra = Math.floor(4 * heal);
    if (extra > 0) this.applyDamage(h.key + ':split-soul', extra, false, false, h.tick);
  }

  /** product of the active style buffs (Berserk, Sunshine, Death's Swiftness) for a hit of `style` */
  private styleMultiplier(style: Style | undefined, dot: boolean): number {
    let mult = 1;
    for (const m of BUFF_DAMAGE_MULT) if (m.style === style && (m.dots || !dot) && this.hasBuff(m.buff) && !(m.unlessBuff && this.hasBuff(m.unlessBuff))) mult *= m.mult;
    if (!dot) {
      for (const b of this.buffs) {
        const p = BUFF_BY_ID.get(b.id)?.damageMultPerStack;
        if (p && p.style === style && b.stacks > 0) mult *= 1 + p.per * b.stacks;
      }
    }
    return mult;
  }

  /** flat share of the ability damage added to every hit: active flat buffs (Searing Winds) plus item bonuses per ability (Caroming) */
  private flatShare(style: Style | undefined, abilityId: string, dot: boolean): number {
    let flat = this.loadout.flatAddPerAbility[abilityId] ?? 0;
    for (const f of BUFF_FLAT_ADD) if (f.style === style && (f.dots || !dot) && this.hasBuff(f.buff)) flat += f.pct / 100;
    return flat;
  }

  /**
   * Crackling: "Periodically zaps your combat target for 50% per rank of your weapon's damage" – a fixed share of the
   * ability damage on the first attack after the 1-minute cooldown ("triggers on the next attack after the cooldown ends").
   * No crit, no Precise, no style buffs ("Other damage modifiers are ignored, including Berserk, Death's Swiftness, and Sunshine").
   */
  private crackle(tick: number): void {
    const c = this.loadout.crackling;
    if (!c || tick < this.cracklingReadyTick) return;
    this.cracklingReadyTick = tick + c.cooldownTicks;
    this.applyDamage('perk:crackling', Math.floor(c.perRank * c.rank * this.loadout.abilityDamage + 1e-6), false, false, tick);
  }

  /**
   * Aftershock: "After dealing 50,000 damage, create an explosion centered on your current target, dealing up to 40% per
   * rank weapon damage" – an auto-attack style hit of rank × 40% × (60–99% in 1% steps) of the ability damage (wiki table:
   * rank 1 24–39.6%), "at most every 6 seconds; if the damage requirement is met again shortly after its previous activation,
   * the next activation will be delayed". No crit, no Precise. The explosion's own damage is not counted again.
   */
  private aftershock(tick: number): void {
    const a = this.loadout.aftershock;
    if (!a || this.aftershockStored < a.threshold || tick < this.aftershockReadyTick) return;
    this.aftershockStored -= a.threshold;
    this.aftershockReadyTick = tick + a.minIntervalTicks;
    const steps = Math.round((a.rollMax - a.rollMin) * 100) + 1;
    const roll = a.rollMin + Math.min(steps - 1, Math.floor(this.random() * steps)) / 100;
    this.applyDamage('perk:aftershock', Math.floor(a.perRank * a.rank * roll * this.loadout.abilityDamage + 1e-6), false, false, tick);
  }

  /**
   * One familiar hit: a flat roll between the data's min and max life points (no ability damage, no crit, no style buffs);
   * Death From Above turns the next hit into 200–320% of the max hit; the Ripper Demon deals up to +5% the lower the
   * target's life points; target debuffs (Vulnerability, Haunted) apply like to every other hit.
   */
  private familiarAttack(fam: Familiar, tick: number): void {
    const a = fam.attack;
    let amount = a.damageMin + this.random() * (a.damageMax - a.damageMin);
    if (this.hasBuff('death-from-above')) {
      this.removeBuff('death-from-above');
      amount = a.damageMax * (2 + this.random() * 1.2);
    }
    const lp = this.config.targetLifePoints;
    if (fam.damagePerMissingLp && lp) amount *= 1 + fam.damagePerMissingLp * Math.max(0, 1 - this.targetHp / lp);
    for (const m of TARGET_DAMAGE_MULT) if (!m.dotsOnly && this.hasBuff(m.buff)) amount *= m.mult;
    amount += this.targetDamageAdd(amount);
    this.applyDamage('familiar:' + fam.id, Math.floor(amount + 1e-6), false, false, tick);
  }

  private applyDamage(key: string, amount: number, crit: boolean, dot: boolean, tick: number): void {
    if (amount <= 0) return;
    this.damageDealt += amount;
    this.hitCount++;
    this.events.push({ kind: 'hit', key, amount, crit, dot, tick });
    if (this.loadout.aftershock && key !== 'perk:aftershock') {
      this.aftershockStored += amount;
      this.aftershock(tick);
    }
    for (const e of this.echoes) if (tick <= e.untilTick) e.dealt += amount; // Scripture of Jas tracks everything in its window
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
        const def = BUFF_BY_ID.get(eff.stack);
        if (def?.stacks?.refreshOnGain && def.durationTicks !== null) {
          const b = this.buff(eff.stack);
          if (b) b.endTick = tick + def.durationTicks; // Essence Corruption: 30 s from the last stack
        }
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
      case 'toggle-buff':
        if (this.hasBuff(eff.id)) {
          this.removeBuff(eff.id);
        } else {
          for (const id of eff.excludes ?? []) this.removeBuff(id);
          this.applyBuff(eff.id, tick, entity.key);
        }
        break;
      case 'cooldown-reset':
        for (const id of eff.abilities) {
          this.readyTick.delete('ability:' + id);
          this.chargeReady.delete('ability:' + id);
          // a shared cooldown group (Dive / Bladed Dive) is reset with the ability
          const shared = ruleFor(id)?.sharedCooldown ?? this.catalog.get('ability:' + id)?.sharedCooldown;
          if (shared) this.readyTick.delete('shared:' + shared);
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
        this.spirits.set(eff.spirit, { spirit: eff.spirit, sinceTick: tick, endTick: tick + duration, rage: 0 });
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
    if (c.notFlag !== undefined && flags.has(c.notFlag)) return false;
    if (c.targetLpBelow !== undefined) {
      const lp = this.config.targetLifePoints;
      if (!lp || this.targetHp / lp >= c.targetLpBelow) return false;
    }
    if (c.notBuff && this.hasBuff(c.notBuff)) return false;
    if (c.stackMin && this.stack(c.stackMin.stack) < c.stackMin.min) return false;
    if (c.stackMax && this.stack(c.stackMax.stack) > c.stackMax.max) return false;
    if (c.item && !this.loadout.items.has(c.item)) return false;
    if (c.notItem && this.loadout.items.has(c.notItem)) return false;
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
    if (r.stackMax && this.stack(r.stackMax.stack) > r.stackMax.max) return false;
    if (r.anySpirit && this.spirits.size === 0) return false;
    if (r.spirit) {
      const s = this.spirits.get(r.spirit);
      if (!s) return false;
      if (r.spiritAgeMin !== undefined && tick - s.sinceTick < r.spiritAgeMin) return false;
    }
    if (r.sequence && this.sequenceStep(r.sequence.group, tick) !== r.sequence.step) return false;
    if (r.adrenalineBelow !== undefined && this.adrenaline >= r.adrenalineBelow) return false;
    if (r.adrenalineMin !== undefined && this.adrenaline < r.adrenalineMin) return false;
    if (r.notStunImmune && this.buffs.some((b) => BUFF_BY_ID.get(b.id)?.stunImmune)) return false;
    if (r.style && this.loadout.style !== r.style) return false;
    if (r.spellbook && this.loadout.spellbook !== r.spellbook) return false;
    if (r.equipment) {
      const l = this.loadout;
      // an active bone shield stands in for a shield – except for the offensive shield abilities (Bash, Revenge)
      const bone = !r.offensive && this.boneShieldTier > 0;
      switch (r.equipment) {
        case '2h': if (!l.has2h) return false; break;
        case 'shield': if (!l.hasShield && !bone) return false; break;
        case 'defender-or-shield': if (!l.hasShield && !l.hasDefender && !bone) return false; break;
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
    if (durationOverride === undefined && def?.durationByShieldTier) {
      const t = def.durationByShieldTier;
      const tier = this.shieldTier;
      duration = t.base + (tier > 0 ? (t.bonusIfAny ?? 0) + Math.floor(tier / 10) * t.perTen : 0);
    }
    if (duration !== null) {
      // multiplier first, then the flat ticks: "The additional time from Clear Headed is added after the duration is halved by Reflexes"
      duration = Math.floor(duration * (this.loadout.buffDurationMult[id] ?? 1) + 1e-6);
      const extra = this.loadout.buffDurationExtra[id];
      if (extra) duration += Math.max(extra.minTicks, Math.floor(duration * extra.share + 1e-6)); // Bulwark: tB = t + max(R, ⌊t × 0.06R⌋)
      duration += this.loadout.buffDurationAdd[id] ?? 0;
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
    // poison (cinderbane gloves): a hit every 10 s from the application
    const poisoned = this.buff('poisoned');
    if (poisoned && tick > poisoned.startTick && (tick - poisoned.startTick) % POISON_EVERY_TICKS === 0) this.poisonHit(tick);
    // Scripture of Jas: 20% of the tracked damage one tick after the window
    for (const e of this.echoes) if (tick === e.untilTick + 1) this.applyDamage(e.key, Math.min(e.cap, Math.floor(e.share * e.dealt)), false, false, tick);
    this.echoes = this.echoes.filter((e) => tick <= e.untilTick);
    this.buffs = this.buffs.filter((b) => b.endTick === null || b.endTick > tick);
    // conjured spirits attack on their own (Necromancy Spirit damage, no crits)
    for (const [name, s] of this.spirits) {
      const a = SPIRIT_ATTACKS[name];
      if (!a || tick > s.endTick) continue;
      const age = tick - s.sinceTick;
      if (age >= a.firstTick && (age - a.firstTick) % a.everyTicks === 0) {
        let amount = ((a.min + this.random() * (a.max - a.min)) / 100) * this.loadout.abilityDamage * this.loadout.conjureDamageMult;
        amount *= 1 + RAGE_PER_STACK * s.rage;
        if (name === 'skeleton-warrior') s.rage = Math.min(RAGE_MAX, s.rage + 1);
        for (const m of TARGET_DAMAGE_MULT) if (!m.dotsOnly && this.hasBuff(m.buff)) amount *= m.mult;
        amount += this.targetDamageAdd(amount);
        this.applyDamage('spirit:' + name, Math.floor(amount), false, false, tick);
      }
      const p = a.poison;
      if (p && age >= p.firstTick && (age - p.firstTick) % p.everyTicks === 0) {
        let amount = ((p.min + this.random() * (p.max - p.min)) / 100) * this.loadout.abilityDamage * this.loadout.conjureDamageMult;
        for (const m of TARGET_DAMAGE_MULT) if (this.hasBuff(m.buff)) amount *= m.mult;
        amount += this.targetDamageAdd(amount);
        this.applyDamage('spirit:' + name + '-poison', Math.floor(amount), false, true, tick);
      }
    }
    for (const [name, s] of [...this.spirits]) {
      if (s.endTick <= tick) {
        this.spirits.delete(name);
        this.removeBuff('spirit-' + name);
        this.buffs = this.buffs.filter((b) => b.spirit !== name);
      }
    }
    // the familiar (Loadout page) attacks on its own and regains special move points
    const fam = this.loadout.familiar;
    if (fam) {
      if (tick > 0 && tick % FAMILIAR_SPECIAL_REGEN.everyTicks === 0) this.familiarSpecial = Math.min(FAMILIAR_SPECIAL_MAX, this.familiarSpecial + FAMILIAR_SPECIAL_REGEN.amount);
      if (tick >= fam.attack.firstTick && (tick - fam.attack.firstTick) % fam.attack.everyTicks === 0) this.familiarAttack(fam, tick);
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
      // Barricade blocks everything while it runs; Disruption Shield, Resonance and Divert block one hit and are used up
      const absorbed = this.absorbAttack();
      let reflected = false;
      if (absorbed) {
        this.prayerStats.absorbed = (this.prayerStats.absorbed ?? 0) + 1;
      } else {
        if (prayed) this.prayerStats.prayed++;
        else this.prayerStats.hits++;
        // Vengeance goes off on the first hit that lands (a blocked hit does not trigger it)
        if (this.hasBuff('vengeance')) {
          this.removeBuff('vengeance');
          reflected = true;
        }
        const guardian = this.spirits.get('phantom-guardian');
        if (guardian && tick - guardian.sinceTick > 5) this.setStacks('valour', this.stack('valour') + 1, tick, 'spirit:phantom-guardian');
      }
      this.events.push({ kind: 'attack', style, tick, prayed, needed, absorbed: absorbed ?? undefined, reflected });
      this.scheduleAttack(tick + Math.max(1, this.config.enemy!.intervalTicks));
    } else if (this.activePrayers.has(SOUL_SPLIT)) {
      this.prayerStats.soulSplitTicks++;
    }
    if (this.state === 'running') this.revolutionTick(tick);
  }

  // ---------------------------------------------------------------- Revolution (docs/research/revolution.md)

  /** Revolution is on and has a bar to scan. */
  get revolutionOn(): boolean {
    return this.config.combatMode === 'revolution' && !!this.config.revolution;
  }

  /** the main bar Revolution scans for the wielded weapon (first `slots` entries matter) */
  revolutionBar(): (string | null)[] {
    const r = this.config.revolution;
    if (!r) return [];
    const bar = r.resolveBar?.(this.style) ?? r.bar ?? [];
    return bar.slice(0, Math.max(0, Math.min(bar.length, Math.round(r.slots))));
  }

  /** Is this entity one Revolution may fire (GCD ability of an enabled type, never a special attack / Regenerate)? */
  revolutionTriggers(e: EngineEntity): boolean {
    const r = this.config.revolution;
    if (!r || e.kind !== 'ability' || !this.isGcdStep(e) || REVOLUTION_NEVER.has(e.id)) return false;
    switch (e.abilityType) {
      case 'Basic':
      case 'Incantation':
        return r.basics;
      case 'Enhanced':
        return r.enhanced;
      case 'Threshold':
        return r.thresholds;
      case 'Ultimate':
        return r.ultimates;
      default:
        return false;
    }
  }

  /** Leftmost slot of the Revolution range whose shown ability can cast at `tick`, or null. */
  revolutionChoice(tick: number): string | null {
    for (const slot of this.revolutionBar()) {
      if (!slot) continue;
      const key = this.morphOf(slot, tick)?.key ?? slot; // the slot fires what it shows (Command X, Slaughter ...)
      const e = this.catalog.get(key);
      if (!e || !this.revolutionTriggers(e) || this.weaponFailure(e) || this.blocker(e, tick)) continue;
      return key;
    }
    return null;
  }

  /**
   * Runs after the inputs of `tick` were handled: with a free GCD, nothing pending (manual input wins) and no channel running,
   * the leftmost usable ability is cast on this tick through the normal cast path.
   */
  private revolutionTick(tick: number): void {
    if (!this.revolutionOn || this.pending) return;
    const gcdEnd = this.gcdEndTick;
    if (gcdEnd !== null && tick < gcdEnd) return;
    if (this.channel && !this.channel.cancelled && tick < this.channel.endTick) return;
    const key = this.revolutionChoice(tick);
    if (key) this.pending = { key, tick, arrival: this.tickTime(tick), auto: true };
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

  /** rule of an entity: spec steps use the spec rule, the special-attack slots the spec rule merged with their own requirements */
  ruleOf(e: EngineEntity): AbilityRule | undefined {
    if (e.kind === 'spec') return specRuleFor(e.id);
    if (e.kind === 'spell') return spellRuleFor(e.id);
    if (e.kind === 'special') return e.scroll ? scrollRuleFor(e.id) : specialRuleFor(e.id);
    if (e.kind === 'action') return actionRuleFor(e.id);
    if (e.kind !== 'ability') return undefined;
    const rule = ruleFor(e.id);
    const spec = this.specFor(e);
    return spec ? wrapperRule(rule, spec.id) : rule;
  }
  /** Tier of an active bone shield (Lesser 25% / Greater 50% of the Necromancy level, plus Zemouregal's nexus); 0 without one. */
  get boneShieldTier(): number {
    for (const b of this.buffs) {
      const share = BUFF_BY_ID.get(b.id)?.shieldTierShare;
      if (share) return boneShieldTier(share, this.loadout.boneShieldLevelBonus);
    }
    return 0;
  }

  /** Shield tier the defensive abilities use: the worn shield (defender half), else an active bone shield. */
  get shieldTier(): number {
    const l = this.loadout;
    if (l.hasShield || l.hasDefender) return l.shieldTier;
    return this.boneShieldTier;
  }

  /** Which buff blocks the attack landing now: Barricade (kept), else Disruption Shield, Resonance or Divert (used up). Null = the hit lands. */
  private absorbAttack(): string | null {
    const all = this.buffs.find((b) => BUFF_BY_ID.get(b.id)?.absorbs === 'all');
    if (all) return all.id;
    // Disruption Shield takes priority over Resonance / Divert
    const order = ['disruption-shield', ...this.buffs.map((b) => b.id)];
    for (const id of order) {
      if (this.hasBuff(id) && BUFF_BY_ID.get(id)?.absorbs === 'next') {
        this.removeBuff(id);
        return id;
      }
    }
    return null;
  }

  /** catalog entity, or the wielded / stored special (the special-attack slots morph to it even when it is not on a bar) */
  private entityOf(key: string): EngineEntity | undefined {
    const e = this.catalog.get(key);
    if (e) return e;
    const l = this.loadout;
    return l.weaponSpec?.key === key ? l.weaponSpec : l.eofSpec?.key === key ? l.eofSpec : undefined;
  }

  /** the special stored in the Essence of Finality when a weapon of its style is wielded (otherwise it cannot fire) */
  eofSpecReady(): EngineEntity | null {
    const l = this.loadout;
    if (!l.eofSpec) return null;
    return l.style && l.eofSpec.style && l.eofSpec.style !== l.style ? null : l.eofSpec;
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
    const mult = this.loadout.cooldownMult[acting.id]; // applied with floor, like the game's perk pages
    if (mult !== undefined) ticks = Math.floor(ticks * mult + 1e-6);
    return ticks;
  }

  private matchingGlobals(e: EngineEntity): GlobalRule[] {
    if (e.kind !== 'ability' && e.kind !== 'spec') return [];
    // a special attack – a "spec:" step, the hit of one, or the special behind the Weapon Special Attack / Essence of Finality slot
    const spec = e.kind === 'spec' ? e : this.specFor(e);
    const rule = e.kind === 'ability' ? ruleFor(e.id) : undefined;
    return GLOBALS.filter((g) => {
      const w = g.when;
      // specials only match rules that opt in (ammunition effects); those rules see the special's style, type and cost, not the slot's
      if (e.kind === 'spec' && !w.includeSpecs) return false;
      const t = spec && w.includeSpecs ? spec : e;
      const tr = t === e ? rule : specRuleFor(t.id);
      if (w.abilities && !w.abilities.includes(t.id)) return false;
      if (w.excludeAbilities?.includes(t.id)) return false;
      if (w.style && t.style !== w.style) return false;
      if (w.styles && (!t.style || !w.styles.includes(t.style))) return false;
      if (w.type && t.abilityType !== w.type) return false;
      if (w.types && (!t.abilityType || !w.types.includes(t.abilityType))) return false;
      if (w.gcd && (!t.gcd || tr?.offGcd)) return false;
      if (w.costing && !(t.adrenaline < 0 || this.isThreshold(t, tr))) return false;
      if (w.generating && !((tr?.adrenaline ?? t.adrenaline) > 0)) return false;
      if (w.buff && !this.hasBuff(w.buff)) return false;
      if (w.item && !this.loadout.items.has(w.item)) return false;
      if (w.stackMin && this.stack(w.stackMin.stack) < w.stackMin.min) return false;
      return true;
    });
  }
}

/** "prayer:soul-split" → "soul-split" */
function prayerId(key: string): string {
  return key.replace(/^prayer:/, '');
}

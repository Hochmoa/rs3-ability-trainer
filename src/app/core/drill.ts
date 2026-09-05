import { keybindKey, keybindLabel } from './keybind.util';
import { Keybind } from './models';

/** bar position of a weapon switch target (weapon keys are not bar slots) */
export const WEAPON_POS = -1;

/** Something the drill can ask for: a keybound bar slot or a weapon switch. */
export interface DrillTarget {
  /** entity key of what sits there ("ability:sever", "prayer:soul-split", "weapon:…") */
  key: string;
  /** entity keys this slot also fires (morph targets) – for the rotation filter */
  aliases: string[];
  kind: string;
  /** bar position 0..4, or WEAPON_POS */
  pos: number;
  /** slot index on the bar; the weapon id's index for weapon switches */
  slot: number;
  /** keybindKey() of the bound key */
  bind: string;
  keyLabel: string;
}

/** A candidate before filtering: what the component finds on the bars / in the loadout. */
export interface DrillSource {
  key: string;
  aliases?: string[];
  kind: string;
  pos: number;
  slot: number;
  keybind: Keybind | null;
}

export interface PoolFilter {
  /** bar positions to include (index = position) */
  bars: boolean[];
  /** weapon switches */
  weapons: boolean;
  /** prayers / curses on the bars */
  prayers: boolean;
  /** only entities of one rotation (entity keys); null = everything */
  onlyKeys: ReadonlySet<string> | null;
}

/** Keybound targets that pass the filter. Slots without a key never make it in – the drill is about keys. */
export function buildPool(sources: DrillSource[], f: PoolFilter): DrillTarget[] {
  const out: DrillTarget[] = [];
  for (const s of sources) {
    if (!s.keybind) continue;
    if (s.pos === WEAPON_POS ? !f.weapons : !f.bars[s.pos]) continue;
    if (s.kind === 'prayer' && !f.prayers) continue;
    const aliases = s.aliases?.length ? s.aliases : [s.key];
    if (f.onlyKeys && !aliases.some((k) => f.onlyKeys!.has(k))) continue;
    out.push({ key: s.key, aliases, kind: s.kind, pos: s.pos, slot: s.slot, bind: keybindKey(s.keybind), keyLabel: keybindLabel(s.keybind) });
  }
  return out;
}

export interface DrillConfig {
  /** 0 = wait for the press; otherwise the prompt changes after this many ms and counts a miss */
  paceMs: number;
  /** 0 = endless */
  rounds: number;
}

/** what the user did: the key they pressed (keybindKey) and / or the entity it resolved to (clicked slot, same ability elsewhere) */
export interface DrillInput {
  bind?: string;
  key?: string;
}

export type PressResult = 'hit' | 'miss' | 'ignored';

export interface TargetStats {
  key: string;
  keyLabel: string;
  /** times it was asked for */
  asked: number;
  hits: number;
  /** wrong keys while it was up */
  wrong: number;
  /** cadence ran out */
  timeouts: number;
  reactionMs: number[];
}

export interface TargetSummary extends TargetStats {
  misses: number;
  /** misses / (hits + misses), 0..1 */
  missRate: number;
  /** average reaction of the hits, null without one */
  avgMs: number | null;
}

export interface DrillSummary {
  /** prompts shown */
  rounds: number;
  hits: number;
  misses: number;
  /** hits / (hits + misses) in %, 0 without presses */
  accuracy: number;
  avgMs: number | null;
  bestStreak: number;
  /** per entity, worst first: highest miss rate, then slowest */
  targets: TargetSummary[];
}

/**
 * The drill itself: random prompts from the pool (never the same entity twice in a row), one at a time.
 * A correct press scores a hit with the reaction time since the prompt appeared and moves on; a wrong key
 * counts a miss but keeps the prompt; with a cadence, `tick()` moves on when the time is up and counts a miss.
 * Pure – times are passed in (ms), the random source can be injected.
 */
export class Drill {
  current: DrillTarget | null = null;
  /** when the current prompt appeared */
  shownAt = 0;
  /** prompts shown so far */
  round = 0;
  hits = 0;
  misses = 0;
  streak = 0;
  bestStreak = 0;
  finished = false;
  readonly reactions: number[] = [];
  private readonly stats = new Map<string, TargetStats>();

  constructor(
    readonly pool: DrillTarget[],
    readonly config: DrillConfig,
    private readonly rng: () => number = Math.random,
  ) {
    if (!pool.length) throw new Error('drill pool is empty');
  }

  start(now: number): void {
    this.next(now);
  }

  /** ms left on the current prompt (cadence only), 0 when waiting for the press */
  remainingMs(now: number): number {
    if (!this.config.paceMs || !this.current) return 0;
    return Math.max(0, this.config.paceMs - (now - this.shownAt));
  }

  press(input: DrillInput, now: number): PressResult {
    const t = this.current;
    if (this.finished || !t) return 'ignored';
    const hit = (input.bind !== undefined && input.bind === t.bind) || (input.key !== undefined && input.key === t.key);
    const st = this.statOf(t);
    if (hit) {
      this.hits++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      const ms = Math.max(0, now - this.shownAt);
      this.reactions.push(ms);
      st.hits++;
      st.reactionMs.push(ms);
      this.next(now);
      return 'hit';
    }
    this.misses++;
    this.streak = 0;
    st.wrong++;
    return 'miss';
  }

  /** cadence: true when the prompt ran out (a miss, the next one is up) */
  tick(now: number): boolean {
    const t = this.current;
    if (!this.config.paceMs || this.finished || !t) return false;
    if (now - this.shownAt < this.config.paceMs) return false;
    this.misses++;
    this.streak = 0;
    this.statOf(t).timeouts++;
    this.next(now);
    return true;
  }

  stop(): void {
    this.finished = true;
    this.current = null;
  }

  avgMs(): number | null {
    return this.reactions.length ? Math.round(this.reactions.reduce((a, b) => a + b, 0) / this.reactions.length) : null;
  }

  summary(): DrillSummary {
    const targets: TargetSummary[] = [...this.stats.values()].map((s) => {
      const misses = s.wrong + s.timeouts;
      const n = s.hits + misses;
      return { ...s, misses, missRate: n ? misses / n : 0, avgMs: s.reactionMs.length ? Math.round(s.reactionMs.reduce((a, b) => a + b, 0) / s.reactionMs.length) : null };
    });
    targets.sort((a, b) => b.missRate - a.missRate || (b.avgMs ?? Infinity) - (a.avgMs ?? Infinity) || b.misses - a.misses || a.key.localeCompare(b.key));
    const n = this.hits + this.misses;
    return { rounds: this.round, hits: this.hits, misses: this.misses, accuracy: n ? Math.round((this.hits / n) * 100) : 0, avgMs: this.avgMs(), bestStreak: this.bestStreak, targets };
  }

  private statOf(t: DrillTarget): TargetStats {
    let s = this.stats.get(t.key);
    if (!s) {
      s = { key: t.key, keyLabel: t.keyLabel, asked: 0, hits: 0, wrong: 0, timeouts: 0, reactionMs: [] };
      this.stats.set(t.key, s);
    }
    return s;
  }

  private next(now: number): void {
    if (this.config.rounds && this.round >= this.config.rounds) {
      this.stop();
      return;
    }
    const last = this.current?.key ?? null;
    let candidates = last === null ? this.pool : this.pool.filter((t) => t.key !== last);
    // a pool with a single entity has to repeat, everything else never asks the same thing twice in a row
    if (!candidates.length) candidates = this.pool;
    const pick = candidates[Math.min(candidates.length - 1, Math.floor(this.rng() * candidates.length))];
    this.current = pick;
    this.shownAt = now;
    this.round++;
    this.statOf(pick).asked++;
  }
}

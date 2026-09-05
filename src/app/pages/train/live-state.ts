/**
 * The catalog-wide part of the Train page's render loop, as pure functions: `catalogPass` asks the engine about every
 * pressable thing once per server tick (usability, morph, cooldown end), `cooldownViews` turns the cooldown ends into
 * the seconds and sweep phases the bars draw – arithmetic only, so it can run every animation frame.
 */
import { TICK_MS, TrainerEngine, UsableReason } from '../../engine/trainer-engine';

/** an entity on its own cooldown: when it is ready again and how long the sweep is */
export interface CoolingEntry {
  endTick: number;
  totalTicks: number;
}

export interface CatalogPass {
  /** catalog key → usability of what the slot fires right now (a cooldown alone keeps the slot's colour, like in the game) */
  usable: Map<string, UsableReason>;
  /** catalog key → what the slot shows instead (Command X while the spirit lives, Slaughter after Dismember, Spectral Scythe 2) */
  morphs: Map<string, { key: string; stage: number }>;
  /** catalog key → its cooldown (of the morphed target when there is one) */
  cooling: Map<string, CoolingEntry>;
}

export interface CooldownView {
  cooldownS: number;
  /** 0..1 progress of the cooldown (1 = ready); drives the sweep overlay */
  cooldownPhase: number;
}

/** One pass over the engine catalog at `tick`: a morphed slot shows the state of what it will fire. */
export function catalogPass(e: TrainerEngine, tick: number): CatalogPass {
  const usable = new Map<string, UsableReason>();
  const morphs = new Map<string, { key: string; stage: number }>();
  const cooling = new Map<string, CoolingEntry>();
  for (const key of e.catalog.keys()) {
    const m = e.morphOf(key, tick);
    if (m) morphs.set(key, m);
    const shown = m?.key ?? key;
    // an ability on cooldown keeps its colour (the sweep + seconds show the cooldown); only missing
    // adrenaline / resources / gear grey it out, like in the game
    const u = e.usable(shown, tick);
    usable.set(key, u === 'cooldown' ? 'ok' : u);
    const cd = e.cooldownLeft(shown, tick);
    if (cd > 0) cooling.set(key, { endTick: tick + cd, totalTicks: e.cooldownTotalTicks(shown) });
  }
  return { usable, morphs, cooling };
}

/** Seconds and sweep phase of every cooldown still running at `now` (entries that ended are left out). */
export function cooldownViews(e: Pick<TrainerEngine, 'tickTime'>, cooling: ReadonlyMap<string, CoolingEntry>, now: number): Map<string, CooldownView> {
  const out = new Map<string, CooldownView>();
  for (const [key, c] of cooling) {
    const remainingMs = e.tickTime(c.endTick) - now;
    if (remainingMs <= 0) continue;
    out.set(key, {
      cooldownS: remainingMs / 1000,
      cooldownPhase: c.totalTicks > 0 ? Math.max(0, Math.min(1, 1 - remainingMs / (c.totalTicks * TICK_MS))) : 1,
    });
  }
  return out;
}

export function sameUsable(a: ReadonlyMap<string, UsableReason>, b: ReadonlyMap<string, UsableReason>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

export function sameMorphs(a: ReadonlyMap<string, { key: string; stage: number }>, b: ReadonlyMap<string, { key: string; stage: number }>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    const o = b.get(k);
    if (!o || o.key !== v.key || o.stage !== v.stage) return false;
  }
  return true;
}

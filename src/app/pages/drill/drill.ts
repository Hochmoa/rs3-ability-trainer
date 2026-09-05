import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { Drill, DrillSource, DrillSummary, DrillTarget, WEAPON_POS, buildPool } from '../../core/drill';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { BAR_POSITIONS, BarShape, Style4, barLayout, entityKey, isStyle4, loadoutWeapons, visiblePresets } from '../../core/models';
import { PresetsService } from '../../core/presets.service';
import { StorageService } from '../../core/storage.service';
import { slotAbilities } from '../../engine/morphs';
import { AbilityIcon, IconState } from '../../shared/ability-icon';
import { ActionBar, SlotView } from '../../shared/action-bar';
import { ToastService } from '../../shared/toast';
import { EntityTip } from '../../shared/tooltip';

interface DrillOptions {
  /** bar positions to drill (index = position) */
  bars: boolean[];
  weapons: boolean;
  prayers: boolean;
  /** rotation id to restrict the pool to, null = every keybound slot */
  rotation: string | null;
  /** 0 = wait for the press */
  paceMs: number;
  /** 0 = endless */
  rounds: number;
  /** show the key after 2 s */
  hint: boolean;
}

interface BarView {
  position: number;
  presetName: string;
  slots: SlotView[];
  shape: BarShape;
  /** part of the drill pool */
  on: boolean;
}

interface WeaponView {
  entity: Entity;
  keyLabel: string;
  expected: boolean;
  flash: 'fired' | 'wrong' | null;
}

interface Finish {
  summary: DrillSummary;
  /** Escape / Stop instead of the last round */
  stopped: boolean;
}

const STORAGE_KEY = 'rs3-drill-options';
const HINT_AFTER_MS = 2000;
const FLASH_MS = 220;
const TICK_INTERVAL_MS = 40;
export const PACES = [
  { ms: 0, label: 'wait for the press' },
  { ms: 1800, label: 'every 1.8 s (3 ticks)' },
  { ms: 1200, label: 'every 1.2 s (2 ticks)' },
  { ms: 600, label: 'every 0.6 s (1 tick)' },
];
export const ROUNDS = [
  { n: 20, label: '20 prompts' },
  { n: 50, label: '50 prompts' },
  { n: 0, label: 'endless' },
];

function defaultOptions(): DrillOptions {
  return { bars: Array(BAR_POSITIONS).fill(true), weapons: true, prayers: true, rotation: null, paceMs: 0, rounds: 20, hint: true };
}

function loadOptions(): DrillOptions {
  const d = defaultOptions();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return d;
    const o = JSON.parse(raw) as Partial<DrillOptions>;
    return {
      bars: Array.isArray(o.bars) && o.bars.length === BAR_POSITIONS ? o.bars.map((b) => !!b) : d.bars,
      weapons: typeof o.weapons === 'boolean' ? o.weapons : d.weapons,
      prayers: typeof o.prayers === 'boolean' ? o.prayers : d.prayers,
      rotation: typeof o.rotation === 'string' ? o.rotation : null,
      paceMs: PACES.some((p) => p.ms === o.paceMs) ? (o.paceMs as number) : d.paceMs,
      rounds: ROUNDS.some((r) => r.n === o.rounds) ? (o.rounds as number) : d.rounds,
      hint: typeof o.hint === 'boolean' ? o.hint : d.hint,
    };
  } catch {
    return d;
  }
}

function saveOptions(o: DrillOptions): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  } catch {
    // private mode / quota – the options just do not survive the reload
  }
}

/**
 * Keybind drill: random prompts ("press Sever") from the keybound slots, no game clock, no cooldowns, no
 * adrenaline – only the key → slot reflex. Scoring lives in core/drill.ts; this page maps keys and clicks
 * onto the bars exactly like the trainer does and renders the bars through the shared action-bar component.
 */
@Component({
  selector: 'app-drill',
  imports: [AbilityIcon, ActionBar, RouterLink, FormsModule, EntityTip],
  templateUrl: './drill.html',
  styleUrl: './drill.scss',
})
export class DrillPage implements OnDestroy {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);
  readonly presets = inject(PresetsService);
  private toast = inject(ToastService);

  readonly PACES = PACES;
  readonly ROUNDS = ROUNDS;
  readonly BAR_LABELS = ['M', '1', '2', '3', '4'];
  readonly HINT_AFTER_S = HINT_AFTER_MS / 1000;

  readonly options = signal<DrillOptions>(loadOptions());
  readonly running = signal(false);
  readonly finish = signal<Finish | null>(null);
  /** performance.now() of the last tick while running – drives the hint, the cadence bar and the timer */
  readonly now = signal(0);
  /** bumped after every drill mutation so the computed views re-read the drill */
  private readonly version = signal(0);
  private drill: Drill | null = null;
  private timer = 0;
  private flashTimer = 0;
  /** slot / weapon lit up after a press */
  readonly flash = signal<{ pos: number; slot: number; kind: 'fired' | 'wrong' } | null>(null);
  /** the big icon's frame after a press */
  readonly promptState = signal<IconState>('idle');
  readonly startedAt = signal(0);

  /** bars follow the weapon of the active loadout, like the trainer before Start */
  readonly style = computed<Style4>(() => {
    const l = this.storage.loadout();
    const w = this.data.weaponById().get(l.twoHand ?? l.mainHand ?? '');
    return w && isStyle4(w.style) ? w.style : 'Melee';
  });
  readonly layout = computed(() => barLayout(this.storage.actionBars()));

  /** the rotation the pool is restricted to (null = all) */
  readonly rotation = computed(() => {
    const id = this.options().rotation;
    return id ? this.storage.rotations().find((r) => r.id === id) ?? null : null;
  });

  /** entity keys of the rotation's steps, null without a rotation filter */
  readonly rotationKeys = computed<Set<string> | null>(() => {
    const r = this.rotation();
    if (!r) return null;
    const keys = new Set<string>();
    for (const s of r.steps) if (s.kind !== 'note') keys.add(entityKey(s.kind, s.id));
    return keys;
  });

  /** everything with a key on the visible bars plus the weapon switches, before the filter */
  readonly sources = computed<DrillSource[]>(() => {
    const s = this.storage.actionBars();
    const shown = visiblePresets(s, this.style());
    const out: DrillSource[] = [];
    for (let pos = 0; pos < BAR_POSITIONS; pos++) {
      const id = shown[pos];
      const preset = id === null ? null : s.presets.find((p) => p.id === id);
      preset?.slots.forEach((step, slot) => {
        const entity = step ? this.data.step(step) : undefined;
        if (!entity) return;
        const aliases = entity.kind === 'ability' ? slotAbilities(entity.id).map((a) => entityKey('ability', a)) : [entity.key];
        out.push({ key: entity.key, aliases, kind: entity.kind, pos, slot, keybind: s.slotKeybinds[pos]?.[slot] ?? null });
      });
    }
    this.carried().forEach((w, i) => out.push({ key: w.key, kind: 'weapon', pos: WEAPON_POS, slot: i, keybind: s.weaponKeybinds[w.id] ?? null }));
    return out;
  });

  readonly pool = computed<DrillTarget[]>(() => {
    const o = this.options();
    return buildPool(this.sources(), { bars: o.bars, weapons: o.weapons, prayers: o.prayers, onlyKeys: this.rotationKeys() });
  });

  /** distinct entities in the pool – what the summary counts as "abilities" */
  readonly poolEntities = computed(() => new Set(this.pool().map((t) => t.key)).size);

  /** keybound slots on the bars at all – without any, the page points at the Keybinds page */
  readonly anyKeys = computed(() => this.sources().some((s) => !!s.keybind));

  /** weapons of the active loadout (the switches the drill can ask for) */
  readonly carried = computed(() =>
    loadoutWeapons(this.storage.loadout())
      .map((id) => this.data.get('weapon:' + id))
      .filter((e): e is Entity => !!e),
  );

  readonly current = computed<DrillTarget | null>(() => {
    this.version();
    return this.drill?.current ?? null;
  });
  readonly currentEntity = computed<Entity | null>(() => {
    const t = this.current();
    return t ? this.data.get(t.key) ?? null : null;
  });
  readonly hintVisible = computed(() => {
    const t = this.current();
    return !!t && this.options().hint && this.now() - this.shownAt() >= HINT_AFTER_MS;
  });
  readonly shownAt = computed(() => {
    this.version();
    return this.drill?.shownAt ?? 0;
  });
  /** 1 → 0 while the cadence runs out */
  readonly cadenceLeft = computed(() => {
    const d = this.drill;
    this.version();
    if (!d || !d.config.paceMs || !d.current) return 0;
    return d.remainingMs(this.now()) / d.config.paceMs;
  });
  readonly stats = computed(() => {
    this.version();
    const d = this.drill;
    return { hits: d?.hits ?? 0, misses: d?.misses ?? 0, streak: d?.streak ?? 0, best: d?.bestStreak ?? 0, avgMs: d?.avgMs() ?? null, round: d?.round ?? 0, rounds: d?.config.rounds ?? 0 };
  });
  readonly elapsedS = computed(() => (this.running() ? Math.floor((this.now() - this.startedAt()) / 1000) : 0));

  readonly weapons = computed<WeaponView[]>(() => {
    const s = this.storage.actionBars();
    const cur = this.current();
    const flash = this.flash();
    return this.carried().map((entity, i) => ({
      entity,
      keyLabel: keybindLabel(s.weaponKeybinds[entity.id]),
      expected: !!cur && cur.pos === WEAPON_POS && cur.slot === i,
      flash: flash && flash.pos === WEAPON_POS && flash.slot === i ? flash.kind : null,
    }));
  });

  /** the five bars: only `expected`, `flash` and `keyLabel` matter, nothing cools down here */
  readonly bars = computed<BarView[]>(() => {
    const s = this.storage.actionBars();
    const shown = visiblePresets(s, this.style());
    const cur = this.current();
    const flash = this.flash();
    const on = this.options().bars;
    const layout = this.layout();
    return layout.order.map((pos) => {
      const id = shown[pos] ?? null;
      const preset = id === null ? null : s.presets.find((p) => p.id === id) ?? null;
      const slots: SlotView[] = (preset?.slots ?? Array(14).fill(null)).map((step, i) => ({
        entity: step ? this.data.step(step) ?? null : null,
        keyLabel: keybindLabel(s.slotKeybinds[pos]?.[i]),
        usable: null,
        cooldownS: 0,
        cooldownPhase: 1,
        gcdPhase: 1,
        gcdRemainingMs: 0,
        expected: !!cur && cur.pos === pos && cur.slot === i,
        queued: false,
        flash: flash && flash.pos === pos && flash.slot === i ? flash.kind : null,
      }));
      return { position: pos, presetName: preset?.name ?? '– empty –', slots, shape: layout.shape[pos], on: on[pos] };
    });
  });

  ngOnDestroy(): void {
    this.clearTimers();
  }

  // ---- options

  set<K extends keyof DrillOptions>(key: K, value: DrillOptions[K]): void {
    const o = { ...this.options(), [key]: value };
    this.options.set(o);
    saveOptions(o);
  }

  toggleBar(pos: number): void {
    const bars = [...this.options().bars];
    bars[pos] = !bars[pos];
    this.set('bars', bars);
  }

  pickRotation(id: string): void {
    this.set('rotation', id === '' ? null : id);
  }

  // ---- session

  start(): void {
    const pool = this.pool();
    if (!pool.length) {
      this.toast.show(this.anyKeys() ? 'Nothing to drill with these options – widen the filter.' : 'No keybound slots yet – bind some keys first.', 'warn');
      return;
    }
    const o = this.options();
    this.finish.set(null);
    this.flash.set(null);
    this.promptState.set('idle');
    this.drill = new Drill(pool, { paceMs: o.paceMs, rounds: o.rounds });
    const now = performance.now();
    this.startedAt.set(now);
    this.now.set(now);
    this.drill.start(now);
    this.running.set(true);
    this.version.update((v) => v + 1);
    this.clearTimers();
    this.timer = window.setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  /** Stop button / Escape: the summary shows what was done so far */
  stop(): void {
    if (!this.running() || !this.drill) return;
    this.drill.stop();
    this.end(true);
  }

  /** "Again" on the summary */
  again(): void {
    this.finish.set(null);
    this.start();
  }

  closeSummary(): void {
    this.finish.set(null);
  }

  private tick(): void {
    const d = this.drill;
    if (!d) return;
    const now = performance.now();
    this.now.set(now);
    if (d.tick(now)) {
      this.promptState.set('too-early');
      this.armFlashClear();
      this.version.update((v) => v + 1);
    }
    if (d.finished) this.end(false);
  }

  private end(stopped: boolean): void {
    const d = this.drill;
    this.clearTimers();
    this.running.set(false);
    this.flash.set(null);
    this.promptState.set('idle');
    this.version.update((v) => v + 1);
    if (d) this.finish.set({ summary: d.summary(), stopped });
  }

  private clearTimers(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.timer = 0;
    this.flashTimer = 0;
  }

  private armFlashClear(): void {
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = window.setTimeout(() => {
      this.flash.set(null);
      this.promptState.set('idle');
      this.flashTimer = 0;
    }, FLASH_MS);
  }

  // ---- input

  /** one press, resolved to what it would fire on the bars; `where` lights up afterwards */
  private press(input: { bind?: string; key?: string }, where: { pos: number; slot: number } | null): void {
    const d = this.drill;
    if (!d || !this.running()) return;
    const target = d.current;
    const now = performance.now();
    this.now.set(now);
    const r = d.press(input, now);
    if (r === 'ignored') return;
    if (r === 'hit' && target) {
      this.flash.set({ pos: target.pos, slot: target.slot, kind: 'fired' });
      this.promptState.set('fired');
    } else {
      this.flash.set(where ? { ...where, kind: 'wrong' } : null);
      this.promptState.set('wrong');
    }
    this.armFlashClear();
    this.version.update((v) => v + 1);
    if (d.finished) this.end(false);
  }

  /** click on a bar slot = press it (touch / mouse) */
  slotClick(pos: number, slot: number): void {
    if (!this.running()) return;
    const entity = this.bars().find((b) => b.position === pos)?.slots[slot]?.entity;
    if (entity) this.press({ key: entity.key }, { pos, slot });
  }

  weaponClick(i: number): void {
    if (!this.running()) return;
    const w = this.carried()[i];
    if (w) this.press({ key: w.key }, { pos: WEAPON_POS, slot: i });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.running()) return;
    if (e.code === 'Escape') {
      e.preventDefault();
      this.stop();
      return;
    }
    const kb = keybindFromEvent(e);
    if (!kb) return;
    const k = keybindKey(kb);
    const setup = this.storage.actionBars();
    // same order as the trainer: weapon keys, then the bars top to bottom
    const carried = this.carried();
    for (let i = 0; i < carried.length; i++) {
      const wk = setup.weaponKeybinds[carried[i].id];
      if (wk && keybindKey(wk) === k) {
        e.preventDefault();
        this.press({ bind: k, key: carried[i].key }, { pos: WEAPON_POS, slot: i });
        return;
      }
    }
    for (let pos = 0; pos < BAR_POSITIONS; pos++) {
      const row = setup.slotKeybinds[pos] ?? [];
      for (let i = 0; i < row.length; i++) {
        const skb = row[i];
        if (skb && keybindKey(skb) === k) {
          e.preventDefault();
          const entity = this.bars().find((b) => b.position === pos)?.slots[i]?.entity;
          this.press({ bind: k, key: entity?.key }, { pos, slot: i });
          return;
        }
      }
    }
    // an unbound key is still a wrong press
    this.press({ bind: k }, null);
  }

  // ---- formatting

  ms(v: number | null): string {
    return v === null ? '–' : v >= 1000 ? (v / 1000).toFixed(2) + ' s' : v + ' ms';
  }

  pct(v: number): string {
    return Math.round(v * 100) + '%';
  }

  name(key: string): string {
    return this.data.name(key);
  }

  icon(key: string): string | null {
    return this.data.get(key)?.icon ?? null;
  }
}

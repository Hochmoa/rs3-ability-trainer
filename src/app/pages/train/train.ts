import { DecimalPipe } from '@angular/common';
import { Component, HostListener, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, Entity, SPEC_KEY } from '../../core/data.service';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { AttackPattern, BAR_POSITIONS, DEFAULT_ENEMY, ENEMY_PRESETS, EnemyConfig, PrayerStats, STYLES4, StepResult, Style4, entityKey, visiblePresets, RotationStep } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { ActiveBuff, EngineEntity, EngineEvent, GCD_TICKS, TICK_MS, TrainerEngine, UsableReason } from '../../engine/trainer-engine';
import { SOUL_SPLIT } from '../../engine/prayer-rules';
import { AbilityIcon, IconState } from '../../shared/ability-icon';
import { ActionBar, SlotView } from '../../shared/action-bar';
import { EntityTip } from '../../shared/tooltip';

interface Feedback {
  text: string;
  cls: 'good' | 'bad' | 'warn' | 'info';
}

interface QueueSlot {
  entity: Entity;
  key: string;
  stepIndex: number;
  kind: 'prev' | 'current' | 'next';
  done: boolean;
  /** free-text step from an imported rotation */
  note?: string;
  phase?: boolean;
  hint?: string;
  sameTick?: boolean;
  offsetTicks?: number;
}

interface BuffView {
  id: string;
  name: string;
  icon: string | null;
  kind: 'Buff' | 'Debuff';
  remainingS: number | null;
}

interface BarView {
  position: number;
  presetName: string;
  slots: SlotView[];
}

interface IncomingView {
  style: Style4 | null;
  /** style not visible yet */
  hidden: boolean;
  ticksLeft: number;
  /** 0..1 until the hit lands */
  progress: number;
  /** overhead needed for this attack (entity key) */
  needed: string;
  /** the needed overhead is active right now */
  covered: boolean;
}

const EMPTY_PRAYER_STATS: PrayerStats = { ticks: 0, soulSplitTicks: 0, attacks: 0, prayed: 0, hits: 0 };

@Component({
  selector: 'app-train',
  imports: [AbilityIcon, ActionBar, RouterLink, FormsModule, EntityTip, DecimalPipe],
  templateUrl: './train.html',
  styleUrl: './train.scss',
})
export class Train implements OnDestroy {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);
  private route = inject(ActivatedRoute);

  readonly TICK_MS = TICK_MS;
  readonly GCD_MS = TICK_MS * GCD_TICKS;
  readonly STYLES4 = STYLES4;
  readonly ENEMY_PRESETS = ENEMY_PRESETS;
  readonly PATTERNS: { id: AttackPattern; label: string }[] = [
    { id: 'random', label: 'random' },
    { id: 'no-repeat', label: 'random, never the same style twice' },
    { id: 'cycle', label: 'in order' },
    { id: 'streak', label: 'streaks of n, then next style' },
  ];
  readonly enemy = this.storage.enemy;
  readonly enemyOpen = signal(false);

  readonly selectedId = signal<string | null>(null);
  readonly rotation = computed(() => this.storage.rotations().find((r) => r.id === this.selectedId()) ?? null);
  /** rotation steps resolved to entities (null = unknown / removed from the game); notes become synthetic entities */
  readonly stepEntities = computed<(Entity | null)[]>(
    () => this.rotation()?.steps.map((s, i) => (s.kind === 'note' ? noteEntity(s, i) : this.data.step(s) ?? null)) ?? [],
  );
  readonly unknownSteps = computed(() => (this.data.loaded() ? this.stepEntities().filter((e) => !e).length : 0));

  /** entity key → where it can be pressed ("Main bar 3" / "Magic weapon key"), for all presets a position can show */
  readonly reachable = computed(() => {
    const s = this.storage.actionBars();
    const m = new Map<string, string>();
    const presetIds = new Set<number>();
    s.positions.forEach((p) => p !== null && presetIds.add(p));
    for (const st of STYLES4) s.bindings[st].forEach((p) => p !== null && presetIds.add(p));
    for (let pos = 0; pos < BAR_POSITIONS; pos++) {
      const shown = new Set<number | null>([s.positions[pos], ...STYLES4.map((st) => s.bindings[st][pos])]);
      for (const id of shown) {
        if (id === null) continue;
        const preset = s.presets.find((p) => p.id === id);
        preset?.slots.forEach((step, i) => {
          const kb = s.slotKeybinds[pos]?.[i];
          if (step && step.kind !== 'note' && kb && !m.has(entityKey(step.kind, step.id))) m.set(entityKey(step.kind, step.id), keybindLabel(kb));
        });
      }
    }
    for (const st of STYLES4) {
      const kb = s.weaponKeybinds[st];
      if (kb) m.set('weapon:' + st.toLowerCase(), keybindLabel(kb));
    }
    for (const [id, kb] of Object.entries(s.actionKeybinds ?? {})) {
      if (kb) m.set('action:' + id, keybindLabel(kb));
    }
    // the generic "Weapon Special Attack" slot fires every spec
    const specKey = m.get(SPEC_KEY);
    if (specKey) for (const sp of this.data.specs()) if (!m.has('spec:' + sp.id)) m.set('spec:' + sp.id, specKey);
    return m;
  });
  readonly unreachable = computed(() => {
    const seen = new Set<string>();
    const r = this.reachable();
    return this.stepEntities().filter((e): e is Entity => !!e && !e.key.startsWith('note:') && !r.has(e.key) && !seen.has(e.key) && !!seen.add(e.key));
  });
  readonly canStart = computed(() => !!this.rotation() && this.stepEntities().length > 0 && this.unreachable().length === 0 && this.unknownSteps() === 0);

  // live state
  readonly running = signal(false);
  readonly finished = signal(false);
  readonly tickPhase = signal(0);
  readonly gcdPhase = signal(1);
  readonly gcdRemaining = signal(0);
  readonly index = signal(0);
  readonly doneSteps = signal<Set<number>>(new Set());
  readonly adrenaline = signal(0);
  readonly maxAdrenaline = signal(100);
  readonly weapon = signal<Style4>('Melee');
  readonly buffs = signal<BuffView[]>([]);
  readonly iconState = signal<IconState>('idle');
  readonly feedback = signal<Feedback | null>(null);
  readonly counts = signal({ perfect: 0, late: 0, early: 0, wrong: 0, missed: 0 });
  readonly results = signal<StepResult[]>([]);
  readonly expectedKey = signal<string | null>(null);
  readonly queuedKey = signal<string | null>(null);
  readonly flashKey = signal<{ key: string; kind: 'fired' | 'wrong' } | null>(null);
  /** per visible entity: usability + own cooldown, refreshed every frame */
  readonly slotState = signal<Map<string, { usable: UsableReason; cooldownS: number }>>(new Map());
  /** active prayers as entities (icon + tooltip) */
  readonly activePrayers = signal<Entity[]>([]);
  readonly prayerStats = signal<PrayerStats>({ ...EMPTY_PRAYER_STATS });
  readonly incoming = signal<IncomingView | null>(null);
  readonly attackLog = signal<{ style: Style4; prayed: boolean; tick: number }[]>([]);
  /** Soul Split ticks + prayed attacks, out of all ticks */
  readonly prayerScore = computed(() => {
    const s = this.prayerStats();
    return { score: s.soulSplitTicks + s.prayed, max: s.ticks, pct: s.ticks ? Math.round(((s.soulSplitTicks + s.prayed) / s.ticks) * 100) : 0 };
  });
  readonly prayerBook = computed(() => this.storage.loadout().prayerBook ?? 'Curses');

  readonly accuracy = computed(() => {
    const r = this.results();
    return r.length ? Math.round((r.filter((x) => x.outcome === 'perfect' || x.outcome === 'done').length / r.length) * 100) : 0;
  });
  readonly selfBuffs = computed(() => this.buffs().filter((b) => b.kind === 'Buff'));
  readonly targetDebuffs = computed(() => this.buffs().filter((b) => b.kind === 'Debuff'));

  /** the five bars for the wielded weapon */
  readonly bars = computed<BarView[]>(() => {
    const s = this.storage.actionBars();
    const style = this.running() ? this.weapon() : s.startWeapon;
    const shown = visiblePresets(s, style);
    const state = this.slotState();
    const running = this.running();
    const gcd = this.gcdPhase();
    const gcdMs = this.gcdRemaining();
    const expected = this.expectedKey();
    const queued = this.queuedKey();
    const flash = this.flashKey();
    return shown.map((id, pos) => {
      const preset = id === null ? null : s.presets.find((p) => p.id === id) ?? null;
      const slots: SlotView[] = (preset?.slots ?? Array(14).fill(null)).map((step, i) => {
        const entity = step ? this.data.step(step) ?? null : null;
        const st = entity ? state.get(entity.key) : undefined;
        const isGcdAbility = !!entity?.ability?.triggersGcd;
        return {
          entity,
          keyLabel: keybindLabel(s.slotKeybinds[pos]?.[i]),
          usable: running && entity ? st?.usable ?? 'ok' : null,
          cooldownS: running ? st?.cooldownS ?? 0 : 0,
          gcdPhase: running && isGcdAbility ? gcd : 1,
          gcdRemainingMs: running && isGcdAbility ? gcdMs : 0,
          expected: running && !!entity && entity.key === expected,
          queued: running && !!entity && entity.key === queued,
          flash: running && entity && flash?.key === entity.key ? flash.kind : null,
        };
      });
      return { position: pos, presetName: preset?.name ?? '– empty –', slots };
    });
  });

  readonly slots = computed<QueueSlot[]>(() => {
    const entities = this.stepEntities();
    if (!entities.length || entities.some((e) => !e)) return [];
    const steps = entities as Entity[];
    const loop = this.storage.settings().loop;
    const i = this.running() ? this.index() : 0;
    const reach = this.reachable();
    const done = this.doneSteps();
    const slot = (idx: number, kind: QueueSlot['kind']): QueueSlot | null => {
      let j = idx;
      if (loop) j = ((idx % steps.length) + steps.length) % steps.length;
      if (j < 0 || j >= steps.length) return null;
      const entity = steps[j];
      const rs = this.rotation()?.steps[j];
      return {
        entity,
        key: reach.get(entity.key) ?? '',
        stepIndex: j,
        kind,
        done: this.running() && done.has(j) && kind !== 'prev',
        note: rs?.kind === 'note' ? rs.note ?? '' : undefined,
        phase: rs?.phase,
        hint: rs?.hint,
        sameTick: rs?.sameTick,
        offsetTicks: rs?.offsetTicks,
      };
    };
    const out: QueueSlot[] = [];
    const prev = slot(i - 1, 'prev');
    if (prev) out.push(prev);
    const cur = slot(i, 'current');
    if (cur) out.push(cur);
    for (let k = 1; k <= 4; k++) {
      const n = slot(i + k, 'next');
      if (n) out.push(n);
    }
    return out;
  });

  private engine: TrainerEngine | null = null;
  private raf = 0;
  private fallback = 0;
  private flashUntil = 0;
  private startedAt = 0;

  constructor() {
    effect(() => {
      const rotations = this.storage.rotations();
      const wanted = this.route.snapshot.queryParamMap.get('rotation');
      if (this.selectedId() && rotations.some((r) => r.id === this.selectedId())) return;
      const pick = rotations.find((r) => r.id === wanted) ?? rotations[0];
      this.selectedId.set(pick ? pick.id : null);
    });
  }

  ngOnDestroy(): void {
    this.stop();
  }

  name(key: string): string {
    return this.data.name(key);
  }

  weaponKey(style: Style4): string {
    return keybindLabel(this.storage.actionBars().weaponKeybinds[style]);
  }

  weaponIcon(style: Style4): string {
    return this.data.get('weapon:' + style.toLowerCase())?.icon ?? '';
  }

  start(): void {
    const rot = this.rotation();
    if (!rot || !this.canStart()) return;
    const setup = this.storage.actionBars();
    const rotSteps = rot.steps;
    const steps = (this.stepEntities() as Entity[]).map((e, i) => {
      const s = rotSteps[i];
      if (s.kind === 'note') return { key: e.key, kind: 'action' as const, name: e.name, icon: e.icon, gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], isNote: true };
      const ee = { ...this.data.toEngineEntity(e) };
      if (s.offsetTicks !== undefined) ee.offsetTicks = s.offsetTicks;
      else if (s.sameTick) ee.offsetTicks = 0;
      return ee;
    });
    const catalog = new Map<string, EngineEntity>();
    const add = (key: string) => {
      if (catalog.has(key)) return;
      const e = this.data.get(key);
      if (e) catalog.set(key, this.data.toEngineEntity(e));
    };
    for (const p of setup.presets) for (const step of p.slots) if (step && step.kind !== 'note') add(entityKey(step.kind, step.id));
    for (const id of Object.keys(setup.actionKeybinds ?? {})) add('action:' + id);
    for (const st of STYLES4) add('weapon:' + st.toLowerCase());
    for (const s of steps) catalog.set(s.key, s);
    const enemy = this.enemy();
    this.engine = new TrainerEngine(steps, catalog, {
      ...this.storage.settings(),
      loadout: { ...this.storage.loadout() },
      weaponSetup: { start: setup.startWeapon, types: { ...setup.weapons } },
      prayerBook: this.prayerBook(),
      enemy: enemy.enabled ? { ...enemy, styles: [...enemy.styles] } : undefined,
    });
    // every prayer of the book is pressable even when it is on no bar (touch / click users get it via the bars only)
    for (const p of this.data.prayers()) add('prayer:' + p.id);
    this.activePrayers.set([]);
    this.prayerStats.set({ ...EMPTY_PRAYER_STATS });
    this.incoming.set(null);
    this.attackLog.set([]);
    this.startedAt = Date.now();
    this.results.set([]);
    this.counts.set({ perfect: 0, late: 0, early: 0, wrong: 0, missed: 0 });
    this.doneSteps.set(new Set());
    this.buffs.set([]);
    this.maxAdrenaline.set(this.engine.maxAdrenaline);
    const first = this.slots().find((s) => s.kind === 'current');
    this.feedback.set({ text: 'Press ' + first?.key + ' (' + first?.entity.name + ') to start.', cls: 'info' });
    this.finished.set(false);
    this.running.set(true);
    this.index.set(0);
    this.iconState.set('idle');
    this.flashKey.set(null);
    this.engine.start(performance.now());
    this.weapon.set(this.engine.weapon);
    this.adrenaline.set(this.engine.adrenaline);
    this.expectedKey.set(this.engine.currentStep?.key ?? null);
    this.raf = requestAnimationFrame(this.frame);
    this.fallback = window.setInterval(() => this.tick(performance.now()), 100);
  }

  stop(): void {
    if (!this.running()) return;
    this.stopLoops();
    this.engine?.stop();
    this.running.set(false);
    this.finished.set(true);
    this.gcdPhase.set(1);
    this.gcdRemaining.set(0);
    this.saveSession();
  }

  private frame = (now: number): void => {
    if (this.tick(now)) this.raf = requestAnimationFrame(this.frame);
  };

  private stopLoops(): void {
    cancelAnimationFrame(this.raf);
    window.clearInterval(this.fallback);
  }

  private tick(now: number): boolean {
    const e = this.engine;
    if (!e || !this.running()) return false;
    e.update(now);
    for (const ev of e.events) this.applyEvent(ev, now);
    e.events.length = 0;
    this.tickPhase.set(e.tickPhase(now));
    this.gcdPhase.set(e.gcdPhase(now));
    this.gcdRemaining.set(e.gcdRemainingMs(now));
    this.index.set(e.index);
    this.adrenaline.set(e.adrenaline);
    this.weapon.set(e.weapon);
    this.expectedKey.set(e.currentStep?.key ?? null);
    this.queuedKey.set(e.queuedKey);
    this.buffs.set(e.buffs.map((b) => this.buffView(b, now)));
    this.syncPrayers(e, now);
    if (now >= this.flashUntil) {
      this.iconState.set(e.isQueued ? 'queued' : 'idle');
      if (this.flashKey()) this.flashKey.set(null);
    }
    // usability of everything on the visible bars
    const tick = e.currentTick(now);
    const state = new Map<string, { usable: UsableReason; cooldownS: number }>();
    for (const key of e.catalog.keys()) {
      const cd = e.cooldownLeft(key, tick);
      state.set(key, { usable: e.usable(key, tick), cooldownS: cd > 0 ? (e.tickTime(tick + cd) - now) / 1000 : 0 });
    }
    this.slotState.set(state);
    if (e.state !== 'running') {
      this.stopLoops();
      this.running.set(false);
      this.finished.set(true);
      this.saveSession();
      return false;
    }
    return true;
  }

  private syncPrayers(e: TrainerEngine, now: number): void {
    const ids = [...e.activePrayers];
    const current = this.activePrayers();
    if (ids.length !== current.length || ids.some((id, i) => current[i]?.id !== id)) {
      this.activePrayers.set(ids.map((id) => this.data.get('prayer:' + id)).filter((x): x is Entity => !!x));
    }
    this.prayerStats.set({ ...e.prayerStats });
    const a = e.nextAttack;
    if (!a) {
      if (this.incoming()) this.incoming.set(null);
      return;
    }
    const tick = e.currentTick(now);
    const interval = Math.max(1, this.enemy().intervalTicks);
    const startTime = e.tickTime(a.tick - interval);
    const progress = Math.max(0, Math.min(1, (now - startTime) / (e.tickTime(a.tick) - startTime)));
    const hidden = tick < a.revealTick;
    const needed = 'prayer:' + e.protectionFor(a.style);
    this.incoming.set({
      style: hidden ? null : a.style,
      hidden,
      ticksLeft: Math.max(0, a.tick - tick),
      progress,
      needed,
      covered: e.activePrayers.has(e.protectionFor(a.style)),
    });
  }

  private buffView(b: ActiveBuff, now: number): BuffView {
    const remaining = b.endTick === null ? null : Math.max(0, (this.engine!.tickTime(b.endTick) - now) / 1000);
    return { id: b.id, name: b.name, icon: b.icon, kind: b.kind, remainingS: remaining };
  }

  private applyEvent(ev: EngineEvent, now: number): void {
    const e = this.engine!;
    switch (ev.kind) {
      case 'queued': {
        const inMs = Math.max(0, Math.round(e.tickTime(ev.fireTick) - now));
        if (ev.key === ev.expected) {
          this.feedback.set({ text: 'Queued – casts in ' + inMs + ' ms', cls: 'info' });
        } else {
          this.feedback.set({ text: 'Wrong ability queued: ' + this.name(ev.key) + ' – expected ' + this.name(ev.expected), cls: 'bad' });
          this.flash('wrong', ev.key, now, inMs + 200);
        }
        break;
      }
      case 'fired': {
        const r = ev.result;
        this.results.update((list) => [...list, r]);
        this.doneSteps.update((s) => new Set(s).add(r.step));
        if (r.outcome === 'perfect') {
          this.counts.update((c) => ({ ...c, perfect: c.perfect + 1 }));
          this.feedback.set({ text: r.name + ' – perfect' + (r.offsetMs ? ' (' + r.offsetMs + ' ms early)' : ''), cls: 'good' });
        } else if (r.outcome === 'late') {
          this.counts.update((c) => ({ ...c, late: c.late + 1 }));
          this.feedback.set({ text: r.name + ' – late by ' + r.lateTicks + (r.lateTicks === 1 ? ' tick' : ' ticks') + (r.offsetMs ? ' (+' + r.offsetMs + ' ms)' : ''), cls: 'warn' });
        } else if (r.outcome === 'early') {
          this.counts.update((c) => ({ ...c, late: c.late + 1 }));
          this.feedback.set({ text: r.name + ' – ' + -r.lateTicks + (r.lateTicks === -1 ? ' tick' : ' ticks') + ' early', cls: 'warn' });
        } else {
          this.feedback.set({ text: r.name + (r.kind === 'weapon' ? ' wielded' : ' – activated'), cls: 'good' });
        }
        this.flash('fired', r.key, now, 200);
        break;
      }
      case 'wrong-fired':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: this.name(ev.key) + (this.data.get(ev.key)?.kind === 'ability' ? ' cast' : ' activated') + ' instead of ' + this.name(ev.expected) + ' – try again', cls: 'bad' });
        this.flash('wrong', ev.key, now, 300);
        break;
      case 'too-early':
        this.counts.update((c) => ({ ...c, early: c.early + 1 }));
        this.feedback.set({ text: 'Too early – ' + ev.ticksEarly + (ev.ticksEarly === 1 ? ' tick' : ' ticks') + ' before the last cooldown tick (queueing is off)', cls: 'bad' });
        this.flash('wrong', ev.key, now, 250);
        break;
      case 'wrong':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: 'Wrong ability: ' + this.name(ev.key) + ' – ignored, on cooldown', cls: 'bad' });
        this.flash('wrong', ev.key, now, 250);
        break;
      case 'wrong-weapon':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({
          text: this.name(ev.key) + (ev.reason === 'weapon' ? ' needs a ' + (this.data.get(ev.key)?.ability?.style ?? '') + ' weapon – you wield ' + e.weapon : ' needs different equipment (' + (this.data.get(ev.key)?.ability?.equipment ?? '') + ')'),
          cls: 'bad',
        });
        this.flash('wrong', ev.key, now, 300);
        break;
      case 'weapon':
        break;
      case 'prayer': {
        const name = this.data.name('prayer:' + ev.id);
        if (ev.on) {
          this.feedback.set({ text: name + ' on' + (ev.replaced.length ? ' – replaced ' + ev.replaced.map((r) => this.data.name('prayer:' + r)).join(', ') : ''), cls: 'info' });
        } else {
          this.feedback.set({ text: name + ' off', cls: 'info' });
        }
        break;
      }
      case 'wrong-book':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: this.data.name('prayer:' + ev.id) + ' is a ' + (ev.book === 'Curses' ? 'curse' : 'standard prayer') + ' – your book is ' + (this.prayerBook() === 'Curses' ? 'Ancient Curses' : 'standard prayers') + ' (Loadout)', cls: 'bad' });
        this.flash('wrong', 'prayer:' + ev.id, now, 300);
        break;
      case 'attack': {
        this.attackLog.update((l) => [...l.slice(-19), { style: ev.style, prayed: ev.prayed, tick: ev.tick }]);
        const needed = this.data.name('prayer:' + ev.needed);
        if (ev.prayed) {
          this.feedback.set({ text: ev.style + ' attack blocked by ' + needed, cls: 'good' });
        } else {
          this.feedback.set({ text: 'Hit by a ' + ev.style + ' attack – ' + needed + ' was not active', cls: 'bad' });
        }
        break;
      }
      case 'no-adrenaline':
        this.feedback.set({ text: this.name(ev.key) + ' needs ' + ev.need + '% adrenaline, you have ' + Math.floor(ev.have) + '%' + (this.storage.settings().abilityQueueing ? ' – queued until you have it' : ''), cls: 'bad' });
        this.flash('wrong', ev.key, now, 300);
        break;
      case 'on-cooldown':
        this.feedback.set({ text: this.name(ev.key) + ' is on cooldown for ' + (ev.readyInTicks * TICK_MS) / 1000 + ' s' + (this.storage.settings().abilityQueueing ? ' – queued' : ''), cls: 'bad' });
        this.flash('wrong', ev.key, now, 300);
        break;
      case 'missed':
        this.counts.update((c) => ({ ...c, missed: c.missed + ev.keys.length }));
        this.feedback.set({ text: 'Missed before the cast: ' + ev.keys.map((k) => this.name(k)).join(', '), cls: 'warn' });
        break;
      case 'finished': {
        const last = this.feedback();
        this.feedback.set({ text: (last ? last.text + ' · ' : '') + 'Rotation finished.', cls: last?.cls ?? 'info' });
        break;
      }
    }
  }

  private flash(kind: 'fired' | 'wrong', key: string, now: number, ms: number): void {
    this.iconState.set(kind === 'fired' ? 'fired' : 'wrong');
    this.flashKey.set({ key, kind });
    this.flashUntil = now + ms;
  }

  private saveSession(): void {
    const rot = this.rotation();
    const results = this.results();
    if (!rot || (!results.length && !(this.enemy().enabled && this.prayerStats().attacks))) return;
    void this.storage.addSession({
      rotationId: rot.id,
      rotationName: rot.name,
      startedAt: this.startedAt,
      endedAt: Date.now(),
      settings: { ...this.storage.settings() },
      loadout: { ...this.storage.loadout() },
      results,
      enemy: this.enemy().enabled ? { ...this.enemy() } : undefined,
      prayerStats: this.enemy().enabled ? { ...this.prayerStats() } : undefined,
    });
  }

  // ------------------------------------------------------------------ enemy config

  setEnemy<K extends keyof EnemyConfig>(key: K, value: EnemyConfig[K]): void {
    const e = { ...this.enemy(), [key]: value, preset: key === 'enabled' ? this.enemy().preset : null };
    if (key === 'enabled') e.preset = this.enemy().preset;
    void this.storage.saveEnemy(e);
  }

  applyPreset(id: string): void {
    const p = ENEMY_PRESETS.find((x) => x.preset === id);
    void this.storage.saveEnemy(p ? { ...p, styles: [...p.styles], enabled: true } : { ...DEFAULT_ENEMY, enabled: this.enemy().enabled });
  }

  toggleStyle(style: Style4): void {
    const styles = this.enemy().styles.includes(style) ? this.enemy().styles.filter((s) => s !== style) : [...this.enemy().styles, style];
    if (!styles.length) return;
    this.setEnemy('styles', styles);
  }

  numberOf(v: unknown, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(Number(v) || min)));
  }

  neededName(key: string): string {
    return this.data.name(key);
  }

  hasSoulSplit(): boolean {
    return this.activePrayers().some((p) => p.id === SOUL_SPLIT);
  }

  /** click on a bar slot while training = press it (for touch / mouse users) */
  slotClick(pos: number, slot: number): void {
    if (!this.running()) return;
    const entity = this.bars()[pos]?.slots[slot]?.entity;
    if (entity) this.engine?.press(entity.key, performance.now());
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
    for (const st of STYLES4) {
      const wk = setup.weaponKeybinds[st];
      if (wk && keybindKey(wk) === k) {
        e.preventDefault();
        this.engine?.press('weapon:' + st.toLowerCase(), performance.now());
        return;
      }
    }
    for (const [id, ak] of Object.entries(setup.actionKeybinds ?? {})) {
      if (ak && keybindKey(ak) === k) {
        e.preventDefault();
        this.engine?.press('action:' + id, performance.now());
        return;
      }
    }
    for (let pos = 0; pos < BAR_POSITIONS; pos++) {
      const row = setup.slotKeybinds[pos] ?? [];
      for (let i = 0; i < row.length; i++) {
        const skb = row[i];
        if (skb && keybindKey(skb) === k) {
          e.preventDefault();
          const entity = this.bars()[pos]?.slots[i]?.entity;
          if (entity) this.engine?.press(entity.key, performance.now());
          return;
        }
      }
    }
  }
}

/** A note step shown in the queue like an entity (no key, no engine effect). */
function noteEntity(step: RotationStep, index: number): Entity {
  return {
    key: 'note:' + index,
    kind: 'action',
    id: 'note-' + index,
    name: step.note ?? '',
    icon: step.phase ? 'assets/actions/phase.png' : 'assets/actions/note.png',
    group: 'Notes',
  };
}

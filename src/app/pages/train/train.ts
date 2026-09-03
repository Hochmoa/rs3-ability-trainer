import { DecimalPipe } from '@angular/common';
import { Component, HostListener, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { StepResult } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { ActiveBuff, EngineEntity, EngineEvent, GCD_TICKS, TICK_MS, TrainerEngine } from '../../engine/trainer-engine';
import { AbilityIcon, IconState } from '../../shared/ability-icon';
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
}

interface BuffView {
  id: string;
  name: string;
  icon: string | null;
  kind: 'Buff' | 'Debuff';
  remainingS: number | null;
}

@Component({
  selector: 'app-train',
  imports: [AbilityIcon, RouterLink, FormsModule, EntityTip, DecimalPipe],
  templateUrl: './train.html',
  styleUrl: './train.scss',
})
export class Train implements OnDestroy {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);
  private route = inject(ActivatedRoute);

  readonly TICK_MS = TICK_MS;
  readonly GCD_MS = TICK_MS * GCD_TICKS;

  readonly selectedId = signal<string | null>(null);
  readonly rotation = computed(() => this.storage.rotations().find((r) => r.id === this.selectedId()) ?? null);
  /** rotation steps resolved to entities (null = unknown / removed from the game) */
  readonly stepEntities = computed<(Entity | null)[]>(() => this.rotation()?.steps.map((s) => this.data.step(s) ?? null) ?? []);
  readonly missingBinds = computed(() => {
    const kb = this.storage.keybinds();
    const seen = new Set<string>();
    return this.stepEntities().filter((e): e is Entity => !!e && !kb[e.key] && !seen.has(e.key) && !!seen.add(e.key));
  });
  readonly unknownSteps = computed(() => (this.data.loaded() ? this.stepEntities().filter((e) => !e).length : 0));
  readonly canStart = computed(
    () => !!this.rotation() && this.stepEntities().length > 0 && this.missingBinds().length === 0 && this.unknownSteps() === 0,
  );
  /** keybind key → entity key, for resolving key presses while training */
  private readonly bindIndex = computed(() => {
    const m = new Map<string, string>();
    for (const [key, kb] of Object.entries(this.storage.keybinds())) m.set(keybindKey(kb), key);
    return m;
  });

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
  readonly buffs = signal<BuffView[]>([]);
  readonly iconState = signal<IconState>('idle');
  readonly feedback = signal<Feedback | null>(null);
  readonly counts = signal({ perfect: 0, late: 0, early: 0, wrong: 0, missed: 0 });
  readonly results = signal<StepResult[]>([]);
  readonly accuracy = computed(() => {
    const r = this.results();
    return r.length ? Math.round((r.filter((x) => x.outcome === 'perfect' || x.outcome === 'done').length / r.length) * 100) : 0;
  });
  readonly selfBuffs = computed(() => this.buffs().filter((b) => b.kind === 'Buff'));
  readonly targetDebuffs = computed(() => this.buffs().filter((b) => b.kind === 'Debuff'));

  readonly slots = computed<QueueSlot[]>(() => {
    const entities = this.stepEntities();
    if (!entities.length || entities.some((e) => !e)) return [];
    const steps = entities as Entity[];
    const loop = this.storage.settings().loop;
    const i = this.running() ? this.index() : 0;
    const kb = this.storage.keybinds();
    const done = this.doneSteps();
    const slot = (idx: number, kind: QueueSlot['kind']): QueueSlot | null => {
      let j = idx;
      if (loop) j = ((idx % steps.length) + steps.length) % steps.length;
      if (j < 0 || j >= steps.length) return null;
      const entity = steps[j];
      return { entity, key: keybindLabel(kb[entity.key]), stepIndex: j, kind, done: this.running() && done.has(j) && kind !== 'prev' };
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
  /** background tabs pause requestAnimationFrame; this keeps the engine ticking (coarsely) there */
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

  start(): void {
    const rot = this.rotation();
    if (!rot || !this.canStart()) return;
    const steps = (this.stepEntities() as Entity[]).map((e) => this.data.toEngineEntity(e));
    const catalog = new Map<string, EngineEntity>();
    for (const key of Object.keys(this.storage.keybinds())) {
      const e = this.data.get(key);
      if (e) catalog.set(key, this.data.toEngineEntity(e));
    }
    for (const s of steps) catalog.set(s.key, s);
    this.engine = new TrainerEngine(steps, catalog, { ...this.storage.settings(), loadout: { ...this.storage.loadout() } });
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
    this.engine.start(performance.now());
    this.adrenaline.set(this.engine.adrenaline);
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

  /** Advances the engine to `now` and mirrors its state into signals. Returns false once the session is over. */
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
    this.buffs.set(e.buffs.map((b) => this.buffView(b, now)));
    if (now >= this.flashUntil) this.iconState.set(e.isQueued ? 'queued' : 'idle');
    if (e.state !== 'running') {
      this.stopLoops();
      this.running.set(false);
      this.finished.set(true);
      this.saveSession();
      return false;
    }
    return true;
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
          this.flash('wrong', now, inMs + 200);
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
          this.feedback.set({ text: r.name + ' – late by ' + r.lateTicks + (r.lateTicks === 1 ? ' tick' : ' ticks') + ' (+' + r.offsetMs + ' ms)', cls: 'warn' });
        } else {
          this.feedback.set({ text: r.name + ' – activated', cls: 'good' });
        }
        this.flash('fired', now, 200);
        break;
      }
      case 'wrong-fired':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: this.name(ev.key) + (this.data.get(ev.key)?.kind === 'ability' ? ' cast' : ' activated') + ' instead of ' + this.name(ev.expected) + ' – try again', cls: 'bad' });
        this.flash('wrong', now, 300);
        break;
      case 'too-early':
        this.counts.update((c) => ({ ...c, early: c.early + 1 }));
        this.feedback.set({ text: 'Too early – ' + ev.ticksEarly + (ev.ticksEarly === 1 ? ' tick' : ' ticks') + ' before the last cooldown tick (queueing is off)', cls: 'bad' });
        this.flash('too-early', now, 250);
        break;
      case 'wrong':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: 'Wrong ability: ' + this.name(ev.key) + ' – ignored, on cooldown', cls: 'bad' });
        this.flash('wrong', now, 250);
        break;
      case 'no-adrenaline':
        this.feedback.set({ text: this.name(ev.key) + ' needs ' + ev.need + '% adrenaline, you have ' + Math.floor(ev.have) + '%' + (this.storage.settings().abilityQueueing ? ' – queued until you have it' : ''), cls: 'bad' });
        this.flash('wrong', now, 300);
        break;
      case 'on-cooldown':
        this.feedback.set({ text: this.name(ev.key) + ' is on cooldown for ' + (ev.readyInTicks * TICK_MS) / 1000 + ' s' + (this.storage.settings().abilityQueueing ? ' – queued' : ''), cls: 'bad' });
        this.flash('wrong', now, 300);
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

  private flash(state: IconState, now: number, ms: number): void {
    this.iconState.set(state);
    this.flashUntil = now + ms;
  }

  private saveSession(): void {
    const rot = this.rotation();
    const results = this.results();
    if (!rot || !results.length) return;
    void this.storage.addSession({
      rotationId: rot.id,
      rotationName: rot.name,
      startedAt: this.startedAt,
      endedAt: Date.now(),
      settings: { ...this.storage.settings() },
      loadout: { ...this.storage.loadout() },
      results,
    });
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
    const key = this.bindIndex().get(keybindKey(kb));
    if (!key) return;
    e.preventDefault();
    this.engine?.press(key, performance.now());
  }
}

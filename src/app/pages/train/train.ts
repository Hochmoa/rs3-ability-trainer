import { Component, HostListener, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AbilitiesService } from '../../core/abilities.service';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { Ability, StepResult } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { EngineEvent, GCD_TICKS, TICK_MS, TrainerEngine } from '../../engine/trainer-engine';
import { AbilityIcon, IconState } from '../../shared/ability-icon';

interface Feedback {
  text: string;
  cls: 'good' | 'bad' | 'warn' | 'info';
}

interface QueueSlot {
  ability: Ability;
  key: string;
  kind: 'prev' | 'current' | 'next';
}

@Component({
  selector: 'app-train',
  imports: [AbilityIcon, RouterLink, FormsModule],
  templateUrl: './train.html',
  styleUrl: './train.scss',
})
export class Train implements OnDestroy {
  readonly storage = inject(StorageService);
  readonly abilities = inject(AbilitiesService);
  private route = inject(ActivatedRoute);

  readonly TICK_MS = TICK_MS;
  readonly GCD_MS = TICK_MS * GCD_TICKS;

  readonly selectedId = signal<string | null>(null);
  readonly rotation = computed(() => this.storage.rotations().find((r) => r.id === this.selectedId()) ?? null);
  readonly missingBinds = computed(() => {
    const rot = this.rotation();
    if (!rot) return [];
    const kb = this.storage.keybinds();
    return [...new Set(rot.steps.filter((id) => !kb[id]))]
      .map((id) => this.abilities.get(id))
      .filter((a): a is Ability => !!a);
  });
  readonly unknownSteps = computed(() => {
    const rot = this.rotation();
    return rot && this.abilities.loaded() ? rot.steps.filter((id) => !this.abilities.get(id)) : [];
  });
  readonly canStart = computed(
    () => !!this.rotation() && this.rotation()!.steps.length > 0 && this.missingBinds().length === 0 && this.unknownSteps().length === 0,
  );
  /** keybind key → ability id, for resolving key presses while training */
  private readonly bindIndex = computed(() => {
    const m = new Map<string, string>();
    for (const [id, kb] of Object.entries(this.storage.keybinds())) m.set(keybindKey(kb), id);
    return m;
  });

  // live state
  readonly running = signal(false);
  readonly finished = signal(false);
  readonly tickPhase = signal(0);
  readonly gcdPhase = signal(1);
  readonly gcdRemaining = signal(0);
  readonly index = signal(0);
  readonly iconState = signal<IconState>('idle');
  readonly feedback = signal<Feedback | null>(null);
  readonly counts = signal({ perfect: 0, late: 0, early: 0, wrong: 0 });
  readonly results = signal<StepResult[]>([]);
  readonly accuracy = computed(() => {
    const r = this.results();
    return r.length ? Math.round((r.filter((x) => x.outcome === 'perfect').length / r.length) * 100) : 0;
  });

  readonly slots = computed<QueueSlot[]>(() => {
    const rot = this.rotation();
    if (!rot || !rot.steps.length) return [];
    const steps = rot.steps;
    const loop = this.storage.settings().loop;
    const i = this.running() ? this.index() : 0;
    const kb = this.storage.keybinds();
    const slot = (idx: number, kind: QueueSlot['kind']): QueueSlot | null => {
      let j = idx;
      if (loop) j = ((idx % steps.length) + steps.length) % steps.length;
      if (j < 0 || j >= steps.length) return null;
      const ability = this.abilities.get(steps[j]);
      return ability ? { ability, key: keybindLabel(kb[ability.id]), kind } : null;
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
    // preselect: ?rotation=id, else the most recently edited rotation
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

  abilityName(id: string): string {
    return this.abilities.get(id)?.name ?? id;
  }

  start(): void {
    const rot = this.rotation();
    if (!rot || !this.canStart()) return;
    this.engine = new TrainerEngine(rot.steps, { ...this.storage.settings() });
    this.startedAt = Date.now();
    this.results.set([]);
    this.counts.set({ perfect: 0, late: 0, early: 0, wrong: 0 });
    this.feedback.set({ text: 'Press ' + this.slots().find((s) => s.kind === 'current')?.key + ' to fire the first ability.', cls: 'info' });
    this.finished.set(false);
    this.running.set(true);
    this.index.set(0);
    this.iconState.set('idle');
    this.engine.start(performance.now());
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

  private applyEvent(ev: EngineEvent, now: number): void {
    switch (ev.kind) {
      case 'queued':
        this.feedback.set({ text: 'Queued – fires in ' + Math.round(this.engine!.tickTime(ev.fireTick) - now) + ' ms', cls: 'info' });
        break;
      case 'fired': {
        const r = ev.result;
        this.results.update((list) => [...list, r]);
        this.counts.update((c) => ({ ...c, perfect: c.perfect + (r.outcome === 'perfect' ? 1 : 0), late: c.late + (r.outcome === 'late' ? 1 : 0) }));
        if (r.outcome === 'perfect') {
          this.feedback.set({ text: this.abilityName(r.abilityId) + ' – perfect' + (r.offsetMs ? ' (' + r.offsetMs + ' ms early)' : ''), cls: 'good' });
        } else {
          this.feedback.set({ text: this.abilityName(r.abilityId) + ' – late by ' + r.lateTicks + (r.lateTicks === 1 ? ' tick' : ' ticks') + ' (+' + r.offsetMs + ' ms)', cls: 'warn' });
        }
        this.flash('fired', now, 200);
        break;
      }
      case 'too-early':
        this.counts.update((c) => ({ ...c, early: c.early + 1 }));
        this.feedback.set({ text: 'Too early – ' + ev.ticksEarly + (ev.ticksEarly === 1 ? ' tick' : ' ticks') + ' before the queue window', cls: 'bad' });
        this.flash('too-early', now, 250);
        break;
      case 'wrong':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: 'Wrong ability: ' + this.abilityName(ev.abilityId) + ' – expected ' + this.abilityName(ev.expected), cls: 'bad' });
        this.flash('wrong', now, 250);
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
    const abilityId = this.bindIndex().get(keybindKey(kb));
    if (!abilityId) return;
    e.preventDefault();
    this.engine?.press(abilityId, performance.now());
  }
}

import { CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { DecimalPipe } from '@angular/common';
import { Component, HostListener, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, Entity, SPEC_KEY } from '../../core/data.service';
import { applyWield, equip, unequip } from '../../core/equipment';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { AttackPattern, BAR_POSITIONS, BarShape, barLayout, DEFAULT_ENEMY, ENEMY_PRESETS, EnemyConfig, EquipSlot, ItemRef, Loadout, PrayerStats, Prebuild, STYLES4, Settings, StepResult, Style4, WeaponSpec, emptyPrebuild, entityKey, isStyle4, loadoutWeapons, loadoutWield, parseEntityKey, prebuildIsEmpty, visiblePresets, RotationStep } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { resolveLoadout } from '../../engine/loadout-resolver';
import { BUFF_BY_ID, ruleFor } from '../../engine/rules';
import { STACK_NAMES, STYLE_STACKS, StackId } from '../../engine/rules-model';
import { ActiveBuff, EngineEntity, EngineEvent, GCD_TICKS, TICK_MS, TrainerEngine, UsableReason, Wield } from '../../engine/trainer-engine';
import { SOUL_SPLIT } from '../../engine/prayer-rules';
import { morphSourceOf, slotAbilities } from '../../engine/morphs';
import { AbilityIcon, IconState } from '../../shared/ability-icon';
import { ActionBar, SlotView } from '../../shared/action-bar';
import { GearAction, GearPanel } from '../../shared/gear-panel';
import { ToastService } from '../../shared/toast';
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
  stacks: number;
}

interface StackView {
  id: StackId;
  name: string;
  value: number;
}

interface BarView {
  position: number;
  presetName: string;
  slots: SlotView[];
  shape: BarShape;
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
  imports: [AbilityIcon, ActionBar, RouterLink, FormsModule, EntityTip, DecimalPipe, CdkDropListGroup, CdkDropList, CdkDrag, GearPanel],
  templateUrl: './train.html',
  styleUrl: './train.scss',
})
export class Train implements OnDestroy {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

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
  /** layout edit mode: drag bars to reorder, toggle wide / compact */
  readonly editLayout = signal(false);
  readonly layout = computed(() => barLayout(this.storage.actionBars()));

  readonly selectedId = signal<string | null>(null);
  readonly rotation = computed(() => this.storage.rotations().find((r) => r.id === this.selectedId()) ?? null);
  /** rotation steps resolved to entities (null = unknown / removed from the game); notes become synthetic entities */
  readonly stepEntities = computed<(Entity | null)[]>(
    () => this.rotation()?.steps.map((s, i) => (s.kind === 'note' ? noteEntity(s, i) : this.data.step(s) ?? null)) ?? [],
  );
  readonly unknownSteps = computed(() => (this.data.loaded() ? this.stepEntities().filter((e) => !e).length : 0));

  /** the active loadout resolved for the weapons in hand at the start */
  readonly resolved = computed(() => resolveLoadout(this.storage.loadout(), this.loadoutData()));
  readonly loadoutData = computed(() => ({
    weaponById: this.data.weaponById(),
    specById: this.data.specById(),
    perkById: this.data.perkById(),
    setEffectById: this.data.setEffectById(),
    gearById: this.data.gearById(),
    specEntity: (s: WeaponSpec) => this.data.specEntity(s),
  }));
  // ---------------------------------------------------------------- pre-build

  readonly prebuildOpen = signal(false);
  readonly prebuild = computed<Prebuild>(() => {
    const id = this.selectedId();
    return (id && this.storage.prebuilds()[id]) || emptyPrebuild();
  });
  readonly prebuildEmpty = computed(() => prebuildIsEmpty(this.prebuild()));
  /** combat styles the rotation uses */
  readonly rotationStyles = computed(() => new Set(this.stepEntities().map((e) => e?.ability?.style).filter((s): s is NonNullable<typeof s> => !!s)));
  /** stacks worth pre-building for this rotation */
  readonly prebuildStacks = computed<{ id: StackId; name: string; max: number }[]>(() => {
    const styles = this.rotationStyles();
    const out: { id: StackId; name: string; max: number }[] = [];
    const add = (id: StackId, max: number) => !out.some((s) => s.id === id) && out.push({ id, name: STACK_NAMES[id], max });
    const caps: Partial<Record<StackId, number>> = { bloodlust: 8, necrosis: 12, 'residual-souls': 5, 'storm-shards': 10, valour: 25, 'death-spark': 5, 'soul-reave': 4, 'glacial-embrace': 10, 'essence-corruption': 10 };
    for (const st of styles) for (const id of STYLE_STACKS[st] ?? []) add(id, caps[id] ?? 10);
    const ids = new Set(this.stepEntities().map((e) => e?.ability?.id));
    if (ids.has('storm-shards') || ids.has('shatter')) add('storm-shards', 10);
    return out;
  });
  readonly SPIRITS = [
    { id: 'skeleton-warrior', name: 'Skeleton Warrior' },
    { id: 'putrid-zombie', name: 'Putrid Zombie' },
    { id: 'vengeful-ghost', name: 'Vengeful Ghost' },
    { id: 'phantom-guardian', name: 'Phantom Guardian' },
  ];
  /** incantations / self buffs that are usually active before the fight */
  readonly prebuildAbilities = computed<Entity[]>(() => {
    const styles = this.rotationStyles();
    return this.data
      .abilities()
      .filter((a) => a.type === 'Incantation' || ['sunshine', 'greater-sunshine', 'death-s-swiftness', 'greater-death-s-swiftness', 'berserk', 'anticipation', 'freedom'].includes(a.id))
      .filter((a) => styles.has(a.style) || (a.type === 'Incantation' && styles.has('Necromancy')))
      .map((a) => this.data.get(entityKey('ability', a.id)))
      .filter((e): e is Entity => !!e);
  });
  /** prayers of the loadout's book that the rotation or the bars use, plus Soul Split */
  readonly prebuildPrayers = computed<Entity[]>(() => {
    const book = this.prayerBook();
    const ids = new Set<string>([SOUL_SPLIT]);
    for (const e of this.stepEntities()) if (e?.prayer) ids.add(e.id);
    for (const key of this.reachable().keys()) if (key.startsWith('prayer:')) ids.add(key.slice(7));
    return [...ids]
      .map((id) => this.data.get('prayer:' + id))
      .filter((e): e is Entity => !!e && e.prayer?.book === book);
  });

  setPrebuild(patch: Partial<Prebuild>): void {
    const id = this.selectedId();
    if (!id) return;
    void this.storage.savePrebuild(id, { ...this.prebuild(), ...patch });
  }

  setPrebuildStack(id: StackId, v: unknown, max: number): void {
    this.setPrebuild({ stacks: { ...this.prebuild().stacks, [id]: this.numberOf(v, 0, max) } });
  }

  togglePrebuildList(list: 'spirits' | 'abilities' | 'prayers', id: string): void {
    const cur = this.prebuild()[list];
    this.setPrebuild({ [list]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } as Partial<Prebuild>);
  }

  setPrebuildAdrenaline(v: unknown): void {
    const s = String(v ?? '').trim();
    this.setPrebuild({ adrenaline: s === '' ? undefined : this.numberOf(s, 0, 120) });
  }

  clearPrebuild(): void {
    const id = this.selectedId();
    if (id) void this.storage.savePrebuild(id, null);
  }

  prebuildSummary(): string {
    const p = this.prebuild();
    const parts: string[] = [];
    if (p.adrenaline !== undefined) parts.push(p.adrenaline + '% adrenaline');
    for (const [id, n] of Object.entries(p.stacks)) if (n > 0) parts.push(n + ' ' + (STACK_NAMES[id as StackId] ?? id));
    for (const s of p.spirits) parts.push(this.SPIRITS.find((x) => x.id === s)?.name ?? s);
    for (const a of p.abilities) parts.push(this.data.name('ability:' + a));
    for (const pr of p.prayers) parts.push(this.data.name('prayer:' + pr));
    return parts.join(' · ');
  }

  /** equipment + backpack of the running session (weapon switches, drunk potions, swapped armour); null = not running */
  readonly live = signal<Loadout | null>(null);
  /** what the gear panel shows: the live state while training, the saved loadout otherwise */
  readonly gearState = computed(() => this.live() ?? this.storage.loadout());
  private slotOf = (r: ItemRef): EquipSlot | null => this.data.slotOf(r);
  /** steps the active loadout cannot perform (no 2h, no shield, no spec weapon ...) */
  readonly equipmentWarnings = computed<string[]>(() => {
    if (!this.data.loaded()) return [];
    const probe = new TrainerEngine([], new Map(), { ...this.storage.settings(), loadout: this.resolved() });
    probe.start(0);
    const out = new Set<string>();
    const inv = this.storage.loadout().inventory;
    for (const e of this.stepEntities()) {
      if (e?.special && !inv.some((r) => r?.kind === 'special' && r.id === e.id)) out.add(e.name + ': not in your backpack (Loadout page)');
      if (!e?.ability) continue;
      const rule = ruleFor(e.ability.id);
      for (const r of rule?.requires ?? []) {
        if (r.equipment) {
          const fail = probe.requirementFailure(this.data.toEngineEntity(e), 0);
          if (fail && fail === r.text) out.add(e.name + ': ' + r.text);
        }
      }
    }
    return [...out];
  });

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
          // a slot without a keybind can still be clicked, like in the game
          if (step && step.kind !== 'note') {
            const keys = step.kind === 'ability' ? slotAbilities(step.id).map((id) => entityKey('ability', id)) : [entityKey(step.kind, step.id)];
            for (const key of keys) {
              if (kb) m.set(key, keybindLabel(kb));
              else if (!m.has(key)) m.set(key, 'click');
            }
          }
        });
      }
    }
    for (const [id, kb] of Object.entries(s.weaponKeybinds)) {
      if (kb) m.set('weapon:' + id, keybindLabel(kb));
    }
    for (const [id, kb] of Object.entries(s.actionKeybinds ?? {})) {
      if (kb) m.set('action:' + id, keybindLabel(kb));
    }
    // potions and weapons in the backpack can be clicked there
    for (const r of this.storage.loadout().inventory) {
      if (r?.kind === 'special' && !m.has('special:' + r.id)) m.set('special:' + r.id, 'click');
      if (r?.kind === 'weapon' && !m.has('weapon:' + r.id)) m.set('weapon:' + r.id, 'click');
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
  readonly styleStacks = computed<StackId[]>(() => {
    const styles = new Set(this.stepEntities().map((e) => e?.ability?.style).filter((s): s is NonNullable<typeof s> => !!s));
    const out: StackId[] = [];
    if (styles.has('Melee')) out.push('bloodlust');
    if (styles.has('Necromancy')) out.push('necrosis', 'residual-souls');
    const ids = new Set(this.stepEntities().map((e) => e?.ability?.id));
    if (ids.has('storm-shards') || ids.has('shatter')) out.push('storm-shards');
    return out;
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
  /** ids of the weapons in hand while training */
  readonly wielded = signal<string[]>([]);
  /** combat style of the wielded weapon (bars are bound per style) */
  readonly weapon = signal<Style4>('Melee');
  /** style of the loadout's starting weapon */
  readonly startStyle = computed<Style4>(() => {
    const l = this.storage.loadout();
    const w = this.data.weaponById().get(l.twoHand ?? l.mainHand ?? '');
    return w && isStyle4(w.style) ? w.style : 'Melee';
  });
  readonly buffs = signal<BuffView[]>([]);
  readonly stacks = signal<StackView[]>([]);
  /** entity key → remaining internal cooldown ms */
  readonly cooldowns = signal<Record<string, { remainingMs: number; totalMs: number }>>({});
  readonly channelling = signal<string | null>(null);
  readonly iconState = signal<IconState>('idle');
  readonly feedback = signal<Feedback | null>(null);
  readonly counts = signal({ perfect: 0, late: 0, early: 0, wrong: 0, missed: 0 });
  readonly results = signal<StepResult[]>([]);
  readonly expectedKey = signal<string | null>(null);
  readonly queuedKey = signal<string | null>(null);
  readonly flashKey = signal<{ key: string; kind: 'fired' | 'wrong' } | null>(null);
  /** per visible entity: usability + own cooldown, refreshed every frame */
  readonly slotState = signal<Map<string, { usable: UsableReason; cooldownS: number; cooldownPhase: number }>>(new Map());
  /** slot key → what it shows right now (Command X, Slaughter, Spectral Scythe 2) */
  readonly morphs = signal<Map<string, { entity: Entity; stage: number }>>(new Map());
  /** active prayers as entities (icon + tooltip) */
  readonly activePrayers = signal<Entity[]>([]);
  readonly prayerStats = signal<PrayerStats>({ ...EMPTY_PRAYER_STATS });
  readonly incoming = signal<IncomingView | null>(null);
  /** damage of the session */
  readonly damage = signal(0);
  readonly hits = signal(0);
  readonly dps = signal(0);
  readonly targetHp = signal(0);
  readonly killedAtMs = signal<number | null>(null);
  /** floating hit numbers, newest last */
  readonly hitsplats = signal<{ id: number; amount: number; crit: boolean; dot: boolean; name: string }[]>([]);
  private hitId = 0;
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
    const style = this.running() ? this.weapon() : this.startStyle();
    const shown = visiblePresets(s, style);
    const state = this.slotState();
    const running = this.running();
    const gcd = this.gcdPhase();
    const gcdMs = this.gcdRemaining();
    const expected = this.expectedKey();
    const queued = this.queuedKey();
    const flash = this.flashKey();
    const layout = this.layout();
    const morphs = this.morphs();
    return layout.order.map((pos) => {
      const id = shown[pos] ?? null;
      const preset = id === null ? null : s.presets.find((p) => p.id === id) ?? null;
      const slots: SlotView[] = (preset?.slots ?? Array(14).fill(null)).map((step, i) => {
        const entity = step ? this.data.step(step) ?? null : null;
        const m = running && entity ? morphs.get(entity.key) : undefined;
        const morph = m ? { entity: m.entity, stage: m.stage } : null;
        const shown = morph?.entity ?? entity;
        const st = shown ? state.get(shown.key) : undefined;
        const isGcdAbility = !!shown?.ability?.triggersGcd;
        return {
          entity,
          morph,
          keyLabel: keybindLabel(s.slotKeybinds[pos]?.[i]),
          usable: running && entity ? st?.usable ?? 'ok' : null,
          cooldownS: running ? st?.cooldownS ?? 0 : 0,
          cooldownPhase: running ? st?.cooldownPhase ?? 1 : 1,
          gcdPhase: running && isGcdAbility ? gcd : 1,
          gcdRemainingMs: running && isGcdAbility ? gcdMs : 0,
          expected: running && !!shown && shown.key === expected,
          queued: running && !!shown && shown.key === queued,
          flash: running && shown && flash?.key === shown.key ? flash.kind : null,
        };
      });
      return { position: pos, presetName: preset?.name ?? '– empty –', slots, shape: layout.shape[pos] };
    });
  });

  /** ← → in layout edit mode: move the bar one place back / forward in the display order */
  moveBar(position: number, dir: -1 | 1): void {
    const order = [...this.layout().order];
    const i = order.indexOf(position);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    void this.storage.saveActionBars({ ...this.storage.actionBars(), layout: { order, shape: [...this.layout().shape] } });
  }

  /** the "missing abilities" list never takes items back */
  readonly never = (): boolean => false;

  /** edit the preset shown at `pos` for the start weapon; an empty position gets the first unused empty preset */
  private editPreset(pos: number, mutate: (slots: (RotationStep | null)[]) => void): void {
    if (this.running()) return;
    const s = structuredClone(this.storage.actionBars());
    let id = visiblePresets(s, this.startStyle())[pos];
    if (id === null) {
      const free = s.presets.find((p) => !p.slots.some(Boolean) && !s.positions.includes(p.id));
      if (!free) return;
      id = free.id;
      s.positions[pos] = id;
    }
    const preset = s.presets.find((p) => p.id === id);
    if (!preset) return;
    mutate(preset.slots);
    void this.storage.saveActionBars(s);
  }

  /** a missing ability was dropped onto a slot of the bar at `pos` */
  dropOnSlot(pos: number, slot: number, entity: Entity): void {
    if (entity.kind === 'action' || entity.key.startsWith('note:')) return;
    this.editPreset(pos, (slots) => {
      slots[slot] = { kind: entity.kind, id: entity.id } as RotationStep;
    });
  }

  /** ‹ › on a slot: swap with the neighbour */
  moveSlot(pos: number, slot: number, dir: -1 | 1): void {
    const j = slot + dir;
    if (j < 0 || j >= 14) return;
    this.editPreset(pos, (slots) => {
      [slots[slot], slots[j]] = [slots[j], slots[slot]];
    });
  }

  clearSlot(pos: number, slot: number): void {
    this.editPreset(pos, (slots) => {
      slots[slot] = null;
    });
  }

  toggleShape(position: number): void {
    const shape = [...this.layout().shape];
    shape[position] = shape[position] === 'compact' ? 'wide' : 'compact';
    void this.storage.saveActionBars({ ...this.storage.actionBars(), layout: { order: [...this.layout().order], shape } });
  }

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
    if (key.startsWith('spec:')) return this.data.specById().get(key.slice(5))?.name ?? key;
    return this.data.name(key);
  }

  /** carried weapons of the active loadout with their switch keys */
  readonly carriedWeapons = computed(() =>
    loadoutWeapons(this.gearState())
      .map((id) => this.data.get('weapon:' + id))
      .filter((e): e is Entity => !!e)
      .map((e) => ({ entity: e, key: keybindLabel(this.storage.actionBars().weaponKeybinds[e.id]) })),
  );

  /** cooldown overlay for a queue slot: phase 1 = ready */
  cdPhase(slot: QueueSlot): number {
    const cd = this.cooldowns()[slot.entity.key];
    if (!cd || cd.remainingMs <= 0 || cd.totalMs <= 0) return 1;
    return 1 - cd.remainingMs / cd.totalMs;
  }

  cdRemaining(slot: QueueSlot): number {
    return this.cooldowns()[slot.entity.key]?.remainingMs ?? 0;
  }

  start(): void {
    const rot = this.rotation();
    if (!rot || !this.canStart()) return;
    const setup = this.storage.actionBars();
    const rotSteps = rot.steps;
    const steps = (this.stepEntities() as Entity[]).map((e, i) => {
      const s = rotSteps[i];
      if (s.kind === 'note') return { key: e.key, kind: 'action' as const, id: e.id, name: e.name, icon: e.icon, gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], isNote: true };
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
    for (const p of setup.presets) {
      for (const step of p.slots) {
        if (!step || step.kind === 'note') continue;
        if (step.kind === 'ability') for (const id of slotAbilities(step.id)) add(entityKey('ability', id));
        else add(entityKey(step.kind, step.id));
      }
    }
    for (const id of Object.keys(setup.actionKeybinds ?? {})) add('action:' + id);
    for (const id of loadoutWeapons(this.storage.loadout())) add('weapon:' + id);
    for (const r of this.storage.loadout().inventory) if (r?.kind === 'special') add('special:' + r.id);
    for (const s of steps) catalog.set(s.key, s);
    const enemy = this.enemy();
    const l = structuredClone(this.storage.loadout());
    this.live.set(l);
    this.engine = new TrainerEngine(steps, catalog, {
      ...this.storage.settings(),
      loadout: this.resolved(),
      startWield: loadoutWield(l),
      // a weapon switch moves the weapons between hands and backpack; armour and jewellery stay as swapped
      resolveWield: (w: Wield) => {
        const cur = this.live() ?? l;
        const next = { ...cur, ...applyWield(cur, w, this.slotOf) };
        this.live.set(next);
        return resolveLoadout(next, this.loadoutData());
      },
      hasItem: (key: string) => {
        const { kind, id } = parseEntityKey(key);
        return (this.live() ?? l).inventory.some((r) => r?.kind === kind && r.id === id);
      },
      prayerBook: this.prayerBook(),
      enemy: enemy.enabled ? { ...enemy, styles: [...enemy.styles] } : undefined,
      targetLifePoints: enemy.lifePoints > 0 ? enemy.lifePoints : undefined,
      prebuild: this.prebuildEmpty() ? undefined : this.prebuild(),
    });
    this.damage.set(0);
    this.hits.set(0);
    this.dps.set(0);
    this.targetHp.set(enemy.lifePoints);
    this.killedAtMs.set(null);
    this.hitsplats.set([]);
    // every prayer of the book is pressable even when it is on no bar (touch / click users get it via the bars only)
    for (const p of this.data.prayers()) add('prayer:' + p.id);
    for (const id of this.prebuild().abilities) add('ability:' + id);
    this.activePrayers.set([]);
    this.prayerStats.set({ ...EMPTY_PRAYER_STATS });
    this.incoming.set(null);
    this.attackLog.set([]);
    this.stacks.set([]);
    this.cooldowns.set({});
    this.channelling.set(null);
    this.morphs.set(new Map());
    this.startedAt = Date.now();
    this.results.set([]);
    this.counts.set({ perfect: 0, late: 0, early: 0, wrong: 0, missed: 0 });
    this.doneSteps.set(new Set());
    this.buffs.set([]);
    this.stacks.set([]);
    this.cooldowns.set({});
    this.channelling.set(null);
    this.maxAdrenaline.set(this.engine.maxAdrenaline);
    const first = this.slots().find((s) => s.kind === 'current');
    this.feedback.set({ text: 'Press ' + first?.key + ' (' + first?.entity.name + ') to start.', cls: 'info' });
    this.finished.set(false);
    this.running.set(true);
    this.index.set(0);
    this.iconState.set('idle');
    this.flashKey.set(null);
    this.engine.start(performance.now());
    this.syncWield(this.engine);
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
    this.live.set(null);
    this.saveSession();
  }

  /** click in the gear panel while training: wield / drink / wear / take off */
  onGear(a: GearAction): void {
    if (a.kind !== 'click') return;
    const e = this.engine;
    const l = this.live();
    if (!this.running() || !e || !l) {
      this.toast.show('Start a session to use the backpack; the loadout is edited on the Loadout page.');
      return;
    }
    const name = this.data.view(a.ref)?.name ?? a.ref.id;
    if (a.from.kind === 'inv') {
      if (a.ref.kind === 'weapon') return e.press('weapon:' + a.ref.id, performance.now());
      if (a.ref.kind === 'special') return e.press('special:' + a.ref.id, performance.now());
      const r = equip(l, a.ref, this.slotOf, a.from.index);
      if (r.error) return this.toast.show(r.error, 'warn');
      this.live.set({ ...l, ...r.state });
      e.refreshLoadout();
      this.feedback.set({ text: name + ' worn', cls: 'info' });
    } else if (a.from.kind === 'equip') {
      const r = unequip(l, a.from.slot, this.slotOf);
      if (r.error) return this.toast.show(r.error, 'warn');
      this.live.set({ ...l, ...r.state });
      if (a.ref.kind === 'weapon') e.setWield(loadoutWield(this.live()!));
      else e.refreshLoadout();
      this.feedback.set({ text: name + ' taken off', cls: 'info' });
    }
  }

  /** backpack potions grey out like bar slots when they cannot be drunk right now */
  readonly gearUsable = computed<((ref: ItemRef) => boolean) | null>(() => {
    if (!this.running()) return null;
    const state = this.slotState();
    return (ref) => ref.kind !== 'special' || (state.get('special:' + ref.id)?.usable ?? 'ok') === 'ok';
  });

  /** switch key of a carried weapon, shown on its backpack cell */
  readonly gearKey = (ref: ItemRef): string => (ref.kind === 'weapon' ? keybindLabel(this.storage.actionBars().weaponKeybinds[ref.id]) : '');

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
    if (e.maxAdrenaline !== this.maxAdrenaline()) this.maxAdrenaline.set(e.maxAdrenaline);
    if (e.damageDealt !== this.damage()) {
      this.damage.set(e.damageDealt);
      this.hits.set(e.hitCount);
      this.targetHp.set(e.targetHp);
    }
    const elapsedS = (now - e.t0) / 1000;
    if (elapsedS >= 1) this.dps.set(e.damageDealt / elapsedS);
    this.syncWield(e);
    this.expectedKey.set(e.currentStep?.key ?? null);
    this.queuedKey.set(e.queuedKey);
    this.buffs.set(e.buffs.map((b) => this.buffView(b, now)));
    this.stacks.set(this.styleStacks().map((id) => ({ id, name: STACK_NAMES[id], value: e.stack(id) })));
    const cds: Record<string, { remainingMs: number; totalMs: number }> = {};
    for (const s of this.slots()) {
      const remainingMs = e.cooldownRemainingMs(s.entity.key, now);
      if (remainingMs > 0) {
        const ent = e.catalog.get(s.entity.key);
        const total = ((ent ? (e.specFor(ent) ?? ent).cooldownTicks : 0) || 1) * TICK_MS;
        cds[s.entity.key] = { remainingMs, totalMs: Math.max(total, remainingMs) };
      }
    }
    this.cooldowns.set(cds);
    this.channelling.set(e.channel && !e.channel.cancelled ? e.channel.key : null);
    this.syncPrayers(e, now);
    if (now >= this.flashUntil) {
      this.iconState.set(e.isQueued ? 'queued' : 'idle');
      if (this.flashKey()) this.flashKey.set(null);
    }
    // usability of everything on the visible bars
    const tick = e.currentTick(now);
    const state = new Map<string, { usable: UsableReason; cooldownS: number; cooldownPhase: number }>();
    for (const key of e.catalog.keys()) {
      const cd = e.cooldownLeft(key, tick);
      // an ability on cooldown keeps its colour (the sweep + seconds show the cooldown); only missing
      // adrenaline / resources / gear grey it out, like in the game
      const usable = e.usable(key, tick);
      const total = e.catalog.get(key)?.cooldownTicks ?? 0;
      const remainingMs = cd > 0 ? e.tickTime(tick + cd) - now : 0;
      state.set(key, {
        usable: usable === 'cooldown' ? 'ok' : usable,
        cooldownS: remainingMs / 1000,
        cooldownPhase: cd > 0 && total > 0 ? Math.max(0, Math.min(1, 1 - remainingMs / (total * TICK_MS))) : 1,
      });
    }
    this.slotState.set(state);
    const morphs = new Map<string, { entity: Entity; stage: number }>();
    for (const key of e.catalog.keys()) {
      const m = e.morphOf(key, tick);
      if (!m) continue;
      const ent = this.data.get(m.key);
      if (ent) morphs.set(key, { entity: ent, stage: m.stage });
    }
    const cur = this.morphs();
    if (morphs.size !== cur.size || [...morphs].some(([k, v]) => cur.get(k)?.entity.key !== v.entity.key || cur.get(k)?.stage !== v.stage)) this.morphs.set(morphs);
    if (e.state !== 'running') {
      this.stopLoops();
      this.running.set(false);
      this.finished.set(true);
      this.live.set(null);
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

  /** style icon for incoming attacks */
  weaponIcon(style: Style4): string {
    return 'assets/weapons/' + style.toLowerCase() + '.png';
  }

  /** mirrors the engine's weapons in hand into the signals the bars and the weapon row use */
  private syncWield(e: TrainerEngine): void {
    const ids = [e.wield.twoHand, e.wield.mainHand, e.wield.offHand].filter((x): x is string => !!x);
    const cur = this.wielded();
    if (ids.length !== cur.length || ids.some((x, i) => x !== cur[i])) this.wielded.set(ids);
    const st = e.style;
    const next: Style4 = st && isStyle4(st) ? st : this.startStyle();
    if (next !== this.weapon()) this.weapon.set(next);
  }

  private buffView(b: ActiveBuff, now: number): BuffView {
    const remaining = b.endTick === null ? null : Math.max(0, (this.engine!.tickTime(b.endTick) - now) / 1000);
    let icon = b.icon;
    if (!icon) {
      const def = BUFF_BY_ID.get(b.id);
      icon = this.data.buffIcon(def?.wikiId) ?? this.engine!.catalog.get(b.sourceKey)?.icon ?? null;
    }
    return { id: b.id, name: b.name, icon, kind: b.kind, remainingS: remaining, stacks: b.stacks };
  }

  private applyEvent(ev: EngineEvent, now: number): void {
    const e = this.engine!;
    const queueing = this.storage.settings().abilityQueueing;
    switch (ev.kind) {
      case 'unqueued':
        this.feedback.set({ text: this.name(ev.key) + ' taken out of the queue', cls: 'info' });
        break;
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
          text: this.name(ev.key) + (ev.reason === 'weapon' ? ' needs a ' + (this.data.get(ev.key)?.ability?.style ?? this.data.get(ev.key)?.spec?.style ?? '') + ' weapon – you wield ' + (e.style ?? 'nothing') : ' is not the special attack of the wielded weapon'),
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
      case 'requirement':
        this.feedback.set({ text: this.name(ev.key) + ': ' + ev.text + (queueing ? ' – queued' : ''), cls: 'bad' });
        this.flash('wrong', ev.key, now, 300);
        break;
      case 'channel-cancelled':
        this.feedback.set({ text: this.name(ev.key) + ' channel cancelled – ' + ev.hitsLost + (ev.hitsLost === 1 ? ' hit' : ' hits') + ' lost', cls: 'warn' });
        break;
      case 'hit': {
        const id = ++this.hitId;
        const name = ev.key.startsWith('spirit:') ? ev.key.slice(7).replace(/-/g, ' ') : this.name(ev.key);
        this.hitsplats.update((l) => [...l.slice(-7), { id, amount: ev.amount, crit: ev.crit, dot: ev.dot, name }]);
        window.setTimeout(() => this.hitsplats.update((l) => l.filter((h) => h.id !== id)), 1800);
        break;
      }
      case 'killed': {
        const ms = Math.round(e.tickTime(ev.tick) - e.t0);
        this.killedAtMs.set(ms);
        this.feedback.set({ text: 'Target killed after ' + (ms / 1000).toFixed(1) + ' s – ' + Math.round(e.damageDealt).toLocaleString() + ' damage', cls: 'good' });
        break;
      }
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
      damage: { total: this.damage(), hits: this.hits(), dps: Math.round(this.dps()), killedAtMs: this.killedAtMs() },
    });
  }

  // ------------------------------------------------------------------ enemy config

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    void this.storage.saveSettings({ ...this.storage.settings(), [key]: value });
  }

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
    for (const [id, wk] of Object.entries(setup.weaponKeybinds)) {
      if (wk && keybindKey(wk) === k) {
        e.preventDefault();
        this.engine?.press('weapon:' + id, performance.now());
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

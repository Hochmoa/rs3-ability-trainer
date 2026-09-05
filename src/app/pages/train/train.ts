import { CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { DecimalPipe, DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, afterNextRender, afterRenderEffect, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, EOF_ICON, Entity, SPEC_KEY } from '../../core/data.service';
import { applyWield, equip, unequip } from '../../core/equipment';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { ActionBarSetup, AttackPattern, BAR_POSITIONS, BONE_SHIELD_ABILITY, INVENTORY_SIZE, BAR_SLOTS, BarShape, barLayout, DEFAULT_ENEMY, ENEMY_PRESETS, EnemyConfig, TARGET_TYPES, EquipSlot, ItemRef, Loadout, PrayerStats, Prebuild, REVOLUTION_MAX_SLOTS, REVOLUTION_MIN_SLOTS, RevolutionSettings, Rotation, STYLES4, Settings, StepResult, Style, Style4, WeaponSpec, emptyPrebuild, entityKey, isStyle4, loadoutWeapons, loadoutWield, parseEntityKey, prebuildIsEmpty, visiblePresets, RotationStep, CoachSettings } from '../../core/models';
import { alt1Announce, focusUrl, openFocusWindow } from '../../core/popout';
import { CoachService, spokenLabel, spokenSequence } from '../../core/coach.service';
import { PresetsService } from '../../core/presets.service';
import { StorageService } from '../../core/storage.service';
import { resolveLoadout } from '../../engine/loadout-resolver';
import { BUFF_BY_ID, ruleFor, stackMax, stackName } from '../../engine/rules';
import { STYLE_STACKS, StackId } from '../../engine/rules-model';
import { COMMAND_READY_AFTER, CONJURE_BASE_TICKS } from '../../engine/rules-necromancy';
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

/** one processed input on the "Pressed" strip – what the server made of a press, in order */
export interface HistoryEntry {
  id: number;
  key: string;
  name: string;
  icon: string | null;
  /** only things that really happened: ok = expected step on time · late = expected step late / early · wrong = a wrong ability that cast · auto = Revolution · other = prayer / weapon switch outside the rotation. Refused presses (adrenaline, cooldown, requirement) are not listed. */
  kind: 'ok' | 'late' | 'wrong' | 'auto' | 'other';
  /** rotation step it completed */
  step?: number;
  text: string;
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
  /** cap of a stacking buff (definition, raised by the loadout) */
  max: number | null;
}

interface ChannelView {
  key: string;
  name: string;
  icon: string | null;
  /** 0..1 by time */
  phase: number;
  hitsDone: number;
  hits: number;
  remainingS: number;
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

/** how long a press stays lit at least, so a 0 ms ping still shows the click */
const PRESS_FLASH_MS = 200;
const EMPTY_PRAYER_STATS: PrayerStats = { ticks: 0, soulSplitTicks: 0, attacks: 0, prayed: 0, hits: 0, absorbed: 0 };

@Component({
  selector: 'app-train',
  imports: [AbilityIcon, ActionBar, RouterLink, FormsModule, EntityTip, DecimalPipe, CdkDropListGroup, CdkDropList, CdkDrag, GearPanel],
  templateUrl: './train.html',
  styleUrls: ['./train.scss', './train-focus.scss'],
})
export class Train implements OnDestroy {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);
  private route = inject(ActivatedRoute);
  private doc = inject(DOCUMENT);
  /** route data `focus: true` (/focus): the compact popout branch of the template – same session logic, no panels */
  readonly focus = signal(this.route.snapshot.data['focus'] === true);
  private toast = inject(ToastService);
  readonly coach = inject(CoachService);
  /** "Load a demo" on the empty state: the first PvME preset with default keys */
  readonly presets = inject(PresetsService);

  readonly TICK_MS = TICK_MS;
  readonly GCD_MS = TICK_MS * GCD_TICKS;
  readonly REVOLUTION_MIN_SLOTS = REVOLUTION_MIN_SLOTS;
  readonly REVOLUTION_MAX_SLOTS = REVOLUTION_MAX_SLOTS;
  /** Settings.uiMode: 'advanced' shows every panel and option; 'simple' (default) only the core – the simulation is the same */
  readonly advanced = computed(() => this.storage.settings().uiMode === 'advanced');
  /** Revolution combat mode is selected (docs/research/revolution.md) */
  readonly revolution = computed(() => this.storage.settings().combatMode === 'revolution');
  /** slots of the main bar inside the yellow Revolution box (0 = full manual) */
  readonly revolutionSlots = computed(() => (this.revolution() ? this.storage.settings().revolution.slots : 0));
  readonly STYLES4 = STYLES4;
  readonly ENEMY_PRESETS = ENEMY_PRESETS;
  readonly TARGET_TYPES = TARGET_TYPES;
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
  readonly unknownSteps = computed(() => (this.data.loadoutReady() ? this.stepEntities().filter((e) => !e).length : 0));

  /** the active loadout resolved for the weapons in hand at the start */
  readonly resolved = computed(() => resolveLoadout(this.storage.loadout(), this.loadoutData()));
  readonly loadoutData = computed(() => ({
    weaponById: this.data.weaponById(),
    specById: this.data.specById(),
    perkById: this.data.perkById(),
    setEffectById: this.data.setEffectById(),
    gearById: this.data.gearById(),
    familiarById: this.data.familiarById(),
    specEntity: (s: WeaponSpec) => this.data.specEntity(s),
  }));
  // ---------------------------------------------------------------- pre-build

  readonly prebuildOpen = signal(false);
  readonly prebuild = computed<Prebuild>(() => {
    const id = this.selectedId();
    return (id && this.storage.prebuilds()[id]) || emptyPrebuild();
  });
  readonly prebuildEmpty = computed(() => prebuildIsEmpty(this.prebuild()));
  /** the pre-build plus the Bone Shield chosen in the controls (unless the pre-build already holds one) */
  readonly effectivePrebuild = computed<Prebuild>(() => {
    const pb = this.prebuild();
    const choice = this.storage.settings().boneShield;
    const hasOne = pb.abilities.some((id) => id === 'lesser-bone-shield' || id === 'greater-bone-shield');
    if (choice === 'none' || hasOne) return pb;
    return { ...pb, abilities: [...pb.abilities, BONE_SHIELD_ABILITY[choice]] };
  });
  /** combat styles the rotation uses */
  readonly rotationStyles = computed(() => new Set(this.stepEntities().map((e) => e?.ability?.style).filter((s): s is NonNullable<typeof s> => !!s)));
  /** stacks worth pre-building for this rotation: the style resources with their cap under the active loadout */
  readonly prebuildStacks = computed<{ id: StackId; name: string; max: number }[]>(() => {
    const caps = this.resolved().stackCaps;
    return this.styleStacks().map((id) => ({ id, name: stackName(id), max: stackMax(id, caps) }));
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
    const on = !cur.includes(id);
    const patch: Partial<Prebuild> = { [list]: on ? [...cur, id] : cur.filter((x) => x !== id) };
    if (!on && list !== 'prayers') {
      const remaining = { ...(this.prebuild().remaining ?? {}) };
      delete remaining[(list === 'spirits' ? 'spirit:' : 'ability:') + id];
      patch.remaining = remaining;
    }
    this.setPrebuild(patch);
  }

  /** full lifetime (ticks) of a pre-built conjure or ability buff with the active loadout */
  prebuildFullTicks(key: string): number {
    if (key.startsWith('spirit:')) return Math.round((CONJURE_BASE_TICKS + this.resolved().conjureDurationAdd) * this.resolved().conjureDurationMult);
    const id = key.slice('ability:'.length);
    const rule = ruleFor(id);
    for (const eff of rule?.onCast ?? []) {
      if (eff.kind === 'buff') {
        const d = eff.durationTicks ?? BUFF_BY_ID.get(eff.id)?.durationTicks;
        if (d) return d;
      }
    }
    const e = this.data.get('ability:' + id);
    const data = e ? this.data.toEngineEntity(e) : undefined;
    return data?.buffs.find((b) => b.durationTicks)?.durationTicks ?? data?.durationTicks ?? 0;
  }

  /** seconds left at the start, as shown in the pre-build form */
  prebuildLeftS(key: string): number {
    const full = this.prebuildFullTicks(key);
    const ticks = this.prebuild().remaining?.[key] ?? (key.startsWith('spirit:') ? Math.max(1, full - COMMAND_READY_AFTER) : full);
    return Math.round(ticks * TICK_MS) / 1000;
  }

  setPrebuildLeft(key: string, v: unknown): void {
    const full = this.prebuildFullTicks(key);
    const ticks = Math.max(1, Math.min(full || 1, Math.round((Number(v) || 0) * 1000 / TICK_MS)));
    this.setPrebuild({ remaining: { ...(this.prebuild().remaining ?? {}), [key]: ticks } });
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
    for (const [id, n] of Object.entries(p.stacks)) if (n > 0) parts.push(n + ' ' + stackName(id as StackId));
    const left = (key: string) => (p.remaining?.[key] !== undefined ? ' (' + this.prebuildLeftS(key) + ' s left)' : '');
    for (const s of p.spirits) parts.push((this.SPIRITS.find((x) => x.id === s)?.name ?? s) + left('spirit:' + s));
    for (const a of p.abilities) parts.push(this.data.name('ability:' + a) + left('ability:' + a));
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
    if (!this.data.loadoutReady()) return [];
    // the probe starts with the chosen Bone Shield up, like a real session does
    const pb = this.effectivePrebuild();
    const probeCatalog = new Map<string, EngineEntity>();
    for (const id of pb.abilities) {
      const ent = this.data.get('ability:' + id);
      if (ent) probeCatalog.set(ent.key, this.data.toEngineEntity(ent));
    }
    const probe = new TrainerEngine([], probeCatalog, { ...this.storage.settings(), loadout: this.resolved(), prebuild: pb });
    probe.start(0);
    const out = new Set<string>();
    const inv = this.storage.loadout().inventory;
    for (const e of this.stepEntities()) {
      if (e?.special?.kind === 'scroll' && this.storage.loadout().familiar !== e.special.familiar) out.add(e.name + ': needs the ' + (this.data.familiarById().get(e.special.familiar ?? '')?.name ?? e.special.familiar) + ' familiar (Loadout page)');
      else if (e?.special && !inv.some((r) => r?.kind === 'special' && r.id === e.id)) out.add(e.name + ': not in your backpack');
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
  /** potions / bombs the rotation presses that are not in the backpack – one click puts them there */
  readonly missingSpecials = computed<Entity[]>(() => {
    if (!this.data.loadoutReady()) return [];
    const inv = this.storage.loadout().inventory;
    const seen = new Set<string>();
    return this.stepEntities().filter((e): e is Entity => !!e?.special && !inv.some((r) => r?.kind === 'special' && r.id === e.id) && !seen.has(e.id) && !!seen.add(e.id));
  });

  /** put a missing potion / bomb into the first free backpack slot of the active loadout */
  addToBackpack(e: Entity): void {
    const free = this.storage.loadout().inventory.findIndex((r) => !r);
    this.dropIntoInventory(free >= 0 ? free : 0, e);
  }

  /** phone-sized screen: every bar shows as 2 × 7 on its own line */
  readonly narrow = signal(typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches);

  readonly canStart = computed(() => !!this.rotation() && this.stepEntities().length > 0 && this.unreachable().length === 0 && this.unknownSteps() === 0);
  /** resources shown for this rotation (STYLE_STACKS of its styles); Storm Shards sit on the target, so they cannot be pre-built */
  readonly styleStacks = computed<StackId[]>(() => {
    const out: StackId[] = [];
    for (const st of this.rotationStyles()) for (const id of STYLE_STACKS[st] ?? []) if (!out.includes(id) && id !== 'storm-shards') out.push(id);
    return out;
  });

  // live state
  readonly running = signal(false);
  readonly finished = signal(false);
  /** why the last session ended – drives the big end-of-rotation overlay */
  readonly finishReason = signal<'finished' | 'stopped' | null>(null);
  readonly finishDismissed = signal(false);
  /** every processed input of the session in order (compare with the rotation strip above) */
  readonly history = signal<HistoryEntry[]>([]);
  private historyId = 0;
  private readonly historyStrip = viewChild<ElementRef<HTMLElement>>('historyStrip');
  /** keep the newest entry in view: scroll the strip to its end after every render that added one */
  private readonly historyScroll = afterRenderEffect(() => {
    this.history();
    const el = this.historyStrip()?.nativeElement;
    if (el) el.scrollLeft = el.scrollWidth;
  });
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
  /** entity key → remaining internal cooldown ms */
  readonly cooldowns = signal<Record<string, { remainingMs: number; totalMs: number }>>({});
  readonly channelling = signal<string | null>(null);
  /** the running channelled ability for the progress bar */
  readonly channel = signal<ChannelView | null>(null);
  /** the rotation contains a channelled ability → the channel bar is shown while training */
  readonly rotationHasChannel = computed(() => this.stepEntities().some((e) => !!e?.ability && !!ruleFor(e.ability.id)?.channel));
  readonly iconState = signal<IconState>('idle');
  readonly feedback = signal<Feedback | null>(null);
  /** a channel was cut by the cast reported next – appended to that cast's feedback line */
  private cancelNote: string | null = null;
  readonly counts = signal({ perfect: 0, late: 0, early: 0, wrong: 0, missed: 0, auto: 0 });
  readonly results = signal<StepResult[]>([]);
  readonly expectedKey = signal<string | null>(null);
  readonly queuedKey = signal<string | null>(null);
  readonly flashKey = signal<{ key: string; kind: 'fired' | 'wrong' } | null>(null);
  /** slots pressed but not yet processed by the server – lit up at once, like the game's click feedback */
  readonly pressedKeys = signal<ReadonlySet<string>>(new Set());
  /** key → time until which the press stays visible even when the server has already taken it (0 ping) */
  private pressedUntil = new Map<string, number>();
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
  /** player hits that missed, and the hit chance (0..1) of the wielded style against the enemy's stats right now (null = not simulated) */
  readonly misses = signal(0);
  readonly hitChance = signal<number | null>(null);
  /** floating hit numbers, newest last */
  readonly hitsplats = signal<{ id: number; amount: number; crit: boolean; dot: boolean; miss: boolean; name: string }[]>([]);
  private hitId = 0;
  readonly attackLog = signal<{ style: Style4; prayed: boolean; tick: number; absorbed?: string }[]>([]);
  /** Soul Split ticks + prayed attacks, out of all ticks */
  readonly prayerScore = computed(() => {
    const s = this.prayerStats();
    const good = s.soulSplitTicks + s.prayed + (s.absorbed ?? 0);
    return { score: good, max: s.ticks, pct: s.ticks ? Math.round((good / s.ticks) * 100) : 0 };
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
    const pressed = this.pressedKeys();
    const layout = this.layout();
    const morphs = this.morphs();
    const activeKeys = new Set(this.activePrayers().map((p) => p.key));
    const dynamicIcon = (e: Entity): string | null => this.eofIcon(e);
    return layout.order.map((pos) => {
      const id = shown[pos] ?? null;
      const preset = id === null ? null : s.presets.find((p) => p.id === id) ?? null;
      const slots: SlotView[] = (preset?.slots ?? Array(14).fill(null)).map((step, i) => {
        const entity = step ? this.data.step(step) ?? null : null;
        const m = running && entity ? morphs.get(entity.key) : undefined;
        const icon = entity && !m ? dynamicIcon(entity) : null;
        const morph = m ? { entity: m.entity, stage: m.stage } : icon && entity ? { entity: { ...entity, icon }, stage: 1 } : null;
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
          active: running && !!entity && activeKeys.has(entity.key),
          flash: running && shown && flash?.key === shown.key ? flash.kind : null,
          pressed: running && !!entity && (pressed.has(entity.key) || (!!shown && pressed.has(shown.key))),
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
    const slots = this.presetSlots(s, pos);
    if (!slots) return;
    mutate(slots);
    void this.storage.saveActionBars(s);
  }

  /** slots of the preset shown at `pos` in setup `s` (mutable); an empty position gets the first unused empty preset */
  private presetSlots(s: ActionBarSetup, pos: number): (RotationStep | null)[] | null {
    let id = visiblePresets(s, this.startStyle())[pos];
    if (id === null) {
      const free = s.presets.find((p) => !p.slots.some(Boolean) && !s.positions.includes(p.id));
      if (!free) return null;
      id = free.id;
      s.positions[pos] = id;
    }
    return s.presets.find((p) => p.id === id)?.slots ?? null;
  }

  /** a potion / weapon (missing list or bar slot) was dropped on backpack cell `index` of the active loadout */
  dropIntoInventory(index: number, data: unknown): void {
    if (this.running() || !data || typeof data !== 'object') return;
    const entity = ('entity' in data ? (data as { entity: Entity }).entity : data) as Entity;
    if (entity.kind !== 'special' && entity.kind !== 'weapon') {
      this.toast.show('Only potions and weapons go into the backpack; abilities and prayers belong on a bar.', 'warn');
      return;
    }
    const l = structuredClone(this.storage.loadout());
    const inv = [...l.inventory];
    while (inv.length < INVENTORY_SIZE) inv.push(null);
    const ref: ItemRef = { kind: entity.kind, id: entity.id };
    if (inv.some((r) => r?.kind === ref.kind && r.id === ref.id)) {
      this.toast.show(entity.name + ' is already in the backpack.');
      return;
    }
    if (inv[index]) {
      const free = inv.findIndex((r) => !r);
      if (free < 0) return this.toast.show('The backpack is full.', 'warn');
      inv[free] = inv[index];
    }
    inv[index] = ref;
    void this.storage.saveLoadout({ ...l, inventory: inv });
    this.toast.show(entity.name + ' put into the backpack of "' + l.name + '"');
  }

  /** a missing ability was dropped onto a slot of the bar at `pos` – or (`from`) the icon of another slot: the two swap */
  dropOnSlot(pos: number, slot: number, entity: Entity, from?: { pos: number; slot: number }): void {
    if (from) {
      if (this.running() || (from.pos === pos && from.slot === slot)) return;
      const s = structuredClone(this.storage.actionBars());
      const a = this.presetSlots(s, from.pos);
      const b = this.presetSlots(s, pos);
      if (!a || !b) return;
      [a[from.slot], b[slot]] = [b[slot], a[from.slot]];
      void this.storage.saveActionBars(s);
      return;
    }
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

  /** the spec stored in the Essence of Finality wears the EoF icon; every other spec keeps the generic special-attack icon */
  private eofIcon(e: Entity): string | null {
    if (e.kind !== 'spec') return null;
    const eof = this.resolved().eofSpec;
    return eof && eof.id === e.id ? EOF_ICON : null;
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
      const raw = steps[j];
      const eofIcon = this.eofIcon(raw);
      const entity = eofIcon ? { ...raw, icon: eofIcon } : raw;
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

  /** focus view: the current step and the next three (no previous one) */
  readonly focusSlots = computed(() => this.slots().filter((s) => s.kind !== 'prev').slice(0, 4));
  /** focus view: only bars that hold something */
  readonly focusBars = computed(() => this.bars().filter((b) => b.slots.some((s) => s.entity)));

  private engine: TrainerEngine | null = null;
  private raf = 0;
  private fallback = 0;
  private flashUntil = 0;
  private startedAt = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(max-width: 640px)');
      mq.addEventListener('change', (ev) => this.narrow.set(ev.matches));
    }
    // the gear and weapon catalogs (~1 MB each) come after the first paint; the resolved loadout, gear panel and
    // warnings recompute when they arrive
    afterNextRender(() => void this.data.ensure('gear', 'weapons', 'perks'));
    // inside the Alt1 Toolkit the popout is an app window: name it (every call is feature-checked)
    if (this.focus()) alt1Announce('RS3 Ability Trainer');
    effect(() => {
      const rotations = this.storage.rotations();
      const wanted = this.route.snapshot.queryParamMap.get('rotation');
      if (this.selectedId() && rotations.some((r) => r.id === this.selectedId())) return;
      const pick = rotations.find((r) => r.id === wanted) ?? rotations[0];
      this.selectedId.set(pick ? pick.id : null);
      if (pick && pick.id === wanted) void this.linkPreset(pick);
    });
  }

  /** Rotation dropdown: a rotation from a PvME preset brings its loadout and bar setup along. */
  pickRotation(id: string): void {
    this.selectedId.set(id);
    const r = this.storage.rotations().find((x) => x.id === id);
    if (r) void this.linkPreset(r);
  }

  pickLoadout(id: string): void {
    void this.storage.setActiveLoadout(id);
  }

  pickBars(id: string): void {
    void this.storage.switchBarProfile(id);
  }

  /**
   * "Popout": the focus view for the selected rotation in a small window next to the game – a Document
   * Picture-in-Picture window (Chromium, stays on top) or a plain popup (core/popout.ts).
   */
  async popout(): Promise<void> {
    const url = new URL(focusUrl(this.selectedId()), this.doc.baseURI).toString();
    const how = await openFocusWindow(url);
    if (how === 'pip') this.toast.show('Focus view opened in a picture-in-picture window – it stays on top. Click into it, then press your keys.');
    else if (how === 'popup') this.toast.show('Focus view opened in a popup window. Click into it, then press your keys.');
    else this.toast.show('The browser blocked the popup – allow popups for this site, or open /focus in a new window yourself.', 'warn');
  }

  private async linkPreset(r: Rotation): Promise<void> {
    if (!r.presetId) return;
    const loadout = this.storage.loadouts().find((l) => l.presetId === r.presetId);
    const bars = this.storage.barProfiles().find((p) => p.presetId === r.presetId);
    const switched: string[] = [];
    if (loadout && loadout.id !== this.storage.activeLoadoutId()) {
      await this.storage.setActiveLoadout(loadout.id);
      switched.push('loadout "' + loadout.name + '"');
    }
    if (bars && bars.id !== this.storage.activeBarProfileId()) {
      await this.storage.switchBarProfile(bars.id);
      switched.push('bars "' + bars.name + '"');
    }
    if (switched.length) this.toast.show('Switched to ' + switched.join(' and ') + ' for this preset.');
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

  /**
   * overlay of a queue slot, like on the bars: an ability on cooldown shows its cooldown sweep and seconds,
   * the current GCD ability otherwise shows the global cooldown, everything else is ready
   */
  queuePhase(slot: QueueSlot): number {
    if (!this.running() || slot.kind === 'prev') return 1;
    if (this.cdRemaining(slot) > 0) return this.cdPhase(slot);
    return slot.kind === 'current' && (slot.entity.kind === 'ability' || slot.entity.kind === 'spec') ? this.gcdPhase() : 1;
  }

  queueRemaining(slot: QueueSlot): number {
    if (!this.running() || slot.kind === 'prev') return 0;
    const cd = this.cdRemaining(slot);
    if (cd > 0) return cd;
    return slot.kind === 'current' && (slot.entity.kind === 'ability' || slot.entity.kind === 'spec') ? this.gcdRemaining() : 0;
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
    const familiar = this.storage.loadout().familiar ? this.data.familiarById().get(this.storage.loadout().familiar!) : undefined;
    if (familiar) add('special:' + familiar.scroll.id);
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
      // Revolution scans the main bar of the wielded style (position 0, first N slots)
      revolution: this.revolution() ? { ...this.storage.settings().revolution, bar: this.mainBarKeys(this.startStyle()), resolveBar: (st: Style | null) => this.mainBarKeys(st && isStyle4(st) ? st : this.startStyle()) } : undefined,
      // the engine only attacks when the enemy is enabled; its affinity / Defence / armour count for the hit chance either way
      enemy: { ...enemy, styles: [...enemy.styles] },
      targetLifePoints: enemy.lifePoints > 0 ? enemy.lifePoints : undefined,
      targetType: enemy.type ?? undefined,
      hitChanceDisabled: this.storage.settings().hitChance === 'off',
      hitChanceModel: this.storage.settings().hitChance === 'roll' ? 'roll' : 'scaled',
      prebuild: this.effectivePrebuild(),
    });
    this.damage.set(0);
    this.hits.set(0);
    this.dps.set(0);
    this.misses.set(0);
    this.hitChance.set(this.engine.hitChanceFor(this.resolved().style));
    this.targetHp.set(enemy.lifePoints);
    this.killedAtMs.set(null);
    this.hitsplats.set([]);
    // every prayer of the book is pressable even when it is on no bar (touch / click users get it via the bars only)
    for (const p of this.data.prayers()) add('prayer:' + p.id);
    for (const id of this.effectivePrebuild().abilities) add('ability:' + id);
    this.activePrayers.set([]);
    this.prayerStats.set({ ...EMPTY_PRAYER_STATS });
    this.incoming.set(null);
    this.attackLog.set([]);
    this.cooldowns.set({});
    this.channelling.set(null);
    this.channel.set(null);
    this.morphs.set(new Map());
    this.startedAt = Date.now();
    this.results.set([]);
    this.counts.set({ perfect: 0, late: 0, early: 0, wrong: 0, missed: 0, auto: 0 });
    this.doneSteps.set(new Set());
    this.buffs.set([]);
    this.cooldowns.set({});
    this.channelling.set(null);
    this.channel.set(null);
    this.maxAdrenaline.set(this.engine.maxAdrenaline);
    const first = this.slots().find((s) => s.kind === 'current');
    if (this.revolution()) this.feedback.set({ text: 'Revolution is on – the yellow slots of the main bar fire on their own; press what the rotation needs beyond that.', cls: 'info' });
    else this.feedback.set({ text: 'Press ' + first?.key + ' (' + first?.entity.name + ') to start.', cls: 'info' });
    this.finished.set(false);
    this.finishReason.set(null);
    this.finishDismissed.set(false);
    this.history.set([]);
    this.running.set(true);
    this.index.set(0);
    this.iconState.set('idle');
    this.flashKey.set(null);
    this.pressedUntil.clear();
    this.pressedKeys.set(new Set());
    this.engine.start(performance.now());
    this.syncWield(this.engine);
    this.adrenaline.set(this.engine.adrenaline);
    this.expectedKey.set(this.engine.currentStep?.key ?? null);
    this.coachStart();
    this.coachTick(this.engine, performance.now());
    this.raf = requestAnimationFrame(this.frame);
    this.fallback = window.setInterval(() => this.tick(performance.now()), 100);
  }

  /** slot keys of the main bar (position 0) for `style`, null = empty slot – what Revolution scans */
  private mainBarKeys(style: Style4): (string | null)[] {
    const s = this.storage.actionBars();
    const id = visiblePresets(s, style)[0];
    const preset = id === null ? null : s.presets.find((p) => p.id === id) ?? null;
    const slots = preset?.slots ?? Array<RotationStep | null>(BAR_SLOTS).fill(null);
    return slots.map((step) => (step && step.kind !== 'note' ? entityKey(step.kind, step.id) : null));
  }

  /** reset and start again from the first step (queue header, end-of-rotation overlay) */
  restart(): void {
    this.stop();
    this.start();
  }

  stop(): void {
    if (!this.running()) return;
    this.stopLoops();
    this.coach.disable();
    this.engine?.stop();
    this.running.set(false);
    this.finished.set(true);
    if (!this.finishReason()) this.finishReason.set('stopped');
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
      if (a.ref.kind === 'weapon') return this.press('weapon:' + a.ref.id);
      if (a.ref.kind === 'special') return this.press('special:' + a.ref.id);
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
    if (e.missCount !== this.misses()) this.misses.set(e.missCount);
    const hc = e.hitChanceFor(e.style);
    if (hc !== this.hitChance()) this.hitChance.set(hc);
    const elapsedS = (now - e.t0) / 1000;
    if (elapsedS >= 1) this.dps.set(e.damageDealt / elapsedS);
    this.syncWield(e);
    this.expectedKey.set(e.currentStep?.key ?? null);
    this.coachTick(e, now);
    this.queuedKey.set(e.queuedKey);
    const pressed = new Set(e.inflightKeys);
    for (const [key, until] of this.pressedUntil) {
      if (until > now) pressed.add(key);
      else this.pressedUntil.delete(key);
    }
    const wasPressed = this.pressedKeys();
    if (pressed.size !== wasPressed.size || [...pressed].some((k) => !wasPressed.has(k))) this.pressedKeys.set(pressed);
    this.buffs.set(e.buffs.map((b) => this.buffView(b, now)));
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
    const cp = e.channelProgress(now);
    this.channel.set(cp ? { ...cp, name: this.name(cp.key), icon: e.catalog.get(cp.key)?.icon ?? null, remainingS: cp.remainingMs / 1000 } : null);
    this.syncPrayers(e, now);
    if (now >= this.flashUntil) {
      this.iconState.set(e.isQueued ? 'queued' : 'idle');
      if (this.flashKey()) this.flashKey.set(null);
    }
    // usability of everything on the visible bars
    const tick = e.currentTick(now);
    const state = new Map<string, { usable: UsableReason; cooldownS: number; cooldownPhase: number }>();
    for (const key of e.catalog.keys()) {
      // a morphed slot (Conjure → Command while the spirit lives) shows the state of what it will fire
      const shown = e.morphOf(key, tick)?.key ?? key;
      const cd = e.cooldownLeft(shown, tick);
      // an ability on cooldown keeps its colour (the sweep + seconds show the cooldown); only missing
      // adrenaline / resources / gear grey it out, like in the game
      const usable = e.usable(shown, tick);
      const total = e.cooldownTotalTicks(shown);
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
      this.coach.disable();
      this.running.set(false);
      this.finished.set(true);
      if (!this.finishReason()) this.finishReason.set('finished');
      this.live.set(null);
      this.saveSession();
      return false;
    }
    return true;
  }

  // ---------------------------------------------------------------- coach: voice call-outs + metronome (core/coach.service.ts)

  /** "<group end>:<cast tick>" of the last announced group – a new group or a new cast (also a wrong one) re-announces */
  private calloutKey = '';
  private beepTick = 0;
  private beepPressTick: number | null = null;

  readonly coachOn = computed(() => {
    const c = this.storage.settings().coach;
    return c.callouts || c.lead || c.metronome;
  });

  setCoach<K extends keyof CoachSettings>(key: K, value: CoachSettings[K]): void {
    this.setSetting('coach', { ...this.storage.settings().coach, [key]: value });
  }

  /** runs inside the Start click: browsers only start audio from a user gesture */
  private coachStart(): void {
    this.calloutKey = '';
    this.beepTick = 0;
    this.beepPressTick = null;
    const cs = this.storage.settings().coach;
    if (!cs.callouts && !cs.lead && !cs.metronome) return;
    this.coach.configure(cs);
    void this.coach.enable().then((ok) => {
      if (!ok) this.toast.show('The browser blocked the sound – allow audio for this site and press Start again.', 'warn');
    });
  }

  /**
   * Schedules the voice and the metronome against the engine's clock (`tickTime`). The coach never advances the
   * queue: it says the key of every open step of the current group at the tick the engine expects it – the next GCD
   * ability at cast tick + GCD (or at the end of a channel the cast started, pressing earlier would cut it), off-GCD
   * steps on the ticks after the cast or at their PvME offset ("+", "2t"). When the player falls behind, nothing is
   * said until the actual cast: the voice waits for the engine's queue instead of running ahead of the player, so the
   * scoring (perfect / late / early per press) stays exactly what it is without the coach.
   */
  private coachTick(e: TrainerEngine, now: number): void {
    if (!this.coach.enabled()) return;
    const cs = this.storage.settings().coach;
    const tick = e.currentTick(now);
    const gcdEnd = e.gcdEndTick;
    const ch = e.channel;
    const channelEnd = ch && !ch.cancelled && ch.castTick === e.castTick ? ch.endTick : null;
    const pressTick = gcdEnd === null ? null : Math.max(gcdEnd, channelEnd ?? 0);
    if (cs.metronome) {
      while (this.beepTick <= tick + 2) this.coach.beep('tick', e.tickTime(this.beepTick++));
      if (pressTick !== null && pressTick !== this.beepPressTick) {
        this.beepPressTick = pressTick;
        this.coach.beep('press', e.tickTime(pressTick));
      }
    }
    if (!cs.callouts && !cs.lead) return;
    // the group: open steps from the queue index up to and including the next GCD ability (or to the end)
    let target = e.steps.length;
    for (let i = e.index; i < e.steps.length; i++) {
      if (e.isGcdStep(e.steps[i])) {
        target = i;
        break;
      }
    }
    const key = target + ':' + e.castTick;
    if (key === this.calloutKey) return;
    this.calloutKey = key;
    const group: { s: EngineEntity; gcd: boolean }[] = [];
    for (let i = e.index; i <= target && i < e.steps.length; i++) {
      const s = e.steps[i];
      if (!s.isNote && !e.isDone(i)) group.push({ s, gcd: i === target });
    }
    if (!group.length) return;
    const reach = this.reachable();
    const label = (s: EngineEntity): string => {
      const k = spokenLabel(reach.get(s.key) ?? '');
      return k && k !== 'click' ? k : 'click ' + s.name;
    };
    if (!cs.lead || e.castTick === null || pressTick === null) {
      // call-outs: the whole group right after the cast, ~1.8 s before the next press ("Q, then 3")
      this.coach.speak(spokenSequence(group.map((g) => label(g.s))), now);
      return;
    }
    // coach mode: every step at its own tick (minus the lead); steps that land on the same tick share one phrase
    const byTick = new Map<number, string[]>();
    let ref = e.castTick;
    for (const g of group) {
      let t: number;
      if (g.gcd) t = pressTick;
      else {
        t = g.s.offsetTicks !== undefined ? ref + g.s.offsetTicks : Math.min(ref + 1, pressTick - 1);
        ref = Math.max(ref, t);
      }
      t = Math.max(t, tick);
      byTick.set(t, [...(byTick.get(t) ?? []), label(g.s)]);
    }
    for (const [t, labels] of [...byTick].sort((a, b) => a[0] - b[0])) this.coach.speak(spokenSequence(labels), e.tickTime(t));
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

  /** display name of a rule buff (Disruption Shield, Barricade ...) */
  buffName(id: string): string {
    return BUFF_BY_ID.get(id)?.name ?? id;
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

  /** "Piercing Shot – late by 1 tick · Rapid Fire channel cancelled, 5 hits lost" */
  private appendCancelNote(): void {
    const note = this.cancelNote;
    if (!note) return;
    this.cancelNote = null;
    const f = this.feedback();
    if (f) this.feedback.set({ text: f.text + ' · ' + note, cls: f.cls === 'good' ? 'warn' : f.cls });
  }

  private buffView(b: ActiveBuff, now: number): BuffView {
    const remaining = b.endTick === null ? null : Math.max(0, (this.engine!.tickTime(b.endTick) - now) / 1000);
    let icon = b.icon;
    if (!icon) {
      const def = BUFF_BY_ID.get(b.id);
      icon = this.data.buffIcon(def?.wikiId) ?? this.engine!.catalog.get(b.sourceKey)?.icon ?? null;
    }
    const def = BUFF_BY_ID.get(b.id);
    const max = def?.stacks ? stackMax(b.id as StackId, this.resolved().stackCaps) : null;
    return { id: b.id, name: b.name, icon, kind: b.kind, remainingS: remaining, stacks: b.stacks, max: max === Infinity ? null : max };
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
        if (r.auto) {
          // Revolution completed the step on its own – counted like a press, but flagged as automatic
          this.counts.update((c) => (r.outcome === 'late' ? { ...c, late: c.late + 1 } : { ...c, perfect: c.perfect + 1 }));
          this.feedback.set({ text: 'Revolution: ' + r.name + (r.outcome === 'late' ? ' – late by ' + r.lateTicks + (r.lateTicks === 1 ? ' tick' : ' ticks') + ' (nothing was usable earlier)' : ' – automatic'), cls: r.outcome === 'late' ? 'warn' : 'good' });
        } else if (r.outcome === 'perfect') {
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
        this.appendCancelNote();
        this.log(r.key, r.auto ? 'auto' : r.outcome === 'perfect' || r.outcome === 'done' ? 'ok' : 'late', this.feedback()?.text ?? r.name, r.step);
        this.flash('fired', r.key, now, 200);
        break;
      }
      case 'auto':
        // Revolution's own cast: never a mistake; a matching step gets its 'fired' result right after this event
        this.counts.update((c) => ({ ...c, auto: c.auto + 1 }));
        if (!ev.matched) {
          this.feedback.set({ text: 'Revolution cast ' + this.name(ev.key) + (ev.expected ? ' – the rotation still waits for ' + this.name(ev.expected) : ''), cls: 'info' });
          this.appendCancelNote();
          this.log(ev.key, 'auto', this.feedback()?.text ?? '');
          this.flash('fired', ev.key, now, 200);
        }
        break;
      case 'wrong-fired':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: this.name(ev.key) + (this.data.get(ev.key)?.kind === 'ability' ? ' cast' : ' activated') + ' instead of ' + this.name(ev.expected) + ' – try again', cls: 'bad' });
        this.appendCancelNote();
        this.log(ev.key, 'wrong', this.feedback()?.text ?? '');
        this.flash('wrong', ev.key, now, 300);
        break;
      case 'too-early':
        // queueing off: players spam the key during the global cooldown – that is normal play, not a mistake
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
        this.log('weapon:' + ev.id, 'other', this.data.name('weapon:' + ev.id) + ' wielded');
        break;
      case 'prayer': {
        const name = this.data.name('prayer:' + ev.id);
        if (ev.on) {
          this.feedback.set({ text: name + ' on' + (ev.replaced.length ? ' – replaced ' + ev.replaced.map((r) => this.data.name('prayer:' + r)).join(', ') : ''), cls: 'info' });
        } else {
          this.feedback.set({ text: name + ' off', cls: 'info' });
        }
        this.log('prayer:' + ev.id, 'other', this.feedback()?.text ?? name);
        break;
      }
      case 'wrong-book':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: this.data.name('prayer:' + ev.id) + ' is a ' + (ev.book === 'Curses' ? 'curse' : 'standard prayer') + ' – your book is ' + (this.prayerBook() === 'Curses' ? 'Ancient Curses' : 'standard prayers') + ' (Loadout)', cls: 'bad' });
        this.flash('wrong', 'prayer:' + ev.id, now, 300);
        break;
      case 'attack': {
        this.attackLog.update((l) => [...l.slice(-19), { style: ev.style, prayed: ev.prayed, tick: ev.tick, absorbed: ev.absorbed }]);
        const needed = this.data.name('prayer:' + ev.needed);
        const veng = ev.reflected ? ' – Vengeance hit back' : '';
        if (ev.absorbed) {
          this.feedback.set({ text: ev.style + ' attack absorbed by ' + this.buffName(ev.absorbed), cls: 'good' });
        } else if (ev.prayed) {
          this.feedback.set({ text: ev.style + ' attack blocked by ' + needed + veng, cls: 'good' });
        } else {
          this.feedback.set({ text: 'Hit by a ' + ev.style + ' attack – ' + needed + ' was not active' + veng, cls: 'bad' });
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
      case 'recast':
        this.feedback.set({ text: this.name(ev.key) + ' released early', cls: 'good' });
        this.log(ev.key, 'ok', this.feedback()?.text ?? '');
        break;
      case 'channel-cancelled':
        this.cancelNote = this.name(ev.key) + ' channel cancelled, ' + ev.hitsLost + (ev.hitsLost === 1 ? ' hit' : ' hits') + ' lost';
        this.feedback.set({ text: this.cancelNote, cls: 'warn' });
        break;
      case 'hit': {
        const id = ++this.hitId;
        const name = ev.key.startsWith('spirit:') ? ev.key.slice(7).replace(/-/g, ' ') : ev.key.startsWith('familiar:') ? this.data.familiarById().get(ev.key.slice(9))?.name ?? ev.key.slice(9) : this.name(ev.key);
        this.hitsplats.update((l) => [...l.slice(-7), { id, amount: ev.amount, crit: ev.crit, dot: ev.dot, miss: !!ev.miss, name }]);
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

  /**
   * Append a processed input to the "Pressed" strip. A prayer / weapon step logs its toggle first and its step
   * result right after – the second entry upgrades the first instead of duplicating it.
   */
  private log(key: string, kind: HistoryEntry['kind'], text: string, step?: number): void {
    const ent = this.data.get(key);
    const entry: HistoryEntry = { id: ++this.historyId, key, name: ent?.name ?? this.name(key), icon: ent?.icon ?? null, kind, text, step };
    this.history.update((list) => {
      const last = list[list.length - 1];
      if (last && last.key === key && last.kind === 'other' && kind !== 'other') return [...list.slice(0, -1), { ...entry, id: last.id }];
      return [...list, entry];
    });
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
      damage: { total: this.damage(), hits: this.hits(), dps: Math.round(this.dps()), killedAtMs: this.killedAtMs(), misses: this.misses(), hitChance: this.hitChance() },
    });
  }

  // ------------------------------------------------------------------ enemy config

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    void this.storage.saveSettings({ ...this.storage.settings(), [key]: value });
  }

  /** simple ⇄ advanced view; the layout editor and the open sub-forms belong to the advanced view */
  setUiMode(advanced: boolean): void {
    if (!advanced) {
      this.editLayout.set(false);
      this.enemyOpen.set(false);
      this.prebuildOpen.set(false);
    }
    this.setSetting('uiMode', advanced ? 'advanced' : 'simple');
  }

  /** Revolution size / type toggles */
  setRevolution<K extends keyof RevolutionSettings>(key: K, value: RevolutionSettings[K]): void {
    this.setSetting('revolution', { ...this.storage.settings().revolution, [key]: value });
  }

  setEnemy<K extends keyof EnemyConfig>(key: K, value: EnemyConfig[K]): void {
    // the target type is orthogonal to the attack pattern: it keeps the preset
    const e = { ...this.enemy(), [key]: value, preset: key === 'enabled' || key === 'type' ? this.enemy().preset : null };
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

  /** affinity of the target against one attack style (0–100 %) */
  setAffinity(style: Style4, value: unknown): void {
    this.setEnemy('affinity', { ...this.enemy().affinity, [style]: this.numberOf(value, 0, 100) });
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

  /** send a press to the (simulated) server and light the slot up right away, like the game does on click */
  private press(key: string): void {
    const now = performance.now();
    this.engine?.press(key, now);
    this.pressedUntil.set(key, now + PRESS_FLASH_MS);
    this.pressedKeys.set(new Set([...this.pressedKeys(), key]));
  }

  /** click on a bar slot while training = press it (for touch / mouse users) */
  slotClick(pos: number, slot: number): void {
    if (!this.running()) return;
    const entity = this.bars()[pos]?.slots[slot]?.entity;
    if (entity) this.press(entity.key);
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
        this.press('weapon:' + id);
        return;
      }
    }
    for (const [id, ak] of Object.entries(setup.actionKeybinds ?? {})) {
      if (ak && keybindKey(ak) === k) {
        e.preventDefault();
        this.press('action:' + id);
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
          if (entity) this.press(entity.key);
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

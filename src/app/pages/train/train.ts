import { CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { DecimalPipe, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, OnDestroy, WritableSignal, afterNextRender, afterRenderEffect, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { placeOnBars } from '../../core/bar-place';
import { DataService, EOF_ICON, Entity, SPEC_KEY } from '../../core/data.service';
import { applyWield, equip, hasSpecial, moveItem, removeItem, removeWorn, unequip } from '../../core/equipment';
import { DEFAULT_LAYOUT_ID, keybindLayout } from '../../core/keybind-layouts';
import { keybindFromEvent, keybindFromMouse, keybindKey, keybindLabel, resolvePress } from '../../core/keybind.util';
import { ActionBarSetup, AttackPattern, Keybind, BAR_POSITIONS, BONE_SHIELD_ABILITY, INVENTORY_SIZE, NOTE_ACTION_TICKS, BAR_SLOTS, BarShape, barLayout, DEFAULT_ENEMY, ENEMY_PRESETS, EnemyConfig, TARGET_TYPES, EquipSlot, ItemRef, Loadout, PrayerStats, Prebuild, REVOLUTION_MAX_SLOTS, REVOLUTION_MIN_SLOTS, RevolutionSettings, Rotation, STYLES4, Settings, StepResult, Style, Style4, WeaponSpec, emptyPrebuild, entityKey, isStyle4, loadoutStyle, loadoutWield, parseEntityKey, prebuildIsEmpty, visiblePresets, RotationStep, CoachSettings, SessionStuck, setupTitle, Weapon, Equipment, inWarsRetreat, ACTIONS } from '../../core/models';
import { alt1Announce, focusUrl, openFocusWindow } from '../../core/popout';
import { CoachService, spokenLabel, spokenSequence } from '../../core/coach.service';
import { PresetsService } from '../../core/presets.service';
import { weaponsCanMeet } from '../../core/weapon-reach';
import { chainRotations, nextRotation, pickRotation as chooseRotation, setupRotations, worstStep } from '../../core/rotation-pick';
import { CRYSTAL_ACTION, TIME_WARP_ACTION } from '../../engine/trainer-engine';
import { noteEntity, stepToEngineEntity } from '../../core/step-entity';
import { StorageService } from '../../core/storage.service';
import { TraceRecorder } from '../../core/trace';
import { BUILD } from '../../version';
import { prebuildFor, rotationAssumptions } from '../../core/rotation-requires';
import { resolveLoadout } from '../../engine/loadout-resolver';
import { BUFF_BY_ID, ruleFor, stackMax, stackName } from '../../engine/rules';
import { STYLE_STACKS, StackId } from '../../engine/rules-model';
import { COMMAND_READY_AFTER, CONJURE_BASE_TICKS } from '../../engine/rules-necromancy';
import { ActiveBuff, BASIC_ATTACK_OF, EOF_KEY, EngineEntity, EngineEvent, TICK_MS, TrainerEngine, UsableReason, Wield } from '../../engine/trainer-engine';
import { SOUL_SPLIT } from '../../engine/prayer-rules';
import { slotAbilities } from '../../engine/morphs';
import { AbilityIcon, IconState } from '../../shared/ability-icon';
import { ActionBar, SlotView } from '../../shared/action-bar';
import { GearAction, GearPanel } from '../../shared/gear-panel';
import { DialogService, isTypingTarget } from '../../shared/dialog';
import { FeedbackService } from '../../core/feedback.service';
import { ToastService } from '../../shared/toast';
import { EntityTip } from '../../shared/tooltip';
import { filterEntries, groupEntries } from '../../shared/picker-groups';
import { CoolingEntry, CooldownView, catalogPass, cooldownViews, sameMorphs, sameUsable } from './live-state';
import { FrameLoop, browserFrameLoopDeps } from './frame-loop';

interface Feedback {
  text: string;
  cls: 'good' | 'bad' | 'warn' | 'info';
  /** muted small print after the text ("120 ms early") – advanced view only */
  detail?: string;
}

/** one processed input on the "Pressed" strip – what the server made of a press, in order */
export interface HistoryEntry {
  id: number;
  key: string;
  name: string;
  icon: string | null;
  /** only things that really happened: ok = expected step on time · late = expected step late / early · wrong = a wrong ability that cast · auto = Revolution or the automatic basic attack · other = prayer / weapon switch outside the rotation. Refused presses (adrenaline, cooldown, requirement) are not listed. */
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
  /** the note asks the player to do something: the queue stops here and shows a button */
  requiresAction?: boolean;
  /** how long that action takes, in ticks */
  actionTicks?: number;
  hint?: string;
  sameTick?: boolean;
  offsetTicks?: number;
  /**
   * overlay like on the bars: an ability on cooldown shows its cooldown sweep and seconds, the current GCD ability
   * otherwise the global cooldown, everything else is ready (phase 1, 0 ms)
   */
  gcdPhase: number;
  remainingMs: number;
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
/** phone-sized screen (train.scss uses the same breakpoint) */
const NARROW_QUERY = '(max-width: 640px)';
/** localStorage: the simple view's "Options" disclosure */
const OPTIONS_KEY = 'rs3trainer.train.options';
/** one-line hint under the stuck marker (finish overlay, session summary) */
const STUCK_HINT = "A game update may have changed the ability, or the trainer has a bug. Check the ability's cooldown in the tooltip and the rotation text";

/** the stuck marker's reason line: "Death Skulls is still on cooldown for 20 s" / "Conjure Skeleton Warrior: a skeleton warrior is already active" */
function stuckReason(name: string, ev: Extract<EngineEvent, { kind: 'stuck' }>): string {
  if (ev.reason === 'cooldown' && ev.readyInTicks !== undefined) return name + ' is still on cooldown for ' + (ev.readyInTicks * TICK_MS) / 1000 + ' s';
  if (ev.reason === 'weapon') return ev.text;
  // the engine text starts with the entity's key name; show the catalogue name instead
  const i = ev.text.indexOf(': ');
  return name + ': ' + (i >= 0 ? ev.text.slice(i + 2) : ev.text);
}
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
  /** while a dialog / the feedback form is open the session hotkeys stay quiet (see onKeydown) */
  private dialogs = inject(DialogService);
  private feedbackDialog = inject(FeedbackService);
  private hostEl = inject(ElementRef<HTMLElement>);
  /** touch device: "Popout" (a PiP / popup window nobody can type into) becomes a "Phone view" link to /focus in this tab */

  readonly TICK_MS = TICK_MS;
  readonly REVOLUTION_MIN_SLOTS = REVOLUTION_MIN_SLOTS;
  readonly REVOLUTION_MAX_SLOTS = REVOLUTION_MAX_SLOTS;
  /** Settings.uiMode: 'advanced' shows every panel and option; 'simple' (default) only the core – the simulation is the same */
  readonly advanced = computed(() => this.storage.settings().uiMode === 'advanced');
  /**
   * The enemy attacks only in the advanced view: the incoming attack, the prayer score and the target's life points
   * all live in panels the simple view leaves out, so a session there would be judged on a fight it cannot show.
   * The enemy configuration is kept – switching the view back brings it and its prayer training straight back.
   */
  readonly enemyOn = computed(() => this.enemy().enabled && this.advanced());
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
  /** "play on": the selected rotation and every one after it in the setup run as one session (core/rotation-pick chainRotations) */
  readonly chain = signal(readChain());
  /** the rotations a chained session plays: the selected one and the rest of the setup in order */
  readonly chainList = computed<Rotation[]>(() => {
    const list = this.setupRotationList();
    const i = list.findIndex((r) => r.id === this.selectedId());
    return i < 0 ? [] : list.slice(i);
  });
  /** what the session actually plays: the selected rotation, or the chain from it onwards */
  readonly played = computed<Rotation | null>(() => (this.chain() && this.chainList().length > 1 ? chainRotations(this.chainList()) : this.rotation()));
  /**
   * The setup picker: a setup is the boss and the gear, its rotations fill the second select. With every PvME boss
   * setup added the list holds over a hundred entries, so the select is grouped by boss and a search field narrows
   * it (shared/picker-groups.ts); the active setup always stays in the list.
   */
  readonly setupSearch = signal('');
  private readonly setupEntries = computed(() => this.storage.setups().map((s) => ({ id: s.id, name: setupTitle(s) })));
  readonly filteredSetups = computed(() => filterEntries(this.setupEntries(), this.setupSearch(), this.storage.activeSetupId()));
  readonly setupGroups = computed(() => groupEntries(this.filteredSetups()));
  /** "12 of 128" next to the search field, only while it filters something out */
  readonly setupCount = computed(() => {
    const all = this.setupEntries().length;
    const shown = this.filteredSetups().length;
    return shown === all ? '' : shown + ' of ' + all;
  });
  /** the rotations of the active setup, in guide order */
  readonly setupRotationList = computed(() => setupRotations(this.storage.rotations(), this.storage.activeSetupId()));
  /** "Ranged · 5 rotations" under the setup select */
  readonly setupCaption = computed(() => {
    const s = this.storage.setup();
    const n = this.setupRotationList().length;
    return [s.style, n + (n === 1 ? ' rotation' : ' rotations')].filter(Boolean).join(' · ');
  });
  /** "42 steps · Necromancy" under the rotation select */
  readonly rotationCaption = computed(() => {
    const r = this.played();
    if (!r) return '';
    const n = r.steps.filter((st) => st.kind !== 'note').length;
    // the combat styles only – Defence / Constitution abilities are not what a rotation is "about"
    const styles = [...this.rotationStyles()].filter((st) => isStyle4(st));
    const chained = this.chain() && this.chainList().length > 1 ? this.chainList().length + ' rotations in a row · ' : '';
    return chained + n + (n === 1 ? ' step' : ' steps') + (styles.length ? ' · ' + styles.join(' / ') : '');
  });
  /** the rotation after this one in its PvME preset – "Next: Phase 4" on the session end (a chained session has none, it played them) */
  readonly next = computed(() => (this.chain() && this.chainList().length > 1 ? null : nextRotation(this.storage.rotations(), this.rotation())));
  /** the next rotation's name without the boss prefix it shares with the current one */
  readonly nextLabel = computed(() => {
    const n = this.next();
    const cur = this.rotation();
    if (!n) return '';
    const sep = ' · ';
    const prefix = cur && cur.name.includes(sep) ? cur.name.slice(0, cur.name.indexOf(sep) + sep.length) : '';
    return prefix && n.name.startsWith(prefix) ? n.name.slice(prefix.length) : n.name;
  });
  /** simple view: the options row is folded behind "Options" – remembered per browser */
  readonly optionsOpen = signal(readOptionsOpen());
  /** rotation steps resolved to entities (null = unknown / removed from the game); notes become synthetic entities */
  readonly stepEntities = computed<(Entity | null)[]>(
    () => this.played()?.steps.map((s, i) => (s.kind === 'note' ? noteEntity(s, i) : this.data.step(s) ?? null)) ?? [],
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
  /** steps no weapon of the active loadout, worn or carried, can perform (no 2h anywhere, no shield, no spec weapon ...) */
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
    // a switch in the backpack makes a step playable: only what no carried weapon can meet is worth a warning
    const carried = this.data.carriedWeapons(this.storage.loadout()).map((w) => w.weapon).filter((w): w is Weapon => !!w);
    for (const e of this.stepEntities()) {
      if (e?.special?.kind === 'scroll' && this.storage.loadout().familiar !== e.special.familiar) out.add(e.name + ': needs the ' + (this.data.familiarById().get(e.special.familiar ?? '')?.name ?? e.special.familiar) + ' familiar (Loadout page)');
      else if (e?.special && !hasSpecial(inv, e.id)) out.add(e.name + ': not in your backpack');
      if (!e?.ability) continue;
      const rule = ruleFor(e.ability.id);
      for (const r of rule?.requires ?? []) {
        if (r.equipment) {
          const fail = probe.requirementFailure(this.data.toEngineEntity(e), 0);
          if (fail && fail === r.text && !weaponsCanMeet(r.equipment, carried)) out.add(e.name + ': ' + r.text);
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
    // a switch to the weapon already in hand needs no key: the engine completes that step on its own
    const eq = this.storage.loadout().equipment;
    for (const ref of [eq.mainHand, eq.offHand, eq.twoHand]) if (ref?.kind === 'weapon' && !m.has('weapon:' + ref.id)) m.set('weapon:' + ref.id, 'wielded');
    for (const [id, kb] of Object.entries(s.actionKeybinds ?? {})) {
      if (kb) m.set('action:' + id, keybindLabel(kb));
    }
    // every client action has a chip to click below the bars, key or not (Time Warp is Kerapac's button, nobody binds it)
    for (const a of ACTIONS) if (!m.has('action:' + a.id)) m.set('action:' + a.id, 'click');
    // potions and weapons in the backpack can be clicked there
    for (const r of this.storage.loadout().inventory) {
      if (r?.kind === 'special' && !m.has('special:' + r.id)) m.set('special:' + r.id, 'click');
      if (r?.kind === 'weapon' && !m.has('weapon:' + r.id)) m.set('weapon:' + r.id, 'click');
    }
    // ┌─ TWO SPECIAL-ATTACK SLOTS, TWO KEYS – DO NOT COLLAPSE THIS INTO "every spec = the Weapon Special Attack key" ─┐
    // A rotation step "spec:<id>" is fired from one of two bar slots, and the queue must show the key of the RIGHT one:
    //   · the wielded weapon's own special → the "Weapon Special Attack" slot (SPEC_KEY)
    //   · a special stored in an Essence of Finality the loadout wears or carries → the "Essence of Finality" slot (EOF_KEY)
    // Showing the Weapon Special Attack key for an EoF special ("click 4" for Split Soul while Split Soul sits in the
    // amulet on slot 5) sends the player to the wrong slot – that was bug #1 of the EoF report of 8 Sep 2026. The icon
    // side of the same rule lives in `eofIcon` / the morph build in syncTick (bug #2). Change one, check the other.
    const specKey = m.get(SPEC_KEY);
    const eofKey = m.get(EOF_KEY);
    const r = this.resolved();
    const weaponSpec = r.weaponSpec?.id ?? null;
    const stored = new Set([...r.eofSpecs.map((x) => x.id), ...(r.eofSpec ? [r.eofSpec.id] : [])]);
    for (const sp of this.data.specs()) {
      const key = 'spec:' + sp.id;
      if (m.has(key)) continue;
      if (sp.id === weaponSpec && specKey) m.set(key, specKey);
      else if (stored.has(sp.id) && eofKey) m.set(key, eofKey);
      else if (specKey) m.set(key, specKey); // any other special: the generic slot fires it once its weapon is wielded
    }
    return m;
  });
  readonly unreachable = computed(() => {
    const seen = new Set<string>();
    const r = this.reachable();
    return this.stepEntities().filter((e): e is Entity => !!e && !e.key.startsWith('note:') && !r.has(e.key) && !seen.has(e.key) && !!seen.add(e.key));
  });
  /** the first ability of the rotation needs more adrenaline than the session starts with (a rotation that opens with an ultimate at 0%) */
  /**
   * What the rotation asks for but never does itself: "command skeleton warrior" with no conjure in front of it,
   * Volley of Souls without the souls. PvME writes fight rotations that way because the conjures and stacks are
   * built before the pull – so this is not a mistake in the rotation, it is its pre-build, and one click writes it.
   */
  readonly assumptions = computed(() => {
    const r = this.played();
    if (!r || !this.data.loaded()) return [];
    return rotationAssumptions(r.steps, this.effectivePrebuild()).map((a) => ({
      ...a,
      name: this.data.get('ability:' + a.id)?.name ?? a.id,
      fromName: a.from ? this.data.get('ability:' + a.from)?.name ?? null : null,
    }));
  });
  /** the assumptions the pre-build can hold (a spirit, a stack count) – the bar-chain ones have to be cast */
  readonly assumptionsFixable = computed(() => this.assumptions().some((a) => !!a.fix));

  /** writes every assumption the pre-build can hold into it: the conjures out, the stacks at the count the rotation needs */
  applyAssumptions(): void {
    const caps = this.resolved().stackCaps;
    this.setPrebuild(prebuildFor(this.prebuild(), this.assumptions(), (id) => stackMax(id as StackId, caps)));
    this.prebuildOpen.set(true);
  }

  readonly adrenalineShort = computed<{ name: string; need: number; have: number } | null>(() => {
    if (!this.data.loaded() || !this.data.loadoutReady()) return null;
    const first = this.stepEntities().find((e) => e && (e.kind === 'ability' || e.kind === 'spec'));
    if (!first) return null;
    const settings = this.storage.settings();
    const have = settings.fullAdrenaline ? 100 : (this.prebuild().adrenaline ?? this.storage.loadout().startAdrenaline ?? 0);
    const probe = new TrainerEngine([], new Map(), { ...settings, loadout: this.resolved(), prebuild: this.effectivePrebuild() });
    probe.start(0);
    const need = probe.costOf(this.data.toEngineEntity(first)).need;
    return need > have ? { name: first.name, need, have } : null;
  });

  /** potions / bombs the rotation presses that are not in the backpack – one click puts them there */
  readonly missingSpecials = computed<Entity[]>(() => {
    if (!this.data.loadoutReady()) return [];
    const inv = this.storage.loadout().inventory;
    const seen = new Set<string>();
    return this.stepEntities().filter((e): e is Entity => !!e?.special && !hasSpecial(inv, e.id) && !seen.has(e.id) && !!seen.add(e.id));
  });

  /** put a missing potion / bomb into the first free backpack slot of the active loadout */
  addToBackpack(e: Entity): void {
    const free = this.storage.loadout().inventory.findIndex((r) => !r);
    this.dropIntoInventory(free >= 0 ? free : 0, e);
  }

  /** "Auto-place on my bars": the missing steps go onto free slots of the style's bars, keys from the default layout where a slot has none (core/bar-place.ts) */
  autoPlace(): void {
    if (this.running()) return;
    const layout = keybindLayout(DEFAULT_LAYOUT_ID);
    const r = placeOnBars(this.storage.actionBars(), this.startStyle(), this.unreachable().map((e) => e.key), layout);
    if (!r.placed.length) {
      this.toast.show('No free slot on your bars. Clear one below, or use the Action bars page.', 'warn');
      return;
    }
    void this.storage.saveActionBars(r.setup);
    this.toast.show(
      'Placed ' + r.placed.length + (r.placed.length === 1 ? ' step' : ' steps') + ' on your bars' +
        (r.filled ? ', ' + r.filled + (r.filled === 1 ? ' key' : ' keys') + ' from the "' + layout.name + '" layout' : '') +
        (r.left.length ? ', ' + r.left.length + ' did not fit' : ''),
    );
  }

  /** phone-sized screen: every bar shows as 2 × 7 on its own line */
  readonly narrow = signal(mediaMatches(NARROW_QUERY));
  /** touch device: the instructions say "tap the slot" instead of "press the key" */
  readonly coarsePointer = signal(mediaMatches('(pointer: coarse)'));
  private destroyRef = inject(DestroyRef);

  readonly canStart = computed(() => !!this.played() && this.stepEntities().length > 0 && this.unreachable().length === 0 && this.unknownSteps() === 0);
  /** the feedback line before Start */
  readonly idleText = computed(() => (this.canStart() ? (this.coarsePointer() ? 'Press Start, then tap the glowing slot.' : 'Press Start, then press the keys of the glowing slots.') : ''));
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
  readonly finishReason = signal<'finished' | 'stopped' | 'stuck' | null>(null);
  /** the session ended stuck: the expected step could not be cast (engine 'stuck' event) – shown in the finish overlay and the summary */
  readonly stuck = signal<SessionStuck | null>(null);
  /** the stuck panel's hint line (finish overlay and session summary) */
  readonly stuckHint = STUCK_HINT;
  /** the "waiting for the last hits" line was shown for this session */
  private settleNoted = false;
  readonly finishDismissed = signal(false);
  /** every processed input of the session in order (compare with the rotation strip above) */
  readonly history = signal<HistoryEntry[]>([]);
  private historyId = 0;
  private readonly historyStrip = viewChild<ElementRef<HTMLElement>>('historyStrip');
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
  readonly startStyle = computed<Style4>(() => loadoutStyle(this.storage.loadout(), this.data.weaponById()));
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
  /** `auto` = Revolution casts, `autoAttacks` = basic attacks that fired on their own because the press came after the GCD end */
  readonly counts = signal({ perfect: 0, late: 0, early: 0, wrong: 0, missed: 0, auto: 0, autoAttacks: 0 });
  readonly results = signal<StepResult[]>([]);
  /** session summary: only the steps that were off, unless "show all" */
  readonly showAllResults = signal(false);
  readonly summaryRows = computed(() => (this.showAllResults() ? this.results() : this.results().filter((r) => r.outcome !== 'perfect' && r.outcome !== 'done')));
  /** the step furthest off the tick – one line on the session end */
  readonly worst = computed(() => worstStep(this.results()));
  /** "press when the GCD bar empties" and "queueing is off" are said once per session, not per press */
  private lateHintShown = false;
  private tooEarlyShown = false;
  readonly expectedKey = signal<string | null>(null);
  readonly queuedKey = signal<string | null>(null);
  readonly flashKey = signal<{ key: string; kind: 'fired' | 'wrong' } | null>(null);
  /** slots pressed but not yet processed by the server – lit up at once, like the game's click feedback */
  readonly pressedKeys = signal<ReadonlySet<string>>(new Set());
  /** key → time until which the press stays visible even when the server has already taken it (0 ping) */
  private pressedUntil = new Map<string, number>();
  /** per catalog entity: usability of what the slot fires – refreshed on every server tick / engine event, set only when it changed */
  readonly slotUsable = signal<ReadonlyMap<string, UsableReason>>(new Map());
  /** per catalog entity on cooldown: seconds + sweep – refreshed every frame while something is on cooldown (arithmetic only) */
  readonly slotCooldowns = signal<ReadonlyMap<string, CooldownView>>(new Map());
  /** the cooldown ends behind `slotCooldowns`, from the last catalog pass */
  private cooling: ReadonlyMap<string, CoolingEntry> = new Map();
  /** slot key → what it shows right now (Command X, Slaughter, Spectral Scythe 2) */
  readonly morphs = signal<Map<string, { entity: Entity; stage: number }>>(new Map());
  /** the morphs of the last catalog pass (keys only) – `morphs` is rebuilt when they differ */
  private morphKeys: ReadonlyMap<string, { key: string; stage: number }> = new Map();
  /** the last server tick the catalog-wide state was computed for (-1 = compute on the next frame) */
  private lastTick = -1;
  /** buff views of the last tick with their end ticks: the timers move every frame, the lookups happen once per tick */
  private liveBuffs: { view: BuffView; endTick: number | null }[] = [];
  /** queue slot entities on cooldown (from the last tick): the seconds are derived per frame */
  private queueCooling: { key: string; endTick: number; totalMs: number }[] = [];
  /** floating hit numbers fade after a moment – the timers are cleared when the session stops */
  private hitsplatTimers = new Set<number>();
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
    const usableOf = this.slotUsable();
    const cooldownOf = this.slotCooldowns();
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
        const cd = shown && running ? cooldownOf.get(shown.key) : undefined;
        const isGcdAbility = !!shown?.ability?.triggersGcd;
        return {
          entity,
          morph,
          keyLabel: keybindLabel(s.slotKeybinds[pos]?.[i]),
          usable: running && entity && shown ? usableOf.get(shown.key) ?? 'ok' : null,
          // same rule as the queue: a cooldown that ends inside the running GCD is not what keeps the slot dark, so the
          // GCD sweep shows from the start instead of the cooldown finishing and the GCD popping in for its last tick
          cooldownS: running && isGcdAbility && gcdMs > (cd?.cooldownS ?? 0) * 1000 ? 0 : cd?.cooldownS ?? 0,
          cooldownPhase: cd?.cooldownPhase ?? 1,
          gcdPhase: running && isGcdAbility ? gcd : 1,
          gcdRemainingMs: running && isGcdAbility ? gcdMs : 0,
          expected: running && !!shown && shown.key === expected,
          queued: running && !!shown && shown.key === queued,
          active: running && !!entity && activeKeys.has(entity.key),
          flash: running && shown && flash?.key === shown.key ? flash.kind : null,
          pressed: running && !!entity && (pressed.has(entity.key) || (!!shown && pressed.has(shown.key))),
        };
      });
      return { position: pos, presetName: preset?.name ?? 'empty', slots, shape: layout.shape[pos] };
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

  /**
   * The spec stored in an Essence of Finality wears the EoF icon; every other spec keeps the generic special-attack
   * icon. A loadout carries one amulet per stored special (the preset import builds them that way), so every one of
   * them counts – not just the one on the neck, or the specs of the carried amulets look like any other spec.
   */
  private eofIcon(e: Entity): string | null {
    if (e.kind !== 'spec') return null;
    const r = this.resolved();
    return r.eofSpecs.some((s) => s.id === e.id) || r.eofSpec?.id === e.id ? EOF_ICON : null;
  }

  readonly slots = computed<QueueSlot[]>(() => {
    const entities = this.stepEntities();
    if (!entities.length || entities.some((e) => !e)) return [];
    const steps = entities as Entity[];
    const loop = this.storage.settings().loop;
    const running = this.running();
    const i = running ? this.index() : 0;
    const reach = this.reachable();
    const done = this.doneSteps();
    const cooldowns = this.cooldowns();
    const gcdPhase = this.gcdPhase();
    const gcdMs = this.gcdRemaining();
    const slot = (idx: number, kind: QueueSlot['kind']): QueueSlot | null => {
      let j = idx;
      if (loop) j = ((idx % steps.length) + steps.length) % steps.length;
      if (j < 0 || j >= steps.length) return null;
      const raw = steps[j];
      const eofIcon = this.eofIcon(raw);
      const entity = eofIcon ? { ...raw, icon: eofIcon } : raw;
      const rs = this.played()?.steps[j];
      // overlay: the ability's own cooldown, or for the current GCD ability the global cooldown – whichever ends LATER,
      // because that is when the ability can actually be pressed. Piercing Shot → EoF spec → Piercing Shot: the first
      // Piercing's 5-tick cooldown ends one tick before the GCD of the EoF cast; showing the cooldown until it ran out
      // and then the GCD for its last tick made the icon light up and darken again (Martin, 8 Sep 2026).
      const cd = running && kind !== 'prev' ? cooldowns[entity.key] : undefined;
      const onGcd = running && kind === 'current' && (entity.kind === 'ability' || entity.kind === 'spec');
      const own = cd && cd.remainingMs > 0 ? { phase: cd.totalMs > 0 ? 1 - cd.remainingMs / cd.totalMs : 1, ms: cd.remainingMs } : null;
      const global = onGcd && gcdMs > 0 ? { phase: gcdPhase, ms: gcdMs } : null;
      const gcd = own && global ? (own.ms >= global.ms ? own : global) : own ?? global ?? { phase: 1, ms: 0 };
      return {
        entity,
        key: reach.get(entity.key) ?? '',
        stepIndex: j,
        kind,
        done: running && done.has(j) && kind !== 'prev',
        note: rs?.kind === 'note' ? rs.note ?? '' : undefined,
        phase: rs?.phase,
        requiresAction: rs?.kind === 'note' && rs.requiresAction ? true : undefined,
        actionTicks: rs?.kind === 'note' && rs.requiresAction ? rs.actionTicks ?? NOTE_ACTION_TICKS : undefined,
        hint: rs?.hint,
        sameTick: rs?.sameTick,
        offsetTicks: rs?.offsetTicks,
        gcdPhase: gcd.phase,
        remainingMs: gcd.ms,
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
  /** animation-frame loop with the stall watchdog: the session keeps running behind another window (frame-loop.ts) */
  private readonly loop = new FrameLoop((now) => this.tick(now), browserFrameLoopDeps(this.doc));
  private flashUntil = 0;
  private startedAt = 0;
  /** the record of this session (core/trace.ts), from Start to the end */
  private trace: TraceRecorder | null = null;

  /** the URL's `?rotation=<id>` was applied to the selection (once per id – later list changes keep what the player picked) */
  private appliedWanted: string | null = null;

  constructor() {
    this.watchMedia(NARROW_QUERY, this.narrow);
    this.watchMedia('(pointer: coarse)', this.coarsePointer);
    // keep the newest "Pressed" entry in view: scroll the strip to its end after every render that added one
    afterRenderEffect(() => {
      this.history();
      const el = this.historyStrip()?.nativeElement;
      if (el) el.scrollLeft = el.scrollWidth;
    });
    // the gear and weapon catalogs (~1 MB each) come after the first paint; the resolved loadout, gear panel and
    // warnings recompute when they arrive
    afterNextRender(() => void this.data.ensure('gear', 'weapons', 'perks'));
    // inside the Alt1 Toolkit the popout is an app window: name it (every call is feature-checked)
    if (this.focus()) alt1Announce('RS3 Ability Trainer');
    // the rotation the URL asks for ("Load a demo" and the Presets page save first and navigate after, so the
    // query param must be reactive, not a snapshot)
    const query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
    // the session-end overlay takes the focus (its Restart button, or Close when Restart is disabled) so keyboard
    // users are not left pressing keys into nothing; the focus goes back to the page when it closes
    afterRenderEffect(() => {
      if (!this.finishReason() || this.finishDismissed()) return;
      const card = this.hostEl.nativeElement as HTMLElement;
      const btn = card.querySelector('.finish-card button:not(:disabled)') as HTMLButtonElement | null;
      if (btn && !btn.contains(document.activeElement)) btn.focus();
    });
    // which rotation is selected: the one the URL asks for (its setup becomes the active one), else one of the
    // active setup's – the current one when it belongs to it, otherwise its first
    effect(() => {
      const all = this.storage.rotations();
      const active = this.storage.activeSetupId();
      const wanted = query().get('rotation');
      const fresh = wanted && wanted !== this.appliedWanted ? wanted : null;
      const freshRotation = fresh ? all.find((r) => r.id === fresh) : undefined;
      if (freshRotation) {
        this.appliedWanted = fresh;
        if (freshRotation.id !== untracked(this.selectedId)) this.selectedId.set(freshRotation.id);
        void this.linkPreset(freshRotation);
        return;
      }
      const pick = chooseRotation(setupRotations(all, active), null, untracked(this.selectedId));
      if ((pick?.id ?? null) !== untracked(this.selectedId)) this.selectedId.set(pick?.id ?? null);
    });
  }

  private watchMedia(query: string, target: WritableSignal<boolean>): void {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(query);
    const on = (ev: MediaQueryListEvent) => target.set(ev.matches);
    mq.addEventListener('change', on);
    this.destroyRef.onDestroy(() => mq.removeEventListener('change', on));
  }

  /** "Options" in the simple view */
  toggleOptions(): void {
    const open = !this.optionsOpen();
    this.optionsOpen.set(open);
    try {
      localStorage.setItem(OPTIONS_KEY, open ? '1' : '0');
    } catch {
      /* storage blocked – this visit only */
    }
  }

  /** Rotation dropdown: a rotation brings its setup (gear) along. */
  setChain(on: boolean): void {
    this.chain.set(on);
    try {
      localStorage.setItem(CHAIN_KEY, on ? '1' : '0');
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }

  pickRotation(id: string): void {
    this.selectedId.set(id);
    const r = this.storage.rotations().find((x) => x.id === id);
    if (r) void this.linkPreset(r);
  }

  /** Setup dropdown: the setup's gear becomes active and its first rotation is selected (the effect above) */
  pickSetup(id: string): void {
    void this.storage.setActiveSetup(id);
  }

  /** "Next: Phase 4" on the session end: switch to the sibling rotation and start it */
  playNext(id: string): void {
    this.finishDismissed.set(true);
    this.pickRotation(id);
    if (this.canStart() && this.data.loadoutReady()) this.start();
  }

  /**
   * "Next from here": a boss is a chain of phases and the next one starts where this one stopped, so the state this
   * session ends in – adrenaline, stacks, the conjures still out, the buffs and prayers – becomes the next rotation's
   * pre-build. It is saved like any pre-build, so the panel above shows it and it can be edited or cleared.
   */
  async playNextFromHere(id: string): Promise<void> {
    const pb = this.engine?.snapshotPrebuild();
    if (pb) {
      await this.storage.savePrebuild(id, pb);
      this.toast.show('The next rotation starts from this state', 'info', 3000);
    }
    this.playNext(id);
  }

  /**
   * "Popout": the focus view for the selected rotation in a small window next to the game – a Document
   * Picture-in-Picture window (Chromium, stays on top) or a plain popup (core/popout.ts).
   */
  async popout(): Promise<void> {
    const url = new URL(focusUrl(this.selectedId()), this.doc.baseURI).toString();
    const how = await openFocusWindow(url);
    if (how === 'pip') this.toast.show('Focus view opened in a picture-in-picture window. It stays on top: click into it, then press your keys.');
    else if (how === 'popup') this.toast.show('Focus view opened in a popup window. Click into it, then press your keys.');
    else this.toast.show('The browser blocked the popup. Allow popups for this site, or open /focus in a new window yourself.', 'warn');
  }

  /** a rotation belongs to a setup: picking it makes that setup – its gear – the active one */
  private async linkPreset(r: Rotation): Promise<void> {
    if (await this.storage.activateSetupOf(r)) this.toast.show('Switched to the setup "' + setupTitle(this.storage.setup()) + '".');
  }

  ngOnDestroy(): void {
    this.stop();
    this.clearHitsplats();
  }

  name(key: string): string {
    if (key.startsWith('spec:')) return this.data.specById().get(key.slice(5))?.name ?? key;
    return this.data.name(key);
  }

  /** carried weapons of the active loadout: a click on one switches to it */
  readonly carriedWeapons = computed(() => this.data.carriedWeapons(this.gearState()).map((e) => ({ entity: e })));

  /** client actions with a key (target cycle …) as tappable chips next to the weapon switches – a rotation step like "(tc)" has no bar slot to tap otherwise */
  readonly actionChips = computed(() => {
    const keys = this.storage.actionBars().actionKeybinds ?? {};
    const ids = new Set<string>(Object.entries(keys).filter(([, kb]) => !!kb).map(([id]) => id));
    // the actions the rotation asks for are there to click even without a key (Time Warp, target cycle on a phone)
    for (const e of this.stepEntities()) if (e?.kind === 'action' && e.id !== CRYSTAL_ACTION) ids.add(e.id);
    return [...ids]
      .map((id) => ({ entity: this.data.get('action:' + id), key: keybindLabel(keys[id] ?? null) }))
      .filter((c): c is { entity: Entity; key: string } => !!c.entity);
  });

  /**
   * The adrenaline crystal stands in War's Retreat only: the button shows for a rotation played there (the player's
   * toggle on the Rotations page, else the name), in a chained session for the segment the current step is in.
   */
  readonly crystalHere = computed(() => {
    const r = this.played();
    if (!r) return false;
    if (!r.segments) return inWarsRetreat(r);
    const i = this.running() ? this.index() : 0;
    let here = r.segments[0].warsRetreat;
    for (const seg of r.segments) if (seg.from <= i) here = seg.warsRetreat;
    return here;
  });

  /** the adrenaline crystal button: one channel of 1.8 s (engine useCrystal) */
  useCrystal(): void {
    if (this.running()) this.press('action:' + CRYSTAL_ACTION, 'crystal button');
  }

  /** tap on an action chip while training = press it (touch / mouse) */
  /** "Enter the instance": the button of an action note – the rotation goes on when it is pressed */
  pressNote(stepIndex: number): void {
    if (this.running()) this.press('note:' + stepIndex, 'note button');
  }

  clickAction(id: string): void {
    if (this.running()) this.press('action:' + id);
  }

  /** overlay of a queue slot (computed in `slots`, see QueueSlot.gcdPhase) */
  queuePhase(slot: QueueSlot): number {
    return slot.gcdPhase;
  }

  queueRemaining(slot: QueueSlot): number {
    return slot.remainingMs;
  }

  start(): void {
    const rot = this.played();
    if (!rot || !this.canStart()) return;
    const setup = this.storage.actionBars();
    const rotSteps = rot.steps;
    const steps = (this.stepEntities() as Entity[]).map((e, i) => stepToEngineEntity(rotSteps[i], e, (x) => this.data.toEngineEntity(x)));
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
    add('action:' + CRYSTAL_ACTION); // the crystal button, whatever the keys
    for (const w of this.data.carriedWeapons(this.storage.loadout())) add(w.key);
    for (const r of this.storage.loadout().inventory) if (r?.kind === 'special') add('special:' + r.id);
    const familiarId = this.storage.loadout().familiar;
    const familiar = familiarId ? this.data.familiarById().get(familiarId) : undefined;
    if (familiar) add('special:' + familiar.scroll.id);
    // the four basic attacks are always known: the wielded style's one fires on its own when nothing is pressed
    for (const id of Object.values(BASIC_ATTACK_OF)) add('ability:' + id);
    // every prayer of the book is pressable even when it is on no bar (touch / click users get it via the bars only)
    for (const p of this.data.prayers()) add('prayer:' + p.id);
    for (const id of this.effectivePrebuild().abilities) add('ability:' + id);
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
      enemy: { ...enemy, enabled: this.enemyOn(), styles: [...enemy.styles] },
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
    this.activePrayers.set([]);
    this.prayerStats.set({ ...EMPTY_PRAYER_STATS });
    this.incoming.set(null);
    this.attackLog.set([]);
    this.cooldowns.set({});
    this.channelling.set(null);
    this.channel.set(null);
    this.morphs.set(new Map());
    this.morphKeys = new Map();
    this.slotUsable.set(new Map());
    this.slotCooldowns.set(new Map());
    this.cooling = new Map();
    this.liveBuffs = [];
    this.queueCooling = [];
    this.cooldownsShown = false;
    this.lastTick = -1;
    this.startedAt = Date.now();
    this.results.set([]);
    this.counts.set({ perfect: 0, late: 0, early: 0, wrong: 0, missed: 0, auto: 0, autoAttacks: 0 });
    this.doneSteps.set(new Set());
    this.buffs.set([]);
    this.showAllResults.set(false);
    this.lateHintShown = false;
    this.tooEarlyShown = false;
    this.maxAdrenaline.set(this.engine.maxAdrenaline);
    const first = this.slots().find((s) => s.kind === 'current');
    if (this.revolution()) this.feedback.set({ text: 'Revolution is on: the yellow slots of the main bar fire on their own, so press what the rotation needs beyond that.', cls: 'info' });
    else this.feedback.set({ text: (this.coarsePointer() ? 'Tap ' : 'Press ') + first?.key + ' (' + first?.entity.name + ') to start.', cls: 'info' });
    this.finished.set(false);
    this.finishReason.set(null);
    this.stuck.set(null);
    this.settleNoted = false;
    this.finishDismissed.set(false);
    this.history.set([]);
    this.running.set(true);
    this.index.set(0);
    this.iconState.set('idle');
    this.flashKey.set(null);
    this.pressedUntil.clear();
    this.pressedKeys.set(new Set());
    this.engine.start(performance.now());
    const setupNow = this.storage.setup();
    this.trace = new TraceRecorder(
      {
        build: BUILD,
        startedAt: Date.now(),
        setup: { boss: setupNow.boss, name: setupNow.name, style: setupNow.style },
        rotation: { id: rot.id, name: rot.name, chained: this.chain() && this.chainList().length > 1 },
        steps: rot.steps,
        settings: { ...this.storage.settings() },
        loadout: l,
        bars: setup,
        prebuild: this.effectivePrebuild(),
        enemy: this.enemyOn() ? { ...this.enemy() } : null,
      },
      performance.now(),
    );
    this.syncWield(this.engine);
    this.adrenaline.set(this.engine.adrenaline);
    this.expectedKey.set(this.engine.currentStep?.key ?? null);
    this.coachStart();
    this.coachTick(this.engine, performance.now());
    this.loop.start();
    // a tab that goes hidden fires this event, so the fallback starts at once instead of after the watchdog's delay;
    // an occluded window fires nothing and stays "visible" – that case is the watchdog's (see frame-loop.ts)
    this.doc.addEventListener('visibilitychange', this.onVisibility);
  }

  private readonly onVisibility = (): void => this.loop.syncVisibility();

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
    this.clearHitsplats();
    this.running.set(false);
    this.finished.set(true);
    if (!this.finishReason()) this.finishReason.set('stopped');
    this.gcdPhase.set(1);
    this.gcdRemaining.set(0);
    this.endTrace();
    this.live.set(null);
    this.saveSession();
  }

  /** closes the session trace with the live backpack and keeps it (this browser, and the account when signed in) */
  private endTrace(): void {
    const t = this.trace;
    if (!t) return;
    this.trace = null;
    const live = this.live();
    const done = t.end(this.finishReason() ?? 'stopped', performance.now(), live ? { equipment: live.equipment, inventory: live.inventory } : null);
    void this.storage.addTrace(done);
  }

  /** a gear change while training goes into the trace with the backpack after it */
  private traceGear(action: string, item: string, inventory: Loadout['inventory']): void {
    const e = this.engine;
    if (!e || !this.trace) return;
    const now = performance.now();
    const tick = e.currentTick(now);
    this.trace.gear(action, item, now, tick, inventory, e.debugState(tick));
  }

  /**
   * The gear panel. Idle: the backpack and the worn gear are managed here like on the Gear page (drag between
   * backpack and body, click to wear or take off, drag out to drop) and saved to the loadout. Training: a click
   * wields / drinks / wears / takes off for this session only.
   */
  onGear(a: GearAction): void {
    if (!this.running()) return this.editGear(a);
    if (a.kind !== 'click') return;
    const e = this.engine;
    const l = this.live();
    if (!e || !l) return;
    const name = this.data.view(a.ref)?.name ?? a.ref.id;
    if (a.from.kind === 'inv') {
      if (a.ref.kind === 'weapon') return this.press('weapon:' + a.ref.id);
      if (a.ref.kind === 'special') return this.press('special:' + a.ref.id);
      const r = equip(l, a.ref, this.slotOf, a.from.index);
      if (r.error) return this.toast.show(r.error, 'warn');
      this.live.set({ ...l, ...r.state });
      e.refreshLoadout();
      this.traceGear('wear', name, r.state.inventory);
      this.feedback.set({ text: name + ' worn', cls: 'info' });
    } else if (a.from.kind === 'equip') {
      const r = unequip(l, a.from.slot, this.slotOf);
      if (r.error) return this.toast.show(r.error, 'warn');
      const next = { ...l, ...r.state };
      this.live.set(next);
      if (a.ref.kind === 'weapon') e.setWield(loadoutWield(next));
      else e.refreshLoadout();
      this.traceGear('take off', name, next.inventory);
      this.feedback.set({ text: name + ' taken off', cls: 'info' });
    }
    // the gear changed outside the engine's tick: the usability of the bars is recomputed on the next frame
    this.lastTick = -1;
  }

  /** idle: the panel's drags and clicks change the saved loadout (core/equipment.ts, same rules as the Gear page) */
  private editGear(a: GearAction): void {
    const l = this.storage.loadout();
    const state = { equipment: l.equipment, inventory: l.inventory };
    let r: { state: { equipment: Equipment; inventory: (ItemRef | null)[] }; error?: string } | null = null;
    switch (a.kind) {
      case 'drop-equip':
        if (a.drag.from.kind === 'inv') r = equip(state, a.drag.ref, this.slotOf, a.drag.from.index, a.slot);
        break;
      case 'drop-inv':
        if (a.drag.from.kind === 'inv') r = moveItem(state, a.drag.from.index, a.index);
        else if (a.drag.from.kind === 'equip') r = unequip(state, a.drag.from.slot, this.slotOf, a.index);
        break;
      case 'drop-out':
        if (a.drag.from.kind === 'inv') r = removeItem(state, a.drag.from.index);
        else if (a.drag.from.kind === 'equip') r = removeWorn(state, a.drag.from.slot);
        break;
      case 'click':
        if (a.from.kind === 'inv' && this.slotOf(a.ref)) r = equip(state, a.ref, this.slotOf, a.from.index);
        else if (a.from.kind === 'equip') r = unequip(state, a.from.slot, this.slotOf);
        break;
      default:
        return;
    }
    if (!r) return;
    if (r.error) return this.toast.show(r.error, 'warn');
    void this.storage.saveLoadout({ ...l, equipment: r.state.equipment, inventory: r.state.inventory });
  }

  /** backpack potions grey out like bar slots when they cannot be drunk right now – reads `slotUsable` where it is called, so the panel input stays the same function */
  private readonly gearUsableFn = (ref: ItemRef): boolean => ref.kind !== 'special' || (this.slotUsable().get('special:' + ref.id) ?? 'ok') === 'ok';
  readonly gearUsable = computed<((ref: ItemRef) => boolean) | null>(() => (this.running() ? this.gearUsableFn : null));

  /**
   * The item the current step needs, marked in the gear panel. A PvME setup carries several Essence of Finality
   * amulets, each with its own stored special, and they all look alike – so when the rotation asks for one of those
   * specials, its amulet lights up. A weapon-switch step lights up the weapon the same way.
   */
  readonly wantedItem = computed<((ref: ItemRef) => boolean) | null>(() => {
    if (!this.running()) return null;
    const key = this.expectedKey();
    if (!key) return null;
    const { kind, id } = parseEntityKey(key);
    if (kind === 'weapon') return (ref) => ref.kind === 'weapon' && ref.id === id;
    if (kind !== 'spec') return null;
    // the special of the wielded weapon needs no amulet – only a stored one points at an item
    if (this.resolved().weaponSpec?.id === id) return null;
    return (ref) => ref.kind === 'gear' && ref.spec === id;
  });

  private stopLoops(): void {
    this.loop.stop();
    this.doc.removeEventListener('visibilitychange', this.onVisibility);
  }

  private clearHitsplats(): void {
    for (const t of this.hitsplatTimers) window.clearTimeout(t);
    this.hitsplatTimers.clear();
    if (this.hitsplats().length) this.hitsplats.set([]);
  }

  /**
   * One animation frame. The engine changes only on server ticks (an input is processed on the first tick at or after
   * its arrival) and reports everything else as events, so the catalog-wide work – usability and morph of every slot,
   * buff lookups, prayers, cooldown ends – runs in `onTick` when the tick changed or an event arrived (≤ 1.67×/s), and
   * only what moves continuously (tick / GCD phase, cooldown seconds, buff timers, the incoming attack, DPS) is
   * derived per frame from arithmetic in `onFrame`.
   */
  private tick(now: number): boolean {
    const e = this.engine;
    if (!e || !this.running()) return false;
    e.update(now);
    const hadEvents = e.events.length > 0;
    for (const ev of e.events) this.applyEvent(e, ev, now);
    e.events.length = 0;
    const tick = e.currentTick(now);
    if (tick !== this.lastTick || hadEvents) {
      this.lastTick = tick;
      this.onTick(e, tick, now);
    }
    this.onFrame(e, tick, now);
    const fb = this.feedback();
    if (fb && this.trace) this.trace.feedback(fb.text, fb.cls, now, tick);
    if (e.state !== 'running') {
      this.stopLoops();
      this.coach.disable();
      this.running.set(false);
      this.finished.set(true);
      if (!this.finishReason()) this.finishReason.set('finished');
      this.endTrace();
      this.live.set(null);
      this.saveSession();
      return false;
    }
    return true;
  }

  /** everything that only changes on a server tick or with an engine event */
  private onTick(e: TrainerEngine, tick: number, now: number): void {
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
    this.syncWield(e);
    this.expectedKey.set(e.currentStep?.key ?? null);
    this.queuedKey.set(e.queuedKey);
    this.coachTick(e, now);
    // buffs: definition, icon and cap once per tick; the timers move per frame
    this.liveBuffs = e.buffs.map((b) => ({ view: this.buffView(e, b, now), endTick: b.endTick }));
    this.buffs.set(this.liveBuffs.map((b) => b.view));
    this.channelling.set(e.channel && !e.channel.cancelled ? e.channel.key : null);
    this.syncPrayers(e);
    // cooldown ends of the queue slots (the seconds are derived per frame)
    this.queueCooling = [];
    for (const s of this.slots()) {
      const left = e.cooldownLeft(s.entity.key, tick);
      if (left <= 0) continue;
      const ent = e.catalog.get(s.entity.key);
      const total = ((ent ? (e.specFor(ent) ?? ent).cooldownTicks : 0) || 1) * TICK_MS;
      this.queueCooling.push({ key: s.entity.key, endTick: tick + left, totalMs: total });
    }
    // usability, morph and cooldown end of everything on the visible bars – one pass over the catalog
    const pass = catalogPass(e, tick);
    this.cooling = pass.cooling;
    if (!sameUsable(pass.usable, this.slotUsable())) this.slotUsable.set(pass.usable);
    if (!sameMorphs(pass.morphs, this.morphKeys)) {
      this.morphKeys = pass.morphs;
      const morphs = new Map<string, { entity: Entity; stage: number }>();
      for (const [key, m] of pass.morphs) {
        const ent = this.data.get(m.key);
        if (!ent) continue;
        // ┌─ THE ESSENCE OF FINALITY SLOT KEEPS ITS OWN ICON WHILE A SESSION RUNS – DO NOT DROP THIS ─┐
        // Every spec entity carries the generic "Weapon Special Attack" icon (data.service SPEC_ICON). While a session
        // runs, both special slots morph into the spec they fire, so without this the EoF slot turns into a second
        // Weapon Special Attack icon the moment Start is pressed – bug #2 of the EoF report of 8 Sep 2026. The idle
        // bars get the same icon through `eofIcon`; the key side of the rule is in `reachable`. Change one, check the others.
        const entity = key === EOF_KEY && ent.kind === 'spec' ? { ...ent, icon: EOF_ICON } : ent;
        morphs.set(key, { entity, stage: m.stage });
      }
      this.morphs.set(morphs);
    }
  }

  /** what moves continuously between ticks – arithmetic on the last tick's state, no catalog work */
  private onFrame(e: TrainerEngine, tick: number, now: number): void {
    this.tickPhase.set(e.tickPhase(now));
    this.gcdPhase.set(e.gcdPhase(now));
    this.gcdRemaining.set(e.gcdRemainingMs(now));
    const elapsedS = (now - e.t0) / 1000;
    if (elapsedS >= 1) this.dps.set(e.damageDealt / elapsedS);
    const pressed = new Set(e.inflightKeys);
    for (const [key, until] of this.pressedUntil) {
      if (until > now) pressed.add(key);
      else this.pressedUntil.delete(key);
    }
    const wasPressed = this.pressedKeys();
    if (pressed.size !== wasPressed.size || [...pressed].some((k) => !wasPressed.has(k))) this.pressedKeys.set(pressed);
    if (this.liveBuffs.some((b) => b.endTick !== null)) {
      this.buffs.set(this.liveBuffs.map((b) => (b.endTick === null ? b.view : { ...b.view, remainingS: Math.max(0, (e.tickTime(b.endTick) - now) / 1000) })));
    }
    if (this.queueCooling.length || this.cooldownsShown) {
      const cds: Record<string, { remainingMs: number; totalMs: number }> = {};
      for (const q of this.queueCooling) {
        const remainingMs = e.tickTime(q.endTick) - now;
        if (remainingMs > 0) cds[q.key] = { remainingMs, totalMs: Math.max(q.totalMs, remainingMs) };
      }
      this.cooldowns.set(cds);
      this.cooldownsShown = Object.keys(cds).length > 0;
    }
    if (e.settling && !this.settleNoted) {
      this.settleNoted = true;
      this.feedback.set({ text: 'All inputs done, waiting for the last hits to land (Esc ends now)', cls: 'info' });
    }
    const cp = e.channelProgress(now);
    this.channel.set(cp ? { ...cp, name: this.name(cp.key), icon: e.catalog.get(cp.key)?.icon ?? null, remainingS: cp.remainingMs / 1000 } : null);
    this.syncIncoming(e, tick, now);
    if (now >= this.flashUntil) {
      this.iconState.set(e.isQueued ? 'queued' : 'idle');
      if (this.flashKey()) this.flashKey.set(null);
    }
    if (this.cooling.size || this.slotCooldowns().size) this.slotCooldowns.set(cooldownViews(e, this.cooling, now));
  }

  /** `cooldowns` holds something – it is cleared once when the last cooldown ends */
  private cooldownsShown = false;

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
      if (!ok) this.toast.show('The browser blocked the sound. Allow audio for this site and press Start again.', 'warn');
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

  private syncPrayers(e: TrainerEngine): void {
    const ids = [...e.activePrayers];
    const current = this.activePrayers();
    if (ids.length !== current.length || ids.some((id, i) => current[i]?.id !== id)) {
      this.activePrayers.set(ids.map((id) => this.data.get('prayer:' + id)).filter((x): x is Entity => !!x));
    }
    this.prayerStats.set({ ...e.prayerStats });
  }

  /** the incoming attack's progress bar (per frame) */
  private syncIncoming(e: TrainerEngine, tick: number, now: number): void {
    const a = e.nextAttack;
    if (!a) {
      if (this.incoming()) this.incoming.set(null);
      return;
    }
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

  private buffView(e: TrainerEngine, b: ActiveBuff, now: number): BuffView {
    const remaining = b.endTick === null ? null : Math.max(0, (e.tickTime(b.endTick) - now) / 1000);
    let icon = b.icon;
    if (!icon) {
      const def = BUFF_BY_ID.get(b.id);
      icon = this.data.buffIcon(def?.wikiId) ?? e.catalog.get(b.sourceKey)?.icon ?? null;
    }
    const def = BUFF_BY_ID.get(b.id);
    const max = def?.stacks ? stackMax(b.id as StackId, this.resolved().stackCaps) : null;
    return { id: b.id, name: b.name, icon, kind: b.kind, remainingS: remaining, stacks: b.stacks, max: max === Infinity ? null : max };
  }

  private applyEvent(e: TrainerEngine, ev: EngineEvent, now: number): void {
    if (this.trace) {
      const tick = e.currentTick(now);
      this.trace.event(ev as EngineEvent & Record<string, unknown>, now, tick, () => e.debugState(tick));
    }
    const queueing = this.storage.settings().abilityQueueing;
    switch (ev.kind) {
      case 'unqueued':
        this.feedback.set({ text: this.name(ev.key) + ' taken out of the queue', cls: 'info' });
        break;
      case 'queued': {
        const inMs = Math.max(0, Math.round(e.tickTime(ev.fireTick) - now));
        if (ev.key === ev.expected) {
          this.feedback.set({ text: 'Queued, casts in ' + inMs + ' ms', cls: 'info' });
        } else {
          this.feedback.set({ text: 'Wrong ability queued: ' + this.name(ev.key) + ', expected ' + this.name(ev.expected), cls: 'bad' });
          this.flash('wrong', ev.key, now, inMs + 200);
        }
        break;
      }
      case 'fired': {
        const r = ev.result;
        this.results.update((list) => [...list, r]);
        this.doneSteps.update((s) => new Set(s).add(r.step));
        if (r.auto) {
          // Revolution (or the automatic basic attack) completed the step on its own – counted like a press, but flagged as automatic
          this.counts.update((c) => (r.outcome === 'late' ? { ...c, late: c.late + 1 } : { ...c, perfect: c.perfect + 1 }));
          const who = r.autoAttack ? 'Auto-attack: ' : 'Revolution: ';
          this.feedback.set({ text: who + r.name + (r.outcome === 'late' ? ', late by ' + r.lateTicks + (r.lateTicks === 1 ? ' tick' : ' ticks') + ' (nothing was usable earlier)' : ', automatic'), cls: r.outcome === 'late' ? 'warn' : 'good' });
        } else if (r.outcome === 'perfect') {
          this.counts.update((c) => ({ ...c, perfect: c.perfect + 1 }));
          this.feedback.set({ text: r.name + ', on tick', detail: this.advanced() && r.offsetMs ? r.offsetMs + ' ms early' : undefined, cls: 'good' });
        } else if (r.outcome === 'late') {
          this.counts.update((c) => ({ ...c, late: c.late + 1 }));
          const hint = this.lateHintShown ? '' : '. Press when the GCD bar empties';
          this.lateHintShown = true;
          this.feedback.set({ text: r.name + ', ' + this.offText(r) + hint, detail: this.advanced() && r.offsetMs ? '+' + r.offsetMs + ' ms' : undefined, cls: 'warn' });
        } else if (r.outcome === 'early') {
          this.counts.update((c) => ({ ...c, late: c.late + 1 }));
          this.feedback.set({ text: r.name + ', ' + -r.lateTicks + (r.lateTicks === -1 ? ' tick' : ' ticks') + ' early', cls: 'warn' });
        } else {
          this.feedback.set({ text: r.name + (r.kind === 'weapon' ? ' wielded' : ' activated'), cls: 'good' });
        }
        this.appendCancelNote();
        this.log(r.key, r.auto ? 'auto' : r.outcome === 'perfect' || r.outcome === 'done' ? 'ok' : 'late', this.feedback()?.text ?? r.name, r.step);
        this.flash('fired', r.key, now, 200);
        break;
      }
      case 'auto-attack':
        // the basic attack fired on its own because the press came after the GCD end: not a wrong press, but the
        // late cast now waits for the basic attack's GCD (a matching "(auto)" step gets its 'fired' result right after)
        this.counts.update((c) => ({ ...c, autoAttacks: c.autoAttacks + 1 }));
        if (!ev.matched) {
          this.feedback.set({ text: 'Auto-attack slipped in. You were late, so the next cast waits for its GCD', cls: 'warn' });
          this.appendCancelNote();
          this.log(ev.key, 'auto', this.feedback()?.text ?? '');
          this.flash('fired', ev.key, now, 200);
        }
        break;
      case 'auto':
        // Revolution's own cast: never a mistake; a matching step gets its 'fired' result right after this event
        this.counts.update((c) => ({ ...c, auto: c.auto + 1 }));
        if (!ev.matched) {
          this.feedback.set({ text: 'Revolution cast ' + this.name(ev.key) + (ev.expected ? ', the rotation still waits for ' + this.name(ev.expected) : ''), cls: 'info' });
          this.appendCancelNote();
          this.log(ev.key, 'auto', this.feedback()?.text ?? '');
          this.flash('fired', ev.key, now, 200);
        }
        break;
      case 'wrong-fired':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: this.name(ev.key) + (this.data.get(ev.key)?.kind === 'ability' ? ' cast' : ' activated') + ' instead of ' + this.name(ev.expected) + '. Try again', cls: 'bad' });
        this.appendCancelNote();
        this.log(ev.key, 'wrong', this.feedback()?.text ?? '');
        this.flash('wrong', ev.key, now, 300);
        break;
      case 'too-early':
        // queueing off: players spam the key during the global cooldown – normal play, not a mistake; said once per session
        if (!queueing && !this.tooEarlyShown) {
          this.tooEarlyShown = true;
          this.feedback.set({ text: 'Too early, and queueing is off (Settings)', cls: 'warn' });
        }
        break;
      case 'wrong':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: 'Wrong ability: ' + this.name(ev.key) + ', ignored, on cooldown', cls: 'bad' });
        this.flash('wrong', ev.key, now, 250);
        break;
      case 'wrong-weapon':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({
          text: this.name(ev.key) + (ev.reason === 'weapon' ? ' needs a ' + (this.data.get(ev.key)?.ability?.style ?? this.data.get(ev.key)?.spec?.style ?? '') + ' weapon, you wield ' + (e.style ?? 'nothing') : ' is not the special attack of the wielded weapon'),
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
          this.feedback.set({ text: name + ' on' + (ev.replaced.length ? ', replaced ' + ev.replaced.map((r) => this.data.name('prayer:' + r)).join(', ') : ''), cls: 'info' });
        } else {
          this.feedback.set({ text: name + ' off', cls: 'info' });
        }
        this.log('prayer:' + ev.id, 'other', this.feedback()?.text ?? name);
        break;
      }
      case 'wrong-book':
        this.counts.update((c) => ({ ...c, wrong: c.wrong + 1 }));
        this.feedback.set({ text: this.data.name('prayer:' + ev.id) + ' is a ' + (ev.book === 'Curses' ? 'curse' : 'standard prayer') + '. Your book is ' + (this.prayerBook() === 'Curses' ? 'Ancient Curses' : 'standard prayers') + ' (Gear page)', cls: 'bad' });
        this.flash('wrong', 'prayer:' + ev.id, now, 300);
        break;
      case 'attack': {
        this.attackLog.update((l) => [...l.slice(-19), { style: ev.style, prayed: ev.prayed, tick: ev.tick, absorbed: ev.absorbed }]);
        const needed = this.data.name('prayer:' + ev.needed);
        const veng = ev.reflected ? ', Vengeance hit back' : '';
        if (ev.absorbed) {
          this.feedback.set({ text: ev.style + ' attack absorbed by ' + this.buffName(ev.absorbed), cls: 'good' });
        } else if (ev.prayed) {
          this.feedback.set({ text: ev.style + ' attack blocked by ' + needed + veng, cls: 'good' });
        } else {
          this.feedback.set({ text: 'Hit by a ' + ev.style + ' attack, ' + needed + ' was not active' + veng, cls: 'bad' });
        }
        break;
      }
      case 'no-adrenaline':
        this.feedback.set({ text: this.name(ev.key) + ' needs ' + ev.need + '% adrenaline, you have ' + Math.floor(ev.have) + '%' + (this.storage.settings().abilityQueueing ? ', queued until you have it' : ''), cls: 'bad' });
        this.flash('wrong', ev.key, now, 300);
        break;
      case 'on-cooldown':
        this.feedback.set({ text: this.name(ev.key) + ' is on cooldown for ' + (ev.readyInTicks * TICK_MS) / 1000 + ' s' + (this.storage.settings().abilityQueueing ? ', queued' : ''), cls: 'bad' });
        this.flash('wrong', ev.key, now, 300);
        break;
      case 'requirement':
        this.feedback.set({ text: this.name(ev.key) + ': ' + ev.text + (queueing ? ', queued' : ''), cls: 'bad' });
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
        const timer = window.setTimeout(() => {
          this.hitsplatTimers.delete(timer);
          this.hitsplats.update((l) => l.filter((h) => h.id !== id));
        }, 1800);
        this.hitsplatTimers.add(timer);
        break;
      }
      case 'killed': {
        const ms = Math.round(e.tickTime(ev.tick) - e.t0);
        this.killedAtMs.set(ms);
        this.feedback.set({ text: 'Target killed after ' + (ms / 1000).toFixed(1) + ' s, ' + Math.round(e.damageDealt).toLocaleString() + ' damage', cls: 'good' });
        break;
      }
      case 'missed':
        this.counts.update((c) => ({ ...c, missed: c.missed + ev.keys.length }));
        this.feedback.set({ text: 'Missed before the cast: ' + ev.keys.map((k) => this.name(k)).join(', '), cls: 'warn' });
        break;
      case 'stuck': {
        const name = this.name(ev.key);
        const info: SessionStuck = { key: ev.key, step: ev.step, name, reason: ev.reason, readyInTicks: ev.readyInTicks, text: stuckReason(name, ev) };
        this.stuck.set(info);
        this.finishReason.set('stuck');
        this.feedback.set({ text: 'Stuck at step ' + (ev.step + 1) + ': ' + info.text + '. This rotation cannot be played as written from here', cls: 'bad' });
        this.flash('wrong', ev.key, now, 600);
        this.log(ev.key, 'wrong', this.feedback()?.text ?? '', ev.step);
        break;
      }
      case 'adrenaline':
        break; // bookkeeping for the trace: the bar shows the total
      case 'time-warp': {
        this.feedback.set({ text: ev.phase === 'start' ? 'Time Warp: in 10 s adrenaline and cooldowns go back to now (' + Math.round(ev.adrenaline) + '%)' : 'Time Warp reset: adrenaline back to ' + Math.round(ev.adrenaline) + '%, cooldowns back to where they were', cls: 'info' });
        this.log('action:' + TIME_WARP_ACTION, 'other', ev.phase === 'start' ? 'Time Warp' : 'Time Warp reset');
        break;
      }
      case 'crystal': {
        this.feedback.set({ text: 'Adrenaline crystal: +' + ev.amount + '% adrenaline' + (ev.potionsReset ? ', adrenaline potions off cooldown' : '') + '. The next ability is due after the 1.8 s channel', cls: 'info' });
        this.log('action:' + CRYSTAL_ACTION, 'other', 'Adrenaline crystal +' + ev.amount + '%');
        break;
      }
      case 'finished': {
        if (this.stuck()) break; // the stuck line stays – it is the reason the session ended
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
    const rot = this.played();
    const results = this.results();
    const stuck = this.stuck();
    // a session stuck on its first step has no results but is still worth keeping: the rotation cannot be played
    if (!rot || (!results.length && !stuck && !(this.enemyOn() && this.prayerStats().attacks))) return;
    void this.storage.addSession({
      rotationId: rot.id,
      rotationName: rot.name,
      startedAt: this.startedAt,
      endedAt: Date.now(),
      settings: { ...this.storage.settings() },
      loadout: { ...this.storage.loadout() },
      results,
      enemy: this.enemyOn() ? { ...this.enemy() } : undefined,
      prayerStats: this.enemyOn() ? { ...this.prayerStats() } : undefined,
      damage: { total: this.damage(), hits: this.hits(), dps: Math.round(this.dps()), killedAtMs: this.killedAtMs(), misses: this.misses(), hitChance: this.hitChance() },
      stuck: stuck ?? undefined,
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

  readonly hasSoulSplit = computed(() => this.activePrayers().some((p) => p.id === SOUL_SPLIT));

  /** "1 tick late" / "2 ticks early" of a step result */
  offText(r: StepResult): string {
    const n = Math.abs(r.lateTicks);
    return n + (n === 1 ? ' tick ' : ' ticks ') + (r.outcome === 'early' ? 'early' : 'late');
  }

  /** the Timing column of the session summary */
  timing(r: StepResult): string {
    // a basic attack slipped in before this cast: the press came after the GCD end and waited a whole GCD
    const auto = r.autoAttackBefore ? ' · +1 GCD auto-attack' : '';
    if (r.outcome === 'perfect') return 'on tick' + (this.advanced() && r.offsetMs ? ' (' + r.offsetMs + ' ms early)' : '') + auto;
    if (r.outcome === 'late') return this.offText(r) + (this.advanced() && r.offsetMs ? ' (+' + r.offsetMs + ' ms)' : '') + auto;
    if (r.outcome === 'early') return this.offText(r);
    return r.outcome;
  }

  /** send a press to the (simulated) server and light the slot up right away, like the game does on click */
  private press(key: string, source = 'click'): void {
    const now = performance.now();
    if (this.engine && this.trace) this.trace.input(key, source, now, this.engine.debugState(this.engine.currentTick(now)));
    this.engine?.press(key, now);
    this.pressedUntil.set(key, now + PRESS_FLASH_MS);
    this.pressedKeys.set(new Set([...this.pressedKeys(), key]));
  }

  /** click on a carried weapon while training = switch to it (touch / mouse) */
  clickWeapon(id: string): void {
    if (this.running()) this.press('weapon:' + id);
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
    // typing into a text field (the feedback form, a prompt) or using an open dialog is not a key press for the bars
    if (isTypingTarget(e.target) || this.dialogs.current() || this.feedbackDialog.open()) return;
    if (e.code === 'Escape') {
      e.preventDefault();
      this.stop();
      return;
    }
    const kb = keybindFromEvent(e);
    if (kb) this.pressBind(kb, e);
  }

  /** extra mouse buttons (middle, mouse 4, mouse 5) press like keys; left and right stay clicks */
  @HostListener('window:mousedown', ['$event'])
  onMousedown(e: MouseEvent): void {
    if (!this.running()) return;
    if (isTypingTarget(e.target) || this.dialogs.current() || this.feedbackDialog.open()) return;
    const kb = keybindFromMouse(e);
    if (kb) this.pressBind(kb, e);
  }

  /** browsers navigate back / forward when a side button is released: swallow that for bound buttons while training */
  @HostListener('window:mouseup', ['$event'])
  @HostListener('window:auxclick', ['$event'])
  onMouseButtonRelease(e: MouseEvent): void {
    if (!this.running()) return;
    const kb = keybindFromMouse(e);
    if (kb && resolvePress(this.storage.actionBars(), keybindKey(kb))) e.preventDefault();
  }

  private pressBind(kb: Keybind, e: Event): void {
    // the same resolution as the drill (core/keybind.util): client actions, then the bars
    const target = resolvePress(this.storage.actionBars(), keybindKey(kb));
    if (!target) {
      if (this.engine && this.trace) this.trace.unbound(keybindLabel(kb), performance.now(), this.engine.currentTick(performance.now()));
      return;
    }
    e.preventDefault();
    const source = 'key ' + keybindLabel(kb);
    if (target.kind === 'action') this.press('action:' + target.id, source);
    else {
      const entity = this.bars().find((b) => b.position === target.pos)?.slots[target.slot]?.entity;
      if (entity) this.press(entity.key, source);
    }
  }
}

function mediaMatches(query: string): boolean {
  return typeof window !== 'undefined' && window.matchMedia(query).matches;
}

/** "play on into the next rotations", remembered per browser */
const CHAIN_KEY = 'rs3trainer.chain';
function readChain(): boolean {
  try {
    return localStorage.getItem(CHAIN_KEY) === '1';
  } catch {
    return false;
  }
}

function readOptionsOpen(): boolean {
  try {
    return localStorage.getItem(OPTIONS_KEY) === '1';
  } catch {
    return false;
  }
}

import { Injectable, computed, signal } from '@angular/core';
import { IDBPDatabase, deleteDB, openDB } from 'idb';
import { Subject } from 'rxjs';
import { ActionBarSetup, DEFAULT_ENEMY, DEFAULT_SETTINGS, EnemyConfig, Equipment, INVENTORY_SIZE, ItemRef, Keybind, LegacyLoadout, Loadout, Prebuild, Rotation, RotationStep, Session, SetupBundle, SetupMeta, Settings, defaultActionBars, migrateLegacyLoadout, newLoadout } from './models';

const DB_NAME = 'rs3trainer';
const CONSENT_KEY = 'rs3trainer.consent';

/**
 * Holds all user data as signals and mirrors it into IndexedDB once the user has accepted
 * storage. Before consent everything lives in memory only.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly consent = signal(readConsent());
  readonly ready = signal(false);
  readonly settings = signal<Settings>({ ...DEFAULT_SETTINGS });
  /** named loadouts; the active one drives the simulation */
  readonly loadouts = signal<Loadout[]>([newLoadout()]);
  readonly activeLoadoutId = signal<string>(this.loadouts()[0].id);
  readonly loadout = computed<Loadout>(() => this.loadouts().find((l) => l.id === this.activeLoadoutId()) ?? this.loadouts()[0]);
  /** simulated enemy for prayer training */
  readonly enemy = signal<EnemyConfig>({ ...DEFAULT_ENEMY });
  /** rotation id → pre-built state the session starts with */
  readonly prebuilds = signal<Record<string, Prebuild>>({});
  /** action bar presets, positions, style bindings, slot + weapon keybinds */
  readonly actionBars = signal<ActionBarSetup>(defaultActionBars());
  /** sync bookkeeping for settings + loadouts + enemy */
  readonly setupMeta = signal<SetupMeta>({});
  /** entity key ("ability:sever", "prayer:turmoil", ...) → keybind */
  readonly keybinds = signal<Record<string, Keybind>>({});
  readonly rotations = signal<Rotation[]>([]);
  /** number of training sessions saved in this page load (consent or not) – used for engagement counting */
  readonly sessionsSaved = signal(0);

  /** change hooks for the online sync (fired for user edits, not for data applied from the server) */
  readonly rotationSaved = new Subject<Rotation>();
  readonly rotationDeleted = new Subject<string>();
  readonly keybindChanged = new Subject<{ key: string; kb: Keybind | null }>();
  readonly sessionAdded = new Subject<Session>();
  readonly actionBarsChanged = new Subject<ActionBarSetup>();
  /** settings, a loadout or the enemy config were edited locally */
  readonly setupChanged = new Subject<void>();
  /** all keybinds were replaced at once (loading another user's setup) */
  readonly keybindsReplaced = new Subject<Record<string, Keybind>>();

  private db: Promise<IDBPDatabase> | null = null;

  constructor() {
    this.load();
  }

  private open(): Promise<IDBPDatabase> {
    this.db ??= openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('settings');
        db.createObjectStore('keybinds');
        db.createObjectStore('rotations', { keyPath: 'id' });
        db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
      },
    });
    return this.db;
  }

  private async load(): Promise<void> {
    if (!this.consent()) {
      this.ready.set(true);
      return;
    }
    try {
      const db = await this.open();
      const settings = await db.get('settings', 'settings');
      if (settings) this.settings.set(migrateSettings(settings));
      const stored = (await db.get('settings', 'loadouts')) as { loadouts: Loadout[]; active: string } | undefined;
      if (stored?.loadouts?.length) {
        this.loadouts.set(stored.loadouts.map(normaliseLoadout));
        this.activeLoadoutId.set(stored.loadouts.some((l) => l.id === stored.active) ? stored.active : stored.loadouts[0].id);
      } else {
        const legacy = (await db.get('settings', 'loadout')) as Partial<LegacyLoadout> | undefined; // builds before Sept 2026
        if (legacy) {
          const l = migrateLegacyLoadout(legacy);
          this.loadouts.set([l]);
          this.activeLoadoutId.set(l.id);
          await db.put('settings', { loadouts: [l], active: l.id }, 'loadouts');
        }
      }
      const enemy = await db.get('settings', 'enemy');
      if (enemy) this.enemy.set({ ...DEFAULT_ENEMY, ...enemy });
      const prebuilds = await db.get('settings', 'prebuilds');
      if (prebuilds) this.prebuilds.set(prebuilds);
      const bars = await db.get('settings', 'actionbars');
      if (bars) this.actionBars.set(mergeActionBars(bars));
      const meta = (await db.get('settings', 'setupmeta')) as SetupMeta | undefined;
      if (meta) this.setupMeta.set({ ...meta });

      const keys = (await db.getAllKeys('keybinds')) as string[];
      const values = (await db.getAll('keybinds')) as Keybind[];
      const keybinds: Record<string, Keybind> = {};
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i].includes(':') ? keys[i] : 'ability:' + keys[i]; // legacy: plain ability ids
        keybinds[k] = values[i];
        if (k !== keys[i]) {
          await db.delete('keybinds', keys[i]);
          await db.put('keybinds', values[i], k);
        }
      }
      this.keybinds.set(keybinds);

      const rotations = ((await db.getAll('rotations')) as Rotation[]).map(migrateRotation);
      for (const r of rotations) await db.put('rotations', r);
      this.rotations.set(rotations.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (err) {
      console.error('IndexedDB load failed', err);
    }
    this.ready.set(true);
  }

  async acceptConsent(): Promise<void> {
    try {
      localStorage.setItem(CONSENT_KEY, '1');
    } catch {
      /* storage blocked – keep in memory */
    }
    this.consent.set(true);
    const db = await this.open();
    await db.put('settings', this.settings(), 'settings');
    await db.put('settings', { loadouts: this.loadouts(), active: this.activeLoadoutId() }, 'loadouts');
    await db.put('settings', this.enemy(), 'enemy');
    await db.put('settings', this.actionBars(), 'actionbars');
    await db.put('settings', this.setupMeta(), 'setupmeta');
    for (const [id, kb] of Object.entries(this.keybinds())) await db.put('keybinds', kb, id);
    for (const r of this.rotations()) await db.put('rotations', r);
  }

  async saveSettings(s: Settings): Promise<void> {
    this.settings.set({ ...s });
    if (this.consent()) await (await this.open()).put('settings', this.settings(), 'settings');
    await this.touchSetup();
  }

  async savePrebuild(rotationId: string, p: Prebuild | null): Promise<void> {
    const next = { ...this.prebuilds() };
    if (p) next[rotationId] = { ...p, stacks: { ...p.stacks }, spirits: [...p.spirits], abilities: [...p.abilities], prayers: [...p.prayers] };
    else delete next[rotationId];
    this.prebuilds.set(next);
    if (this.consent()) await (await this.open()).put('settings', next, 'prebuilds');
  }

  async saveEnemy(e: EnemyConfig): Promise<void> {
    this.enemy.set({ ...e, styles: [...e.styles] });
    if (this.consent()) await (await this.open()).put('settings', this.enemy(), 'enemy');
    await this.touchSetup();
  }

  /** marks settings / loadouts / enemy as edited and tells the sync */
  private async touchSetup(): Promise<void> {
    await this.putSetupMeta({ ...this.setupMeta(), updatedAt: Date.now() });
    this.setupChanged.next();
  }

  async putSetupMeta(m: SetupMeta): Promise<void> {
    this.setupMeta.set({ ...m });
    if (this.consent()) await (await this.open()).put('settings', this.setupMeta(), 'setupmeta');
  }

  /** Applies the server copy of settings + loadouts + enemy without firing the sync hook. */
  async putSetup(s: { settings: Settings; loadouts: Loadout[]; activeLoadoutId: string; enemy: EnemyConfig | null }, meta: SetupMeta): Promise<void> {
    this.settings.set(migrateSettings(s.settings ?? {}));
    const list = (s.loadouts ?? []).map(normaliseLoadout);
    this.loadouts.set(list.length ? list : [newLoadout()]);
    this.activeLoadoutId.set(this.loadouts().some((l) => l.id === s.activeLoadoutId) ? s.activeLoadoutId : this.loadouts()[0].id);
    if (s.enemy) this.enemy.set({ ...DEFAULT_ENEMY, ...s.enemy, styles: [...(s.enemy.styles ?? DEFAULT_ENEMY.styles)] });
    if (this.consent()) {
      const db = await this.open();
      await db.put('settings', this.settings(), 'settings');
      await db.put('settings', { loadouts: this.loadouts(), active: this.activeLoadoutId() }, 'loadouts');
      await db.put('settings', this.enemy(), 'enemy');
    }
    await this.putSetupMeta(meta);
  }

  /**
   * Replaces everything except the rotations with another user's setup (Setups page). Fires the
   * change hooks, so while signed in the own online copy is replaced as well.
   */
  async replaceSetup(b: SetupBundle): Promise<void> {
    await this.putSetup({ settings: b.settings, loadouts: b.loadouts, activeLoadoutId: b.activeLoadoutId, enemy: b.enemy ?? { ...DEFAULT_ENEMY } }, { updatedAt: Date.now() });
    this.setupChanged.next();

    const keybinds: Record<string, Keybind> = {};
    for (const [key, kb] of Object.entries(b.keybinds ?? {})) if (kb && typeof kb.code === 'string') keybinds[key] = { code: kb.code, ctrl: !!kb.ctrl, shift: !!kb.shift, alt: !!kb.alt };
    this.keybinds.set(keybinds);
    if (this.consent()) {
      const db = await this.open();
      await db.clear('keybinds');
      for (const [key, kb] of Object.entries(keybinds)) await db.put('keybinds', kb, key);
    }
    this.keybindsReplaced.next(keybinds);

    const bars = b.actionBars ? mergeActionBars(b.actionBars) : defaultActionBars();
    delete bars.syncedAt;
    await this.saveActionBars(bars);
  }

  async saveLoadout(l: Loadout): Promise<void> {
    const copy = normaliseLoadout({ ...l });
    const list = this.loadouts().some((x) => x.id === copy.id) ? this.loadouts().map((x) => (x.id === copy.id ? copy : x)) : [...this.loadouts(), copy];
    this.loadouts.set(list);
    await this.persistLoadouts();
    await this.touchSetup();
  }

  async deleteLoadout(id: string): Promise<void> {
    const list = this.loadouts().filter((x) => x.id !== id);
    this.loadouts.set(list.length ? list : [newLoadout()]);
    if (!this.loadouts().some((x) => x.id === this.activeLoadoutId())) this.activeLoadoutId.set(this.loadouts()[0].id);
    await this.persistLoadouts();
    await this.touchSetup();
  }

  async setActiveLoadout(id: string): Promise<void> {
    if (this.loadouts().some((x) => x.id === id)) this.activeLoadoutId.set(id);
    await this.persistLoadouts();
    await this.touchSetup();
  }

  private async persistLoadouts(): Promise<void> {
    if (this.consent()) await (await this.open()).put('settings', { loadouts: this.loadouts(), active: this.activeLoadoutId() }, 'loadouts');
  }

  async saveActionBars(setup: ActionBarSetup): Promise<void> {
    await this.putActionBars({ ...setup, updatedAt: Date.now() });
    this.actionBarsChanged.next(this.actionBars());
  }

  /** Stores the setup as-is (keeps updatedAt / syncedAt) without firing the sync hook. */
  async putActionBars(setup: ActionBarSetup): Promise<void> {
    this.actionBars.set(structuredClone(setup));
    if (this.consent()) await (await this.open()).put('settings', this.actionBars(), 'actionbars');
  }

  async setKeybind(key: string, kb: Keybind | null): Promise<void> {
    await this.putKeybind(key, kb);
    this.keybindChanged.next({ key, kb });
  }

  /** Stores a keybind without firing the sync hook (used for data coming from the server). */
  async putKeybind(key: string, kb: Keybind | null): Promise<void> {
    const next = { ...this.keybinds() };
    if (kb) next[key] = kb;
    else delete next[key];
    this.keybinds.set(next);
    if (this.consent()) {
      const db = await this.open();
      if (kb) await db.put('keybinds', kb, key);
      else await db.delete('keybinds', key);
    }
  }

  async saveRotation(r: Rotation): Promise<void> {
    const rot = await this.putRotation({ ...r, updatedAt: Date.now() });
    this.rotationSaved.next(rot);
  }

  /** Stores a rotation as-is (keeps updatedAt / syncedAt) without firing the sync hook. */
  async putRotation(r: Rotation): Promise<Rotation> {
    const rot: Rotation = { ...r, steps: r.steps.map(cleanStep) };
    this.rotations.set([rot, ...this.rotations().filter((x) => x.id !== rot.id)].sort((a, b) => b.updatedAt - a.updatedAt));
    if (this.consent()) await (await this.open()).put('rotations', rot);
    return rot;
  }

  async deleteRotation(id: string): Promise<void> {
    await this.removeRotation(id);
    this.rotationDeleted.next(id);
  }

  /** Removes a rotation without firing the sync hook. */
  async removeRotation(id: string): Promise<void> {
    this.rotations.set(this.rotations().filter((x) => x.id !== id));
    if (this.consent()) await (await this.open()).delete('rotations', id);
  }

  async addSession(s: Session): Promise<void> {
    this.sessionsSaved.update((n) => n + 1);
    if (this.consent()) await (await this.open()).add('sessions', s);
    this.sessionAdded.next(s);
  }

  async listSessions(): Promise<Session[]> {
    if (!this.consent()) return [];
    return ((await (await this.open()).getAll('sessions')) as Session[]).sort((a, b) => b.startedAt - a.startedAt);
  }

  async clearAll(): Promise<void> {
    if (this.db) (await this.db).close();
    this.db = null;
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      /* ignore */
    }
    await deleteDB(DB_NAME);
    this.consent.set(false);
    this.settings.set({ ...DEFAULT_SETTINGS });
    this.loadouts.set([newLoadout()]);
    this.activeLoadoutId.set(this.loadouts()[0].id);
    this.enemy.set({ ...DEFAULT_ENEMY });
    this.actionBars.set(defaultActionBars());
    this.setupMeta.set({});
    this.keybinds.set({});
    this.rotations.set([]);
  }
}

/** Fills anything a stored setup lacks (older builds, new fields) with defaults. */
function mergeActionBars(stored: Partial<ActionBarSetup>): ActionBarSetup {
  const d = defaultActionBars();
  const presets = d.presets.map((p) => {
    const s = stored.presets?.find((x) => x.id === p.id);
    return s ? { ...p, ...s, slots: Array.from({ length: p.slots.length }, (_, i) => s.slots?.[i] ?? null) } : p;
  });
  return {
    presets,
    positions: d.positions.map((p, i) => stored.positions?.[i] ?? p),
    bindings: { ...d.bindings, ...(stored.bindings ?? {}) },
    slotKeybinds: d.slotKeybinds.map((row, p) => row.map((kb, i) => (stored.slotKeybinds?.[p] ? stored.slotKeybinds[p][i] ?? null : kb))),
    weaponKeybinds: { ...(stored.weaponKeybinds ?? {}) },
    layout: stored.layout,
    updatedAt: stored.updatedAt,
    syncedAt: stored.syncedAt,
  };
}

/** Older builds stored `queueWindowTicks` (1..3) instead of the in-game on/off setting. */
function migrateSettings(stored: Partial<Settings> & { queueWindowTicks?: number }): Settings {
  const { queueWindowTicks, ...rest } = stored;
  const s: Settings = { ...DEFAULT_SETTINGS, ...rest };
  if (typeof queueWindowTicks === 'number' && typeof stored.abilityQueueing !== 'boolean') s.abilityQueueing = queueWindowTicks >= 3;
  return s;
}

/** Keeps only the step fields we know (kind, id and the PvME extras), dropping undefined values. */
function cleanStep(s: RotationStep): RotationStep {
  const out: RotationStep = { kind: s.kind, id: s.id };
  if (s.note !== undefined) out.note = s.note;
  if (s.phase) out.phase = true;
  if (s.sameTick) out.sameTick = true;
  if (s.offsetTicks !== undefined) out.offsetTicks = s.offsetTicks;
  if (s.hint) out.hint = s.hint;
  return out;
}

/** Older builds stored steps as plain ability ids. */
function migrateRotation(r: Rotation & { steps: (string | RotationStep)[] }): Rotation {
  return { ...r, steps: r.steps.map((s) => (typeof s === 'string' ? { kind: 'ability', id: s } : s)) };
}

/** Fills fields added after a loadout was saved. */
function normaliseLoadout(l: Partial<Loadout>): Loadout {
  const base = newLoadout(l.name ?? 'Default');
  const out: Loadout = { ...base, ...l, id: l.id ?? base.id };
  out.items = [...(l.items ?? [])];
  out.relics = [...(l.relics ?? [])];
  out.switches = [...(l.switches ?? [])];
  out.prayerBook = l.prayerBook === 'Prayers' ? 'Prayers' : 'Curses';
  out.weaponGizmos = (l.weaponGizmos ?? base.weaponGizmos).map((g) => ({ ancient: !!g.ancient, perks: [...(g.perks ?? [])] }));
  out.armourGizmos = (l.armourGizmos ?? base.armourGizmos).map((g) => ({ ancient: !!g.ancient, perks: [...(g.perks ?? [])] }));
  while (out.weaponGizmos.length < 2) out.weaponGizmos.push({ ancient: false, perks: [] });
  while (out.armourGizmos.length < 2) out.armourGizmos.push({ ancient: false, perks: [] });
  if (l.equipment) {
    out.equipment = cleanEquipment(l.equipment);
    out.inventory = Array.from({ length: INVENTORY_SIZE }, (_, i) => cleanRef(l.inventory?.[i]));
  } else {
    // builds before the inventory: weapons in hand + switches (+ their gizmos) become worn / carried items
    const eq: Equipment = {};
    const g = (i: number) => (out.weaponGizmos[i]?.perks.length ? [out.weaponGizmos[i]] : undefined);
    if (l.twoHand) eq.twoHand = { kind: 'weapon', id: l.twoHand, gizmos: out.weaponGizmos.some((x) => x.perks.length) ? out.weaponGizmos.slice(0, 2) : undefined };
    else {
      if (l.mainHand) eq.mainHand = { kind: 'weapon', id: l.mainHand, gizmos: g(0) };
      if (l.offHand) eq.offHand = { kind: 'weapon', id: l.offHand, gizmos: g(1) };
    }
    out.equipment = eq;
    out.inventory = Array.from({ length: INVENTORY_SIZE }, (_, i) => (out.switches[i] ? { kind: 'weapon', id: out.switches[i] } : null));
  }
  // derived weapon fields for older readers (shared setups, sessions)
  const w = (r: ItemRef | null | undefined) => (r?.kind === 'weapon' ? r.id : null);
  out.twoHand = w(out.equipment.twoHand);
  out.mainHand = out.twoHand ? null : w(out.equipment.mainHand);
  out.offHand = out.twoHand ? null : w(out.equipment.offHand);
  out.switches = out.inventory.filter((r): r is ItemRef => r?.kind === 'weapon').map((r) => r.id).filter((id, i, a) => a.indexOf(id) === i);
  return out;
}

function cleanRef(r: ItemRef | null | undefined): ItemRef | null {
  if (!r || typeof r.id !== 'string' || !['weapon', 'gear', 'special'].includes(r.kind)) return null;
  const out: ItemRef = { kind: r.kind, id: r.id };
  if (r.gizmos?.length) {
    out.gizmos = r.gizmos.map((g) => ({
      ancient: !!g.ancient,
      perks: (g.perks ?? []).filter((p) => p && typeof p.perk === 'string').map((p) => ({ perk: p.perk, rank: Math.max(1, Math.round(Number(p.rank) || 1)) })),
    }));
  }
  if (r.spec) out.spec = r.spec;
  return out;
}

function cleanEquipment(eq: Equipment): Equipment {
  const out: Equipment = {};
  for (const [slot, r] of Object.entries(eq) as [keyof Equipment, ItemRef | null | undefined][]) {
    const c = cleanRef(r);
    if (c) out[slot] = c;
  }
  if (out.twoHand) {
    delete out.mainHand;
    delete out.offHand;
  }
  return out;
}

function readConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1';
  } catch {
    return false;
  }
}

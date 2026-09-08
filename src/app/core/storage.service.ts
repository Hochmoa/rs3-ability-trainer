import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { IDBPDatabase, deleteDB, openDB } from 'idb';
import { Subject } from 'rxjs';
import { ToastService } from '../shared/toast';
import { defaultActionBarsWithKeys } from './keybind-layouts';
import { DataService } from './data.service';
import { cleanStep, mergeActionBars, migrateLegacyGear, migrateRotation, migrateSettings, normaliseLoadout } from './migrations';
import { ActionBarSetup, DEFAULT_ENEMY, enemyWithStats, DEFAULT_SETTINGS, EnemyConfig, LegacyLoadout, Loadout, Prebuild, Rotation, Session, Setup, SetupMeta, Settings, migrateLegacyLoadout, newLoadout, newSetup } from './models';
import { reconcileSetups } from './setup-migration';

const DB_NAME = 'rs3trainer';
/** 2 (Sept 2026): the `setups` store; the legacy per-entity `keybinds` store is dropped (keys live in the action bars) */
const DB_VERSION = 2;
const CONSENT_KEY = 'rs3trainer.consent';
/** one "could not save" toast per this many ms – a burst of failing puts (quota) is one problem, not twenty */
const WRITE_TOAST_MS = 30_000;
const WRITE_FAILED_TEXT = "Could not save to this browser's storage. Your change is kept for this visit only.";
/** local session history: only the newest ones are kept (every session carries a copy of the settings and the loadout) */
export const SESSIONS_KEPT = 50;
const LOAD_FAILED_TEXT = "Could not read this browser's storage. It is running on defaults and saves nothing until you reload.";

/**
 * Runs a storage operation and never throws: a failure (QuotaExceededError, Safari's UnknownError, a closed
 * database …) goes to `report` and resolves undefined. The signals were already updated, so the app keeps
 * working with the in-memory copy.
 */
export async function safeWrite<T>(op: () => Promise<T>, report: (err: unknown) => void): Promise<T | undefined> {
  try {
    return await op();
  } catch (err) {
    report(err);
    return undefined;
  }
}

/** `fire()` runs the callback at most once per `ms` (leading edge); the calls in between are dropped */
export class Throttle {
  private last = -Infinity;

  constructor(
    private readonly ms: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  fire(fn: () => void): boolean {
    const t = this.now();
    if (t - this.last < this.ms) return false;
    this.last = t;
    fn();
    return true;
  }
}

/**
 * Holds all user data as signals and mirrors it into IndexedDB once the user has accepted
 * storage. Before consent everything lives in memory only.
 *
 * The data is organised in setups (boss + one loadout + rotations, docs/plan-setups.md): `setups`, `loadouts` and
 * `rotations` are kept consistent by `reconcileSetups` on load, and the active setup drives the simulation.
 *
 * Every IndexedDB write goes through `write()`: a failure is logged and toasted (throttled), never thrown –
 * the signals already hold the change. A failed *read* at start-up sets `loadFailed`, which blocks every
 * write for this page load: the app would otherwise overwrite the user's stored data with the defaults it
 * fell back to.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly toast = inject(ToastService);
  readonly consent = signal(readConsent());
  readonly ready = signal(false);
  /** a store could not be read at start-up – the app runs on defaults and does not write (see class doc) */
  readonly loadFailed = signal(false);
  private readonly writeToast = new Throttle(WRITE_TOAST_MS);
  readonly settings = signal<Settings>({ ...DEFAULT_SETTINGS });
  /** the setups; the active one drives the simulation (its loadout, its rotations) */
  readonly setups = signal<Setup[]>([]);
  readonly activeSetupId = signal<string>('');
  readonly setup = computed<Setup>(() => this.setups().find((s) => s.id === this.activeSetupId()) ?? this.setups()[0] ?? newSetup({ id: 'none', loadoutId: '' }));
  /** the loadouts, one per setup */
  readonly loadouts = signal<Loadout[]>([]);
  readonly activeLoadoutId = computed(() => this.setup().loadoutId);
  readonly loadout = computed<Loadout>(() => this.loadouts().find((l) => l.id === this.activeLoadoutId()) ?? this.loadouts()[0] ?? newLoadout());
  /** simulated enemy for prayer training */
  readonly enemy = signal<EnemyConfig>({ ...DEFAULT_ENEMY });
  /** rotation id → pre-built state the session starts with */
  readonly prebuilds = signal<Record<string, Prebuild>>({});
  /** the 18 action bar presets, positions, style bindings, slot + weapon keybinds – the player's own, see saveActionBars */
  readonly actionBars = signal<ActionBarSetup>(defaultActionBarsWithKeys());
  /** sync bookkeeping for settings + enemy */
  readonly setupMeta = signal<SetupMeta>({});
  readonly rotations = signal<Rotation[]>([]);
  /** number of training sessions saved in this page load (consent or not) – used for engagement counting */
  readonly sessionsSaved = signal(0);

  /** change hooks for the online sync (fired for user edits, not for data applied from the server) */
  readonly rotationSaved = new Subject<Rotation>();
  readonly rotationDeleted = new Subject<string>();
  /** a setup or its loadout was edited locally */
  readonly setupSaved = new Subject<Setup>();
  readonly setupDeleted = new Subject<string>();
  readonly sessionAdded = new Subject<Session>();
  readonly actionBarsChanged = new Subject<ActionBarSetup>();
  /** settings or the enemy config were edited locally */
  readonly settingsChanged = new Subject<void>();

  private db: Promise<IDBPDatabase> | null = null;
  private readonly data = inject(DataService);

  constructor() {
    this.load();
    // loadouts saved before the inventory: flags (Ring of vigour, armour set + pieces, EoF spec) become worn items, once
    // the gear catalog is there – here and not on the Loadout page, so a user who never opens that page is migrated too
    effect(() => {
      if (!this.ready() || !this.data.loadoutReady()) return;
      const loadouts = this.loadouts();
      untracked(() => {
        const gear = this.data.gear();
        for (const l of loadouts) {
          const migrated = migrateLegacyGear(l, gear, (ref) => this.data.slotOf(ref));
          if (migrated) void this.saveLoadout(migrated);
        }
      });
    });
  }

  private open(): Promise<IDBPDatabase> {
    this.db ??= openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('settings');
          db.createObjectStore('rotations', { keyPath: 'id' });
          db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        }
        if (oldVersion < 2) {
          db.createObjectStore('setups', { keyPath: 'id' });
          if (db.objectStoreNames.contains('keybinds')) db.deleteObjectStore('keybinds');
        }
      },
    });
    return this.db;
  }

  /**
   * A read at start-up; a failure (a corrupt record, a blocked database) is logged, flags `loadFailed` and
   * resolves undefined – the other stores are still read and applied.
   */
  private async read<T>(what: string, op: (db: IDBPDatabase) => Promise<T>): Promise<T | undefined> {
    try {
      return await op(await this.open());
    } catch (err) {
      console.error('IndexedDB read failed: ' + what, err);
      this.loadFailed.set(true);
      return undefined;
    }
  }

  /** an IndexedDB write – skipped without consent or after a failed read; a failure is logged and toasted, never thrown */
  private async write(op: (db: IDBPDatabase) => Promise<unknown>): Promise<void> {
    if (!this.consent() || this.loadFailed()) return;
    await safeWrite(
      async () => op(await this.open()),
      (err) => {
        console.error('IndexedDB write failed', err);
        this.writeToast.fire(() => this.toast.show(WRITE_FAILED_TEXT, 'warn'));
      },
    );
  }

  private async load(): Promise<void> {
    if (!this.consent()) {
      this.reconcile(null);
      this.ready.set(true);
      return;
    }
    const settings = await this.read('settings', (db) => db.get('settings', 'settings'));
    if (settings) this.settings.set(migrateSettings(settings));

    let activeLoadoutId: string | null = null;
    const stored = await this.read('loadouts', (db) => db.get('settings', 'loadouts') as Promise<{ loadouts: Loadout[]; active?: string } | undefined>);
    if (stored?.loadouts?.length) {
      this.loadouts.set(stored.loadouts.map(normaliseLoadout));
      activeLoadoutId = stored.active ?? null;
    } else if (!stored) {
      const legacy = await this.read('loadout', (db) => db.get('settings', 'loadout') as Promise<Partial<LegacyLoadout> | undefined>); // builds before Sept 2026
      if (legacy) {
        const l = migrateLegacyLoadout(legacy);
        this.loadouts.set([l]);
        activeLoadoutId = l.id;
      }
    }

    const enemy = await this.read('enemy', (db) => db.get('settings', 'enemy'));
    if (enemy) this.enemy.set(enemyWithStats(enemy));
    const prebuilds = await this.read('prebuilds', (db) => db.get('settings', 'prebuilds'));
    if (prebuilds) this.prebuilds.set(prebuilds);
    const bars = await this.read('actionbars', (db) => db.get('settings', 'actionbars'));
    if (bars) this.actionBars.set(mergeActionBars(bars));
    const meta = await this.read('setupmeta', (db) => db.get('settings', 'setupmeta') as Promise<SetupMeta | undefined>);
    if (meta) this.setupMeta.set({ ...meta });

    const rotations = await this.read('rotations', async (db) => ((await db.getAll('rotations')) as Rotation[]).map(migrateRotation));
    if (rotations) this.rotations.set(rotations.sort((a, b) => b.updatedAt - a.updatedAt));
    const setups = await this.read('setups', (db) => db.getAll('setups') as Promise<Setup[]>);
    if (setups) this.setups.set(setups);
    const active = await this.read('activesetup', (db) => db.get('settings', 'activesetup') as Promise<string | undefined>);
    this.activeSetupId.set(active ?? '');

    if (this.reconcile(activeLoadoutId)) await this.persistSetups();

    if (this.loadFailed()) this.toast.show(LOAD_FAILED_TEXT, 'warn', 12_000);
    this.ready.set(true);
  }

  /** setups ⇄ loadouts ⇄ rotations made consistent (core/setup-migration.ts); true when something had to change */
  private reconcile(activeLoadoutId: string | null): boolean {
    const out = reconcileSetups({ setups: this.setups(), loadouts: this.loadouts(), rotations: this.rotations(), activeSetupId: this.activeSetupId() || null }, { activeLoadoutId });
    if (out.changed) {
      this.setups.set(out.setups);
      this.loadouts.set(out.loadouts);
      this.rotations.set(out.rotations);
      this.activeSetupId.set(out.activeSetupId ?? '');
    }
    return out.changed;
  }

  /** writes setups, loadouts, rotations and the active setup – after a reconcile touched several of them */
  private async persistSetups(): Promise<void> {
    await this.write(async (db) => {
      await db.put('settings', { loadouts: this.loadouts() }, 'loadouts');
      for (const s of this.setups()) await db.put('setups', s);
      for (const r of this.rotations()) await db.put('rotations', r);
      await db.put('settings', this.activeSetupId(), 'activesetup');
    });
  }

  /**
   * An explicit save (rotation Save, preset Add, keybind wizard Finish, "Load a demo") is the consent the banner asks
   * for: accepts once so the save persists. True when it just accepted – the caller says "Saved in this browser".
   */
  async acceptConsentOnSave(): Promise<boolean> {
    if (this.consent()) return false;
    await this.acceptConsent();
    return true;
  }

  async acceptConsent(): Promise<void> {
    try {
      localStorage.setItem(CONSENT_KEY, '1');
    } catch {
      /* storage blocked – keep in memory */
    }
    this.consent.set(true);
    await this.write(async (db) => {
      await db.put('settings', this.settings(), 'settings');
      await db.put('settings', this.enemy(), 'enemy');
      await db.put('settings', this.actionBars(), 'actionbars');
      await db.put('settings', this.setupMeta(), 'setupmeta');
    });
    await this.persistSetups();
  }

  async saveSettings(s: Settings): Promise<void> {
    this.settings.set({ ...s });
    await this.write((db) => db.put('settings', this.settings(), 'settings'));
    await this.touchSettings();
  }

  async savePrebuild(rotationId: string, p: Prebuild | null): Promise<void> {
    const next = { ...this.prebuilds() };
    if (p) next[rotationId] = { ...p, stacks: { ...p.stacks }, spirits: [...p.spirits], abilities: [...p.abilities], prayers: [...p.prayers] };
    else delete next[rotationId];
    this.prebuilds.set(next);
    await this.write((db) => db.put('settings', next, 'prebuilds'));
  }

  async saveEnemy(e: EnemyConfig): Promise<void> {
    this.enemy.set({ ...e, styles: [...e.styles] });
    await this.write((db) => db.put('settings', this.enemy(), 'enemy'));
    await this.touchSettings();
  }

  /** marks settings / enemy as edited and tells the sync */
  private async touchSettings(): Promise<void> {
    await this.putSetupMeta({ ...this.setupMeta(), updatedAt: Date.now() });
    this.settingsChanged.next();
  }

  async putSetupMeta(m: SetupMeta): Promise<void> {
    this.setupMeta.set({ ...m });
    await this.write((db) => db.put('settings', this.setupMeta(), 'setupmeta'));
  }

  /** Applies the server copy of settings + enemy without firing the sync hook. */
  async putSettingsDoc(s: { settings: Settings; enemy: EnemyConfig | null }, meta: SetupMeta): Promise<void> {
    this.settings.set(migrateSettings(s.settings ?? {}));
    if (s.enemy) this.enemy.set(enemyWithStats(s.enemy));
    await this.write(async (db) => {
      await db.put('settings', this.settings(), 'settings');
      await db.put('settings', this.enemy(), 'enemy');
    });
    await this.putSetupMeta(meta);
  }

  // ---------------------------------------------------------------- setups

  /** the setup a loadout belongs to */
  setupOfLoadout(loadoutId: string): Setup | undefined {
    return this.setups().find((s) => s.loadoutId === loadoutId);
  }

  loadoutOf(setup: Pick<Setup, 'loadoutId'>): Loadout | undefined {
    return this.loadouts().find((l) => l.id === setup.loadoutId);
  }

  /** Creates a setup together with its loadout (the loadout is stored first, so the setup never points nowhere). */
  async addSetup(setup: Setup, loadout: Loadout): Promise<void> {
    await this.putLoadout({ ...loadout, id: setup.loadoutId });
    await this.saveSetup(setup);
  }

  /** A new setup with an empty loadout; returns it. */
  async createSetup(p: Partial<Setup>): Promise<Setup> {
    const l = newLoadout(p.name || 'Default');
    const s = newSetup({ ...p, loadoutId: l.id });
    await this.addSetup(s, l);
    return s;
  }

  /** A copy of a setup – loadout and rotations included – under new ids; returns the new setup. */
  async duplicateSetup(id: string, name?: string): Promise<Setup | null> {
    const src = this.setups().find((s) => s.id === id);
    const loadout = src && this.loadoutOf(src);
    if (!src || !loadout) return null;
    const copy = newSetup({ ...src, id: crypto.randomUUID(), name: name ?? src.name + ' (copy)', loadoutId: crypto.randomUUID(), isPublic: false, updatedAt: Date.now() });
    delete copy.syncedAt;
    await this.addSetup(copy, structuredClone(loadout));
    for (const r of this.rotations().filter((x) => x.setupId === id)) {
      const { syncedAt, ...rest } = r;
      void syncedAt;
      await this.saveRotation({ ...rest, id: crypto.randomUUID(), setupId: copy.id, steps: structuredClone(r.steps) });
    }
    return copy;
  }

  /** Saves a setup's own fields (boss, name, style, public) and tells the sync. */
  async saveSetup(s: Setup): Promise<void> {
    const setup = await this.putSetup({ ...s, updatedAt: Date.now() });
    this.setupSaved.next(setup);
  }

  /** Stores a setup as-is (keeps updatedAt / syncedAt) without firing the sync hook. */
  async putSetup(s: Setup): Promise<Setup> {
    const setup: Setup = { ...s };
    this.setups.set(this.setups().some((x) => x.id === setup.id) ? this.setups().map((x) => (x.id === setup.id ? setup : x)) : [...this.setups(), setup]);
    await this.write((db) => db.put('setups', setup));
    return setup;
  }

  /** Deletes a setup with its loadout and rotations; the last setup is replaced by a fresh general one. */
  async deleteSetup(id: string): Promise<void> {
    await this.removeSetup(id);
    this.setupDeleted.next(id);
  }

  /** Removes a setup, its loadout and its rotations without firing the sync hook (the server cascades). */
  async removeSetup(id: string): Promise<void> {
    const s = this.setups().find((x) => x.id === id);
    if (!s) return;
    const rotationIds = this.rotations().filter((r) => r.setupId === id).map((r) => r.id);
    this.rotations.set(this.rotations().filter((r) => r.setupId !== id));
    this.loadouts.set(this.loadouts().filter((l) => l.id !== s.loadoutId));
    this.setups.set(this.setups().filter((x) => x.id !== id));
    await this.write(async (db) => {
      for (const rid of rotationIds) await db.delete('rotations', rid);
      await db.delete('setups', id);
    });
    this.reconcile(null);
    await this.persistSetups();
  }

  async setActiveSetup(id: string): Promise<void> {
    if (!this.setups().some((s) => s.id === id)) return;
    this.activeSetupId.set(id);
    await this.write((db) => db.put('settings', id, 'activesetup'));
  }

  /** the setup of a rotation becomes the active one (picking a rotation on the Train page); true when it switched */
  async activateSetupOf(r: Pick<Rotation, 'setupId'>): Promise<boolean> {
    if (r.setupId === this.activeSetupId() || !this.setups().some((s) => s.id === r.setupId)) return false;
    await this.setActiveSetup(r.setupId);
    return true;
  }

  // ---------------------------------------------------------------- loadouts

  /** Saves a loadout; its setup counts as edited (the loadout travels inside the setup's server row). */
  async saveLoadout(l: Loadout): Promise<void> {
    await this.putLoadout(l);
    const setup = this.setupOfLoadout(l.id);
    if (setup) await this.saveSetup(setup);
  }

  /** Stores a loadout without firing the sync hook. */
  async putLoadout(l: Loadout): Promise<void> {
    const copy = normaliseLoadout({ ...l });
    const list = this.loadouts().some((x) => x.id === copy.id) ? this.loadouts().map((x) => (x.id === copy.id ? copy : x)) : [...this.loadouts(), copy];
    this.loadouts.set(list);
    await this.write((db) => db.put('settings', { loadouts: this.loadouts() }, 'loadouts'));
  }

  // ---------------------------------------------------------------- action bars

  /**
   * The bars are the player's own: this is the only writer, and it is only ever called from the Action bars and
   * Keybinds pages and from "Auto-place on my bars" (free slots only). Imports, presets and shared setups never call it.
   */
  async saveActionBars(setup: ActionBarSetup): Promise<void> {
    const { profiles, activeProfileId, ...rest } = setup; // legacy profiles are folded by mergeActionBars and never written again
    void profiles;
    void activeProfileId;
    await this.putActionBars({ ...rest, updatedAt: Date.now() });
    this.actionBarsChanged.next(this.actionBars());
  }

  /** Stores the setup as-is (keeps updatedAt / syncedAt) without firing the sync hook. */
  async putActionBars(setup: ActionBarSetup): Promise<void> {
    this.actionBars.set(structuredClone(setup));
    await this.write((db) => db.put('settings', this.actionBars(), 'actionbars'));
  }

  // ---------------------------------------------------------------- rotations

  /** Saves a rotation (into the active setup when it names none) and tells the sync. */
  async saveRotation(r: Rotation): Promise<void> {
    const setupId = this.setups().some((s) => s.id === r.setupId) ? r.setupId : this.activeSetupId();
    const rot = await this.putRotation({ ...r, setupId, updatedAt: Date.now() });
    this.rotationSaved.next(rot);
  }

  /** Stores a rotation as-is (keeps updatedAt / syncedAt) without firing the sync hook. */
  async putRotation(r: Rotation): Promise<Rotation> {
    const rot: Rotation = { ...r, steps: r.steps.map(cleanStep) };
    this.rotations.set([rot, ...this.rotations().filter((x) => x.id !== rot.id)].sort((a, b) => b.updatedAt - a.updatedAt));
    await this.write((db) => db.put('rotations', rot));
    return rot;
  }

  async deleteRotation(id: string): Promise<void> {
    await this.removeRotation(id);
    this.rotationDeleted.next(id);
  }

  /** Removes a rotation without firing the sync hook. */
  async removeRotation(id: string): Promise<void> {
    this.rotations.set(this.rotations().filter((x) => x.id !== id));
    await this.write((db) => db.delete('rotations', id));
  }

  /**
   * After a sync: rotations the server handed over without a setup (rows from before the setups) get one, and every
   * setup has its loadout. Returns the rotations that were re-homed, so the sync can upload the assignment.
   */
  async reconcileAfterSync(): Promise<Rotation[]> {
    const before = new Map(this.rotations().map((r) => [r.id, r]));
    if (!this.reconcile(null)) return [];
    await this.persistSetups();
    return this.rotations().filter((r) => before.get(r.id) !== r);
  }

  // ---------------------------------------------------------------- sessions

  /** Appends a session and drops the oldest beyond `SESSIONS_KEPT` (the store is auto-increment: lower keys are older). */
  async addSession(s: Session): Promise<void> {
    this.sessionsSaved.update((n) => n + 1);
    await this.write(async (db) => {
      await db.add('sessions', s);
      const keys = (await db.getAllKeys('sessions')) as number[];
      for (const key of keys.sort((a, b) => a - b).slice(0, Math.max(0, keys.length - SESSIONS_KEPT))) await db.delete('sessions', key);
    });
    this.sessionAdded.next(s);
  }

  async listSessions(): Promise<Session[]> {
    if (!this.consent()) return [];
    const list = await safeWrite(
      async () => (await (await this.open()).getAll('sessions')) as Session[],
      (err) => console.error('IndexedDB read failed: sessions', err),
    );
    return (list ?? []).sort((a, b) => b.startedAt - a.startedAt);
  }

  async clearAll(): Promise<void> {
    try {
      if (this.db) (await this.db).close();
    } catch {
      /* never opened */
    }
    this.db = null;
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      /* ignore */
    }
    await safeWrite(
      () => deleteDB(DB_NAME),
      (err) => console.error('IndexedDB delete failed', err),
    );
    this.consent.set(false);
    this.loadFailed.set(false);
    this.settings.set({ ...DEFAULT_SETTINGS });
    this.setups.set([]);
    this.loadouts.set([]);
    this.rotations.set([]);
    this.activeSetupId.set('');
    this.enemy.set({ ...DEFAULT_ENEMY });
    this.actionBars.set(defaultActionBarsWithKeys());
    this.setupMeta.set({});
    this.prebuilds.set({});
    this.reconcile(null);
  }
}

function readConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1';
  } catch {
    return false;
  }
}

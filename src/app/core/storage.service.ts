import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { IDBPDatabase, deleteDB, openDB } from 'idb';
import { Subject } from 'rxjs';
import { ToastService } from '../shared/toast';
import { DEFAULT_LAYOUT_ID, applyLayout, defaultActionBarsWithKeys, hasNoSlotKeys, keybindLayout } from './keybind-layouts';
import { DataService } from './data.service';
import { cleanStep, mergeActionBars, migrateLegacyGear, migrateRotation, migrateSettings, normaliseLoadout } from './migrations';
import { ActionBarSetup, BarProfile, BarProfileData, DEFAULT_BAR_PROFILE_ID, DEFAULT_ENEMY, enemyWithStats, activateProfile, profileData, snapshotActiveProfile, DEFAULT_SETTINGS, EnemyConfig, Keybind, LegacyLoadout, Loadout, Prebuild, Rotation, Session, SetupBundle, SetupMeta, Settings, defaultActionBars, migrateLegacyLoadout, newLoadout } from './models';

const DB_NAME = 'rs3trainer';
const CONSENT_KEY = 'rs3trainer.consent';
/** one "could not save" toast per this many ms – a burst of failing puts (quota) is one problem, not twenty */
const WRITE_TOAST_MS = 30_000;
const WRITE_FAILED_TEXT = "Could not save to this browser's storage – your change is kept for this visit only.";
/** local session history: only the newest ones are kept (every session carries a copy of the settings and the loadout) */
export const SESSIONS_KEPT = 50;
const LOAD_FAILED_TEXT = "Could not read this browser's storage – running with defaults, nothing is saved until you reload.";

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
  /** named loadouts; the active one drives the simulation */
  readonly loadouts = signal<Loadout[]>([newLoadout()]);
  readonly activeLoadoutId = signal<string>(this.loadouts()[0].id);
  readonly loadout = computed<Loadout>(() => this.loadouts().find((l) => l.id === this.activeLoadoutId()) ?? this.loadouts()[0]);
  /** simulated enemy for prayer training */
  readonly enemy = signal<EnemyConfig>({ ...DEFAULT_ENEMY });
  /** rotation id → pre-built state the session starts with */
  readonly prebuilds = signal<Record<string, Prebuild>>({});
  /** action bar presets, positions, style bindings, slot + weapon keybinds (the active bar profile) */
  readonly actionBars = signal<ActionBarSetup>(defaultActionBarsWithKeys());
  /** named bar setups, switchable on the Train page */
  readonly barProfiles = computed<BarProfile[]>(() => this.actionBars().profiles ?? []);
  readonly activeBarProfileId = computed(() => this.actionBars().activeProfileId ?? DEFAULT_BAR_PROFILE_ID);
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
      this.ready.set(true);
      return;
    }
    const settings = await this.read('settings', (db) => db.get('settings', 'settings'));
    if (settings) this.settings.set(migrateSettings(settings));

    const stored = await this.read('loadouts', (db) => db.get('settings', 'loadouts') as Promise<{ loadouts: Loadout[]; active: string } | undefined>);
    if (stored?.loadouts?.length) {
      this.loadouts.set(stored.loadouts.map(normaliseLoadout));
      this.activeLoadoutId.set(stored.loadouts.some((l) => l.id === stored.active) ? stored.active : stored.loadouts[0].id);
    } else if (!stored) {
      const legacy = await this.read('loadout', (db) => db.get('settings', 'loadout') as Promise<Partial<LegacyLoadout> | undefined>); // builds before Sept 2026
      if (legacy) {
        const l = migrateLegacyLoadout(legacy);
        this.loadouts.set([l]);
        this.activeLoadoutId.set(l.id);
        await this.write((db) => db.put('settings', { loadouts: [l], active: l.id }, 'loadouts'));
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

    const storedKeybinds = await this.read('keybinds', async (db) => ({ keys: (await db.getAllKeys('keybinds')) as string[], values: (await db.getAll('keybinds')) as Keybind[] }));
    if (storedKeybinds) {
      const { keys, values } = storedKeybinds;
      const keybinds: Record<string, Keybind> = {};
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i].includes(':') ? keys[i] : 'ability:' + keys[i]; // legacy: plain ability ids
        keybinds[k] = values[i];
        if (k !== keys[i]) {
          await this.write((db) => db.delete('keybinds', keys[i]));
          await this.write((db) => db.put('keybinds', values[i], k));
        }
      }
      this.keybinds.set(keybinds);
    }

    const rotations = await this.read('rotations', async (db) => ((await db.getAll('rotations')) as Rotation[]).map(migrateRotation));
    if (rotations) {
      for (const r of rotations) await this.write((db) => db.put('rotations', r));
      this.rotations.set(rotations.sort((a, b) => b.updatedAt - a.updatedAt));
    }

    if (this.loadFailed()) this.toast.show(LOAD_FAILED_TEXT, 'warn', 12_000);
    this.ready.set(true);
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
      await db.put('settings', { loadouts: this.loadouts(), active: this.activeLoadoutId() }, 'loadouts');
      await db.put('settings', this.enemy(), 'enemy');
      await db.put('settings', this.actionBars(), 'actionbars');
      await db.put('settings', this.setupMeta(), 'setupmeta');
      for (const [id, kb] of Object.entries(this.keybinds())) await db.put('keybinds', kb, id);
      for (const r of this.rotations()) await db.put('rotations', r);
    });
  }

  async saveSettings(s: Settings): Promise<void> {
    this.settings.set({ ...s });
    await this.write((db) => db.put('settings', this.settings(), 'settings'));
    await this.touchSetup();
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
    await this.touchSetup();
  }

  /** marks settings / loadouts / enemy as edited and tells the sync */
  private async touchSetup(): Promise<void> {
    await this.putSetupMeta({ ...this.setupMeta(), updatedAt: Date.now() });
    this.setupChanged.next();
  }

  async putSetupMeta(m: SetupMeta): Promise<void> {
    this.setupMeta.set({ ...m });
    await this.write((db) => db.put('settings', this.setupMeta(), 'setupmeta'));
  }

  /** Applies the server copy of settings + loadouts + enemy without firing the sync hook. */
  async putSetup(s: { settings: Settings; loadouts: Loadout[]; activeLoadoutId: string; enemy: EnemyConfig | null }, meta: SetupMeta): Promise<void> {
    this.settings.set(migrateSettings(s.settings ?? {}));
    const list = (s.loadouts ?? []).map(normaliseLoadout);
    this.loadouts.set(list.length ? list : [newLoadout()]);
    this.activeLoadoutId.set(this.loadouts().some((l) => l.id === s.activeLoadoutId) ? s.activeLoadoutId : this.loadouts()[0].id);
    if (s.enemy) this.enemy.set(enemyWithStats(s.enemy));
    await this.write(async (db) => {
      await db.put('settings', this.settings(), 'settings');
      await db.put('settings', { loadouts: this.loadouts(), active: this.activeLoadoutId() }, 'loadouts');
      await db.put('settings', this.enemy(), 'enemy');
    });
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
    await this.write(async (db) => {
      await db.clear('keybinds');
      for (const [key, kb] of Object.entries(keybinds)) await db.put('keybinds', kb, key);
    });
    this.keybindsReplaced.next(keybinds);

    const bars = b.actionBars ? mergeActionBars(b.actionBars) : defaultActionBarsWithKeys();
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
    await this.write((db) => db.put('settings', { loadouts: this.loadouts(), active: this.activeLoadoutId() }, 'loadouts'));
  }

  async saveActionBars(setup: ActionBarSetup): Promise<void> {
    await this.putActionBars(snapshotActiveProfile({ ...setup, updatedAt: Date.now() }));
    this.actionBarsChanged.next(this.actionBars());
  }

  // ---------------------------------------------------------------- bar profiles

  async switchBarProfile(id: string): Promise<void> {
    if (id === this.activeBarProfileId() || !this.barProfiles().some((p) => p.id === id)) return;
    await this.saveActionBars(activateProfile(this.actionBars(), id));
  }

  /**
   * Adds a profile (default: empty bars with the current keys – or, when the current profile has no slot keys at
   * all, the default keyboard layout) and returns its id.
   */
  async addBarProfile(name: string, data?: BarProfileData, presetId?: string): Promise<string> {
    const cur = snapshotActiveProfile(this.actionBars());
    let base = data ?? { ...profileData(cur), ...profileData(defaultActionBars()), slotKeybinds: structuredClone(cur.slotKeybinds), weaponKeybinds: structuredClone(cur.weaponKeybinds), actionKeybinds: structuredClone(cur.actionKeybinds), layout: cur.layout };
    if (!data && hasNoSlotKeys(base)) base = applyLayout(base, keybindLayout(DEFAULT_LAYOUT_ID), { overwrite: false }).data;
    const profile: BarProfile = { ...profileData(base), id: crypto.randomUUID(), name: name.slice(0, 40) || 'Bar setup', presetId };
    await this.saveActionBars({ ...cur, profiles: [...cur.profiles!, profile] });
    return profile.id;
  }

  async renameBarProfile(id: string, name: string): Promise<void> {
    const cur = snapshotActiveProfile(this.actionBars());
    await this.saveActionBars({ ...cur, profiles: cur.profiles!.map((p) => (p.id === id ? { ...p, name: name.slice(0, 40) } : p)) });
  }

  /** Removes a profile; deleting the active one switches to the first remaining. The last profile cannot be deleted. */
  async deleteBarProfile(id: string): Promise<void> {
    const cur = snapshotActiveProfile(this.actionBars());
    const rest = cur.profiles!.filter((p) => p.id !== id);
    if (!rest.length) return;
    const next = { ...cur, profiles: rest };
    await this.saveActionBars(cur.activeProfileId === id ? activateProfile(next, rest[0].id) : next);
  }

  /** Stores the setup as-is (keeps updatedAt / syncedAt) without firing the sync hook. */
  async putActionBars(setup: ActionBarSetup): Promise<void> {
    this.actionBars.set(structuredClone(setup));
    await this.write((db) => db.put('settings', this.actionBars(), 'actionbars'));
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
    await this.write((db) => (kb ? db.put('keybinds', kb, key) : db.delete('keybinds', key)));
  }

  async saveRotation(r: Rotation): Promise<void> {
    const rot = await this.putRotation({ ...r, updatedAt: Date.now() });
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
    this.loadouts.set([newLoadout()]);
    this.activeLoadoutId.set(this.loadouts()[0].id);
    this.enemy.set({ ...DEFAULT_ENEMY });
    this.actionBars.set(defaultActionBarsWithKeys());
    this.setupMeta.set({});
    this.keybinds.set({});
    this.rotations.set([]);
  }
}

function readConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1';
  } catch {
    return false;
  }
}

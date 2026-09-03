import { Injectable, signal } from '@angular/core';
import { IDBPDatabase, deleteDB, openDB } from 'idb';
import { Subject } from 'rxjs';
import { DEFAULT_LOADOUT, DEFAULT_SETTINGS, Keybind, Loadout, Rotation, RotationStep, Session, Settings } from './models';

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
  readonly loadout = signal<Loadout>({ ...DEFAULT_LOADOUT });
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
      const loadout = await db.get('settings', 'loadout');
      if (loadout) this.loadout.set({ ...DEFAULT_LOADOUT, ...loadout });

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
    await db.put('settings', this.loadout(), 'loadout');
    for (const [id, kb] of Object.entries(this.keybinds())) await db.put('keybinds', kb, id);
    for (const r of this.rotations()) await db.put('rotations', r);
  }

  async saveSettings(s: Settings): Promise<void> {
    this.settings.set({ ...s });
    if (this.consent()) await (await this.open()).put('settings', this.settings(), 'settings');
  }

  async saveLoadout(l: Loadout): Promise<void> {
    this.loadout.set({ ...l });
    if (this.consent()) await (await this.open()).put('settings', this.loadout(), 'loadout');
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
    const rot: Rotation = { ...r, steps: r.steps.map((s) => ({ kind: s.kind, id: s.id })) };
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
    this.loadout.set({ ...DEFAULT_LOADOUT });
    this.keybinds.set({});
    this.rotations.set([]);
  }
}

/** Older builds stored `queueWindowTicks` (1..3) instead of the in-game on/off setting. */
function migrateSettings(stored: Partial<Settings> & { queueWindowTicks?: number }): Settings {
  const { queueWindowTicks, ...rest } = stored;
  const s: Settings = { ...DEFAULT_SETTINGS, ...rest };
  if (typeof queueWindowTicks === 'number' && typeof stored.abilityQueueing !== 'boolean') s.abilityQueueing = queueWindowTicks >= 3;
  return s;
}

/** Older builds stored steps as plain ability ids. */
function migrateRotation(r: Rotation & { steps: (string | RotationStep)[] }): Rotation {
  return { ...r, steps: r.steps.map((s) => (typeof s === 'string' ? { kind: 'ability', id: s } : s)) };
}

function readConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1';
  } catch {
    return false;
  }
}

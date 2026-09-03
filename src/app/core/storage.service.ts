import { Injectable, signal } from '@angular/core';
import { IDBPDatabase, deleteDB, openDB } from 'idb';
import { DEFAULT_SETTINGS, Keybind, Rotation, Session, Settings } from './models';

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
  readonly keybinds = signal<Record<string, Keybind>>({});
  readonly rotations = signal<Rotation[]>([]);

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
      const keys = (await db.getAllKeys('keybinds')) as string[];
      const values = (await db.getAll('keybinds')) as Keybind[];
      this.keybinds.set(Object.fromEntries(keys.map((k, i) => [k, values[i]])));
      const rotations = (await db.getAll('rotations')) as Rotation[];
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
    for (const [id, kb] of Object.entries(this.keybinds())) await db.put('keybinds', kb, id);
    for (const r of this.rotations()) await db.put('rotations', r);
  }

  async saveSettings(s: Settings): Promise<void> {
    this.settings.set({ ...s });
    if (this.consent()) await (await this.open()).put('settings', this.settings(), 'settings');
  }

  async setKeybind(abilityId: string, kb: Keybind | null): Promise<void> {
    const next = { ...this.keybinds() };
    if (kb) next[abilityId] = kb;
    else delete next[abilityId];
    this.keybinds.set(next);
    if (this.consent()) {
      const db = await this.open();
      if (kb) await db.put('keybinds', kb, abilityId);
      else await db.delete('keybinds', abilityId);
    }
  }

  async saveRotation(r: Rotation): Promise<void> {
    const rot = { ...r, steps: [...r.steps], updatedAt: Date.now() };
    this.rotations.set([rot, ...this.rotations().filter((x) => x.id !== rot.id)]);
    if (this.consent()) await (await this.open()).put('rotations', rot);
  }

  async deleteRotation(id: string): Promise<void> {
    this.rotations.set(this.rotations().filter((x) => x.id !== id));
    if (this.consent()) await (await this.open()).delete('rotations', id);
  }

  async addSession(s: Session): Promise<void> {
    if (this.consent()) await (await this.open()).add('sessions', s);
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

function readConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1';
  } catch {
    return false;
  }
}

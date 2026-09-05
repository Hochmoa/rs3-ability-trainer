import { Injectable, effect, inject, signal } from '@angular/core';
import { DataService } from './data.service';
import { Keybind, Rotation, Session } from './models';
import { StorageService } from './storage.service';
import { SupabaseService, errorText } from './supabase.service';

/** Row shape of public.rotations / public.public_rotations. */
export interface RotationRow {
  id: string;
  owner_id?: string;
  name: string;
  steps: Rotation['steps'];
  is_public: boolean;
  source_id: string | null;
  styles: string[];
  copies: number;
  updated_at: string;
  owner_name?: string;
}

/** clock skew we tolerate before calling a local edit "newer" than the server copy */
const SKEW_MS = 5000;

export type RotationMergeDecision = 'upload' | 'download' | 'delete';

/**
 * What happens to one local rotation on login, given the server's `updated_at` (ms) of the same id – or null when
 * the server has no such row:
 * - not on the server: synced before → it was deleted on another device → delete locally; never synced → upload
 * - synced before and edited after that sync, clearly newer than the server copy → upload
 * - never synced but edited clearly after the server copy → upload
 * - otherwise the server copy wins → download
 */
export function decideRotationMerge(mine: Pick<Rotation, 'updatedAt' | 'syncedAt'>, serverMs: number | null): RotationMergeDecision {
  if (serverMs === null) return mine.syncedAt !== undefined ? 'delete' : 'upload';
  if (mine.syncedAt !== undefined && mine.updatedAt > mine.syncedAt && mine.updatedAt > serverMs + SKEW_MS) return 'upload';
  if (mine.syncedAt === undefined && mine.updatedAt > serverMs + SKEW_MS) return 'upload';
  return 'download';
}

/**
 * Mirrors rotations, keybinds and session summaries to Supabase while logged in.
 * Local IndexedDB stays the cache; the server is the truth once a user is signed in:
 * on login the account's rows are pulled, local-only rows are uploaded, and for the same id
 * the newer updatedAt wins. Every later edit goes local first, then to the server.
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private storage = inject(StorageService);
  private supabase = inject(SupabaseService);
  private data = inject(DataService);

  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastSync = signal<number | null>(null);

  private get uid(): string | null {
    return this.supabase.user()?.id ?? null;
  }

  constructor() {
    let last: string | null = null;
    effect(() => {
      const uid = this.supabase.user()?.id ?? null;
      const ready = this.storage.ready();
      if (!ready || uid === last) return;
      last = uid;
      if (uid) void this.pullAndMerge();
    });
    this.storage.rotationSaved.subscribe((r) => void this.guard(() => this.upsertRotation(r)));
    this.storage.rotationDeleted.subscribe((id) => void this.guard(() => this.deleteRotation(id)));
    this.storage.keybindChanged.subscribe(({ key, kb }) => void this.guard(() => this.upsertKeybind(key, kb)));
    this.storage.keybindsReplaced.subscribe((kb) => void this.guard(() => this.replaceKeybinds(kb)));
    this.storage.sessionAdded.subscribe((s) => void this.guard(() => this.uploadSession(s)));
  }

  private async guard(fn: () => Promise<void>): Promise<void> {
    if (!this.uid) return;
    try {
      await fn();
      this.error.set(null);
    } catch (err) {
      console.error('sync failed', err);
      this.error.set(errorText(err));
    }
  }

  // ------------------------------------------------------------------ merge on login

  async pullAndMerge(): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    this.syncing.set(true);
    try {
      await this.mergeRotations(uid);
      await this.mergeKeybinds(uid);
      this.lastSync.set(Date.now());
      this.error.set(null);
    } catch (err) {
      console.error('sync failed', err);
      this.error.set(errorText(err));
    } finally {
      this.syncing.set(false);
    }
  }

  private async mergeRotations(uid: string): Promise<void> {
    const { data, error } = await (await this.supabase.db()).from('rotations').select('*').eq('owner_id', uid);
    if (error) throw error;
    const server = new Map((data as RotationRow[]).map((r) => [r.id, r]));
    const local = new Map(this.storage.rotations().map((r) => [r.id, r]));

    for (const [id, row] of server) {
      const mine = local.get(id);
      if (mine && decideRotationMerge(mine, Date.parse(row.updated_at)) === 'upload') await this.upsertRotation(mine);
      else await this.storage.putRotation(this.fromRow(row, mine));
    }
    for (const [id, mine] of local) {
      if (server.has(id)) continue;
      if (decideRotationMerge(mine, null) === 'delete') await this.storage.removeRotation(id);
      else await this.upsertRotation(mine);
    }
  }

  private async mergeKeybinds(uid: string): Promise<void> {
    const { data, error } = await (await this.supabase.db()).from('keybinds').select('entity_key, keybind, updated_at').eq('user_id', uid);
    if (error) throw error;
    const server = new Map((data as { entity_key: string; keybind: Keybind }[]).map((k) => [k.entity_key, k.keybind]));
    const local = this.storage.keybinds();
    for (const [key, kb] of server) await this.storage.putKeybind(key, kb);
    const missing = Object.entries(local).filter(([key]) => !server.has(key));
    if (missing.length) {
      const rows = missing.map(([entity_key, keybind]) => ({ user_id: uid, entity_key, keybind }));
      const res = await (await this.supabase.db()).from('keybinds').upsert(rows);
      if (res.error) throw res.error;
    }
  }

  // ------------------------------------------------------------------ single writes

  async upsertRotation(r: Rotation): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const row = {
      id: r.id,
      owner_id: uid,
      name: r.name,
      steps: r.steps,
      is_public: r.isPublic ?? true,
      source_id: r.sourceId ?? null,
      styles: this.stylesOf(r),
    };
    const { data, error } = await (await this.supabase.db()).from('rotations').upsert(row).select('updated_at, copies').single();
    if (error) throw error;
    const ms = Date.parse((data as { updated_at: string }).updated_at);
    await this.storage.putRotation({ ...r, updatedAt: ms, syncedAt: ms, copies: (data as { copies: number }).copies });
  }

  async deleteRotation(id: string): Promise<void> {
    const { error } = await (await this.supabase.db()).from('rotations').delete().eq('id', id);
    if (error) throw error;
  }

  async upsertKeybind(key: string, kb: Keybind | null): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const q = kb
      ? (await this.supabase.db()).from('keybinds').upsert({ user_id: uid, entity_key: key, keybind: kb, updated_at: new Date().toISOString() })
      : (await this.supabase.db()).from('keybinds').delete().eq('user_id', uid).eq('entity_key', key);
    const { error } = await q;
    if (error) throw error;
  }

  /** Replaces all keybinds of the account (after loading another user's setup). */
  async replaceKeybinds(keybinds: Record<string, Keybind>): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const del = await (await this.supabase.db()).from('keybinds').delete().eq('user_id', uid);
    if (del.error) throw del.error;
    const rows = Object.entries(keybinds).map(([entity_key, keybind]) => ({ user_id: uid, entity_key, keybind }));
    if (rows.length) {
      const { error } = await (await this.supabase.db()).from('keybinds').upsert(rows);
      if (error) throw error;
    }
  }

  async uploadSession(s: Session): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const count = (o: string) => s.results.filter((r) => r.outcome === o).length;
    const clean = s.results.filter((r) => r.outcome === 'perfect' || r.outcome === 'done').length;
    const row = {
      user_id: uid,
      rotation_id: this.storage.rotations().some((r) => r.id === s.rotationId && r.syncedAt !== undefined) ? s.rotationId : null,
      rotation_name: s.rotationName,
      accuracy: s.results.length ? Math.round((clean / s.results.length) * 10000) / 100 : 0,
      perfect: count('perfect'),
      late: count('late'),
      too_early: s.results.reduce((n, r) => n + r.tooEarly, 0),
      wrong: s.results.reduce((n, r) => n + r.wrong, 0),
      missed: count('missed'),
      settings: s.settings,
      loadout: s.loadout ?? null,
      results: s.results,
      started_at: new Date(s.startedAt).toISOString(),
      ended_at: new Date(s.endedAt).toISOString(),
    };
    const { error } = await (await this.supabase.db()).from('sessions').insert(row);
    if (error) throw error;
  }

  // ------------------------------------------------------------------ explorer

  async explore(opts: { search?: string; style?: string; sort: 'new' | 'copies' }): Promise<RotationRow[]> {
    let q = (await this.supabase.db()).from('public_rotations').select('*').limit(60);
    if (opts.search?.trim()) q = q.ilike('name', '%' + opts.search.trim().replace(/[%_]/g, '') + '%');
    if (opts.style) q = q.contains('styles', [opts.style]);
    q = opts.sort === 'copies' ? q.order('copies', { ascending: false }).order('updated_at', { ascending: false }) : q.order('updated_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return data as RotationRow[];
  }

  /** Copies an explorer rotation into "my rotations": through the RPC when logged in (counts the copy), else locally. */
  async copyFromExplorer(row: RotationRow): Promise<Rotation> {
    const id = crypto.randomUUID();
    if (this.uid) {
      const { data, error } = await (await this.supabase.db()).rpc('copy_rotation', { source: row.id, new_id: id });
      if (error) throw error;
      const copy = this.fromRow(data as RotationRow, undefined);
      copy.sourceName = row.name;
      copy.sourceOwner = row.owner_name;
      return this.storage.putRotation(copy);
    }
    return this.storage.putRotation({
      id,
      name: row.name,
      steps: row.steps,
      updatedAt: Date.now(),
      isPublic: false,
      sourceId: row.id,
      sourceName: row.name,
      sourceOwner: row.owner_name,
    });
  }

  stylesOf(r: Rotation): string[] {
    const set = new Set<string>();
    for (const s of r.steps) {
      const e = this.data.step(s);
      if (e?.ability) set.add(e.ability.style);
    }
    return [...set];
  }

  private fromRow(row: RotationRow, local: Rotation | undefined): Rotation {
    const ms = Date.parse(row.updated_at);
    return {
      id: row.id,
      name: row.name,
      steps: row.steps,
      updatedAt: ms,
      syncedAt: ms,
      isPublic: row.is_public,
      sourceId: row.source_id ?? undefined,
      sourceName: local?.sourceName,
      sourceOwner: local?.sourceOwner,
      copies: row.copies,
    };
  }
}

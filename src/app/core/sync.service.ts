import { Injectable, effect, inject, signal } from '@angular/core';
import { Loadout, ProfileKind, Rotation, SETUP_SEPARATOR, Session, Setup, newSetup } from './models';
import { necroPrebuild } from './presets.service';
import { StorageService } from './storage.service';
import { SessionTrace } from './trace';
import { SupabaseService, errorText } from './supabase.service';

/** Row shape of public.setups (the loadout travels inside the row). */
export interface SetupRow {
  id: string;
  owner_id?: string;
  boss: string;
  name: string;
  style: string;
  loadout: Loadout;
  is_public: boolean;
  source_id: string | null;
  preset_id: string | null;
  updated_at: string;
}

/** Row shape of public.rotations. */
export interface RotationRow {
  id: string;
  owner_id?: string;
  setup_id: string | null;
  name: string;
  steps: Rotation['steps'];
  position: number | null;
  updated_at: string;
}

/** Row of the public_setups view: what the Setups page lists (no loadout – that is fetched on demand). */
export interface PublicSetupRow {
  id: string;
  owner_id: string;
  owner_name: string;
  /** 'guide' = the PVME guide account */
  owner_kind: ProfileKind;
  boss: string;
  name: string;
  style: string;
  preset_id: string | null;
  rotation_count: number;
  rotation_names: string[];
  updated_at: string;
}

/** Row of the setup_users view: every account with at least one public setup. */
export interface SetupUserRow {
  owner_id: string;
  display_name: string;
  kind: ProfileKind;
  setups: number;
  updated_at: string;
}

/** A server setup with its rotations – what "Use this setup" copies. */
export interface FetchedSetup {
  setup: SetupRow;
  rotations: RotationRow[];
}

/** A server row as a local rotation; `local` carries what only the browser knows. */
export function rotationFromRow(row: RotationRow, local: Pick<Rotation, 'setupId'> | undefined): Rotation {
  const ms = Date.parse(row.updated_at);
  const r: Rotation = { id: row.id, name: row.name, steps: row.steps, updatedAt: ms, syncedAt: ms, setupId: row.setup_id ?? local?.setupId ?? '' };
  if (row.position !== null && row.position !== undefined) r.presetIndex = row.position;
  return r;
}

/** A server row as a local setup; the copy's origin (name, owner) stays local. */
export function setupFromRow(row: SetupRow, local: Pick<Setup, 'sourceName' | 'sourceOwner' | 'sourceOwnerKind'> | undefined): Setup {
  const ms = Date.parse(row.updated_at);
  return {
    id: row.id,
    boss: row.boss,
    name: row.name,
    style: row.style,
    loadoutId: row.loadout.id,
    isPublic: row.is_public,
    sourceId: row.source_id ?? undefined,
    presetId: row.preset_id ?? undefined,
    sourceName: local?.sourceName,
    sourceOwner: local?.sourceOwner,
    sourceOwnerKind: local?.sourceOwnerKind,
    updatedAt: ms,
    syncedAt: ms,
  };
}

/** clock skew we tolerate before calling a local edit "newer" than the server copy */
const SKEW_MS = 5000;

export type MergeDecision = 'upload' | 'download' | 'delete';

/**
 * What happens to one local row (setup or rotation) on login, given the server's `updated_at` (ms) of the same id
 * – or null when the server has no such row:
 * - not on the server: synced before → it was deleted on another device → delete locally; never synced → upload
 * - synced before and edited after that sync, clearly newer than the server copy → upload
 * - never synced but edited clearly after the server copy → upload
 * - otherwise the server copy wins → download
 */
export function decideMerge(mine: { updatedAt: number; syncedAt?: number }, serverMs: number | null): MergeDecision {
  if (serverMs === null) return mine.syncedAt !== undefined ? 'delete' : 'upload';
  if (mine.syncedAt !== undefined && mine.updatedAt > mine.syncedAt && mine.updatedAt > serverMs + SKEW_MS) return 'upload';
  if (mine.syncedAt === undefined && mine.updatedAt > serverMs + SKEW_MS) return 'upload';
  return 'download';
}

/**
 * Mirrors setups (with their loadouts), rotations and session summaries to Supabase while logged in, and reads the
 * public setups for the Setups page. Local IndexedDB stays the cache; the server is the truth once a user is
 * signed in: on login the account's rows are pulled, local-only rows are uploaded, and for the same id the newer
 * updatedAt wins. Every later edit goes local first, then to the server – writes run one after the other, so a
 * rotation never reaches the server before the setup it belongs to.
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private storage = inject(StorageService);
  private supabase = inject(SupabaseService);

  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastSync = signal<number | null>(null);

  /** the write queue: one server write at a time, in the order the edits happened */
  private chain: Promise<void> = Promise.resolve();

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
    this.storage.setupSaved.subscribe((s) => this.guard(() => this.upsertSetup(s)));
    this.storage.setupDeleted.subscribe((id) => this.guard(() => this.deleteSetup(id)));
    this.storage.rotationSaved.subscribe((r) => this.guard(() => this.upsertRotation(r)));
    this.storage.rotationDeleted.subscribe((id) => this.guard(() => this.deleteRotation(id)));
    this.storage.sessionAdded.subscribe((s) => this.guard(() => this.uploadSession(s)));
    this.storage.traceAdded.subscribe((t) => this.guard(() => this.uploadTrace(t)));
  }

  private guard(fn: () => Promise<void>): void {
    if (!this.uid) return;
    this.chain = this.chain.then(async () => {
      if (!this.uid) return;
      try {
        await fn();
        this.error.set(null);
      } catch (err) {
        console.error('sync failed', err);
        this.error.set(errorText(err));
      }
    });
  }

  // ------------------------------------------------------------------ merge on login

  async pullAndMerge(): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    this.syncing.set(true);
    try {
      await this.chain;
      await this.mergeSetups(uid);
      await this.mergeRotations(uid);
      // rows from before the setups (no setup_id) are given a home and the assignment goes back up
      for (const r of await this.storage.reconcileAfterSync()) await this.upsertRotation(r);
      this.lastSync.set(Date.now());
      this.error.set(null);
    } catch (err) {
      console.error('sync failed', err);
      this.error.set(errorText(err));
    } finally {
      this.syncing.set(false);
    }
  }

  private async mergeSetups(uid: string): Promise<void> {
    const { data, error } = await (await this.supabase.db()).from('setups').select('*').eq('owner_id', uid);
    if (error) throw error;
    const server = new Map((data as SetupRow[]).map((r) => [r.id, r]));
    const local = new Map(this.storage.setups().map((s) => [s.id, s]));

    for (const [id, row] of server) {
      const mine = local.get(id);
      if (mine && decideMerge(mine, Date.parse(row.updated_at)) === 'upload') await this.upsertSetup(mine);
      else {
        await this.storage.putLoadout(row.loadout);
        await this.storage.putSetup(setupFromRow(row, mine));
      }
    }
    for (const [id, mine] of local) {
      if (server.has(id)) continue;
      if (decideMerge(mine, null) === 'delete') await this.storage.removeSetup(id);
      else await this.upsertSetup(mine);
    }
  }

  private async mergeRotations(uid: string): Promise<void> {
    const { data, error } = await (await this.supabase.db()).from('rotations').select('*').eq('owner_id', uid);
    if (error) throw error;
    const server = new Map((data as RotationRow[]).map((r) => [r.id, r]));
    const local = new Map(this.storage.rotations().map((r) => [r.id, r]));

    for (const [id, row] of server) {
      const mine = local.get(id);
      // a row from before the setups (no setup_id) whose local copy already found its home: the home goes back up,
      // otherwise the merge keeps the local setupId and the server row stays homeless for good (audit of 9 Sep 2026)
      const homeless = !row.setup_id && !!mine?.setupId;
      if (mine && (homeless || decideMerge(mine, Date.parse(row.updated_at)) === 'upload')) await this.upsertRotation(mine);
      else await this.storage.putRotation(rotationFromRow(row, mine));
    }
    for (const [id, mine] of local) {
      if (server.has(id)) continue;
      if (decideMerge(mine, null) === 'delete') await this.storage.removeRotation(id);
      else await this.upsertRotation(mine);
    }
  }

  // ------------------------------------------------------------------ single writes

  async upsertSetup(s: Setup): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const loadout = this.storage.loadoutOf(s);
    if (!loadout) return;
    const row = {
      id: s.id,
      owner_id: uid,
      boss: s.boss,
      name: s.name,
      style: s.style,
      loadout,
      is_public: s.isPublic ?? false,
      source_id: s.sourceId ?? null,
      preset_id: s.presetId ?? null,
    };
    const { data, error } = await (await this.supabase.db()).from('setups').upsert(row).select('updated_at').single();
    if (error) throw error;
    const ms = Date.parse((data as { updated_at: string }).updated_at);
    const cur = this.storage.setups().find((x) => x.id === s.id) ?? s;
    await this.storage.putSetup({ ...cur, updatedAt: ms, syncedAt: ms });
  }

  async deleteSetup(id: string): Promise<void> {
    const { error } = await (await this.supabase.db()).from('setups').delete().eq('id', id);
    if (error) throw error;
  }

  async upsertRotation(r: Rotation): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    // the setup row must exist before a rotation can point to it
    const setup = this.storage.setups().find((s) => s.id === r.setupId);
    if (setup && setup.syncedAt === undefined) await this.upsertSetup(setup);
    const row = {
      id: r.id,
      owner_id: uid,
      setup_id: setup ? r.setupId : null,
      name: r.name,
      steps: r.steps,
      position: r.presetIndex ?? null,
    };
    const { data, error } = await (await this.supabase.db()).from('rotations').upsert(row).select('updated_at').single();
    if (error) throw error;
    const ms = Date.parse((data as { updated_at: string }).updated_at);
    const cur = this.storage.rotations().find((x) => x.id === r.id) ?? r;
    await this.storage.putRotation({ ...cur, updatedAt: ms, syncedAt: ms });
  }

  async deleteRotation(id: string): Promise<void> {
    const { error } = await (await this.supabase.db()).from('rotations').delete().eq('id', id);
    if (error) throw error;
  }

  /** the session trace (core/trace.ts) as it is; the server keeps the last 20 per account (0022) */
  async uploadTrace(t: SessionTrace): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const row = {
      id: t.id,
      user_id: uid,
      started_at: new Date(t.startedAt).toISOString(),
      ended_at: t.endedAt ? new Date(t.endedAt).toISOString() : null,
      rotation_name: t.rotation.name.slice(0, 120),
      build: t.build.slice(0, 60),
      reason: t.reason,
      events: t.events.length,
      trace: t,
    };
    const { error } = await (await this.supabase.db()).from('session_traces').insert(row);
    if (error) throw error;
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

  // ------------------------------------------------------------------ the Setups page

  /** Every public setup, newest first – the whole list, the page filters it (a few hundred rows at most). */
  async listPublicSetups(): Promise<PublicSetupRow[]> {
    const { data, error } = await (await this.supabase.db()).from('public_setups').select('*').order('boss').order('name').limit(2000);
    if (error) throw error;
    return data as PublicSetupRow[];
  }

  /** Every account with at least one public setup; the guide account first. */
  async listSetupUsers(): Promise<SetupUserRow[]> {
    const { data, error } = await (await this.supabase.db()).from('setup_users').select('*').order('kind', { ascending: false }).order('setups', { ascending: false }).limit(1000);
    if (error) throw error;
    return data as SetupUserRow[];
  }

  /** A public setup with its loadout and rotations (RLS lets everyone read the rows of a public setup). */
  async fetchSetup(id: string): Promise<FetchedSetup | null> {
    const db = await this.supabase.db();
    const { data, error } = await db.from('setups').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const rot = await db.from('rotations').select('*').eq('setup_id', id).order('position').order('name');
    if (rot.error) throw rot.error;
    return { setup: data as SetupRow, rotations: rot.data as RotationRow[] };
  }

  /**
   * "Use this setup": a copy of a public setup – loadout and rotations – under new ids, as the player's own. The
   * copy is saved locally and, while signed in, uploaded like any edit. Necromancy fight rotations get the pre-build
   * PvME assumes (12 Necrosis, 5 souls, the conjures out), exactly as the preset import does.
   */
  async copySetup(f: FetchedSetup, origin: { ownerName: string; ownerKind: ProfileKind }): Promise<Setup> {
    const src = f.setup;
    const loadout: Loadout = { ...structuredClone(src.loadout), id: crypto.randomUUID() };
    const setup = newSetup({
      boss: src.boss,
      name: src.name,
      style: src.style,
      loadoutId: loadout.id,
      isPublic: false,
      presetId: src.preset_id ?? undefined,
      sourceId: src.id,
      sourceName: setupTitleOf(src),
      sourceOwner: origin.ownerName,
      sourceOwnerKind: origin.ownerKind,
    });
    await this.storage.addSetup(setup, loadout);
    const now = Date.now();
    const rotations = [...f.rotations].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    for (const [i, row] of rotations.entries()) {
      const r: Rotation = { id: crypto.randomUUID(), name: row.name, steps: row.steps, updatedAt: now - i, setupId: setup.id, presetIndex: row.position ?? i };
      await this.storage.saveRotation(r);
      if (/necromancy/i.test(src.style) && !PREBUILD_ROTATION.test(r.name)) await this.storage.savePrebuild(r.id, necroPrebuild(r.steps));
    }
    return setup;
  }
}

/** rotation names PvME uses for what happens before the fight – those build the state, the others assume it */
const PREBUILD_ROTATION = /pre-?build|pre-?fight|war'?s? retreat|^[^–]*–\s*wars?\b|prep|pre-?kill|fort forinthry/i;

function setupTitleOf(s: Pick<SetupRow, 'boss' | 'name'>): string {
  return s.boss ? s.boss + SETUP_SEPARATOR + s.name : s.name;
}

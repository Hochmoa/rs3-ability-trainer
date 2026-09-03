import { Injectable, effect, inject, signal } from '@angular/core';
import { ActionBarSetup } from './models';
import { StorageService } from './storage.service';
import { SupabaseService, errorText } from './supabase.service';

/** clock skew we tolerate before calling a local edit "newer" than the server copy */
const SKEW_MS = 5000;
/** drag & drop fires many saves in a row – one upload per pause */
const DEBOUNCE_MS = 800;

export type BarsMergeDecision = 'upload' | 'download' | 'nothing';

/**
 * Which side wins for the single action-bar document.
 * - no server copy: upload if the local setup was ever edited
 * - local edited after its last sync and newer than the server: upload
 * - never synced but edited after the server copy: upload
 * - otherwise the server copy wins
 */
export function decideBarsMerge(local: Pick<ActionBarSetup, 'updatedAt' | 'syncedAt'>, serverMs: number | null): BarsMergeDecision {
  if (serverMs === null) return local.updatedAt ? 'upload' : 'nothing';
  const edited = local.updatedAt ?? 0;
  if (local.syncedAt !== undefined && edited > local.syncedAt && edited > serverMs + SKEW_MS) return 'upload';
  if (local.syncedAt === undefined && edited > serverMs + SKEW_MS) return 'upload';
  return 'download';
}

/** Mirrors the action bar setup to Supabase (table action_bars) while logged in. */
@Injectable({ providedIn: 'root' })
export class BarsSyncService {
  private storage = inject(StorageService);
  private supabase = inject(SupabaseService);

  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);

  private timer = 0;

  private get uid(): string | null {
    return this.supabase.user()?.id ?? null;
  }

  constructor() {
    let last: string | null = null;
    effect(() => {
      const uid = this.supabase.user()?.id ?? null;
      if (!this.storage.ready() || uid === last) return;
      last = uid;
      if (uid) void this.pullAndMerge();
    });
    this.storage.actionBarsChanged.subscribe(() => this.scheduleUpload());
  }

  async pullAndMerge(): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    this.syncing.set(true);
    try {
      const { data, error } = await this.supabase.client.from('action_bars').select('setup, updated_at').eq('user_id', uid).maybeSingle();
      if (error) throw error;
      const row = data as { setup: ActionBarSetup; updated_at: string } | null;
      const serverMs = row ? Date.parse(row.updated_at) : null;
      const local = this.storage.actionBars();
      switch (decideBarsMerge(local, serverMs)) {
        case 'upload':
          await this.upload(local);
          break;
        case 'download':
          await this.storage.putActionBars({ ...row!.setup, updatedAt: serverMs!, syncedAt: serverMs! });
          break;
      }
      this.error.set(null);
    } catch (err) {
      console.error('action bar sync failed', err);
      this.error.set(errorText(err));
    } finally {
      this.syncing.set(false);
    }
  }

  private scheduleUpload(): void {
    if (!this.uid) return;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.uploadCurrent(), DEBOUNCE_MS);
  }

  private async uploadCurrent(): Promise<void> {
    if (!this.uid) return;
    try {
      await this.upload(this.storage.actionBars());
      this.error.set(null);
    } catch (err) {
      console.error('action bar upload failed', err);
      this.error.set(errorText(err));
    }
  }

  private async upload(setup: ActionBarSetup): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const { syncedAt: _synced, ...doc } = setup;
    const { data, error } = await this.supabase.client
      .from('action_bars')
      .upsert({ user_id: uid, setup: doc })
      .select('updated_at')
      .single();
    if (error) throw error;
    const serverMs = Date.parse((data as { updated_at: string }).updated_at);
    // remember the server time without firing the change hook again
    await this.storage.putActionBars({ ...this.storage.actionBars(), syncedAt: serverMs });
  }
}

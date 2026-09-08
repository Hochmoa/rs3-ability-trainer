import { Injectable, effect, inject, signal } from '@angular/core';
import { EnemyConfig, Settings } from './models';
import { StorageService } from './storage.service';
import { SupabaseService, errorText } from './supabase.service';

/** clock skew we tolerate before calling a local edit "newer" than the server copy */
const SKEW_MS = 5000;
/** sliders and checkboxes fire many saves in a row – one upload per pause */
const DEBOUNCE_MS = 800;

/**
 * Mirrors the settings and the enemy config to Supabase (table user_settings, one private row per account) while
 * logged in. Setups, rotations, action bars have their own sync services; nothing here is ever visible to others.
 */
@Injectable({ providedIn: 'root' })
export class SettingsSyncService {
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
    this.storage.settingsChanged.subscribe(() => this.scheduleUpload());
  }

  async pullAndMerge(): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    this.syncing.set(true);
    try {
      const { data, error } = await (await this.supabase.db()).from('user_settings').select('settings, enemy, updated_at').eq('user_id', uid).maybeSingle();
      if (error) throw error;
      const row = data as { settings: Settings; enemy: EnemyConfig | null; updated_at: string } | null;
      if (!row) {
        await this.upload(); // first login: the local settings become the account's
      } else {
        const serverMs = Date.parse(row.updated_at);
        const meta = this.storage.setupMeta();
        const edited = meta.updatedAt ?? 0;
        const localNewer = (meta.syncedAt !== undefined && edited > meta.syncedAt && edited > serverMs + SKEW_MS) || (meta.syncedAt === undefined && edited > serverMs + SKEW_MS);
        if (localNewer) await this.upload();
        else await this.storage.putSettingsDoc({ settings: row.settings, enemy: row.enemy }, { updatedAt: serverMs, syncedAt: serverMs });
      }
      this.error.set(null);
    } catch (err) {
      console.error('settings sync failed', err);
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
      await this.upload();
      this.error.set(null);
    } catch (err) {
      console.error('settings upload failed', err);
      this.error.set(errorText(err));
    }
  }

  private async upload(): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const row = { user_id: uid, settings: this.storage.settings(), enemy: this.storage.enemy() };
    const { data, error } = await (await this.supabase.db()).from('user_settings').upsert(row).select('updated_at').single();
    if (error) throw error;
    const serverMs = Date.parse((data as { updated_at: string }).updated_at);
    await this.storage.putSetupMeta({ ...this.storage.setupMeta(), syncedAt: serverMs });
  }
}

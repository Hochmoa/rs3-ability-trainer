import { Injectable, effect, inject, signal } from '@angular/core';
import { ActionBarSetup, EnemyConfig, Keybind, Loadout, SetupBundle, Settings } from './models';
import { StorageService } from './storage.service';
import { SupabaseService, errorText } from './supabase.service';

/** clock skew we tolerate before calling a local edit "newer" than the server copy */
const SKEW_MS = 5000;
/** sliders and checkboxes fire many saves in a row – one upload per pause */
const DEBOUNCE_MS = 800;

/** Row of list_public_setups(). */
export interface PublicSetupRow {
  user_id: string;
  display_name: string;
  updated_at: string;
  settings: Settings;
  loadout_names: string[];
  keybinds: number;
  has_action_bars: boolean;
}

/** Result of get_public_setup(): everything a user shares. */
export interface PublicSetup {
  user_id: string;
  display_name: string;
  updated_at: string;
  settings: Settings;
  loadouts: { loadouts: Loadout[]; active: string };
  enemy: EnemyConfig | null;
  keybinds: Record<string, Keybind>;
  action_bars: ActionBarSetup | null;
}

/**
 * Mirrors settings, loadouts and the enemy config to Supabase (table setups) while logged in, and
 * reads the public overview. Keybinds and action bars have their own sync services; the public
 * read path for them is the get_public_setup() function.
 */
@Injectable({ providedIn: 'root' })
export class SetupSyncService {
  private storage = inject(StorageService);
  private supabase = inject(SupabaseService);

  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);
  /** whether the own setup is listed on the Setups page (null = unknown / not signed in) */
  readonly isPublic = signal<boolean | null>(null);

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
      else this.isPublic.set(null);
    });
    this.storage.setupChanged.subscribe(() => this.scheduleUpload());
  }

  async pullAndMerge(): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    this.syncing.set(true);
    try {
      const { data, error } = await this.supabase.client.from('setups').select('settings, loadouts, enemy, is_public, updated_at').eq('user_id', uid).maybeSingle();
      if (error) throw error;
      const row = data as { settings: Settings; loadouts: { loadouts: Loadout[]; active: string }; enemy: EnemyConfig | null; is_public: boolean; updated_at: string } | null;
      if (!row) {
        await this.upload(); // first login after the feature: the local setup becomes the account's
        this.isPublic.set(true);
      } else {
        this.isPublic.set(row.is_public);
        const serverMs = Date.parse(row.updated_at);
        const meta = this.storage.setupMeta();
        const edited = meta.updatedAt ?? 0;
        const localNewer = (meta.syncedAt !== undefined && edited > meta.syncedAt && edited > serverMs + SKEW_MS) || (meta.syncedAt === undefined && edited > serverMs + SKEW_MS);
        if (localNewer) await this.upload();
        else await this.storage.putSetup({ settings: row.settings, loadouts: row.loadouts.loadouts, activeLoadoutId: row.loadouts.active, enemy: row.enemy }, { updatedAt: serverMs, syncedAt: serverMs });
      }
      this.error.set(null);
    } catch (err) {
      console.error('setup sync failed', err);
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
      console.error('setup upload failed', err);
      this.error.set(errorText(err));
    }
  }

  private async upload(): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const row = {
      user_id: uid,
      settings: this.storage.settings(),
      loadouts: { loadouts: this.storage.loadouts(), active: this.storage.activeLoadoutId() },
      enemy: this.storage.enemy(),
    };
    const { data, error } = await this.supabase.client.from('setups').upsert(row).select('updated_at').single();
    if (error) throw error;
    const serverMs = Date.parse((data as { updated_at: string }).updated_at);
    await this.storage.putSetupMeta({ ...this.storage.setupMeta(), syncedAt: serverMs });
  }

  /** Lists / hides the own setup on the Setups page. */
  async setPublic(value: boolean): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const { error } = await this.supabase.client.from('setups').update({ is_public: value }).eq('user_id', uid);
    if (error) throw error;
    this.isPublic.set(value);
  }

  // ------------------------------------------------------------------ public overview

  async list(): Promise<PublicSetupRow[]> {
    const { data, error } = await this.supabase.client.rpc('list_public_setups');
    if (error) throw error;
    return (data ?? []) as PublicSetupRow[];
  }

  async get(userId: string): Promise<PublicSetup | null> {
    const { data, error } = await this.supabase.client.rpc('get_public_setup', { target: userId });
    if (error) throw error;
    return (data as PublicSetup | null) ?? null;
  }

  /** Replaces the whole local setup with another user's; while signed in the own online copy follows. */
  async loadIntoMine(s: PublicSetup): Promise<void> {
    const bundle: SetupBundle = {
      settings: s.settings,
      loadouts: s.loadouts?.loadouts ?? [],
      activeLoadoutId: s.loadouts?.active ?? '',
      enemy: s.enemy,
      keybinds: s.keybinds ?? {},
      actionBars: s.action_bars,
    };
    await this.storage.replaceSetup(bundle);
  }
}

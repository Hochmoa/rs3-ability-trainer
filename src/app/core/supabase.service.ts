import { Injectable, computed, signal } from '@angular/core';
import type { Session as AuthSession, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export type Role = 'user' | 'moderator' | 'admin';

export interface Profile {
  id: string;
  display_name: string;
  role: Role;
  blocked_at: string | null;
  blocked_reason: string | null;
}

export const DISPLAY_NAME_RE = /^[A-Za-z0-9 _-]{3,20}$/;

/** supabase-js keeps the session under this localStorage key (its default: "sb-<project ref>-auth-token") */
function storageKey(url: string): string {
  return 'sb-' + new URL(url).hostname.split('.')[0] + '-auth-token';
}

/** a session may be stored, or the page was opened from a sign-up / recovery mail (PKCE code, implicit tokens) */
function sessionExpected(): boolean {
  try {
    if (localStorage.getItem(storageKey(environment.supabaseUrl))) return true;
  } catch {
    // storage blocked: nothing stored
  }
  const q = location.search + location.hash;
  return /[?#&](code|access_token|refresh_token|error_description|type)=/.test(q);
}

/**
 * Thin wrapper around supabase-js: auth state as signals, profile, account actions.
 *
 * supabase-js (~200 kB of JS) is not part of the initial bundle: the client is created the first time something
 * needs it – at start-up only when a session is stored (or an auth redirect is being handled), otherwise on the first
 * sign-in, sync or error report. Everything that talks to the database awaits `db()`.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private clientPromise: Promise<SupabaseClient> | null = null;

  readonly session = signal<AuthSession | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly profile = signal<Profile | null>(null);
  readonly isAdmin = computed(() => this.profile()?.role === 'admin');
  readonly isStaff = computed(() => this.profile()?.role === 'admin' || this.profile()?.role === 'moderator');
  readonly isBlocked = computed(() => !!this.profile()?.blocked_at);
  /** true once the initial session lookup finished (immediately when nothing is stored) */
  readonly ready = signal(false);
  /** last auth event, e.g. 'PASSWORD_RECOVERY' lets the callback page show the new-password form */
  readonly lastEvent = signal<string | null>(null);

  constructor() {
    if (sessionExpected()) void this.db();
    else this.ready.set(true);
  }

  /** the supabase-js client, loaded and created on first use */
  db(): Promise<SupabaseClient> {
    this.clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => {
      const client = createClient(environment.supabaseUrl, environment.supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
      });
      client.auth.onAuthStateChange((event, session) => {
        this.lastEvent.set(event);
        this.session.set(session);
        if (session) void this.loadProfile(session.user.id);
        else this.profile.set(null);
        this.ready.set(true);
      });
      void client.auth.getSession().then(({ data }) => {
        this.session.set(data.session);
        if (data.session) void this.loadProfile(data.session.user.id);
        this.ready.set(true);
      });
      return client;
    });
    return this.clientPromise;
  }

  get redirectBase(): string {
    return location.origin + '/auth/callback';
  }

  private async loadProfile(id: string): Promise<void> {
    const { data } = await (await this.db()).from('profiles').select('id, display_name, role, blocked_at, blocked_reason').eq('id', id).maybeSingle();
    this.profile.set((data as Profile | null) ?? null);
  }

  async displayNameTaken(name: string): Promise<boolean> {
    const { data, error } = await (await this.db()).rpc('display_name_taken', { name });
    if (error) throw error;
    return !!data;
  }

  async signUp(email: string, password: string, displayName: string): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await (await this.db()).auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName }, emailRedirectTo: this.redirectBase },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await (await this.db()).auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await (await this.db()).auth.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await (await this.db()).auth.resetPasswordForEmail(email, { redirectTo: this.redirectBase + '?type=recovery' });
    if (error) throw error;
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await (await this.db()).auth.updateUser({ password });
    if (error) throw error;
  }

  /** re-read the own profile (role / block state may have changed) */
  async refreshProfile(): Promise<void> {
    const id = this.user()?.id;
    if (id) await this.loadProfile(id);
  }

  async updateDisplayName(name: string): Promise<void> {
    const id = this.user()?.id;
    if (!id) throw new Error('login required');
    const { error } = await (await this.db()).from('profiles').update({ display_name: name }).eq('id', id);
    if (error) throw error;
    await this.loadProfile(id);
  }

  async deleteAccount(): Promise<void> {
    const { error } = await (await this.db()).rpc('delete_my_account');
    if (error) throw error;
    await this.signOut();
  }
}

/** Human-readable message for supabase / postgrest errors (AuthError and PostgrestError both carry it in `message`). */
export function errorText(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = String((err as { message: unknown }).message);
    if (m.includes('profiles_display_name_key')) return 'That display name is taken.';
    return m;
  }
  return String(err);
}

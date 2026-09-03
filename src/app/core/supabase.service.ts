import { Injectable, computed, signal } from '@angular/core';
import { AuthError, Session as AuthSession, SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Profile {
  id: string;
  display_name: string;
}

export const DISPLAY_NAME_RE = /^[A-Za-z0-9 _-]{3,20}$/;

/** Thin wrapper around supabase-js: auth state as signals, profile, account actions. */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  });

  readonly session = signal<AuthSession | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly profile = signal<Profile | null>(null);
  /** true once the initial session lookup finished */
  readonly ready = signal(false);
  /** last auth event, e.g. 'PASSWORD_RECOVERY' lets the callback page show the new-password form */
  readonly lastEvent = signal<string | null>(null);

  constructor() {
    this.client.auth.onAuthStateChange((event, session) => {
      this.lastEvent.set(event);
      this.session.set(session);
      if (session) void this.loadProfile(session.user.id);
      else this.profile.set(null);
      this.ready.set(true);
    });
    void this.client.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      if (data.session) void this.loadProfile(data.session.user.id);
      this.ready.set(true);
    });
  }

  get redirectBase(): string {
    return location.origin + '/auth/callback';
  }

  private async loadProfile(id: string): Promise<void> {
    const { data } = await this.client.from('profiles').select('id, display_name').eq('id', id).maybeSingle();
    this.profile.set((data as Profile | null) ?? null);
  }

  async displayNameTaken(name: string): Promise<boolean> {
    const { data, error } = await this.client.rpc('display_name_taken', { name });
    if (error) throw error;
    return !!data;
  }

  async signUp(email: string, password: string, displayName: string): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName }, emailRedirectTo: this.redirectBase },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo: this.redirectBase + '?type=recovery' });
    if (error) throw error;
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) throw error;
  }

  async updateDisplayName(name: string): Promise<void> {
    const id = this.user()?.id;
    if (!id) throw new Error('login required');
    const { error } = await this.client.from('profiles').update({ display_name: name }).eq('id', id);
    if (error) throw error;
    await this.loadProfile(id);
  }

  async deleteAccount(): Promise<void> {
    const { error } = await this.client.rpc('delete_my_account');
    if (error) throw error;
    await this.signOut();
  }
}

/** Human-readable message for supabase / postgrest errors. */
export function errorText(err: unknown): string {
  if (err instanceof AuthError) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = String((err as { message: unknown }).message);
    if (m.includes('profiles_display_name_key')) return 'That display name is taken.';
    return m;
  }
  return String(err);
}

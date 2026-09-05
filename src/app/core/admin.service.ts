import { Injectable, inject } from '@angular/core';
import { Role, SupabaseService } from './supabase.service';

export interface AdminUser {
  id: string;
  display_name: string;
  role: Role;
  blocked_at: string | null;
  blocked_reason: string | null;
  blocked_by_name: string | null;
  created_at: string;
  /** null for moderators (admins only) */
  email: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  rotations: number;
  public_rotations: number;
  sessions: number;
  keybinds: number;
  has_action_bars: boolean;
}

export interface AdminRotation {
  id: string;
  name: string;
  is_public: boolean;
  steps: unknown[];
  copies: number;
  created_at: string;
  updated_at: string;
}

/** a row of client_errors (0009_client_errors.sql) */
export interface ErrorRow {
  id: string;
  created_at: string;
  user_id: string | null;
  display_name: string | null;
  source: string;
  message: string;
  stack: string | null;
  fingerprint: string;
  page: string | null;
  build: string | null;
  user_agent: string | null;
  extra: Record<string, unknown> | null;
}

export interface FeedbackRow {
  id: string;
  created_at: string;
  user_id: string | null;
  display_name: string | null;
  kind: 'bug' | 'suggestion';
  message: string;
  contact: string | null;
  page: string | null;
  user_agent: string | null;
}

/** Admin panel data access. Every call is checked again by the database (RPCs + row level security). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private supabase = inject(SupabaseService);
  private db() {
    return this.supabase.db();
  }

  async listUsers(): Promise<AdminUser[]> {
    const { data, error } = await (await this.db()).rpc('admin_list_users');
    if (error) throw error;
    return (data ?? []) as AdminUser[];
  }

  async blockUser(id: string, reason: string): Promise<void> {
    const { error } = await (await this.db()).rpc('admin_block_user', { target: id, reason: reason || null });
    if (error) throw error;
  }

  async unblockUser(id: string): Promise<void> {
    const { error } = await (await this.db()).rpc('admin_unblock_user', { target: id });
    if (error) throw error;
  }

  async setRole(id: string, role: Role): Promise<void> {
    const { error } = await (await this.db()).rpc('admin_set_role', { target: id, new_role: role });
    if (error) throw error;
  }

  async renameUser(id: string, name: string): Promise<void> {
    const { error } = await (await this.db()).rpc('admin_rename_user', { target: id, new_name: name });
    if (error) throw error;
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await (await this.db()).rpc('admin_delete_user', { target: id });
    if (error) throw error;
  }

  async listRotations(ownerId: string): Promise<AdminRotation[]> {
    const { data, error } = await (await this.db())
      .from('rotations')
      .select('id, name, is_public, steps, copies, created_at, updated_at')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminRotation[];
  }

  async updateRotation(id: string, patch: { name?: string; is_public?: boolean }): Promise<void> {
    const { error } = await (await this.db()).from('rotations').update(patch).eq('id', id);
    if (error) throw error;
  }

  async deleteRotation(id: string): Promise<void> {
    const { error } = await (await this.db()).from('rotations').delete().eq('id', id);
    if (error) throw error;
  }

  async listFeedback(): Promise<FeedbackRow[]> {
    const { data, error } = await (await this.db()).from('feedback').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return (data ?? []) as FeedbackRow[];
  }

  async deleteFeedback(id: string): Promise<void> {
    const { error } = await (await this.db()).from('feedback').delete().eq('id', id);
    if (error) throw error;
  }

  /** newest 1000 front-end error reports (staff) */
  async listErrors(): Promise<ErrorRow[]> {
    const { data, error } = await (await this.db()).from('client_errors').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    return (data ?? []) as ErrorRow[];
  }

  /** delete every report of one fingerprint (admin) */
  async deleteErrorGroup(fingerprint: string): Promise<void> {
    const { error } = await (await this.db()).from('client_errors').delete().eq('fingerprint', fingerprint);
    if (error) throw error;
  }

  /** delete all reports (admin) */
  async clearErrors(): Promise<void> {
    const { error } = await (await this.db()).from('client_errors').delete().gte('created_at', '1970-01-01');
    if (error) throw error;
  }
}

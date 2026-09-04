import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanActivateFn, Router } from '@angular/router';
import { AdminRotation, AdminService, AdminUser, ErrorRow, FeedbackRow } from '../../core/admin.service';
import { DISPLAY_NAME_RE, Role, SupabaseService, errorText } from '../../core/supabase.service';
import { DialogService } from '../../shared/dialog';
import { ToastService } from '../../shared/toast';

/** Only signed-in staff may open /admin; the database checks every action again. */
export const staffGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  // wait for the session lookup and the profile (role) to arrive
  for (let i = 0; i < 50 && (!supabase.ready() || (supabase.user() && !supabase.profile())); i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return supabase.isStaff() ? true : router.createUrlTree(['/']);
};

@Component({
  selector: 'app-admin',
  imports: [FormsModule, DatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  readonly supabase = inject(SupabaseService);
  private admin = inject(AdminService);
  private dialogs = inject(DialogService);
  private toasts = inject(ToastService);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly tab = signal<'users' | 'feedback' | 'errors'>('users');
  readonly errors = signal<ErrorRow[]>([]);
  readonly errorSearch = signal('');
  /** fingerprint whose reports are expanded */
  readonly openError = signal<string | null>(null);
  /** one group per fingerprint, newest first */
  readonly errorGroups = computed<ErrorGroup[]>(() => {
    const q = this.errorSearch().trim().toLowerCase();
    const groups = new Map<string, ErrorGroup>();
    for (const r of this.errors()) {
      let g = groups.get(r.fingerprint);
      if (!g) {
        g = { fingerprint: r.fingerprint, message: r.message, source: r.source, count: 0, first: r.created_at, last: r.created_at, users: new Set(), pages: new Set(), builds: new Set(), rows: [] };
        groups.set(r.fingerprint, g);
      }
      g.count++;
      if (r.created_at < g.first) g.first = r.created_at;
      if (r.created_at > g.last) g.last = r.created_at;
      g.users.add(r.display_name ?? (r.user_id ? r.user_id.slice(0, 8) : 'anonymous'));
      if (r.page) g.pages.add(r.page);
      if (r.build) g.builds.add(r.build.split(' ')[0]);
      if (g.rows.length < 20) g.rows.push(r);
    }
    let list = [...groups.values()].sort((a, b) => (a.last < b.last ? 1 : -1));
    if (q) list = list.filter((g) => g.message.toLowerCase().includes(q) || [...g.pages].some((p) => p.toLowerCase().includes(q)) || [...g.users].some((u) => u.toLowerCase().includes(q)) || [...g.builds].some((b) => b.includes(q)));
    return list;
  });
  readonly errorStats = computed(() => {
    const e = this.errors();
    const day = Date.now() - 24 * 3600 * 1000;
    return { total: e.length, groups: new Set(e.map((r) => r.fingerprint)).size, today: e.filter((r) => new Date(r.created_at).getTime() > day).length };
  });
  /** user whose rotations are expanded */
  readonly openUser = signal<string | null>(null);
  readonly rotations = signal<AdminRotation[]>([]);
  readonly feedback = signal<FeedbackRow[]>([]);
  readonly busy = signal<string | null>(null);

  readonly ROLES: Role[] = ['user', 'moderator', 'admin'];
  readonly isAdmin = this.supabase.isAdmin;

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.users();
    if (!q) return list;
    return list.filter((u) => u.display_name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q) || u.role.includes(q) || (q === 'blocked' && u.blocked_at));
  });
  readonly stats = computed(() => {
    const u = this.users();
    return {
      users: u.length,
      blocked: u.filter((x) => x.blocked_at).length,
      staff: u.filter((x) => x.role !== 'user').length,
      rotations: u.reduce((n, x) => n + Number(x.rotations), 0),
      publicRotations: u.reduce((n, x) => n + Number(x.public_rotations), 0),
      sessions: u.reduce((n, x) => n + Number(x.sessions), 0),
    };
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.users.set(await this.admin.listUsers());
      if (this.supabase.isStaff()) {
        this.feedback.set(await this.admin.listFeedback());
        this.errors.set(await this.admin.listErrors());
      }
    } catch (e) {
      this.error.set(errorText(e));
    }
    this.loading.set(false);
  }

  isSelf(u: AdminUser): boolean {
    return u.id === this.supabase.user()?.id;
  }

  /** moderators may only touch plain users; admins everyone but themselves and other admins */
  canBlock(u: AdminUser): boolean {
    if (this.isSelf(u)) return false;
    if (this.isAdmin()) return u.role !== 'admin';
    return u.role === 'user';
  }

  private async run(id: string, action: () => Promise<void>, done: string): Promise<void> {
    this.busy.set(id);
    try {
      await action();
      this.toasts.show(done);
      await this.reload();
    } catch (e) {
      await this.dialogs.alert(errorText(e), 'That did not work');
    }
    this.busy.set(null);
  }

  async block(u: AdminUser): Promise<void> {
    const reason = await this.dialogs.prompt('Block ' + u.display_name + '? They keep read access but cannot save anything online. Reason (optional, shown to them):', {
      title: 'Block user',
      ok: 'Block',
      placeholder: 'e.g. spam in the explorer',
    });
    if (reason === null) return;
    await this.run(u.id, () => this.admin.blockUser(u.id, reason.trim()), u.display_name + ' blocked');
  }

  async unblock(u: AdminUser): Promise<void> {
    await this.run(u.id, () => this.admin.unblockUser(u.id), u.display_name + ' unblocked');
  }

  async setRole(u: AdminUser, role: string): Promise<void> {
    if (role === u.role) return;
    const ok = await this.dialogs.confirm('Make ' + u.display_name + ' a ' + role + '?', { title: 'Change role', ok: 'Change' });
    if (!ok) {
      this.users.update((list) => [...list]); // reset the select
      return;
    }
    await this.run(u.id, () => this.admin.setRole(u.id, role as Role), u.display_name + ' is now ' + role);
  }

  async rename(u: AdminUser): Promise<void> {
    const name = await this.dialogs.prompt('New display name for ' + u.display_name + ' (3–20 characters, letters, digits, space, _ -):', { title: 'Rename user', value: u.display_name, ok: 'Rename' });
    if (name === null) return;
    if (!DISPLAY_NAME_RE.test(name.trim())) {
      await this.dialogs.alert('That name is not valid.', 'Rename user');
      return;
    }
    await this.run(u.id, () => this.admin.renameUser(u.id, name.trim()), 'Renamed to ' + name.trim());
  }

  async remove(u: AdminUser): Promise<void> {
    const ok = await this.dialogs.confirm(
      'Delete the account "' + u.display_name + '" with all its rotations, keybinds, action bars and sessions? This cannot be undone.',
      { title: 'Delete account', ok: 'Delete account', danger: true },
    );
    if (!ok) return;
    if (this.openUser() === u.id) this.openUser.set(null);
    await this.run(u.id, () => this.admin.deleteUser(u.id), u.display_name + ' deleted');
  }

  async toggleRotations(u: AdminUser): Promise<void> {
    if (this.openUser() === u.id) {
      this.openUser.set(null);
      return;
    }
    this.openUser.set(u.id);
    try {
      this.rotations.set(await this.admin.listRotations(u.id));
    } catch (e) {
      this.rotations.set([]);
      await this.dialogs.alert(errorText(e), 'Could not load rotations');
    }
  }

  private async rotationAction(action: () => Promise<void>, done: string): Promise<void> {
    const owner = this.openUser();
    try {
      await action();
      this.toasts.show(done);
      if (owner) this.rotations.set(await this.admin.listRotations(owner));
      await this.reload();
      this.openUser.set(owner);
    } catch (e) {
      await this.dialogs.alert(errorText(e), 'That did not work');
    }
  }

  async renameRotation(r: AdminRotation): Promise<void> {
    const name = await this.dialogs.prompt('New name:', { title: 'Rename rotation', value: r.name, ok: 'Rename' });
    if (name === null || !name.trim()) return;
    await this.rotationAction(() => this.admin.updateRotation(r.id, { name: name.trim().slice(0, 60) }), 'Rotation renamed');
  }

  async togglePublic(r: AdminRotation): Promise<void> {
    await this.rotationAction(() => this.admin.updateRotation(r.id, { is_public: !r.is_public }), r.is_public ? 'Rotation hidden from the explorer' : 'Rotation is public');
  }

  async deleteRotation(r: AdminRotation): Promise<void> {
    const ok = await this.dialogs.confirm('Delete rotation "' + r.name + '"?', { title: 'Delete rotation', ok: 'Delete', danger: true });
    if (!ok) return;
    await this.rotationAction(() => this.admin.deleteRotation(r.id), 'Rotation deleted');
  }

  toggleError(fingerprint: string): void {
    this.openError.set(this.openError() === fingerprint ? null : fingerprint);
  }

  joined(set: Set<string>, max = 4): string {
    const list = [...set];
    return list.slice(0, max).join(', ') + (list.length > max ? ' +' + (list.length - max) : '');
  }

  async deleteErrorGroup(g: ErrorGroup): Promise<void> {
    const ok = await this.dialogs.confirm('Delete all ' + g.count + ' reports of this error?', { title: 'Delete error reports', ok: 'Delete', danger: true });
    if (!ok) return;
    try {
      await this.admin.deleteErrorGroup(g.fingerprint);
      this.errors.update((list) => list.filter((x) => x.fingerprint !== g.fingerprint));
      this.toasts.show('Error reports deleted');
    } catch (e) {
      await this.dialogs.alert(errorText(e), 'That did not work');
    }
  }

  async clearErrors(): Promise<void> {
    const ok = await this.dialogs.confirm('Delete every front-end error report?', { title: 'Clear error reports', ok: 'Delete all', danger: true });
    if (!ok) return;
    try {
      await this.admin.clearErrors();
      this.errors.set([]);
      this.toasts.show('All error reports deleted');
    } catch (e) {
      await this.dialogs.alert(errorText(e), 'That did not work');
    }
  }

  /** throws on purpose, so the pipeline can be checked end to end from the panel */
  testError(): void {
    setTimeout(() => {
      throw new Error('Test error from the admin panel (' + new Date().toISOString() + ')');
    });
    this.toasts.show('Test error thrown – reload in a moment to see it');
  }

  async deleteFeedback(f: FeedbackRow): Promise<void> {
    const ok = await this.dialogs.confirm('Delete this feedback entry?', { title: 'Delete feedback', ok: 'Delete', danger: true });
    if (!ok) return;
    try {
      await this.admin.deleteFeedback(f.id);
      this.feedback.update((list) => list.filter((x) => x.id !== f.id));
      this.toasts.show('Feedback deleted');
    } catch (e) {
      await this.dialogs.alert(errorText(e), 'That did not work');
    }
  }
}

/** reports of one fingerprint, as shown on the Errors tab */
export interface ErrorGroup {
  fingerprint: string;
  message: string;
  source: string;
  count: number;
  first: string;
  last: string;
  users: Set<string>;
  pages: Set<string>;
  builds: Set<string>;
  /** newest reports (up to 20) */
  rows: ErrorRow[];
}

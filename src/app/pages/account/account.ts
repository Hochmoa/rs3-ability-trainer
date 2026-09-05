import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../core/storage.service';
import { DISPLAY_NAME_RE, SupabaseService, errorText } from '../../core/supabase.service';
import { SetupSyncService } from '../../core/setup-sync.service';
import { SyncService } from '../../core/sync.service';
import { DialogService } from '../../shared/dialog';

type Mode = 'signin' | 'signup' | 'reset';

@Component({
  selector: 'app-account',
  imports: [FormsModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  private dialogs = inject(DialogService);
  readonly supabase = inject(SupabaseService);
  readonly sync = inject(SyncService);
  readonly setups = inject(SetupSyncService);
  readonly storage = inject(StorageService);

  readonly mode = signal<Mode>('signin');
  readonly email = signal('');
  readonly password = signal('');
  readonly displayName = signal('');
  readonly busy = signal(false);
  readonly message = signal<{ text: string; cls: 'good' | 'bad' | 'info' } | null>(null);
  readonly nameTaken = signal<boolean | null>(null);

  readonly newName = signal('');
  readonly newPassword = signal('');

  readonly nameValid = computed(() => DISPLAY_NAME_RE.test(this.displayName().trim()));
  readonly ownRotations = computed(() => this.storage.rotations().length);

  private nameCheck = 0;

  setMode(m: Mode): void {
    this.mode.set(m);
    this.message.set(null);
  }

  onNameInput(v: string): void {
    this.displayName.set(v);
    this.nameTaken.set(null);
    const n = ++this.nameCheck;
    const name = v.trim();
    if (!DISPLAY_NAME_RE.test(name)) return;
    window.setTimeout(async () => {
      if (n !== this.nameCheck) return;
      try {
        this.nameTaken.set(await this.supabase.displayNameTaken(name));
      } catch {
        this.nameTaken.set(null);
      }
    }, 400);
  }

  async submit(): Promise<void> {
    this.busy.set(true);
    this.message.set(null);
    try {
      const email = this.email().trim();
      if (this.mode() === 'signup') {
        const name = this.displayName().trim();
        if (!DISPLAY_NAME_RE.test(name)) throw new Error('Display name: 3–20 characters, letters, digits, space, _ or -.');
        if (await this.supabase.displayNameTaken(name)) throw new Error('That display name is taken.');
        const { needsConfirmation } = await this.supabase.signUp(email, this.password(), name);
        this.message.set({
          text: needsConfirmation
            ? 'Almost there – we sent a confirmation link to ' + email + '. Open it, then come back and sign in.'
            : 'Registered and signed in.',
          cls: 'good',
        });
        this.password.set('');
        this.mode.set('signin');
      } else if (this.mode() === 'signin') {
        await this.supabase.signIn(email, this.password());
        this.password.set('');
        this.message.set({ text: 'Signed in. Your rotations and keybinds are syncing.', cls: 'good' });
      } else {
        await this.supabase.resetPassword(email);
        this.message.set({ text: 'If that address has an account, a reset link is on its way.', cls: 'info' });
        this.mode.set('signin');
      }
    } catch (err) {
      this.message.set({ text: errorText(err), cls: 'bad' });
    } finally {
      this.busy.set(false);
    }
  }

  async saveName(): Promise<void> {
    const name = this.newName().trim();
    if (!DISPLAY_NAME_RE.test(name)) {
      this.message.set({ text: 'Display name: 3–20 characters, letters, digits, space, _ or -.', cls: 'bad' });
      return;
    }
    this.busy.set(true);
    try {
      await this.supabase.updateDisplayName(name);
      this.newName.set('');
      this.message.set({ text: 'Display name changed.', cls: 'good' });
    } catch (err) {
      this.message.set({ text: errorText(err), cls: 'bad' });
    } finally {
      this.busy.set(false);
    }
  }

  async savePassword(): Promise<void> {
    if (this.newPassword().length < 8) {
      this.message.set({ text: 'Password: at least 8 characters.', cls: 'bad' });
      return;
    }
    this.busy.set(true);
    try {
      await this.supabase.updatePassword(this.newPassword());
      this.newPassword.set('');
      this.message.set({ text: 'Password changed.', cls: 'good' });
    } catch (err) {
      this.message.set({ text: errorText(err), cls: 'bad' });
    } finally {
      this.busy.set(false);
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.message.set({ text: 'Signed out. Your rotations stay in this browser.', cls: 'info' });
  }

  async setShare(value: boolean): Promise<void> {
    try {
      await this.setups.setPublic(value);
      this.message.set({ text: value ? 'Your setup is listed on the Shared setups page.' : 'Your setup is hidden from the Shared setups page.', cls: 'info' });
    } catch (err) {
      this.message.set({ text: errorText(err), cls: 'bad' });
    }
  }

  async resync(): Promise<void> {
    await this.setups.pullAndMerge();
    await this.sync.pullAndMerge();
    this.message.set({ text: this.sync.error() ? 'Sync failed: ' + this.sync.error() : 'Synced.', cls: this.sync.error() ? 'bad' : 'good' });
  }

  async deleteAccount(): Promise<void> {
    if (!(await this.dialogs.confirm('Delete your account and everything stored online (profile, rotations, keybinds, sessions)? Local data in this browser stays.', { title: 'Delete account', ok: 'Delete account', danger: true }))) return;
    this.busy.set(true);
    try {
      await this.supabase.deleteAccount();
      this.message.set({ text: 'Account deleted.', cls: 'info' });
    } catch (err) {
      this.message.set({ text: errorText(err), cls: 'bad' });
    } finally {
      this.busy.set(false);
    }
  }
}

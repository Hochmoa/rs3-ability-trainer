import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService, errorText } from '../../core/supabase.service';

/**
 * Target of the e-mail links (confirmation, password reset). supabase-js exchanges the code in the
 * URL on start-up; this page just tells the user what happened and, for recovery, asks for a new password.
 */
@Component({
  selector: 'app-auth-callback',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="panel">
      @if (urlError(); as e) {
        <h2>That link didn't work</h2>
        <p class="bad">{{ e }}</p>
        <p class="muted small">Links expire after a while. Request a new one on the <a routerLink="/account">account page</a>.</p>
      } @else if (recovery()) {
        <h2>Choose a new password</h2>
        @if (!supabase.user()) {
          <p class="muted">Checking the link…</p>
        } @else {
          <form class="row" (ngSubmit)="save()">
            <input type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" placeholder="new password (min. 8)" autocomplete="new-password" />
            <button class="btn btn-primary" type="submit" [disabled]="busy() || password().length < 8">Save</button>
          </form>
          @if (message(); as m) { <p [class]="m.cls">{{ m.text }}</p> }
        }
      } @else if (supabase.user()) {
        <h2>E-mail confirmed</h2>
        <p>You are signed in as <b>{{ supabase.profile()?.display_name ?? supabase.user()?.email }}</b>. Your local rotations are being uploaded.</p>
        <p><a class="btn btn-primary" routerLink="/rotations">Go to my rotations</a></p>
      } @else if (supabase.ready() && waited()) {
        <h2>Nothing to confirm</h2>
        <p class="muted">No sign-in information found in this link. Go to the <a routerLink="/account">account page</a> to sign in.</p>
      } @else {
        <p class="muted">Confirming…</p>
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      gap: 8px;
      max-width: 420px;
      input {
        flex: 1;
      }
    }
  `,
})
export class AuthCallback {
  readonly supabase = inject(SupabaseService);
  private router = inject(Router);

  readonly password = signal('');
  readonly busy = signal(false);
  readonly message = signal<{ text: string; cls: 'good' | 'bad' } | null>(null);
  readonly waited = signal(false);
  readonly urlError = signal<string | null>(readUrlError());
  private readonly typeParam = new URLSearchParams(location.search).get('type');
  readonly recovery = computed(() => this.typeParam === 'recovery' || this.supabase.lastEvent() === 'PASSWORD_RECOVERY');

  constructor() {
    window.setTimeout(() => this.waited.set(true), 4000);
    effect(() => {
      // plain confirmation: once signed in, tidy the URL so a reload doesn't re-run the exchange
      if (this.supabase.user() && !this.recovery() && location.search) history.replaceState(null, '', '/auth/callback');
    });
  }

  async save(): Promise<void> {
    this.busy.set(true);
    try {
      await this.supabase.updatePassword(this.password());
      this.message.set({ text: 'Password saved. You are signed in.', cls: 'good' });
      window.setTimeout(() => void this.router.navigate(['/account']), 1200);
    } catch (err) {
      this.message.set({ text: errorText(err), cls: 'bad' });
    } finally {
      this.busy.set(false);
    }
  }
}

function readUrlError(): string | null {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  return q.get('error_description') ?? h.get('error_description') ?? q.get('error') ?? h.get('error');
}

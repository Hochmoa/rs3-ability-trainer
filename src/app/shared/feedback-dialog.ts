import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FEEDBACK_MAX, FeedbackKind, FeedbackService, feedbackProblem } from '../core/feedback.service';
import { SupabaseService, errorText } from '../core/supabase.service';

/** "Report a bug / suggest something" modal, opened through FeedbackService.show(). */
@Component({
  selector: 'feedback-dialog',
  imports: [FormsModule, CdkTrapFocus],
  template: `
    @if (feedback.open()) {
      <div class="backdrop" (click)="close()"></div>
      <!-- cdkTrapFocus keeps Tab inside and (autoCapture) puts the focus back on the opener when the dialog closes -->
      <div class="dialog" role="dialog" aria-modal="true" aria-label="Feedback" cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (keydown.escape)="close()">
        <button class="close" type="button" (click)="close()" title="Close" aria-label="Close">×</button>
        @if (sent()) {
          <h2>Thanks!</h2>
          <p>Your {{ kind() === 'bug' ? 'bug report' : 'suggestion' }} is in. Thanks, every report is read.</p>
          <div class="actions">
            <button class="btn btn-primary" (click)="close()">Close</button>
          </div>
        } @else {
          <h2>Feedback</h2>
          <div class="kinds">
            <button class="btn" type="button" [class.btn-primary]="kind() === 'bug'" [attr.aria-pressed]="kind() === 'bug'" (click)="kind.set('bug')">🐛 Report a bug</button>
            <button class="btn" type="button" [class.btn-primary]="kind() === 'suggestion'" [attr.aria-pressed]="kind() === 'suggestion'" (click)="kind.set('suggestion')">💡 Suggest something</button>
          </div>
          <textarea
            rows="6"
            aria-label="Your message"
            [placeholder]="kind() === 'bug' ? 'What happened, what did you expect? Which rotation / keys?' : 'What would make the trainer better?'"
            [ngModel]="message()"
            (ngModelChange)="message.set($event)"
            [maxlength]="max"
            cdkFocusInitial
          ></textarea>
          <div class="meta">
            <span class="muted small">{{ message().trim().length }} / {{ max }}</span>
          </div>
          @if (supabase.user()) {
            <p class="muted small">Sent as <b>{{ supabase.profile()?.display_name ?? 'your account' }}</b>, so we can get back to you.</p>
          } @else {
            <label class="contact">
              <span class="muted small">Contact (optional, e-mail or RSN, in case there are questions)</span>
              <input type="text" [ngModel]="contact()" (ngModelChange)="contact.set($event)" maxlength="200" />
            </label>
          }
          @if (error()) {
            <p class="bad small">{{ error() }}</p>
          }
          <div class="actions">
            <button class="btn btn-primary" (click)="send()" [disabled]="!!problem() || sending()">{{ sending() ? 'Sending…' : 'Send' }}</button>
            <button class="btn" (click)="close()">Cancel</button>
            @if (problem() && message().trim()) {
              <span class="muted small">{{ problem() }}</span>
            }
          </div>
          <p class="muted small note">The current page and your browser version are attached. Nothing else.</p>
        }
      </div>
    }
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 70;
      background: rgba(0, 0, 0, 0.6);
    }
    .dialog {
      position: fixed;
      z-index: 71;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 480px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 32px);
      max-height: calc(100dvh - 32px); /* iOS: below the toolbar / above the keyboard, the Send button stays reachable */
      overflow: auto;
      box-sizing: border-box;
      padding: 18px 20px;
      background: #1f1b12;
      border: 1px solid var(--gold);
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }
    h2 {
      margin: 0 0 12px;
      color: var(--gold);
      font-size: 18px;
    }
    .close {
      position: absolute;
      top: 6px;
      right: 8px;
      background: none;
      border: none;
      color: var(--muted);
      font-size: 18px;
      cursor: pointer;
    }
    .close:hover {
      color: var(--text);
    }
    .kinds {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }
    textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: #0f0f12;
      color: var(--text);
      font: inherit;
      resize: vertical;
    }
    textarea:focus {
      border-color: var(--gold);
    }
    .meta {
      text-align: right;
      margin: 2px 0 6px;
    }
    .contact {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
    }
    .contact input {
      width: 100%;
      box-sizing: border-box;
    }
    p {
      margin: 0 0 8px;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }
    .note {
      margin: 10px 0 0;
    }
  `,
})
export class FeedbackDialog {
  readonly feedback = inject(FeedbackService);
  readonly supabase = inject(SupabaseService);
  readonly max = FEEDBACK_MAX;
  readonly kind = signal<FeedbackKind>('bug');
  readonly message = signal('');
  readonly contact = signal('');
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');
  readonly problem = computed(() => feedbackProblem({ kind: this.kind(), message: this.message(), contact: this.contact() }));

  close(): void {
    this.feedback.hide();
    if (this.sent()) {
      this.message.set('');
      this.contact.set('');
      this.sent.set(false);
    }
    this.error.set('');
  }

  async send(): Promise<void> {
    if (this.problem() || this.sending()) return;
    this.sending.set(true);
    this.error.set('');
    try {
      await this.feedback.send({ kind: this.kind(), message: this.message(), contact: this.contact() });
      this.sent.set(true);
    } catch (e) {
      this.error.set('Could not send: ' + errorText(e));
    } finally {
      this.sending.set(false);
    }
  }
}

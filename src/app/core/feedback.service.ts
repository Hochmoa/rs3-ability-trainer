import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type FeedbackKind = 'bug' | 'suggestion';

export interface FeedbackDraft {
  kind: FeedbackKind;
  message: string;
  contact: string;
}

export interface FeedbackRow {
  kind: FeedbackKind;
  message: string;
  contact: string | null;
  user_id: string | null;
  display_name: string | null;
  page: string | null;
  user_agent: string | null;
}

export const FEEDBACK_MIN = 5;
export const FEEDBACK_MAX = 4000;

/** Validation message for the form, null when the draft can be sent. */
export function feedbackProblem(d: FeedbackDraft): string | null {
  const msg = d.message.trim();
  if (msg.length < FEEDBACK_MIN) return 'Please write a few more words.';
  if (msg.length > FEEDBACK_MAX) return 'Please keep it under ' + FEEDBACK_MAX + ' characters.';
  if (d.contact.trim().length > 200) return 'Contact is too long.';
  return null;
}

/** Row sent to the `feedback` table. Logged-in senders are identified by user id + display name, others by the optional contact. */
export function buildFeedback(
  d: FeedbackDraft,
  ctx: { userId: string | null; displayName: string | null; page: string; userAgent: string },
): FeedbackRow {
  const contact = d.contact.trim();
  return {
    kind: d.kind,
    message: d.message.trim(),
    contact: contact || null,
    user_id: ctx.userId,
    display_name: ctx.userId ? ctx.displayName : null,
    page: ctx.page.slice(0, 200) || null,
    user_agent: ctx.userAgent.slice(0, 500) || null,
  };
}

/** Opens the feedback dialog from anywhere and sends the row to Supabase. */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private supabase = inject(SupabaseService);
  readonly open = signal(false);

  show(): void {
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }

  async send(draft: FeedbackDraft): Promise<void> {
    const row = buildFeedback(draft, {
      userId: this.supabase.user()?.id ?? null,
      displayName: this.supabase.profile()?.display_name ?? null,
      page: location.pathname,
      userAgent: navigator.userAgent,
    });
    const { error } = await this.supabase.client.from('feedback').insert(row);
    if (error) throw error;
  }
}

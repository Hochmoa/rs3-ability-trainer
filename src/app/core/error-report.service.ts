import { ErrorHandler, Injectable, inject } from '@angular/core';
import { BUILD } from '../version';
import { SupabaseService } from './supabase.service';

export type ErrorSource = 'angular' | 'error' | 'unhandledrejection' | 'manual';

/** Row sent to the `client_errors` table (supabase/migrations/0009_client_errors.sql). */
export interface ClientErrorRow {
  user_id: string | null;
  display_name: string | null;
  source: ErrorSource;
  message: string;
  stack: string | null;
  fingerprint: string;
  page: string | null;
  build: string | null;
  user_agent: string | null;
  extra: Record<string, unknown> | null;
}

/** message + top stack frames of anything that was thrown */
export function describeError(err: unknown): { message: string; stack: string | null } {
  if (err instanceof Error) return { message: (err.name && err.name !== 'Error' ? err.name + ': ' : '') + (err.message || '(no message)'), stack: err.stack ?? null };
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    // Angular wraps errors thrown in templates / listeners, supabase-js returns plain objects
    if (o['rejection'] instanceof Error) return describeError(o['rejection']);
    if (typeof o['message'] === 'string') return { message: String(o['message']), stack: typeof o['stack'] === 'string' ? (o['stack'] as string) : null };
    try {
      return { message: JSON.stringify(err).slice(0, 2000), stack: null };
    } catch {
      return { message: String(err), stack: null };
    }
  }
  return { message: String(err), stack: null };
}

/** 32-bit FNV-1a hash as 8 hex digits – no crypto needed, collisions only cost a merged group */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Groups repeats of the same error: message with numbers / ids stripped + the first two stack frames, without
 * the hashed bundle name (main-ABC123.js) so a group survives a deploy.
 */
export function fingerprintOf(message: string, stack: string | null): string {
  const msg = message.replace(/\d+/g, '#').replace(/https?:\/\/\S+/g, 'url').slice(0, 200);
  const frames = (stack ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^at\s|@/.test(l))
    .slice(0, 2)
    .map((l) => l.replace(/main-[A-Z0-9]+\.js/g, 'main.js').replace(/:\d+:\d+/g, ''))
    .join('|');
  return hash(msg + '|' + frames);
}

const MAX_PER_SESSION = 30;

/**
 * Angular ErrorHandler that logs to the console like the default one and sends every uncaught error (Angular,
 * window "error", unhandled promise rejections – see provideBrowserGlobalErrorListeners) to the `client_errors`
 * table. Each distinct error goes once per page load, at most 30 per page load, never from the reporter itself.
 */
@Injectable({ providedIn: 'root' })
export class ErrorReportService implements ErrorHandler {
  private readonly supabase = inject(SupabaseService);
  private readonly seen = new Set<string>();
  private sent = 0;
  private reporting = false;

  handleError(error: unknown): void {
    console.error(error);
    void this.report(error, 'angular');
  }

  /** report something caught by hand (a failed sync, a data problem) */
  async report(error: unknown, source: ErrorSource = 'manual', extra: Record<string, unknown> | null = null): Promise<void> {
    if (this.reporting || this.sent >= MAX_PER_SESSION) return;
    try {
      const { message, stack } = describeError(error);
      const fingerprint = fingerprintOf(message, stack);
      if (this.seen.has(fingerprint)) return;
      this.seen.add(fingerprint);
      this.sent++;
      this.reporting = true;
      const row: ClientErrorRow = {
        user_id: this.supabase.user()?.id ?? null,
        display_name: this.supabase.user() ? (this.supabase.profile()?.display_name ?? null) : null,
        source,
        message: message.slice(0, 2000),
        stack: stack ? stack.slice(0, 8000) : null,
        fingerprint,
        page: (location.pathname + location.search).slice(0, 300) || null,
        build: BUILD.slice(0, 60) || null,
        user_agent: navigator.userAgent.slice(0, 500) || null,
        extra: {
          ...(extra ?? {}),
          viewport: innerWidth + 'x' + innerHeight,
          online: navigator.onLine,
          lang: navigator.language,
        },
      };
      await this.supabase.client.from('client_errors').insert(row);
    } catch {
      // never let the reporter itself throw
    } finally {
      this.reporting = false;
    }
  }
}

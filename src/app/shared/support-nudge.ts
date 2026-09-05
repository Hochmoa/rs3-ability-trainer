import { Component, Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from '../core/storage.service';

/** Donation page. Empty string = the nudge and the footer link stay hidden. */
export const SUPPORT_URL = '';
export const SUPPORT_LABEL = 'Buy me a coffee';

const KEY = 'rs3trainer.engagement';
const TICK_S = 15;
/** show after this much active time spread over at least MIN_VISITS days ... */
const MIN_ACTIVE_S = 15 * 60;
const MIN_VISITS = 2;
/** ... or after this many finished training sessions */
const MIN_SESSIONS = 10;
const SNOOZE_DAYS = 14;
const THANKS_DAYS = 90;

interface Engagement {
  visits: number;
  lastVisitDay: string;
  activeSec: number;
  sessions: number;
  dismissedUntil: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Counts how much someone actually uses the trainer (active minutes on separate days, finished
 * sessions) so the support card only shows up for people who keep coming back. Stored in
 * localStorage; nothing leaves the browser.
 */
@Injectable({ providedIn: 'root' })
export class EngagementService {
  private storage = inject(StorageService);
  readonly data = signal<Engagement>(this.load());
  readonly due = computed(() => {
    const d = this.data();
    if (!SUPPORT_URL || d.dismissedUntil > Date.now()) return false;
    return (d.activeSec >= MIN_ACTIVE_S && d.visits >= MIN_VISITS) || d.sessions >= MIN_SESSIONS;
  });

  constructor() {
    const d = this.data();
    if (d.lastVisitDay !== today()) this.update({ visits: d.visits + 1, lastVisitDay: today() });
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        if (document.visibilityState === 'visible') this.update({ activeSec: this.data().activeSec + TICK_S });
      }, TICK_S * 1000);
    }
    let seen = this.storage.sessionsSaved();
    effect(() => {
      const n = this.storage.sessionsSaved();
      if (n > seen) {
        seen = n;
        this.update({ sessions: this.data().sessions + 1 });
      }
    });
  }

  snooze(days = SNOOZE_DAYS): void {
    this.update({ dismissedUntil: Date.now() + days * 86400_000 });
  }

  thanks(): void {
    this.snooze(THANKS_DAYS);
  }

  private update(patch: Partial<Engagement>): void {
    const next = { ...this.data(), ...patch };
    this.data.set(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* private mode etc. */
    }
  }

  private load(): Engagement {
    const base: Engagement = { visits: 0, lastVisitDay: '', activeSec: 0, sessions: 0, dismissedUntil: 0 };
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...base, ...JSON.parse(raw) } : base;
    } catch {
      return base;
    }
  }
}

@Component({
  selector: 'support-nudge',
  template: `
    @if (engagement.due()) {
      <div class="card" role="dialog" aria-label="Support the trainer" [style.bottom.px]="storage.consent() ? 18 : 96">
        <button class="close" (click)="engagement.snooze()" title="Not now">×</button>
        <div class="cup">☕</div>
        <div class="body">
          <div class="title">Enjoying the trainer?</div>
          <p>The trainer is free and has no ads. A coffee keeps the servers and the wiki data updates going.</p>
          <div class="actions">
            <a class="btn btn-primary" [href]="url" target="_blank" rel="noopener" (click)="engagement.thanks()">{{ label }}</a>
            <button class="btn" (click)="engagement.snooze()">Not now</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .card {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 60;
      display: flex;
      gap: 14px;
      width: 360px;
      max-width: calc(100vw - 36px);
      padding: 16px 18px;
      background: #1f1b12;
      border: 1px solid var(--gold);
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(201, 162, 39, 0.25);
      animation: rise 0.5s ease-out;
    }
    .cup {
      font-size: 34px;
      line-height: 1;
      margin-top: 2px;
    }
    .title {
      font-weight: 700;
      font-size: 16px;
      color: var(--gold);
      margin-bottom: 4px;
    }
    p {
      margin: 0 0 12px;
      font-size: 13px;
      line-height: 1.4;
    }
    .actions {
      display: flex;
      gap: 8px;
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
    @keyframes rise {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }
  `,
})
export class SupportNudge {
  readonly engagement = inject(EngagementService);
  readonly storage = inject(StorageService);
  readonly url = SUPPORT_URL;
  readonly label = SUPPORT_LABEL;
}

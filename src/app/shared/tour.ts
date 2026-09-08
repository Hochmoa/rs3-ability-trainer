import { Component, Injectable, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Box, TOUR_STEPS, TourStep, blockers, cardPosition, spotlight, visibleSteps } from '../core/tour';
import { StorageService } from '../core/storage.service';

const SEEN_KEY = 'rs3trainer.tour';
/** how long a step waits for its element after the page changed */
const WAIT_MS = 2500;
/** breathing room between the element and the edge of the hole */
const PAD = 6;
/** how often one step may scroll its element into view before it leaves the page alone */
const SCROLL_TRIES = 3;
/** the tour offers itself while the consent banner is up; after this long it stops waiting for the visit */
const AUTOSTART_GIVE_UP_MS = 120_000;

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true; // storage blocked: never nag
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage blocked – this visit only */
  }
}

/**
 * Runs the guided tour (core/tour.ts): navigates to each step's page, and the overlay below draws the veil, the
 * spotlight and the card. Starts itself once on a first visit, and the Settings page starts it again on demand.
 */
@Injectable({ providedIn: 'root' })
export class TourService {
  private router = inject(Router);
  private storage = inject(StorageService);

  readonly index = signal(-1);
  readonly running = computed(() => this.index() >= 0);
  /** the advanced-only steps are left out in the simple view */
  readonly steps = computed<TourStep[]>(() => visibleSteps(TOUR_STEPS, this.storage.settings().uiMode === 'advanced'));
  readonly step = computed<TourStep | null>(() => this.steps()[this.index()] ?? null);
  readonly last = computed(() => this.index() === this.steps().length - 1);

  constructor() {
    // A first visit is offered the tour once the page is up; the popout and a second visit are left alone. The
    // consent banner comes first – veiling it would leave the reader unable to answer it – so the tour waits for
    // it to go (a poll, because the banner can also be dismissed without accepting).
    if (!seen() && typeof location !== 'undefined' && !/(^|\/)focus\/?$/.test(location.pathname)) {
      const from = Date.now();
      const wait = window.setInterval(() => {
        const blocked = !!document.querySelector('consent-banner .banner');
        if (this.running() || Date.now() - from > AUTOSTART_GIVE_UP_MS) return window.clearInterval(wait);
        if (!blocked && this.storage.ready()) {
          window.clearInterval(wait);
          this.start();
        }
      }, 400);
    }
  }

  start(at = 0): void {
    this.index.set(Math.max(0, Math.min(at, this.steps().length - 1)));
    this.goToStepPage();
  }

  next(): void {
    if (this.last()) return this.finish();
    this.index.update((i) => i + 1);
    this.goToStepPage();
  }

  back(): void {
    if (this.index() <= 0) return;
    this.index.update((i) => i - 1);
    this.goToStepPage();
  }

  /** "Skip" and "Done" end the same way: the tour does not come back on its own */
  finish(): void {
    this.index.set(-1);
    markSeen();
  }

  private goToStepPage(): void {
    const route = this.step()?.route;
    if (route && this.router.url.split('?')[0] !== route) void this.router.navigateByUrl(route);
  }
}

/**
 * The overlay: four veil rectangles around the highlighted element (so the element itself stays clickable), a
 * ring on it and the step card next to it. Everything is measured from the live element and followed on scroll,
 * resize and while the page settles after a navigation.
 */
@Component({
  selector: 'app-tour',
  template: `
    @if (tour.step(); as s) {
      <div class="tour" role="dialog" aria-modal="true" [attr.aria-label]="s.title">
        @for (b of veil(); track $index) {
          <div class="veil" [style.top.px]="b.top" [style.left.px]="b.left" [style.width.px]="b.width" [style.height.px]="b.height"></div>
        }
        @if (box(); as b) {
          <div class="ring" [style.top.px]="b.top" [style.left.px]="b.left" [style.width.px]="b.width" [style.height.px]="b.height"></div>
        }
        <div class="card" [style.top.px]="card().top" [style.left.px]="card().left">
          <div class="card-head">
            <span class="count">{{ tour.index() + 1 }} / {{ tour.steps().length }}</span>
            <button class="x" type="button" (click)="tour.finish()" title="Close the tour">×</button>
          </div>
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
          <div class="card-actions">
            <button class="btn btn-sm ghost" type="button" (click)="tour.finish()">Skip</button>
            <span class="spacer"></span>
            @if (tour.index() > 0) { <button class="btn btn-sm" type="button" (click)="tour.back()">Back</button> }
            <button class="btn btn-sm btn-primary" type="button" (click)="tour.next()" #nextBtn>{{ tour.last() ? 'Done' : 'Next' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .veil {
      position: fixed;
      z-index: 160;
      background: rgba(0, 0, 0, 0.62);
    }
    .ring {
      position: fixed;
      z-index: 161;
      border: 2px solid var(--gold);
      border-radius: 8px;
      box-shadow: 0 0 0 2px rgba(201, 162, 39, 0.25), 0 0 18px rgba(201, 162, 39, 0.35);
      pointer-events: none;
      transition: top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease;
    }
    .card {
      position: fixed;
      z-index: 162;
      width: 340px;
      /* max() keeps the card usable when the window reports no width at all (a hidden tab) */
      max-width: max(260px, calc(100vw - 16px));
      padding: 12px 14px 10px;
      background: var(--panel);
      border: 1px solid var(--gold);
      border-radius: 8px;
      box-shadow: 0 10px 34px rgba(0, 0, 0, 0.65);
      transition: top 0.15s ease, left 0.15s ease;
    }
    .card-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .count {
      font-size: 11px;
      letter-spacing: 0.4px;
      color: var(--muted);
    }
    .x {
      margin-left: auto;
      background: none;
      border: 0;
      color: var(--muted);
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
    }
    .x:hover {
      color: var(--gold);
    }
    h3 {
      margin: 2px 0 4px;
      font-size: 15px;
      color: var(--gold);
    }
    p {
      margin: 0 0 10px;
      font-size: 13px;
      line-height: 1.4;
    }
    .card-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .spacer {
      flex: 1;
    }
    .ghost {
      border-color: transparent;
      color: var(--muted);
    }
    @media (prefers-reduced-motion: reduce) {
      .ring,
      .card {
        transition: none;
      }
    }
  `,
})
export class Tour implements OnDestroy {
  readonly tour = inject(TourService);
  private router = inject(Router);

  /** the spotlight in viewport coordinates, null while the step has no target (or none was found) */
  readonly box = signal<Box | null>(null);
  private readonly view = signal({ width: 0, height: 0 });
  /** the card is measured after it is drawn; until then an estimate keeps it from jumping */
  private readonly cardSize = signal({ width: 340, height: 170 });

  readonly veil = computed(() => blockers(this.box(), this.view()));
  readonly card = computed(() => cardPosition(this.box(), this.cardSize(), this.view()));

  private timer = 0;
  private waitUntil = 0;
  /** how often this step has scrolled its element into view (see tick) */
  private scrolls = 0;

  constructor() {
    this.measureView();
    // follow the element while the page moves under it
    window.addEventListener('scroll', this.onMove, true);
    window.addEventListener('resize', this.onMove);
    window.addEventListener('keydown', this.onKey);
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.tour.running() && this.locate());
    effect(() => {
      const step = this.tour.step();
      untracked(() => (step ? this.locate() : this.stopWatching()));
    });
  }

  ngOnDestroy(): void {
    this.stopWatching();
    window.removeEventListener('scroll', this.onMove, true);
    window.removeEventListener('resize', this.onMove);
    window.removeEventListener('keydown', this.onKey);
  }

  /** Esc leaves the tour, the arrow keys and Enter walk it (never while the reader is typing) */
  private onKey = (e: KeyboardEvent): void => {
    if (!this.tour.running()) return;
    const el = e.target as HTMLElement | null;
    if (el && /^(input|textarea|select)$/i.test(el.tagName)) return;
    if (e.key === 'Escape') this.tour.finish();
    else if (e.key === 'ArrowRight') this.tour.next();
    else if (e.key === 'ArrowLeft') this.tour.back();
    else return;
    e.preventDefault();
  };

  private onMove = (): void => {
    if (this.tour.running()) this.tick();
  };

  private measureView(): void {
    const doc = document.documentElement;
    this.view.set({ width: window.innerWidth || doc.clientWidth, height: window.innerHeight || doc.clientHeight });
  }

  /**
   * Follows the step's element: after a navigation the page needs a tick and a lazy route a little longer, so a
   * small interval measures until it turns up – and keeps measuring afterwards, so the hole and the card stay on
   * the element while the page reflows. A target that never appears leaves a centred card.
   */
  private locate(): void {
    this.stopWatching();
    const step = this.tour.step();
    if (!step) return;
    this.box.set(null);
    this.waitUntil = Date.now() + WAIT_MS;
    this.scrolls = 0;
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 120);
  }

  private tick(): void {
    this.measureView();
    const step = this.tour.step();
    const el = step?.target ? (document.querySelector(step.target) as HTMLElement | null) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      // the page may still be growing under the element (a lazy route, images): scroll again while it is out of
      // sight, but only a few times – after that the reader is free to scroll wherever they like
      const view = this.view();
      if (this.scrolls < SCROLL_TRIES && (r.top < 0 || r.bottom > view.height)) {
        this.scrolls++;
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: this.scrolls > 1 ? 'auto' : 'smooth' });
      }
      if (r.width || r.height) this.box.set(spotlight({ top: r.top, left: r.left, width: r.width, height: r.height }, PAD));
    } else if (!step?.target || Date.now() > this.waitUntil) {
      this.box.set(null); // no target, or it never turned up: the card goes to the middle
    }
    const card = document.querySelector('app-tour .card') as HTMLElement | null;
    if (card) this.cardSize.set({ width: card.offsetWidth, height: card.offsetHeight });
  }

  private stopWatching(): void {
    window.clearInterval(this.timer);
    this.timer = 0;
  }
}

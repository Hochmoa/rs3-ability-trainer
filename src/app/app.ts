import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { BarsSyncService } from './core/bars-sync.service';
import { FeedbackService } from './core/feedback.service';
import { SetupSyncService } from './core/setup-sync.service';
import { StorageService } from './core/storage.service';
import { SupabaseService } from './core/supabase.service';
import { SyncService } from './core/sync.service';
import { ConsentBanner } from './shared/consent-banner';
import { FeedbackDialog } from './shared/feedback-dialog';
import { SupportNudge, SUPPORT_LABEL, SUPPORT_URL } from './shared/support-nudge';
import { Dialog } from './shared/dialog';
import { Toast } from './shared/toast';
import { EntityTooltip } from './shared/tooltip';
import { BUILD } from './version';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConsentBanner, EntityTooltip, SupportNudge, FeedbackDialog, Toast, Dialog],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly supportUrl = SUPPORT_URL;
  readonly supportLabel = SUPPORT_LABEL;
  readonly build = BUILD;
  readonly supabase = inject(SupabaseService);
  readonly feedback = inject(FeedbackService);
  private readonly storage = inject(StorageService);
  /** Settings.uiMode: the Loadout / Setups / Explore pages are only in the menu in the advanced view (routes stay reachable) */
  readonly advanced = computed(() => this.storage.settings().uiMode === 'advanced');
  private readonly router = inject(Router);
  /** route data `bare: true` (the /focus popout): no header, no footer, no page padding – only the routed view */
  readonly bare = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => {
        let r = this.router.routerState.snapshot.root;
        while (r.firstChild) r = r.firstChild;
        return r.data['bare'] === true;
      }),
    ),
    // before the first navigation settles: guess from the URL so the shell does not flash in the popout
    { initialValue: typeof location !== 'undefined' && /(^|\/)focus\/?$/.test(location.pathname) },
  );
  /** created at start-up so the login effect and the change hooks are wired immediately */
  private readonly sync = inject(SyncService);
  private readonly barsSync = inject(BarsSyncService);
  private readonly setupSync = inject(SetupSyncService);
}

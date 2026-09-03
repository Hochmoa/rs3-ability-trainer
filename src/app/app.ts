import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BarsSyncService } from './core/bars-sync.service';
import { SupabaseService } from './core/supabase.service';
import { SyncService } from './core/sync.service';
import { ConsentBanner } from './shared/consent-banner';
import { SupportNudge, SUPPORT_LABEL, SUPPORT_URL } from './shared/support-nudge';
import { EntityTooltip } from './shared/tooltip';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConsentBanner, EntityTooltip, SupportNudge],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly supportUrl = SUPPORT_URL;
  readonly supportLabel = SUPPORT_LABEL;
  readonly supabase = inject(SupabaseService);
  /** created at start-up so the login effect and the change hooks are wired immediately */
  private readonly sync = inject(SyncService);
  private readonly barsSync = inject(BarsSyncService);
}

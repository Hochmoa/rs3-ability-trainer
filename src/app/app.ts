import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
}

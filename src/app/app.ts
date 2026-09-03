import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ConsentBanner } from './shared/consent-banner';
import { EntityTooltip } from './shared/tooltip';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConsentBanner, EntityTooltip],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}

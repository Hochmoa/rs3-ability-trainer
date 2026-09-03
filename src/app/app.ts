import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ConsentBanner } from './shared/consent-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConsentBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}

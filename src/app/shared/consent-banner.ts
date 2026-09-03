import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageService } from '../core/storage.service';

@Component({
  selector: 'consent-banner',
  imports: [RouterLink],
  template: `
    @if (!storage.consent() && !dismissed()) {
      <div class="banner" role="dialog" aria-label="Storage consent">
        <p>
          This site stores your keybinds, rotations, settings and training results in your browser
          (IndexedDB / local storage). Nothing leaves your browser unless you create an account.
          Until you accept, everything is lost on reload. <a routerLink="/privacy">Privacy</a>
        </p>
        <div class="actions">
          <button class="btn btn-primary" (click)="storage.acceptConsent()">Accept</button>
          <button class="btn" (click)="dismissed.set(true)">Not now</button>
        </div>
      </div>
    }
  `,
  styles: `
    .banner {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 50;
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      align-items: center;
      justify-content: center;
      padding: 14px 20px;
      background: #26231c;
      border-top: 2px solid var(--gold);
      color: var(--text);
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.5);
    }
    p {
      margin: 0;
      max-width: 720px;
      font-size: 14px;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
  `,
})
export class ConsentBanner {
  readonly storage = inject(StorageService);
  readonly dismissed = signal(false);
}

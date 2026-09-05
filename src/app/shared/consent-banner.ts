import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageService } from '../core/storage.service';

/**
 * One-line storage consent. Desktop: a slim strip at the bottom; phones (max-width 640px): a strip under the header
 * in normal flow, so it never covers the action bars. An explicit save (rotation Save, preset Add, keybind wizard
 * Finish, "Load a demo") accepts on its own (StorageService.acceptConsentOnSave).
 */
@Component({
  selector: 'consent-banner',
  imports: [RouterLink],
  template: `
    @if (!storage.consent() && !dismissed()) {
      <div class="banner" role="dialog" aria-label="Storage consent">
        <span class="text">Saves your rotations and keys in this browser.</span>
        <span class="actions">
          <button class="btn btn-primary btn-sm" (click)="storage.acceptConsent()">OK</button>
          <a class="btn btn-sm" routerLink="/privacy">Privacy</a>
          <button class="later" type="button" (click)="dismissed.set(true)">Not now</button>
        </span>
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
      gap: 6px 18px;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      background: #26231c;
      border-top: 2px solid var(--gold);
      color: var(--text);
      font-size: 13px;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.5);
    }
    .actions {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .later {
      background: none;
      border: none;
      padding: 0 4px;
      color: var(--muted);
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      text-decoration: underline;
    }
    .later:hover {
      color: var(--text);
    }
    @media (max-width: 640px) {
      .banner {
        position: static;
        padding: 6px 10px;
        font-size: 12px;
        border-top: none;
        border-bottom: 1px solid var(--gold);
        box-shadow: none;
      }
    }
  `,
})
export class ConsentBanner {
  readonly storage = inject(StorageService);
  readonly dismissed = signal(false);
}

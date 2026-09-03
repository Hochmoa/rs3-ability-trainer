import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  template: `
    <div class="panel">
      <h2>Privacy</h2>
      <h3>In your browser</h3>
      <p>
        Rotations, keybinds, loadout, settings and training results are stored in this browser (IndexedDB and local
        storage) after you accept the banner. Nothing is sent anywhere unless you sign in. "Delete all stored data" on the
        <a routerLink="/settings">settings page</a> removes it.
      </p>
      <h3>With an account</h3>
      <p>
        If you register, your e-mail address, a hashed password and your display name are stored by
        <a href="https://supabase.com" target="_blank" rel="noopener">Supabase</a> in {{ region }}. Your rotations
        (with the "public" flag), your keybinds and summaries of your training sessions are stored there too, so they follow
        you across browsers. Public rotations and your display name are visible to everyone in the explorer; private ones
        only to you. Supabase sends the confirmation and password-reset e-mails.
      </p>
      <p>"Delete my account" on the <a routerLink="/account">account page</a> removes everything stored online.</p>
      <h3>Feedback</h3>
      <p>
        Bug reports and suggestions go to the same Supabase project. Stored with the text: the page you sent it from, your
        browser version and, if you are signed in, your user id and display name, otherwise the contact you typed in (if any).
        Nothing else.
      </p>
      <h3>No tracking</h3>
      <p>No analytics, no ads, no third-party cookies. The site is hosted on GitHub Pages, which logs requests like any web server.</p>
      <p class="muted small">Contact: office&#64;hochware.com</p>
    </div>
  `,
  styles: `
    h3 {
      margin: 14px 0 4px;
      color: var(--gold);
      font-size: 15px;
    }
    p {
      margin: 0 0 8px;
      max-width: 760px;
    }
  `,
})
export class Privacy {
  readonly region = environment.supabaseRegion;
}

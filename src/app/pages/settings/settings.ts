import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HIT_CHANCE_MODES, Settings as SettingsModel, CoachSettings } from '../../core/models';
import { ALT1_ADD_URL } from '../../core/popout';
import { CoachService } from '../../core/coach.service';
import { StorageService } from '../../core/storage.service';
import { DialogService } from '../../shared/dialog';
import { ToastService } from '../../shared/toast';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  template: `
    <div class="panel">
      <h1>Settings</h1>
      <h2>Game options</h2>
      <div class="form">
        <label class="check">
          <input type="checkbox" [ngModel]="s().abilityQueueing" (ngModelChange)="set('abilityQueueing', $event)" />
          <span>Ability queueing</span>
        </label>
        <small class="indent">The in-game setting. On: a press during the global cooldown (GCD) queues and casts when it ends. Off: it is ignored, press in the last tick.</small>
        <label class="check">
          <input type="checkbox" [ngModel]="s().loop" (ngModelChange)="set('loop', $event)" />
          <span>Loop the rotation until stopped (Esc)</span>
        </label>
        <label>
          <span>View</span>
          <select [ngModel]="s().uiMode" (ngModelChange)="set('uiMode', $event)">
            <option value="simple">Simple view</option>
            <option value="advanced">Advanced view</option>
          </select>
          <small>Simple hides the enemy, buff and gear panels and the Loadout, Explore and Shared setups pages.</small>
        </label>
      </div>
    </div>

    <div class="panel">
      <h2>Timing</h2>
      <div class="form">
        <label>
          <span>Simulated ping (ms)</span>
          <input type="number" min="0" max="2000" step="5" [ngModel]="s().pingMs" (ngModelChange)="set('pingMs', $event)" />
          <small>Delay between your key press and the server seeing it. Default 60.</small>
        </label>
        <label>
          <span>Ping jitter (± ms)</span>
          <input type="number" min="0" max="500" step="5" [ngModel]="s().jitterMs" (ngModelChange)="set('jitterMs', $event)" />
          <small>Random variation on every press, 0 turns it off. Default 20.</small>
        </label>
        <label>
          <span>Hit delay (ticks)</span>
          <input type="number" min="0" max="5" step="1" [ngModel]="s().hitDelayTicks" (ngModelChange)="set('hitDelayTicks', $event)" />
          <small>Ticks until the damage lands, like the hitsplat in game. Default 2.</small>
        </label>
      </div>
    </div>

    <div class="panel">
      <h2>Sound</h2>
      <p class="muted small">Says the keys out loud and clicks the tick. Switch it on with the Coach pills on the Train page.</p>
      <div class="form">
        <label class="check">
          <input type="checkbox" [ngModel]="s().coach.callouts" (ngModelChange)="setCoach('callouts', $event)" />
          <span>Call-outs</span>
        </label>
        <small class="indent">After every cast the next keys are said at once ("Q, then 3").</small>
        <label class="check">
          <input type="checkbox" [ngModel]="s().coach.lead" (ngModelChange)="setCoach('lead', $event)" />
          <span>Key by key – each key called at its tick</span>
        </label>
        <small class="indent">Each key is called at its tick. Falls behind with you; scoring is unchanged.</small>
        <label class="check">
          <input type="checkbox" [ngModel]="s().coach.metronome" (ngModelChange)="setCoach('metronome', $event)" />
          <span>Metronome</span>
        </label>
        <small class="indent">A click every tick, a higher beep when the GCD ends.</small>
        <label>
          <span>Volume ({{ s().coach.volume }}%)</span>
          <input type="range" min="0" max="100" step="5" [ngModel]="s().coach.volume" (ngModelChange)="setCoach('volume', $event)" />
        </label>
        <label>
          <span>Call-out lead (ms)</span>
          <input type="number" min="0" max="1000" step="10" [ngModel]="s().coach.leadMs" (ngModelChange)="setCoach('leadMs', $event)" />
          <small>Head start of the voice before the tick@if (coach.latencyMs()) { (measured engine delay: {{ coach.latencyMs() }} ms)}. Default 250.</small>
        </label>
        <label>
          <span>Voice</span>
          <select [ngModel]="s().coach.voice" (ngModelChange)="setCoach('voice', $event)">
            <option value="">automatic (English)</option>
            @for (v of coach.voices(); track v.voiceURI) { <option [value]="v.voiceURI">{{ v.name }} ({{ v.lang }})</option> }
          </select>
          <small>
            @if (!coach.supported.speech) { This browser has no speech synthesis, only the metronome works. }
            @else if (!coach.voices().length) { No voices installed, the browser has nothing to speak with. }
            @else { The browser's own voices; a local one answers fastest. }
          </small>
        </label>
        <div>
          <button class="btn" (click)="test()" [disabled]="testing()">{{ testing() ? 'Speaking …' : 'Test: "Ctrl 4, then 3"' }}</button>
        </div>
      </div>
    </div>

    <div class="panel">
      <h2>Damage model</h2>
      <div class="form">
        <label>
          <span>Hit chance</span>
          <select [ngModel]="s().hitChance ?? 'scaled'" (ngModelChange)="set('hitChance', $event)">
            @for (m of HIT_CHANCE_MODES; track m.id) { <option [ngValue]="m.id">{{ m.label }}</option> }
          </select>
          <small>
            Your accuracy against the target's affinity, Defence and armour (enemy panel on the Train page).
            Scaled: every hit deals hit chance × damage (PvM since March 2024). Roll: full hit or miss. Off: always hits
            (<a href="https://runescape.wiki/w/Hit_chance" target="_blank" rel="noopener">wiki</a>).
          </small>
        </label>
      </div>
    </div>

    <div class="panel">
      <h2>Alt1</h2>
      <p class="muted small">
        Runs the focus view inside the game client. Install <a href="https://runeapps.org/alt1" target="_blank" rel="noopener">Alt1</a>, click the link, accept the app.
      </p>
      <a class="btn" [href]="ALT1_ADD_URL" title="alt1://addapp/… – needs the Alt1 Toolkit installed">Add to Alt1</a>
    </div>

    <div class="panel">
      <h2>Data</h2>
      <p class="muted small">
        Storage consent: <b>{{ storage.consent() ? 'accepted' : 'not given – nothing is saved' }}</b>
      </p>
      <button class="btn danger" (click)="clearAll()">Delete all stored data</button>
    </div>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 520px;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    label > span {
      font-weight: 600;
    }
    label small {
      color: var(--muted);
    }
    label.check {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
    small.indent {
      color: var(--muted);
      margin: -8px 0 0 26px;
    }
    h2 {
      margin-top: 0;
    }
    h1 + h2 {
      margin-top: 4px;
    }
  `,
})
export class Settings {
  private dialogs = inject(DialogService);
  private toast = inject(ToastService);
  readonly coach = inject(CoachService);
  readonly storage = inject(StorageService);
  readonly testing = signal(false);
  readonly s = this.storage.settings;
  readonly HIT_CHANCE_MODES = HIT_CHANCE_MODES;
  readonly ALT1_ADD_URL = ALT1_ADD_URL;

  set<K extends keyof SettingsModel>(key: K, value: SettingsModel[K]): void {
    const next = { ...this.s(), [key]: value };
    if (typeof next.pingMs !== 'number' || isNaN(next.pingMs)) next.pingMs = 0;
    if (typeof next.jitterMs !== 'number' || isNaN(next.jitterMs)) next.jitterMs = 0;
    next.pingMs = Math.max(0, next.pingMs);
    next.jitterMs = Math.max(0, next.jitterMs);
    if (typeof next.hitDelayTicks !== 'number' || isNaN(next.hitDelayTicks)) next.hitDelayTicks = 0;
    next.hitDelayTicks = Math.max(0, Math.min(5, Math.round(next.hitDelayTicks)));
    void this.storage.saveSettings(next);
  }

  setCoach<K extends keyof CoachSettings>(key: K, value: CoachSettings[K]): void {
    const c = { ...this.s().coach, [key]: value };
    if (typeof c.volume !== 'number' || isNaN(c.volume)) c.volume = 0;
    c.volume = Math.max(0, Math.min(100, Math.round(c.volume)));
    if (typeof c.leadMs !== 'number' || isNaN(c.leadMs)) c.leadMs = 0;
    c.leadMs = Math.max(0, Math.min(1000, Math.round(c.leadMs)));
    this.set('coach', c);
  }

  /** runs inside the click: browsers only start audio from a user gesture */
  async test(): Promise<void> {
    this.testing.set(true);
    this.coach.configure(this.s().coach);
    const ok = await this.coach.test();
    if (!ok) this.toast.show('The browser blocked the sound – allow audio for this site and try again.', 'warn');
    window.setTimeout(() => {
      this.testing.set(false);
      this.coach.disable();
    }, 2500);
  }

  async clearAll(): Promise<void> {
    if (!(await this.dialogs.confirm('Delete all keybinds, rotations, settings and sessions stored in this browser?', { title: 'Delete all data', ok: 'Delete everything', danger: true }))) return;
    await this.storage.clearAll();
  }
}

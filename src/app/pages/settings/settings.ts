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
      <div class="form">
        <label>
          <span>View</span>
          <select [ngModel]="s().uiMode" (ngModelChange)="set('uiMode', $event)">
            <option value="simple">Simple – rotation, bars, keys, feedback</option>
            <option value="advanced">Advanced – everything</option>
          </select>
          <small>Simple hides the enemy, pre-build, buff HUD, gear panel and extra options on the Train page and the Loadout, Setups and Explore pages from the menu (they stay reachable by URL). The simulation is the same in both.</small>
        </label>
        <label>
          <span>Simulated ping (ms)</span>
          <input type="number" min="0" max="2000" step="5" [ngModel]="s().pingMs" (ngModelChange)="set('pingMs', $event)" />
          <small>Delay between your key press and the server seeing it. Default 60.</small>
        </label>
        <label>
          <span>Ping jitter (± ms)</span>
          <input type="number" min="0" max="500" step="5" [ngModel]="s().jitterMs" (ngModelChange)="set('jitterMs', $event)" />
          <small>Random variation added to every press. 0 disables it.</small>
        </label>
        <label>
          <span>Hit delay (ticks)</span>
          <input type="number" min="0" max="5" step="1" [ngModel]="s().hitDelayTicks" (ngModelChange)="set('hitDelayTicks', $event)" />
          <small>Ticks between a cast and its damage landing on the target, like the hitsplat in game. Default 2. Abilities with their own timing (Snipe, Backhand, channels, bleeds, conjures) are not shifted.</small>
        </label>
        <label>
          <span>Hit chance</span>
          <select [ngModel]="s().hitChance ?? 'scaled'" (ngModelChange)="set('hitChance', $event)">
            @for (m of HIT_CHANCE_MODES; track m.id) { <option [ngValue]="m.id">{{ m.label }}</option> }
          </select>
          <small>
            Your accuracy (weapon tier, level, prayers, gear) against the target's affinity, Defence level and armour from the enemy panel on the Train page.
            <b>Scaled damage:</b> the game's PvM rule since March 2024 – every hit deals hit chance × its damage, only under 1% everything misses.
            <b>Roll to hit:</b> every hit lands in full or misses (the PvP rule). <b>Off:</b> every hit lands. A custom target has affinity 100 and no armour, so nothing changes until a boss preset is picked.
          </small>
        </label>
        <label class="check">
          <input type="checkbox" [ngModel]="s().abilityQueueing" (ngModelChange)="set('abilityQueueing', $event)" />
          <span>Ability queueing</span>
        </label>
        <small class="indent">
          The in-game setting (Gameplay → Combat &amp; Action Bar → Action Bar). <b>On:</b> pressing during the global cooldown
          queues the ability, it casts the moment the cooldown ends. <b>Off:</b> presses during the cooldown are ignored – you
          have to press in the last tick (0.6 s) to cast right when the cooldown ends. Off is the default for new accounts.
        </small>
        <label class="check">
          <input type="checkbox" [ngModel]="s().loop" (ngModelChange)="set('loop', $event)" />
          <span>Loop the rotation until stopped (Esc)</span>
        </label>
      </div>
    </div>

    <div class="panel">
      <h2>Alt1</h2>
      <p class="muted small">
        Run the compact focus view as an app window inside the game client: install the <a href="https://runeapps.org/alt1" target="_blank" rel="noopener">Alt1 Toolkit</a>,
        then click the link below – Alt1 opens it and asks to add the app. The same view opens in a browser popup with "Popout" on the Train page.
      </p>
      <a class="btn" [href]="ALT1_ADD_URL" title="alt1://addapp/… – needs the Alt1 Toolkit installed">Add to Alt1</a>
      <h2>Coach</h2>
      <p class="muted small">
        The trainer calls the keys out loud – "3", "Ctrl 4", "Shift Q" – like a caller in a rhythm game, and clicks the tick rhythm.
        Switched on and off with the Voice pills on the Train page; the sound starts with the Start button.
      </p>
      <div class="form">
        <label class="check">
          <input type="checkbox" [ngModel]="s().coach.callouts" (ngModelChange)="setCoach('callouts', $event)" />
          <span>Call-outs</span>
        </label>
        <small class="indent">After every cast the keys of the next steps are said at once ("Q, then 3") – you hear what comes next while the global cooldown runs.</small>
        <label class="check">
          <input type="checkbox" [ngModel]="s().coach.lead" (ngModelChange)="setCoach('lead', $event)" />
          <span>Coach mode – call every key at its tick</span>
        </label>
        <small class="indent">
          Every step is called at the moment it should be pressed: the next ability when the global cooldown ends (or a channel finishes), prayers, potions and switches
          on the ticks in between. The voice follows the engine's clock and waits for your actual cast when you fall behind – the scoring is the same as without it.
        </small>
        <label class="check">
          <input type="checkbox" [ngModel]="s().coach.metronome" (ngModelChange)="setCoach('metronome', $event)" />
          <span>Metronome</span>
        </label>
        <small class="indent">A click on every game tick (0.6 s) and a higher beep the moment the global cooldown ends. Sample-accurate (Web Audio).</small>
        <label>
          <span>Volume ({{ s().coach.volume }}%)</span>
          <input type="range" min="0" max="100" step="5" [ngModel]="s().coach.volume" (ngModelChange)="setCoach('volume', $event)" />
        </label>
        <label>
          <span>Call-out lead (ms)</span>
          <input type="number" min="0" max="1000" step="10" [ngModel]="s().coach.leadMs" (ngModelChange)="setCoach('leadMs', $event)" />
          <small>
            How long before the tick the voice starts, on top of the measured start-up delay of the speech engine
@if (coach.latencyMs()) { (measured: {{ coach.latencyMs() }} ms)}. Default 250 – raise it when the voice comes too late, lower it when it runs ahead of the beep.
          </small>
        </label>
        <label>
          <span>Voice</span>
          <select [ngModel]="s().coach.voice" (ngModelChange)="setCoach('voice', $event)">
            <option value="">automatic (English)</option>
            @for (v of coach.voices(); track v.voiceURI) { <option [value]="v.voiceURI">{{ v.name }} ({{ v.lang }})</option> }
          </select>
          <small>
            @if (!coach.supported.speech) { This browser has no speech synthesis – only the metronome works. }
            @else if (!coach.voices().length) { No voices installed – the browser's speech engine has nothing to speak with. }
            @else { The browser's own voices; a local one answers fastest. }
          </small>
        </label>
        <div>
          <button class="btn" (click)="test()" [disabled]="testing()">{{ testing() ? 'Speaking …' : 'Test: "Ctrl 4, then 3"' }}</button>
        </div>
      </div>
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

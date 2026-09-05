import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HIT_CHANCE_MODES, Settings as SettingsModel } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { DialogService } from '../../shared/dialog';

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
  readonly storage = inject(StorageService);
  readonly s = this.storage.settings;
  readonly HIT_CHANCE_MODES = HIT_CHANCE_MODES;

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

  async clearAll(): Promise<void> {
    if (!(await this.dialogs.confirm('Delete all keybinds, rotations, settings and sessions stored in this browser?', { title: 'Delete all data', ok: 'Delete everything', danger: true }))) return;
    await this.storage.clearAll();
  }
}

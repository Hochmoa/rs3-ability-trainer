import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Settings as SettingsModel } from '../../core/models';
import { StorageService } from '../../core/storage.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  template: `
    <div class="panel">
      <h2>Settings</h2>
      <div class="form">
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
          <span>Queue window</span>
          <select [ngModel]="s().queueWindowTicks" (ngModelChange)="set('queueWindowTicks', $event)">
            <option [ngValue]="1">Last tick only (0.6 s) – strict</option>
            <option [ngValue]="2">Last 2 ticks (1.2 s)</option>
            <option [ngValue]="3">Whole GCD (1.8 s) – like ability queueing in game</option>
          </select>
          <small>How early before the global cooldown ends a press still counts as queued.</small>
        </label>
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
  `,
})
export class Settings {
  readonly storage = inject(StorageService);
  readonly s = this.storage.settings;

  set<K extends keyof SettingsModel>(key: K, value: SettingsModel[K]): void {
    const next = { ...this.s(), [key]: value };
    if (typeof next.pingMs !== 'number' || isNaN(next.pingMs)) next.pingMs = 0;
    if (typeof next.jitterMs !== 'number' || isNaN(next.jitterMs)) next.jitterMs = 0;
    next.pingMs = Math.max(0, next.pingMs);
    next.jitterMs = Math.max(0, next.jitterMs);
    void this.storage.saveSettings(next);
  }

  async clearAll(): Promise<void> {
    if (!confirm('Delete all keybinds, rotations, settings and sessions stored in this browser?')) return;
    await this.storage.clearAll();
  }
}

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Loadout as LoadoutModel } from '../../core/models';
import { StorageService } from '../../core/storage.service';

@Component({
  selector: 'app-loadout',
  imports: [FormsModule],
  template: `
    <div class="panel">
      <h2>Loadout</h2>
      <p class="muted small">Everything outside the rotation that changes adrenaline. Numbers from the RuneScape Wiki (after the Combat Style Modernisation, March 2026).</p>
      <div class="form">
        <label>
          <span>Adrenaline at session start</span>
          <span class="row">
            <input type="range" min="0" max="100" step="5" [ngModel]="l().startAdrenaline" (ngModelChange)="set('startAdrenaline', +$event)" />
            <b class="val">{{ l().startAdrenaline }}%</b>
          </span>
          <small>Basics give +9%, enhanced abilities cost their own amount, damaging ultimates cost 60%, buff ultimates (Berserk, Sunshine, Death's Swiftness, Living Death) 100%.</small>
        </label>

        <h3>Equipment</h3>
        <label class="check">
          <input type="checkbox" [ngModel]="l().ringOfVigour" (ngModelChange)="set('ringOfVigour', $event)" />
          <span>Ring of vigour <small>(or its unlocked passive) – keep 10% adrenaline after an ultimate</small></span>
        </label>
        <label class="check">
          <input type="checkbox" [ngModel]="l().vestmentsOfHavoc" (ngModelChange)="set('vestmentsOfHavoc', $event)" />
          <span>Vestments of havoc, 4 pieces <small>– maximum adrenaline +20% with a melee weapon</small></span>
        </label>

        <h3>Invention perks</h3>
        <label>
          <span>Impatient rank</span>
          <select [ngModel]="l().impatientRank" (ngModelChange)="setRank($event)">
            <option [ngValue]="0">none</option>
            <option [ngValue]="1">1 – 9% chance of +3% on basics</option>
            <option [ngValue]="2">2 – 18% chance</option>
            <option [ngValue]="3">3 – 27% chance</option>
            <option [ngValue]="4">4 – 36% chance (ancient gizmo)</option>
          </select>
        </label>

        <h3>Archaeology relics</h3>
        <label class="check">
          <input type="checkbox" [ngModel]="l().furyOfTheSmall" (ngModelChange)="set('furyOfTheSmall', $event)" />
          <span>Fury of the Small <small>– basic abilities generate +1%</small></span>
        </label>
        <label class="check">
          <input type="checkbox" [ngModel]="l().conservationOfEnergy" (ngModelChange)="set('conservationOfEnergy', $event)" />
          <span>Conservation of Energy <small>– regain 10% after an ultimate (stacks with Ring of vigour)</small></span>
        </label>
        <label class="check">
          <input type="checkbox" [ngModel]="l().heightenedSenses" (ngModelChange)="set('heightenedSenses', $event)" />
          <span>Heightened Senses <small>– maximum adrenaline +10%</small></span>
        </label>
        <h3>Prayer book</h3>
        <label>
          <span>Active book</span>
          <select [ngModel]="l().prayerBook ?? 'Curses'" (ngModelChange)="set('prayerBook', $event)">
            <option value="Curses">Ancient Curses (Deflects, Soul Split, Turmoil, …)</option>
            <option value="Prayers">Standard prayers (Protect from …, Piety, …)</option>
          </select>
          <small>Only one book is active in a session, like in the game: prayers of the other book are greyed out and ignored.</small>
        </label>
        <p class="muted small">Adrenaline potions are steps in the rotation (catalog tab "Special"), not part of the loadout.</p>
      </div>
    </div>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 640px;
    }
    h3 {
      margin: 10px 0 0;
      color: var(--gold);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    label > span:first-child {
      font-weight: 600;
    }
    label small {
      color: var(--muted);
      font-weight: 400;
    }
    label.check {
      flex-direction: row;
      align-items: flex-start;
      gap: 8px;
    }
    label.check > span:first-of-type {
      font-weight: 600;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    input[type='range'] {
      flex: 1;
      max-width: 320px;
    }
    .val {
      width: 48px;
    }
  `,
})
export class Loadout {
  readonly storage = inject(StorageService);
  readonly l = this.storage.loadout;

  set<K extends keyof LoadoutModel>(key: K, value: LoadoutModel[K]): void {
    void this.storage.saveLoadout({ ...this.l(), [key]: value });
  }

  setRank(v: unknown): void {
    const n = Math.max(0, Math.min(4, Math.round(Number(v) || 0))) as LoadoutModel['impatientRank'];
    this.set('impatientRank', n);
  }
}

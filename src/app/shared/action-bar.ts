import { Component, input, output } from '@angular/core';
import { Entity } from '../core/data.service';
import { UsableReason } from '../engine/trainer-engine';
import { EntityTip } from './tooltip';

/** What the train page knows about one slot right now. */
export interface SlotView {
  entity: Entity | null;
  keyLabel: string;
  /** null when idle */
  usable: UsableReason | null;
  /** seconds left on the entity's own cooldown, 0 = none */
  cooldownS: number;
  /** 0..1 GCD progress for GCD abilities, 1 = no overlay */
  gcdPhase: number;
  gcdRemainingMs: number;
  /** this slot holds the step the rotation expects next */
  expected: boolean;
  /** this slot's ability sits in the game's queue slot */
  queued: boolean;
  /** brief highlight after a cast */
  flash: 'fired' | 'wrong' | null;
}

/** One in-game action bar (14 slots) as shown while training. */
@Component({
  selector: 'action-bar',
  imports: [EntityTip],
  template: `
    <div class="bar" [class.main]="position() === 0">
      <div class="label" [title]="presetName()">
        <span class="pos">{{ position() === 0 ? 'M' : position() }}</span>
        <span class="preset">{{ presetName() }}</span>
      </div>
      <div class="slots">
        @for (s of slots(); track $index) {
          <div
            class="slot"
            [class.empty]="!s.entity"
            [class.expected]="s.expected"
            [class.queued]="s.queued"
            [class.unusable]="s.usable && s.usable !== 'ok'"
            [class]="'slot' + (s.entity ? ' ' + s.entity.kind : ' empty') + (s.expected ? ' expected' : '') + (s.queued ? ' queued' : '') + (s.usable && s.usable !== 'ok' ? ' unusable ' + s.usable : '') + (s.flash ? ' flash-' + s.flash : '')"
            [entityTip]="s.entity"
            (click)="slotClick.emit($index)"
          >
            @if (s.entity) {
              <img [src]="s.entity.icon" [alt]="s.entity.name" draggable="false" />
              @if (s.gcdPhase < 1) {
                <div class="gcd" [style.background]="overlay(s.gcdPhase)"></div>
                @if (s.gcdRemainingMs > 0) {
                  <span class="seconds">{{ ceil(s.gcdRemainingMs / 1000) }}</span>
                }
              } @else if (s.cooldownS > 0) {
                <div class="cd"></div>
                <span class="seconds small">{{ ceil(s.cooldownS) }}</span>
              }
            }
            @if (s.keyLabel) {
              <span class="key">{{ s.keyLabel }}</span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .bar {
      display: flex;
      align-items: stretch;
      gap: 6px;
      padding: 3px 4px;
      background: linear-gradient(#26241d, #16150f);
      border: 1px solid #4a4536;
      border-radius: 4px;
    }
    .bar.main {
      border-color: var(--gold);
    }
    .label {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 64px;
      flex: none;
      padding: 0 4px;
      overflow: hidden;
    }
    .pos {
      font-weight: 700;
      color: var(--gold);
      font-size: 13px;
    }
    .preset {
      font-size: 10px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slots {
      display: grid;
      grid-template-columns: repeat(14, 1fr);
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .slot {
      position: relative;
      aspect-ratio: 1;
      background: #0a0a0c;
      border: 1px solid #3a3730;
      border-radius: 3px;
      overflow: hidden;
      min-width: 0;
    }
    .slot img {
      width: 100%;
      height: 100%;
      display: block;
    }
    .slot.unusable img {
      filter: grayscale(1) brightness(0.45);
    }
    .slot.expected {
      border-color: var(--gold);
      box-shadow: 0 0 6px var(--gold), inset 0 0 4px rgba(201, 162, 39, 0.6);
    }
    .slot.queued {
      border-color: #ffe27a;
      box-shadow: 0 0 8px #ffe27a;
    }
    .slot.flash-fired {
      border-color: #4caf50;
      box-shadow: 0 0 8px #4caf50;
    }
    .slot.flash-wrong {
      border-color: #e53935;
      box-shadow: 0 0 8px #e53935;
    }
    .gcd,
    .cd {
      position: absolute;
      inset: 0;
    }
    .cd {
      background: rgba(0, 0, 0, 0.6);
    }
    .seconds {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: clamp(10px, 1.6vw, 20px);
      text-shadow: 0 0 3px #000, 0 0 4px #000;
      pointer-events: none;
    }
    .seconds.small {
      font-size: clamp(9px, 1.1vw, 14px);
      color: #ffd27a;
    }
    .key {
      position: absolute;
      left: 0;
      bottom: 0;
      padding: 0 3px;
      font-size: clamp(8px, 0.9vw, 12px);
      font-weight: 600;
      color: #ffe27a;
      background: rgba(0, 0, 0, 0.7);
      border-top-right-radius: 3px;
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  `,
})
export class ActionBar {
  readonly position = input.required<number>();
  readonly presetName = input<string>('');
  readonly slots = input.required<SlotView[]>();
  readonly slotClick = output<number>();
  readonly ceil = Math.ceil;

  overlay(phase: number): string {
    const deg = Math.round(phase * 360);
    return 'conic-gradient(transparent 0deg ' + deg + 'deg, rgba(0, 0, 0, 0.72) ' + deg + 'deg 360deg)';
  }
}

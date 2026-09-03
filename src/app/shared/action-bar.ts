import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
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

/**
 * One in-game action bar (14 slots, or 2 × 7 when compact) as shown while training.
 * `droppable`: slots accept drops from any cdkDropList in the surrounding cdkDropListGroup.
 * `editable`: slots show ‹ › and × buttons on hover.
 * The label sits on the right: position number plus an info icon whose tooltip is the preset name.
 */
@Component({
  selector: 'action-bar',
  imports: [EntityTip, CdkDropList],
  template: `
    <div class="bar" [class.main]="position() === 0" [class.compact]="compact()" [class.editable]="editable()">
      <div class="slots">
        @for (s of slots(); track $index) {
          <div
            class="slot"
            [class]="'slot' + (s.entity ? ' ' + s.entity.kind : ' empty') + (s.expected ? ' expected' : '') + (s.queued ? ' queued' : '') + (s.usable && s.usable !== 'ok' ? ' unusable ' + s.usable : '') + (s.flash ? ' flash-' + s.flash : '')"
            [entityTip]="s.entity"
            cdkDropList
            cdkDropListSortingDisabled
            [cdkDropListDisabled]="!droppable()"
            [id]="'bar-' + position() + '-slot-' + $index"
            (cdkDropListDropped)="onDrop($event, $index)"
            (click)="slotClick.emit($index)"
          >
            @if (s.entity) {
              <img [src]="s.entity.icon" [alt]="s.entity.name" draggable="false" />
              @if (s.cooldownS > 0) {
                <!-- the ability's own cooldown wins: its remaining seconds, no GCD sweep -->
                <div class="cd"></div>
                <span class="seconds small">{{ ceil(s.cooldownS) }}</span>
              } @else if (s.gcdPhase < 1) {
                <!-- global cooldown: sweep only, no number -->
                <div class="gcd" [style.background]="overlay(s.gcdPhase)"></div>
              }
              @if (editable()) {
                <button class="edit move left" [disabled]="$first" (click)="slotMove.emit({ slot: $index, dir: -1 }); $event.stopPropagation()" title="Move left">‹</button>
                <button class="edit move right" [disabled]="$last" (click)="slotMove.emit({ slot: $index, dir: 1 }); $event.stopPropagation()" title="Move right">›</button>
                <button class="edit clear" (click)="slotClear.emit($index); $event.stopPropagation()" title="Remove from bar">×</button>
              }
            }
            @if (s.keyLabel) {
              <span class="key">{{ s.keyLabel }}</span>
            }
          </div>
        }
      </div>
      <div class="label">
        <span class="pos">{{ position() === 0 ? 'M' : position() }}</span>
        <span class="info" [title]="presetName()" [attr.aria-label]="presetName()">i</span>
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
      align-items: center;
      justify-content: flex-end;
      gap: 5px;
      width: 40px;
      flex: none;
      padding: 0 2px;
    }
    .bar.compact .label {
      width: 34px;
      flex-direction: column;
      justify-content: center;
      gap: 3px;
    }
    .pos {
      font-weight: 700;
      color: var(--gold);
      font-size: 13px;
    }
    .info {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 15px;
      height: 15px;
      border: 1px solid var(--muted);
      border-radius: 50%;
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      font-style: italic;
      font-family: Georgia, serif;
      cursor: help;
    }
    .info:hover {
      border-color: var(--gold);
      color: var(--gold);
    }
    .slots {
      display: grid;
      grid-template-columns: repeat(14, 1fr);
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .bar.compact .slots {
      grid-template-columns: repeat(7, 1fr);
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
    .editable .slot.empty {
      border-style: dashed;
    }
    .slot.cdk-drop-list-dragging,
    .slot.cdk-drop-list-receiving {
      border-color: var(--gold);
      background: rgba(201, 162, 39, 0.15);
    }
    .slot .cdk-drag-placeholder {
      display: none;
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
    .edit {
      position: absolute;
      display: none;
      padding: 0;
      border: none;
      background: rgba(0, 0, 0, 0.75);
      color: #ffe27a;
      font: inherit;
      font-size: 13px;
      line-height: 16px;
      cursor: pointer;
    }
    .edit:disabled {
      color: #666;
      cursor: default;
    }
    .edit.move {
      top: 0;
      bottom: 0;
      width: 14px;
      align-items: center;
      justify-content: center;
    }
    .edit.left {
      left: 0;
    }
    .edit.right {
      right: 0;
    }
    .edit.clear {
      top: 0;
      right: 0;
      width: 16px;
      height: 16px;
      color: #ff8a80;
      font-size: 12px;
      border-bottom-left-radius: 4px;
    }
    .slot:hover .edit {
      display: flex;
    }
    .slot:hover .edit.right {
      bottom: 16px;
    }
  `,
})
export class ActionBar {
  readonly position = input.required<number>();
  readonly presetName = input<string>('');
  readonly slots = input.required<SlotView[]>();
  /** half width, two rows of 7 slots */
  readonly compact = input<boolean>(false);
  /** slots accept drops (abilities dragged from the "missing" list) */
  readonly droppable = input<boolean>(false);
  /** slots show ‹ › × buttons */
  readonly editable = input<boolean>(false);
  readonly slotClick = output<number>();
  readonly slotDrop = output<{ slot: number; entity: Entity }>();
  readonly slotMove = output<{ slot: number; dir: -1 | 1 }>();
  readonly slotClear = output<number>();
  readonly ceil = Math.ceil;

  overlay(phase: number): string {
    const deg = Math.round(phase * 360);
    return 'conic-gradient(transparent 0deg ' + deg + 'deg, rgba(0, 0, 0, 0.72) ' + deg + 'deg 360deg)';
  }

  onDrop(event: CdkDragDrop<unknown>, slot: number): void {
    const entity = event.item.data as Entity | undefined;
    if (entity && typeof entity === 'object' && 'key' in entity) this.slotDrop.emit({ slot, entity });
  }
}

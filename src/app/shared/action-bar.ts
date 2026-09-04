import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, input, output } from '@angular/core';
import { Entity } from '../core/data.service';
import { UsableReason } from '../engine/trainer-engine';
import { EntityTip } from './tooltip';

/** What the train page knows about one slot right now. */
export interface SlotView {
  entity: Entity | null;
  /** what the slot shows right now when it differs from the entity (Command Ghost, Slaughter, Spectral Scythe 2) */
  morph?: { entity: Entity; stage: number } | null;
  keyLabel: string;
  /** null when idle */
  usable: UsableReason | null;
  /** seconds left on the entity's own cooldown, 0 = none */
  cooldownS: number;
  /** 0..1 progress of the entity's own cooldown (1 = ready); drives the sweep overlay */
  cooldownPhase: number;
  /** 0..1 GCD progress for GCD abilities, 1 = no overlay */
  gcdPhase: number;
  gcdRemainingMs: number;
  /** this slot holds the step the rotation expects next */
  expected: boolean;
  /** this slot's ability sits in the game's queue slot */
  queued: boolean;
  /** the slot's prayer / curse is switched on right now – lit up like in the game */
  active?: boolean;
  /** brief highlight after a cast */
  flash: 'fired' | 'wrong' | null;
  /** pressed, the server has not processed it yet – the game's instant click feedback */
  pressed?: boolean;
}

/**
 * One in-game action bar (14 slots, or 2 × 7 when compact) as shown while training.
 * `droppable`: slots accept drops from any cdkDropList in the surrounding cdkDropListGroup.
 * `editable`: slots show ‹ › and × buttons on hover.
 * The label sits on the right: position number plus an info icon whose tooltip is the preset name.
 */
@Component({
  selector: 'action-bar',
  imports: [EntityTip, CdkDropList, CdkDrag],
  template: `
    <div class="bar" [class.main]="position() === 0" [class.compact]="compact()" [class.editable]="editable()">
      <div class="slots">
        @for (s of slots(); track $index) {
          <div
            class="slot"
            [class]="'slot' + (s.entity ? ' ' + s.entity.kind : ' empty') + (s.expected ? ' expected' : '') + (s.queued ? ' queued' : '') + (s.active ? ' active' : '') + (s.usable && s.usable !== 'ok' ? ' unusable ' + s.usable : '') + (s.flash ? ' flash-' + s.flash : '') + (s.pressed ? ' pressed' : '')"
            [entityTip]="s.morph?.entity ?? s.entity"
            cdkDropList
            cdkDropListSortingDisabled
            [cdkDropListDisabled]="!droppable()"
            [id]="'bar-' + position() + '-slot-' + $index"
            (cdkDropListDropped)="onDrop($event, $index)"
            (click)="slotClick.emit($index)"
          >
            @if (s.entity) {
              <!-- the icon can be dragged to another slot / bar while the bars are editable (not during a session) -->
              <div class="drag" cdkDrag [cdkDragData]="{ pos: position(), slot: $index, entity: s.entity }" [cdkDragDisabled]="!droppable()">
                <img [src]="(s.morph?.entity ?? s.entity).icon" [alt]="(s.morph?.entity ?? s.entity).name" draggable="false" />
              </div>
              @if (s.morph && s.morph.stage > 1 && s.morph.entity.key === s.entity.key) {
                <span class="stage">{{ s.morph.stage }}</span>
              }
              @if (s.active) {
                <!-- active prayer / curse: lit-up overlay, like the game's "on" state -->
                <div class="active-glow"></div>
              }
              @if (s.pressed) {
                <!-- pressed: white flash over the icon until the server takes the input on the next tick -->
                <div class="press-flash"></div>
              }
              @if (s.queued) {
                <!-- queued: black loading ring, like the game's queue indicator -->
                <div class="queue-spin"></div>
              }
              @if (s.cooldownS > 0) {
                <!-- the ability's own cooldown wins: its remaining seconds, no GCD sweep -->
                <div class="cd" [style.background]="overlay(s.cooldownPhase)"></div>
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
        <!-- Revolution range: the game's yellow frame around the first N slots of the main bar -->
        @for (box of revolutionBoxes(); track $index) {
          <div class="revolution" [style]="box" title="Revolution: the leftmost usable ability in this box fires on its own"></div>
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
      position: relative;
      display: grid;
      grid-template-columns: repeat(14, 1fr);
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .revolution {
      position: absolute;
      border: 2px solid #f2d21b;
      border-radius: 4px;
      box-shadow: 0 0 5px rgba(242, 210, 27, 0.55), inset 0 0 3px rgba(242, 210, 27, 0.35);
      pointer-events: none;
      z-index: 3;
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
    .slot .drag {
      position: absolute;
      inset: 0;
    }
    .slot .drag.cdk-drag-dragging {
      opacity: 0.35;
    }
    .slot img {
      width: 100%;
      height: 100%;
      display: block;
    }
    /* potions and weapons carry ~30 px inventory icons: draw them 1:1 in the middle of the dark cell like the game, never upscaled */
    .slot.special .drag,
    .slot.weapon .drag {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .slot.special img,
    .slot.weapon img {
      width: auto;
      height: auto;
      max-width: 88%;
      max-height: 88%;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.8));
    }
    .slot.unusable img {
      filter: grayscale(1) brightness(0.45);
    }
    /* active prayer / curse: bright white-blue frame with a soft glow and a light wash over the icon
       (queued / expected / flash rules below override the frame, so those states stay visible on top) */
    .slot.active {
      border-color: #e8f6ff;
      box-shadow: 0 0 7px 1px rgba(200, 235, 255, 0.85), inset 0 0 6px rgba(232, 246, 255, 0.55);
    }
    .active-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 40%, rgba(232, 246, 255, 0.3), rgba(232, 246, 255, 0.08) 70%);
      pointer-events: none;
      z-index: 1;
      animation: active-pulse 1.6s ease-in-out infinite;
    }
    @keyframes active-pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.55;
      }
    }
    .slot.expected {
      border-color: var(--gold);
      box-shadow: 0 0 6px var(--gold), inset 0 0 4px rgba(201, 162, 39, 0.6);
    }
    .queue-spin {
      position: absolute;
      inset: 18%;
      border-radius: 50%;
      border: 3px solid rgba(0, 0, 0, 0.85);
      border-top-color: transparent;
      animation: queue-spin 0.9s linear infinite;
      pointer-events: none;
      z-index: 2;
      filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
    }
    @keyframes queue-spin {
      to {
        transform: rotate(360deg);
      }
    }
    .stage {
      position: absolute;
      top: 1px;
      right: 2px;
      font-size: 10px;
      font-weight: 700;
      color: #8fd3ff;
      background: rgba(0, 0, 0, 0.75);
      border-radius: 3px;
      padding: 0 3px;
      pointer-events: none;
    }
    .slot.queued {
      border-color: #ffe27a;
      box-shadow: 0 0 8px #ffe27a;
    }
    .slot.pressed {
      border-color: #fff;
      box-shadow: 0 0 8px #fff, inset 0 0 5px rgba(255, 255, 255, 0.8);
    }
    .press-flash {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.35);
      pointer-events: none;
      z-index: 2;
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
  /** Revolution range: the first N slots get the yellow frame (main bar only, 0 = none) */
  readonly revolutionSlots = input<number>(0);
  readonly slotClick = output<number>();
  /** something was dropped on a slot: an entity from the "missing" list, or (`from` set) the icon of another slot */
  readonly slotDrop = output<{ slot: number; entity: Entity; from?: { pos: number; slot: number } }>();
  readonly slotMove = output<{ slot: number; dir: -1 | 1 }>();
  readonly slotClear = output<number>();
  readonly ceil = Math.ceil;

  /**
   * Inline styles of the yellow Revolution frame(s): one box over the first N slots of a wide bar, one per row of a
   * compact bar (7 + rest). Sized from the grid geometry (14 or 7 columns, 2px gaps), 2px outside the slots.
   */
  revolutionBoxes(): string[] {
    const n = this.position() === 0 ? Math.max(0, Math.min(14, Math.floor(this.revolutionSlots() || 0))) : 0;
    if (!n) return [];
    const per = this.compact() ? 7 : 14;
    const out: string[] = [];
    for (let row = 0; row * per < n; row++) {
      const cols = Math.min(per, n - row * per);
      const width = 'calc((100% - ' + (per - 1) * 2 + 'px) * ' + cols + ' / ' + per + ' + ' + ((cols - 1) * 2 + 4) + 'px)';
      const height = this.compact() ? 'calc((100% - 2px) / 2 + 4px)' : 'calc(100% + 4px)';
      const top = this.compact() ? 'calc(' + row + ' * ((100% - 2px) / 2 + 2px) - 2px)' : '-2px';
      out.push('left:-2px;top:' + top + ';width:' + width + ';height:' + height);
    }
    return out;
  }

  overlay(phase: number): string {
    const deg = Math.round(phase * 360);
    return 'conic-gradient(transparent 0deg ' + deg + 'deg, rgba(0, 0, 0, 0.72) ' + deg + 'deg 360deg)';
  }

  onDrop(event: CdkDragDrop<unknown>, slot: number): void {
    const data = event.item.data as Entity | { pos: number; slot: number; entity: Entity } | undefined;
    if (!data || typeof data !== 'object') return;
    if ('key' in data) this.slotDrop.emit({ slot, entity: data });
    else if ('entity' in data) this.slotDrop.emit({ slot, entity: data.entity, from: { pos: data.pos, slot: data.slot } });
  }
}

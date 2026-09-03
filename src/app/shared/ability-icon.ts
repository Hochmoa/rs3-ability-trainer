import { Component, computed, input } from '@angular/core';

export type IconState = 'idle' | 'queued' | 'too-early' | 'wrong' | 'fired' | 'done';

@Component({
  selector: 'ability-icon',
  template: `
    <div
      class="icon"
      [class]="'icon state-' + state()"
      [style.width.px]="px()"
      [style.height.px]="px()"
      [style.font-size.px]="px() / 4"
      [title]="ability().name"
    >
      <img [src]="ability().icon" [alt]="ability().name" draggable="false" />
      @if (gcdPhase() < 1) {
        <div class="cooldown" [style.background]="overlay()"></div>
        @if (seconds() > 0) {
          <div class="seconds">{{ seconds() }}</div>
        }
      }
      @if (keyLabel()) {
        <div class="key">{{ keyLabel() }}</div>
      }
    </div>
  `,
  styles: `
    .icon {
      position: relative;
      border: 2px solid #4a4536;
      border-radius: 6px;
      background: #000;
      overflow: hidden;
      box-sizing: border-box;
      flex: none;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    img {
      width: 100%;
      height: 100%;
      display: block;
      image-rendering: auto;
    }
    .cooldown {
      position: absolute;
      inset: 0;
    }
    .seconds {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.4em;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 0 4px #000, 0 0 8px #000;
      pointer-events: none;
    }
    .key {
      position: absolute;
      left: 0;
      bottom: 0;
      padding: 0.1em 0.4em;
      background: rgba(0, 0, 0, 0.75);
      color: #ffe27a;
      font-size: 1em;
      font-weight: 600;
      border-top-right-radius: 4px;
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .state-queued {
      border-color: #ffe27a;
      box-shadow: 0 0 10px #ffe27a;
    }
    .state-fired {
      border-color: #4caf50;
      box-shadow: 0 0 12px #4caf50;
    }
    .state-done {
      border-color: #4caf50;
      opacity: 0.55;
    }
    .state-too-early,
    .state-wrong {
      border-color: #e53935;
      box-shadow: 0 0 12px #e53935;
    }
  `,
})
export class AbilityIcon {
  /** anything with a name and an icon: Ability, Prayer, Special or Entity */
  readonly ability = input.required<{ name: string; icon: string }>();
  readonly keyLabel = input<string>('');
  readonly px = input<number>(64);
  /** 0..1, 1 = ready */
  readonly gcdPhase = input<number>(1);
  readonly remainingMs = input<number>(0);
  readonly state = input<IconState>('idle');

  readonly overlay = computed(() => {
    const deg = Math.round(this.gcdPhase() * 360);
    return `conic-gradient(transparent 0deg ${deg}deg, rgba(0, 0, 0, 0.72) ${deg}deg 360deg)`;
  });
  readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
}

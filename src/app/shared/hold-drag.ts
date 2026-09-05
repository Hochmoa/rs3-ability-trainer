/**
 * Arming of the pointer-based drags (the action bar editor in pages/bars and the gear drag in shared/gear-drag).
 *
 * Mouse / pen: the drag starts once the pointer has moved DRAG_PX, like before. Touch: a finger has to rest on
 * the source for HOLD_MS without moving first – a move before that is a scroll and cancels the hold, so the
 * sources can keep `touch-action: pan-y` and the page stays scrollable with a swipe that starts on an icon.
 * Once the hold is over the drag is on: the caller shows the ghost and `preventDefault`s the `touchmove`s
 * (non-passive listener) so the browser does not start panning under the drag.
 *
 * Pure (no DOM, time passed in) so the timing is testable.
 */
export const HOLD_MS = 300;
export const DRAG_PX = 6;

export type HoldPhase = 'idle' | 'holding' | 'armed' | 'dragging' | 'cancelled';

export class DragArm {
  phase: HoldPhase = 'idle';
  private x = 0;
  private y = 0;
  private deadline = 0;

  constructor(
    readonly holdMs = HOLD_MS,
    readonly movePx = DRAG_PX,
  ) {}

  /** pointerdown – returns the ms after which `tick()` has to be called (touch hold), 0 when no timer is needed */
  down(pointerType: string, x: number, y: number, now: number): number {
    this.x = x;
    this.y = y;
    if (pointerType === 'touch') {
      this.phase = 'holding';
      this.deadline = now + this.holdMs;
      return this.holdMs;
    }
    this.phase = 'armed';
    return 0;
  }

  /**
   * pointermove – 'start' when the drag begins with this move, 'cancel' when a finger moved during the hold
   * (that is a scroll, the drag is off until the next pointerdown), 'none' otherwise
   */
  move(x: number, y: number, now: number): 'start' | 'cancel' | 'none' {
    const far = Math.hypot(x - this.x, y - this.y) >= this.movePx;
    if (this.phase === 'holding') {
      if (now >= this.deadline) {
        this.phase = 'dragging';
        return 'start';
      }
      if (far) {
        this.phase = 'cancelled';
        return 'cancel';
      }
      return 'none';
    }
    if (this.phase === 'armed' && far) {
      this.phase = 'dragging';
      return 'start';
    }
    return 'none';
  }

  /** the hold timer fired – true when the drag starts now (the finger rested long enough) */
  tick(now: number): boolean {
    if (this.phase !== 'holding' || now < this.deadline) return false;
    this.phase = 'dragging';
    return true;
  }

  /** pointerup / pointercancel / abort */
  up(): void {
    this.phase = 'idle';
  }

  get dragging(): boolean {
    return this.phase === 'dragging';
  }
}

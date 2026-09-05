import { describe, expect, it } from 'vitest';
import { DRAG_PX, DragArm, HOLD_MS } from './hold-drag';

describe('DragArm', () => {
  it('mouse: no timer, the drag starts after the pointer moved DRAG_PX', () => {
    const a = new DragArm();
    expect(a.down('mouse', 100, 100, 0)).toBe(0);
    expect(a.phase).toBe('armed');
    expect(a.move(102, 103, 10)).toBe('none');
    expect(a.move(100 + DRAG_PX, 100, 20)).toBe('start');
    expect(a.dragging).toBe(true);
    expect(a.move(200, 200, 30)).toBe('none'); // already dragging
    a.up();
    expect(a.phase).toBe('idle');
  });

  it('touch: a move during the hold is a scroll and cancels the drag until the next pointerdown', () => {
    const a = new DragArm();
    expect(a.down('touch', 50, 50, 1000)).toBe(HOLD_MS);
    expect(a.phase).toBe('holding');
    expect(a.move(51, 52, 1050)).toBe('none'); // finger jitter
    expect(a.move(50, 70, 1100)).toBe('cancel');
    expect(a.phase).toBe('cancelled');
    expect(a.tick(1000 + HOLD_MS)).toBe(false); // the timer fires later – nothing starts
    expect(a.move(50, 200, 1500)).toBe('none');
    expect(a.dragging).toBe(false);
  });

  it('touch: a finger resting for HOLD_MS starts the drag on the timer, later moves drag', () => {
    const a = new DragArm();
    a.down('touch', 50, 50, 1000);
    expect(a.tick(1000 + HOLD_MS - 1)).toBe(false); // too early (a stray timer)
    expect(a.phase).toBe('holding');
    expect(a.tick(1000 + HOLD_MS)).toBe(true);
    expect(a.dragging).toBe(true);
    expect(a.tick(2000)).toBe(false); // fires once
    expect(a.move(50, 200, 1400)).toBe('none'); // dragging already – the caller moves the ghost
  });

  it('touch: a move after the hold elapsed starts the drag even before the timer callback ran', () => {
    const a = new DragArm();
    a.down('touch', 50, 50, 1000);
    expect(a.move(50, 90, 1000 + HOLD_MS)).toBe('start');
    expect(a.tick(1000 + HOLD_MS + 5)).toBe(false);
  });

  it('pen behaves like the mouse', () => {
    const a = new DragArm();
    expect(a.down('pen', 0, 0, 0)).toBe(0);
    expect(a.move(0, DRAG_PX, 1)).toBe('start');
  });

  it('up() resets from every phase', () => {
    for (const type of ['mouse', 'touch']) {
      const a = new DragArm();
      a.down(type, 0, 0, 0);
      a.up();
      expect(a.phase).toBe('idle');
      expect(a.move(50, 50, 1)).toBe('none');
      expect(a.tick(1000)).toBe(false);
    }
  });
});

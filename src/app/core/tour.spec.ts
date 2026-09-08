import { describe, expect, it } from 'vitest';
import { TOUR_STEPS, blockers, cardPosition, spotlight, visibleSteps } from './tour';

const view = { width: 1000, height: 800 };

describe('the guided tour', () => {
  it('every step names a route, a title and a text, and its ids are unique', () => {
    for (const s of TOUR_STEPS) {
      expect(s.route, s.id).toMatch(/^\/|^$/);
      expect(s.title.length, s.id).toBeGreaterThan(3);
      expect(s.text.length, s.id).toBeGreaterThan(20);
      if (s.target) expect(s.target, s.id).toMatch(/^\[data-tour="[a-z-]+"\]$/);
    }
    expect(new Set(TOUR_STEPS.map((s) => s.id)).size).toBe(TOUR_STEPS.length);
    expect(TOUR_STEPS[0].target).toBeUndefined(); // the welcome card sits in the middle
  });

  it('the simple view skips the steps that need the advanced pages', () => {
    expect(visibleSteps(TOUR_STEPS, true)).toHaveLength(TOUR_STEPS.length);
    const simple = visibleSteps(TOUR_STEPS, false);
    expect(simple.length).toBeLessThan(TOUR_STEPS.length);
    expect(simple.some((s) => s.advancedOnly)).toBe(false);
  });

  it('the spotlight is the element grown by the padding, never clamped', () => {
    expect(spotlight({ top: 100, left: 200, width: 50, height: 20 }, 6)).toEqual({ top: 94, left: 194, width: 62, height: 32 });
    // an element still below the fold keeps its size, so the hole does not collapse while the page scrolls
    expect(spotlight({ top: 900, left: 0, width: 400, height: 200 }, 6)).toEqual({ top: 894, left: -6, width: 412, height: 212 });
  });

  it('the veil covers everything but the hole', () => {
    const box = { top: 100, left: 200, width: 300, height: 50 };
    const parts = blockers(box, view);
    expect(parts).toHaveLength(4);
    const area = parts.reduce((n, r) => n + r.width * r.height, 0);
    expect(area).toBe(view.width * view.height - box.width * box.height);
    // no part overlaps the hole
    for (const r of parts) {
      const overlapX = Math.max(0, Math.min(r.left + r.width, box.left + box.width) - Math.max(r.left, box.left));
      const overlapY = Math.max(0, Math.min(r.top + r.height, box.top + box.height) - Math.max(r.top, box.top));
      expect(overlapX * overlapY).toBe(0);
    }
    expect(blockers(null, view)).toEqual([{ top: 0, left: 0, width: view.width, height: view.height }]);
    // a hole against the top left edge leaves only two parts
    expect(blockers({ top: 0, left: 0, width: 100, height: 100 }, view)).toHaveLength(2);
    // a hole below the fold: the screen stays veiled exactly once – overlapping parts would paint it twice as dark
    const off = blockers({ top: 900, left: -6, width: 412, height: 212 }, view);
    expect(off.reduce((n, r) => n + r.width * r.height, 0)).toBe(view.width * view.height);
    for (const r of off) {
      expect(r.top).toBeGreaterThanOrEqual(0);
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.top + r.height).toBeLessThanOrEqual(view.height);
      expect(r.left + r.width).toBeLessThanOrEqual(view.width);
    }
    // a hole hanging over the bottom edge: the visible part of it stays a hole, the rest is veiled once
    const half = blockers({ top: 700, left: 100, width: 200, height: 400 }, view);
    expect(half.reduce((n, r) => n + r.width * r.height, 0)).toBe(view.width * view.height - 200 * 100);
  });

  it('the card goes under the spotlight, over it when there is no room, centred when neither fits', () => {
    const card = { width: 320, height: 160 };
    const below = cardPosition({ top: 100, left: 400, width: 100, height: 40 }, card, view);
    expect(below.placement).toBe('below');
    expect(below.top).toBe(152);
    expect(below.left).toBe(290); // centred under the element

    const above = cardPosition({ top: 700, left: 400, width: 100, height: 60 }, card, view);
    expect(above.placement).toBe('above');
    expect(above.top).toBe(528);

    const tall = cardPosition({ top: 60, left: 0, width: 1000, height: 700 }, card, view);
    expect(tall.placement).toBe('centre');
    expect(cardPosition(null, card, view).placement).toBe('centre');
  });

  it('the card never leaves the viewport', () => {
    const card = { width: 320, height: 160 };
    const atEdge = cardPosition({ top: 10, left: 960, width: 40, height: 20 }, card, view);
    expect(atEdge.left).toBeLessThanOrEqual(view.width - card.width - 8);
    expect(cardPosition({ top: 10, left: 0, width: 20, height: 20 }, card, view).left).toBeGreaterThanOrEqual(8);
  });
});

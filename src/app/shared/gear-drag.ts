import { Injectable, inject, signal } from '@angular/core';
import type { GearDrag } from './gear-panel';
import { DragArm } from './hold-drag';
import { TooltipService } from './tooltip';

/** DOM event fired on the drop target (an element with `data-gear-drop`); `detail` is the GearDrag. */
export const GEAR_DROP_EVENT = 'gear-drop';

/**
 * Pointer-based drag & drop for gear – catalog ↔ equipment ↔ backpack – built like the action bar
 * editor (pages/bars): the source keeps showing its item, a ghost icon follows the pointer and the
 * target under the pointer is highlighted; nothing is moved or hidden until the drop.
 *
 * Drop targets are elements carrying `data-gear-drop="<id>"` (e.g. `equip:head`, `inv:3`, `catalog`).
 * A target that cannot take the current drag simply leaves the attribute off, so it is never hit.
 * On drop the target receives a `gear-drop` CustomEvent whose `detail` is the GearDrag.
 */
@Injectable({ providedIn: 'root' })
export class GearDragService {
  /** the drag in progress once the pointer moved a few pixels, null otherwise */
  readonly drag = signal<GearDrag | null>(null);
  /** `data-gear-drop` id of the target under the pointer, null when there is none */
  readonly hover = signal<string | null>(null);
  /** true right after a drop: the click the browser fires on the common ancestor is not a click */
  suppressClick = false;

  private current: { drag: GearDrag; icon: string | null; name: string; ghost: HTMLElement | null; moved: boolean } | null = null;
  /** mouse: drag after 6 px; touch: only after a 300 ms hold without movement (a swipe scrolls) – hold-drag.ts */
  private readonly arm = new DragArm();
  private holdTimer = 0;
  private readonly tips = inject(TooltipService);

  /**
   * pointerdown on a source. Touch: the finger has to rest 300 ms first (a swipe scrolls – the sources keep
   * `touch-action: pan-y`); while dragging the touchmoves are cancelled so the browser does not pan under the drag.
   */
  start(ev: PointerEvent, drag: GearDrag, view: { icon: string | null; name: string }): void {
    if (ev.button !== 0 || this.current) return;
    const touch = ev.pointerType === 'touch';
    if (!touch) ev.preventDefault(); // mouse: no text selection / native image drag; touch: the pan must stay possible
    this.current = { drag, icon: view.icon, name: view.name, ghost: null, moved: false };
    const wait = this.arm.down(ev.pointerType, ev.clientX, ev.clientY, performance.now());
    const { clientX, clientY } = ev;
    if (wait) this.holdTimer = window.setTimeout(() => this.arm.tick(performance.now()) && this.begin(clientX, clientY), wait);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onEnd);
    window.addEventListener('pointercancel', this.onEnd);
    if (touch) window.addEventListener('touchmove', this.onTouchMove, { passive: false });
  }

  /** drops a drag in flight without a drop (the panel / page is destroyed mid-drag) */
  cancel(): void {
    this.cleanup();
  }

  private begin(x: number, y: number): void {
    const c = this.current;
    if (!c || c.moved) return;
    c.moved = true;
    c.ghost = this.makeGhost(c.icon, c.name);
    c.ghost.style.left = x - 24 + 'px';
    c.ghost.style.top = y - 24 + 'px';
    this.drag.set(c.drag);
    this.tips.dragging = true; // no long-press tooltip on top of the drag
    this.tips.state.set(null);
  }

  private onTouchMove = (ev: TouchEvent): void => {
    if (this.arm.dragging && ev.cancelable) ev.preventDefault();
  };

  /** removes the listeners, the timer and the ghost; returns the drag that was in flight */
  private cleanup(): typeof this.current {
    const c = this.current;
    this.current = null;
    window.clearTimeout(this.holdTimer);
    this.arm.up();
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onEnd);
    window.removeEventListener('pointercancel', this.onEnd);
    window.removeEventListener('touchmove', this.onTouchMove);
    if (!c) return null;
    c.ghost?.remove();
    this.hover.set(null);
    this.drag.set(null);
    this.tips.dragging = false;
    return c;
  }

  /** is this source the one being dragged (dimmed in the panel) */
  isSource(kind: 'inv' | 'equip', id: number | string): boolean {
    const d = this.drag();
    if (!d) return false;
    if (d.from.kind === 'inv') return kind === 'inv' && d.from.index === id;
    if (d.from.kind === 'equip') return kind === 'equip' && d.from.slot === id;
    return false;
  }

  private onMove = (ev: PointerEvent): void => {
    const c = this.current;
    if (!c) return;
    const r = this.arm.move(ev.clientX, ev.clientY, performance.now());
    if (r === 'cancel') {
      this.cleanup(); // the finger is scrolling
      return;
    }
    if (r === 'start') this.begin(ev.clientX, ev.clientY);
    if (!c.moved) return;
    if (c.ghost) {
      c.ghost.style.left = ev.clientX - 24 + 'px';
      c.ghost.style.top = ev.clientY - 24 + 'px';
    }
    this.hover.set(this.targetUnder(ev)?.dataset['gearDrop'] ?? null);
  };

  private onEnd = (ev: PointerEvent): void => {
    const c = this.cleanup();
    if (!c || !c.moved) return; // plain click – handled by (click)
    this.suppressClick = true;
    window.setTimeout(() => (this.suppressClick = false), 0);
    if (ev.type === 'pointercancel') return;
    const target = this.targetUnder(ev);
    target?.dispatchEvent(new CustomEvent<GearDrag>(GEAR_DROP_EVENT, { detail: c.drag }));
  };

  private targetUnder(ev: PointerEvent): HTMLElement | null {
    return (document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-gear-drop]') as HTMLElement | null) ?? null;
  }

  private makeGhost(icon: string | null, name: string): HTMLElement {
    // appended to <body>, so no component styles reach it: style it inline
    const g = document.createElement('div');
    g.className = 'drag-ghost';
    Object.assign(g.style, {
      position: 'fixed', zIndex: '200', width: '48px', height: '48px', pointerEvents: 'none',
      border: '2px solid #c9a227', borderRadius: '6px', background: '#0a0a0c', overflow: 'hidden',
      boxShadow: '0 6px 18px rgba(0,0,0,0.7)', left: '-100px', top: '-100px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#9a958a', fontSize: '10px', textTransform: 'uppercase',
    } as Partial<CSSStyleDeclaration>);
    if (icon) {
      const img = document.createElement('img');
      img.src = icon;
      img.alt = name;
      Object.assign(img.style, { maxWidth: '82%', maxHeight: '82%', objectFit: 'contain', display: 'block' } as Partial<CSSStyleDeclaration>);
      g.appendChild(img);
    } else {
      g.textContent = name.slice(0, 3);
    }
    document.body.appendChild(g);
    return g;
  }
}

import { Injectable, signal } from '@angular/core';
import type { GearDrag } from './gear-panel';

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

  private current: { drag: GearDrag; icon: string | null; name: string; startX: number; startY: number; ghost: HTMLElement | null; moved: boolean } | null = null;

  start(ev: PointerEvent, drag: GearDrag, view: { icon: string | null; name: string }): void {
    if (ev.button !== 0 || this.current) return;
    ev.preventDefault();
    this.current = { drag, icon: view.icon, name: view.name, startX: ev.clientX, startY: ev.clientY, ghost: null, moved: false };
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onEnd, { once: true });
    window.addEventListener('pointercancel', this.onEnd, { once: true });
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
    if (!c.moved) {
      if (Math.hypot(ev.clientX - c.startX, ev.clientY - c.startY) < 6) return;
      c.moved = true;
      c.ghost = this.makeGhost(c.icon, c.name);
      this.drag.set(c.drag);
    }
    if (c.ghost) {
      c.ghost.style.left = ev.clientX - 24 + 'px';
      c.ghost.style.top = ev.clientY - 24 + 'px';
    }
    this.hover.set(this.targetUnder(ev)?.dataset['gearDrop'] ?? null);
  };

  private onEnd = (ev: PointerEvent): void => {
    const c = this.current;
    this.current = null;
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onEnd);
    window.removeEventListener('pointercancel', this.onEnd);
    if (!c) return;
    c.ghost?.remove();
    this.hover.set(null);
    this.drag.set(null);
    if (!c.moved) return; // plain click – handled by (click)
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

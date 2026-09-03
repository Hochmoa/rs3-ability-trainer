import { Component, Injectable, inject, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  kind: 'info' | 'warn';
}

/** Small bottom-centre notifications, e.g. "Removed bind from slot 3 in bar Main". */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;

  show(text: string, kind: ToastMessage['kind'] = 'info', ms = 3500): void {
    const id = this.nextId++;
    this.messages.update((m) => [...m, { id, text, kind }]);
    window.setTimeout(() => this.messages.update((m) => m.filter((x) => x.id !== id)), ms);
  }
}

@Component({
  selector: 'app-toast',
  template: `
    <div class="toasts" aria-live="polite">
      @for (m of toasts.messages(); track m.id) {
        <div class="toast" [class.warn]="m.kind === 'warn'">{{ m.text }}</div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      left: 50%;
      bottom: 130px;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 120;
      pointer-events: none;
    }
    .toast {
      padding: 8px 14px;
      background: #26231c;
      border: 1px solid var(--gold);
      border-radius: 6px;
      color: var(--text);
      font-size: 13px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
      animation: toast-in 0.15s ease-out;
    }
    .toast.warn {
      border-color: var(--warn);
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
    }
  `,
})
export class Toast {
  readonly toasts = inject(ToastService);
}

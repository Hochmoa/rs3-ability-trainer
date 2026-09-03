import { Component, ElementRef, HostListener, Injectable, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface DialogRequest {
  kind: 'alert' | 'confirm' | 'prompt';
  title: string;
  text: string;
  ok: string;
  cancel: string;
  danger: boolean;
  value: string;
  placeholder: string;
  resolve: (result: string | boolean | null) => void;
}

/**
 * In-app replacement for window.alert / confirm / prompt (never use the native ones – they look
 * out of place and block the tick loop). All three return promises.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly current = signal<DialogRequest | null>(null);

  alert(text: string, title = ''): Promise<void> {
    return new Promise((resolve) => this.open({ kind: 'alert', title, text, ok: 'OK', cancel: '', danger: false, value: '', placeholder: '', resolve: () => resolve() }));
  }

  confirm(text: string, opts: { title?: string; ok?: string; cancel?: string; danger?: boolean } = {}): Promise<boolean> {
    return new Promise((resolve) =>
      this.open({
        kind: 'confirm',
        title: opts.title ?? '',
        text,
        ok: opts.ok ?? 'OK',
        cancel: opts.cancel ?? 'Cancel',
        danger: opts.danger ?? false,
        value: '',
        placeholder: '',
        resolve: (r) => resolve(r === true),
      }),
    );
  }

  prompt(text: string, opts: { title?: string; value?: string; placeholder?: string; ok?: string } = {}): Promise<string | null> {
    return new Promise((resolve) =>
      this.open({
        kind: 'prompt',
        title: opts.title ?? '',
        text,
        ok: opts.ok ?? 'OK',
        cancel: 'Cancel',
        danger: false,
        value: opts.value ?? '',
        placeholder: opts.placeholder ?? '',
        resolve: (r) => resolve(typeof r === 'string' ? r : null),
      }),
    );
  }

  private open(req: DialogRequest): void {
    this.current()?.resolve(null); // a new dialog cancels a pending one
    this.current.set(req);
  }

  close(result: string | boolean | null): void {
    const c = this.current();
    this.current.set(null);
    c?.resolve(result);
  }
}

@Component({
  selector: 'app-dialog',
  imports: [FormsModule],
  template: `
    @if (dialogs.current(); as d) {
      <div class="backdrop" (click)="dialogs.close(null)">
        <div class="dialog" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          @if (d.title) {
            <h3>{{ d.title }}</h3>
          }
          <p>{{ d.text }}</p>
          @if (d.kind === 'prompt') {
            <input #promptInput type="text" [(ngModel)]="d.value" [placeholder]="d.placeholder" (keydown.enter)="dialogs.close(d.value)" maxlength="200" />
          }
          <div class="actions">
            @if (d.kind !== 'alert') {
              <button class="btn" (click)="dialogs.close(null)">{{ d.cancel }}</button>
            }
            <button #okButton class="btn" [class.btn-primary]="!d.danger" [class.danger]="d.danger" (click)="dialogs.close(d.kind === 'prompt' ? d.value : true)">{{ d.ok }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 150;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      animation: fade 0.12s ease-out;
    }
    .dialog {
      width: min(440px, calc(100vw - 32px));
      padding: 18px 20px 16px;
      background: var(--panel);
      border: 1px solid var(--gold);
      border-radius: 8px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
      color: var(--text);
    }
    h3 {
      margin: 0 0 8px;
      color: var(--gold);
      font-size: 16px;
    }
    p {
      margin: 0 0 14px;
      white-space: pre-wrap;
      line-height: 1.45;
    }
    input {
      width: 100%;
      margin-bottom: 14px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .btn.danger {
      background: #5a1a1a;
      border-color: var(--bad);
      color: #ffd7d7;
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
  `,
})
export class Dialog {
  readonly dialogs = inject(DialogService);
  private promptInput = viewChild<ElementRef<HTMLInputElement>>('promptInput');
  private okButton = viewChild<ElementRef<HTMLButtonElement>>('okButton');

  constructor() {
    // focus the input (prompt) or the OK button when a dialog opens
    effect(() => {
      if (!this.dialogs.current()) return;
      setTimeout(() => (this.promptInput()?.nativeElement ?? this.okButton()?.nativeElement)?.focus(), 0);
    });
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.dialogs.current()) this.dialogs.close(null);
  }
}

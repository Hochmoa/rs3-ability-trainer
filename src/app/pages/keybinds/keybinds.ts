import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AbilitiesService } from '../../core/abilities.service';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { Ability } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { AbilityIcon } from '../../shared/ability-icon';

@Component({
  selector: 'app-keybinds',
  imports: [AbilityIcon, RouterLink],
  templateUrl: './keybinds.html',
  styleUrl: './keybinds.scss',
})
export class Keybinds {
  readonly storage = inject(StorageService);
  readonly abilities = inject(AbilitiesService);

  readonly showAll = signal(false);
  readonly capturing = signal<string | null>(null);

  readonly usedIds = computed(() => new Set(this.storage.rotations().flatMap((r) => r.steps)));
  readonly list = computed<Ability[]>(() => {
    const all = this.abilities.all();
    if (this.showAll()) return all;
    const used = this.usedIds();
    const bound = this.storage.keybinds();
    return all.filter((a) => used.has(a.id) || bound[a.id]);
  });
  /** keybind key → ability ids sharing it */
  readonly conflicts = computed(() => {
    const m = new Map<string, string[]>();
    for (const [id, kb] of Object.entries(this.storage.keybinds())) {
      const k = keybindKey(kb);
      m.set(k, [...(m.get(k) ?? []), id]);
    }
    return m;
  });

  label(id: string): string {
    return keybindLabel(this.storage.keybinds()[id]);
  }

  conflictOf(id: string): string[] {
    const kb = this.storage.keybinds()[id];
    if (!kb) return [];
    return (this.conflicts().get(keybindKey(kb)) ?? []).filter((x) => x !== id).map((x) => this.abilities.get(x)?.name ?? x);
  }

  capture(id: string): void {
    this.capturing.set(this.capturing() === id ? null : id);
  }

  clear(id: string): void {
    void this.storage.setKeybind(id, null);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const id = this.capturing();
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code === 'Escape') {
      this.capturing.set(null);
      return;
    }
    if (e.code === 'Backspace' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      void this.storage.setKeybind(id, null);
      this.capturing.set(null);
      return;
    }
    const kb = keybindFromEvent(e);
    if (!kb) return; // modifier only – keep waiting
    void this.storage.setKeybind(id, kb);
    this.capturing.set(null);
  }
}

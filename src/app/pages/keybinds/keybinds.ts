import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { keybindFromEvent, keybindKey, keybindLabel } from '../../core/keybind.util';
import { entityKey } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { AbilityIcon } from '../../shared/ability-icon';
import { EntityTip } from '../../shared/tooltip';

@Component({
  selector: 'app-keybinds',
  imports: [AbilityIcon, RouterLink, EntityTip],
  templateUrl: './keybinds.html',
  styleUrl: './keybinds.scss',
})
export class Keybinds {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);

  readonly showAll = signal(false);
  readonly capturing = signal<string | null>(null);

  readonly usedKeys = computed(() => new Set(this.storage.rotations().flatMap((r) => r.steps.map((s) => entityKey(s.kind, s.id)))));
  readonly list = computed<Entity[]>(() => {
    const all = this.data.entities();
    if (this.showAll()) return all;
    const used = this.usedKeys();
    const bound = this.storage.keybinds();
    return all.filter((e) => used.has(e.key) || bound[e.key]);
  });
  /** keybind key → entity keys sharing it */
  readonly conflicts = computed(() => {
    const m = new Map<string, string[]>();
    for (const [key, kb] of Object.entries(this.storage.keybinds())) {
      const k = keybindKey(kb);
      m.set(k, [...(m.get(k) ?? []), key]);
    }
    return m;
  });

  label(key: string): string {
    return keybindLabel(this.storage.keybinds()[key]);
  }

  subtitle(e: Entity): string {
    if (e.ability) return e.ability.style + ' · ' + e.ability.type;
    if (e.prayer) return e.prayer.book === 'Curses' ? 'Curse' : 'Prayer';
    return 'Potion';
  }

  conflictOf(key: string): string[] {
    const kb = this.storage.keybinds()[key];
    if (!kb) return [];
    return (this.conflicts().get(keybindKey(kb)) ?? []).filter((x) => x !== key).map((x) => this.data.name(x));
  }

  capture(key: string): void {
    this.capturing.set(this.capturing() === key ? null : key);
  }

  clear(key: string): void {
    void this.storage.setKeybind(key, null);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const key = this.capturing();
    if (!key) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code === 'Escape') {
      this.capturing.set(null);
      return;
    }
    if (e.code === 'Backspace' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      void this.storage.setKeybind(key, null);
      this.capturing.set(null);
      return;
    }
    const kb = keybindFromEvent(e);
    if (!kb) return;
    void this.storage.setKeybind(key, kb);
    this.capturing.set(null);
  }
}

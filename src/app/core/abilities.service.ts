import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Ability } from './models';

@Injectable({ providedIn: 'root' })
export class AbilitiesService {
  private http = inject(HttpClient);

  readonly all = signal<Ability[]>([]);
  readonly loaded = signal(false);
  readonly byId = computed(() => new Map(this.all().map((a) => [a.id, a])));

  constructor() {
    this.http.get<Ability[]>('assets/abilities.json').subscribe({
      next: (list) => {
        this.all.set(list);
        this.loaded.set(true);
      },
      error: (err) => console.error('abilities.json failed to load', err),
    });
  }

  get(id: string): Ability | undefined {
    return this.byId().get(id);
  }
}

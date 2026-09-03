import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService, Entity } from '../../core/data.service';
import { keybindLabel } from '../../core/keybind.util';
import { Rotation, RotationStep, STYLES } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { SupabaseService } from '../../core/supabase.service';
import { SyncService } from '../../core/sync.service';
import { AbilityIcon } from '../../shared/ability-icon';
import { EntityTip } from '../../shared/tooltip';

const TABS = [...STYLES, 'Prayers', 'Curses', 'Special'] as const;
type Tab = (typeof TABS)[number];
const TYPE_ORDER: Record<string, number> = { Basic: 0, Enhanced: 1, Threshold: 2, Ultimate: 3, Special: 4 };

@Component({
  selector: 'app-rotations',
  imports: [AbilityIcon, FormsModule, RouterLink, EntityTip],
  templateUrl: './rotations.html',
  styleUrl: './rotations.scss',
})
export class Rotations {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);
  readonly supabase = inject(SupabaseService);
  readonly sync = inject(SyncService);
  private router = inject(Router);

  readonly TABS = TABS;
  readonly editing = signal<Rotation | null>(null);
  readonly tab = signal<Tab>('Melee');
  readonly search = signal('');

  readonly catalog = computed<Entity[]>(() => {
    const q = this.search().trim().toLowerCase();
    const all = this.data.entities();
    const list = q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all.filter((e) => e.group === this.tab());
    return [...list].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
      if (a.ability && b.ability) {
        const t = (TYPE_ORDER[a.ability.type] ?? 9) - (TYPE_ORDER[b.ability.type] ?? 9);
        if (t) return t;
        return a.ability.level - b.ability.level || a.name.localeCompare(b.name);
      }
      if (a.prayer && b.prayer) return a.prayer.level - b.prayer.level || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  });

  keyOf(e: Entity): string {
    return keybindLabel(this.storage.keybinds()[e.key]);
  }

  entity(step: RotationStep): Entity | undefined {
    return this.data.step(step);
  }

  subtitle(e: Entity): string {
    if (e.ability) return e.ability.type + (e.ability.triggersGcd ? '' : ' · no GCD');
    if (e.prayer) return 'level ' + e.prayer.level;
    if (e.special) return '+' + (e.special.adrenaline || e.special.adrenalineOverTime) + '% adrenaline';
    return '';
  }

  newRotation(): void {
    this.editing.set({ id: crypto.randomUUID(), name: 'New rotation', steps: [], updatedAt: Date.now() });
  }

  edit(r: Rotation): void {
    this.editing.set({ ...r, steps: r.steps.map((s) => ({ ...s })) });
  }

  async remove(r: Rotation): Promise<void> {
    if (!confirm('Delete rotation "' + r.name + '"?')) return;
    await this.storage.deleteRotation(r.id);
  }

  train(r: Rotation): void {
    void this.router.navigate(['/'], { queryParams: { rotation: r.id } });
  }

  add(e: Entity): void {
    this.editing.update((r) => (r ? { ...r, steps: [...r.steps, { kind: e.kind, id: e.id }] } : r));
  }

  removeStep(i: number): void {
    this.editing.update((r) => (r ? { ...r, steps: r.steps.filter((_, k) => k !== i) } : r));
  }

  move(i: number, dir: -1 | 1): void {
    this.editing.update((r) => {
      if (!r) return r;
      const j = i + dir;
      if (j < 0 || j >= r.steps.length) return r;
      const steps = [...r.steps];
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...r, steps };
    });
  }

  setName(name: string): void {
    this.editing.update((r) => (r ? { ...r, name } : r));
  }

  setPublic(isPublic: boolean): void {
    this.editing.update((r) => (r ? { ...r, isPublic } : r));
  }

  async save(): Promise<void> {
    const r = this.editing();
    if (!r) return;
    await this.storage.saveRotation({ ...r, name: r.name.trim() || 'Unnamed rotation' });
    this.editing.set(null);
  }

  cancel(): void {
    this.editing.set(null);
  }
}

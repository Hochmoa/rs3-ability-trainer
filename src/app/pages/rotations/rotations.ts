import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AbilitiesService } from '../../core/abilities.service';
import { keybindLabel } from '../../core/keybind.util';
import { Ability, Rotation, STYLES, Style } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { AbilityIcon } from '../../shared/ability-icon';

@Component({
  selector: 'app-rotations',
  imports: [AbilityIcon, FormsModule, RouterLink],
  templateUrl: './rotations.html',
  styleUrl: './rotations.scss',
})
export class Rotations {
  readonly storage = inject(StorageService);
  readonly abilities = inject(AbilitiesService);
  private router = inject(Router);

  readonly STYLES = STYLES;
  readonly editing = signal<Rotation | null>(null);
  readonly style = signal<Style>('Melee');
  readonly search = signal('');

  readonly catalog = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.abilities
      .all()
      .filter((a) => (q ? a.name.toLowerCase().includes(q) : a.style === this.style()));
  });

  keyOf(id: string): string {
    return keybindLabel(this.storage.keybinds()[id]);
  }

  ability(id: string): Ability | undefined {
    return this.abilities.get(id);
  }

  newRotation(): void {
    this.editing.set({ id: crypto.randomUUID(), name: 'New rotation', steps: [], updatedAt: Date.now() });
  }

  edit(r: Rotation): void {
    this.editing.set({ ...r, steps: [...r.steps] });
  }

  async remove(r: Rotation): Promise<void> {
    if (!confirm('Delete rotation "' + r.name + '"?')) return;
    await this.storage.deleteRotation(r.id);
  }

  train(r: Rotation): void {
    void this.router.navigate(['/'], { queryParams: { rotation: r.id } });
  }

  add(a: Ability): void {
    if (!a.triggersGcd) return;
    this.editing.update((e) => (e ? { ...e, steps: [...e.steps, a.id] } : e));
  }

  removeStep(i: number): void {
    this.editing.update((e) => (e ? { ...e, steps: e.steps.filter((_, k) => k !== i) } : e));
  }

  move(i: number, dir: -1 | 1): void {
    this.editing.update((e) => {
      if (!e) return e;
      const j = i + dir;
      if (j < 0 || j >= e.steps.length) return e;
      const steps = [...e.steps];
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...e, steps };
    });
  }

  setName(name: string): void {
    this.editing.update((e) => (e ? { ...e, name } : e));
  }

  async save(): Promise<void> {
    const e = this.editing();
    if (!e) return;
    await this.storage.saveRotation({ ...e, name: e.name.trim() || 'Unnamed rotation' });
    this.editing.set(null);
  }

  cancel(): void {
    this.editing.set(null);
  }
}

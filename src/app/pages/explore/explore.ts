import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { RotationStep, STYLES } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { SupabaseService, errorText } from '../../core/supabase.service';
import { RotationRow, SyncService } from '../../core/sync.service';
import { AbilityIcon } from '../../shared/ability-icon';
import { EntityTip } from '../../shared/tooltip';

@Component({
  selector: 'app-explore',
  imports: [AbilityIcon, EntityTip, FormsModule, RouterLink],
  templateUrl: './explore.html',
  styleUrl: './explore.scss',
})
export class Explore {
  readonly data = inject(DataService);
  readonly sync = inject(SyncService);
  readonly supabase = inject(SupabaseService);
  readonly storage = inject(StorageService);
  private router = inject(Router);

  readonly STYLES = STYLES;
  readonly search = signal('');
  readonly style = signal('');
  readonly sort = signal<'new' | 'copies'>('new');
  readonly rows = signal<RotationRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly copied = signal<Record<string, string>>({});
  readonly message = signal<string | null>(null);

  private timer = 0;

  constructor() {
    effect(() => {
      this.search();
      this.style();
      this.sort();
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => void this.load(), 250);
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.rows.set(await this.sync.explore({ search: this.search(), style: this.style(), sort: this.sort() }));
    } catch (err) {
      this.error.set(errorText(err));
    } finally {
      this.loading.set(false);
    }
  }

  entity(step: RotationStep) {
    return this.data.step(step);
  }

  isMine(row: RotationRow): boolean {
    return this.storage.rotations().some((r) => r.id === row.id);
  }

  async copy(row: RotationRow): Promise<void> {
    try {
      const r = await this.sync.copyFromExplorer(row);
      this.copied.update((c) => ({ ...c, [row.id]: r.id }));
      this.message.set('"' + row.name + '" copied to your rotations' + (this.supabase.user() ? '' : ' (locally – sign in to keep it online)') + '.');
      if (this.supabase.user()) this.rows.update((rows) => rows.map((x) => (x.id === row.id ? { ...x, copies: x.copies + 1 } : x)));
    } catch (err) {
      this.message.set('Copy failed: ' + errorText(err));
    }
  }

  train(id: string): void {
    void this.router.navigate(['/'], { queryParams: { rotation: id } });
  }

  ago(iso: string): string {
    const d = (Date.now() - Date.parse(iso)) / 1000;
    if (d < 3600) return Math.max(1, Math.round(d / 60)) + ' min ago';
    if (d < 86400) return Math.round(d / 3600) + ' h ago';
    return Math.round(d / 86400) + ' d ago';
  }
}

import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { RotationStep, STYLES } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { SupabaseService, errorText } from '../../core/supabase.service';
import { RotationRow, SyncService, explorePageSize } from '../../core/sync.service';
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
  /** "Guides" chip: only rotations of the guide accounts (their own, larger page, sorted by boss and name) */
  readonly guides = signal(false);
  /** boss filter: the display name of one guide account, '' = all of them */
  readonly owner = signal('');
  /** the guide accounts, fetched once the Guides chip is on */
  readonly accounts = signal<string[]>([]);
  readonly rows = signal<RotationRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly copied = signal<Record<string, string>>({});
  readonly message = signal<string | null>(null);
  /** the last page came back full, so there is at least one more ("Load more") */
  readonly hasMore = signal(false);
  readonly loadingMore = signal(false);

  private timer = 0;
  /** the guide accounts were requested once – a plain field, so the effect below does not depend on the result */
  private accountsAsked = false;

  constructor() {
    void this.data.ensure('weapons'); // steps of public rotations can wield a weapon
    effect(() => {
      this.search();
      this.style();
      this.sort();
      this.owner();
      const guides = this.guides();
      if (guides && !this.accountsAsked) {
        this.accountsAsked = true;
        void this.loadAccounts();
      }
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => void this.load(), 250);
    });
  }

  /**
   * One page of the explorer. `append` continues the list instead of replacing it: the guide accounts hold about a
   * thousand rotations, and before the paging everything after the first page was simply invisible.
   */
  async load(append = false): Promise<void> {
    const offset = append ? this.rows().length : 0;
    if (append) this.loadingMore.set(true);
    else this.loading.set(true);
    this.error.set(null);
    try {
      const page = await this.sync.explore({ search: this.search(), style: this.style(), sort: this.sort(), guides: this.guides(), owner: this.owner() || undefined, offset });
      this.rows.update((rows) => (append ? [...rows, ...page] : page));
      this.hasMore.set(page.length === explorePageSize(this.guides()));
    } catch (err) {
      this.error.set(errorText(err));
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  loadMore(): void {
    if (this.loading() || this.loadingMore()) return;
    void this.load(true);
  }

  private async loadAccounts(): Promise<void> {
    try {
      this.accounts.set(await this.sync.guideAccounts());
    } catch {
      this.accounts.set([]); // the filter stays hidden; search and paging still reach every rotation
    }
  }

  /** the Guides chip: turning it off drops the boss filter, which only makes sense for guide accounts */
  toggleGuides(): void {
    const on = !this.guides();
    this.guides.set(on);
    if (!on) this.owner.set('');
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

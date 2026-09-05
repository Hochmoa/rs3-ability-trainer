import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataService, GearView } from '../../core/data.service';
import { cleanNotes } from './preset-notes';
import { BossPreset, ParsedRotation, PresetsService } from '../../core/presets.service';
import { StorageService } from '../../core/storage.service';
import { DialogService } from '../../shared/dialog';
import { GearTip } from '../../shared/tooltip';
import { ToastService } from '../../shared/toast';

export type { BossPreset } from '../../core/presets.service';

interface PresetView {
  preset: BossPreset;
  worn: GearView[];
  carried: GearView[];
}

/**
 * Ready-made boss setups from PvME: the gear preset becomes a loadout (worn items + backpack), the guide's
 * rotations become rotations, and the abilities they use are put on free action bars bound to the style
 * (core/presets.service.ts does the work – the Train page's "Load a demo" uses the same path).
 */
@Component({
  selector: 'app-presets',
  imports: [GearTip],
  templateUrl: './presets.html',
  styleUrl: './presets.scss',
})
export class Presets {
  readonly data = inject(DataService);
  readonly storage = inject(StorageService);
  private service = inject(PresetsService);
  private dialogs = inject(DialogService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly presets = signal<BossPreset[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly open = signal<string | null>(null);
  readonly busy = signal<string | null>(null);
  readonly styleFilter = signal<string>('all');

  readonly views = computed<PresetView[]>(() => {
    if (!this.data.loadoutReady()) return [];
    const f = this.styleFilter();
    return this.presets()
      .filter((p) => f === 'all' || p.style === f)
      .map((preset) => ({
        preset,
        worn: Object.values(preset.equipment)
          .map((r) => (r ? this.data.view(r) : null))
          .filter((v): v is GearView => !!v),
        carried: preset.inventory.map((r) => (r ? this.data.view(r) : null)).filter((v): v is GearView => !!v),
      }));
  });
  readonly styles = computed(() => [...new Set(this.presets().map((p) => p.style))]);

  constructor() {
    this.service.list().then(
      (p) => {
        this.presets.set(p);
        this.loading.set(false);
      },
      () => {
        this.error.set('The boss setups could not be loaded.');
        this.loading.set(false);
      },
    );
  }

  toggle(id: string): void {
    this.open.set(this.open() === id ? null : id);
  }

  /** the rotation steps of a preset, resolved with the PvME parser (for the preview) */
  parse(p: BossPreset): ParsedRotation[] {
    return this.service.parse(p);
  }

  notes(p: BossPreset): string {
    return cleanNotes(p.notes);
  }

  stepCount(p: BossPreset): number {
    return this.parse(p).reduce((n, r) => n + r.steps.filter((s) => s.kind !== 'note').length, 0);
  }

  async load(p: BossPreset): Promise<void> {
    const ok = await this.dialogs.confirm(
      'Use "' + p.title + '"?\n\nAdds a loadout, ' + p.rotations.length + ' rotations and a bar setup. Your keys stay; empty slots get default keys. Nothing of yours is replaced.',
      { ok: 'Use it', title: p.boss + ' – ' + p.style },
    );
    if (!ok) return;
    this.busy.set(p.id);
    try {
      const added = await this.service.add(p);
      this.toast.show(this.service.describe(added), 'info', 5000);
      void this.router.navigate(['/'], { queryParams: { rotation: added.rotations[0]?.id } });
    } finally {
      this.busy.set(null);
    }
  }
}

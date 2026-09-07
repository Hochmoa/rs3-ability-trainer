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
  /** the variant and, for hybrids, the styles: "HM solo", "HM solo magic/melee hybrid" */
  label: string;
  worn: GearView[];
  carried: GearView[];
}

/** the setups of one boss */
interface BossGroup {
  boss: string;
  views: PresetView[];
  styles: string[];
}

const STYLE_ORDER = ['Melee', 'Ranged', 'Magic', 'Necromancy'];

/**
 * Ready-made boss setups from PvME: the gear preset becomes a loadout (worn items + backpack), the guide's
 * rotations become rotations, and the abilities they use are put on free action bars bound to the style
 * (core/presets.service.ts does the work – the Train page's "Load a demo" uses the same path).
 * Every PvME boss guide is in the list, so the setups are grouped by boss (collapsed until opened; a search and
 * the style chips narrow them down) and show the variant the guide describes.
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
  /** the preset whose details are shown */
  readonly open = signal<string | null>(null);
  /** bosses opened by hand (a narrowed list opens on its own) */
  readonly openBosses = signal<ReadonlySet<string>>(new Set());
  readonly busy = signal<string | null>(null);
  readonly styleFilter = signal<string>('all');
  readonly query = signal('');

  readonly views = computed<PresetView[]>(() => {
    if (!this.data.loadoutReady()) return [];
    const f = this.styleFilter();
    const q = this.query().trim().toLowerCase();
    return this.presets()
      .filter((p) => f === 'all' || p.style === f)
      .filter((p) => !q || (p.boss + ' ' + p.title + ' ' + p.variant).toLowerCase().includes(q))
      .map((preset) => ({
        preset,
        label: presetLabel(preset),
        worn: Object.values(preset.equipment)
          .map((r) => (r ? this.data.view(r) : null))
          .filter((v): v is GearView => !!v),
        carried: preset.inventory.map((r) => (r ? this.data.view(r) : null)).filter((v): v is GearView => !!v),
      }));
  });
  /** the setups grouped by boss, in list order (the demo boss first) */
  readonly groups = computed<BossGroup[]>(() => {
    const byBoss = new Map<string, PresetView[]>();
    for (const v of this.views()) {
      const list = byBoss.get(v.preset.boss) ?? [];
      list.push(v);
      byBoss.set(v.preset.boss, list);
    }
    return [...byBoss].map(([boss, views]) => ({ boss, views, styles: sortStyles([...new Set(views.map((v) => v.preset.style))]) }));
  });
  readonly styles = computed(() => sortStyles([...new Set(this.presets().map((p) => p.style))]));
  readonly bossCount = computed(() => new Set(this.presets().map((p) => p.boss)).size);

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

  /** a group shows its setups when opened by hand, or when the search / filter leaves only a few bosses */
  isOpen(boss: string): boolean {
    return this.openBosses().has(boss) || this.groups().length <= 3;
  }

  toggleBoss(boss: string): void {
    const next = new Set(this.openBosses());
    if (next.has(boss)) next.delete(boss);
    else next.add(boss);
    this.openBosses.set(next);
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
      { ok: 'Use it', title: p.title },
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

/** "HM solo" for a one-style setup, "HM solo magic/melee hybrid" for a hybrid (the title without the boss), "" when the guide has one setup */
export function presetLabel(p: Pick<BossPreset, 'boss' | 'title' | 'variant'>): string {
  const prefix = p.boss + ' – ';
  const rest = p.title.startsWith(prefix) ? p.title.slice(prefix.length) : p.title;
  return rest.includes('hybrid') ? rest : p.variant;
}

function sortStyles(styles: string[]): string[] {
  return styles.sort((a, b) => (STYLE_ORDER.indexOf(a) + 1 || 99) - (STYLE_ORDER.indexOf(b) + 1 || 99));
}

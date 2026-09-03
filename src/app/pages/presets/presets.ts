import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataService, GearView } from '../../core/data.service';
import { parsePvme } from '../../core/pvme';
import { ActionBarSetup, BAR_POSITIONS, BAR_SLOTS, EquipSlot, Equipment, INVENTORY_SIZE, ItemRef, Loadout, Rotation, RotationStep, SPEC_KEY, Style4, entityKey, isStyle4, newLoadout } from '../../core/models';
import { StorageService } from '../../core/storage.service';
import { DialogService } from '../../shared/dialog';
import { GearTip } from '../../shared/tooltip';
import { ToastService } from '../../shared/toast';

/** One PvME boss setup (public/data/presets.json, built by tools/fetch-presets.py). */
export interface BossPreset {
  id: string;
  boss: string;
  style: string;
  title: string;
  guide: string;
  presetUrl: string | null;
  notes: string;
  equipment: Partial<Record<EquipSlot | 'aura', ItemRef>>;
  inventory: (ItemRef | null)[];
  /** items of the PvME preset the trainer does not model (food, brews, familiars ...) */
  unknown: string[];
  rotations: { name: string; text: string }[];
}

interface PresetView {
  preset: BossPreset;
  worn: GearView[];
  carried: GearView[];
}

/**
 * Ready-made boss setups from PvME: the gear preset becomes a loadout (worn items + backpack), the guide's
 * rotations become rotations, and the abilities they use are put on free action bars bound to the style.
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
  private http = inject(HttpClient);
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
    if (!this.data.loaded()) return [];
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
    this.http.get<BossPreset[]>('data/presets.json').subscribe({
      next: (p) => {
        this.presets.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('presets.json could not be loaded');
        this.loading.set(false);
      },
    });
  }

  toggle(id: string): void {
    this.open.set(this.open() === id ? null : id);
  }

  /** the rotation steps of a preset, resolved with the PvME parser (for the preview + the load) */
  parse(p: BossPreset): { name: string; steps: RotationStep[]; unknown: string[] }[] {
    return p.rotations.map((r) => {
      const { steps, unknown } = parsePvme(r.text, (alias) => this.data.resolvePvmeAlias(alias));
      return { name: r.name, steps, unknown };
    });
  }

  stepCount(p: BossPreset): number {
    return this.parse(p).reduce((n, r) => n + r.steps.filter((s) => s.kind !== 'note').length, 0);
  }

  async load(p: BossPreset): Promise<void> {
    const ok = await this.dialogs.confirm(
      'Add "' + p.title + '"?\n\nThis creates a new loadout with the PvME gear, adds ' + p.rotations.length + ' rotations and puts the abilities they use on free action bars bound to ' + p.style + '. Nothing of yours is replaced.',
      { ok: 'Add', title: p.boss + ' – ' + p.style },
    );
    if (!ok) return;
    this.busy.set(p.id);
    try {
      // loadout: re-slot every item (a two-hander sits in the main-hand slot of the PvME preset)
      const l: Loadout = newLoadout(p.title.slice(0, 40));
      const eq: Equipment = {};
      for (const ref of Object.values(p.equipment)) {
        if (!ref) continue;
        const slot = this.data.slotOf(ref);
        if (slot) eq[slot] = { ...ref };
      }
      if (eq.twoHand) {
        delete eq.mainHand;
        delete eq.offHand;
      }
      l.equipment = eq;
      l.inventory = Array.from({ length: INVENTORY_SIZE }, (_, i) => (p.inventory[i] ? { ...p.inventory[i]! } : null));
      l.prayerBook = 'Curses';
      await this.storage.saveLoadout(l);
      await this.storage.setActiveLoadout(l.id);

      // rotations
      const parsed = this.parse(p);
      const now = Date.now();
      const rotations: Rotation[] = parsed.map((r, i) => ({ id: crypto.randomUUID(), name: p.boss + ' – ' + r.name, steps: r.steps, updatedAt: now - i }));
      for (const r of rotations) await this.storage.saveRotation(r);

      // action bars: every ability / prayer / potion the rotations use, 14 per free bar, bound to the style
      const keys: string[] = [];
      for (const r of parsed) {
        for (const s of r.steps) {
          if (s.kind === 'note' || s.kind === 'weapon' || s.kind === 'action') continue;
          const key = s.kind === 'spec' ? SPEC_KEY : entityKey(s.kind, s.id);
          if (!keys.includes(key)) keys.push(key);
        }
      }
      const setup: ActionBarSetup = structuredClone(this.storage.actionBars());
      const used = new Set<number>();
      setup.positions.forEach((id) => id !== null && used.add(id));
      for (const b of Object.values(setup.bindings)) b.forEach((id) => id !== null && used.add(id));
      const free = setup.presets.filter((pr) => !used.has(pr.id) && !pr.slots.some(Boolean));
      const style: Style4 = isStyle4(p.style) ? p.style : 'Melee';
      const barsNeeded = Math.min(BAR_POSITIONS, Math.ceil(keys.length / BAR_SLOTS));
      let placed = 0;
      for (let b = 0; b < barsNeeded && b < free.length; b++) {
        const preset = free[b];
        preset.name = (p.boss.split(',')[0] + ' ' + p.style + ' ' + (b + 1)).slice(0, 30);
        for (let i = 0; i < BAR_SLOTS && placed < keys.length; i++, placed++) {
          const { kind, id } = splitKey(keys[placed]);
          preset.slots[i] = { kind, id } as RotationStep;
        }
        setup.bindings[style][b] = preset.id;
      }
      await this.storage.saveActionBars(setup);
      const left = keys.length - placed;
      this.toast.show('Added loadout "' + l.name + '", ' + rotations.length + ' rotations and ' + Math.min(barsNeeded, free.length) + ' action bars' + (left > 0 ? ' (' + left + ' abilities did not fit – no free bars)' : ''));
      void this.router.navigate(['/'], { queryParams: { rotation: rotations[0]?.id } });
    } finally {
      this.busy.set(null);
    }
  }
}

function splitKey(key: string): { kind: RotationStep['kind']; id: string } {
  const i = key.indexOf(':');
  return { kind: key.slice(0, i) as RotationStep['kind'], id: key.slice(i + 1) };
}

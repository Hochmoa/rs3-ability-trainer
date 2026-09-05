import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../shared/toast';
import { DataService } from './data.service';
import { DEFAULT_LAYOUT_ID, keybindLayout } from './keybind-layouts';
import { Rotation, RotationStep } from './models';
import { BossPreset, presetBars, presetLoadout, presetSlotKeys } from './preset-setup';
import { parsePvme } from './pvme';
import { StorageService } from './storage.service';

export type { BossPreset } from './preset-setup';

export interface ParsedRotation {
  name: string;
  steps: RotationStep[];
  unknown: string[];
}

export interface AddedPreset {
  loadoutName: string;
  rotations: Rotation[];
  barsNeeded: number;
  /** abilities that did not fit on 5 bars */
  left: number;
  /** keys added from the default layout */
  filled: number;
  layoutName: string;
}

/**
 * Ready-made boss setups from PvME (public/data/presets.json): "add" turns one into a loadout, its rotations and a
 * bar profile with the abilities on bars bound to the style – keys filled from the default layout, so it plays at once.
 */
@Injectable({ providedIn: 'root' })
export class PresetsService {
  private http = inject(HttpClient);
  private data = inject(DataService);
  private storage = inject(StorageService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private presets: Promise<BossPreset[]> | null = null;

  /** all presets (fetched once) */
  list(): Promise<BossPreset[]> {
    this.presets ??= firstValueFrom(this.http.get<BossPreset[]>('data/presets.json')).catch((e) => {
      this.presets = null;
      throw e;
    });
    return this.presets;
  }

  /** the rotation steps of a preset, resolved with the PvME parser (for the preview + the add) */
  parse(p: BossPreset): ParsedRotation[] {
    return p.rotations.map((r) => {
      const { steps, unknown } = parsePvme(r.text, (alias) => this.data.resolvePvmeAlias(alias));
      return { name: r.name, steps, unknown };
    });
  }

  /** Creates loadout, rotations and bar profile for the preset and makes them active. Nothing of the player's is replaced. */
  async add(p: BossPreset): Promise<AddedPreset> {
    const loadout = presetLoadout(p, (ref) => this.data.slotOf(ref));
    await this.storage.saveLoadout(loadout);
    await this.storage.setActiveLoadout(loadout.id);

    const parsed = this.parse(p);
    const now = Date.now();
    const rotations: Rotation[] = parsed.map((r, i) => ({ id: crypto.randomUUID(), name: p.boss + ' – ' + r.name, steps: r.steps, updatedAt: now - i, presetId: p.id }));
    for (const r of rotations) await this.storage.saveRotation(r);

    const layout = keybindLayout(DEFAULT_LAYOUT_ID);
    const bars = presetBars(p, presetSlotKeys(parsed), this.storage.actionBars(), layout, loadout);
    const profileId = await this.storage.addBarProfile(p.title.slice(0, 40), bars.setup, p.id);
    await this.storage.switchBarProfile(profileId);
    return { loadoutName: loadout.name, rotations, barsNeeded: bars.barsNeeded, left: bars.left, filled: bars.filled, layoutName: layout.name };
  }

  /** One line for the toast after an add. */
  describe(a: AddedPreset): string {
    return (
      'Added loadout "' + a.loadoutName + '", ' + a.rotations.length + ' rotations and the bar setup "' + a.loadoutName + '" (' + a.barsNeeded + ' bars)' +
      (a.filled > 0 ? ' – keys from the "' + a.layoutName + '" layout, ready to play' : '') +
      (a.left > 0 ? ' – ' + a.left + ' abilities did not fit on 5 bars' : '')
    );
  }

  /**
   * "Load a demo": adds the first preset (Rasial) with the default keys and opens it on the Train page – the
   * one-click way to try the trainer without building anything.
   */
  async addDemo(): Promise<boolean> {
    let presets: BossPreset[];
    try {
      presets = await this.list();
    } catch {
      this.toast.show('The presets could not be loaded', 'warn');
      return false;
    }
    const p = presets[0];
    if (!p) {
      this.toast.show('No preset available', 'warn');
      return false;
    }
    const added = await this.add(p);
    this.toast.show(this.describe(added) + '. Press Start and follow the bar.', 'info', 6000);
    void this.router.navigate(['/'], { queryParams: { rotation: added.rotations[0]?.id } });
    return true;
  }
}

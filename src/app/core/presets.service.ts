import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../shared/toast';
import { DataService } from './data.service';
import { DEFAULT_LAYOUT_ID, keybindLayout } from './keybind-layouts';
import { Rotation, RotationStep } from './models';
import { BossPreset, demoRotationIndex, presetBars, presetLoadout, presetSlotKeys } from './preset-setup';
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
  /** in guide order (presetIndex) */
  rotations: Rotation[];
  /** index into `rotations` of the one "Load a demo" opens */
  demoIndex: number;
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
  private data = inject(DataService);
  private storage = inject(StorageService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private presets: Promise<BossPreset[]> | null = null;

  /** all presets (fetched once) */
  list(): Promise<BossPreset[]> {
    // the presets plus everything their items and rotations resolve against (lazy catalogs, DataService.ensure)
    this.presets ??= this.data.ensure('presets', 'gear', 'weapons', 'perks', 'aliases').then(
      () => this.data.presets() as BossPreset[],
      (e) => {
        this.presets = null;
        throw e;
      },
    );
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
    // adding a preset is an explicit save: it stands in for the consent banner's OK
    if (await this.storage.acceptConsentOnSave()) this.toast.show('Saved in this browser', 'info', 2000);
    const parsed = this.parse(p);
    const loadout = presetLoadout(p, (ref) => this.data.slotOf(ref));
    // potions and bombs the rotations press must be in the backpack, or the trainer refuses them like the game
    for (const id of new Set(parsed.flatMap((r) => r.steps).filter((st) => st.kind === 'special').map((st) => st.id))) {
      if (loadout.inventory.some((r) => r?.kind === 'special' && r.id === id)) continue;
      const free = loadout.inventory.findIndex((r) => !r);
      if (free < 0) break;
      loadout.inventory[free] = { kind: 'special', id };
    }
    await this.storage.saveLoadout(loadout);
    await this.storage.setActiveLoadout(loadout.id);

    const now = Date.now();
    const rotations: Rotation[] = parsed.map((r, i) => ({ id: crypto.randomUUID(), name: p.boss + ' – ' + r.name, steps: r.steps, updatedAt: now - i, presetId: p.id, presetIndex: i }));
    for (const r of rotations) await this.storage.saveRotation(r);

    const layout = keybindLayout(DEFAULT_LAYOUT_ID);
    const bars = presetBars(p, presetSlotKeys(parsed), this.storage.actionBars(), layout, loadout);
    const profileId = await this.storage.addBarProfile(p.title.slice(0, 40), bars.setup, p.id);
    await this.storage.switchBarProfile(profileId);
    return { loadoutName: loadout.name, rotations, demoIndex: demoRotationIndex(p, parsed), barsNeeded: bars.barsNeeded, left: bars.left, filled: bars.filled, layoutName: layout.name };
  }

  /** One sentence for the toast after an add. */
  describe(a: AddedPreset): string {
    return (
      'Added "' + a.loadoutName + '": loadout, ' + a.rotations.length + ' rotations and ' + a.barsNeeded + (a.barsNeeded === 1 ? ' bar' : ' bars') +
      (a.filled > 0 ? ' with keys from the "' + a.layoutName + '" layout' : '') +
      (a.left > 0 ? ' – ' + a.left + ' abilities did not fit' : '') + '.'
    );
  }

  /**
   * "Load a demo": adds the first preset (Rasial) with the default keys and opens its fight rotation on the Train
   * page – the one-click way to try the trainer without building anything.
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
    // the demo must play at once: its fight rotation opens with an adrenaline cost, so the session starts at 100%
    if (!this.storage.settings().fullAdrenaline) await this.storage.saveSettings({ ...this.storage.settings(), fullAdrenaline: true });
    this.toast.show('Demo loaded – press Start.');
    void this.router.navigate(['/'], { queryParams: { rotation: added.rotations[added.demoIndex]?.id } });
    return true;
  }
}

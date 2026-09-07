import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../shared/toast';
import { DataService } from './data.service';
import { addItem, stockSpecials } from './equipment';
import { DEFAULT_LAYOUT_ID, keybindLayout } from './keybind-layouts';
import { ItemRef, Prebuild, Rotation, RotationStep } from './models';
import { BossPreset, demoRotationIndex, presetBars, presetLoadout, presetSlotKeys } from './preset-setup';
import { SwitchCatalog, insertSwitches } from './preset-switches';
import { parsePvme } from './pvme';
import { StorageService } from './storage.service';

export type { BossPreset } from './preset-setup';

/**
 * The state a PvME necromancy fight rotation assumes: 12 Necrosis, 5 Residual Souls and the three conjures out. A rotation
 * that conjures before it commands starts without spirits (Conjure Undead Army refuses while all are active); one that
 * commands first and re-conjures later starts with spirits that expire shortly before that conjure.
 */
export function necroPrebuild(steps: RotationStep[]): Prebuild {
  const acts = steps.filter((st) => st.kind !== 'note');
  const conjure = acts.findIndex((st) => st.kind === 'ability' && st.id.startsWith('conjure-'));
  const command = acts.findIndex((st) => st.kind === 'ability' && st.id.startsWith('command-'));
  const spirits = ['skeleton-warrior', 'putrid-zombie', 'vengeful-ghost'];
  const pb: Prebuild = { stacks: { necrosis: 12, 'residual-souls': 5 }, spirits, abilities: [], prayers: [] };
  if (conjure >= 0 && (command < 0 || conjure < command)) pb.spirits = [];
  else if (conjure >= 0) pb.remaining = Object.fromEntries(spirits.map((sp) => ['spirit:' + sp, Math.max(6, 3 * conjure - 2)]));
  return pb;
}

/** rotation names PvME uses for what happens before the fight – those build the state, the others assume it */
const PREBUILD_ROTATION = /pre-?build|pre-?fight|war'?s? retreat|^[^–]*–\s*wars?\b|prep|pre-?kill|fort forinthry/i;

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
    const loadout = presetLoadout(p, (ref) => this.data.slotOf(ref), (id) => this.data.perkById().get(id)?.gizmos);
    // potions and bombs the rotations press must be in the backpack, or the trainer refuses them like the game
    const steps = parsed.flatMap((r) => r.steps);
    loadout.inventory = stockSpecials(loadout, steps.filter((st) => st.kind === 'special').map((st) => st.id)).state.inventory;
    // weapons the rotations switch to go into the backpack too, so their switch keys exist
    const wielded = new Set([loadout.equipment.mainHand?.id, loadout.equipment.offHand?.id, loadout.equipment.twoHand?.id].filter((x): x is string => !!x));
    for (const id of new Set(steps.filter((st) => st.kind === 'weapon').map((st) => st.id))) {
      if (wielded.has(id) || loadout.inventory.some((r) => r?.kind === 'weapon' && r.id === id)) continue;
      const r = addItem(loadout, { kind: 'weapon', id });
      if (!r.error) loadout.inventory = r.state.inventory;
    }
    // "X eofspec": every special attack of a weapon that is neither wielded nor carried is stored in an Essence of Finality.
    // PvME players carry one amulet per stored special and swap them: the first goes on the neck, the others into the backpack
    const carried = new Set([...wielded, ...loadout.inventory.filter((r) => r?.kind === 'weapon').map((r) => r!.id)]);
    const ownSpecs = new Set([...carried].map((id) => this.data.weaponById().get(id)?.spec).filter((x): x is string => !!x));
    const stored = [...new Set(steps.filter((st) => st.kind === 'spec' && !ownSpecs.has(st.id)).map((st) => st.id))];
    const isEof = (r: ItemRef | null | undefined) => !!r && r.kind === 'gear' && r.id.includes('essence-of-finality');
    const amulets = [isEof(loadout.equipment.neck) ? loadout.equipment.neck! : null, ...loadout.inventory.filter(isEof)].filter((r): r is ItemRef => !!r && !r.spec);
    for (const id of stored) {
      const free = amulets.shift();
      if (free) free.spec = id;
      else {
        const r = addItem(loadout, { kind: 'gear', id: 'essence-of-finality-amulet', spec: id });
        if (!r.error) loadout.inventory = r.state.inventory;
      }
    }
    if (!loadout.eofSpec && isEof(loadout.equipment.neck)) loadout.eofSpec = loadout.equipment.neck!.spec ?? null;
    // "surge → surge": the guide plays with the Double Surge relic (a second Surge charge)
    for (const r of parsed) {
      const acts = r.steps.filter((st) => st.kind !== 'note');
      const twice = acts.some((st, i) => st.kind === 'ability' && st.id === 'surge' && acts.slice(i + 1, i + 4).some((x) => x.kind === 'ability' && x.id === 'surge'));
      if (twice && !loadout.relics.includes('double-surge')) loadout.relics.push('double-surge');
    }
    // the switches the guide leaves out (style changes, 2h abilities, specs of backpack weapons)
    const cat: SwitchCatalog = {
      weapon: (id) => this.data.weaponById().get(id),
      spec: (id) => this.data.specById().get(id),
      ability: (id) => {
        const e = this.data.get('ability:' + id);
        return e?.ability ? { style: e.ability.style, gcd: this.data.toEngineEntity(e).gcd } : undefined;
      },
    };
    for (const r of parsed) r.steps = insertSwitches(r.steps, loadout, cat);
    // a familiar scroll in the rotations (Crit-i-Kal, Death from Above …) means that familiar is out
    if (!loadout.familiar) {
      const fam = steps.filter((st) => st.kind === 'special').map((st) => this.data.familiars().find((f) => f.scroll.id === st.id)).find((f) => !!f);
      if (fam) loadout.familiar = fam.id;
    }
    // Vengeance / Disruption Shield need the Lunar book, Smoke Cloud / Exsanguinate the Ancient one: the book most of the
    // rotations' spells belong to (a guide that mixes books expects the reader to pick one per phase)
    const books = steps.filter((st) => st.kind === 'spell').map((st) => this.data.spellById().get(st.id)?.book);
    const votes = (b: string) => books.filter((x) => x === b).length;
    if (votes('lunar') > votes('ancient') && votes('lunar') > votes('standard')) loadout.spellbook = 'lunar';
    else if (votes('ancient') > votes('standard')) loadout.spellbook = 'ancient';
    await this.storage.saveLoadout(loadout);
    await this.storage.setActiveLoadout(loadout.id);

    const now = Date.now();
    const rotations: Rotation[] = parsed.map((r, i) => ({ id: crypto.randomUUID(), name: p.boss + ' – ' + r.name, steps: r.steps, updatedAt: now - i, presetId: p.id, presetIndex: i }));
    for (const r of rotations) await this.storage.saveRotation(r);
    // PvME's necromancy fight rotations start mid-fight ("build 12 necrosis and 5 souls first"): every conjure out and the
    // stacks built – the pre-build of those rotations, editable on the Train page
    if (p.style === 'Necromancy') {
      for (const r of rotations) {
        if (PREBUILD_ROTATION.test(r.name)) continue;
        await this.storage.savePrebuild(r.id, necroPrebuild(r.steps));
      }
    }

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
    } catch (err) {
      // the global handler only sees uncaught errors: log it, or a broken presets.json never shows up anywhere
      console.error('presets could not be loaded', err);
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

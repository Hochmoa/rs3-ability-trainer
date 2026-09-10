import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../shared/toast';
import { DataService } from './data.service';
import { addItem, stockSpecials } from './equipment';
import { ItemRef, Prebuild, Rotation, RotationStep, Setup, loadoutStoredSpecs, loadoutStyle, newSetup } from './models';
import { placeOnBars, unboundKeys } from './bar-place';
import { slotKeybinds } from './keybind.util';
import { DEFAULT_LAYOUT_ID, keybindLayout } from './keybind-layouts';
import { BossPreset, assignEofSpecs, demoRotationIndex, presetLoadout } from './preset-setup';
import { splitName } from '../shared/picker-groups';
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
  setup: Setup;
  loadoutName: string;
  /** in guide order (presetIndex) */
  rotations: Rotation[];
  /** index into `rotations` of the one "Load a demo" opens */
  demoIndex: number;
}

/**
 * Ready-made boss setups from PvME (public/data/presets.json): "add" turns one into a loadout and its rotations.
 * The player's bars and keys are never touched – the Train page's "Auto-place on my bars" puts what is missing onto
 * free slots when the player asks for it.
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

  /** Creates the setup – loadout and rotations – of the preset and makes it active. Nothing of the player's is replaced. */
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
    const amulets = [isEof(loadout.equipment.neck) ? loadout.equipment.neck! : null, ...loadout.inventory.filter(isEof)].filter((r): r is ItemRef => !!r);
    for (const id of assignEofSpecs(amulets, stored)) {
      const r = addItem(loadout, { kind: 'gear', id: 'essence-of-finality-amulet', spec: id });
      if (!r.error) loadout.inventory = r.state.inventory;
    }
    if (!loadout.eofSpec && isEof(loadout.equipment.neck)) loadout.eofSpec = loadout.equipment.neck!.spec ?? null;
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
    // "Nex – solo ranged": the boss is the setup's boss, the rest its name
    const setup = newSetup({ boss: p.boss, name: splitName(p.title).rest || p.style, style: p.style, loadoutId: loadout.id, presetId: p.id });
    await this.storage.addSetup(setup, loadout);
    await this.storage.setActiveSetup(setup.id);

    const now = Date.now();
    const rotations: Rotation[] = parsed.map((r, i) => ({ id: crypto.randomUUID(), name: r.name, steps: r.steps, updatedAt: now - i, setupId: setup.id, presetIndex: i }));
    for (const r of rotations) await this.storage.saveRotation(r);
    // PvME's necromancy fight rotations start mid-fight ("build 12 necrosis and 5 souls first"): every conjure out and the
    // stacks built – the pre-build of those rotations, editable on the Train page
    if (p.style === 'Necromancy') {
      for (const r of rotations) {
        if (PREBUILD_ROTATION.test(r.name)) continue;
        await this.storage.savePrebuild(r.id, necroPrebuild(r.steps));
      }
    }

    return { setup, loadoutName: loadout.name, rotations, demoIndex: demoRotationIndex(p, parsed) };
  }

  /** the demo's steps onto free bar slots with keys, so "press Start" is true on a fresh browser (see addDemo) */
  private placeDemoOnBars(rotation: Rotation | undefined): void {
    if (!rotation) return;
    const setup = this.storage.actionBars();
    const stored = loadoutStoredSpecs(this.storage.loadout());
    const keys = unboundKeys(setup, rotation.steps, slotKeybinds(setup), stored);
    if (!keys.length) return;
    const style = loadoutStyle(this.storage.loadout(), this.data.weaponById());
    const r = placeOnBars(setup, style, keys, keybindLayout(DEFAULT_LAYOUT_ID), stored);
    if (r.placed.length) void this.storage.saveActionBars(r.setup);
  }

  /** One sentence for the toast after an add. */
  describe(a: AddedPreset): string {
    return 'Added "' + a.loadoutName + '": loadout and ' + a.rotations.length + (a.rotations.length === 1 ? ' rotation' : ' rotations') + '. Your bars and keys are untouched; the Train page shows what is not on them yet.';
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
    // ... and its abilities have to be on a key. This is the one place that touches the bars, because the player
    // asked for a ready-made demo: the same free-slots-only path as the Train page's "Auto-place on my bars"
    // (core/bar-place.ts) – nothing of theirs is overwritten, empty slots get the default layout keys.
    this.placeDemoOnBars(added.rotations[added.demoIndex] ?? added.rotations[0]);
    this.toast.show('Demo loaded. Press Start.');
    void this.router.navigate(['/'], { queryParams: { rotation: added.rotations[added.demoIndex]?.id } });
    return true;
  }
}

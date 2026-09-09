import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, GearView, SPEC_ICON } from '../../core/data.service';
import { GearResult, GearState, addItem, equip, moveItem, removeItem, removeWorn, unequip, updateRef } from '../../core/equipment';
import { CatalogEntry, CatalogSection, accessorySections, armourSections, itemUsage, potionSections, weaponSections } from '../../core/gear-catalog';
import { COMBO_TIER_LABEL, ComboTier, GizmoCombo, GizmoType, comboLabel, comboOf, combosFor, gizmoOf } from '../../core/gizmo-combos';
import { EquipSlot, GearItem, Gizmo, ItemRef, KwuarmPotency, Loadout as LoadoutModel, OVERLOAD_CHOICES, OverloadChoice, RELICS, SLOT_NAMES, STYLES4, Style, WEAPON_POISON_NAMES, WeaponPoisonTier, WeaponSpec, COMBAT_SKILLS, CombatSkill, SKILL_MAX, SKILL_NAMES, isStyle4, loadoutLevels, setupTitle } from '../../core/models';
import { OVERLOADS, boostedLevel, critMultiplier, damageSkillOf, levelPart, poisonPct } from '../../engine/damage';
import { ResolvedLoadout } from '../../engine/loadout-resolved';
import { USAGE_THRESHOLD } from '../../core/obscure';
import { StorageService } from '../../core/storage.service';
import { LoadoutData, NOT_SIMULATED_EFFECT_KINDS, loadoutWarnings, mainStyle, resolveLoadout, wornPassives, wornSets } from '../../engine/loadout-resolver';
import { GearDragService } from '../../shared/gear-drag';
import { GearAction, GearDrag, GearPanel, GearSource } from '../../shared/gear-panel';
import { ToastService } from '../../shared/toast';
import { filterEntries, groupEntries } from '../../shared/picker-groups';
import { GearTip } from '../../shared/tooltip';

/** catalog tabs: weapons in their pairs, armour in its sets, everything else by slot, potions */
type Tab = 'weapons' | 'armour' | 'accessories' | 'potions';
const TABS: { id: Tab; label: string }[] = [
  { id: 'weapons', label: 'Weapons' },
  { id: 'armour', label: 'Armour' },
  { id: 'accessories', label: 'Cape, jewellery & more' },
  { id: 'potions', label: 'Potions & bombs' },
];
/** tabs whose catalog gets a tier filter */
const TIERED: Tab[] = ['weapons', 'armour'];
/**
 * How many entries the catalog draws at once. Without "hide obscure equipment" the game's whole wardrobe is in the
 * list – 1500 weapon groups with 1900 icons – and rendering that takes seconds; the rest is reached with the search
 * or the tier filter.
 */
const CATALOG_LIMIT = 300;
const STYLE_ORDER: Style[] = ['Melee', 'Ranged', 'Magic', 'Necromancy'];

interface MenuItem {
  label: string;
  run: () => void;
  danger?: boolean;
}

interface Menu {
  x: number;
  y: number;
  title: string;
  items: MenuItem[];
}

/** where an item sits: inventory index or worn slot */
type Where = { index: number } | { slot: EquipSlot };

interface PerkEdit {
  where: Where;
  ref: ItemRef;
  view: GearView;
  gizmos: Gizmo[];
  /** the type of each gizmo, in the same order (core/augment.ts): a shieldbow holds one of each */
  types: GizmoType[];
  /** the gizmo the next tile click fills (0-based) */
  slot: number;
}

interface EofEdit {
  where: Where;
  ref: ItemRef;
}

/** one tile of the Essence of Finality picker */
interface EofTile {
  spec: WeaponSpec;
  icon: string;
  /** how many PvME setups store this special */
  usage: number;
}

/** one Essence of Finality amulet the loadout carries, worn or in the backpack, with the special it stores */
export interface EofAmulet {
  /** the worn neck slot, or the backpack slot (0-based) */
  where: 'worn' | 'backpack';
  index: number;
  name: string;
  spec: WeaponSpec | null;
}

/**
 * Every Essence of Finality amulet a loadout carries – the worn one first, then the backpack in slot order.
 *
 * A loadout may hold several, each with its own stored special (`ItemRef.spec`), and the engine fires whichever the
 * rotation asks for (`ResolvedLoadout.eofSpecs`). The effects panel used to read the neck slot alone, so a player
 * with three amulets in the backpack was told they carried none.
 */
export function carriedEofAmulets(l: Pick<LoadoutModel, 'equipment' | 'inventory'>, gearById: Map<string, GearItem>, specById: Map<string, WeaponSpec>): EofAmulet[] {
  const amulet = (ref: ItemRef | null | undefined): GearItem | null => {
    const item = ref?.kind === 'gear' ? gearById.get(ref.id) ?? null : null;
    return item?.passive === 'essence-of-finality' ? item : null;
  };
  const of = (ref: ItemRef, item: GearItem, where: EofAmulet['where'], index: number): EofAmulet => ({
    where,
    index,
    name: item.name,
    spec: ref.spec ? specById.get(ref.spec) ?? null : null,
  });
  const out: EofAmulet[] = [];
  const neck = l.equipment?.neck;
  const worn = amulet(neck);
  if (neck && worn) out.push(of(neck, worn, 'worn', -1));
  (l.inventory ?? []).forEach((ref, i) => {
    const item = amulet(ref);
    if (ref && item) out.push(of(ref, item, 'backpack', i));
  });
  return out;
}

/**
 * The gear of the active setup. The catalog is the PvME-ordered one of core/gear-catalog.ts: weapons in the pairs
 * they are wielded in, armour in sets, everything sorted by how many PvME setups use it, the rest hidden. An item
 * with sub-options – an Essence of Finality's special, a gizmo – asks for them the moment it lands in the loadout,
 * and gizmos are picked from the combos PvM players use (core/gizmo-combos.ts) rather than perk by perk.
 */
@Component({
  selector: 'app-loadout',
  imports: [FormsModule, RouterLink, GearPanel, GearTip],
  templateUrl: './loadout.html',
  styleUrl: './loadout.scss',
})
export class Loadout {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);
  readonly gearDrag = inject(GearDragService);
  private toast = inject(ToastService);

  readonly l = this.storage.loadout;
  readonly RELICS = RELICS;
  readonly TABS = TABS;
  readonly STYLE_ORDER = STYLE_ORDER;
  readonly SLOT_NAMES = SLOT_NAMES;
  readonly USAGE_THRESHOLD = USAGE_THRESHOLD;

  // ---------------------------------------------------------------- catalog

  readonly tab = signal<Tab>('weapons');
  readonly search = signal('');
  readonly minTier = signal(1);
  /** "Hide obscure equipment": everything fewer than USAGE_THRESHOLD PvME setups use (core/obscure.ts) */
  readonly hideObscure = computed(() => this.storage.settings().hideObscureEquipment);
  readonly tiered = computed(() => TIERED.includes(this.tab()));

  setHideObscure(v: boolean): void {
    void this.storage.saveSettings({ ...this.storage.settings(), hideObscureEquipment: v });
  }

  readonly sections = computed<CatalogSection[]>(() => {
    if (!this.data.loadoutReady()) return [];
    const f = { query: this.search(), hide: this.hideObscure(), threshold: USAGE_THRESHOLD, minTier: this.tiered() ? this.minTier() : 0 };
    const usage = this.data.usage();
    switch (this.tab()) {
      case 'weapons':
        return weaponSections(this.data.weapons(), usage, f);
      case 'armour':
        return armourSections(this.data.gear(), this.data.setEffectById(), usage, f);
      case 'accessories':
        return accessorySections(this.data.gear(), usage, f);
      default:
        return potionSections(this.data.specials(), usage, f);
    }
  });
  readonly entryCount = computed(() => this.sections().reduce((n, s) => n + s.entries.length, 0));
  /** the first CATALOG_LIMIT entries, sections kept in order (see CATALOG_LIMIT) */
  readonly shownSections = computed<CatalogSection[]>(() => {
    let left = CATALOG_LIMIT;
    const out: CatalogSection[] = [];
    for (const s of this.sections()) {
      if (left <= 0) break;
      out.push(s.entries.length <= left ? s : { ...s, entries: s.entries.slice(0, left) });
      left -= s.entries.length;
    }
    return out;
  });
  readonly shownCount = computed(() => this.shownSections().reduce((n, s) => n + s.entries.length, 0));
  /** the items of every drawn entry, resolved once per catalog */
  private readonly entryViews = computed(() => {
    const out = new Map<string, GearView[]>();
    for (const s of this.shownSections()) for (const e of s.entries) out.set(e.key, e.refs.map((r) => this.data.view(r)).filter((v): v is GearView => !!v));
    return out;
  });

  views(e: CatalogEntry): GearView[] {
    return this.entryViews().get(e.key) ?? [];
  }

  meta(e: CatalogEntry): string {
    const parts: string[] = [];
    if (e.tier) parts.push('T' + e.tier);
    if (e.score) parts.push(e.score + (e.score === 1 ? ' PvME setup' : ' PvME setups'));
    const v = this.views(e);
    if (e.kind === 'single' && v[0]?.weapon?.spec) parts.push('spec');
    if (e.kind === 'single' && v[0]?.passive) parts.push('passive');
    if (e.kind === 'set' && e.refs.length > e.chosen.length) parts.push(e.chosen.length + ' slots, ' + e.refs.length + ' pieces');
    return parts.join(' · ');
  }

  /** the catalog never receives drops from itself; dropping a worn / carried item on it removes the item */
  readonly catalogReceives = computed(() => {
    const d = this.gearDrag.drag();
    return !!d && d.from.kind !== 'catalog';
  });

  /** pointerdown on a catalog icon: starts the pointer drag (shared/gear-drag.ts), the item stays in the list */
  startDrag(ev: PointerEvent, v: GearView): void {
    this.gearDrag.start(ev, { ref: v.ref, from: { kind: 'catalog' } }, v);
  }

  // ---------------------------------------------------------------- state

  readonly loadoutData = computed<LoadoutData>(() => ({
    weaponById: this.data.weaponById(),
    specById: this.data.specById(),
    perkById: this.data.perkById(),
    setEffectById: this.data.setEffectById(),
    gearById: this.data.gearById(),
    familiarById: this.data.familiarById(),
    specEntity: (s) => this.data.specEntity(s),
  }));
  /** the loadout's familiar with its scroll, for the summary next to the select */
  readonly familiar = computed(() => (this.l().familiar ? this.data.familiarById().get(this.l().familiar!) ?? null : null));
  readonly warnings = computed(() => (this.data.loadoutReady() ? loadoutWarnings(this.l(), this.loadoutData()) : []));
  /** set thresholds / passives the simulation ignores: "<id>:<kind>" → reason */
  readonly notSimulated = computed<Map<string, string>>(() => {
    const out = new Map<string, string>();
    for (const e of this.resolved()?.ignoredEffects ?? []) out.set(e.id + ':' + e.kind, NOT_SIMULATED_EFFECT_KINDS[e.kind] ?? 'not simulated');
    return out;
  });
  /** the engine's numbers for the worn gear (ability damage, damage bonus, life points, ignored effects) */
  readonly resolved = computed<ResolvedLoadout | null>(() => (this.data.loadoutReady() ? resolveLoadout(this.l(), this.loadoutData()) : null));
  readonly STYLES4 = STYLES4;
  readonly levelPart = levelPart;

  /** name of the skill whose level feeds the ability damage of the wielded style */
  damageSkillName(r: ResolvedLoadout): string {
    return SKILL_NAMES[damageSkillOf(r.style)];
  }

  /** damage bonus of the worn gear for the wielded style (b of the ability damage formula) */
  styleBonus(r: ResolvedLoadout): number {
    return r.style && isStyle4(r.style) ? r.damageBonus[r.style] : 0;
  }

  /** critical strike damage in % at the wielded style's level, gear bonuses included */
  critPct(r: ResolvedLoadout): number {
    return Math.round((critMultiplier(r.combatLevel) - 1 + r.critDamageAdd) * 100);
  }

  ignoredReason(id: string, kind: string | undefined): string | null {
    return kind ? this.notSimulated().get(id + ':' + kind) ?? null : null;
  }
  readonly sets = computed(() => (this.data.loadoutReady() ? wornSets(this.l(), this.loadoutData()) : []));
  readonly passives = computed(() => (this.data.loadoutReady() ? wornPassives(this.l(), this.loadoutData()).filter((p) => p.slot !== 'talent') : []));
  readonly wieldedStyle = computed(() => (this.data.loadoutReady() ? mainStyle(this.l(), this.loadoutData()) : null));
  readonly weaponSpec = computed(() => {
    if (!this.data.loadoutReady()) return null;
    const eq = this.l().equipment;
    for (const r of [eq.twoHand, eq.mainHand, eq.offHand]) {
      const w = r?.kind === 'weapon' ? this.data.weaponById().get(r.id) : null;
      if (w?.spec) return this.data.specById().get(w.spec) ?? null;
    }
    return null;
  });
  /** every Essence of Finality amulet the loadout carries, worn or in the backpack (see carriedEofAmulets) */
  readonly eofAmulets = computed<EofAmulet[]>(() => (this.data.loadoutReady() ? carriedEofAmulets(this.l(), this.data.gearById(), this.data.specById()) : []));
  /** the "i" next to the gear: weapon special, EoF amulets, set effects and passives of what is worn */
  readonly infoOpen = signal(false);
  /** one line for the "i" button: "3 set effects · 4 passives · EoF: Split Soul" */
  readonly infoSummary = computed(() => {
    const parts: string[] = [];
    const n = this.sets().length;
    if (n) parts.push(n + (n === 1 ? ' set effect' : ' set effects'));
    const p = this.passives().length;
    if (p) parts.push(p + (p === 1 ? ' passive' : ' passives'));
    const eof = this.eofAmulets().filter((a) => a.spec);
    if (eof.length) parts.push('EoF: ' + eof.map((a) => a.spec!.name).join(', '));
    return parts.join(' · ');
  });

  private state(): GearState {
    return { equipment: this.l().equipment, inventory: this.l().inventory };
  }

  private apply(r: GearResult, done?: string): boolean {
    if (r.error) {
      this.toast.show(r.error, 'warn');
      return false;
    }
    this.patch({ equipment: r.state.equipment, inventory: r.state.inventory });
    if (done) this.toast.show(done);
    return true;
  }

  constructor() {
    // legacy loadouts (flags instead of worn items) are migrated by the StorageService once these catalogs are in
    void this.data.ensure('gear', 'weapons', 'perks', 'usage');
  }

  // ---------------------------------------------------------------- setup picker

  /**
   * The gear belongs to a setup (boss + gear + rotations): the page edits the active setup's loadout, and this picker
   * switches the active setup – grouped by boss with a search field (shared/picker-groups.ts), like on the Train page.
   * Creating, copying and deleting setups is the Setups page's job.
   */
  readonly setupSearch = signal('');
  private readonly setupEntries = computed(() => this.storage.setups().map((s) => ({ id: s.id, name: setupTitle(s) })));
  readonly filteredSetups = computed(() => filterEntries(this.setupEntries(), this.setupSearch(), this.storage.activeSetupId()));
  readonly setupGroups = computed(() => groupEntries(this.filteredSetups()));
  readonly setupCount = computed(() => {
    const all = this.setupEntries().length;
    const shown = this.filteredSetups().length;
    return shown === all ? '' : shown + ' of ' + all;
  });

  select(id: string): void {
    void this.storage.setActiveSetup(id);
  }

  private patch(p: Partial<LoadoutModel>): void {
    void this.storage.saveLoadout({ ...this.l(), ...p });
  }

  // ---------------------------------------------------------------- gear panel + catalog actions

  private slotOf = (r: ItemRef): EquipSlot | null => this.data.slotOf(r);

  onGear(a: GearAction): void {
    switch (a.kind) {
      case 'drop-equip':
        this.dropEquip(a.drag, a.slot);
        break;
      case 'drop-inv':
        this.dropInv(a.drag, a.index);
        break;
      case 'click':
        if (a.from.kind === 'inv') this.wear(a.ref, a.from.index);
        else if (a.from.kind === 'equip') this.takeOff(a.from.slot);
        break;
      case 'menu':
        this.openMenu(a.ref, a.from, a.x, a.y);
        break;
      case 'drop-out':
        if (a.drag.from.kind === 'inv') this.apply(removeItem(this.state(), a.drag.from.index));
        else if (a.drag.from.kind === 'equip') this.apply(removeWorn(this.state(), a.drag.from.slot));
        break;
    }
  }

  private dropEquip(d: GearDrag, slot: EquipSlot): void {
    if (d.from.kind === 'equip') return; // same slot family – nothing to do
    if (d.refs && d.refs.length > 1) return this.wearRefs(d.refs); // a group dropped on a slot is worn whole
    const from = d.from.kind === 'inv' ? d.from.index : null;
    if (this.apply(equip(this.state(), d.ref, this.slotOf, from, slot)) && d.from.kind === 'catalog') this.askSubOptions([d.ref]);
  }

  private dropInv(d: GearDrag, index: number): void {
    if (d.from.kind === 'catalog') {
      if (d.refs && d.refs.length > 1) return this.addRefs(d.refs, index); // a group dropped on the backpack lands whole
      if (this.apply(addItem(this.state(), d.ref, index))) this.askSubOptions([d.ref]);
    } else if (d.from.kind === 'inv') this.apply(moveItem(this.state(), d.from.index, index));
    else this.apply(unequip(this.state(), d.from.slot, this.slotOf, index));
  }

  /** every item of a group into the backpack, the first one at `index` */
  private addRefs(refs: ItemRef[], index?: number): void {
    let s = this.state();
    let n = 0;
    for (const ref of refs) {
      const r = addItem(s, ref, n === 0 ? index : undefined);
      if (r.error) {
        this.toast.show(r.error, 'warn');
        break;
      }
      s = r.state;
      n++;
    }
    if (!n) return;
    this.patch({ equipment: s.equipment, inventory: s.inventory });
    this.toast.show(n + (n === 1 ? ' item' : ' items') + ' added to the backpack');
    this.askSubOptions(refs.slice(0, n));
  }

  /** every item of a group worn, in wear order; what was worn before goes into the backpack */
  private wearRefs(refs: ItemRef[]): void {
    let s = this.state();
    let n = 0;
    for (const ref of refs) {
      const r = this.slotOf(ref) ? equip(s, ref, this.slotOf) : addItem(s, ref);
      if (r.error) {
        this.toast.show(r.error, 'warn');
        break;
      }
      s = r.state;
      n++;
    }
    if (!n) return;
    this.patch({ equipment: s.equipment, inventory: s.inventory });
    this.askSubOptions(refs.slice(0, n));
  }

  /** an item dropped back on the catalog leaves the loadout */
  dropOnCatalog(e: Event): void {
    const d = (e as CustomEvent<GearDrag>).detail;
    if (!d) return;
    if (d.from.kind === 'inv') this.apply(removeItem(this.state(), d.from.index));
    else if (d.from.kind === 'equip') this.apply(removeWorn(this.state(), d.from.slot));
  }

  /** click on a catalog icon: into the backpack */
  addFromCatalog(v: GearView): void {
    if (this.gearDrag.suppressClick) return;
    if (this.apply(addItem(this.state(), v.ref), v.name + ' added to the backpack')) this.askSubOptions([v.ref]);
  }

  wearFromCatalog(v: GearView): void {
    if (this.gearDrag.suppressClick) return;
    if (!this.slotOf(v.ref)) return this.addFromCatalog(v);
    if (this.apply(equip(this.state(), v.ref, this.slotOf), v.name + (v.weapon ? ' wielded' : ' worn'))) this.askSubOptions([v.ref]);
  }

  /** click on an entry: a single item goes into the backpack, a group is worn whole (its best variant per slot) */
  clickEntry(e: CatalogEntry): void {
    if (this.gearDrag.suppressClick) return;
    const v = this.views(e);
    if (e.kind === 'single') return this.addFromCatalog(v[0]);
    this.wearAll(e);
  }

  dblEntry(e: CatalogEntry): void {
    if (e.kind === 'single') this.wearFromCatalog(this.views(e)[0]);
  }

  /** wears a group: its chosen pieces in wear order; what was worn before goes into the backpack */
  wearAll(e: CatalogEntry): void {
    this.wearRefs(e.chosen);
    this.toast.show(e.name + (e.kind === 'pair' ? ' wielded' : ' worn'));
  }

  /** pointerdown on a group card (not on one of its icons): the whole group – its chosen pieces – is dragged */
  startGroupDrag(ev: PointerEvent, e: CatalogEntry): void {
    if (e.kind === 'single') return this.startDrag(ev, this.views(e)[0]);
    const first = this.data.view(e.chosen[0]);
    if (!first) return;
    this.gearDrag.start(ev, { ref: e.chosen[0], refs: e.chosen, from: { kind: 'catalog' } }, { icon: first.icon, name: e.name });
  }

  /** pointerdown on one icon of a group: that piece alone is dragged */
  startPieceDrag(ev: PointerEvent, v: GearView): void {
    ev.stopPropagation();
    this.startDrag(ev, v);
  }

  /** click on one icon of a group: that piece alone into the backpack */
  clickPiece(ev: Event, e: CatalogEntry, v: GearView): void {
    if (e.kind === 'single') return; // the entry handles it
    ev.stopPropagation();
    this.addFromCatalog(v);
  }

  dblPiece(ev: Event, e: CatalogEntry, v: GearView): void {
    if (e.kind === 'single') return;
    ev.stopPropagation();
    this.wearFromCatalog(v);
  }

  /** a variant of the same slot as the icon before it (Deathdealer tier 70 next to tier 90) */
  isVariant(vs: GearView[], i: number): boolean {
    return i > 0 && vs[i].slot === vs[i - 1].slot;
  }

  private wear(ref: ItemRef, index: number): void {
    const view = this.data.view(ref);
    if (!this.slotOf(ref)) return; // potions stay in the backpack
    this.apply(equip(this.state(), ref, this.slotOf, index), (view?.name ?? ref.id) + (ref.kind === 'weapon' ? ' wielded' : ' worn'));
  }

  private takeOff(slot: EquipSlot): void {
    this.apply(unequip(this.state(), slot, this.slotOf));
  }

  menuPiece(e: MouseEvent, v: GearView): void {
    e.preventDefault();
    e.stopPropagation();
    this.openMenu(v.ref, { kind: 'catalog' }, e.clientX, e.clientY);
  }

  // ---------------------------------------------------------------- sub-options right after an item lands

  /** items that landed from the catalog and have something to choose: an EoF special, gizmo combos – one dialog after the other */
  private pending: ItemRef[] = [];

  private askSubOptions(refs: ItemRef[]): void {
    const wanting = refs.filter((r) => {
      const v = this.data.view(r);
      return !!v && (v.passive?.id === 'essence-of-finality' || v.gizmos.length > 0);
    });
    if (!wanting.length) return;
    this.pending.push(...wanting);
    if (!this.perkEdit() && !this.eofEdit()) this.nextSubOption();
  }

  private nextSubOption(): void {
    const ref = this.pending.shift();
    if (!ref) return;
    const where = this.whereOf(ref);
    const view = this.data.view(ref);
    if (!where || !view) return this.nextSubOption();
    if (view.passive?.id === 'essence-of-finality') this.editEof(where, this.refAt(where) ?? ref);
    else this.editPerks(where, this.refAt(where) ?? ref, view);
  }

  /** where an item of this id sits now: worn, else the last backpack slot holding one without options yet */
  private whereOf(ref: ItemRef): Where | null {
    const s = this.state();
    for (const [slot, r] of Object.entries(s.equipment) as [EquipSlot, ItemRef | null | undefined][]) if (r && r.kind === ref.kind && r.id === ref.id) return { slot };
    for (let i = s.inventory.length - 1; i >= 0; i--) {
      const r = s.inventory[i];
      if (r && r.kind === ref.kind && r.id === ref.id && !r.spec && !r.gizmos?.length) return { index: i };
    }
    for (let i = s.inventory.length - 1; i >= 0; i--) {
      const r = s.inventory[i];
      if (r && r.kind === ref.kind && r.id === ref.id) return { index: i };
    }
    return null;
  }

  private refAt(where: Where): ItemRef | null {
    const s = this.state();
    return 'slot' in where ? s.equipment[where.slot] ?? null : s.inventory[where.index];
  }

  // ---------------------------------------------------------------- context menu

  readonly menu = signal<Menu | null>(null);

  private openMenu(ref: ItemRef, from: GearSource, x: number, y: number): void {
    const view = this.data.view(ref);
    if (!view) return;
    const items: MenuItem[] = [];
    const wearable = !!this.slotOf(ref);
    const where: Where | null = from.kind === 'inv' ? { index: from.index } : from.kind === 'equip' ? { slot: from.slot } : null;
    if (from.kind === 'catalog') {
      if (wearable) items.push({ label: ref.kind === 'weapon' ? 'Wield' : 'Wear', run: () => this.wearFromCatalog(view) });
      items.push({ label: 'Add to backpack', run: () => this.addFromCatalog(view) });
    } else if (from.kind === 'inv') {
      if (wearable) items.push({ label: ref.kind === 'weapon' ? 'Wield' : 'Wear', run: () => this.wear(ref, from.index) });
    } else {
      items.push({ label: 'Take off', run: () => this.takeOff(from.slot) });
    }
    if (where && view.gizmos.length) items.push({ label: 'Gizmos…', run: () => this.editPerks(where, ref, view) });
    if (where && view.passive?.id === 'essence-of-finality') items.push({ label: 'Stored special attack…', run: () => this.editEof(where, ref) });
    if (from.kind === 'inv') items.push({ label: 'Drop', danger: true, run: () => this.apply(removeItem(this.state(), from.index)) });
    if (from.kind === 'equip') items.push({ label: 'Drop', danger: true, run: () => this.apply(removeWorn(this.state(), from.slot)) });
    const w = Math.min(x, window.innerWidth - 220);
    const h = Math.min(y, window.innerHeight - 40 * (items.length + 1));
    this.menu.set({ x: w, y: h, title: view.name, items });
  }

  runMenu(item: MenuItem): void {
    this.menu.set(null);
    item.run();
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeMenu(): void {
    if (this.menu()) this.menu.set(null);
  }

  // ---------------------------------------------------------------- gizmos: the combos PvM players use

  readonly perkEdit = signal<PerkEdit | null>(null);
  readonly COMBO_TIER_LABEL = COMBO_TIER_LABEL;
  /** the combos of the edited item's gizmo type, in tier groups (best first) */
  readonly comboGroups = computed<{ tier: ComboTier; combos: GizmoCombo[] }[]>(() => {
    const e = this.perkEdit();
    if (!e) return [];
    const out = new Map<ComboTier, GizmoCombo[]>();
    for (const c of combosFor(this.gizmoType())) out.set(c.tier, [...(out.get(c.tier) ?? []), c]);
    return [...out].map(([tier, combos]) => ({ tier, combos }));
  });

  /** the type of the gizmo being filled right now (a shieldbow's second one takes armour perks) */
  readonly gizmoType = computed<GizmoType>(() => {
    const e = this.perkEdit();
    return e?.types[e.slot] ?? 'weapon';
  });

  private editPerks(where: Where, ref: ItemRef, view: GearView): void {
    const types = view.gizmos;
    const gizmos: Gizmo[] = types.map((_, i) => ({ ancient: !!ref.gizmos?.[i]?.ancient, perks: [...(ref.gizmos?.[i]?.perks ?? [])] }));
    const slot = gizmos.findIndex((g) => !g.perks.length);
    this.perkEdit.set({ where, ref, view, gizmos, types, slot: slot < 0 ? 0 : slot });
  }

  /** "Precise 6 + Aftershock 1" or the PvME shorthand for a stored gizmo; "empty" when it has no perks */
  gizmoLabel(g: Gizmo): string {
    if (!g.perks.length) return 'empty';
    const combo = comboOf(g);
    return (combo ? combo.short + ': ' : '') + comboLabel(g.perks, this.data.perkById());
  }

  comboText(c: GizmoCombo): string {
    return comboLabel(c.perks, this.data.perkById());
  }

  isCombo(c: GizmoCombo): boolean {
    const e = this.perkEdit();
    return !!e && comboOf(e.gizmos[e.slot])?.id === c.id;
  }

  pickGizmoSlot(i: number): void {
    this.perkEdit.update((e) => e && { ...e, slot: i });
  }

  /** a tile click fills the selected gizmo and saves at once; the next empty gizmo becomes the selected one */
  pickCombo(c: GizmoCombo | null): void {
    const e = this.perkEdit();
    if (!e) return;
    const gizmos = e.gizmos.map((g, i) => (i === e.slot ? (c ? gizmoOf(c) : { ancient: true, perks: [] }) : g));
    const ref: ItemRef = { ...e.ref };
    if (gizmos.some((g) => g.perks.length)) ref.gizmos = gizmos;
    else delete ref.gizmos;
    this.patch(updateRef(this.state(), e.where, ref));
    const next = gizmos.findIndex((g, i) => i !== e.slot && !g.perks.length);
    this.perkEdit.set({ ...e, ref, gizmos, slot: next >= 0 ? next : e.slot });
  }

  closePerks(): void {
    this.perkEdit.set(null);
    this.nextSubOption();
  }

  // ---------------------------------------------------------------- Essence of Finality: tiles by style, most used first

  readonly eofEdit = signal<EofEdit | null>(null);
  readonly eofShowAll = signal(false);
  readonly eofGroups = computed<{ style: Style; tiles: EofTile[] }[]>(() => {
    if (!this.eofEdit()) return [];
    const usage = this.data.usage();
    const current = this.eofEdit()?.ref.spec ?? null;
    const all = this.eofShowAll();
    const byId = this.data.weaponById();
    const tiles = this.data
      .specs()
      .filter((s) => s.eof.storable !== false)
      .map<EofTile>((s) => ({ spec: s, icon: s.weaponIds.map((id) => byId.get(id)?.icon).find((x): x is string => !!x) ?? SPEC_ICON, usage: usage?.eofSpecs[s.id] ?? 0 }))
      .filter((t) => all || t.usage > 0 || t.spec.id === current)
      .sort((x, y) => y.usage - x.usage || x.spec.name.localeCompare(y.spec.name));
    return STYLE_ORDER.map((style) => ({ style, tiles: tiles.filter((t) => t.spec.style === style) })).filter((g) => g.tiles.length);
  });

  private editEof(where: Where, ref: ItemRef): void {
    this.eofEdit.set({ where, ref });
  }

  /** a tile click stores the special and closes the picker */
  pickEof(id: string | null): void {
    const e = this.eofEdit();
    if (!e) return;
    const ref: ItemRef = { ...e.ref };
    if (id) ref.spec = id;
    else delete ref.spec;
    this.patch(updateRef(this.state(), e.where, ref));
    this.closeEof();
  }

  closeEof(): void {
    this.eofEdit.set(null);
    this.nextSubOption();
  }

  // ---------------------------------------------------------------- prayer book, relics, talents

  setPrayerBook(v: string): void {
    this.patch({ prayerBook: v === 'Prayers' ? 'Prayers' : 'Curses' });
  }

  setSpellbook(v: string): void {
    this.patch({ spellbook: v === 'ancient' || v === 'lunar' ? v : 'standard' });
  }

  hasRelic(id: string): boolean {
    return this.l().relics.includes(id);
  }

  toggleRelic(id: string): void {
    const relics = this.hasRelic(id) ? this.l().relics.filter((x) => x !== id) : [...this.l().relics, id];
    this.patch({ relics });
  }

  seconds(ticks: number): string {
    return (ticks * 0.6).toFixed(1).replace(/\.0$/, '');
  }

  setFamiliar(v: unknown): void {
    const id = typeof v === 'string' && this.data.familiarById().has(v) ? v : null;
    this.patch({ familiar: id });
  }

  setSpiritPact(v: unknown): void {
    this.patch({ spiritPact: Math.max(0, Math.min(3, Math.round(Number(v) || 0))) as 0 | 1 | 2 | 3 });
  }

  // ---------------------------------------------------------------- consumables in effect (engine/damage.ts)

  readonly OVERLOAD_CHOICES = OVERLOAD_CHOICES;
  readonly OVERLOADS = OVERLOADS;
  readonly WEAPON_POISON_TIERS: WeaponPoisonTier[] = [0, 1, 2, 3, 4];
  readonly WEAPON_POISON_NAMES = WEAPON_POISON_NAMES;
  readonly boostedLevel = boostedLevel;
  readonly poisonPct = poisonPct;

  readonly COMBAT_SKILLS = COMBAT_SKILLS;
  readonly SKILL_NAMES = SKILL_NAMES;
  readonly SKILL_MAX = SKILL_MAX;
  readonly levels = computed(() => loadoutLevels(this.l()));

  setLevel(skill: CombatSkill, v: unknown): void {
    const n = Math.max(1, Math.min(SKILL_MAX[skill], Math.round(Number(v) || SKILL_MAX[skill])));
    this.patch({ levels: { ...loadoutLevels(this.l()), [skill]: n } });
  }

  setOverload(v: unknown): void {
    this.patch({ overload: OVERLOAD_CHOICES.includes(v as OverloadChoice) ? (v as OverloadChoice) : 'none' });
  }

  setWeaponPoison(v: unknown): void {
    this.patch({ weaponPoison: Math.max(0, Math.min(4, Math.round(Number(v) || 0))) as WeaponPoisonTier });
  }

  setKwuarmPotency(v: unknown): void {
    this.patch({ kwuarmPotency: Math.max(0, Math.min(4, Math.round(Number(v) || 0))) as KwuarmPotency });
  }

  freeSlots(): number {
    return this.l().inventory.filter((x) => !x).length;
  }

  usageOf(ref: ItemRef): number {
    return itemUsage(this.data.usage(), ref);
  }
}

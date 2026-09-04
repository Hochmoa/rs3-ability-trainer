import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, GearView } from '../../core/data.service';
import { GearResult, GearState, addItem, equip, moveItem, removeItem, removeWorn, unequip, updateRef } from '../../core/equipment';
import { EquipSlot, Gizmo, ItemRef, Loadout as LoadoutModel, Perk, RELICS, SLOT_NAMES, Style, WeaponSpec, newLoadout } from '../../core/models';
import { isObscureGear, isObscurePerk, isObscureSpec, isObscureWeapon } from '../../core/obscure';
import { StorageService } from '../../core/storage.service';
import { LoadoutData, loadoutWarnings, mainStyle, wornPassives, wornSets } from '../../engine/loadout-resolver';
import { DialogService } from '../../shared/dialog';
import { GearDragService } from '../../shared/gear-drag';
import { GearAction, GearDrag, GearPanel, GearSource } from '../../shared/gear-panel';
import { ToastService } from '../../shared/toast';
import { GearTip } from '../../shared/tooltip';

/** catalog tabs: weapon slots, worn slots, potions */
type Tab = 'weapons' | 'offhand' | 'head' | 'body' | 'legs' | 'hands' | 'feet' | 'cape' | 'neck' | 'ring' | 'ammo' | 'pocket' | 'aura' | 'sigil' | 'potions';
const TABS: { id: Tab; label: string }[] = [
  { id: 'weapons', label: 'Weapons' },
  { id: 'offhand', label: 'Off-hand & shields' },
  { id: 'head', label: 'Head' },
  { id: 'body', label: 'Body' },
  { id: 'legs', label: 'Legs' },
  { id: 'hands', label: 'Hands' },
  { id: 'feet', label: 'Feet' },
  { id: 'cape', label: 'Cape' },
  { id: 'neck', label: 'Neck' },
  { id: 'ring', label: 'Ring' },
  { id: 'ammo', label: 'Ammo' },
  { id: 'pocket', label: 'Pocket' },
  { id: 'aura', label: 'Aura' },
  { id: 'sigil', label: 'Sigil' },
  { id: 'potions', label: 'Potions & bombs' },
];
/** slots whose catalog gets a tier filter */
const TIERED: Tab[] = ['weapons', 'offhand', 'head', 'body', 'legs', 'hands', 'feet', 'cape'];
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
  /** perk type the gizmos take (weapons: weapon gizmos; body / legs / shields: armour gizmos) */
  type: 'weapon' | 'armour';
}

interface EofEdit {
  where: Where;
  ref: ItemRef;
  spec: string | null;
}

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
  private dialogs = inject(DialogService);
  private toast = inject(ToastService);

  readonly l = this.storage.loadout;
  readonly RELICS = RELICS;
  readonly TABS = TABS;
  readonly STYLE_ORDER = STYLE_ORDER;
  readonly SLOT_NAMES = SLOT_NAMES;

  // ---------------------------------------------------------------- catalog

  readonly tab = signal<Tab>('weapons');
  readonly search = signal('');
  readonly style = signal<Style | 'all'>('all');
  readonly minTier = signal(70);
  /** "Hide obscure equipment" – Daemonheim tiers, tools, cosmetics, sap-level junk (core/obscure.ts) */
  readonly hideObscure = computed(() => this.storage.settings().hideObscureEquipment);
  readonly tiered = computed(() => TIERED.includes(this.tab()));

  setHideObscure(v: boolean): void {
    void this.storage.saveSettings({ ...this.storage.settings(), hideObscureEquipment: v });
  }

  readonly catalog = computed<GearView[]>(() => {
    if (!this.data.loaded()) return [];
    const tab = this.tab();
    const q = this.search().trim().toLowerCase();
    const style = this.style();
    const tier = this.tiered() ? this.minTier() : 0;
    const hide = this.hideObscure();
    let refs: ItemRef[];
    if (tab === 'weapons' || tab === 'offhand') {
      refs = this.data
        .weapons()
        .filter((w) => (tab === 'weapons' ? w.slot === 'main' || w.slot === '2h' : w.slot === 'off' || w.slot === 'shield'))
        .filter((w) => style === 'all' || w.style === style || w.slot === 'shield')
        .filter((w) => w.tier >= tier || !!w.spec)
        .filter((w) => !hide || !isObscureWeapon(w))
        .filter((w) => !q || w.name.toLowerCase().includes(q))
        .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name))
        .map((w) => ({ kind: 'weapon', id: w.id }));
    } else if (tab === 'potions') {
      refs = this.data
        .specials()
        .filter((s) => !q || s.name.toLowerCase().includes(q))
        .map((s) => ({ kind: 'special', id: s.id }));
    } else {
      refs = this.data
        .gear()
        .filter((g) => g.slot === tab)
        .filter((g) => style === 'all' || g.style === style || g.style === 'Hybrid' || g.style === null)
        .filter((g) => g.tier >= tier || !!g.passive || !!g.set)
        .filter((g) => !hide || !isObscureGear(g))
        .filter((g) => !q || g.name.toLowerCase().includes(q))
        .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name))
        .map((g) => ({ kind: 'gear', id: g.id }));
    }
    return refs
      .slice(0, 200)
      .map((r) => this.data.view(r))
      .filter((v): v is GearView => !!v);
  });

  /** the catalog never receives drops from itself; dropping a worn / carried item on it removes the item */
  readonly catalogReceives = computed(() => {
    const d = this.gearDrag.drag();
    return !!d && d.from.kind !== 'catalog';
  });

  /** pointerdown on a catalog item: starts the pointer drag (shared/gear-drag.ts), the item stays in the list */
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
    specEntity: (s) => this.data.specEntity(s),
  }));
  readonly warnings = computed(() => (this.data.loaded() ? loadoutWarnings(this.l(), this.loadoutData()) : []));
  readonly sets = computed(() => (this.data.loaded() ? wornSets(this.l(), this.loadoutData()) : []));
  readonly passives = computed(() => (this.data.loaded() ? wornPassives(this.l(), this.loadoutData()).filter((p) => p.slot !== 'talent') : []));
  readonly wieldedStyle = computed(() => (this.data.loaded() ? mainStyle(this.l(), this.loadoutData()) : null));
  readonly weaponSpec = computed(() => {
    if (!this.data.loaded()) return null;
    const eq = this.l().equipment;
    for (const r of [eq.twoHand, eq.mainHand, eq.offHand]) {
      const w = r?.kind === 'weapon' ? this.data.weaponById().get(r.id) : null;
      if (w?.spec) return this.data.specById().get(w.spec) ?? null;
    }
    return null;
  });
  readonly eofSpec = computed(() => {
    const neck = this.l().equipment.neck;
    const id = neck?.spec ?? null;
    return id ? this.data.specById().get(id) ?? null : null;
  });
  readonly hasEof = computed(() => {
    const neck = this.l().equipment.neck;
    return neck?.kind === 'gear' && this.data.gearById().get(neck.id)?.passive === 'essence-of-finality';
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
    // loadouts saved before the inventory: flags (Ring of vigour, armour set + pieces, EoF spec) become worn items, once
    effect(() => {
      if (!this.data.loaded() || !this.storage.ready()) return;
      for (const l of this.storage.loadouts()) {
        const migrated = this.migrateLegacy(l);
        if (migrated) void this.storage.saveLoadout(migrated);
      }
    });
  }

  private migrateLegacy(l: LoadoutModel): LoadoutModel | null {
    if (!l.items.length && !l.armourSet && !(l.eofSpec && !l.equipment.neck)) return null;
    let s: GearState = { equipment: l.equipment, inventory: l.inventory };
    const wear = (ref: ItemRef) => {
      const r = equip(s, ref, (x) => this.data.slotOf(x));
      if (!r.error) s = r.state;
      else s = addItem(s, ref).state;
    };
    const gear = this.data.gear();
    for (const id of l.items) {
      const item = gear.find((g) => g.passive === id);
      if (item && !Object.values(s.equipment).some((r) => r?.id === item.id)) wear({ kind: 'gear', id: item.id });
    }
    if (l.armourSet) {
      const order = ['body', 'legs', 'head', 'hands', 'feet', 'cape'];
      const pieces = gear.filter((g) => g.set === l.armourSet).sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot) || b.tier - a.tier);
      let n = 0;
      const usedSlots = new Set<string>();
      for (const p of pieces) {
        if (n >= l.armourPieces) break;
        if (usedSlots.has(p.slot) || s.equipment[p.slot]) continue;
        wear({ kind: 'gear', id: p.id });
        usedSlots.add(p.slot);
        n++;
      }
    }
    if (l.eofSpec && !s.equipment.neck) {
      const eof = gear.find((g) => g.passive === 'essence-of-finality');
      if (eof) wear({ kind: 'gear', id: eof.id, spec: l.eofSpec });
    }
    return { ...l, equipment: s.equipment, inventory: s.inventory, items: [], armourSet: null, armourPieces: 0 };
  }

  // ---------------------------------------------------------------- loadout list

  select(id: string): void {
    void this.storage.setActiveLoadout(id);
  }

  create(): void {
    const l = newLoadout('Loadout ' + (this.storage.loadouts().length + 1));
    void this.storage.saveLoadout(l).then(() => this.storage.setActiveLoadout(l.id));
  }

  duplicate(): void {
    const copy = JSON.parse(JSON.stringify(this.l())) as LoadoutModel;
    copy.id = crypto.randomUUID();
    copy.name = this.l().name + ' (copy)';
    void this.storage.saveLoadout(copy).then(() => this.storage.setActiveLoadout(copy.id));
  }

  async remove(): Promise<void> {
    if (!(await this.dialogs.confirm('Delete loadout "' + this.l().name + '"?', { ok: 'Delete', danger: true }))) return;
    void this.storage.deleteLoadout(this.l().id);
  }

  rename(name: string): void {
    this.patch({ name });
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
    }
  }

  private dropEquip(d: GearDrag, slot: EquipSlot): void {
    if (d.from.kind === 'equip') return; // same slot family – nothing to do
    const from = d.from.kind === 'inv' ? d.from.index : null;
    this.apply(equip(this.state(), d.ref, this.slotOf, from, slot));
  }

  private dropInv(d: GearDrag, index: number): void {
    if (d.from.kind === 'catalog') this.apply(addItem(this.state(), d.ref, index));
    else if (d.from.kind === 'inv') this.apply(moveItem(this.state(), d.from.index, index));
    else this.apply(unequip(this.state(), d.from.slot, this.slotOf, index));
  }

  /** an item dropped back on the catalog leaves the loadout */
  dropOnCatalog(e: Event): void {
    const d = (e as CustomEvent<GearDrag>).detail;
    if (!d) return;
    if (d.from.kind === 'inv') this.apply(removeItem(this.state(), d.from.index));
    else if (d.from.kind === 'equip') this.apply(removeWorn(this.state(), d.from.slot));
  }

  /** click on a catalog item: into the backpack */
  addFromCatalog(v: GearView): void {
    if (this.gearDrag.suppressClick) return;
    this.apply(addItem(this.state(), v.ref), v.name + ' added to the backpack');
  }

  wearFromCatalog(v: GearView): void {
    if (this.gearDrag.suppressClick) return;
    if (!this.slotOf(v.ref)) return this.addFromCatalog(v);
    this.apply(equip(this.state(), v.ref, this.slotOf), v.name + (v.weapon ? ' wielded' : ' worn'));
  }

  private wear(ref: ItemRef, index: number): void {
    const view = this.data.view(ref);
    if (!this.slotOf(ref)) return; // potions stay in the backpack
    this.apply(equip(this.state(), ref, this.slotOf, index), (view?.name ?? ref.id) + (ref.kind === 'weapon' ? ' wielded' : ' worn'));
  }

  private takeOff(slot: EquipSlot): void {
    this.apply(unequip(this.state(), slot, this.slotOf));
  }

  menuCatalog(e: MouseEvent, v: GearView): void {
    e.preventDefault();
    this.openMenu(v.ref, { kind: 'catalog' }, e.clientX, e.clientY);
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
    if (where && view.gizmoSlots > 0) items.push({ label: 'Invention perks…', run: () => this.editPerks(where, ref, view) });
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

  // ---------------------------------------------------------------- perks

  readonly perkEdit = signal<PerkEdit | null>(null);

  private editPerks(where: Where, ref: ItemRef, view: GearView): void {
    const type: 'weapon' | 'armour' = ref.kind === 'weapon' && view.weapon?.slot !== 'shield' ? 'weapon' : 'armour';
    const gizmos: Gizmo[] = Array.from({ length: view.gizmoSlots }, (_, i) => ({ ancient: !!ref.gizmos?.[i]?.ancient, perks: [...(ref.gizmos?.[i]?.perks ?? [])] }));
    this.perkEdit.set({ where, ref, view, gizmos, type });
  }

  /** perks in use stay selectable even when obscure, so an existing gizmo never shows an empty select */
  readonly perkOptions = computed<Perk[]>(() => {
    const e = this.perkEdit();
    if (!e) return [];
    const hide = this.hideObscure();
    const used = new Set(e.gizmos.flatMap((g) => g.perks.map((p) => p.perk)));
    const type = e.type;
    return this.data
      .perks()
      .filter((p) => p.gizmos.some((g) => g === type || g === 'ancient-' + type))
      .filter((p) => !hide || used.has(p.id) || !isObscurePerk(p));
  });

  setGizmoAncient(i: number, ancient: boolean): void {
    this.perkEdit.update((e) => e && { ...e, gizmos: e.gizmos.map((g, k) => (k === i ? { ...g, ancient } : g)) });
  }

  setPerk(i: number, slot: number, perkId: string): void {
    this.perkEdit.update((e) => {
      if (!e) return e;
      const g = e.gizmos[i];
      const perks = [...g.perks];
      if (!perkId) perks.splice(slot, 1);
      else {
        const perk = this.data.perkById().get(perkId);
        const max = perk ? (g.ancient ? perk.maxRankAncient : perk.maxRank) : 1;
        perks[slot] = { perk: perkId, rank: Math.max(1, max) };
      }
      return { ...e, gizmos: e.gizmos.map((x, k) => (k === i ? { ...x, perks: perks.filter(Boolean) } : x)) };
    });
  }

  setRank(i: number, slot: number, v: unknown): void {
    this.perkEdit.update(
      (e) =>
        e && {
          ...e,
          gizmos: e.gizmos.map((g, k) => (k === i ? { ...g, perks: g.perks.map((p, j) => (j === slot ? { ...p, rank: Math.max(1, Math.round(Number(v) || 1)) } : p)) } : g)),
        },
    );
  }

  maxRank(g: Gizmo, perkId: string): number {
    const perk = this.data.perkById().get(perkId);
    return perk ? (g.ancient ? perk.maxRankAncient : perk.maxRank) || 1 : 1;
  }

  ranks(n: number): number[] {
    return Array.from({ length: Math.max(1, n) }, (_, i) => i + 1);
  }

  savePerks(): void {
    const e = this.perkEdit();
    if (!e) return;
    const gizmos = e.gizmos.map((g) => ({ ancient: g.ancient, perks: g.perks.filter((p) => p.perk) }));
    const ref: ItemRef = { ...e.ref };
    if (gizmos.some((g) => g.perks.length || g.ancient)) ref.gizmos = gizmos;
    else delete ref.gizmos;
    this.patch(updateRef(this.state(), e.where, ref));
    this.perkEdit.set(null);
  }

  // ---------------------------------------------------------------- Essence of Finality

  readonly eofEdit = signal<EofEdit | null>(null);
  readonly specsByStyle = computed(() => {
    const out = new Map<Style, WeaponSpec[]>();
    const hide = this.hideObscure();
    const byId = this.data.weaponById();
    const current = this.eofEdit()?.spec ?? null;
    const specs = this.data.specs().filter((x) => !hide || x.id === current || !isObscureSpec(x, byId));
    for (const s of STYLE_ORDER) out.set(s, specs.filter((x) => x.style === s));
    return out;
  });

  private editEof(where: Where, ref: ItemRef): void {
    this.eofEdit.set({ where, ref, spec: ref.spec ?? null });
  }

  setEofSpec(id: string | null): void {
    this.eofEdit.update((e) => e && { ...e, spec: id || null });
  }

  saveEof(): void {
    const e = this.eofEdit();
    if (!e) return;
    const ref: ItemRef = { ...e.ref };
    if (e.spec) ref.spec = e.spec;
    else delete ref.spec;
    this.patch(updateRef(this.state(), e.where, ref));
    this.eofEdit.set(null);
  }

  eofNotes(id: string | null): WeaponSpec | null {
    return id ? this.data.specById().get(id) ?? null : null;
  }

  // ---------------------------------------------------------------- prayer book, relics, talents

  setPrayerBook(v: string): void {
    this.patch({ prayerBook: v === 'Prayers' ? 'Prayers' : 'Curses' });
  }

  hasRelic(id: string): boolean {
    return this.l().relics.includes(id);
  }

  toggleRelic(id: string): void {
    const relics = this.hasRelic(id) ? this.l().relics.filter((x) => x !== id) : [...this.l().relics, id];
    this.patch({ relics });
  }

  setSpiritPact(v: unknown): void {
    this.patch({ spiritPact: Math.max(0, Math.min(3, Math.round(Number(v) || 0))) as 0 | 1 | 2 | 3 });
  }

  freeSlots(): number {
    return this.l().inventory.filter((x) => !x).length;
  }

  meta(v: GearView): string {
    const parts: string[] = [];
    if (v.tier) parts.push('T' + v.tier);
    if (v.style) parts.push(v.style);
    if (v.weapon?.spec) parts.push('spec');
    if (v.weapon?.role === 'conduit' || v.weapon?.role === 'siphon') parts.push(v.weapon.role);
    if (v.set) parts.push('set');
    if (v.passive) parts.push('passive');
    return parts.join(' · ');
  }
}

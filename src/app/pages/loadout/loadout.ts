import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { Gizmo, Loadout as LoadoutModel, Perk, RELICS, SetEffect, Style, Weapon, WeaponSpec, newLoadout } from '../../core/models';
import { isObscurePerk, isObscureSetEffect, isObscureSpec, isObscureWeapon } from '../../core/obscure';
import { StorageService } from '../../core/storage.service';
import { loadoutWarnings } from '../../engine/loadout-resolver';

type Tab = 'weapons' | 'armour' | 'perks' | 'relics';
const STYLE_ORDER: Style[] = ['Melee', 'Ranged', 'Magic', 'Necromancy'];

@Component({
  selector: 'app-loadout',
  imports: [FormsModule, RouterLink],
  templateUrl: './loadout.html',
  styleUrl: './loadout.scss',
})
export class Loadout {
  readonly storage = inject(StorageService);
  readonly data = inject(DataService);

  readonly tab = signal<Tab>('weapons');
  readonly l = this.storage.loadout;
  readonly RELICS = RELICS;

  // weapon picker
  readonly weaponSearch = signal('');
  readonly weaponStyle = signal<Style | 'all'>('all');
  readonly minTier = signal(70);
  readonly weaponSlot = signal<'main' | 'off' | '2h' | 'shield'>('main');
  /** "Hide obscure equipment" – Daemonheim tiers, tools, cosmetics, sap-level junk (core/obscure.ts) */
  readonly hideObscure = computed(() => this.storage.settings().hideObscureEquipment);

  setHideObscure(v: boolean): void {
    void this.storage.saveSettings({ ...this.storage.settings(), hideObscureEquipment: v });
  }

  readonly weaponList = computed<Weapon[]>(() => {
    const q = this.weaponSearch().trim().toLowerCase();
    const style = this.weaponStyle();
    const slot = this.weaponSlot();
    const tier = this.minTier();
    const hide = this.hideObscure();
    return this.data
      .weapons()
      .filter((w) => (slot === 'off' ? w.slot === 'off' || w.slot === 'shield' : w.slot === slot))
      .filter((w) => style === 'all' || w.style === style || w.slot === 'shield')
      .filter((w) => w.tier >= tier || !!w.spec)
      .filter((w) => !hide || !isObscureWeapon(w))
      .filter((w) => !q || w.name.toLowerCase().includes(q))
      .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name))
      .slice(0, 150);
  });

  readonly mainHand = computed(() => (this.l().mainHand ? this.data.weaponById().get(this.l().mainHand!) : null));
  readonly offHand = computed(() => (this.l().offHand ? this.data.weaponById().get(this.l().offHand!) : null));
  readonly twoHand = computed(() => (this.l().twoHand ? this.data.weaponById().get(this.l().twoHand!) : null));
  readonly weaponSpec = computed(() => {
    const id = this.twoHand()?.spec ?? this.mainHand()?.spec ?? this.offHand()?.spec ?? null;
    return id ? this.data.specById().get(id) : null;
  });
  readonly eofSpec = computed(() => (this.l().eofSpec ? this.data.specById().get(this.l().eofSpec!) : null));
  readonly specsByStyle = computed(() => {
    const out = new Map<Style, WeaponSpec[]>();
    const hide = this.hideObscure();
    const byId = this.data.weaponById();
    const eof = this.l().eofSpec;
    // the selected spec stays listed even when it is obscure, so the dropdown never shows an empty value
    const specs = this.data.specs().filter((x) => !hide || x.id === eof || !isObscureSpec(x, byId));
    for (const s of STYLE_ORDER) out.set(s, specs.filter((x) => x.style === s));
    return out;
  });
  readonly STYLE_ORDER = STYLE_ORDER;

  readonly armourSets = computed<SetEffect[]>(() => {
    const hide = this.hideObscure();
    const current = this.l().armourSet;
    return this.data.setEffects().filter((s) => s.kind === 'set' && (!hide || s.id === current || !isObscureSetEffect(s)));
  });
  readonly items = computed<SetEffect[]>(() => this.data.setEffects().filter((s) => s.kind === 'item'));
  readonly currentSet = computed(() => (this.l().armourSet ? this.data.setEffectById().get(this.l().armourSet!) : null));

  /** perks in use stay selectable even when obscure, so an existing gizmo never shows an empty select */
  private readonly perksInUse = computed(() => new Set([...this.l().weaponGizmos, ...this.l().armourGizmos].flatMap((g) => g.perks.map((p) => p.perk))));
  private readonly visiblePerks = computed<Perk[]>(() => {
    const hide = this.hideObscure();
    const used = this.perksInUse();
    return this.data.perks().filter((p) => !hide || used.has(p.id) || !isObscurePerk(p));
  });
  readonly weaponPerks = computed<Perk[]>(() => this.visiblePerks().filter((p) => p.gizmos.some((g) => g === 'weapon' || g === 'ancient-weapon') && p.gizmos.every((g) => g !== 'tool' || p.gizmos.length > 1)));
  readonly armourPerks = computed<Perk[]>(() => this.visiblePerks().filter((p) => p.gizmos.some((g) => g === 'armour' || g === 'ancient-armour')));

  readonly warnings = computed(() =>
    loadoutWarnings(this.l(), {
      weaponById: this.data.weaponById(),
      specById: this.data.specById(),
      perkById: this.data.perkById(),
      setEffectById: this.data.setEffectById(),
      specEntity: (s) => this.data.specEntity(s),
    }),
  );

  readonly weaponGizmoCount = computed(() => {
    const l = this.l();
    if (l.twoHand) return 2;
    const off = this.offHand();
    return (l.mainHand ? 1 : 0) + (off && off.slot !== 'shield' ? 1 : 0);
  });

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

  remove(): void {
    if (!confirm('Delete loadout "' + this.l().name + '"?')) return;
    void this.storage.deleteLoadout(this.l().id);
  }

  rename(name: string): void {
    this.patch({ name });
  }

  private patch(p: Partial<LoadoutModel>): void {
    void this.storage.saveLoadout({ ...this.l(), ...p });
  }

  // ---------------------------------------------------------------- weapons

  pick(w: Weapon): void {
    if (w.slot === '2h') this.patch({ twoHand: w.id, mainHand: null, offHand: null });
    else if (w.slot === 'main') this.patch({ mainHand: w.id, twoHand: null });
    else this.patch({ offHand: w.id, twoHand: null });
  }

  clearWeapon(slot: 'main' | 'off' | '2h'): void {
    if (slot === 'main') this.patch({ mainHand: null });
    else if (slot === 'off') this.patch({ offHand: null });
    else this.patch({ twoHand: null });
  }

  setEof(id: string | null): void {
    this.patch({ eofSpec: id || null });
  }

  /** weapons carried for switching (rotation steps "weapon:<id>") */
  readonly switches = computed<Weapon[]>(() => this.l().switches.map((id) => this.data.weaponById().get(id)).filter((w): w is Weapon => !!w));

  isSwitch(id: string): boolean {
    return this.l().switches.includes(id);
  }

  toggleSwitch(id: string): void {
    const cur = this.l().switches;
    this.patch({ switches: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  }

  removeSwitch(id: string): void {
    this.patch({ switches: this.l().switches.filter((x) => x !== id) });
  }

  setPrayerBook(v: string): void {
    this.patch({ prayerBook: v === 'Prayers' ? 'Prayers' : 'Curses' });
  }

  // ---------------------------------------------------------------- armour / items

  setArmourSet(id: string | null): void {
    const set = id ? this.data.setEffectById().get(id) : null;
    this.patch({ armourSet: id || null, armourPieces: set ? set.maxPieces ?? 0 : 0 });
  }

  setPieces(v: unknown): void {
    const max = this.currentSet()?.maxPieces ?? 0;
    this.patch({ armourPieces: Math.max(0, Math.min(max, Math.round(Number(v) || 0))) });
  }

  hasItem(id: string): boolean {
    return this.l().items.includes(id);
  }

  toggleItem(id: string): void {
    const items = this.hasItem(id) ? this.l().items.filter((x) => x !== id) : [...this.l().items, id];
    this.patch({ items });
  }

  itemText(i: SetEffect): string {
    return i.text ?? '';
  }

  // ---------------------------------------------------------------- perks

  gizmo(kind: 'weapon' | 'armour', i: number): Gizmo {
    return (kind === 'weapon' ? this.l().weaponGizmos : this.l().armourGizmos)[i] ?? { ancient: false, perks: [] };
  }

  setGizmo(kind: 'weapon' | 'armour', i: number, g: Gizmo): void {
    const list = [...(kind === 'weapon' ? this.l().weaponGizmos : this.l().armourGizmos)];
    list[i] = g;
    this.patch(kind === 'weapon' ? { weaponGizmos: list } : { armourGizmos: list });
  }

  toggleAncient(kind: 'weapon' | 'armour', i: number): void {
    const g = this.gizmo(kind, i);
    this.setGizmo(kind, i, { ...g, ancient: !g.ancient });
  }

  setPerk(kind: 'weapon' | 'armour', i: number, slot: number, perkId: string): void {
    const g = this.gizmo(kind, i);
    const perks = [...g.perks];
    if (!perkId) {
      perks.splice(slot, 1);
    } else {
      const perk = this.data.perkById().get(perkId);
      const max = perk ? (g.ancient ? perk.maxRankAncient : perk.maxRank) : 1;
      perks[slot] = { perk: perkId, rank: Math.max(1, max) };
    }
    this.setGizmo(kind, i, { ...g, perks: perks.filter(Boolean) });
  }

  setRank(kind: 'weapon' | 'armour', i: number, slot: number, v: unknown): void {
    const g = this.gizmo(kind, i);
    const perks = g.perks.map((p, k) => (k === slot ? { ...p, rank: Math.max(1, Math.round(Number(v) || 1)) } : p));
    this.setGizmo(kind, i, { ...g, perks });
  }

  maxRank(g: Gizmo, perkId: string): number {
    const perk = this.data.perkById().get(perkId);
    return perk ? (g.ancient ? perk.maxRankAncient : perk.maxRank) || 1 : 1;
  }

  ranks(n: number): number[] {
    return Array.from({ length: Math.max(1, n) }, (_, i) => i + 1);
  }

  perkName(id: string): string {
    return this.data.perkById().get(id)?.name ?? id;
  }

  // ---------------------------------------------------------------- relics / talents

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
}

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ruleFor } from '../engine/rules';
import { EngineBuff, EngineEntity } from '../engine/trainer-engine';
import { ACTIONS, Ability, Action, Buff, EntityKind, EquipSlot, Familiar, GearItem, ItemRef, Perk, Prayer, RotationStep, SPEC_KEY, SPELLBOOK_NAMES, SetEffect, Special, Spell, Style, Weapon, WeaponSpec, entityKey, scrollSpecial, weaponSlot } from './models';

/** Anything that can sit in a rotation / get a keybind, in one shape for lists and tooltips. */
export interface Entity {
  key: string;
  kind: EntityKind;
  id: string;
  name: string;
  icon: string;
  /** group label for catalogs: style, "Prayers", "Curses", "Special", "Weapons", "Specs", "Actions", spellbook names */
  group: string;
  ability?: Ability;
  prayer?: Prayer;
  /** combat spell (spells.json) – "spell:<id>" */
  spell?: Spell;
  special?: Special;
  /** weapon item (weapons.json) – a rotation step "weapon:<id>" wields it */
  weapon?: Weapon;
  spec?: WeaponSpec;
  action?: Action;
}

/** One item instance (worn or in the backpack) with everything the gear panel and its tooltip show. */
export interface GearView {
  ref: ItemRef;
  name: string;
  icon: string | null;
  /** slot it is worn in, null for potions */
  slot: EquipSlot | null;
  tier: number;
  style: Style | 'Hybrid' | null;
  /** can hold Invention gizmos (2 for a two-handed weapon) */
  gizmoSlots: number;
  /** armour set it belongs to */
  set: SetEffect | null;
  /** passive effect (set-effects.json, kind "item") */
  passive: SetEffect | null;
  weapon?: Weapon;
  gear?: GearItem;
  special?: Special;
  /** weapon: its special attack */
  spec?: WeaponSpec;
  /** entity key for the engine ("weapon:…", "special:…"), null for plain gear */
  entityKey: string | null;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  readonly abilities = signal<Ability[]>([]);
  readonly buffs = signal<Buff[]>([]);
  readonly prayers = signal<Prayer[]>([]);
  /** potions and bombs (specials.json) plus the familiar scrolls (familiars.json, kind "scroll") */
  readonly specials = signal<Special[]>([]);
  /** combat familiars (familiars.json) */
  readonly familiars = signal<Familiar[]>([]);
  /** combat spells of the three spellbooks (spells.json) */
  readonly spells = signal<Spell[]>([]);
  readonly weapons = signal<Weapon[]>([]);
  readonly specs = signal<WeaponSpec[]>([]);
  readonly perks = signal<Perk[]>([]);
  readonly setEffects = signal<SetEffect[]>([]);
  /** every wearable non-weapon item (gear.json) */
  readonly gear = signal<GearItem[]>([]);
  /** PvME emoji alias → entity key ("deathskulls" → "ability:death-skulls", "omniguard" → "gear:omni-guard") */
  readonly pvmeAliases = signal<Record<string, string>>({});
  readonly loaded = signal(false);

  readonly buffById = computed(() => new Map(this.buffs().map((b) => [b.id, b])));
  readonly weaponById = computed(() => new Map(this.weapons().map((w) => [w.id, w])));
  readonly specById = computed(() => new Map(this.specs().map((s) => [s.id, s])));
  readonly perkById = computed(() => new Map(this.perks().map((p) => [p.id, p])));
  readonly setEffectById = computed(() => new Map(this.setEffects().map((s) => [s.id, s])));
  readonly gearById = computed(() => new Map(this.gear().map((g) => [g.id, g])));
  readonly specialById = computed(() => new Map(this.specials().map((s) => [s.id, s])));
  readonly familiarById = computed(() => new Map(this.familiars().map((f) => [f.id, f])));
  readonly spellById = computed(() => new Map(this.spells().map((s) => [s.id, s])));
  readonly entities = computed<Entity[]>(() => [
    ...this.abilities().map<Entity>((a) => ({ key: entityKey('ability', a.id), kind: 'ability', id: a.id, name: a.name, icon: a.icon, group: a.style, ability: a })),
    ...this.prayers().map<Entity>((p) => ({ key: entityKey('prayer', p.id), kind: 'prayer', id: p.id, name: p.name, icon: p.icon, group: p.book, prayer: p })),
    ...this.specials().map<Entity>((s) => ({ key: entityKey('special', s.id), kind: 'special', id: s.id, name: s.name, icon: s.icon, group: 'Special', special: s })),
    ...this.spells().map<Entity>((s) => ({ key: entityKey('spell', s.id), kind: 'spell', id: s.id, name: s.name, icon: s.icon, group: SPELLBOOK_NAMES[s.book], spell: s })),
    ...this.weapons().map<Entity>((w) => ({ key: entityKey('weapon', w.id), kind: 'weapon', id: w.id, name: w.name, icon: w.icon ?? '', group: 'Weapons', weapon: w })),
    ...this.specs().map<Entity>((s) => ({ key: entityKey('spec', s.id), kind: 'spec', id: s.id, name: s.name, icon: s.weaponIcons[0] ?? 'assets/abilities/weapon-special-attack.png', group: 'Specs', spec: s })),
    ...ACTIONS.map<Entity>((a) => ({ key: entityKey('action', a.id), kind: 'action', id: a.id, name: a.name, icon: a.icon, group: 'Actions', action: a })),
  ]);
  readonly byKey = computed(() => new Map(this.entities().map((e) => [e.key, e])));

  constructor() {
    forkJoin({
      abilities: this.http.get<Ability[]>('data/abilities.json'),
      buffs: this.http.get<Buff[]>('data/buffs.json'),
      prayers: this.http.get<Prayer[]>('data/prayers.json'),
      specials: this.http.get<Special[]>('data/specials.json'),
      spells: this.http.get<Spell[]>('data/spells.json'),
      weapons: this.http.get<Weapon[]>('data/weapons.json'),
      specs: this.http.get<WeaponSpec[]>('data/specs.json'),
      perks: this.http.get<Perk[]>('data/perks.json'),
      setEffects: this.http.get<SetEffect[]>('data/set-effects.json'),
      aliases: this.http.get<Record<string, string>>('data/pvme-aliases.json'),
      gear: this.http.get<GearItem[]>('data/gear.json'),
      familiars: this.http.get<Familiar[]>('data/familiars.json'),
    }).subscribe({
      next: (d) => {
        this.abilities.set(d.abilities);
        this.buffs.set(d.buffs);
        this.prayers.set(d.prayers);
        this.specials.set([...d.specials, ...d.familiars.map(scrollSpecial)]);
        this.familiars.set(d.familiars);
        this.spells.set(d.spells);
        this.weapons.set(d.weapons);
        this.specs.set(d.specs);
        this.perks.set(d.perks);
        this.setEffects.set(d.setEffects);
        this.pvmeAliases.set(d.aliases);
        this.gear.set(d.gear);
        this.loaded.set(true);
      },
      error: (err) => console.error('data files failed to load', err),
    });
  }

  get(key: string): Entity | undefined {
    return this.byKey().get(key);
  }

  /** Slot an item goes into; null = cannot be worn (potions, unknown ids). */
  slotOf(ref: Pick<ItemRef, 'kind' | 'id'>): EquipSlot | null {
    if (ref.kind === 'weapon') {
      const w = this.weaponById().get(ref.id);
      return w ? weaponSlot(w) : null;
    }
    if (ref.kind === 'gear') return this.gearById().get(ref.id)?.slot ?? null;
    return null;
  }

  /** Everything the gear panel shows for an item ref; null when the id left the data files. */
  view(ref: ItemRef): GearView | null {
    if (ref.kind === 'weapon') {
      const w = this.weaponById().get(ref.id);
      if (!w) return null;
      const passive = this.setEffectById().get(w.id);
      const spec = w.spec ? this.specById().get(w.spec) : undefined;
      return {
        ref,
        name: w.name,
        icon: w.icon,
        slot: weaponSlot(w),
        tier: w.tier,
        style: w.style,
        gizmoSlots: w.slot === '2h' ? 2 : 1,
        set: null,
        passive: passive?.kind === 'item' ? passive : null,
        weapon: w,
        spec,
        entityKey: entityKey('weapon', w.id),
      };
    }
    if (ref.kind === 'gear') {
      const g = this.gearById().get(ref.id);
      if (!g) return null;
      return {
        ref,
        name: g.name,
        icon: g.icon,
        slot: g.slot,
        tier: g.tier,
        style: g.style,
        gizmoSlots: g.augmentable && (g.slot === 'body' || g.slot === 'legs') ? 1 : 0,
        set: g.set ? this.setEffectById().get(g.set) ?? null : null,
        passive: g.passive ? this.setEffectById().get(g.passive) ?? null : null,
        gear: g,
        entityKey: null,
      };
    }
    const sp = this.specialById().get(ref.id);
    if (!sp) return null;
    return { ref, name: sp.name, icon: sp.icon, slot: null, tier: 0, style: null, gizmoSlots: 0, set: null, passive: null, special: sp, entityKey: entityKey('special', sp.id) };
  }

  /** Entity of a rotation step; undefined for notes and for things that left the game. */
  step(step: RotationStep): Entity | undefined {
    if (step.kind === 'note') return undefined;
    return this.byKey().get(entityKey(step.kind, step.id));
  }

  name(key: string): string {
    return this.byKey().get(key)?.name ?? key;
  }

  /** Buff icon for a rule buff id (via the wiki buff id in rules-buffs) or a wiki buff id. */
  buffIcon(wikiId: number | undefined): string | null {
    if (wikiId === undefined) return null;
    const b = this.buffById().get(wikiId);
    return b?.iconSelf ?? b?.iconTarget ?? null;
  }

  /**
   * Resolves a PvME alias to rotation steps. Gear aliases ("omniguard") become "wield that weapon" +
   * its special attack; "spec" alone is the generic special-attack slot.
   */
  resolvePvmeAlias(alias: string): RotationStep[] | null {
    const key = this.pvmeAliases()[alias];
    if (!key) return null;
    // "note:<text>": a known token that is no input (overloads, weapon poison – set on the Loadout page)
    if (key.startsWith('note:')) return [{ kind: 'note', id: '', note: key.slice(5) }];
    if (key.startsWith('gear:')) {
      const w = this.weaponById().get(key.slice(5));
      if (!w) return null;
      const steps: RotationStep[] = [{ kind: 'weapon', id: w.id }];
      if (w.spec) steps.push({ kind: 'spec', id: w.spec });
      return steps;
    }
    if (key === 'action:weapon-special-attack') return [{ kind: 'ability', id: 'weapon-special-attack' }];
    if (key.startsWith('note:')) return [{ kind: 'note', id: '', note: key.slice(5) }]; // familiar pouches: "summon Ripper Demon"
    const e = this.byKey().get(key);
    return e ? [{ kind: e.kind, id: e.id }] : null;
  }

  private dataBuffs(ids: number[], durationTicks: number | null): EngineBuff[] {
    return ids
      .map((id) => this.buffById().get(id))
      .filter((b): b is Buff => !!b)
      .map<EngineBuff>((b) => ({
        id: 'buff:' + b.id,
        name: b.name,
        kind: b.kind,
        on: b.kind === 'Debuff' && b.iconTarget ? 'target' : b.iconTarget && !b.iconSelf ? 'target' : 'self',
        icon: b.iconSelf ?? b.iconTarget,
        durationTicks: durationTicks ?? b.durationTicks ?? GCD_DEFAULT_BUFF_TICKS,
      }));
  }

  /** Engine view of an entity: numbers the simulation needs. */
  toEngineEntity(e: Entity): EngineEntity {
    if (e.ability) {
      const a = e.ability;
      const rule = ruleFor(a.id);
      return {
        key: e.key,
        kind: 'ability',
        id: a.id,
        name: a.name,
        icon: a.icon,
        gcd: (a.triggersGcd || !!rule?.offGcdNoGain) && !rule?.offGcd, // Bladed Dive / Provoke: a normal basic outside the GCD
        style: a.style,
        abilityType: a.type,
        adrenaline: a.adrenaline ?? 0,
        cooldownTicks: a.cooldownTicks ?? 0,
        buffs: this.dataBuffs(a.buffs, a.durationTicks),
        damageMin: a.damageMin ?? undefined,
        damageMax: a.damageMax ?? undefined,
        durationTicks: a.durationTicks ?? undefined,
      };
    }
    if (e.prayer) {
      const p = e.prayer;
      return { key: e.key, kind: 'prayer', id: p.id, name: p.name, icon: p.icon, gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
    }
    if (e.weapon) {
      const w = e.weapon;
      return {
        key: e.key,
        kind: 'weapon',
        id: w.id,
        name: w.name,
        icon: e.icon,
        gcd: false,
        adrenaline: 0,
        cooldownTicks: 0,
        buffs: [],
        weapon: { id: w.id, slot: w.slot === '2h' ? '2h' : w.slot === 'main' ? 'main' : 'off', style: w.style },
      };
    }
    if (e.spec) return this.specEntity(e.spec);
    if (e.spell) {
      const s = e.spell;
      return { key: e.key, kind: 'spell', id: s.id, name: s.name, icon: s.icon, gcd: s.gcd, adrenaline: 0, cooldownTicks: s.cooldownTicks, buffs: [], durationTicks: s.durationTicks ?? undefined };
    }
    if (e.action) {
      return { key: e.key, kind: 'action', id: e.id, name: e.name, icon: e.icon, gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
    }
    const s = e.special!;
    return {
      key: e.key,
      kind: 'special',
      id: s.id,
      name: s.name,
      icon: s.icon,
      gcd: false,
      adrenaline: s.adrenaline,
      cooldownTicks: s.cooldownTicks,
      sharedCooldown: s.sharedCooldown || undefined,
      adrenalineOverTime: s.adrenalineOverTime > 0 ? { amount: s.adrenalineOverTime, ticks: s.overTimeTicks } : undefined,
      buffs: s.debuff ? [{ id: e.key, name: s.debuff.name, kind: 'Debuff', on: 'target', icon: s.debuff.icon, durationTicks: s.debuff.durationTicks }] : [],
      scroll: s.kind === 'scroll' && s.familiar ? { familiar: s.familiar, specialPoints: s.specialPoints ?? 0 } : undefined,
    };
  }

  /** Engine view of a weapon special attack (Weapon Special Attack / Essence of Finality steps and "spec:<id>" steps). */
  specEntity(spec: WeaponSpec): EngineEntity {
    const hits = spec.damageMin !== null ? [0] : undefined;
    return {
      key: 'spec:' + spec.id,
      kind: 'spec',
      id: spec.id,
      name: spec.name,
      icon: spec.weaponIcons[0] ?? 'assets/abilities/weapon-special-attack.png',
      gcd: !spec.ignoresGcd,
      style: spec.style,
      abilityType: 'Special',
      adrenaline: -(spec.adrenaline ?? 0),
      cooldownTicks: spec.cooldownTicks,
      buffs: this.dataBuffs(spec.buffs.map((b) => b.id).filter((id) => id >= 0), spec.durationTicks),
      damageMin: spec.damageMin ?? undefined,
      damageMax: spec.damageMax ?? undefined,
      hits,
      channel: spec.channelled ? { ticks: 3, hits: [1, 2, 3] } : undefined,
    };
  }
}

export { SPEC_KEY };

/** Buffs whose duration the wiki does not state get shown for one GCD. */
const GCD_DEFAULT_BUFF_TICKS = 3;

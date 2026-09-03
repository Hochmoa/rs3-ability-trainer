import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { EngineBuff, EngineEntity } from '../engine/trainer-engine';
import { ACTIONS, Ability, Action, Buff, EntityKind, Prayer, RotationStep, SPEC_KEY, Spec, Special, Weapon, entityKey, isStyle4 } from './models';

/** Anything that can sit in a rotation / get a keybind, in one shape for lists and tooltips. */
export interface Entity {
  key: string;
  kind: EntityKind;
  id: string;
  name: string;
  icon: string;
  /** group label for catalogs: style, "Prayers", "Curses", "Special", "Weapons", "Specs", "Actions" */
  group: string;
  ability?: Ability;
  prayer?: Prayer;
  special?: Special;
  weapon?: Weapon;
  spec?: Spec;
  action?: Action;
}

/** A weapon from the wiki special-attack table (Omni guard, ...): used to resolve PvME gear aliases. */
interface Gear {
  id: string;
  name: string;
  icon: string;
  specId: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  readonly abilities = signal<Ability[]>([]);
  readonly buffs = signal<Buff[]>([]);
  readonly prayers = signal<Prayer[]>([]);
  readonly specials = signal<Special[]>([]);
  readonly weapons = signal<Weapon[]>([]);
  readonly specs = signal<Spec[]>([]);
  readonly gear = signal<Gear[]>([]);
  /** PvME emoji alias → entity key ("deathskulls" → "ability:death-skulls", "omniguard" → "gear:omni-guard") */
  readonly pvmeAliases = signal<Record<string, string>>({});
  readonly loaded = signal(false);

  readonly buffById = computed(() => new Map(this.buffs().map((b) => [b.id, b])));
  readonly specById = computed(() => new Map(this.specs().map((s) => [s.id, s])));
  readonly entities = computed<Entity[]>(() => [
    ...this.abilities().map<Entity>((a) => ({ key: entityKey('ability', a.id), kind: 'ability', id: a.id, name: a.name, icon: a.icon, group: a.style, ability: a })),
    ...this.prayers().map<Entity>((p) => ({ key: entityKey('prayer', p.id), kind: 'prayer', id: p.id, name: p.name, icon: p.icon, group: p.book, prayer: p })),
    ...this.specials().map<Entity>((s) => ({ key: entityKey('special', s.id), kind: 'special', id: s.id, name: s.name, icon: s.icon, group: 'Special', special: s })),
    ...this.weapons().map<Entity>((w) => ({ key: entityKey('weapon', w.id), kind: 'weapon', id: w.id, name: w.name, icon: w.icon, group: 'Weapons', weapon: w })),
    ...this.specs().map<Entity>((s) => ({ key: entityKey('spec', s.id), kind: 'spec', id: s.id, name: s.name, icon: s.icon, group: 'Specs', spec: s })),
    ...ACTIONS.map<Entity>((a) => ({ key: entityKey('action', a.id), kind: 'action', id: a.id, name: a.name, icon: a.icon, group: 'Actions', action: a })),
  ]);
  readonly byKey = computed(() => new Map(this.entities().map((e) => [e.key, e])));

  constructor() {
    forkJoin({
      abilities: this.http.get<Ability[]>('data/abilities.json'),
      buffs: this.http.get<Buff[]>('data/buffs.json'),
      prayers: this.http.get<Prayer[]>('data/prayers.json'),
      specials: this.http.get<Special[]>('data/specials.json'),
      weapons: this.http.get<Weapon[]>('data/weapons.json'),
      specs: this.http.get<Spec[]>('data/specs.json'),
      gear: this.http.get<Gear[]>('data/gear.json'),
      aliases: this.http.get<Record<string, string>>('data/pvme-aliases.json'),
    }).subscribe({
      next: (d) => {
        this.abilities.set(d.abilities);
        this.buffs.set(d.buffs);
        this.prayers.set(d.prayers);
        this.specials.set(d.specials);
        this.weapons.set(d.weapons);
        this.specs.set(d.specs);
        this.gear.set(d.gear);
        this.pvmeAliases.set(d.aliases);
        this.loaded.set(true);
      },
      error: (err) => console.error('data files failed to load', err),
    });
  }

  get(key: string): Entity | undefined {
    return this.byKey().get(key);
  }

  /** Entity of a rotation step; undefined for notes and for things that left the game. */
  step(step: RotationStep): Entity | undefined {
    if (step.kind === 'note') return undefined;
    return this.byKey().get(entityKey(step.kind, step.id));
  }

  name(key: string): string {
    return this.byKey().get(key)?.name ?? key;
  }

  /**
   * Resolves a PvME alias to rotation steps. Gear aliases ("omniguard") become "switch to that
   * weapon's style" + the weapon's special attack; "spec" alone is the generic special-attack slot.
   */
  resolvePvmeAlias(alias: string): RotationStep[] | null {
    const key = this.pvmeAliases()[alias];
    if (!key) return null;
    if (key.startsWith('gear:')) {
      const g = this.gear().find((x) => x.id === key.slice(5));
      const spec = g && this.specById().get(g.specId);
      if (!spec) return null;
      const steps: RotationStep[] = [];
      if (isStyle4(spec.style)) steps.push({ kind: 'weapon', id: spec.style.toLowerCase() });
      steps.push({ kind: 'spec', id: spec.id });
      return steps;
    }
    if (key === 'action:weapon-special-attack') return [{ kind: 'ability', id: 'weapon-special-attack' }];
    const e = this.byKey().get(key);
    return e ? [{ kind: e.kind, id: e.id }] : null;
  }

  /** Engine view of an entity: numbers the simulation needs. */
  toEngineEntity(e: Entity): EngineEntity {
    if (e.ability) {
      const a = e.ability;
      return {
        key: e.key,
        kind: 'ability',
        name: a.name,
        icon: a.icon,
        gcd: a.triggersGcd,
        abilityType: a.type,
        style: a.style,
        equipment: a.equipment,
        adrenaline: a.adrenaline ?? 0,
        cooldownTicks: a.cooldownTicks ?? 0,
        buffs: a.buffs
          .map((id) => this.buffById().get(id))
          .filter((b): b is Buff => !!b)
          .map<EngineBuff>((b) => ({
            id: 'buff:' + b.id,
            name: b.name,
            kind: b.kind,
            on: b.kind === 'Debuff' && b.iconTarget ? 'target' : b.iconTarget && !b.iconSelf ? 'target' : 'self',
            icon: b.iconSelf ?? b.iconTarget,
            durationTicks: a.durationTicks ?? b.durationTicks ?? GCD_DEFAULT_BUFF_TICKS,
          })),
      };
    }
    if (e.prayer) {
      const p = e.prayer;
      return {
        key: e.key,
        kind: 'prayer',
        name: p.name,
        icon: p.icon,
        gcd: false,
        adrenaline: 0,
        cooldownTicks: 0,
        buffs: [{ id: e.key, name: p.name, kind: 'Buff', on: 'self', icon: p.icon, durationTicks: null }],
      };
    }
    if (e.weapon) {
      return { key: e.key, kind: 'weapon', name: e.name, icon: e.icon, gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], weapon: { style: e.weapon.style } };
    }
    if (e.spec) {
      const s = e.spec;
      return {
        key: e.key,
        kind: 'spec',
        name: s.name,
        icon: s.icon,
        gcd: true,
        abilityType: 'Special',
        style: s.style,
        adrenaline: s.adrenaline ?? 0,
        cooldownTicks: s.cooldownTicks ?? 0,
        buffs: [],
      };
    }
    if (e.action) {
      return { key: e.key, kind: 'action', name: e.name, icon: e.icon, gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [] };
    }
    const s = e.special!;
    return {
      key: e.key,
      kind: 'special',
      name: s.name,
      icon: s.icon,
      gcd: false,
      adrenaline: s.adrenaline,
      cooldownTicks: s.cooldownTicks,
      sharedCooldown: s.sharedCooldown || undefined,
      adrenalineOverTime: s.adrenalineOverTime > 0 ? { amount: s.adrenalineOverTime, ticks: s.overTimeTicks } : undefined,
      buffs: s.debuff ? [{ id: e.key, name: s.debuff.name, kind: 'Debuff', on: 'target', icon: s.debuff.icon, durationTicks: s.debuff.durationTicks }] : [],
    };
  }
}

export { SPEC_KEY };

/** Buffs whose duration the wiki does not state get shown for one GCD. */
const GCD_DEFAULT_BUFF_TICKS = 3;

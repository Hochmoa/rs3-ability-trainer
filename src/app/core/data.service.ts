import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { EngineBuff, EngineEntity } from '../engine/trainer-engine';
import { Ability, Buff, EntityKind, Prayer, RotationStep, Special, Weapon, entityKey } from './models';

/** Anything that can sit in a rotation / get a keybind, in one shape for lists and tooltips. */
export interface Entity {
  key: string;
  kind: EntityKind;
  id: string;
  name: string;
  icon: string;
  /** group label for catalogs: style, "Prayers", "Curses", "Special", "Weapons" */
  group: string;
  ability?: Ability;
  prayer?: Prayer;
  special?: Special;
  weapon?: Weapon;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  readonly abilities = signal<Ability[]>([]);
  readonly buffs = signal<Buff[]>([]);
  readonly prayers = signal<Prayer[]>([]);
  readonly specials = signal<Special[]>([]);
  readonly weapons = signal<Weapon[]>([]);
  readonly loaded = signal(false);

  readonly buffById = computed(() => new Map(this.buffs().map((b) => [b.id, b])));
  readonly entities = computed<Entity[]>(() => [
    ...this.abilities().map<Entity>((a) => ({ key: entityKey('ability', a.id), kind: 'ability', id: a.id, name: a.name, icon: a.icon, group: a.style, ability: a })),
    ...this.prayers().map<Entity>((p) => ({ key: entityKey('prayer', p.id), kind: 'prayer', id: p.id, name: p.name, icon: p.icon, group: p.book, prayer: p })),
    ...this.specials().map<Entity>((s) => ({ key: entityKey('special', s.id), kind: 'special', id: s.id, name: s.name, icon: s.icon, group: 'Special', special: s })),
    ...this.weapons().map<Entity>((w) => ({ key: entityKey('weapon', w.id), kind: 'weapon', id: w.id, name: w.name, icon: w.icon, group: 'Weapons', weapon: w })),
  ]);
  readonly byKey = computed(() => new Map(this.entities().map((e) => [e.key, e])));

  constructor() {
    forkJoin({
      abilities: this.http.get<Ability[]>('data/abilities.json'),
      buffs: this.http.get<Buff[]>('data/buffs.json'),
      prayers: this.http.get<Prayer[]>('data/prayers.json'),
      specials: this.http.get<Special[]>('data/specials.json'),
      weapons: this.http.get<Weapon[]>('data/weapons.json'),
    }).subscribe({
      next: (d) => {
        this.abilities.set(d.abilities);
        this.buffs.set(d.buffs);
        this.prayers.set(d.prayers);
        this.specials.set(d.specials);
        this.weapons.set(d.weapons);
        this.loaded.set(true);
      },
      error: (err) => console.error('data files failed to load', err),
    });
  }

  get(key: string): Entity | undefined {
    return this.byKey().get(key);
  }

  step(step: RotationStep): Entity | undefined {
    return this.byKey().get(entityKey(step.kind, step.id));
  }

  name(key: string): string {
    return this.byKey().get(key)?.name ?? key;
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
    const s = e.special!;
    return {
      key: e.key,
      kind: 'special',
      name: s.name,
      icon: s.icon,
      gcd: false,
      adrenaline: s.adrenaline,
      cooldownTicks: s.cooldownTicks,
      sharedCooldown: s.sharedCooldown,
      adrenalineOverTime: s.adrenalineOverTime > 0 ? { amount: s.adrenalineOverTime, ticks: s.overTimeTicks } : undefined,
      buffs: [],
    };
  }
}

/** Buffs whose duration the wiki does not state get shown for one GCD. */
const GCD_DEFAULT_BUFF_TICKS = 3;

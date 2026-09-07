/**
 * Weapon switches a PvME rotation leaves out. The guides write "grico" in a melee rotation or "hurricane" with dual
 * wield and expect the reader to switch weapons – the switch is a picture in the gear section, never a step. The preset
 * import walks the steps with the weapons in hand and, when an ability needs another combat style, a two-handed weapon,
 * or the special attack of a weapon in the backpack, puts the switch to that backpack weapon in front of it (hint
 * "switch added"). Rotations without the weapon stay as they are and stop at the stuck marker.
 */
import { ruleFor } from '../engine/rules';
import { ItemRef, Loadout, RotationStep, Style, Weapon, WeaponSpec, isStyle4 } from './models';

export interface SwitchCatalog {
  weapon(id: string): Weapon | undefined;
  spec(id: string): WeaponSpec | undefined;
  /** style and GCD flag of an ability (off-GCD utility like Surge works with any weapon) */
  ability(id: string): { style: Style; gcd: boolean } | undefined;
}

export const SWITCH_HINT = 'switch added';

interface Hand {
  main: Weapon | null;
  off: Weapon | null;
  two: Weapon | null;
}

function styleOf(h: Hand): Style | null {
  return h.two?.style ?? h.main?.style ?? h.off?.style ?? null;
}

function wields(h: Hand, id: string): boolean {
  return h.two?.id === id || h.main?.id === id || h.off?.id === id;
}

function take(h: Hand, w: Weapon): void {
  if (w.slot === '2h') {
    h.two = w;
    h.main = null;
    h.off = null;
  } else if (w.slot === 'main') {
    h.main = w;
    h.two = null;
  } else {
    h.off = w;
    h.two = null;
  }
}

function needs2h(abilityId: string): boolean {
  return !!ruleFor(abilityId)?.requires?.some((r) => r.equipment === '2h');
}

/** the weapons a switch can pick from: the backpack, then the ones in hand at the start (in the backpack once switched out) */
function backpack(l: Loadout, cat: SwitchCatalog): Weapon[] {
  const refs = [...(l.inventory ?? []), l.equipment?.twoHand, l.equipment?.mainHand, l.equipment?.offHand];
  const out: Weapon[] = [];
  for (const r of refs) {
    if (!r || r.kind !== 'weapon') continue;
    const w = cat.weapon(r.id);
    if (w && w.slot !== 'shield' && !out.some((x) => x.id === w.id)) out.push(w);
  }
  return out;
}

/** the switch to a set of `style`: a 2h when asked for (or when no pair exists), else main hand + off-hand */
function setFor(pool: Weapon[], style: Style, twoHanded: boolean): Weapon[] {
  const two = pool.find((w) => w.style === style && w.slot === '2h');
  const main = pool.find((w) => w.style === style && w.slot === 'main');
  const off = pool.find((w) => w.style === style && w.slot === 'off');
  if (twoHanded) return two ? [two] : [];
  if (main && off) return [main, off];
  if (two) return [two];
  return main ? [main] : off ? [off] : [];
}

export function insertSwitches(steps: RotationStep[], loadout: Loadout, cat: SwitchCatalog): RotationStep[] {
  const eq = loadout.equipment ?? {};
  const hand: Hand = {
    main: eq.mainHand?.kind === 'weapon' ? cat.weapon(eq.mainHand.id) ?? null : null,
    off: eq.offHand?.kind === 'weapon' ? cat.weapon(eq.offHand.id) ?? null : null,
    two: eq.twoHand?.kind === 'weapon' ? cat.weapon(eq.twoHand.id) ?? null : null,
  };
  const pool = backpack(loadout, cat);
  // specials stored in the Essence of Finality amulets fire without their weapon
  const stored = new Set<string>();
  for (const ref of [eq.neck, ...(loadout.inventory ?? [])]) if (ref?.kind === 'gear' && ref.spec) stored.add(ref.spec);
  if (loadout.eofSpec) stored.add(loadout.eofSpec);
  const out: RotationStep[] = [];
  const switchTo = (ws: Weapon[], before: RotationStep): void => {
    let n = 0;
    for (const w of ws) {
      if (wields(hand, w.id)) continue;
      out.push({ kind: 'weapon', id: w.id, hint: SWITCH_HINT, sameTick: n > 0 || !!before.sameTick });
      take(hand, w);
      n++;
    }
  };
  for (const s of steps) {
    if (s.kind === 'weapon') {
      const w = cat.weapon(s.id);
      if (w) take(hand, w);
      out.push(s);
      continue;
    }
    if (s.kind === 'ability' && s.id === 'essence-of-finality') {
      // a bare "eofspec": the amulet in the neck slot fires whatever it stores, so a stored special of the current style
      // works – else switch to the style of a stored special the setup has weapons for
      const styles = [...stored].map((id) => cat.spec(id)?.style).filter((x): x is Style => !!x);
      if (styles.length && !styles.includes(styleOf(hand) as Style)) {
        const target = styles.find((st) => setFor(pool, st, false).length);
        if (target) switchTo(setFor(pool, target, false), s);
      }
    } else if (s.kind === 'ability') {
      const a = cat.ability(s.id);
      const two = needs2h(s.id);
      if (a && a.gcd && isStyle4(a.style)) {
        const current = styleOf(hand);
        if (current !== a.style) switchTo(setFor(pool, a.style, two), s);
        else if (two && !hand.two) switchTo(setFor(pool, a.style, true), s);
      }
    } else if (s.kind === 'spec') {
      const spec = cat.spec(s.id);
      if (spec && stored.has(s.id)) {
        // an Essence of Finality fires its special only with a weapon of the special's style in hand
        if (styleOf(hand) !== spec.style) switchTo(setFor(pool, spec.style, false), s);
      } else if (spec) {
        const own = [hand.two, hand.main, hand.off].some((w) => w && spec.weaponIds.includes(w.id));
        if (!own) {
          const w = pool.find((x) => spec.weaponIds.includes(x.id));
          if (w) switchTo([w], s);
        }
      }
    }
    out.push(s);
  }
  return out;
}

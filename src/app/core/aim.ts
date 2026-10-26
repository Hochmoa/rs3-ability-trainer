import { ruleFor, specialRuleFor } from '../engine/rules';
import { parseEntityKey } from './models';

/**
 * Does this entity need a target click after its key? In game Dive and Bladed Dive arm a crosshair and only fire on
 * the click on a tile; pressing the key alone casts nothing, so the train page asks for the click (one of four tiles
 * lights up). Thrown bombs are NOT aimed here: with a target selected the key throws them at it, which is how PvME
 * rotations ("vulnbomb + bloat") are played (Martin, 26 Oct 2026). Data: `aimed` in the ability rules.
 */
export function needsAim(key: string): boolean {
  const { kind, id } = parseEntityKey(key);
  const rule = kind === 'ability' ? ruleFor(id) : kind === 'special' ? specialRuleFor(id) : undefined;
  return !!rule?.aimed;
}

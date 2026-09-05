/**
 * Rotation steps → what the engine and the queue see. Pure functions, so the mapping of the PvME timing fields
 * (`sameTick`, `offsetTicks`, `cancelAfterTicks`, `afterHits`) onto the engine entity is testable without the page.
 */
import { EngineEntity } from '../engine/trainer-engine';
import { Entity } from './data.service';
import { RotationStep } from './models';

/** A note step shown in the queue like an entity (no key, no engine effect). */
export function noteEntity(step: RotationStep, index: number): Entity {
  return {
    key: 'note:' + index,
    kind: 'action',
    id: 'note-' + index,
    name: step.note ?? '',
    icon: step.phase ? 'assets/actions/phase.png' : 'assets/actions/note.png',
    group: 'Notes',
  };
}

/**
 * The engine entity of one rotation step: the catalog entity (`toEngine`) plus the timing the step carries –
 * "+" (same tick) / "2t" (offset), "asphyx (4t) →" (the channel is cut there) and "7 hit rapid" (continue after the
 * n-th hit). A note becomes an inert entity the engine skips.
 */
export function stepToEngineEntity(step: RotationStep, entity: Entity, toEngine: (e: Entity) => EngineEntity): EngineEntity {
  if (step.kind === 'note') return { key: entity.key, kind: 'action', id: entity.id, name: entity.name, icon: entity.icon, gcd: false, adrenaline: 0, cooldownTicks: 0, buffs: [], isNote: true };
  const ee = { ...toEngine(entity) };
  if (step.offsetTicks !== undefined) ee.offsetTicks = step.offsetTicks;
  else if (step.sameTick) ee.offsetTicks = 0;
  if (step.cancelAfterTicks) ee.cancelAfterTicks = step.cancelAfterTicks;
  if (step.afterHits) ee.afterHits = step.afterHits;
  return ee;
}

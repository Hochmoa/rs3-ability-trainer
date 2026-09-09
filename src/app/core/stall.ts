/**
 * PvME stalls: "smeteorstrike" starts the ability (cost paid, cooldown running) while the player stands out of range,
 * "rmeteorstrike" later releases it in the same tick as the next attack, and only then does its damage land
 * (runescape.wiki/w/Ability_stalling). The parser leaves the words "stall" and "release" in the step hints; this
 * marks the pairs the engine acts on. A stall whose release is not in the list stays a plain cast.
 *
 * The guides put the stall at the end of the pre-build ("War's Retreat") and the release at the start of the fight
 * rotation, so the pair only meets when the rotations play in a row (rotation-pick.ts chainRotations).
 */
import { RotationStep } from './models';

export function markStallRelease(steps: RotationStep[]): void {
  const has = (s: RotationStep, mark: string) => !!s.hint && s.hint.split(', ').includes(mark);
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.kind === 'note' || !has(s, 'stall')) continue;
    const j = steps.findIndex((t, k) => k > i && t.kind === s.kind && t.id === s.id && has(t, 'release'));
    if (j < 0) continue;
    steps[i] = { ...s, stall: true }; // the "stall" / "release" hints stay: the queue shows them on the step
    steps[j] = { ...steps[j], release: true };
  }
}

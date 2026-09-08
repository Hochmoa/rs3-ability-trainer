import { Rotation, StepResult } from './models';

/**
 * Which rotation the Train page selects: the one the URL asks for (`?rotation=<id>`) when it exists, else the one
 * already selected when it still exists, else the first of the list.
 */
export function pickRotation<T extends { id: string }>(rotations: readonly T[], wantedId: string | null | undefined, currentId: string | null | undefined): T | null {
  return rotations.find((r) => r.id === wantedId) ?? rotations.find((r) => r.id === currentId) ?? rotations[0] ?? null;
}

/** The rotations of one setup in order: by `presetIndex` where both have one, else by name (numbers compared as numbers). */
export function setupRotations(rotations: readonly Rotation[], setupId: string): Rotation[] {
  return rotations
    .filter((r) => r.setupId === setupId)
    .sort((a, b) => (a.presetIndex !== undefined && b.presetIndex !== undefined ? a.presetIndex - b.presetIndex : a.name.localeCompare(b.name, undefined, { numeric: true })));
}

/** "Next: Phase 4" – the rotation after `current` in its setup, null when it is the last one. */
export function nextRotation(rotations: readonly Rotation[], current: Rotation | null): Rotation | null {
  if (!current) return null;
  const siblings = setupRotations(rotations, current.setupId);
  const i = siblings.findIndex((r) => r.id === current.id);
  return i >= 0 ? siblings[i + 1] ?? null : null;
}

/** The step of a session that was furthest off the tick (late or early), null when every step was on tick. */
export function worstStep(results: readonly StepResult[]): StepResult | null {
  let worst: StepResult | null = null;
  for (const r of results) {
    if (r.outcome !== 'late' && r.outcome !== 'early') continue;
    if (!worst || Math.abs(r.lateTicks) > Math.abs(worst.lateTicks)) worst = r;
  }
  return worst;
}

import { Rotation, RotationStep, StepResult } from './models';
import { markStallRelease } from './stall';

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

/**
 * One rotation out of `list` played back to back: the steps of the first, then for every further one a note the
 * player has to click ("Next: Phase 2") and its steps. Nothing resets in between, so the adrenaline, the stacks,
 * the conjures and the buffs of one rotation carry into the next, the way a fight goes on into its next phase.
 * The note takes no ticks: the next input is due right after the click.
 */
export function chainRotations(list: readonly Rotation[]): Rotation | null {
  if (!list.length) return null;
  const [first, ...rest] = list;
  if (!rest.length) return first;
  const steps: RotationStep[] = [...first.steps];
  for (const r of rest) steps.push({ kind: 'note', id: '', note: 'Next: ' + r.name, requiresAction: true, actionTicks: 0 }, ...r.steps);
  // a stall at the end of one rotation meets its release at the start of the next only here
  markStallRelease(steps);
  return { ...first, name: first.name + ' and ' + rest.length + ' more', steps };
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

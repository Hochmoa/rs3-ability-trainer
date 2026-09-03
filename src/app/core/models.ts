export type Style = 'Melee' | 'Ranged' | 'Magic' | 'Necromancy' | 'Defence' | 'Constitution';
/** "Enhanced" is the wiki's type for channelled abilities (Assault, Snipe, Asphyxiate, ...) */
export type AbilityType = 'Basic' | 'Enhanced' | 'Threshold' | 'Ultimate' | 'Special';

export const STYLES: Style[] = ['Melee', 'Ranged', 'Magic', 'Necromancy', 'Defence', 'Constitution'];

export interface Ability {
  id: string;
  name: string;
  style: Style;
  type: AbilityType;
  level: number;
  icon: string;
  /** false for abilities usable during / not starting the global cooldown (Surge, Escape, ...) – queueing them is a later feature */
  triggersGcd: boolean;
}

export interface Keybind {
  /** KeyboardEvent.code, e.g. "KeyQ", "Digit1", "Numpad5" */
  code: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

export interface Rotation {
  id: string;
  name: string;
  /** ability ids in order */
  steps: string[];
  updatedAt: number;
}

export interface Settings {
  pingMs: number;
  jitterMs: number;
  /** in-game "Ability queueing": on = a press during the GCD is queued and casts when the GCD ends; off = ignored */
  abilityQueueing: boolean;
  loop: boolean;
}

export const DEFAULT_SETTINGS: Settings = { pingMs: 60, jitterMs: 20, abilityQueueing: false, loop: false };

export interface StepResult {
  step: number;
  abilityId: string;
  outcome: 'perfect' | 'late';
  lateTicks: number;
  /** perfect: ms the input arrived before the GCD ended; late: ms after */
  offsetMs: number;
  tooEarly: number;
  wrong: number;
  firedAtTick: number;
}

export interface Session {
  id?: number;
  rotationId: string;
  rotationName: string;
  startedAt: number;
  endedAt: number;
  settings: Settings;
  results: StepResult[];
}

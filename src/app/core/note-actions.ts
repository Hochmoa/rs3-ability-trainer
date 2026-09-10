/**
 * Notes a player has to act on with the mouse: "enter instance", "run md", "click crystal", "tag pillar". The queue
 * stops on such a note and shows it as a button; the rotation goes on when it is pressed (RotationStep.requiresAction).
 *
 * The PvME guides write these as plain prose between the abilities, so the import cannot tell them from a remark
 * like "improvise" or "4 autos" without a word list. The list comes from the 1025 distinct notes in the guide
 * rotations (Sept 2026): a note that starts with a movement or interaction verb, or that says "click" anywhere, asks
 * for a click. Everything else stays a plain note the queue skips.
 */
import { RotationStep } from './models';

const VERB =
  /^(?:\(|(?:in|out|base|free)\s+role:?\s*|[a-z]+ role:?\s*)*(?:quick-?enter|enter|rejoin|run|walk|move|step|click|destroy|start(?: the)? fight|tag|equip|jump|climb|leave|exit|loot|tele(?:port)?|dismiss|go|pick ?up|target|open|pull|interact|surge to|dive to|bd to|escape to)\b/;

/** "enter instance", "(click crystal)", "out role: click", "run md", but not "improvise", "4 autos", "start with 2 stacks" */
export function isPlayerAction(note: string): boolean {
  const n = note.trim().toLowerCase();
  if (!n) return false;
  return VERB.test(n) || /\bclick\b/.test(n);
}

/** notes that are a client action the trainer knows, written before its alias existed: "Time warp" is Kerapac's button */
const NOTE_ACTIONS: [RegExp, string][] = [[/^time\s*-?\s*warp$/i, 'time-warp']];

/**
 * The step with `requiresAction` set when its note asks for a click; a note that names a client action becomes that
 * action; phase headings and inputs come back as they are.
 */
export function markPlayerAction<T extends RotationStep>(step: T): T {
  if (step.kind !== 'note') return step;
  const note = (step.note ?? '').trim();
  // the parser writes boss mechanics as headings; one of them is a button the trainer can press
  for (const [re, id] of NOTE_ACTIONS) if (re.test(note)) return { ...step, kind: 'action', id, note: undefined, phase: undefined, requiresAction: undefined } as T;
  if (step.phase || step.requiresAction || !isPlayerAction(note)) return step;
  return { ...step, requiresAction: true };
}

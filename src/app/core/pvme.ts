import { RotationStep } from './models';

/**
 * Parser for rotations written in PvME notation (https://pvme.io style guide, "Rotations"):
 *   →  separates ticks / GCDs            +  joins same-tick actions
 *   (tc) target cycle   (auto) basic attack   (2t) or "2t x": x comes 2 ticks after the previous action
 *   <weapon> spec / eofspec  weapon special attack     :alias: / <:alias:id>  Discord emoji aliases
 * Anything that is not a known alias (phase headings, "improv", "run to the edge") becomes a note step.
 */

/** What an alias expands to: one or more steps (a weapon special is "switch weapon" + "spec"). */
export type AliasResolver = (alias: string) => RotationStep[] | null;

export interface PvmeParseResult {
  steps: RotationStep[];
  /** tokens that were not recognised and became notes */
  unknown: string[];
}

const ARROWS = /\s*(?:→|⟶|->|=>|>>)\s*/g;
const EMOJI = /<a?:([A-Za-z0-9_]+):\d+>/g;
const COLON_ALIAS = /:([A-Za-z0-9_]+):/g;
const TICK_PREFIX = /^\(?\s*(\d+)\s*t\s*\)?\s+/i;
const HEADING = /^(#+\s*|\*\*|__|-\s*\*\*)?\s*(phase|p\d|part|start|opening|note|notes)\b/i;
/** parenthesised annotations that are not inputs */
const ANNOTATION = /\(\s*(dw|2h|shield|\d+\s*hits?|0\s*tick|autocast\w*|mobile)\s*\)/gi;

export function normalizeAlias(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parsePvme(text: string, resolve: AliasResolver): PvmeParseResult {
  const steps: RotationStep[] = [];
  const unknown: string[] = [];
  let pendingOffset: number | undefined;

  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.replace(EMOJI, '$1').replace(COLON_ALIAS, '$1').trim();
    if (!line) continue;
    line = line.replace(/^[-*•]\s+/, '');
    if (HEADING.test(line) && !ARROWS.test(line)) {
      ARROWS.lastIndex = 0;
      steps.push({ kind: 'note', id: '', note: line.replace(/^[#*_\s-]+|[*_\s]+$/g, ''), phase: true });
      continue;
    }
    ARROWS.lastIndex = 0;
    const groups = line.split(ARROWS);
    for (const group of groups) {
      const actions = group.split(/\s+\+\s+|\+/).map((a) => a.trim()).filter(Boolean);
      let first = true;
      for (let action of actions) {
        let offset: number | undefined;
        const m = TICK_PREFIX.exec(action);
        if (m) {
          offset = parseInt(m[1], 10);
          action = action.slice(m[0].length).trim();
        }
        // "(2t)" alone = wait, attach to the next action of this line
        const wait = /^\(\s*(\d+)\s*t\s*\)$/i.exec(action);
        if (wait) {
          offset = parseInt(wait[1], 10);
          action = '';
        }
        const annotations: string[] = [];
        action = action.replace(ANNOTATION, (_, a: string) => {
          annotations.push(a);
          return ' ';
        }).trim();
        // "(tc)" / "(auto)" are inputs written in parentheses, possibly in front of another action: "(tc) bloat"
        const lead = /^\(\s*(tc|auto)\s*\)\s*/i.exec(action);
        if (lead) {
          const inputs = resolve(lead[1].toLowerCase());
          if (inputs) {
            for (const s of inputs) steps.push({ ...s, sameTick: !first || undefined });
            first = false;
          }
          action = action.slice(lead[0].length).trim();
        }
        if (!action) {
          if (offset !== undefined) pendingOffset = offset;
          continue;
        }
        const sameTick = !first;
        first = false;
        const resolved = resolveAction(action, resolve);
        const off = offset ?? pendingOffset;
        pendingOffset = undefined;
        if (resolved) {
          resolved.forEach((s, i) => {
            const step: RotationStep = { ...s };
            if (sameTick || i > 0) step.sameTick = true; // the UI hides the flag on GCD casts, the engine scores companions only
            if (off !== undefined && i === 0) step.offsetTicks = off;
            if (annotations.length && i === resolved.length - 1) step.hint = annotations.join(', ');
            steps.push(step);
          });
        } else {
          unknown.push(action);
          steps.push({ kind: 'note', id: '', note: action + (annotations.length ? ' (' + annotations.join(', ') + ')' : ''), sameTick });
        }
      }
    }
  }
  return { steps, unknown };
}

/** "omniguard spec" → resolve("omniguard") + resolve("spec"); "deathskulls" → resolve("deathskulls"); prose → null */
function resolveAction(action: string, resolve: AliasResolver): RotationStep[] | null {
  const words = action.split(/\s+/);
  const direct = resolve(normalizeAlias(action));
  if (direct) return direct;
  if (words.length >= 2) {
    const last = normalizeAlias(words[words.length - 1]);
    if (last === 'spec' || last === 'eofspec') {
      const weapon = resolve(normalizeAlias(words.slice(0, -1).join(' ')));
      if (weapon?.some((s) => s.kind === 'spec')) return weapon; // gear alias already expands to switch + its spec
      const spec = resolve(last);
      if (weapon || spec) return [...(weapon ?? []), ...(spec ?? [])];
    }
    // "vulnbomb thrown" / "deathskulls asap": first word is the alias, the rest is prose
    const head = resolve(normalizeAlias(words[0]));
    if (head) return head.map((s, i) => (i === head.length - 1 ? { ...s, hint: words.slice(1).join(' ') } : s));
  }
  return null;
}

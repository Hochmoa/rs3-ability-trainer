import { RotationStep } from './models';

/**
 * Parser for rotations written in PvME notation (https://pvme.io style guide, "Rotations"):
 *   →  separates ticks / GCDs            +  joins same-tick actions
 *   (tc) target cycle   (auto) basic attack   (2t) or "2t x": x comes 2 ticks after the previous action
 *   asphyx (4t) → x  the channel is cut by x 4 ticks after the cast (step.cancelAfterTicks)
 *   7 hit rapid / rapid (7 hits)  7 hits land, then the next ability (step.afterHits)
 *   <weapon> spec / eofspec  weapon special attack     :alias: / <:alias:id>  Discord emoji aliases
 *   gricocaroming / overpowerigneous / sunshinepf ...  perk, cape and flank variants → the base ability
 *   bloodlust / residualsoul / flankicon ...  stack and status markers → a hint on the input they describe
 *   aod / dummy / telos ...  targets → target cycle with the target as hint
 *   realmmovement / timewarp / ballista ...  boss mechanics written inline → a note
 * Anything else that is not a known alias (phase headings, "improv", "run to the edge") becomes a note step.
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

/**
 * Perk / cape / flank / spell variants of an ability on PvME ("gricocaroming", "overpowerigneous", "soulstrikeflank",
 * "sunshinepf", "tsunamiincite", "magmatempesttarget"): the loadout owns the perk, the step is the base ability.
 * Only stripped when the remaining alias resolves. Value = hint shown on the step.
 */
const VARIANT_SUFFIXES: Record<string, string> = {
  caroming: 'Caroming',
  igneous: 'Igneous',
  flanking: 'Flank',
  flank: 'Flank',
  lunging: 'Lunging',
  energising: 'Energising',
  clearheaded: 'Clear Headed',
  turtling: 'Turtling',
  mobile: 'Mobile',
  pf: 'Planted Feet',
  incite: 'Incite Fear',
  target: 'target',
};
/** the same written in front: "igneousomnipower", "carominggrico", "flankimpact" */
const VARIANT_PREFIXES = ['igneous', 'caroming', 'flanking', 'flank'];

/** Stack / status icons: information about the neighbouring input, not an input. Value = hint text. */
export const PVME_MARKERS: Record<string, string> = {
  bloodlust: 'Bloodlust',
  residualsoul: 'Residual Soul',
  necrosis: 'Necrosis',
  deathspark: 'Death Spark',
  dspark: 'Death Spark',
  essencecorruption: 'Essence Corruption',
  primordialice: 'Primordial Ice',
  perfectequilibrium: 'Perfect Equilibrium',
  pe: 'Perfect Equilibrium',
  stunicon: 'Stunned',
  bindicon: 'Bound',
  bindstatus: 'Bound',
  poisonicon: 'Poisoned',
  flankicon: 'Flank',
  pf: 'Planted Feet',
  singletarget: 'Single-target',
  selftarget: 'Self-target',
  multitarget: 'Multi-target',
  areatarget: 'Area-target',
};

/** Bosses / NPCs used as targets ("(tc) aod", "aod omni", "click dummy"): a target cycle with the target as hint. */
export const PVME_TARGETS: Record<string, string> = {
  aod: 'Angel of Death',
  amascuthead: "Amascut's head",
  telos: 'Telos',
  imperialwarriorakh: 'Imperial warrior akh',
  gorillaakh: 'Gorilla akh',
  scarabakh: 'Scarab akh',
  tzkalzuk: 'TzKal-Zuk',
  zuk: 'TzKal-Zuk',
  bloodamalg: 'Blood amalgamation',
  iceamalg: 'Ice amalgamation',
  smokeamalg: 'Smoke amalgamation',
  shadowamalg: 'Shadow amalgamation',
  redgolem: 'Volcanic anima-golem',
  redbeam: 'Red beam',
  greenbeam: 'Green beam',
  tumekensfragment: 'Fragment of Tumeken',
  vorkath: 'Vorkath',
  raksha: 'Raksha',
  araxxi: 'Araxxi',
  rax: 'Araxxi',
  modestcrocodile: 'Modest crocodile demon',
  haraken: 'Har-Aken',
  zamorak: 'Zamorak',
  kerapac: 'Kerapac',
  solak: 'Solak',
  malletops: 'Malletops',
  vorago: 'Vorago',
  nex: 'Nex',
  ambassador: 'Ambassador',
  seiryu: 'Seiryu',
  archglacor: 'Arch-Glacor',
  bloodreaver: 'Blood reaver',
  legion: 'Legio',
  hammember: 'H.A.M. member',
};
/** prose allowed in front of a target: "on aod", "click dummy", "tc telos" */
const TARGET_PROSE = new Set(['on', 'onto', 'to', 'the', 'at', 'click', 'target', 'tc', 'hit', 'attack', 'switch']);

/** Boss mechanics written inline ("grico + realmmovement"): a note, not an unknown token. Value = note text. */
export const PVME_MECHANICS: Record<string, string> = {
  realmmovement: 'Realm movement',
  zamorakbutton: 'Realm movement',
  timewarp: 'Time warp',
  warptime: 'Time warp',
  ballista: 'Ballista',
  balista: 'Ballista',
  warsretreatteleport: "War's Retreat teleport",
};

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
          // "(tc) aod": the target belongs to the target cycle
          const target = PVME_TARGETS[normalizeAlias(action)];
          if (target && inputs?.length) {
            const last = steps[steps.length - 1];
            last.hint = joinHint(last.hint, target);
            action = '';
          }
        }
        // "→ bloodlust" / "+ pf" alone: a marker describing the previous input
        const marker = PVME_MARKERS[normalizeAlias(action)];
        if (action && marker) {
          const prev = steps[steps.length - 1];
          if (prev) prev.hint = joinHint(prev.hint, marker);
          action = '';
        }
        if (!action) {
          if (offset !== undefined) pendingOffset = offset;
          continue;
        }
        const sameTick = !first;
        first = false;
        // "asphyx (4t)": the channel is cut by the next ability 4 ticks after the cast; "7 hit rapid" / "rapid (7 hits)":
        // let 7 hits land, then continue – both only when the action resolves to an ability that can carry the cut
        const cut = channelCut(action, annotations);
        let resolved = cut ? resolveAction(cut.action, resolve) : null;
        const cutAt = resolved?.some((s) => s.kind === 'ability') ? cut : null;
        if (!cutAt) resolved = resolveAction(action, resolve); // no ability to carry the cut: the notation stays prose
        const off = offset ?? pendingOffset;
        pendingOffset = undefined;
        if (resolved) {
          const cutIndex = cutAt ? resolved.map((s) => s.kind).lastIndexOf('ability') : -1;
          const notes = cutAt ? annotations.filter((a) => !cutAt.fromAnnotation || a !== cutAt.fromAnnotation) : annotations;
          resolved.forEach((s, i) => {
            const step: RotationStep = { ...s };
            if (sameTick || i > 0) step.sameTick = true; // the UI hides the flag on GCD casts, the engine scores companions only
            if (off !== undefined && i === 0) step.offsetTicks = off;
            if (cutAt && i === cutIndex) {
              if (cutAt.cancelAfterTicks !== undefined) step.cancelAfterTicks = cutAt.cancelAfterTicks;
              if (cutAt.afterHits !== undefined) step.afterHits = cutAt.afterHits;
            }
            if (notes.length && i === resolved.length - 1) step.hint = joinHint(step.hint, notes.join(', '));
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

function joinHint(hint: string | undefined, text: string): string {
  return hint ? hint + ', ' + text : text;
}

/** trailing "(4t)" of "asphyx (4t)" */
const CANCEL_SUFFIX = /\s+\(\s*(\d+)\s*t\s*\)$/i;
/** leading "7 hit" / "3 hits" / "2t hit" of "7 hit rapid" */
const HITS_PREFIX = /^(\d+)\s*t?\s*hits?\s+(?=\S)/i;
/** annotation "(7 hits)" */
const HITS_ANNOTATION = /^(\d+)\s*hits?$/i;

interface ChannelCut {
  /** the action without the notation */
  action: string;
  cancelAfterTicks?: number;
  afterHits?: number;
  /** the annotation the hit count came from (dropped from the hint when the cut is applied) */
  fromAnnotation?: string;
}

/**
 * PvME channel notation: "asphyx (4t)" = cancel the channel with the next ability 4 ticks after the cast, "7 hit rapid" /
 * "rapid (7 hits)" = let 7 hits land, then continue. Null when the action carries neither.
 */
function channelCut(action: string, annotations: string[]): ChannelCut | null {
  const cancel = CANCEL_SUFFIX.exec(action);
  if (cancel) return { action: action.slice(0, cancel.index).trim(), cancelAfterTicks: parseInt(cancel[1], 10) };
  const hits = HITS_PREFIX.exec(action);
  if (hits) return { action: action.slice(hits[0].length).trim(), afterHits: parseInt(hits[1], 10) };
  for (const a of annotations) {
    const m = HITS_ANNOTATION.exec(a.trim());
    if (m) return { action, afterHits: parseInt(m[1], 10), fromAnnotation: a };
  }
  return null;
}

/** copy of the steps with `text` added to the hint of the last one (where annotations and trailing prose go too) */
function withHint(steps: RotationStep[], text: string): RotationStep[] {
  if (!text) return steps;
  return steps.map((s, i) => (i === steps.length - 1 ? { ...s, hint: joinHint(s.hint, text) } : s));
}

function targetCycle(hint: string): RotationStep {
  return { kind: 'action', id: 'target-cycle', hint }; // models.ts ACTIONS
}

function mechanicNote(note: string): RotationStep {
  return { kind: 'note', id: '', note, phase: true };
}

/**
 * An alias, or a perk / cape / flank variant of one ("gricocaroming" → greater-ricochet + hint "Caroming").
 * The variant is only stripped when the remaining alias resolves, so unknown names stay unknown.
 */
export function resolveAlias(alias: string, resolve: AliasResolver): RotationStep[] | null {
  const direct = resolve(alias);
  if (direct) return direct;
  for (const [suffix, label] of Object.entries(VARIANT_SUFFIXES)) {
    if (alias.length > suffix.length && alias.endsWith(suffix)) {
      const base = resolve(alias.slice(0, -suffix.length));
      if (base) return withHint(base, label);
    }
  }
  for (const prefix of VARIANT_PREFIXES) {
    if (alias.length > prefix.length && alias.startsWith(prefix)) {
      const base = resolve(alias.slice(prefix.length));
      if (base) return withHint(base, VARIANT_SUFFIXES[prefix]);
    }
  }
  return null;
}

/**
 * "omniguard spec" → resolve("omniguard") + resolve("spec"); "deathskulls" → resolve("deathskulls");
 * "bloodlust gflurry" → gflurry + hint; "aod omni" → target cycle + omni; "grico realmmovement" → grico + note; prose → null
 */
function resolveAction(action: string, resolve: AliasResolver): RotationStep[] | null {
  const direct = resolveAlias(normalizeAlias(action), resolve);
  if (direct) return direct;
  const words = action.split(/\s+/);
  const first = normalizeAlias(words[0]);
  if (words.length < 2) {
    if (PVME_TARGETS[first]) return [targetCycle(PVME_TARGETS[first])];
    if (PVME_MECHANICS[first]) return [mechanicNote(PVME_MECHANICS[first])];
    return null;
  }
  const last = normalizeAlias(words[words.length - 1]);
  const rest = (from: number, to = words.length) => words.slice(from, to).join(' ');
  if (last === 'spec' || last === 'eofspec') {
    const weapon = resolveAlias(normalizeAlias(rest(0, -1)), resolve);
    if (weapon?.some((s) => s.kind === 'spec')) return weapon; // gear alias already expands to switch + its spec
    if (weapon?.some((s) => s.kind === 'ability' && s.id === 'essence-of-finality')) return weapon; // "eof spec"
    const spec = resolve(last);
    if (weapon || spec) return [...(weapon ?? []), ...(spec ?? [])];
  }
  // "bloodlust gflurry" / "impact flankicon": a stack marker next to the input it describes
  if (PVME_MARKERS[first]) {
    const r = resolveAction(rest(1), resolve);
    if (r) return withHint(r, PVME_MARKERS[first]);
  }
  if (PVME_MARKERS[last]) {
    const r = resolveAlias(normalizeAlias(rest(0, -1)), resolve); // "volleyofsouls with 3 residualsoul" keeps its prose instead
    if (r) return withHint(r, PVME_MARKERS[last]);
  }
  // "aod omni": switch target, then the input; "click dummy" / "on aod" / "tc telos": just the target
  if (PVME_TARGETS[first]) {
    const r = resolveAction(rest(1), resolve);
    return r ? [targetCycle(PVME_TARGETS[first]), ...r] : [targetCycle(PVME_TARGETS[first] + ' – ' + rest(1))];
  }
  if (PVME_TARGETS[last] && words.slice(0, -1).every((w) => TARGET_PROSE.has(w.toLowerCase()))) return [targetCycle(PVME_TARGETS[last])];
  // "warsretreatteleport dba" / "ballista at 2.4 seconds left": the mechanic, then whatever follows it
  if (PVME_MECHANICS[first]) {
    const r = resolveAction(rest(1), resolve);
    return r ? [mechanicNote(PVME_MECHANICS[first]), ...r] : [mechanicNote(PVME_MECHANICS[first] + ' ' + rest(1))];
  }
  // "vulnbomb thrown" / "deathskulls asap": first word is the alias, the rest is prose;
  // "necrobasic / fingerofdeath" is PvME's "either – or": the first option is the step, the alternative is dropped
  const head = resolveAlias(first, resolve);
  if (head) {
    const prose = rest(1);
    return withHint(head, prose.startsWith('/') ? '' : prose);
  }
  return null;
}

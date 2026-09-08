/**
 * What Revolution would do with an action bar, without playing a session. The community's bar guides are entirely
 * about order — "which abilities does Revolution fire for me, and in which priority" — so the trainer says it for the
 * bar in front of you: which slots are scanned, which of them Revolution can fire, and why the others never go off.
 *
 * The rules are the engine's own (TrainerEngine.revolutionTriggers / revolutionChoice, docs/research/revolution.md):
 * only GCD abilities of an enabled type, never the special-attack slots or Regenerate, never an ability of a style
 * the wielded weapon cannot use, and a basic attack only when nothing else in range can fire.
 */
import { RevolutionSettings, Style, Style4, isStyle4 } from '../core/models';
import { EngineEntity, REVOLUTION_NEVER, isBasicAttackId } from './trainer-engine';
import { ruleFor } from './rules';

export interface RevolutionSlot {
  /** 1-based position on the main bar */
  slot: number;
  key: string | null;
  name: string;
  /** Revolution fires it (a basic attack only when nothing else can – see `lastResort`) */
  fires: boolean;
  /** the basic attack: fired only when no other slot in range is ready */
  lastResort: boolean;
  /** why Revolution never fires this slot */
  why?: string;
}

export interface RevolutionPlan {
  /** the slots Revolution scans, in the order it scans them */
  scanned: RevolutionSlot[];
  /** slots on the bar past the Revolution size – never looked at */
  ignored: RevolutionSlot[];
  /** short advice about the order, most important first */
  warnings: string[];
}

const TYPE_LABEL: Record<string, string> = { Basic: 'basic abilities', Incantation: 'basic abilities', Enhanced: 'enhanced abilities', Threshold: 'threshold abilities', Ultimate: 'ultimate abilities' };

function reason(e: EngineEntity | undefined, r: RevolutionSettings, style: Style | null): string | undefined {
  if (!e) return 'empty slot';
  if (e.kind === 'weapon') return 'a weapon switch, not an ability';
  if (e.kind !== 'ability') return e.kind === 'spec' || e.kind === 'special' ? 'Revolution never fires special attacks or items' : 'not an ability';
  if (REVOLUTION_NEVER.has(e.id)) return 'Revolution never fires this slot';
  if (!e.gcd || ruleFor(e.id)?.offGcd) return 'off the global cooldown, and Revolution only fires abilities that start it';
  if (e.style && isStyle4(e.style) && style && e.style !== style) return 'a ' + e.style + ' ability while you wield ' + style;
  const toggles: Partial<Record<string, boolean>> = { Basic: r.basics, Incantation: r.basics, Enhanced: r.enhanced, Threshold: r.thresholds, Ultimate: r.ultimates };
  const type = e.abilityType ?? 'Basic';
  if (toggles[type] === undefined) return 'a ' + type.toLowerCase() + ' ability, and Revolution never fires those';
  if (!toggles[type]) return TYPE_LABEL[type] + ' are switched off in the Revolution settings';
  return undefined;
}

/**
 * `bar` is the main bar in slot order (null = empty), `get` resolves an entity key, `style` the wielded style.
 */
export function revolutionPlan(bar: (string | null)[], get: (key: string) => EngineEntity | undefined, r: RevolutionSettings, style: Style4 | null): RevolutionPlan {
  const size = Math.max(0, Math.min(bar.length, Math.round(r.slots)));
  const row = (key: string | null, i: number): RevolutionSlot => {
    const e = key ? get(key) : undefined;
    const why = reason(e, r, style);
    return { slot: i + 1, key, name: e?.name ?? (key ? key : '-'), fires: !why, lastResort: !!e && isBasicAttackId(e.id), why };
  };
  const scanned = bar.slice(0, size).map(row);
  const ignored = bar.slice(size).map((k, i) => row(k, size + i)).filter((s) => !!s.key);

  const warnings: string[] = [];
  const firing = scanned.filter((s) => s.fires);
  if (!firing.length) warnings.push('Revolution has nothing to fire in the first ' + size + ' slots: it will only auto-attack.');
  const firstBasicAttack = firing.findIndex((s) => s.lastResort);
  if (firstBasicAttack >= 0 && firstBasicAttack < firing.length - 1) {
    warnings.push('The basic attack is the last resort whatever its position: Revolution only falls back to it when no other slot in range can fire, so the slots after it still go off.');
  }
  const wrongStyle = scanned.filter((s) => s.why?.startsWith('a ') && s.why.includes('while you wield'));
  if (wrongStyle.length) {
    warnings.push(wrongStyle.length === 1
      ? 'One slot is of another style and stays silent until you switch weapons.'
      : wrongStyle.length + ' slots are of another style and stay silent until you switch weapons.');
  }
  if (ignored.some((s) => !reason(s.key ? get(s.key) : undefined, r, style))) {
    warnings.push('Abilities past slot ' + size + ' are never scanned. Raise the Revolution size or move them left.');
  }
  if (r.ultimates && scanned.some((s) => s.fires && get(s.key ?? '')?.abilityType === 'Ultimate')) {
    warnings.push('An ultimate on the bar fires the moment it is affordable, which is rarely when you want the damage window.');
  }
  return { scanned, ignored, warnings };
}

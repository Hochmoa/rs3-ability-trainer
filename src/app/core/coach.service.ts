import { Injectable, signal } from '@angular/core';
import { CoachSettings, DEFAULT_COACH } from './models';

/**
 * Coach: the trainer calls the keys out loud ("3", "Ctrl 4", "Shift Q") and clicks the tick rhythm.
 *
 * Timing: the game clock lives in the engine (`tickTime(tick)` on performance.now()). The train page schedules
 * every call-out and beep against that clock:
 *  - beeps go through the Web Audio API – an oscillator started at `AudioContext.currentTime + (at - now) / 1000`
 *    is sample-accurate, so the metronome sits exactly on the ticks (output latency of the device subtracted);
 *  - the voice is the browser's `speechSynthesis`, which cannot be scheduled and cannot be rendered into a buffer.
 *    `speak(text, at)` therefore fires the utterance `leadMs + latencyMs` before `at`: the lead is a setting
 *    (default 250 ms), the latency is measured on every real utterance (speak() → `onstart`, averaged), so the
 *    compensation settles after the first call-outs. Any utterance still speaking is cancelled first, so a new key
 *    never queues behind the previous one.
 *
 * Everything audio is behind feature detection: without `AudioContext` / `speechSynthesis` (tests, old browsers)
 * every method is a no-op. `enable()` has to run inside a user gesture (the Start button) – browsers block audio
 * otherwise; `blocked()` tells the page to show a hint.
 */
export type BeepKind = 'tick' | 'press';

export interface Callout {
  text: string;
  /** performance.now() the utterance was (or will be) fired */
  at: number;
}

const SPOKEN_KEYS: Record<string, string> = {
  '-': 'minus',
  '=': 'equals',
  '[': 'left bracket',
  ']': 'right bracket',
  '\\': 'backslash',
  ';': 'semicolon',
  "'": 'quote',
  '`': 'backtick',
  ',': 'comma',
  '.': 'period',
  '/': 'slash',
  '*': 'star',
  '+': 'plus',
  '↑': 'up',
  '↓': 'down',
  '←': 'left',
  '→': 'right',
  Esc: 'escape',
  Del: 'delete',
  Ins: 'insert',
  PgUp: 'page up',
  PgDn: 'page down',
  Caps: 'caps lock',
  Space: 'space',
  Enter: 'enter',
  Tab: 'tab',
  Backspace: 'backspace',
  Home: 'home',
  End: 'end',
};

const MODIFIERS: Record<string, string> = { c: 'Ctrl', s: 'Shift', a: 'Alt' };

/**
 * A keybind label as the voice should say it: "c+4" → "Ctrl 4", "s+Q" → "Shift Q", "-" → "minus",
 * "Num +" → "numpad plus", "F5" → "F5". Letters and digits stay as they are (short, like a caller in a rhythm game).
 * "click" (a slot without a keybind) and "" come back unchanged / empty – the caller replaces them by the ability name.
 */
export function spokenLabel(label: string): string {
  const s = (label ?? '').trim();
  if (!s || s === 'click') return s;
  const m = /^((?:[csa]\+)*)(.*)$/.exec(s)!;
  const mods = m[1].split('+').filter(Boolean).map((x) => MODIFIERS[x]);
  const key = spokenKey(m[2]);
  return [...mods, key].filter(Boolean).join(' ');
}

function spokenKey(k: string): string {
  if (SPOKEN_KEYS[k]) return SPOKEN_KEYS[k];
  if (k.startsWith('Num ')) return 'numpad ' + spokenKey(k.slice(4));
  if (/^[a-z]$/.test(k)) return k.toUpperCase();
  return k;
}

/** "3, then Q, then Ctrl 4" – one phrase for a group of keys */
export function spokenSequence(labels: string[]): string {
  return labels.filter(Boolean).join(', then ');
}

const hasWindow = typeof window !== 'undefined';
const AUDIO = hasWindow && typeof AudioContext !== 'undefined';
const SPEECH = hasWindow && typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

@Injectable({ providedIn: 'root' })
export class CoachService {
  readonly supported = { audio: AUDIO, speech: SPEECH };
  /** enable() was called (from a user gesture) and disable() not yet */
  readonly enabled = signal(false);
  /** the browser refused to start audio (no user gesture) */
  readonly blocked = signal(false);
  /** measured delay between speechSynthesis.speak() and the voice starting, ms (running average of real call-outs) */
  readonly latencyMs = signal(0);
  /** the last call-out fired – the popout / HUD shows it */
  readonly lastCallout = signal<Callout | null>(null);
  /** the next call-out waiting to fire (null = nothing scheduled) */
  readonly nextCallout = signal<Callout | null>(null);
  /** installed voices (Chrome fills the list asynchronously) */
  readonly voices = signal<SpeechSynthesisVoice[]>([]);

  private settings: CoachSettings = { ...DEFAULT_COACH };
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly nodes = new Set<AudioScheduledSourceNode>();
  private readonly pending = new Map<number, Callout>();

  constructor() {
    if (SPEECH) {
      this.refreshVoices();
      speechSynthesis.addEventListener?.('voiceschanged', () => this.refreshVoices());
    }
  }

  /** volume, lead, voice – may be called any time, also while enabled */
  configure(s: CoachSettings): void {
    this.settings = { ...DEFAULT_COACH, ...s };
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.gainValue(), this.ctx.currentTime, 0.01);
  }

  get leadMs(): number {
    return this.settings.leadMs;
  }

  /**
   * Call from a user gesture (the Start click). Creates / resumes the AudioContext.
   * Resolves false when the browser blocked audio.
   */
  async enable(): Promise<boolean> {
    this.enabled.set(true);
    this.blocked.set(false);
    if (AUDIO) {
      try {
        if (!this.ctx) {
          this.ctx = new AudioContext({ latencyHint: 'interactive' });
          this.master = this.ctx.createGain();
          this.master.gain.value = this.gainValue();
          this.master.connect(this.ctx.destination);
        }
        if (this.ctx.state !== 'running') await this.ctx.resume();
        if (this.ctx.state !== 'running') this.blocked.set(true);
      } catch {
        this.blocked.set(true);
      }
    }
    return !this.blocked();
  }

  /** stops everything scheduled, cancels the voice; the AudioContext is kept (suspended) for the next session */
  disable(): void {
    this.enabled.set(false);
    for (const t of this.pending.keys()) window.clearTimeout(t);
    this.pending.clear();
    for (const n of this.nodes) {
      try {
        n.stop();
      } catch {
        /* already ended */
      }
    }
    this.nodes.clear();
    this.nextCallout.set(null);
    if (SPEECH) speechSynthesis.cancel();
    if (this.ctx?.state === 'running') void this.ctx.suspend();
  }

  /**
   * Says `text` so that it starts at `atPerfTime` (performance.now() clock): the utterance is fired
   * `leadMs + latencyMs` earlier. A time in the past fires immediately. Cancels whatever is still speaking.
   */
  speak(text: string, atPerfTime: number): void {
    if (!SPEECH || !this.enabled() || !text) return;
    const fireAt = atPerfTime - this.settings.leadMs - this.latencyMs();
    const delay = Math.max(0, fireAt - performance.now());
    const t = window.setTimeout(() => {
      this.pending.delete(t);
      this.updateNext();
      if (!this.enabled()) return;
      this.utter(text);
      this.lastCallout.set({ text, at: performance.now() });
    }, delay);
    this.pending.set(t, { text, at: fireAt });
    this.updateNext();
  }

  private updateNext(): void {
    let next: Callout | null = null;
    for (const c of this.pending.values()) if (!next || c.at < next.at) next = c;
    this.nextCallout.set(next);
  }

  /** sample-accurate click ('tick') or the higher "press now" beep ('press') at `atPerfTime` */
  beep(kind: BeepKind, atPerfTime: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.enabled() || ctx.state !== 'running') return;
    const now = performance.now();
    if (atPerfTime < now - 80) return; // too late to be a rhythm cue
    const latency = (ctx as AudioContext & { outputLatency?: number }).outputLatency ?? ctx.baseLatency ?? 0;
    const when = Math.max(ctx.currentTime, ctx.currentTime + (atPerfTime - now) / 1000 - latency);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const press = kind === 'press';
    osc.type = press ? 'square' : 'sine';
    osc.frequency.value = press ? 1320 : 880;
    const peak = press ? 0.35 : 0.2;
    const len = press ? 0.09 : 0.035;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    osc.connect(g).connect(this.master);
    osc.start(when);
    osc.stop(when + len + 0.01);
    this.nodes.add(osc);
    osc.onended = () => this.nodes.delete(osc);
  }

  /** Settings page: enable (from the click), say "Ctrl 4, then 3" and click twice */
  async test(): Promise<boolean> {
    const ok = await this.enable();
    const now = performance.now();
    this.speak(spokenSequence(['Ctrl 4', '3']), now + this.settings.leadMs + this.latencyMs());
    this.beep('tick', now + 600);
    this.beep('press', now + 1200);
    return ok;
  }

  private gainValue(): number {
    return Math.max(0, Math.min(1, this.settings.volume / 100));
  }

  private utter(text: string): void {
    const synth = speechSynthesis;
    if (synth.speaking || synth.pending) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.3;
    u.pitch = 1;
    u.volume = this.gainValue();
    const v = this.voice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'en-US';
    const t0 = performance.now();
    u.onstart = () => {
      // the first utterance also loads the voice (300 ms and more), later ones are faster: average it out
      const sample = Math.max(0, Math.min(600, performance.now() - t0));
      const prev = this.latencyMs();
      this.latencyMs.set(Math.round(prev ? (prev + sample) / 2 : sample));
    };
    synth.speak(u);
  }

  private voice(): SpeechSynthesisVoice | null {
    const list = this.voices();
    if (this.settings.voice) {
      const chosen = list.find((v) => v.voiceURI === this.settings.voice);
      if (chosen) return chosen;
    }
    const english = list.filter((v) => /^en\b/i.test(v.lang));
    return english.find((v) => v.default) ?? english.find((v) => v.localService) ?? english[0] ?? list.find((v) => v.default) ?? null;
  }

  private refreshVoices(): void {
    try {
      const list = speechSynthesis.getVoices();
      if (list.length !== this.voices().length) this.voices.set([...list]);
    } catch {
      /* no voices */
    }
  }
}

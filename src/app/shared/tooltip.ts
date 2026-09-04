import { Component, Directive, ElementRef, HostListener, Injectable, computed, inject, input, signal } from '@angular/core';
import { DataService, Entity, GearView } from '../core/data.service';
import { Buff, SPELLBOOK_NAMES, Special } from '../core/models';
import { ruleFor, specialRuleFor } from '../engine/rules';
import { TICK_MS } from '../engine/trainer-engine';

interface TipState {
  entity?: Entity;
  /** an equipment item (gear panel) instead of an entity */
  gear?: GearView;
  x: number;
  y: number;
}

@Injectable({ providedIn: 'root' })
export class TooltipService {
  readonly state = signal<TipState | null>(null);
}

/** how long a finger has to rest on an icon before the tooltip opens (touch devices) */
const LONG_PRESS_MS = 450;
/** emulated mouse / focus events arriving this soon after a touch are ignored */
const TOUCH_SHADOW_MS = 1500;

/**
 * Hover tooltip on mouse devices; on touch devices the tooltip opens on a long press only and closes
 * when the finger lifts – a tap stays a tap (bar slots are pressed by tapping) and the big tooltip
 * does not pop up on every touch. The emulated mouse events a tap produces are ignored.
 */
@Directive()
abstract class TipBase {
  protected tips = inject(TooltipService);
  protected lastTouch = 0;
  private timer = 0;
  private pressed = false;

  protected abstract stateAt(x: number, y: number): TipState | null;

  /** pointer held down on the host (a drag is starting) – nothing is shown until it is released */
  private pointerDown = false;

  @HostListener('pointerdown')
  onPointerDown(): void {
    this.pointerDown = true;
    this.tips.state.set(null);
    window.addEventListener('pointerup', () => (this.pointerDown = false), { once: true });
    window.addEventListener('pointercancel', () => (this.pointerDown = false), { once: true });
  }

  @HostListener('mouseenter', ['$event'])
  @HostListener('mousemove', ['$event'])
  show(e: MouseEvent): void {
    if (this.pointerDown || Date.now() - this.lastTouch < TOUCH_SHADOW_MS) return;
    const s = this.stateAt(e.clientX, e.clientY);
    if (s) this.tips.state.set(s);
  }

  @HostListener('mouseleave')
  hide(): void {
    this.tips.state.set(null);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    this.lastTouch = Date.now();
    this.pressed = false;
    const t = e.touches[0];
    if (!t) return;
    const x = t.clientX;
    const y = t.clientY;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      const s = this.stateAt(x, y);
      if (s) {
        this.pressed = true;
        this.tips.state.set(s);
      }
    }, LONG_PRESS_MS);
  }

  @HostListener('touchmove')
  onTouchMove(): void {
    window.clearTimeout(this.timer); // scrolling is not a press
  }

  @HostListener('touchend', ['$event'])
  @HostListener('touchcancel', ['$event'])
  onTouchEnd(e: TouchEvent): void {
    window.clearTimeout(this.timer);
    this.lastTouch = Date.now();
    if (this.pressed) {
      this.pressed = false;
      this.tips.state.set(null);
      e.preventDefault(); // the long press was for the tooltip, not a click
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event): void {
    if (Date.now() - this.lastTouch < TOUCH_SHADOW_MS) e.preventDefault(); // no "save image" menu on a long press
  }
}

/** Put on any element: shows the full entity details while hovering (long press on touch). Accepts an Entity or an entity key. */
@Directive({ selector: '[entityTip]' })
export class EntityTip extends TipBase {
  readonly entityTip = input.required<Entity | string | null | undefined>();
  private data = inject(DataService);
  private el = inject(ElementRef<HTMLElement>);

  private resolve(): Entity | undefined {
    const v = this.entityTip();
    if (!v) return undefined;
    return typeof v === 'string' ? this.data.get(v) : v;
  }

  protected stateAt(x: number, y: number): TipState | null {
    const entity = this.resolve();
    return entity ? { entity, x, y } : null;
  }

  @HostListener('focus')
  focus(): void {
    if (Date.now() - this.lastTouch < TOUCH_SHADOW_MS) return; // a tap focuses the slot – no tooltip for that
    const entity = this.resolve();
    const r = this.el.nativeElement.getBoundingClientRect();
    if (entity) this.tips.state.set({ entity, x: r.right, y: r.top });
  }

  @HostListener('blur')
  blur(): void {
    this.hide();
  }
}

/** Put on a gear-panel cell: shows the item (name, tier, set / passive text, perks) while hovering (long press on touch). */
@Directive({ selector: '[gearTip]' })
export class GearTip extends TipBase {
  readonly gearTip = input.required<GearView | null | undefined>();

  protected stateAt(x: number, y: number): TipState | null {
    const gear = this.gearTip();
    return gear ? { gear, x, y } : null;
  }
}

function seconds(ticks: number | null | undefined): string {
  if (ticks === null || ticks === undefined) return '';
  return (ticks * TICK_MS) / 1000 + ' s (' + ticks + (ticks === 1 ? ' tick)' : ' ticks)');
}

interface Note {
  text: string;
  url: string | null;
}

@Component({
  selector: 'entity-tooltip',
  template: `
    @if (tips.state(); as s) {
      <div class="tip" [style.left.px]="pos().x" [style.top.px]="pos().y">
        @if (s.gear; as g) {
          <div class="head">
            @if (g.icon) { <img [src]="g.icon" [alt]="g.name" /> }
            <div>
              <div class="name">{{ g.name }}</div>
              <div class="sub">{{ gearSubtitle(g) }}</div>
              @if (perkLine(g); as perks) { <div class="perks">✦ {{ perks }}</div> }
            </div>
          </div>
          <table>
            @if (g.weapon; as w) {
              @if (g.spec; as sp) { <tr><th>Special</th><td>{{ sp.name }} · {{ sp.adrenaline }}% adrenaline</td></tr> }
              @if (w.role) { <tr><th>Role</th><td>{{ w.role }}</td></tr> }
            }
            @if (g.set; as set) { <tr><th>Set</th><td>{{ set.name }}</td></tr> }
            @if (g.ref.spec) { <tr><th>Stored spec</th><td>{{ specName(g.ref.spec) }}</td></tr> }
            @if (g.special; as sp) {
              <tr><th>Adrenaline</th><td class="good">{{ sp.adrenaline ? '+' + sp.adrenaline + '%' : '' }}{{ sp.adrenalineOverTime ? '+' + sp.adrenalineOverTime + '% over ' + seconds(sp.overTimeTicks) : '' }}</td></tr>
              <tr><th>Cooldown</th><td>{{ seconds(sp.cooldownTicks) }} (shared)</td></tr>
            }
          </table>
          @if (g.passive; as pv) { <p class="desc">{{ pv.text }}</p> }
          @if (g.set; as set) {
            <div class="rules">
              @for (t of set.thresholds ?? []; track t.pieces) {
                <div class="rule"><span><b>{{ t.pieces }}:</b> {{ t.text }}</span></div>
              }
            </div>
          }
          @if (g.special; as sp) { <p class="desc">{{ sp.description }}</p> }
        } @else if (s.entity; as e) {
        <div class="head">
          <img [src]="e.icon" [alt]="e.name" />
          <div>
            <div class="name">{{ e.name }}</div>
            <div class="sub">{{ subtitle(e) }}</div>
          </div>
        </div>
        @if (e.ability; as a) {
          <table>
            <tr><th>Adrenaline</th><td [class]="(a.adrenaline ?? 0) > 0 ? 'good' : (a.adrenaline ?? 0) < 0 ? 'bad' : ''">{{ adrenaline(a.adrenaline) }}</td></tr>
            @if (a.cooldownTicks) { <tr><th>Cooldown</th><td>{{ seconds(a.cooldownTicks) }}</td></tr> }
            @if (a.damageMin !== null) {
              <tr><th>Damage</th><td>{{ a.damageMin }}%–{{ a.damageMax }}%{{ a.hits && a.hits > 1 ? ' × ' + a.hits + ' hits' : '' }} <span class="muted">(avg {{ a.damageText }})</span></td></tr>
            } @else if (a.damageText && a.damageText !== 'None' && a.damageText !== 'N/A') {
              <tr><th>Damage</th><td>{{ a.damageText }}</td></tr>
            }
            <tr><th>Target</th><td>{{ a.target }}{{ a.channelled ? ' · channelled' : '' }}</td></tr>
            @if (a.equipment && a.equipment !== 'Any') { <tr><th>Requires</th><td>{{ a.equipment }}</td></tr> }
            @if (a.durationTicks) { <tr><th>Duration</th><td>{{ seconds(a.durationTicks) }}</td></tr> }
            @if (!a.triggersGcd) { <tr><th>GCD</th><td class="warn">does not trigger the global cooldown</td></tr> }
          </table>
          <p class="desc">{{ describe(a.description) }}</p>
          @if (notes(a.id).length) {
            <div class="rules">
              <div class="rules-title">Interactions</div>
              @for (n of notes(a.id); track $index) {
                <div class="rule">
                  <span>{{ n.text }}</span>
                  @if (n.url) { <a class="src" [href]="n.url" target="_blank" rel="noopener">wiki</a> }
                </div>
              }
            </div>
          }
          @if (buffsOf(a.buffs).length) {
            <div class="buffs">
              @for (b of buffsOf(a.buffs); track b.id) {
                <div class="buff">
                  @if (b.iconSelf || b.iconTarget) { <img [src]="b.iconSelf || b.iconTarget" [alt]="b.name" /> }
                  <div>
                    <b class="buff-name">{{ b.name }}</b><span class="muted">{{ b.kind }}{{ b.duration ? ' · ' + firstLine(b.duration) : '' }}</span>
                    @if (b.effects) { <div class="effects">{{ b.effects }}</div> }
                  </div>
                </div>
              }
            </div>
          }
        } @else if (e.prayer; as p) {
          <table>
            <tr><th>Level</th><td>{{ p.level }}</td></tr>
            @if (p.drainPerHour) { <tr><th>Drain</th><td>{{ p.drainPerHour }} points / hour</td></tr> }
            @if (p.adrenaline) { <tr><th>Adrenaline</th><td>{{ p.adrenaline > 0 ? '+' : '' }}{{ p.adrenaline }}%</td></tr> }
            <tr><th>GCD</th><td class="warn">off the global cooldown</td></tr>
          </table>
          @if (p.effect) { <p class="desc">{{ p.effect }}</p> }
          <p class="desc muted">{{ p.description }}</p>
        } @else if (e.spell; as s) {
          <table>
            <tr><th>Spellbook</th><td>{{ bookName(s.book) }}</td></tr>
            <tr><th>Level</th><td>{{ s.level }} Magic</td></tr>
            @if (s.cooldownTicks) { <tr><th>Cooldown</th><td>{{ seconds(s.cooldownTicks) }}</td></tr> }
            @if (s.durationTicks) { <tr><th>Duration</th><td>{{ seconds(s.durationTicks) }}</td></tr> }
            <tr><th>GCD</th><td [class.warn]="!s.gcd">{{ s.kind === 'autocast' ? 'selecting the auto-cast spell is instant' : s.gcd ? 'starts the global cooldown' : 'off the global cooldown' }}</td></tr>
          </table>
          <p class="desc">{{ s.effect }}</p>
          <p class="desc muted">{{ s.description }}</p>
        } @else if (e.weapon; as w) {
          <table>
            <tr><th>Style</th><td>{{ w.style }}</td></tr>
            <tr><th>GCD</th><td class="warn">instant – switching gear does not use a tick</td></tr>
          </table>
          <p class="desc">Wield your {{ w.style }} weapon. Abilities of other styles are greyed out until you switch back; Defence and Constitution abilities work with any weapon.</p>
        } @else if (e.special; as sp) {
          <table>
            @if (sp.adrenaline || sp.adrenalineOverTime) {
              <tr><th>Adrenaline</th><td class="good">{{ sp.adrenaline ? '+' + sp.adrenaline + '%' : '' }}{{ sp.adrenalineOverTime ? '+' + sp.adrenalineOverTime + '% over ' + seconds(sp.overTimeTicks) : '' }}</td></tr>
            }
            @if (sp.debuff; as d) { <tr><th>Target</th><td>{{ d.name }} for {{ seconds(d.durationTicks) }}</td></tr> }
            @if (sp.cooldownTicks) { <tr><th>Cooldown</th><td>{{ seconds(sp.cooldownTicks) }}{{ sp.sharedCooldown ? ' (shared)' : '' }}</td></tr> }
            @if (sp.level) { <tr><th>Herblore</th><td>{{ sp.level }}</td></tr> }
            <tr><th>GCD</th><td class="warn">off the global cooldown</td></tr>
          </table>
          <p class="desc">{{ sp.description }}</p>
          @if (specialNotes(sp.id).length) {
            <div class="rules">
              <div class="rules-title">Interactions</div>
              @for (n of specialNotes(sp.id); track $index) {
                <div class="rule">
                  <span>{{ n.text }}</span>
                  @if (n.url) { <a class="src" [href]="n.url" target="_blank" rel="noopener">wiki</a> }
                </div>
              }
            </div>
          }
        }
        }
      </div>
    }
  `,
  styles: `
    .tip {
      position: fixed;
      z-index: 100;
      width: 380px;
      max-width: calc(100vw - 16px);
      max-height: calc(100vh - 16px);
      overflow: hidden;
      padding: 10px 12px;
      background: #15140f;
      border: 1px solid var(--gold);
      border-radius: 6px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.7);
      font-size: 13px;
      pointer-events: none;
      color: var(--text);
    }
    .head {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 6px;
    }
    .head img {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      background: #000;
    }
    .name {
      font-weight: 700;
      font-size: 15px;
      color: var(--gold);
    }
    .sub {
      color: var(--muted);
      font-size: 12px;
    }
    /* Invention perks: the first thing after the name, so a hover answers "what is on this item" at once */
    .perks {
      margin-top: 3px;
      font-size: 12px;
      font-weight: 600;
      color: #9fd3ff;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 6px;
    }
    th {
      text-align: left;
      color: var(--muted);
      font-weight: 600;
      padding: 1px 8px 1px 0;
      white-space: nowrap;
      width: 1%;
    }
    td {
      padding: 1px 0;
    }
    .desc {
      margin: 4px 0 0;
      white-space: pre-wrap;
      line-height: 1.35;
      font-size: 12px;
    }
    .rules {
      margin-top: 8px;
      border-top: 1px solid var(--border);
      padding-top: 6px;
    }
    .rules-title {
      color: var(--gold);
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 3px;
    }
    .rule {
      font-size: 12px;
      line-height: 1.35;
      padding: 2px 0;
      border-bottom: 1px dotted rgba(255, 255, 255, 0.08);
    }
    .rule .src {
      margin-left: 6px;
      color: var(--muted);
      font-size: 11px;
    }
    .buffs {
      margin-top: 8px;
      border-top: 1px solid var(--border);
      padding-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .buff {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .buff img {
      width: 22px;
      height: 22px;
      flex: none;
    }
    .buff-name {
      margin-right: 10px;
    }
    .effects {
      white-space: pre-wrap;
      color: var(--muted);
      font-size: 12px;
    }
  `,
})
export class EntityTooltip {
  readonly tips = inject(TooltipService);
  private data = inject(DataService);
  readonly seconds = seconds;

  readonly pos = computed(() => {
    const s = this.tips.state();
    if (!s) return { x: 0, y: 0 };
    const w = 380;
    const h = Math.min(520, window.innerHeight - 16);
    const x = s.x + 16 + w > window.innerWidth ? Math.max(4, s.x - w - 12) : s.x + 16;
    const y = s.y + 12 + h > window.innerHeight ? Math.max(4, window.innerHeight - h - 8) : s.y + 12;
    return { x, y };
  });

  gearSubtitle(g: GearView): string {
    const parts: string[] = [];
    if (g.special) parts.push(specialKind(g.special));
    else if (g.weapon) parts.push(g.weapon.slot === '2h' ? 'Two-handed' : g.weapon.slot === 'shield' ? 'Shield' : g.weapon.slot === 'main' ? 'Main hand' : 'Off-hand');
    else if (g.gear) parts.push(g.gear.slot.charAt(0).toUpperCase() + g.gear.slot.slice(1) + (g.gear.type ? ' · ' + g.gear.type : ''));
    if (g.tier) parts.push('tier ' + g.tier);
    if (g.style) parts.push(g.style);
    if (g.gizmoSlots && (g.weapon || g.gear?.augmentable)) parts.push('augmentable');
    return parts.join(' · ');
  }

  specName(id: string): string {
    return this.data.specById().get(id)?.name ?? id;
  }

  /** all gizmos of an item on one line: "Precise 6, Equilibrium 4 | Aftershock 4 (ancient)" – null when it holds none */
  perkLine(g: GearView): string | null {
    const gizmos = (g.ref.gizmos ?? []).filter((gz) => gz.perks.length);
    if (!gizmos.length) return null;
    return gizmos.map((gz) => this.perkList(gz) + (gz.ancient ? ' (ancient)' : '')).join(' | ');
  }

  perkList(g: { perks: { perk: string; rank: number }[] }): string {
    if (!g.perks.length) return 'empty';
    return g.perks.map((p) => (this.data.perkById().get(p.perk)?.name ?? p.perk) + ' ' + p.rank).join(', ');
  }

  /** the wiki text without its "(With <item> equipped)" variants – the INTERACTIONS block below says the same, shorter */
  describe(text: string | null | undefined): string {
    if (!text) return '';
    const i = text.search(/^\s*\(With /m);
    return (i >= 0 ? text.slice(0, i) : text).trim();
  }

  subtitle(e: Entity): string {
    if (e.ability) return (e.ability.basicAttack ? 'Auto-attack' : e.ability.type) + ' · ' + e.ability.style;
    if (e.prayer) return (e.prayer.book === 'Curses' ? 'Ancient curse' : 'Prayer') + ' · level ' + e.prayer.level;
    if (e.special) return specialKind(e.special);
    if (e.weapon) return 'Weapon switch · ' + e.weapon.style;
    if (e.spell) return (e.spell.kind === 'autocast' ? 'Auto-cast spell · ' : 'Spell · ') + SPELLBOOK_NAMES[e.spell.book] + ' · level ' + e.spell.level;
    return '';
  }

  bookName(book: keyof typeof SPELLBOOK_NAMES): string {
    return SPELLBOOK_NAMES[book];
  }

  adrenaline(v: number | null): string {
    if (v === null) return 'unknown';
    return (v > 0 ? '+' : '') + v + '%';
  }

  buffsOf(ids: number[]): Buff[] {
    const m = this.data.buffById();
    return ids.map((id) => m.get(id)).filter((b): b is Buff => !!b);
  }

  /** interaction rules of an ability, split into text + wiki link */
  notes(abilityId: string): Note[] {
    return splitNotes(ruleFor(abilityId)?.notes);
  }

  /** interaction rules of a potion / bomb / device (rules-consumables.ts) */
  specialNotes(specialId: string): Note[] {
    return splitNotes(specialRuleFor(specialId)?.notes);
  }

  firstLine(s: string): string {
    return s.split('\n')[0].replace(/^\*\s*/, '');
  }
}

function splitNotes(notes: string[] | undefined): Note[] {
  return (notes ?? []).map((n) => {
    const m = n.match(/\((https?:\/\/\S+)\s*\)\s*$/);
    return m ? { text: n.slice(0, m.index).trim(), url: m[1] } : { text: n, url: null };
  });
}

/** subtitle of a specials.json item: "Adrenaline potion", "Powerburst", "Bomb", "Device" */
function specialKind(s: Special): string {
  if (s.kind === 'bomb') return 'Bomb';
  if (s.kind === 'device') return 'Device';
  return s.adrenaline || s.adrenalineOverTime ? 'Adrenaline potion' : s.id.startsWith('powerburst') ? 'Powerburst' : 'Potion';
}

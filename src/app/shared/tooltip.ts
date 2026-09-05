import { Component, Directive, ElementRef, HostListener, Injectable, computed, inject, input, signal } from '@angular/core';
import { DataService, Entity, GearView } from '../core/data.service';
import { Buff, SPELLBOOK_NAMES, Special } from '../core/models';
import { ruleFor, specialRuleFor } from '../engine/rules';
import { TICK_MS } from '../engine/trainer-engine';

interface TipState {
  entity?: Entity;
  /** the rotation step's imported note ("Bloodlust", "asap") – shown under the name */
  hint?: string;
  /** an equipment item (gear panel) instead of an entity */
  gear?: GearView;
  x: number;
  y: number;
  /** opened by touch: a bottom sheet with a close button that stays until dismissed (links work, text scrolls) */
  pinned?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TooltipService {
  readonly state = signal<TipState | null>(null);
  /** a pointer drag is in flight (bars editor, gear drag): the long-press tooltip stays away */
  dragging = false;
}

/** how long a finger has to rest on an icon before the details sheet opens (touch devices) */
const LONG_PRESS_MS = 350;
/** a long press released before the sheet was up this long is a slightly long tap – the tap's click goes through */
const PRESS_SHOWN_MS = 150;
/** emulated mouse / focus events arriving this soon after a touch are ignored */
const TOUCH_SHADOW_MS = 1500;
/** hosts that do something on a tap (press a slot, add to a bar, toggle, switch a weapon …): only a long press opens the sheet there */
const PRESSABLE_HOST = 'button, a, label, input, [role="button"], [tabindex], .cell, .weapon, .item';
const PRESSABLE_ANCESTOR = 'button, a, label, [role="button"]';

/**
 * Hover tooltip on mouse devices. On touch devices the details open as a pinned bottom sheet (close button,
 * scrollable, links usable): with a long press anywhere, and with a plain tap on icons that do nothing else on
 * a tap (`tipTap`: 'auto' = the host is not a button / link / slot …). A tap on a bar slot stays a press.
 * The emulated mouse events a tap produces are ignored.
 */
@Directive()
abstract class TipBase {
  protected tips = inject(TooltipService);
  protected host = inject(ElementRef<HTMLElement>);
  /** touch: a plain tap opens the details sheet – 'auto': unless the host reacts to taps itself (see PRESSABLE_HOST) */
  readonly tipTap = input<boolean | 'auto'>('auto');
  protected lastTouch = 0;
  private timer = 0;
  private pressed = false;
  private shownAt = 0;
  private moved = false;

  protected abstract stateAt(x: number, y: number): TipState | null;

  /** pointer held down on the host (a drag is starting) – nothing is shown until it is released */
  private pointerDown = false;

  @HostListener('pointerdown')
  onPointerDown(): void {
    this.pointerDown = true;
    if (!this.tips.state()?.pinned) this.tips.state.set(null);
    window.addEventListener('pointerup', () => (this.pointerDown = false), { once: true });
    window.addEventListener('pointercancel', () => (this.pointerDown = false), { once: true });
  }

  @HostListener('mouseenter', ['$event'])
  @HostListener('mousemove', ['$event'])
  show(e: MouseEvent): void {
    if (this.pointerDown || Date.now() - this.lastTouch < TOUCH_SHADOW_MS || this.tips.state()?.pinned) return;
    const s = this.stateAt(e.clientX, e.clientY);
    if (s) this.tips.state.set(s);
  }

  @HostListener('mouseleave')
  hide(): void {
    if (!this.tips.state()?.pinned) this.tips.state.set(null);
  }

  private tapOpens(): boolean {
    const t = this.tipTap();
    if (t !== 'auto') return t;
    const el = this.host.nativeElement;
    return !el.matches(PRESSABLE_HOST) && !el.parentElement?.closest(PRESSABLE_ANCESTOR);
  }

  private openSheet(x: number, y: number): boolean {
    if (this.tips.dragging) return false;
    const s = this.stateAt(x, y);
    if (!s) return false;
    this.tips.state.set({ ...s, pinned: true });
    return true;
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    this.lastTouch = Date.now();
    this.pressed = false;
    this.moved = false;
    const t = e.touches[0];
    if (!t) return;
    const x = t.clientX;
    const y = t.clientY;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      if (this.openSheet(x, y)) {
        this.pressed = true;
        this.shownAt = Date.now();
      }
    }, LONG_PRESS_MS);
  }

  @HostListener('touchmove')
  onTouchMove(): void {
    window.clearTimeout(this.timer); // scrolling is not a press
    this.moved = true;
  }

  @HostListener('touchend', ['$event'])
  @HostListener('touchcancel', ['$event'])
  onTouchEnd(e: TouchEvent): void {
    window.clearTimeout(this.timer);
    this.lastTouch = Date.now();
    if (this.pressed) {
      this.pressed = false;
      if (Date.now() - this.shownAt >= PRESS_SHOWN_MS) {
        e.preventDefault(); // the long press was for the sheet – it stays, no click
      } else {
        this.tips.state.set(null); // a slightly long tap: no sheet, the click goes through
      }
      return;
    }
    if (e.type !== 'touchend' || this.moved || !this.tapOpens()) return;
    // a tap on a control inside the host (the × on a bars-page slot) is that control's tap, not a request for details
    const inner = (e.target as Element | null)?.closest?.(PRESSABLE_ANCESTOR + ', input, select, textarea');
    if (inner && inner !== this.host.nativeElement && this.host.nativeElement.contains(inner)) return;
    const t = e.changedTouches[0];
    if (t && this.openSheet(t.clientX, t.clientY)) e.preventDefault(); // no emulated mouse events / click for the tap
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
  /** rotation-step note to show in the tooltip (not on the icon itself) */
  readonly tipHint = input<string | null | undefined>(null);
  private data = inject(DataService);

  private resolve(): Entity | undefined {
    const v = this.entityTip();
    if (!v) return undefined;
    return typeof v === 'string' ? this.data.get(v) : v;
  }

  protected stateAt(x: number, y: number): TipState | null {
    const entity = this.resolve();
    return entity ? { entity, hint: this.tipHint() ?? undefined, x, y } : null;
  }

  @HostListener('focus')
  focus(): void {
    if (Date.now() - this.lastTouch < TOUCH_SHADOW_MS || this.tips.state()?.pinned) return; // a tap focuses the slot – no tooltip for that
    const entity = this.resolve();
    const r = this.host.nativeElement.getBoundingClientRect();
    if (entity) this.tips.state.set({ entity, hint: this.tipHint() ?? undefined, x: r.right, y: r.top });
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
      @if (s.pinned) {
        <!-- touch: the details are a bottom sheet; a tap outside or the × closes it -->
        <div class="tip-backdrop" (click)="close()"></div>
      }
      <div
        class="tip"
        [class.pinned]="s.pinned"
        [style.left.px]="s.pinned ? null : pos().x"
        [style.top.px]="s.pinned ? null : pos().y"
        [attr.role]="s.pinned ? 'dialog' : null"
        [attr.aria-label]="s.pinned ? (s.entity?.name ?? s.gear?.name ?? 'Details') : null"
      >
        @if (s.pinned) {
          <button class="close" type="button" (click)="close()" aria-label="Close">×</button>
        }
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
            @if (s.hint) { <div class="step-hint">{{ s.hint }}</div> }
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
        } @else if (e.spec; as sp) {
          <!-- the bar shows the game's generic special-attack icon; the weapons it belongs to are listed here -->
          <div class="spec-weapons">
            @for (w of sp.weapons; track $index) {
              <span class="spec-weapon">@if (sp.weaponIcons[$index]) { <img [src]="sp.weaponIcons[$index]" alt="" /> }{{ w }}</span>
            }
          </div>
          <table>
            @if (sp.adrenaline !== null) { <tr><th>Adrenaline</th><td class="bad">−{{ sp.adrenaline }}%</td></tr> }
            @if (sp.cooldownTicks) { <tr><th>Cooldown</th><td>{{ seconds(sp.cooldownTicks) }}</td></tr> }
            @if (sp.damageText && sp.damageText !== 'None' && sp.damageText !== 'N/A') { <tr><th>Damage</th><td>{{ sp.damageText }}</td></tr> }
            <tr><th>Target</th><td>{{ sp.target }}{{ sp.channelled ? ' · channelled' : '' }}</td></tr>
            <tr><th>GCD</th><td [class]="sp.ignoresGcd ? 'warn' : ''">{{ sp.ignoresGcd ? 'off the global cooldown' : 'yes' }}</td></tr>
            @if (sp.eof.storable === true) { <tr><th>Essence of Finality</th><td>storable{{ sp.eof.notes ? ' – ' + sp.eof.notes : '' }}</td></tr> }
          </table>
          <p class="desc">{{ describe(sp.description) }}</p>
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
    /* touch: pinned bottom sheet – scrollable, the wiki links can be tapped */
    .tip-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99;
      background: rgba(0, 0, 0, 0.45);
    }
    .tip.pinned {
      left: 8px;
      right: 8px;
      top: auto;
      bottom: 8px;
      width: auto;
      max-width: 520px;
      margin: 0 auto;
      max-height: 70vh;
      max-height: 70dvh;
      overflow-y: auto;
      overscroll-behavior: contain;
      pointer-events: auto;
      padding-bottom: calc(12px + env(safe-area-inset-bottom));
      font-size: 14px;
    }
    .close {
      position: sticky;
      top: 0;
      float: right;
      width: 36px;
      height: 36px;
      margin: -4px -6px 0 8px;
      padding: 0;
      border: 1px solid var(--border);
      border-radius: 50%;
      background: #26231c;
      color: var(--text);
      font: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
    }
    .tip.pinned .desc,
    .tip.pinned .rule,
    .tip.pinned .effects {
      font-size: 13px;
    }
    .tip.pinned .rule .src {
      display: inline-block;
      padding: 4px 8px;
      font-size: 12px;
      color: var(--gold);
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
    .spec-weapons {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 10px;
      margin: 0 0 8px;
      font-size: 12px;
    }
    .spec-weapon {
      display: inline-flex;
      align-items: center;
      gap: 4px;

      img {
        width: 18px;
        height: 18px;
      }
    }
    /* the rotation step's note from the PvME import */
    .step-hint {
      margin-top: 3px;
      font-size: 12px;
      color: var(--gold);
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

  close(): void {
    this.tips.state.set(null);
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.tips.state()?.pinned) this.close();
  }

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
    if (e.spec) return 'Weapon special attack · ' + e.spec.style;
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
  if (s.kind === 'scroll') return 'Familiar scroll · ' + s.specialPoints + ' special move points';
  return s.adrenaline || s.adrenalineOverTime ? 'Adrenaline potion' : s.id.startsWith('powerburst') ? 'Powerburst' : 'Potion';
}

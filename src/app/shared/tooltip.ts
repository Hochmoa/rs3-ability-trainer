import { Component, Directive, ElementRef, HostListener, Injectable, computed, inject, input, signal } from '@angular/core';
import { DataService, Entity } from '../core/data.service';
import { Buff } from '../core/models';
import { ruleFor } from '../engine/rules';
import { TICK_MS } from '../engine/trainer-engine';

interface TipState {
  entity: Entity;
  x: number;
  y: number;
}

@Injectable({ providedIn: 'root' })
export class TooltipService {
  readonly state = signal<TipState | null>(null);
}

/** Put on any element: shows the full entity details while hovering. Accepts an Entity or an entity key. */
@Directive({ selector: '[entityTip]' })
export class EntityTip {
  readonly entityTip = input.required<Entity | string | null | undefined>();
  private tips = inject(TooltipService);
  private data = inject(DataService);
  private el = inject(ElementRef<HTMLElement>);

  private resolve(): Entity | undefined {
    const v = this.entityTip();
    if (!v) return undefined;
    return typeof v === 'string' ? this.data.get(v) : v;
  }

  @HostListener('mouseenter', ['$event'])
  @HostListener('mousemove', ['$event'])
  show(e: MouseEvent): void {
    const entity = this.resolve();
    if (entity) this.tips.state.set({ entity, x: e.clientX, y: e.clientY });
  }

  @HostListener('mouseleave')
  hide(): void {
    this.tips.state.set(null);
  }

  @HostListener('focus')
  focus(): void {
    const entity = this.resolve();
    const r = this.el.nativeElement.getBoundingClientRect();
    if (entity) this.tips.state.set({ entity, x: r.right, y: r.top });
  }

  @HostListener('blur')
  blur(): void {
    this.hide();
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
        <div class="head">
          <img [src]="s.entity.icon" [alt]="s.entity.name" />
          <div>
            <div class="name">{{ s.entity.name }}</div>
            <div class="sub">{{ subtitle(s.entity) }}</div>
          </div>
        </div>
        @if (s.entity.ability; as a) {
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
          <p class="desc">{{ a.description }}</p>
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
                    <b>{{ b.name }}</b> <span class="muted">{{ b.kind }}{{ b.duration ? ' · ' + firstLine(b.duration) : '' }}</span>
                    @if (b.effects) { <div class="effects">{{ b.effects }}</div> }
                  </div>
                </div>
              }
            </div>
          }
        } @else if (s.entity.prayer; as p) {
          <table>
            <tr><th>Level</th><td>{{ p.level }}</td></tr>
            @if (p.drainPerHour) { <tr><th>Drain</th><td>{{ p.drainPerHour }} points / hour</td></tr> }
            @if (p.adrenaline) { <tr><th>Adrenaline</th><td>{{ p.adrenaline > 0 ? '+' : '' }}{{ p.adrenaline }}%</td></tr> }
            <tr><th>GCD</th><td class="warn">off the global cooldown</td></tr>
          </table>
          @if (p.effect) { <p class="desc">{{ p.effect }}</p> }
          <p class="desc muted">{{ p.description }}</p>
        } @else if (s.entity.weapon; as w) {
          <table>
            <tr><th>Style</th><td>{{ w.style }}</td></tr>
            <tr><th>GCD</th><td class="warn">instant – switching gear does not use a tick</td></tr>
          </table>
          <p class="desc">Wield your {{ w.style }} weapon. Abilities of other styles are greyed out until you switch back; Defence and Constitution abilities work with any weapon.</p>
        } @else if (s.entity.special; as sp) {
          <table>
            <tr><th>Adrenaline</th><td class="good">{{ sp.adrenaline ? '+' + sp.adrenaline + '%' : '' }}{{ sp.adrenalineOverTime ? '+' + sp.adrenalineOverTime + '% over ' + seconds(sp.overTimeTicks) : '' }}</td></tr>
            <tr><th>Cooldown</th><td>{{ seconds(sp.cooldownTicks) }} (shared)</td></tr>
            <tr><th>Herblore</th><td>{{ sp.level }}</td></tr>
            <tr><th>GCD</th><td class="warn">off the global cooldown</td></tr>
          </table>
          <p class="desc">{{ sp.description }}</p>
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

  subtitle(e: Entity): string {
    if (e.ability) return (e.ability.basicAttack ? 'Auto-attack' : e.ability.type) + ' · ' + e.ability.style + ' · level ' + e.ability.level + (e.ability.members ? '' : ' · free to play');
    if (e.prayer) return (e.prayer.book === 'Curses' ? 'Ancient curse' : 'Prayer') + ' · level ' + e.prayer.level;
    if (e.special) return 'Adrenaline potion';
    if (e.weapon) return 'Weapon switch · ' + e.weapon.style;
    return '';
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
    return (ruleFor(abilityId)?.notes ?? []).map((n) => {
      const m = n.match(/\((https?:\/\/\S+)\s*\)\s*$/);
      return m ? { text: n.slice(0, m.index).trim(), url: m[1] } : { text: n, url: null };
    });
  }

  firstLine(s: string): string {
    return s.split('\n')[0].replace(/^\*\s*/, '');
  }
}

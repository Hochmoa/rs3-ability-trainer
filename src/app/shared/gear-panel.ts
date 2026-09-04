import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, output } from '@angular/core';
import { DataService, GearView } from '../core/data.service';
import { EquipSlot, Equipment, GEAR_SLOTS, GearSlot, INVENTORY_SIZE, ItemRef, SLOT_NAMES } from '../core/models';
import { GearDragService } from './gear-drag';
import { GearTip } from './tooltip';

/** slots drawn in the panel – aura and sigil left the game, old loadouts may still carry them (ignored) */
const PANEL_SLOTS: GearSlot[] = GEAR_SLOTS.filter((g) => g !== 'aura' && g !== 'sigil');

/** Where a dragged item comes from. */
export type GearSource = { kind: 'catalog' } | { kind: 'inv'; index: number } | { kind: 'equip'; slot: EquipSlot };

/** Payload of every drag in the gear panel / catalog: the item and where it came from. */
export interface GearDrag {
  ref: ItemRef;
  from: GearSource;
}

/** What the user did in the panel; the page applies it with core/equipment.ts. */
export type GearAction =
  | { kind: 'drop-equip'; drag: GearDrag; slot: EquipSlot }
  | { kind: 'drop-inv'; drag: GearDrag; index: number }
  | { kind: 'click'; ref: ItemRef; from: GearSource }
  | { kind: 'menu'; ref: ItemRef; from: GearSource; x: number; y: number };

interface Cell {
  slot: EquipSlot;
  gear: GearSlot;
  ref: ItemRef | null;
  view: GearView | null;
  /** the off-hand while a two-hander is worn */
  blocked: boolean;
}

/**
 * The in-game "Worn Equipment" screen (worn slots in the game's layout, empty slots show the game's slot
 * silhouettes from public/assets/slots) plus the 4 x 7 backpack. Item icons are the wiki's inventory icons
 * and are drawn at their native size (~30 px) in 44 px cells, like in the game.
 * `editable`: items can be dragged between catalog, slots and backpack and right-clicked for a menu.
 * `live`: while training – clicking an item equips / takes off / drinks it; no dragging.
 *
 * Dragging is the pointer-based kind of the action bar editor (shared/gear-drag.ts): cells are drop
 * targets via `data-gear-drop` and receive the drop as a `gear-drop` event; the page's catalog joins
 * the same drag through the GearDragService.
 */
@Component({
  selector: 'gear-panel',
  imports: [GearTip, CdkDropList],
  template: `
    <div class="gear" [class.live]="live()" [class.editable]="editable()">
      <div class="equipment" role="group" aria-label="Worn equipment">
        <!-- the thin lines joining the slots, like in the game -->
        <span class="line v mid"></span>
        <span class="line v left"></span>
        <span class="line v right"></span>
        <span class="line h top"></span>
        <span class="line h arms"></span>
        @for (c of cells(); track c.slot) {
          <div
            class="cell equip"
            [class]="'cell equip slot-' + c.gear + (c.ref ? ' filled' : ' empty') + (c.blocked ? ' blocked' : '') + (isWielded(c) ? ' wielded' : '') + (canDrop(c) ? ' can-drop' : '') + (gearDrag.hover() === 'equip:' + c.gear ? ' hover' : '')"
            [attr.data-slot]="c.gear"
            [attr.data-gear-drop]="canDrop(c) ? 'equip:' + c.gear : null"
            [title]="c.ref ? '' : SLOT_NAMES[c.gear]"
            [gearTip]="c.view"
            [id]="'equip-' + c.gear"
            (gear-drop)="onDropEquip($event, c)"
            (click)="clickCell(c)"
            (contextmenu)="menuCell($event, c)"
          >
            @if (c.ref && c.view) {
              <div class="item" [class.dragging]="gearDrag.isSource('equip', c.slot)" (pointerdown)="startDrag($event, c.ref, { kind: 'equip', slot: c.slot }, c.view)">
                @if (c.view.icon) { <img [src]="c.view.icon" [alt]="c.view.name" draggable="false" /> } @else { <span class="noicon">{{ c.view.name.slice(0, 3) }}</span> }
                @if (c.ref.gizmos?.length) { <span class="badge perk" title="augmented">✦</span> }
                @if (c.ref.spec) { <span class="badge spec" title="stored special attack">S</span> }
              </div>
            } @else if (c.ref) {
              <span class="noicon unknown" title="unknown item">?</span>
            }
          </div>
        }
      </div>
      <div class="inventory" role="group" aria-label="Backpack">
        @for (v of inv(); track $index) {
          <div
            class="cell inv"
            [class]="'cell inv' + (v ? ' filled' : ' empty') + (v && usable() && !usable()!(v.ref) ? ' unusable' : '') + (canDropInv() ? ' can-drop' : '') + (gearDrag.hover() === 'inv:' + $index ? ' hover' : '')"
            [gearTip]="v"
            [attr.data-gear-drop]="canDropInv() ? 'inv:' + $index : null"
            [id]="'inv-' + $index"
            cdkDropList
            cdkDropListSortingDisabled
            [cdkDropListDisabled]="!cdkDrops()"
            (cdkDropListDropped)="onCdkDrop($event, $index)"
            (gear-drop)="onDropInv($event, $index)"
            (click)="clickInv($index)"
            (contextmenu)="menuInv($event, $index)"
          >
            @if (v) {
              <div class="item" [class.dragging]="gearDrag.isSource('inv', $index)" (pointerdown)="startDrag($event, v.ref, { kind: 'inv', index: $index }, v)">
                @if (v.icon) { <img [src]="v.icon" [alt]="v.name" draggable="false" /> } @else { <span class="noicon">{{ v.name.slice(0, 3) }}</span> }
                @if (v.ref.gizmos?.length) { <span class="badge perk" title="augmented">✦</span> }
                @if (v.ref.spec) { <span class="badge spec" title="stored special attack">S</span> }
                @if (keyOf()(v.ref)) { <span class="key">{{ keyOf()(v.ref) }}</span> }
              </div>
            } @else if (inventory()[$index]) {
              <span class="noicon unknown" title="unknown item">?</span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      /* one square size everywhere (desktop + phone): a 32 px wiki icon sits centred with a small margin */
      --cell: 44px;
      --gap: 4px;
      --stone: #3b362c;
      --stone-light: #5a5344;
      --stone-dark: #14120e;
      --slot-bg: #0b0b0d;
      --slot-border: #34302a;
      --line: #3a362d;
    }
    .gear {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    /* stone-framed panels like the game's interface windows */
    .equipment,
    .inventory {
      box-sizing: border-box;
      padding: 10px;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.04), transparent 60%),
        linear-gradient(#232019, #15130f);
      border: 2px solid var(--stone);
      border-radius: 5px;
      box-shadow:
        inset 0 0 0 1px var(--stone-dark),
        inset 0 0 0 2px var(--stone-light),
        inset 0 0 0 3px var(--stone-dark),
        0 2px 6px rgba(0, 0, 0, 0.5);
    }
    .equipment {
      position: relative;
      display: grid;
      grid-template-columns: repeat(3, var(--cell));
      grid-template-rows: repeat(5, var(--cell));
      gap: 8px 12px;
      justify-content: center;
      /* the game's Worn Equipment window: pocket beside the head; aura and sigil slots are gone */
      grid-template-areas:
        '. head pocket'
        'cape neck ammo'
        'mainHand body offHand'
        '. legs .'
        'hands feet ring';
    }
    .inventory {
      display: grid;
      grid-template-columns: repeat(4, var(--cell));
      grid-auto-rows: var(--cell);
      gap: var(--gap);
      justify-content: center;
    }
    .cell {
      position: relative;
      z-index: 1;
      box-sizing: border-box;
      width: var(--cell);
      height: var(--cell);
      background: var(--slot-bg);
      border: 1px solid var(--slot-border);
      border-radius: 3px;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    /* empty worn slots show the game's silhouette of what goes there */
    .equip::before {
      content: '';
      position: absolute;
      inset: 0;
      background: center / 32px 32px no-repeat;
      opacity: 0;
      transition: opacity 0.15s;
      pointer-events: none;
    }
    .equip.empty::before {
      opacity: 0.55;
    }
    .equip.empty:hover::before {
      opacity: 0.8;
    }
    .equip.slot-head::before { background-image: url('/assets/slots/head.png'); }
    .equip.slot-cape::before { background-image: url('/assets/slots/cape.png'); }
    .equip.slot-neck::before { background-image: url('/assets/slots/neck.png'); }
    .equip.slot-ammo::before { background-image: url('/assets/slots/ammo.png'); }
    .equip.slot-mainHand::before { background-image: url('/assets/slots/mainHand.png'); }
    .equip.slot-body::before { background-image: url('/assets/slots/body.png'); }
    .equip.slot-offHand::before { background-image: url('/assets/slots/offHand.png'); }
    .equip.slot-legs::before { background-image: url('/assets/slots/legs.png'); }
    .equip.slot-hands::before { background-image: url('/assets/slots/hands.png'); }
    .equip.slot-feet::before { background-image: url('/assets/slots/feet.png'); }
    .equip.slot-ring::before { background-image: url('/assets/slots/ring.png'); }
    .equip.slot-pocket::before { background-image: url('/assets/slots/pocket.png'); }
    .equip.slot-head { grid-area: head; }
    .equip.slot-cape { grid-area: cape; }
    .equip.slot-neck { grid-area: neck; }
    .equip.slot-ammo { grid-area: ammo; }
    .equip.slot-mainHand { grid-area: mainHand; }
    .equip.slot-body { grid-area: body; }
    .equip.slot-offHand { grid-area: offHand; }
    .equip.slot-legs { grid-area: legs; }
    .equip.slot-hands { grid-area: hands; }
    .equip.slot-feet { grid-area: feet; }
    .equip.slot-ring { grid-area: ring; }
    .equip.slot-pocket { grid-area: pocket; }
    /* connecting lines: centre column head..feet, outer columns cape..hands / ammo..ring, and the two cross bars */
    .line {
      display: block;
      z-index: 0;
      background: var(--line);
      pointer-events: none;
    }
    .line.v {
      width: 2px;
      justify-self: center;
    }
    .line.h {
      height: 2px;
      align-self: center;
    }
    .line.mid { grid-column: 2; grid-row: 1 / 6; }
    .line.left { grid-column: 1; grid-row: 2 / 6; }
    .line.right { grid-column: 3; grid-row: 2 / 6; }
    .line.top { grid-column: 1 / 4; grid-row: 2; }
    .line.arms { grid-column: 1 / 4; grid-row: 3; }
    /* while something is being dragged, the empty cells that can take it get a dashed border */
    .editable .cell.empty.can-drop {
      border-style: dashed;
    }
    .cell.blocked {
      opacity: 0.35;
      border-style: dotted;
    }
    .cell.wielded {
      border-color: var(--gold);
      box-shadow: inset 0 0 6px rgba(201, 162, 39, 0.5);
    }
    /* every cell that could take the dragged item (pointer drag from shared/gear-drag.ts) */
    .cell.can-drop {
      border-color: var(--gold);
      background: rgba(201, 162, 39, 0.15);
      box-shadow: inset 0 0 6px rgba(201, 162, 39, 0.35);
    }
    .cell.can-drop::before {
      opacity: 0.9;
    }
    /* the cell under the pointer: this is where the drop lands */
    .cell.inv.cdk-drop-list-receiving,
    .cell.inv.cdk-drop-list-dragging {
      border-color: var(--gold);
      background: rgba(201, 162, 39, 0.15);
    }
    .cell.hover {
      border-color: #ffe27a;
      background: rgba(255, 226, 122, 0.35);
      box-shadow: 0 0 0 2px #ffe27a, 0 0 12px #ffe27a;
      transform: scale(1.08);
      z-index: 1;
    }
    .item {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    }
    .editable .item {
      touch-action: none;
      user-select: none;
    }
    /* the item being dragged stays in place, dimmed, until the drop */
    .item.dragging {
      opacity: 0.4;
    }
    .live .item {
      cursor: pointer;
    }
    .live .cell.empty {
      cursor: default;
    }
    /* wiki inventory icons are ~30 px: draw them 1:1, never upscaled (blurry) */
    .item img {
      display: block;
      width: auto;
      height: auto;
      max-width: calc(var(--cell) - 6px);
      max-height: calc(var(--cell) - 6px);
      pointer-events: none;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.8));
    }
    .live .cell.filled:hover .item img,
    .editable .cell.filled:hover .item img {
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.8)) brightness(1.25);
    }
    .cell.unusable .item img {
      filter: grayscale(1) brightness(0.45);
    }
    .noicon {
      font-size: 10px;
      color: var(--muted);
      text-transform: uppercase;
    }
    .badge {
      position: absolute;
      top: 1px;
      right: 2px;
      font-size: 9px;
      line-height: 1;
      padding: 1px 2px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.7);
      color: #ffe27a;
      pointer-events: none;
    }
    .badge.spec {
      top: auto;
      bottom: 1px;
      right: 2px;
      color: #8fd3ff;
      font-weight: 700;
    }
    .key {
      position: absolute;
      left: 1px;
      bottom: 1px;
      font-size: 9px;
      line-height: 1;
      padding: 1px 3px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.75);
      color: #ffe27a;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
    }
  `,
})
export class GearPanel {
  readonly data = inject(DataService);
  readonly gearDrag = inject(GearDragService);
  readonly equipment = input.required<Equipment>();
  readonly inventory = input.required<(ItemRef | null)[]>();
  readonly editable = input(false);
  readonly live = input(false);
  /** backpack cells take CDK drops from the page (the "missing abilities" list, bar slots) – emitted as `cdkDrop` */
  readonly cdkDrops = input(false);
  /** items can be dragged out of the panel onto `data-gear-drop` targets elsewhere on the page (bar slots) even when not editable */
  readonly dragOut = input(false);
  /** live mode: whether an inventory item can be used right now (potions not on cooldown …); missing = all */
  readonly usable = input<((ref: ItemRef) => boolean) | null>(null);
  /** live mode: key label shown on carried weapons */
  readonly keyOf = input<(ref: ItemRef) => string>(() => '');
  readonly action = output<GearAction>();
  /** a CDK drag (data of the dragged item) was dropped on backpack cell `index` */
  readonly cdkDrop = output<{ index: number; data: unknown }>();

  readonly SLOT_NAMES = SLOT_NAMES;

  readonly cells = computed<Cell[]>(() => {
    const eq = this.equipment();
    const two = eq.twoHand ?? null;
    return PANEL_SLOTS.map((gear) => {
      let slot: EquipSlot = gear;
      let ref = eq[gear] ?? null;
      let blocked = false;
      if (gear === 'mainHand' && two) {
        slot = 'twoHand';
        ref = two;
      }
      if (gear === 'offHand' && two) blocked = true;
      return { slot, gear, ref, view: ref ? this.data.view(ref) : null, blocked };
    });
  });

  readonly inv = computed<(GearView | null)[]>(() => {
    const list = this.inventory();
    return Array.from({ length: INVENTORY_SIZE }, (_, i) => (list[i] ? this.data.view(list[i]!) : null));
  });

  dragOf(ref: ItemRef, from: GearSource): GearDrag {
    return { ref, from };
  }

  isWielded(c: Cell): boolean {
    return this.live() && (c.gear === 'mainHand' || c.gear === 'offHand') && !!c.ref;
  }

  /** pointerdown on a worn / carried item: starts the pointer drag (editable panels only) */
  startDrag(ev: PointerEvent, ref: ItemRef, from: GearSource, view: GearView): void {
    if (!this.editable() && !this.dragOut()) return;
    this.gearDrag.start(ev, this.dragOf(ref, from), view);
  }

  onCdkDrop(event: CdkDragDrop<unknown>, index: number): void {
    this.cdkDrop.emit({ index, data: event.item.data });
  }

  /** a slot accepts an item of its own kind only (the game refuses the rest) */
  acceptsEquip(c: Cell, d: GearDrag): boolean {
    const slot = this.data.slotOf(d.ref);
    if (!slot) return false;
    if (c.gear === 'mainHand') return slot === 'mainHand' || slot === 'twoHand';
    return slot === c.gear;
  }

  /** this worn slot could take the item being dragged right now */
  canDrop(c: Cell): boolean {
    const d = this.gearDrag.drag();
    return !!d && this.editable() && !c.blocked && d.from.kind !== 'equip' && this.acceptsEquip(c, d);
  }

  /** the backpack takes anything while an editable panel is dragged over */
  canDropInv(): boolean {
    return this.editable() && !!this.gearDrag.drag();
  }

  onDropEquip(e: Event, c: Cell): void {
    const d = (e as CustomEvent<GearDrag>).detail;
    if (!d) return;
    const slot = this.data.slotOf(d.ref);
    if (!slot) return;
    this.action.emit({ kind: 'drop-equip', drag: d, slot });
  }

  onDropInv(e: Event, index: number): void {
    const d = (e as CustomEvent<GearDrag>).detail;
    if (!d) return;
    this.action.emit({ kind: 'drop-inv', drag: d, index });
  }

  clickCell(c: Cell): void {
    if (!c.ref || c.blocked || this.gearDrag.suppressClick) return;
    this.action.emit({ kind: 'click', ref: c.ref, from: { kind: 'equip', slot: c.slot } });
  }

  clickInv(i: number): void {
    if (this.gearDrag.suppressClick) return;
    const ref = this.inventory()[i];
    if (ref) this.action.emit({ kind: 'click', ref, from: { kind: 'inv', index: i } });
  }

  menuCell(e: MouseEvent, c: Cell): void {
    if (!c.ref || c.blocked) return;
    e.preventDefault();
    this.action.emit({ kind: 'menu', ref: c.ref, from: { kind: 'equip', slot: c.slot }, x: e.clientX, y: e.clientY });
  }

  menuInv(e: MouseEvent, i: number): void {
    const ref = this.inventory()[i];
    if (!ref) return;
    e.preventDefault();
    this.action.emit({ kind: 'menu', ref, from: { kind: 'inv', index: i }, x: e.clientX, y: e.clientY });
  }
}

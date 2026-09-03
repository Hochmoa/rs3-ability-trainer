import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, output } from '@angular/core';
import { DataService, GearView } from '../core/data.service';
import { EquipSlot, Equipment, GEAR_SLOTS, GearSlot, INVENTORY_SIZE, ItemRef, SLOT_NAMES } from '../core/models';
import { GearTip } from './tooltip';

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
 * The in-game equipment screen (worn slots in the game's layout) plus the 28-slot backpack.
 * `editable`: items can be dragged between catalog, slots and backpack and right-clicked for a menu.
 * `live`: while training – clicking an item equips / takes off / drinks it; no dragging.
 */
@Component({
  selector: 'gear-panel',
  imports: [CdkDropList, CdkDrag, GearTip],
  template: `
    <div class="gear" [class.live]="live()" [class.editable]="editable()">
      <div class="equipment">
        @for (c of cells(); track c.slot) {
          <div
            class="cell equip"
            [class]="'cell equip slot-' + c.gear + (c.ref ? ' filled' : ' empty') + (c.blocked ? ' blocked' : '') + (isWielded(c) ? ' wielded' : '')"
            [attr.data-slot]="c.gear"
            [title]="c.ref ? '' : SLOT_NAMES[c.gear]"
            [gearTip]="c.view"
            cdkDropList
            cdkDropListSortingDisabled
            [cdkDropListDisabled]="!editable() || c.blocked"
            [cdkDropListEnterPredicate]="acceptsEquip(c)"
            [id]="'equip-' + c.gear"
            (cdkDropListDropped)="onDropEquip($event, c)"
            (click)="clickCell(c)"
            (contextmenu)="menuCell($event, c)"
          >
            @if (c.ref && c.view) {
              <div class="item" cdkDrag [cdkDragData]="dragOf(c.ref, { kind: 'equip', slot: c.slot })" [cdkDragDisabled]="!editable()">
                @if (c.view.icon) { <img [src]="c.view.icon" [alt]="c.view.name" draggable="false" /> } @else { <span class="noicon">{{ c.view.name.slice(0, 3) }}</span> }
                @if (c.ref.gizmos?.length) { <span class="badge perk" title="augmented">✦</span> }
                @if (c.ref.spec) { <span class="badge spec" title="stored special attack">S</span> }
              </div>
            } @else if (c.ref) {
              <span class="noicon unknown" title="unknown item">?</span>
            } @else {
              <span class="slot-icon">{{ SLOT_ICON[c.gear] }}</span>
            }
          </div>
        }
      </div>
      <div class="inventory">
        @for (v of inv(); track $index) {
          <div
            class="cell inv"
            [class]="'cell inv' + (v ? ' filled' : ' empty') + (v && usable() && !usable()!(v.ref) ? ' unusable' : '')"
            [gearTip]="v"
            cdkDropList
            cdkDropListSortingDisabled
            [cdkDropListDisabled]="!editable()"
            [id]="'inv-' + $index"
            (cdkDropListDropped)="onDropInv($event, $index)"
            (click)="clickInv($index)"
            (contextmenu)="menuInv($event, $index)"
          >
            @if (v) {
              <div class="item" cdkDrag [cdkDragData]="dragOf(v.ref, { kind: 'inv', index: $index })" [cdkDragDisabled]="!editable()">
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
    }
    .gear {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    .equipment {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      padding: 8px;
      background: linear-gradient(#26241d, #16150f);
      border: 1px solid #4a4536;
      border-radius: 6px;
      grid-template-areas:
        'aura head pocket'
        'cape neck ammo'
        'mainHand body offHand'
        'sigil legs .'
        'hands feet ring';
    }
    .inventory {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      padding: 8px;
      background: linear-gradient(#26241d, #16150f);
      border: 1px solid #4a4536;
      border-radius: 6px;
    }
    .cell {
      position: relative;
      aspect-ratio: 1;
      min-width: 0;
      background: #0a0a0c;
      border: 1px solid #3a3730;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
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
    .equip.slot-aura { grid-area: aura; }
    .equip.slot-sigil { grid-area: sigil; }
    .editable .cell.empty {
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
    .cell.cdk-drop-list-receiving,
    .cell.cdk-drop-list-dragging {
      border-color: var(--gold);
      background: rgba(201, 162, 39, 0.15);
    }
    .cell .cdk-drag-placeholder {
      opacity: 0.3;
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
    .live .item {
      cursor: pointer;
    }
    .live .cell.empty {
      cursor: default;
    }
    .item img {
      max-width: 82%;
      max-height: 82%;
      object-fit: contain;
      display: block;
      pointer-events: none;
    }
    .live .cell.filled:hover .item img,
    .editable .cell.filled:hover .item img {
      filter: brightness(1.25);
    }
    .cell.unusable .item img {
      filter: grayscale(1) brightness(0.45);
    }
    .noicon {
      font-size: 10px;
      color: var(--muted);
      text-transform: uppercase;
    }
    .slot-icon {
      font-size: 14px;
      color: #4a4536;
      user-select: none;
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
  readonly equipment = input.required<Equipment>();
  readonly inventory = input.required<(ItemRef | null)[]>();
  readonly editable = input(false);
  readonly live = input(false);
  /** live mode: whether an inventory item can be used right now (potions not on cooldown …); missing = all */
  readonly usable = input<((ref: ItemRef) => boolean) | null>(null);
  /** live mode: key label shown on carried weapons */
  readonly keyOf = input<(ref: ItemRef) => string>(() => '');
  readonly action = output<GearAction>();

  readonly SLOT_NAMES = SLOT_NAMES;
  readonly SLOT_ICON: Record<GearSlot, string> = { head: '⛑', cape: '🧥', neck: '📿', ammo: '➶', mainHand: '⚔', body: '🛡', offHand: '🛡', legs: '👖', hands: '🧤', feet: '👢', ring: '💍', pocket: '📜', aura: '✨', sigil: '◈' };

  readonly cells = computed<Cell[]>(() => {
    const eq = this.equipment();
    const two = eq.twoHand ?? null;
    return GEAR_SLOTS.map((gear) => {
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

  /** a slot accepts an item of its own kind only (the game refuses the rest) */
  acceptsEquip(c: Cell): (drag: CdkDrag<GearDrag>) => boolean {
    return (drag) => {
      const d = drag.data;
      if (!d) return false;
      const slot = this.data.slotOf(d.ref);
      if (!slot) return false;
      if (c.gear === 'mainHand') return slot === 'mainHand' || slot === 'twoHand';
      return slot === c.gear;
    };
  }

  onDropEquip(e: CdkDragDrop<unknown, unknown, GearDrag>, c: Cell): void {
    const d = e.item.data;
    if (!d) return;
    const slot = this.data.slotOf(d.ref);
    if (!slot) return;
    this.action.emit({ kind: 'drop-equip', drag: d, slot });
  }

  onDropInv(e: CdkDragDrop<unknown, unknown, GearDrag>, index: number): void {
    const d = e.item.data;
    if (!d) return;
    this.action.emit({ kind: 'drop-inv', drag: d, index });
  }

  clickCell(c: Cell): void {
    if (!c.ref || c.blocked) return;
    this.action.emit({ kind: 'click', ref: c.ref, from: { kind: 'equip', slot: c.slot } });
  }

  clickInv(i: number): void {
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

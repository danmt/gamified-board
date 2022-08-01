import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  Pipe,
  PipeTransform,
} from '@angular/core';
import {
  ActiveItem,
  Collection,
  Instruction,
  MainDockSlots,
  Option,
} from '../utils';

export interface HotKey {
  slot: number;
  key: string;
}

@Pipe({
  name: 'pgSlotHotkey',
  standalone: true,
  pure: true,
})
export class SlotHotkeyPipe implements PipeTransform {
  transform(slotId: number, hotkeys: HotKey[]): Option<string> {
    const hotkey = hotkeys.find((hotkey) => hotkey.slot === slotId);

    return hotkey?.key ?? null;
  }
}

@Component({
  selector: 'pg-square-button',
  template: `
    <button
      *ngIf="thumbnailUrl !== null; else emptySlot"
      (click)="activate()"
      (mouseover)="onMouseOver()"
      (mouseout)="onMouseOut()"
      [ngClass]="{
        'opacity-80 border-l-gray-500 border-t-gray-400 border-r-gray-600 border-b-gray-700':
          !isActive && !isHovered,
        'opacity-90 border-l-gray-400 border-t-gray-300 border-r-gray-500 border-b-gray-600':
          !isActive && isHovered,
        'opacity-100 border-l-gray-300 border-t-gray-200 border-r-gray-400 border-b-gray-500':
          isActive
      }"
      style="border-width: 0.2rem; margin: 0.12rem"
    >
      <figure>
        <img [src]="thumbnailUrl" class="w-9 h-9 object-cover" />
      </figure>
    </button>

    <ng-template #emptySlot>
      <div class="w-9 h-9"></div>
    </ng-template>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class SquareButtonComponent {
  @Input() buttonId: Option<string> = null;
  @Input() thumbnailUrl: Option<string> = null;
  @Input() isActive = false;
  @Output() activated = new EventEmitter();
  @Output() deactivated = new EventEmitter();
  isHovered = false;

  activate() {
    this.activated.emit();
  }

  deactivate() {
    this.deactivated.emit();
  }

  protected onMouseOver() {
    this.isHovered = true;
  }

  protected onMouseOut() {
    this.isHovered = false;
  }
}

@Component({
  selector: 'pg-main-dock',
  template: `
    <div
      class="w-auto mx-auto p-4 bg-white flex gap-4 justify-center items-start"
    >
      <div>
        <h2>Instructions</h2>

        <div cdkDropListGroup class="flex gap-2 mb-2">
          <div
            id="slot-0"
            cdkDropList
            [cdkDropListData]="slots[0] ? [slots[0]] : []"
            (cdkDropListDropped)="onDropped($event)"
            class="bg-gray-800 relative"
            style="width: 2.89rem; height: 2.89rem"
          >
            <span
              *ngIf="0 | pgSlotHotkey: hotkeys as hotkey"
              class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
              style="font-size: 0.5rem; line-height: 0.5rem"
            >
              {{ hotkey }}
            </span>

            <div cdkDrag [cdkDragData]="slots[0]">
              <pg-square-button
                [isActive]="active?.data === slots[0]"
                [thumbnailUrl]="slots[0]?.thumbnailUrl ?? null"
                (activated)="onActivated(0)"
              ></pg-square-button>

              <div *cdkDragPreview class="bg-gray-500 p-1 rounded-md">
                <img class="w-full h-full" [src]="slots[0]?.thumbnailUrl" />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>

          <div
            id="slot-1"
            cdkDropList
            [cdkDropListData]="slots[1] ? [slots[1]] : []"
            (cdkDropListDropped)="onDropped($event)"
            class="bg-gray-800 relative"
            style="width: 2.89rem; height: 2.89rem"
          >
            <span
              *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
              class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
              style="font-size: 0.5rem; line-height: 0.5rem"
            >
              {{ hotkey }}
            </span>

            <div cdkDrag [cdkDragData]="slots[1]">
              <pg-square-button
                *ngIf="slots[1] !== null"
                [isActive]="active?.data === slots[1]"
                [thumbnailUrl]="slots[1].thumbnailUrl"
                (activated)="onActivated(1)"
              ></pg-square-button>

              <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
                <img class="w-full h-full" [src]="slots[1]?.thumbnailUrl" />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>

          <div
            id="slot-2"
            cdkDropList
            [cdkDropListData]="slots[2] ? [slots[2]] : []"
            (cdkDropListDropped)="onDropped($event)"
            class="bg-gray-800 relative"
            style="width: 2.89rem; height: 2.89rem"
          >
            <span
              *ngIf="2 | pgSlotHotkey: hotkeys as hotkey"
              class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
              style="font-size: 0.5rem; line-height: 0.5rem"
            >
              {{ hotkey }}
            </span>

            <div cdkDrag [cdkDragData]="slots[2]">
              <pg-square-button
                [isActive]="active?.data === slots[2]"
                [thumbnailUrl]="slots[2]?.thumbnailUrl ?? null"
                (activated)="onActivated(2)"
              ></pg-square-button>

              <div *cdkDragPreview class="bg-gray-500 p-1 rounded-md">
                <img class="w-full h-full" [src]="slots[2]?.thumbnailUrl" />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>

          <div
            id="slot-3"
            cdkDropList
            [cdkDropListData]="slots[3] ? [slots[3]] : []"
            (cdkDropListDropped)="onDropped($event)"
            class="bg-gray-800 relative"
            style="width: 2.89rem; height: 2.89rem"
          >
            <span
              *ngIf="3 | pgSlotHotkey: hotkeys as hotkey"
              class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
              style="font-size: 0.5rem; line-height: 0.5rem"
            >
              {{ hotkey }}
            </span>

            <div cdkDrag [cdkDragData]="slots[3]">
              <pg-square-button
                [isActive]="active?.data === slots[3]"
                [thumbnailUrl]="slots[3]?.thumbnailUrl ?? null"
                (activated)="onActivated(3)"
              ></pg-square-button>

              <div *cdkDragPreview class="bg-gray-500 p-1 rounded-md">
                <img class="w-full h-full" [src]="slots[3]?.thumbnailUrl" />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>

          <div
            id="slot-4"
            cdkDropList
            [cdkDropListData]="slots[4] ? [slots[4]] : []"
            (cdkDropListDropped)="onDropped($event)"
            class="bg-gray-800 relative"
            style="width: 2.89rem; height: 2.89rem"
          >
            <span
              *ngIf="4 | pgSlotHotkey: hotkeys as hotkey"
              class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
              style="font-size: 0.5rem; line-height: 0.5rem"
            >
              {{ hotkey }}
            </span>

            <div cdkDrag [cdkDragData]="slots[4]">
              <pg-square-button
                [isActive]="active?.data === slots[4]"
                [thumbnailUrl]="slots[4]?.thumbnailUrl ?? null"
                (activated)="onActivated(4)"
              ></pg-square-button>

              <div *cdkDragPreview class="bg-gray-500 p-1 rounded-md">
                <img class="w-full h-full" [src]="slots[4]?.thumbnailUrl" />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>

          <div
            id="slot-5"
            cdkDropList
            [cdkDropListData]="slots[5] ? [slots[5]] : []"
            (cdkDropListDropped)="onDropped($event)"
            class="bg-gray-800 relative"
            style="width: 2.89rem; height: 2.89rem"
          >
            <span
              *ngIf="5 | pgSlotHotkey: hotkeys as hotkey"
              class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
              style="font-size: 0.5rem; line-height: 0.5rem"
            >
              {{ hotkey }}
            </span>

            <div cdkDrag [cdkDragData]="slots[5]">
              <pg-square-button
                [isActive]="active?.data === slots[5]"
                [thumbnailUrl]="slots[5]?.thumbnailUrl ?? null"
                (activated)="onActivated(5)"
              ></pg-square-button>

              <div *cdkDragPreview class="bg-gray-500 p-1 rounded-md">
                <img class="w-full h-full" [src]="slots[5]?.thumbnailUrl" />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2>Collections</h2>

        <div cdkDropListGroup>
          <div class="flex gap-2 mb-2">
            <div
              id="slot-6"
              cdkDropList
              [cdkDropListData]="slots[6] ? [slots[6]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative"
              style="width: 2.89rem; height: 2.89rem"
            >
              <span
                *ngIf="6 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[6]">
                <pg-square-button
                  *ngIf="slots[6] !== null"
                  [isActive]="active?.data === slots[6]"
                  [thumbnailUrl]="slots[6].thumbnailUrl"
                  (activated)="onActivated(6)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[6]?.thumbnailUrl" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>

            <div
              id="slot-7"
              cdkDropList
              [cdkDropListData]="slots[7] ? [slots[7]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative"
              style="width: 2.89rem; height: 2.89rem"
            >
              <span
                *ngIf="7 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[7]">
                <pg-square-button
                  *ngIf="slots[7] !== null"
                  [isActive]="active?.data === slots[7]"
                  [thumbnailUrl]="slots[7].thumbnailUrl"
                  (activated)="onActivated(7)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[7]?.thumbnailUrl" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>

            <div
              id="slot-8"
              cdkDropList
              [cdkDropListData]="slots[8] ? [slots[8]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative"
              style="width: 2.89rem; height: 2.89rem"
            >
              <span
                *ngIf="8 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[8]">
                <pg-square-button
                  *ngIf="slots[8] !== null"
                  [isActive]="active?.data === slots[8]"
                  [thumbnailUrl]="slots[8].thumbnailUrl"
                  (activated)="onActivated(8)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[8]?.thumbnailUrl" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>
          </div>

          <div class="flex gap-2 mb-2">
            <div
              id="slot-9"
              cdkDropList
              [cdkDropListData]="slots[9] ? [slots[9]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative"
              style="width: 2.89rem; height: 2.89rem"
            >
              <span
                *ngIf="9 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[9]">
                <pg-square-button
                  *ngIf="slots[9] !== null"
                  [isActive]="active?.data === slots[9]"
                  [thumbnailUrl]="slots[9].thumbnailUrl"
                  (activated)="onActivated(9)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[9]?.thumbnailUrl" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>

            <div
              id="slot-10"
              cdkDropList
              [cdkDropListData]="slots[10] ? [slots[10]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative"
              style="width: 2.89rem; height: 2.89rem"
            >
              <span
                *ngIf="10 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[10]">
                <pg-square-button
                  *ngIf="slots[10] !== null"
                  [isActive]="active?.data === slots[10]"
                  [thumbnailUrl]="slots[10].thumbnailUrl"
                  (activated)="onActivated(10)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[10]?.thumbnailUrl" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>

            <div
              id="slot-11"
              cdkDropList
              [cdkDropListData]="slots[11] ? [slots[11]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative"
              style="width: 2.89rem; height: 2.89rem"
            >
              <span
                *ngIf="11 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[11]">
                <pg-square-button
                  *ngIf="slots[11] !== null"
                  [isActive]="active?.data === slots[11]"
                  [thumbnailUrl]="slots[11].thumbnailUrl"
                  (activated)="onActivated(11)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[11]?.thumbnailUrl" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
  ],
  styles: [
    `
      .cdk-drop-list-dragging:hover {
        @apply bg-gray-700;
      }
    `,
  ],
})
export class MainDockComponent {
  @Input() slots: MainDockSlots = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  @Input() hotkeys: HotKey[] = [];
  @Input() active: Option<ActiveItem> = null;
  @Output() swapSlots = new EventEmitter<[number, number]>();
  @Output() removeFromSlot = new EventEmitter<number>();
  @Output() activateSlot = new EventEmitter<number>();
  @Output() updateSlot = new EventEmitter<{
    index: number;
    data: Instruction | Collection;
  }>();
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const hotkey = this.hotkeys.find((hotkey) => hotkey.key === event.key);

    if (hotkey !== undefined && this.slots[hotkey.slot] !== null) {
      this.activateSlot.emit(hotkey.slot);
    }
  }

  onActivated(index: number) {
    this.activateSlot.emit(index);
  }

  onDropped(
    event:
      | CdkDragDrop<Instruction[], unknown, Instruction>
      | CdkDragDrop<Collection[], unknown, Collection>
  ) {
    if (!event.isPointerOverContainer) {
      const [, index] = event.previousContainer.id.split('slot-');
      this.removeFromSlot.emit(parseInt(index));
    } else if (
      event.previousContainer.id.includes('instructions') ||
      event.previousContainer.id.includes('collections')
    ) {
      const [, newIndex] = event.container.id.split('slot-');
      this.updateSlot.emit({
        data: event.item.data,
        index: parseInt(newIndex),
      });
    } else {
      const [, previousIndex] = event.previousContainer.id.split('slot-');
      const [, newIndex] = event.container.id.split('slot-');

      this.swapSlots.emit([parseInt(previousIndex), parseInt(newIndex)]);
    }
  }
}

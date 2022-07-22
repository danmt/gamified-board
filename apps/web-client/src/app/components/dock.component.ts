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
import { SquareButtonComponent } from './square-button.component';

export interface HotKey {
  slot: number;
  key: string;
}

@Pipe({
  name: 'pgSlotHotkey',
  standalone: true,
})
export class SlotHotkeyPipe implements PipeTransform {
  transform(slotId: number, hotkeys: HotKey[]): string | null {
    const hotkey = hotkeys.find((hotkey) => hotkey.slot === slotId);

    return hotkey?.key ?? null;
  }
}

@Component({
  selector: 'pg-dock',
  template: `
    <div class="w-full flex justify-center">
      <div
        class="w-auto mx-auto p-4 bg-white flex gap-4 justify-center items-start"
      >
        <div>
          <h2>Instructions</h2>

          <div cdkDropListGroup class="flex gap-2 mb-2">
            <div
              id="slot-1"
              cdkDropList
              [cdkDropListData]="slots[0] ? [slots[0]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative w-11 h-11"
              style="padding: 0.12rem"
            >
              <span
                *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[0]">
                <pg-square-button
                  *ngIf="slots[0] !== null"
                  [isActive]="active === 0"
                  [thumbnailUrl]="slots[0]"
                  (activated)="onActivated(0)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[0]" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>

            <div
              id="slot-2"
              cdkDropList
              [cdkDropListData]="slots[1] ? [slots[1]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative w-11 h-11"
              style="padding: 0.12rem"
            >
              <span
                *ngIf="2 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[1]">
                <pg-square-button
                  *ngIf="slots[1] !== null"
                  [isActive]="active === 1"
                  [thumbnailUrl]="slots[1]"
                  (activated)="onActivated(1)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[1]" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>

            <div
              id="slot-3"
              cdkDropList
              [cdkDropListData]="slots[2] ? [slots[2]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative w-11 h-11"
              style="padding: 0.12rem"
            >
              <span
                *ngIf="3 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[2]">
                <pg-square-button
                  *ngIf="slots[2] !== null"
                  [isActive]="active === 2"
                  [thumbnailUrl]="slots[2]"
                  (activated)="onActivated(2)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[2]" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>

            <div
              id="slot-4"
              cdkDropList
              [cdkDropListData]="slots[3] ? [slots[3]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative w-11 h-11"
              style="padding: 0.12rem"
            >
              <span
                *ngIf="4 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[3]">
                <pg-square-button
                  *ngIf="slots[3] !== null"
                  [isActive]="active === 3"
                  [thumbnailUrl]="slots[3]"
                  (activated)="onActivated(3)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[3]" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>

            <div
              id="slot-5"
              cdkDropList
              [cdkDropListData]="slots[4] ? [slots[4]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative w-11 h-11"
              style="padding: 0.12rem"
            >
              <span
                *ngIf="5 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[4]">
                <pg-square-button
                  *ngIf="slots[4] !== null"
                  [isActive]="active === 4"
                  [thumbnailUrl]="slots[4]"
                  (activated)="onActivated(4)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[4]" />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>

            <div
              id="slot-6"
              cdkDropList
              [cdkDropListData]="slots[5] ? [slots[5]] : []"
              (cdkDropListDropped)="onDropped($event)"
              class="bg-gray-800 relative w-11 h-11"
              style="padding: 0.12rem"
            >
              <span
                *ngIf="6 | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>

              <div cdkDrag [cdkDragData]="slots[5]">
                <pg-square-button
                  *ngIf="slots[5] !== null"
                  [isActive]="active === 5"
                  [thumbnailUrl]="slots[5]"
                  (activated)="onActivated(5)"
                ></pg-square-button>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img class="w-full h-full" [src]="slots[5]" />
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
                id="slot-7"
                cdkDropList
                [cdkDropListData]="slots[6] ? [slots[6]] : []"
                (cdkDropListDropped)="onDropped($event)"
                class="bg-gray-800 relative w-11 h-11"
                style="padding: 0.12rem"
              >
                <span
                  *ngIf="7 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                >
                  {{ hotkey }}
                </span>

                <div cdkDrag [cdkDragData]="slots[6]">
                  <pg-square-button
                    *ngIf="slots[6] !== null"
                    [isActive]="active === 6"
                    [thumbnailUrl]="slots[6]"
                    (activated)="onActivated(6)"
                  ></pg-square-button>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img class="w-full h-full" [src]="slots[6]" />
                  </div>

                  <div *cdkDragPlaceholder></div>
                </div>
              </div>

              <div
                id="slot-8"
                cdkDropList
                [cdkDropListData]="slots[7] ? [slots[7]] : []"
                (cdkDropListDropped)="onDropped($event)"
                class="bg-gray-800 relative w-11 h-11"
                style="padding: 0.12rem"
              >
                <span
                  *ngIf="8 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                >
                  {{ hotkey }}
                </span>

                <div cdkDrag [cdkDragData]="slots[7]">
                  <pg-square-button
                    *ngIf="slots[7] !== null"
                    [isActive]="active === 7"
                    [thumbnailUrl]="slots[7]"
                    (activated)="onActivated(7)"
                  ></pg-square-button>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img class="w-full h-full" [src]="slots[7]" />
                  </div>

                  <div *cdkDragPlaceholder></div>
                </div>
              </div>

              <div
                id="slot-9"
                cdkDropList
                [cdkDropListData]="slots[8] ? [slots[8]] : []"
                (cdkDropListDropped)="onDropped($event)"
                class="bg-gray-800 relative w-11 h-11"
                style="padding: 0.12rem"
              >
                <span
                  *ngIf="9 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                >
                  {{ hotkey }}
                </span>

                <div cdkDrag [cdkDragData]="slots[8]">
                  <pg-square-button
                    *ngIf="slots[8] !== null"
                    [isActive]="active === 8"
                    [thumbnailUrl]="slots[8]"
                    (activated)="onActivated(8)"
                  ></pg-square-button>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img class="w-full h-full" [src]="slots[8]" />
                  </div>

                  <div *cdkDragPlaceholder></div>
                </div>
              </div>
            </div>

            <div class="flex gap-2 mb-2">
              <div
                id="slot-10"
                cdkDropList
                [cdkDropListData]="slots[9] ? [slots[9]] : []"
                (cdkDropListDropped)="onDropped($event)"
                class="bg-gray-800 relative w-11 h-11"
                style="padding: 0.12rem"
              >
                <span
                  *ngIf="10 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                >
                  {{ hotkey }}
                </span>

                <div cdkDrag [cdkDragData]="slots[9]">
                  <pg-square-button
                    *ngIf="slots[9] !== null"
                    [isActive]="active === 9"
                    [thumbnailUrl]="slots[9]"
                    (activated)="onActivated(9)"
                  ></pg-square-button>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img class="w-full h-full" [src]="slots[9]" />
                  </div>

                  <div *cdkDragPlaceholder></div>
                </div>
              </div>

              <div
                id="slot-11"
                cdkDropList
                [cdkDropListData]="slots[10] ? [slots[10]] : []"
                (cdkDropListDropped)="onDropped($event)"
                class="bg-gray-800 relative w-11 h-11"
                style="padding: 0.12rem"
              >
                <span
                  *ngIf="11 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                >
                  {{ hotkey }}
                </span>

                <div cdkDrag [cdkDragData]="slots[10]">
                  <pg-square-button
                    *ngIf="slots[10] !== null"
                    [isActive]="active === 10"
                    [thumbnailUrl]="slots[10]"
                    (activated)="onActivated(10)"
                  ></pg-square-button>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img class="w-full h-full" [src]="slots[10]" />
                  </div>

                  <div *cdkDragPlaceholder></div>
                </div>
              </div>

              <div
                id="slot-12"
                cdkDropList
                [cdkDropListData]="slots[11] ? [slots[11]] : []"
                (cdkDropListDropped)="onDropped($event)"
                class="bg-gray-800 relative w-11 h-11"
                style="padding: 0.12rem"
              >
                <span
                  *ngIf="12 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                >
                  {{ hotkey }}
                </span>

                <div cdkDrag [cdkDragData]="slots[11]">
                  <pg-square-button
                    *ngIf="slots[11] !== null"
                    [isActive]="active === 11"
                    [thumbnailUrl]="slots[11]"
                    (activated)="onActivated(11)"
                  ></pg-square-button>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img class="w-full h-full" [src]="slots[11]" />
                  </div>

                  <div *cdkDragPlaceholder></div>
                </div>
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
})
export class DockComponent {
  @Input() slots: (string | null)[] = [];
  @Input() hotkeys: HotKey[] = [];
  @Input() active: number | null = null;
  @Output() swapSlots = new EventEmitter<[number, number]>();
  @Output() removeFromSlot = new EventEmitter<number>();
  @Output() activateSlot = new EventEmitter<number>();
  @Output() updateSlot = new EventEmitter<{ index: number; data: string }>();
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const hotkey = this.hotkeys.find((hotkey) => hotkey.key === event.key);

    if (hotkey !== undefined) {
      this.activateSlot.emit(hotkey.slot - 1);
    }
  }

  onActivated(index: number) {
    this.activateSlot.emit(index);
  }

  onDropped(event: CdkDragDrop<string[], unknown, string>) {
    if (!event.isPointerOverContainer) {
      const [, index] = event.previousContainer.id.split('slot-');
      this.removeFromSlot.emit(parseInt(index) - 1);
    } else if (
      event.previousContainer.id === 'instructions' ||
      event.previousContainer.id === 'collections'
    ) {
      const [, newIndex] = event.container.id.split('slot-');
      this.updateSlot.emit({
        data: event.item.data,
        index: parseInt(newIndex) - 1,
      });
    } else {
      const [, previousIndex] = event.previousContainer.id.split('slot-');
      const [, newIndex] = event.container.id.split('slot-');

      this.swapSlots.emit([
        parseInt(previousIndex) - 1,
        parseInt(newIndex) - 1,
      ]);
    }
  }
}

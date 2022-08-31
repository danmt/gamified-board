import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { of } from 'rxjs';
import { SquareButtonComponent } from '../components';
import { KeyboardListenerDirective } from '../directives';
import {
  EditCollectionModalDirective,
  EditInstructionModalDirective,
} from '../modals';
import { HotKey, SlotHotkeyPipe } from '../pipes';
import { BoardStore } from '../stores';
import { Entity, Option } from '../utils';

@Component({
  selector: 'pg-center-dock-section',
  template: `
    <div
      class="pt-8 pb-10 px-10 bp-bg-futuristic flex gap-4 justify-center items-start relative"
      *ngrxLet="slots$; let slots"
      style="width: 615px; height: 126px"
    >
      <div class="flex">
        <div
          class="bp-skin-metal-corner-left-top absolute z-30"
          style="left: -16px; top: -14px;"
        ></div>
        <div
          class="bp-skin-metal-border flex-1 z-20"
          style="width: 500px; position: absolute; top: -14px; left: 55px;"
        ></div>
        <div class="bp-skin-dock-detail-center absolute"></div>
        <div
          class="bp-skin-metal-corner-right-top absolute z-30"
          style="right: -16px; top: -14px;"
        ></div>
      </div>

      <div class="bp-skin-dock-detail-left absolute z-40"></div>
      <div class="bp-skin-dock-detail-right absolute z-40"></div>
      <ng-container
        *ngrxLet="hotkeys$; let hotkeys"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(slots, hotkeys, $event)"
      >
        <div
          cdkDropListGroup
          class="flex gap-2 mb-2 z-50"
          *ngrxLet="active$; let active"
        >
          <div
            *ngFor="let slot of slots; let i = index; trackBy: trackBy"
            [id]="'slot-' + i"
            cdkDropList
            (cdkDropListDropped)="onDropped($event)"
            class="bg-yellow-800 relative"
            style="width: 2.89rem; height: 2.89rem"
          >
            <ng-container *ngrxLet="hotkeys$; let hotkeys">
              <span
                *ngIf="i | pgSlotHotkey: hotkeys as hotkey"
                class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                style="font-size: 0.5rem; line-height: 0.5rem"
              >
                {{ hotkey }}
              </span>
            </ng-container>

            <div cdkDrag [cdkDragData]="slot?.id">
              <pg-square-button
                *ngIf="slot !== null"
                [pgIsActive]="active?.id === slot.id"
                [pgThumbnailUrl]="slot.thumbnailUrl"
                (pgActivated)="onActivate(slot.id, slot.kind)"
              ></pg-square-button>

              <div *cdkDragPreview class="bg-gray-500 p-1 rounded-md">
                <img class="w-full h-full" [src]="slot?.thumbnailUrl" />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    EditCollectionModalDirective,
    EditInstructionModalDirective,
    PushModule,
    LetModule,
  ],
  styles: [
    `
      .cdk-drop-list-dragging:hover {
        @apply bg-gray-700;
      }
    `,
  ],
})
export class CenterDockSectionComponent {
  private readonly _boardStore = inject(BoardStore);

  readonly slots$ = this._boardStore.slots$;
  readonly hotkeys$ = of([
    {
      slot: 0,
      key: 'q',
    },
    {
      slot: 1,
      key: 'w',
    },
    {
      slot: 2,
      key: 'e',
    },
    {
      slot: 3,
      key: 'r',
    },
    {
      slot: 4,
      key: 't',
    },
    {
      slot: 5,
      key: 'a',
    },
    {
      slot: 6,
      key: 's',
    },
    {
      slot: 7,
      key: 'd',
    },
    {
      slot: 8,
      key: 'f',
    },
    {
      slot: 9,
      key: 'g',
    },
  ]);
  readonly active$ = this._boardStore.active$;

  onDropped(
    event: CdkDragDrop<
      unknown,
      unknown,
      {
        id: string;
        kind: 'collection' | 'instruction' | 'application' | 'sysvar';
      }
    >
  ) {
    if (!event.isPointerOverContainer) {
      const [, index] = event.previousContainer.id.split('slot-');
      this._boardStore.setSlot({ index: parseInt(index), data: null });
    } else if (
      event.previousContainer.id.includes('collections') ||
      event.previousContainer.id.includes('instructions') ||
      event.previousContainer.id.includes('applications') ||
      event.previousContainer.id.includes('sysvars')
    ) {
      const [, newIndex] = event.container.id.split('slot-');
      this._boardStore.setSlot({
        index: parseInt(newIndex),
        data: event.item.data,
      });
    } else {
      const [, previousIndex] = event.previousContainer.id.split('slot-');
      const [, newIndex] = event.container.id.split('slot-');
      this._boardStore.swapSlots({
        previousIndex: parseInt(previousIndex),
        newIndex: parseInt(newIndex),
      });
    }
  }

  onRemoveFromSlot(index: number) {
    this._boardStore.setSlot({ index, data: null });
  }

  onKeyDown(
    slots: Option<
      Entity<{ kind: 'instruction' | 'collection' | 'application' | 'sysvar' }>
    >[],
    hotkeys: HotKey[],
    event: KeyboardEvent
  ) {
    if (slots !== null) {
      const hotkey = hotkeys.find(({ key }) => key === event.key) ?? null;

      if (hotkey !== null) {
        const slot = slots[hotkey.slot] ?? null;

        if (slot !== null) {
          this._boardStore.setActive({ id: slot.id, kind: slot.kind });
        }
      }
    }
  }

  onActivate(
    activeId: string,
    kind: 'instruction' | 'collection' | 'application' | 'sysvar'
  ) {
    this._boardStore.setActive({ id: activeId, kind });
  }

  trackBy(index: number): number {
    return index;
  }
}

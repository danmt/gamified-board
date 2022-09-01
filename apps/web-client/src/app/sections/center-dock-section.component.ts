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
import { SlotHotkeyPipe } from '../pipes';
import { BoardStore } from '../stores';
import { Entity, Option } from '../utils';

export interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-center-dock-section',
  template: `
    <div
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
      *ngrxLet="slots$; let slots"
    >
      <ng-container
        *ngrxLet="hotkeys$; let hotkeys"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(slots, hotkeys, $event)"
      >
        <div
          cdkDropListGroup
          class="flex gap-2 mb-2"
          *ngrxLet="active$; let active"
        >
          <div
            *ngFor="let slot of slots; let i = index; trackBy: trackBy"
            [id]="'slot-' + i"
            cdkDropList
            (cdkDropListDropped)="onDropped($event)"
            class="bg-gray-800 relative"
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
      code: 'KeyQ',
      key: 'q',
    },
    {
      slot: 1,
      code: 'KeyW',
      key: 'w',
    },
    {
      slot: 2,
      code: 'KeyE',
      key: 'e',
    },
    {
      slot: 3,
      code: 'KeyR',
      key: 'r',
    },
    {
      slot: 4,
      code: 'KeyT',
      key: 't',
    },
    {
      slot: 5,
      code: 'KeyA',
      key: 'a',
    },
    {
      slot: 6,
      code: 'KeyS',
      key: 's',
    },
    {
      slot: 7,
      code: 'KeyD',
      key: 'd',
    },
    {
      slot: 8,
      code: 'KeyF',
      key: 'f',
    },
    {
      slot: 9,
      code: 'KeyG',
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
    console.log({
      hotkeys,
      event,
    });

    if (slots !== null) {
      const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

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

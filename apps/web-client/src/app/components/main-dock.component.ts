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
  EditCollectionModalDirective,
  EditInstructionModalDirective,
} from '../modals';
import { Option } from '../utils';

export interface Slot {
  id: string;
  thumbnailUrl: string;
}

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
      class="w-auto mx-auto p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <div cdkDropListGroup class="flex gap-2 mb-2">
        <div
          *ngFor="let slot of slots; let i = index; trackBy: trackBy"
          [id]="'slot-' + i"
          cdkDropList
          (cdkDropListDropped)="onDropped($event)"
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
        >
          <span
            *ngIf="i | pgSlotHotkey: hotkeys as hotkey"
            class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
            style="font-size: 0.5rem; line-height: 0.5rem"
          >
            {{ hotkey }}
          </span>

          <div cdkDrag [cdkDragData]="slot?.id">
            <pg-square-button
              *ngIf="slot !== null"
              [isActive]="activeId === slot.id"
              [thumbnailUrl]="slot.thumbnailUrl"
            ></pg-square-button>

            <div *cdkDragPreview class="bg-gray-500 p-1 rounded-md">
              <img class="w-full h-full" [src]="slot?.thumbnailUrl" />
            </div>

            <div *cdkDragPlaceholder></div>
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
    EditCollectionModalDirective,
    EditInstructionModalDirective,
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
  @Input() slots: Option<Option<Slot>[]> = [
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
  @Input() activeId: Option<string> = null;
  @Output() swapSlots = new EventEmitter<[number, number]>();
  @Output() removeFromSlot = new EventEmitter<number>();
  @Output() activateSlot = new EventEmitter<string>();
  @Output() updateSlot = new EventEmitter<{
    index: number;
    data: { id: string; kind: 'collection' | 'instruction' | 'application' };
  }>();
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.slots !== null) {
      const hotkey = this.hotkeys.find(({ key }) => key === event.key) ?? null;

      if (hotkey !== null) {
        const slot = this.slots[hotkey.slot] ?? null;

        if (slot !== null) {
          this.activateSlot.emit(slot.id);
        }
      }
    }
  }

  onDropped(
    event: CdkDragDrop<
      unknown,
      unknown,
      { id: string; kind: 'collection' | 'instruction' | 'application' }
    >
  ) {
    if (!event.isPointerOverContainer) {
      const [, index] = event.previousContainer.id.split('slot-');
      this.removeFromSlot.emit(parseInt(index));
    } else if (
      event.previousContainer.id.includes('collections') ||
      event.previousContainer.id.includes('instructions') ||
      event.previousContainer.id.includes('applications')
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

  trackBy(index: number): number {
    return index;
  }
}

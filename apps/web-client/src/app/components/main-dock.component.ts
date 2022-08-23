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
      <div>
        <header class="flex items-center gap-2 mb-2">
          <h2>Instructions</h2>

          <button
            class="rounded-full bg-slate-400 w-8 h-8"
            pgEditInstructionModal
            (createInstruction)="
              onCreateInstruction(
                $event.id,
                $event.name,
                $event.thumbnailUrl,
                $event.arguments
              )
            "
          >
            +
          </button>
        </header>

        <div cdkDropListGroup class="flex gap-2 mb-2">
          <div
            *ngFor="let slot of instructionSlots; let i = index"
            [id]="'instruction-slot-' + i"
            cdkDropList
            (cdkDropListDropped)="onInstructionDropped($event)"
            class="bg-gray-800 relative"
            style="width: 2.89rem; height: 2.89rem"
          >
            <span
              *ngIf="i | pgSlotHotkey: instructionHotkeys as hotkey"
              class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
              style="font-size: 0.5rem; line-height: 0.5rem"
            >
              {{ hotkey }}
            </span>

            <div cdkDrag [cdkDragData]="slot?.id">
              <pg-square-button
                *ngIf="slot !== null"
                [isActive]="activeInstructionId === slot.id"
                [thumbnailUrl]="slot.thumbnailUrl"
                (activated)="onActivateInstructionSlot(i)"
              ></pg-square-button>

              <div *cdkDragPreview class="bg-gray-500 p-1 rounded-md">
                <img class="w-full h-full" [src]="slot?.thumbnailUrl" />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <header class="flex items-center gap-2 mb-2">
          <h2>Collections</h2>

          <button
            class="rounded-full bg-slate-400 w-8 h-8"
            pgEditCollectionModal
            (createCollection)="
              onCreateCollection(
                $event.id,
                $event.name,
                $event.thumbnailUrl,
                $event.attributes
              )
            "
          >
            +
          </button>
        </header>

        <div
          cdkDropListGroup
          class="flex gap-2 mb-2 flex-wrap"
          style="width: 155px"
        >
          <div
            *ngFor="let slot of collectionSlots; let i = index"
            [id]="'collection-slot-' + i"
            cdkDropList
            (cdkDropListDropped)="onCollectionDropped($event)"
            class="bg-gray-800 relative"
            style="width: 2.89rem; height: 2.89rem"
          >
            <span
              *ngIf="i | pgSlotHotkey: collectionHotkeys as hotkey"
              class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
              style="font-size: 0.5rem; line-height: 0.5rem"
            >
              {{ hotkey }}
            </span>

            <div cdkDrag [cdkDragData]="slot?.id">
              <pg-square-button
                *ngIf="slot !== null"
                [isActive]="activeCollectionId === slot.id"
                [thumbnailUrl]="slot.thumbnailUrl"
                (activated)="onActivateCollectionSlot(i)"
              ></pg-square-button>

              <div *cdkDragPreview class="bg-gray-500 p-1 rounded-md">
                <img class="w-full h-full" [src]="slot?.thumbnailUrl" />
              </div>

              <div *cdkDragPlaceholder></div>
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
  @Input() instructionSlots: Option<Option<Slot>[]> = [
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  @Input() instructionHotkeys: HotKey[] = [];
  @Input() activeInstructionId: Option<string> = null;
  @Input() collectionSlots: Option<Option<Slot>[]> = [
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  @Input() collectionHotkeys: HotKey[] = [];
  @Input() activeCollectionId: Option<string> = null;
  @Output() swapInstructionSlots = new EventEmitter<[number, number]>();
  @Output() removeFromInstructionSlot = new EventEmitter<number>();
  @Output() activateInstructionSlot = new EventEmitter<string>();
  @Output() updateInstructionSlot = new EventEmitter<{
    index: number;
    data: string;
  }>();
  @Output() createInstruction = new EventEmitter<{
    id: string;
    name: string;
    thumbnailUrl: string;
    arguments: { id: string; name: string; type: string; isOption: boolean }[];
  }>();
  @Output() swapCollectionSlots = new EventEmitter<[number, number]>();
  @Output() removeFromCollectionSlot = new EventEmitter<number>();
  @Output() activateCollectionSlot = new EventEmitter<string>();
  @Output() updateCollectionSlot = new EventEmitter<{
    index: number;
    data: string;
  }>();
  @Output() createCollection = new EventEmitter<{
    id: string;
    name: string;
    thumbnailUrl: string;
    attributes: { id: string; name: string; type: string; isOption: boolean }[];
  }>();
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.instructionSlots !== null) {
      const instructionHotkey =
        this.instructionHotkeys.find(({ key }) => key === event.key) ?? null;

      if (instructionHotkey !== null) {
        const instructionSlot =
          this.instructionSlots[instructionHotkey.slot] ?? null;

        if (instructionSlot !== null) {
          this.activateInstructionSlot.emit(instructionSlot.id);
        }
      }
    }

    if (this.collectionSlots !== null) {
      const collectionHotkey =
        this.collectionHotkeys.find(({ key }) => key === event.key) ?? null;

      if (collectionHotkey !== null) {
        const collectionSlot =
          this.collectionSlots[collectionHotkey.slot] ?? null;

        if (collectionSlot !== null) {
          this.activateCollectionSlot.emit(collectionSlot.id);
        }
      }
    }
  }

  onActivateInstructionSlot(index: number) {
    if (this.instructionSlots !== null) {
      const instructionSlot = this.instructionSlots[index];

      if (instructionSlot !== null) {
        this.activateInstructionSlot.emit(instructionSlot.id);
      }
    }
  }

  onInstructionDropped(event: CdkDragDrop<string[], unknown, string>) {
    if (!event.isPointerOverContainer) {
      const [, index] = event.previousContainer.id.split('instruction-slot-');
      this.removeFromInstructionSlot.emit(parseInt(index));
    } else if (event.previousContainer.id.includes('instructions')) {
      const [, newIndex] = event.container.id.split('instruction-slot-');
      this.updateInstructionSlot.emit({
        data: event.item.data,
        index: parseInt(newIndex),
      });
    } else {
      const [, previousIndex] =
        event.previousContainer.id.split('instruction-slot-');
      const [, newIndex] = event.container.id.split('instruction-slot-');

      this.swapInstructionSlots.emit([
        parseInt(previousIndex),
        parseInt(newIndex),
      ]);
    }
  }

  onCreateInstruction(
    id: string,
    name: string,
    thumbnailUrl: string,
    args: { id: string; name: string; type: string; isOption: boolean }[]
  ) {
    this.createInstruction.emit({
      id,
      name,
      thumbnailUrl,
      arguments: args,
    });
  }

  onActivateCollectionSlot(index: number) {
    if (this.collectionSlots !== null) {
      const collectionSlot = this.collectionSlots[index];

      if (collectionSlot !== null) {
        this.activateCollectionSlot.emit(collectionSlot.id);
      }
    }
  }

  onCollectionDropped(event: CdkDragDrop<string[], unknown, string>) {
    if (!event.isPointerOverContainer) {
      const [, index] = event.previousContainer.id.split('collection-slot-');
      this.removeFromCollectionSlot.emit(parseInt(index));
    } else if (event.previousContainer.id.includes('collections')) {
      const [, newIndex] = event.container.id.split('collection-slot-');
      this.updateCollectionSlot.emit({
        data: event.item.data,
        index: parseInt(newIndex),
      });
    } else {
      const [, previousIndex] =
        event.previousContainer.id.split('collection-slot-');
      const [, newIndex] = event.container.id.split('collection-slot-');

      this.swapCollectionSlots.emit([
        parseInt(previousIndex),
        parseInt(newIndex),
      ]);
    }
  }

  onCreateCollection(
    id: string,
    name: string,
    thumbnailUrl: string,
    attributes: { id: string; name: string; type: string; isOption: boolean }[]
  ) {
    this.createCollection.emit({
      id,
      name,
      thumbnailUrl,
      attributes,
    });
  }
}

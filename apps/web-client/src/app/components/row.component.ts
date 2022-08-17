import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import {
  ActiveItem,
  BoardDocument,
  BoardInstruction,
  BoardItemKind,
  BoardTask,
  Collection,
  Instruction,
  Option,
} from '../utils';

@Component({
  selector: 'pg-row',
  template: `
    <div
      *ngIf="instruction !== null"
      class="text-2xl text-white uppercase relative h-full flex gap-4"
    >
      <ng-content></ng-content>

      <div
        class="flex flex-col"
        (mouseenter)="isDocumentsHovered = true"
        (mouseleave)="isDocumentsHovered = false"
        (click)="onCreateDocument()"
      >
        <p>Documents</p>

        <div
          [id]="instruction.id + '-document'"
          cdkDropList
          [cdkDropListData]="instruction.documents"
          [cdkDropListConnectedTo]="documentsDropLists"
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onCollectionDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="let document of instruction.documents; trackBy: trackBy"
            cdkDrag
            [cdkDragData]="document"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <button
              class="w-full h-full"
              (click)="onSelectItem(document.id, 'document')"
            >
              <img
                class="w-full h-full"
                [src]="document.collection.thumbnailUrl"
              />
            </button>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img
                class="w-full h-full"
                [src]="document.collection.thumbnailUrl"
              />
            </div>

            <div
              *cdkDragPlaceholder=""
              class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
            >
              <img
                class="w-full h-full"
                [src]="document.collection.thumbnailUrl"
              />
            </div>
          </div>

          <div
            *ngIf="
              isDocumentsHovered &&
              active !== null &&
              active.kind === 'collection'
            "
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <img class="w-full h-full" [src]="active.data.thumbnailUrl" />
          </div>
        </div>
      </div>

      <div
        class="flex flex-col"
        (mouseenter)="isTasksHovered = true"
        (mouseleave)="isTasksHovered = false"
        (click)="onCreateTask()"
      >
        <p>Tasks</p>

        <div
          [id]="instruction.id + '-task'"
          cdkDropList
          [cdkDropListData]="instruction.tasks"
          [cdkDropListConnectedTo]="tasksDropLists"
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onInstructionDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="let task of instruction.tasks; trackBy: trackBy"
            cdkDrag
            [cdkDragData]="task"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <button
              class="w-full h-full"
              (click)="onSelectItem(task.id, 'task')"
            >
              <img
                class="w-full h-full"
                [src]="task.instruction.thumbnailUrl"
              />
            </button>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img
                class="w-full h-full"
                [src]="task.instruction.thumbnailUrl"
              />
            </div>

            <div
              *cdkDragPlaceholder=""
              class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
            >
              <img
                class="w-full h-full"
                [src]="task.instruction.thumbnailUrl"
              />
            </div>
          </div>

          <div
            *ngIf="
              isTasksHovered && active !== null && active.kind === 'instruction'
            "
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <img class="w-full h-full" [src]="active.data.thumbnailUrl" />
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowComponent {
  @Input() active: Option<ActiveItem> = null;
  @Input() instruction: Option<BoardInstruction> = null;
  @Input() documentsDropLists: string[] = [];
  @Input() tasksDropLists: string[] = [];
  @Output() createDocument = new EventEmitter<Collection>();
  @Output() createTask = new EventEmitter<Instruction>();
  @Output() selectItem = new EventEmitter<{
    itemId: string;
    kind: BoardItemKind;
  }>();
  @Output() moveDocument = new EventEmitter<{
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() transferDocument = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    documentId: string;
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() moveTask = new EventEmitter<{
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() transferTask = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    documentId: string;
    previousIndex: number;
    newIndex: number;
  }>();
  isDocumentsHovered = false;
  isTasksHovered = false;

  @HostBinding('class') class =
    'block w-full h-64 bg-blue-300 border border-blue-500 bg-bp-bricks ';

  onCreateDocument() {
    if (this.active !== null) {
      this.createDocument.emit(this.active.data);
    }
  }

  onCreateTask() {
    if (this.active !== null) {
      this.createTask.emit(this.active.data);
    }
  }

  onSelectItem(itemId: string, kind: BoardItemKind) {
    this.selectItem.emit({ itemId, kind });
  }

  trackBy(index: number): number {
    return index;
  }

  onCollectionDropped(
    event: CdkDragDrop<BoardDocument[], unknown, BoardDocument>
  ) {
    if (event.container.id === event.previousContainer.id) {
      this.moveDocument.emit({
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    } else {
      const previousInstructionId =
        event.previousContainer.id.split('-document')[0];
      const newInstructionId = event.container.id.split('-document')[0];

      this.transferDocument.emit({
        previousInstructionId,
        newInstructionId,
        documentId: event.item.data.id,
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    }
  }

  onInstructionDropped(event: CdkDragDrop<BoardTask[], unknown, BoardTask>) {
    if (event.container.id === event.previousContainer.id) {
      this.moveTask.emit({
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    } else {
      const previousInstructionId =
        event.previousContainer.id.split('-task')[0];
      const newInstructionId = event.container.id.split('-task')[0];
      this.transferTask.emit({
        previousInstructionId,
        newInstructionId,
        documentId: event.item.data.id,
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    }
  }
}

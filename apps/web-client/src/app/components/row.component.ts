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
import { Option } from '../utils';

interface RowTask {
  id: string;
  instruction: {
    thumbnailUrl: string;
  };
}

interface RowDocument {
  id: string;
  collection: {
    thumbnailUrl: string;
  };
}

interface ActiveCollection {
  id: string;
  thumbnailUrl: string;
}

interface ActiveInstruction {
  id: string;
  thumbnailUrl: string;
}

interface RowInstruction {
  id: string;
  documents: RowDocument[];
  tasks: RowTask[];
}

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
        (click)="onCreateDocument(activeCollection?.id ?? null)"
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
              (click)="onSelectDocument(document.id)"
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
            *ngIf="isDocumentsHovered && activeCollection !== null"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <img class="w-full h-full" [src]="activeCollection.thumbnailUrl" />
          </div>
        </div>
      </div>

      <div
        class="flex flex-col"
        (mouseenter)="isTasksHovered = true"
        (mouseleave)="isTasksHovered = false"
        (click)="onCreateTask(activeInstruction?.id ?? null)"
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
            <button class="w-full h-full" (click)="onSelectTask(task.id)">
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
            *ngIf="isTasksHovered && activeInstruction !== null"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <img class="w-full h-full" [src]="activeInstruction.thumbnailUrl" />
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
  @Input() activeCollection: Option<ActiveCollection> = null;
  @Input() activeInstruction: Option<ActiveInstruction> = null;
  @Input() instruction: Option<RowInstruction> = null;
  @Input() documentsDropLists: string[] = [];
  @Input() tasksDropLists: string[] = [];
  @Output() createDocument = new EventEmitter<string>();
  @Output() createTask = new EventEmitter<string>();
  @Output() selectTask = new EventEmitter<string>();
  @Output() selectDocument = new EventEmitter<string>();

  @Output() moveDocument = new EventEmitter<{
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() transferDocument = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    documentId: string;
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
    'block w-full h-64 bg-blue-300 border border-blue-500 bg-bp-bricks';

  onCreateDocument(collectionId: Option<string>) {
    if (collectionId !== null) {
      this.createDocument.emit(collectionId);
    }
  }

  onCreateTask(instructionId: Option<string>) {
    if (instructionId !== null) {
      this.createTask.emit(instructionId);
    }
  }

  onSelectTask(taskId: string) {
    this.selectTask.emit(taskId);
  }

  onSelectDocument(documentId: string) {
    this.selectDocument.emit(documentId);
  }

  trackBy(index: number): number {
    return index;
  }

  onCollectionDropped(event: CdkDragDrop<RowDocument[], unknown, RowDocument>) {
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
        newIndex: event.currentIndex,
      });
    }
  }

  onInstructionDropped(event: CdkDragDrop<RowTask[], unknown, RowTask>) {
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

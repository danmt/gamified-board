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
import { Entity, Option } from '../utils';

interface Active {
  id: string;
  thumbnailUrl: string;
}

interface Instruction {
  id: string;
  documents: Entity<{
    collection: {
      thumbnailUrl: string;
    };
  }>[];
  tasks: Entity<{
    instruction: {
      thumbnailUrl: string;
    };
  }>[];
  applications: Entity<{
    application: {
      thumbnailUrl: string;
    };
  }>[];
}

@Component({
  selector: 'pg-row',
  template: `
    <div
      *ngIf="instruction !== null"
      class="text-2xl text-white uppercase relative h-full flex gap-4"
      (click)="onUseActive()"
    >
      <ng-content></ng-content>

      <div class="flex flex-col">
        <p>Documents</p>

        <div
          [id]="instruction.id + '-document'"
          cdkDropList
          [cdkDropListConnectedTo]="documentsDropLists"
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onCollectionDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="let document of instruction.documents; trackBy: trackBy"
            cdkDrag
            [cdkDragData]="document.id"
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
        </div>
      </div>

      <div class="flex flex-col">
        <p>Tasks</p>

        <div
          [id]="instruction.id + '-task'"
          cdkDropList
          [cdkDropListConnectedTo]="tasksDropLists"
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onInstructionDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="let task of instruction.tasks; trackBy: trackBy"
            cdkDrag
            [cdkDragData]="task.id"
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
        </div>
      </div>

      <div class="flex flex-col">
        <p>Applications</p>

        <div
          [id]="instruction.id + '-application'"
          cdkDropList
          [cdkDropListConnectedTo]="applicationsDropLists"
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onApplicationDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="
              let instructionApplication of instruction.applications;
              trackBy: trackBy
            "
            cdkDrag
            [cdkDragData]="instructionApplication.id"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <button
              class="w-full h-full"
              (click)="onSelectApplication(instructionApplication.id)"
            >
              <img
                class="w-full h-full"
                [src]="instructionApplication.application.thumbnailUrl"
              />
            </button>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img
                class="w-full h-full"
                [src]="instructionApplication.application.thumbnailUrl"
              />
            </div>

            <div
              *cdkDragPlaceholder=""
              class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
            >
              <img
                class="w-full h-full"
                [src]="instructionApplication.application.thumbnailUrl"
              />
            </div>
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
  @Input() active: Option<Active> = null;
  @Input() instruction: Option<Instruction> = null;
  @Input() documentsDropLists: string[] = [];
  @Input() tasksDropLists: string[] = [];
  @Input() applicationsDropLists: string[] = [];
  @Output() useActive = new EventEmitter();
  @Output() selectTask = new EventEmitter<string>();
  @Output() selectDocument = new EventEmitter<string>();
  @Output() selectApplication = new EventEmitter<string>();

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
    instructionTaskId: string;
    newIndex: number;
  }>();
  @Output() moveApplication = new EventEmitter<{
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() transferApplication = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    instructionApplicationId: string;
    newIndex: number;
  }>();

  @HostBinding('class') class = 'block w-full h-64 border-2 bg-bp-bricks';

  onSelectTask(taskId: string) {
    this.selectTask.emit(taskId);
  }

  onSelectDocument(documentId: string) {
    this.selectDocument.emit(documentId);
  }

  onSelectApplication(applicationId: string) {
    this.selectApplication.emit(applicationId);
  }

  trackBy(index: number): number {
    return index;
  }

  onCollectionDropped(event: CdkDragDrop<unknown, unknown, string>) {
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
        documentId: event.item.data,
        newIndex: event.currentIndex,
      });
    }
  }

  onInstructionDropped(event: CdkDragDrop<unknown, unknown, string>) {
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
        instructionTaskId: event.item.data,
        newIndex: event.currentIndex,
      });
    }
  }

  onApplicationDropped(event: CdkDragDrop<unknown, unknown, string>) {
    if (event.container.id === event.previousContainer.id) {
      this.moveApplication.emit({
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    } else {
      const previousInstructionId =
        event.previousContainer.id.split('-application')[0];
      const newInstructionId = event.container.id.split('-application')[0];
      this.transferApplication.emit({
        previousInstructionId,
        newInstructionId,
        instructionApplicationId: event.item.data,
        newIndex: event.currentIndex,
      });
    }
  }

  onUseActive() {
    this.useActive.emit();
  }
}

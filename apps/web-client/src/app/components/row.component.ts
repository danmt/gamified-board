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
import { DefaultImageDirective } from '../directives';
import { BoardItemDropListsPipe } from '../pipes';
import { Entity, Option } from '../utils';

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
  sysvars: Entity<{
    sysvar: {
      thumbnailUrl: string;
    };
  }>[];
  signers: Entity<unknown>[];
}

@Component({
  selector: 'pg-row',
  template: `
    <div
      *ngIf="pgInstruction !== null"
      class="text-2xl text-white uppercase relative h-full flex gap-4 border-2"
      [ngClass]="{ 'border-blue-500': pgIsHovered }"
      (click)="onUseActive()"
    >
      <ng-content></ng-content>

      <div class="flex flex-col">
        <p>Documents</p>

        <div
          [id]="pgInstruction.id + '-document'"
          cdkDropList
          [cdkDropListConnectedTo]="
            pgInstructions | pgBoardItemDropLists: 'document'
          "
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onCollectionDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="let document of pgInstruction.documents; trackBy: trackBy"
            cdkDrag
            [cdkDragData]="document.id"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <button class="w-full h-full" (click)="onSelect(document.id)">
              <img
                class="w-full h-full"
                [src]="document.collection.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-document.png"
              />
            </button>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img
                class="w-full h-full"
                [src]="document.collection.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-document.png"
              />
            </div>

            <div
              *cdkDragPlaceholder=""
              class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
            >
              <img
                class="w-full h-full"
                [src]="document.collection.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-document.png"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <p>Tasks</p>

        <div
          [id]="pgInstruction.id + '-task'"
          cdkDropList
          [cdkDropListConnectedTo]="
            pgInstructions | pgBoardItemDropLists: 'task'
          "
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onInstructionDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="let task of pgInstruction.tasks; trackBy: trackBy"
            cdkDrag
            [cdkDragData]="task.id"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <button class="w-full h-full" (click)="onSelect(task.id)">
              <img
                class="w-full h-full"
                [src]="task.instruction.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-task.png"
              />
            </button>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img
                class="w-full h-full"
                [src]="task.instruction.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-task.png"
              />
            </div>

            <div
              *cdkDragPlaceholder=""
              class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
            >
              <img
                class="w-full h-full"
                [src]="task.instruction.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-task.png"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <p>Applications</p>

        <div
          [id]="pgInstruction.id + '-application'"
          cdkDropList
          [cdkDropListConnectedTo]="
            pgInstructions | pgBoardItemDropLists: 'application'
          "
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onApplicationDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="
              let instructionApplication of pgInstruction.applications;
              trackBy: trackBy
            "
            cdkDrag
            [cdkDragData]="instructionApplication.id"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <button
              class="w-full h-full"
              (click)="onSelect(instructionApplication.id)"
            >
              <img
                class="w-full h-full"
                [src]="instructionApplication.application.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-application.png"
              />
            </button>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img
                class="w-full h-full"
                [src]="instructionApplication.application.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-application.png"
              />
            </div>

            <div
              *cdkDragPlaceholder=""
              class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
            >
              <img
                class="w-full h-full"
                [src]="instructionApplication.application.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-application.png"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <p>Sysvars</p>

        <div
          [id]="pgInstruction.id + '-sysvar'"
          cdkDropList
          [cdkDropListConnectedTo]="
            pgInstructions | pgBoardItemDropLists: 'sysvar'
          "
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onSysvarDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="
              let instructionSysvar of pgInstruction.sysvars;
              trackBy: trackBy
            "
            cdkDrag
            [cdkDragData]="instructionSysvar.id"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <button
              class="w-full h-full"
              (click)="onSelect(instructionSysvar.id)"
            >
              <img
                class="w-full h-full"
                [src]="instructionSysvar.sysvar.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-sysvar.png"
              />
            </button>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img
                class="w-full h-full"
                [src]="instructionSysvar.sysvar.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-sysvar.png"
              />
            </div>

            <div
              *cdkDragPlaceholder=""
              class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
            >
              <img
                class="w-full h-full"
                [src]="instructionSysvar.sysvar.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-sysvar.png"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <p>Signers</p>

        <div
          [id]="pgInstruction.id + '-signer'"
          cdkDropList
          [cdkDropListConnectedTo]="
            pgInstructions | pgBoardItemDropLists: 'signer'
          "
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="onSignerDropped($event)"
          class="flex gap-2 flex-1"
        >
          <div
            *ngFor="
              let instructionSigner of pgInstruction.signers;
              trackBy: trackBy
            "
            cdkDrag
            [cdkDragData]="instructionSigner.id"
            class="bg-gray-800 relative w-11 h-11"
            style="padding: 0.12rem"
          >
            <button
              class="w-full h-full"
              (click)="onSelect(instructionSigner.id)"
            >
              <img class="w-full h-full" src="assets/generic/signer.png" />
            </button>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img class="w-full h-full" src="assets/generic/signer.png" />
            </div>

            <div
              *cdkDragPlaceholder=""
              class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
            >
              <img class="w-full h-full" src="assets/generic/signer.png" />
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
    BoardItemDropListsPipe,
    DefaultImageDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowComponent {
  @Input() pgInstructions: Option<Instruction[]> = null;
  @Input() pgInstruction: Option<Instruction> = null;
  @Input() pgIsHovered = false;
  @Output() pgUseActive = new EventEmitter();
  @Output() pgSelect = new EventEmitter<string>();
  @Output() pgMoveDocument = new EventEmitter<{
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() pgTransferDocument = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    documentId: string;
    newIndex: number;
  }>();
  @Output() pgMoveTask = new EventEmitter<{
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() pgTransferTask = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    instructionTaskId: string;
    newIndex: number;
  }>();
  @Output() pgMoveApplication = new EventEmitter<{
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() pgTransferApplication = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    instructionApplicationId: string;
    newIndex: number;
  }>();
  @Output() pgMoveSysvar = new EventEmitter<{
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() pgTransferSysvar = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    instructionSysvarId: string;
    newIndex: number;
  }>();
  @Output() pgMoveSigner = new EventEmitter<{
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() pgTransferSigner = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    instructionSignerId: string;
    newIndex: number;
  }>();

  @HostBinding('class') class = 'block h-64 bg-bp-bricks';

  onSelect(selectId: string) {
    this.pgSelect.emit(selectId);
  }

  trackBy(index: number): number {
    return index;
  }

  onCollectionDropped(event: CdkDragDrop<unknown, unknown, string>) {
    if (event.container.id === event.previousContainer.id) {
      this.pgMoveDocument.emit({
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    } else {
      const previousInstructionId =
        event.previousContainer.id.split('-document')[0];
      const newInstructionId = event.container.id.split('-document')[0];

      this.pgTransferDocument.emit({
        previousInstructionId,
        newInstructionId,
        documentId: event.item.data,
        newIndex: event.currentIndex,
      });
    }
  }

  onInstructionDropped(event: CdkDragDrop<unknown, unknown, string>) {
    if (event.container.id === event.previousContainer.id) {
      this.pgMoveTask.emit({
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    } else {
      const previousInstructionId =
        event.previousContainer.id.split('-task')[0];
      const newInstructionId = event.container.id.split('-task')[0];
      this.pgTransferTask.emit({
        previousInstructionId,
        newInstructionId,
        instructionTaskId: event.item.data,
        newIndex: event.currentIndex,
      });
    }
  }

  onApplicationDropped(event: CdkDragDrop<unknown, unknown, string>) {
    if (event.container.id === event.previousContainer.id) {
      this.pgMoveApplication.emit({
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    } else {
      const previousInstructionId =
        event.previousContainer.id.split('-application')[0];
      const newInstructionId = event.container.id.split('-application')[0];
      this.pgTransferApplication.emit({
        previousInstructionId,
        newInstructionId,
        instructionApplicationId: event.item.data,
        newIndex: event.currentIndex,
      });
    }
  }

  onSysvarDropped(event: CdkDragDrop<unknown, unknown, string>) {
    if (event.container.id === event.previousContainer.id) {
      this.pgMoveSysvar.emit({
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    } else {
      const previousInstructionId =
        event.previousContainer.id.split('-sysvar')[0];
      const newInstructionId = event.container.id.split('-sysvar')[0];
      this.pgTransferSysvar.emit({
        previousInstructionId,
        newInstructionId,
        instructionSysvarId: event.item.data,
        newIndex: event.currentIndex,
      });
    }
  }

  onSignerDropped(event: CdkDragDrop<unknown, unknown, string>) {
    if (event.container.id === event.previousContainer.id) {
      this.pgMoveSigner.emit({
        previousIndex: event.previousIndex,
        newIndex: event.currentIndex,
      });
    } else {
      const previousInstructionId =
        event.previousContainer.id.split('-signer')[0];
      const newInstructionId = event.container.id.split('-signer')[0];
      this.pgTransferSigner.emit({
        previousInstructionId,
        newInstructionId,
        instructionSignerId: event.item.data,
        newIndex: event.currentIndex,
      });
    }
  }

  onUseActive() {
    this.pgUseActive.emit();
  }
}

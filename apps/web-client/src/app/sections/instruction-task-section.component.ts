import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { map } from 'rxjs';
import { SquareButtonComponent } from '../components';
import {
  EditInstructionTaskModalDirective,
  EditInstructionTaskSubmitPayload,
} from '../modals';
import { InstructionTaskApiService } from '../services';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-instruction-task-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.instruction?.thumbnailUrl" />

      {{ selected?.name }}

      <div class="bg-gray-800 relative" style="width: 2.89rem; height: 2.89rem">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          q
        </span>

        <pg-square-button
          [pgIsActive]="isEditing"
          pgThumbnailUrl="assets/generic/signer.png"
          pgEditInstructionTaskModal
          [pgInstructionTask]="selected"
          (pgOpenModal)="isEditing = true"
          (pgCloseModal)="isEditing = false"
          (pgUpdateInstructionTask)="
            onUpdateInstructionTask(selected.ownerId, selected.id, $event)
          "
        ></pg-square-button>
      </div>

      <div class="bg-gray-800 relative" style="width: 2.89rem; height: 2.89rem">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          w
        </span>

        <pg-square-button
          [pgIsActive]="false"
          pgThumbnailUrl="assets/generic/signer.png"
          (click)="onDeleteInstructionTask(selected.ownerId, selected.id)"
        ></pg-square-button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    EditInstructionTaskModalDirective,
  ],
})
export class InstructionTaskSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'instructionTask') {
        return null;
      }

      return selected;
    })
  );

  isEditing = false;
  isDeleting = false;

  onUpdateInstructionTask(
    instructionId: string,
    instructionTaskId: string,
    instructionTaskData: EditInstructionTaskSubmitPayload
  ) {
    this._instructionTaskApiService
      .updateInstructionTask(
        instructionId,
        instructionTaskId,
        instructionTaskData.name
      )
      .subscribe();
  }

  onDeleteInstructionTask(instructionId: string, taskId: string) {
    this.isDeleting = true;

    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionTaskApiService
        .deleteInstructionTask(instructionId, taskId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }

    this.isDeleting = false;
  }
}

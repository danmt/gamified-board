import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject, ViewContainerRef } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map } from 'rxjs';
import { EditTaskData, EditTaskModalComponent } from '../modals';
import { InstructionTaskApiService } from '../services';
import { BoardStore, InstructionTaskView } from '../stores';

@Component({
  selector: 'pg-instruction-task-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.instruction?.thumbnailUrl" />

      {{ selected?.name }}

      <button
        (click)="
          onUpdateInstructionTask(selected.ownerId, selected.id, selected)
        "
      >
        edit
      </button>

      <button (click)="onDeleteInstructionTask(selected.ownerId, selected.id)">
        x
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule],
})
export class InstructionTaskSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || !('instruction' in selected)) {
        return null;
      }

      return selected;
    })
  );

  onUpdateInstructionTask(
    instructionId: string,
    taskId: string,
    task: InstructionTaskView
  ) {
    this._dialog
      .open<EditTaskData, EditTaskData, EditTaskModalComponent>(
        EditTaskModalComponent,
        {
          data: task,
          viewContainerRef: this._viewContainerRef,
        }
      )
      .closed.pipe(
        concatMap((taskData) => {
          if (taskData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveId(null);

          return this._instructionTaskApiService.updateInstructionTask(
            instructionId,
            taskId,
            taskData.name
          );
        })
      )
      .subscribe();
  }

  onDeleteInstructionTask(instructionId: string, taskId: string) {
    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionTaskApiService
        .deleteInstructionTask(instructionId, taskId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }
  }
}

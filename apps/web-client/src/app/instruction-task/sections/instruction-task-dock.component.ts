import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { InstructionTaskView } from '../../board/utils';
import {
  ConfirmModalDirective,
  openConfirmModal,
  SquareButtonComponent,
} from '../../shared/components';
import {
  DefaultImageDirective,
  KeyboardListenerDirective,
} from '../../shared/directives';
import { SlotHotkeyPipe } from '../../shared/pipes';
import { isNotNull, isNull } from '../../shared/utils';
import {
  EditInstructionTaskSubmit,
  openEditInstructionTaskModal,
  UpdateInstructionTaskModalDirective,
} from '../components';
import { InstructionTaskApiService } from '../services';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-instruction-task-dock',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <div
        *ngIf="selected$ | ngrxPush as selected"
        class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <img
          [src]="selected?.instruction?.thumbnailUrl"
          pgDefaultImage="assets/generic/instruction-task.png"
        />

        {{ selected?.name }}

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
        >
          <span
            *ngIf="0 | pgSlotHotkey: hotkeys as hotkey"
            class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
            style="font-size: 0.5rem; line-height: 0.5rem"
          >
            {{ hotkey }}
          </span>

          <pg-square-button
            [pgIsActive]="isEditing"
            pgThumbnailUrl="assets/generic/instruction-task.png"
            pgUpdateInstructionTaskModal
            [pgInstructionTask]="selected"
            (pgOpenModal)="isEditing = true"
            (pgCloseModal)="isEditing = false"
            (pgUpdateInstructionTask)="
              onUpdateInstructionTask(selected.ownerId, selected.id, $event)
            "
          ></pg-square-button>
        </div>

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
        >
          <span
            *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
            class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
            style="font-size: 0.5rem; line-height: 0.5rem"
          >
            {{ hotkey }}
          </span>

          <pg-square-button
            [pgIsActive]="isDeleting"
            pgThumbnailUrl="assets/generic/instruction-task.png"
            pgConfirmModal
            pgMessage="Are you sure? This action cannot be reverted."
            (pgConfirm)="onDeleteInstructionTask(selected.ownerId, selected.id)"
            (pgOpenModal)="isDeleting = true"
            (pgCloseModal)="isDeleting = false"
          ></pg-square-button>
        </div>
      </div>
    </ng-container>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
    UpdateInstructionTaskModalDirective,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
  ],
})
export class InstructionTaskDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  readonly selected$ = combineLatest([
    this._boardStore.instructions$,
    this._boardStore.selected$,
  ]).pipe(
    map(([instructions, selected]) => {
      if (
        isNull(instructions) ||
        isNull(selected) ||
        selected.kind !== 'instructionTask'
      ) {
        return null;
      }

      return (
        instructions
          .reduce<InstructionTaskView[]>(
            (instructionTasks, instruction) =>
              instructionTasks.concat(instruction.tasks),
            []
          )
          .find(({ id }) => id === selected.id) ?? null
      );
    })
  );
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
  ]);

  isEditing = false;
  isDeleting = false;

  onUpdateInstructionTask(
    instructionId: string,
    instructionTaskId: string,
    instructionTaskData: EditInstructionTaskSubmit
  ) {
    this._instructionTaskApiService
      .updateInstructionTask(instructionId, instructionTaskId, {
        name: instructionTaskData.name,
      })
      .subscribe();
  }

  onDeleteInstructionTask(instructionId: string, instructionTaskId: string) {
    this._instructionTaskApiService
      .deleteInstructionTask(instructionId, instructionTaskId)
      .subscribe(() => this._boardStore.setSelected(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    instructionTask: InstructionTaskView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditInstructionTaskModal(this._dialog, {
            instructionTask,
          })
            .closed.pipe(
              concatMap((instructionTaskData) => {
                this.isEditing = false;

                if (instructionTaskData === undefined) {
                  return EMPTY;
                }

                return this._instructionTaskApiService.updateInstructionTask(
                  instructionTask.ownerId,
                  instructionTask.id,
                  { name: instructionTaskData.name }
                );
              })
            )
            .subscribe();

          break;
        }

        case 1: {
          this.isDeleting = true;

          openConfirmModal(this._dialog, {
            message: 'Are you sure? This action cannot be reverted.',
          })
            .closed.pipe(
              concatMap((confirmData) => {
                this.isDeleting = false;

                if (confirmData === undefined || !confirmData) {
                  return EMPTY;
                }

                return this._instructionTaskApiService
                  .deleteInstructionTask(
                    instructionTask.ownerId,
                    instructionTask.id
                  )
                  .pipe(tap(() => this._boardStore.setSelected(null)));
              })
            )
            .subscribe();

          break;
        }

        default: {
          break;
        }
      }
    }
  }
}

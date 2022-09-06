import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore, InstructionApplicationView } from '../../core/stores';
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
  EditInstructionApplicationModalDirective,
  EditInstructionApplicationSubmit,
  openEditInstructionApplicationModal,
} from '../components';
import { InstructionApplicationApiService } from '../services';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-instruction-application-dock',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <div
        *ngIf="selected$ | ngrxPush as selected"
        class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <img
          [src]="selected?.application?.thumbnailUrl"
          pgDefaultImage="assets/generic/instruction-application.png"
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
            pgThumbnailUrl="assets/generic/instruction-application.png"
            pgEditInstructionApplicationModal
            [pgInstructionApplication]="selected"
            (pgOpenModal)="isEditing = true"
            (pgCloseModal)="isEditing = false"
            (pgUpdateInstructionApplication)="
              onUpdateInstructionApplication(
                selected.ownerId,
                selected.id,
                $event
              )
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
            pgThumbnailUrl="assets/generic/instruction-application.png"
            pgConfirmModal
            pgMessage="Are you sure? This action cannot be reverted."
            (pgConfirm)="
              onDeleteInstructionApplication(selected.ownerId, selected.id)
            "
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
    EditInstructionApplicationModalDirective,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
  ],
})
export class InstructionApplicationDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionApplicationApiService = inject(
    InstructionApplicationApiService
  );

  readonly selected$ = combineLatest([
    this._boardStore.instructions$,
    this._boardStore.selected$,
  ]).pipe(
    map(([instructions, selected]) => {
      if (
        isNull(instructions) ||
        isNull(selected) ||
        selected.kind !== 'instructionApplication'
      ) {
        return null;
      }

      return (
        instructions
          .reduce<InstructionApplicationView[]>(
            (instructionApplications, instruction) =>
              instructionApplications.concat(instruction.applications),
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

  onUpdateInstructionApplication(
    instructionId: string,
    instructionApplicationId: string,
    instructionApplicationData: EditInstructionApplicationSubmit
  ) {
    this._instructionApplicationApiService
      .updateInstructionApplication(
        instructionId,
        instructionApplicationId,
        instructionApplicationData.name
      )
      .subscribe();
  }

  onDeleteInstructionApplication(
    instructionId: string,
    instructionApplicationId: string
  ) {
    this._instructionApplicationApiService
      .deleteInstructionApplication(instructionId, instructionApplicationId)
      .subscribe(() => this._boardStore.setSelected(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    instructionApplication: InstructionApplicationView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditInstructionApplicationModal(this._dialog, {
            instructionApplication,
          })
            .closed.pipe(
              concatMap((instructionApplicationData) => {
                this.isEditing = false;

                if (instructionApplicationData === undefined) {
                  return EMPTY;
                }

                return this._instructionApplicationApiService.updateInstructionApplication(
                  instructionApplication.ownerId,
                  instructionApplication.id,
                  instructionApplicationData.name
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

                return this._instructionApplicationApiService
                  .deleteInstructionApplication(
                    instructionApplication.ownerId,
                    instructionApplication.id
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

import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { InstructionSysvarView } from '../../board/utils';
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
  EditInstructionSysvarSubmit,
  openEditInstructionSysvarModal,
  UpdateInstructionSysvarModalDirective,
} from '../components';
import { InstructionSysvarApiService } from '../services';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-instruction-sysvar-dock',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <div
        *ngIf="selected$ | ngrxPush as selected"
        class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <img
          [src]="selected?.sysvar?.thumbnailUrl"
          pgDefaultImage="assets/generic/instruction-sysvar.png"
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
            pgThumbnailUrl="assets/generic/instruction-sysvar.png"
            pgUpdateInstructionSysvarModal
            [pgInstructionSysvar]="selected"
            (pgOpenModal)="isEditing = true"
            (pgCloseModal)="isEditing = false"
            (pgUpdateInstructionSysvar)="
              onUpdateInstructionSysvar(selected.ownerId, selected.id, $event)
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
            pgThumbnailUrl="assets/generic/instruction-sysvar.png"
            pgConfirmModal
            pgMessage="Are you sure? This action cannot be reverted."
            (pgConfirm)="
              onDeleteInstructionSysvar(selected.ownerId, selected.id)
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
    UpdateInstructionSysvarModalDirective,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
  ],
})
export class InstructionSysvarDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionSysvarApiService = inject(
    InstructionSysvarApiService
  );

  readonly selected$ = combineLatest([
    this._boardStore.instructions$,
    this._boardStore.selected$,
  ]).pipe(
    map(([instructions, selected]) => {
      if (
        isNull(instructions) ||
        isNull(selected) ||
        selected.kind !== 'instructionSysvar'
      ) {
        return null;
      }

      return (
        instructions
          .reduce<InstructionSysvarView[]>(
            (instructionSysvars, instruction) =>
              instructionSysvars.concat(instruction.sysvars),
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

  onUpdateInstructionSysvar(
    instructionId: string,
    instructionSysvarId: string,
    instructionSysvarData: EditInstructionSysvarSubmit
  ) {
    this._instructionSysvarApiService
      .updateInstructionSysvar(instructionId, instructionSysvarId, {
        name: instructionSysvarData.name,
      })
      .subscribe();
  }

  onDeleteInstructionSysvar(
    instructionId: string,
    instructionSysvarId: string
  ) {
    this._instructionSysvarApiService
      .deleteInstructionSysvar(instructionId, instructionSysvarId)
      .subscribe(() => this._boardStore.setSelected(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    instructionSysvar: InstructionSysvarView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditInstructionSysvarModal(this._dialog, {
            instructionSysvar,
          })
            .closed.pipe(
              concatMap((instructionSysvarData) => {
                this.isEditing = false;

                if (instructionSysvarData === undefined) {
                  return EMPTY;
                }

                return this._instructionSysvarApiService.updateInstructionSysvar(
                  instructionSysvar.ownerId,
                  instructionSysvar.id,
                  { name: instructionSysvarData.name }
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

                return this._instructionSysvarApiService
                  .deleteInstructionSysvar(
                    instructionSysvar.ownerId,
                    instructionSysvar.id
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

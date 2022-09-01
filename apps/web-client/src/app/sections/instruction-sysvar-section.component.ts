import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map, of, tap } from 'rxjs';
import { SquareButtonComponent } from '../components';
import {
  DefaultImageDirective,
  KeyboardListenerDirective,
} from '../directives';
import {
  ConfirmModalDirective,
  EditInstructionSysvarModalDirective,
  EditInstructionSysvarSubmit,
  openConfirmModal,
  openEditInstructionSysvarModal,
} from '../modals';
import { SlotHotkeyPipe } from '../pipes';
import { InstructionSysvarApiService } from '../services';
import { BoardStore, InstructionSysvarView } from '../stores';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-instruction-sysvar-section',
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
            pgEditInstructionSysvarModal
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
    EditInstructionSysvarModalDirective,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
  ],
})
export class InstructionSysvarSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionSysvarApiService = inject(
    InstructionSysvarApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'instructionSysvar') {
        return null;
      }

      return selected;
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
      .updateInstructionSysvar(
        instructionId,
        instructionSysvarId,
        instructionSysvarData.name
      )
      .subscribe();
  }

  onDeleteInstructionSysvar(
    instructionId: string,
    instructionSysvarId: string
  ) {
    this._instructionSysvarApiService
      .deleteInstructionSysvar(instructionId, instructionSysvarId)
      .subscribe(() => this._boardStore.setSelectedId(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    instructionSysvar: InstructionSysvarView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (hotkey !== null) {
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
                  instructionSysvarData.name
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
                  .pipe(tap(() => this._boardStore.setSelectedId(null)));
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

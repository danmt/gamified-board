import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map, of, tap } from 'rxjs';
import { SquareButtonComponent } from '../components';
import { KeyboardListenerDirective } from '../directives';
import {
  ConfirmModalDirective,
  EditInstructionSignerModalDirective,
  EditInstructionSignerSubmit,
  openConfirmModal,
  openEditInstructionSignerModal,
} from '../modals';
import { SlotHotkeyPipe } from '../pipes';
import { InstructionSignerApiService } from '../services';
import { BoardStore, InstructionSignerView } from '../stores';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-instruction-signer-section',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <div
        *ngIf="selected$ | ngrxPush as selected"
        class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <img src="assets/generic/signer.png" />

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
            pgThumbnailUrl="assets/generic/signer.png"
            pgEditInstructionSignerModal
            [pgInstructionSigner]="selected"
            (pgOpenModal)="isEditing = true"
            (pgCloseModal)="isEditing = false"
            (pgUpdateInstructionSigner)="
              onUpdateInstructionSigner(selected.ownerId, selected.id, $event)
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
            pgThumbnailUrl="assets/generic/signer.png"
            pgConfirmModal
            pgMessage="Are you sure? This action cannot be reverted."
            (pgConfirm)="
              onDeleteInstructionSigner(selected.ownerId, selected.id)
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
    EditInstructionSignerModalDirective,
    KeyboardListenerDirective,
    ConfirmModalDirective,
  ],
})
export class InstructionSignerSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionSignerApiService = inject(
    InstructionSignerApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'instructionSigner') {
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

  onUpdateInstructionSigner(
    instructionId: string,
    instructionSignerId: string,
    instructionSignerData: EditInstructionSignerSubmit
  ) {
    this._instructionSignerApiService
      .updateInstructionSigner(
        instructionId,
        instructionSignerId,
        instructionSignerData.name
      )
      .subscribe();
  }

  onDeleteInstructionSigner(
    instructionId: string,
    instructionSignerId: string
  ) {
    this._instructionSignerApiService
      .deleteInstructionSigner(instructionId, instructionSignerId)
      .subscribe(() => this._boardStore.setSelectedId(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    instructionSigner: InstructionSignerView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (hotkey !== null) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditInstructionSignerModal(this._dialog, {
            instructionSigner,
          })
            .closed.pipe(
              concatMap((instructionSignerData) => {
                this.isEditing = false;

                if (instructionSignerData === undefined) {
                  return EMPTY;
                }

                return this._instructionSignerApiService.updateInstructionSigner(
                  instructionSigner.ownerId,
                  instructionSigner.id,
                  instructionSignerData.name
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

                return this._instructionSignerApiService
                  .deleteInstructionSigner(
                    instructionSigner.ownerId,
                    instructionSigner.id
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

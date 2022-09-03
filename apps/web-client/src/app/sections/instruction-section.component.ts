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
  EditInstructionModalDirective,
  EditInstructionSubmit,
  openConfirmModal,
  openEditInstructionModal,
} from '../modals';
import { SlotHotkeyPipe } from '../pipes';
import { InstructionApiService } from '../services';
import { BoardStore, InstructionView } from '../stores';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-instruction-section',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <div
        *ngIf="selected$ | ngrxPush as selected"
        class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <img
          [src]="selected?.thumbnailUrl"
          pgDefaultImage="assets/generic/instruction.png"
        />

        {{ selected?.name }}

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
          *ngIf="(currentApplicationId$ | ngrxPush) === selected.application.id"
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
            pgThumbnailUrl="assets/generic/instruction.png"
            pgEditInstructionModal
            [pgInstruction]="selected"
            (pgOpenModal)="isEditing = true"
            (pgCloseModal)="isEditing = false"
            (pgUpdateInstruction)="onUpdateInstruction(selected.id, selected)"
          ></pg-square-button>
        </div>

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
          *ngIf="(currentApplicationId$ | ngrxPush) === selected.application.id"
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
            pgThumbnailUrl="assets/generic/instruction.png"
            (pgConfirm)="onDeleteInstruction(selected.id)"
            pgConfirmModal
            pgMessage="Are you sure? This action cannot be reverted."
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
    EditInstructionModalDirective,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    EditInstructionModalDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
  ],
})
export class InstructionSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionApiService = inject(InstructionApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'instruction') {
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

  onUpdateInstruction(
    instructionId: string,
    instructionData: EditInstructionSubmit
  ) {
    this._instructionApiService
      .updateInstruction(
        instructionId,
        instructionData.name,
        instructionData.thumbnailUrl,
        instructionData.arguments
      )
      .subscribe();
  }

  onDeleteInstruction(instructionId: string) {
    this._instructionApiService
      .deleteInstruction(instructionId)
      .subscribe(() => this._boardStore.setSelectedId(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    instruction: InstructionView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (hotkey !== null) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditInstructionModal(this._dialog, { instruction })
            .closed.pipe(
              concatMap((instructionData) => {
                this.isEditing = false;

                if (instructionData === undefined) {
                  return EMPTY;
                }

                return this._instructionApiService.updateInstruction(
                  instruction.id,
                  instructionData.name,
                  instructionData.thumbnailUrl,
                  instructionData.arguments
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

                return this._instructionApiService
                  .deleteInstruction(instruction.id)
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

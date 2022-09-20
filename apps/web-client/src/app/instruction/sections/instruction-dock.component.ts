import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Storage } from '@angular/fire/storage';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { InstructionView } from '../../board/utils';
import {
  ConfirmModalDirective,
  openConfirmModal,
  openUploadFileModal,
  openUploadFileProgressModal,
  SquareButtonComponent,
  UploadFileModalDirective,
} from '../../shared/components';
import { SecondaryDockComponent } from '../../shared/components/secondary-dock.component';
import {
  DefaultImageDirective,
  KeyboardListenerDirective,
} from '../../shared/directives';
import { SlotHotkeyPipe } from '../../shared/pipes';
import { generateId, isNotNull, isNull } from '../../shared/utils';
import {
  EditInstructionArgumentsSubmit,
  // EditInstructionSubmit,
  openEditInstructionArgumentsModal,
  UpdateInstructionArgumentsModalDirective,
  UpdateInstructionModalDirective,
} from '../components';
import { InstructionApiService } from '../services';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-instruction-dock',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <pg-secondary-dock
        *ngIf="selected$ | ngrxPush as selected"
        class="text-white block bp-font-game"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <div class="flex gap-4 justify-center items-start">
          <img
            [src]="selected?.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction.png"
            class="w-[100px] h-[106px] overflow-hidden rounded-xl"
          />

          <div>
            <h2 class="text-xl">Name</h2>
            <p class="text-base">{{ selected?.name }}</p>
            <h2 class="text-xl">Kind</h2>
            <p class="text-base">{{ selected?.kind }}</p>
          </div>

          <div
            class="ml-10"
            *ngIf="
              (currentApplicationId$ | ngrxPush) === selected.application.id
            "
          >
            <h2 class="text-xl">Actions</h2>
            <div class="flex gap-4 justify-center items-start">
              <!-- <div
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
                  [pgIsActive]="isUpdating"
                  pgThumbnailUrl="assets/generic/instruction.png"
                  pgUpdateInstructionModal
                  [pgInstruction]="selected"
                  (pgOpenModal)="isUpdating = true"
                  (pgCloseModal)="isUpdating = false"
                  (pgUpdateInstruction)="
                    onUpdateInstruction(selected.id, $event)
                  "
                ></pg-square-button>
              </div> -->

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
                *ngIf="
                  (currentApplicationId$ | ngrxPush) === selected.application.id
                "
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

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <ng-container *ngrxLet="hotkeys$; let hotkeys">
                  <span
                    *ngIf="2 | pgSlotHotkey: hotkeys as hotkey"
                    class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                    style="font-size: 0.5rem; line-height: 0.5rem"
                  >
                    {{ hotkey }}
                  </span>
                </ng-container>

                <pg-square-button
                  [pgIsActive]="isUpdatingThumbnail"
                  pgThumbnailUrl="assets/generic/instruction.png"
                  pgUploadFileModal
                  (pgOpenModal)="isUpdatingThumbnail = true"
                  (pgCloseModal)="isUpdatingThumbnail = false"
                  (pgSubmit)="
                    onUploadThumbnail(
                      selected.id,
                      $event.fileId,
                      $event.fileUrl
                    )
                  "
                ></pg-square-button>
              </div>

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <span
                  *ngIf="3 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                >
                  {{ hotkey }}
                </span>

                <pg-square-button
                  [pgIsActive]="isUpdatingArguments"
                  pgThumbnailUrl="assets/generic/instruction.png"
                  pgUpdateInstructionArgumentsModal
                  [pgInstructionArguments]="selected.arguments"
                  (pgOpenModal)="isUpdatingArguments = true"
                  (pgCloseModal)="isUpdatingArguments = false"
                  (pgUpdateInstructionArguments)="
                    onUpdateInstructionArguments(selected.id, $event)
                  "
                ></pg-square-button>
              </div>
            </div>
          </div>
        </div>
      </pg-secondary-dock>
    </ng-container>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    UpdateInstructionModalDirective,
    UpdateInstructionArgumentsModalDirective,
    UploadFileModalDirective,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
    SecondaryDockComponent,
  ],
})
export class InstructionDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _storage = inject(Storage);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionApiService = inject(InstructionApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = combineLatest([
    this._boardStore.instructions$,
    this._boardStore.selected$,
  ]).pipe(
    map(([instructions, selected]) => {
      if (
        isNull(instructions) ||
        isNull(selected) ||
        selected.kind !== 'instruction'
      ) {
        return null;
      }

      return instructions.find(({ id }) => id === selected.id) ?? null;
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
    {
      slot: 2,
      code: 'KeyE',
      key: 'e',
    },
    {
      slot: 3,
      code: 'KeyR',
      key: 'r',
    },
  ]);

  isUpdating = false;
  isDeleting = false;
  isUpdatingThumbnail = false;
  isUpdatingArguments = false;

  /* onUpdateInstruction(
    instructionId: string,
    instructionData: EditInstructionSubmit
  ) {
    this._instructionApiService
      .updateInstruction(instructionId, {
        name: instructionData.name,
      })
      .subscribe();
  } */

  onUpdateInstructionArguments(
    instructionId: string,
    instructionArgumentsData: EditInstructionArgumentsSubmit
  ) {
    this._instructionApiService
      .updateInstruction(instructionId, {
        arguments: instructionArgumentsData,
      })
      .subscribe();
  }

  onUploadThumbnail(instructionId: string, fileId: string, fileUrl: string) {
    this._instructionApiService
      .updateInstructionThumbnail(instructionId, {
        fileId,
        fileUrl,
      })
      .subscribe();
  }

  onDeleteInstruction(instructionId: string) {
    this._instructionApiService
      .deleteInstruction(instructionId)
      .subscribe(() => this._boardStore.setSelected(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    instruction: InstructionView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        /* case 0: {
          this.isUpdating = true;

          openEditInstructionModal(this._dialog, { instruction })
            .closed.pipe(
              concatMap((instructionData) => {
                this.isUpdating = false;

                if (instructionData === undefined) {
                  return EMPTY;
                }

                return this._instructionApiService.updateInstruction(
                  instruction.id,
                  {
                    name: instructionData.name,
                  }
                );
              })
            )
            .subscribe();

          break;
        } */

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
                  .pipe(tap(() => this._boardStore.setSelected(null)));
              })
            )
            .subscribe();

          break;
        }

        case 2: {
          this.isUpdatingThumbnail = true;

          const fileId = generateId();
          const fileName = `${fileId}.png`;

          openUploadFileModal(this._dialog)
            .closed.pipe(
              concatMap((uploadFileData) => {
                this.isUpdatingThumbnail = false;

                if (uploadFileData === undefined) {
                  return EMPTY;
                }

                return openUploadFileProgressModal(
                  this._dialog,
                  this._storage,
                  fileName,
                  uploadFileData.fileSource
                ).closed;
              }),
              concatMap((payload) => {
                if (payload === undefined) {
                  return EMPTY;
                }

                return this._instructionApiService.updateInstructionThumbnail(
                  instruction.id,
                  { fileId, fileUrl: payload.fileUrl }
                );
              })
            )
            .subscribe();

          break;
        }

        case 3: {
          this.isUpdatingArguments = true;

          openEditInstructionArgumentsModal(this._dialog, {
            instructionArguments: instruction.arguments,
          })
            .closed.pipe(
              concatMap((instructionArgumentsData) => {
                this.isUpdatingArguments = false;

                if (instructionArgumentsData === undefined) {
                  return EMPTY;
                }

                return this._instructionApiService.updateInstruction(
                  instruction.id,
                  {
                    arguments: instructionArgumentsData,
                  }
                );
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

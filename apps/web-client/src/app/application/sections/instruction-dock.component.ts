import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { ComponentStore } from '@ngrx/component-store';
import {
  ConfirmModalDirective,
  SecondaryDockComponent,
  SquareButtonComponent,
  UploadFileModalDirective,
} from '../../shared/components';
import {
  DefaultImageDirective,
  KeyListenerDirective,
} from '../../shared/directives';
import { SlotHotkeyPipe } from '../../shared/pipes';
import { Option } from '../../shared/utils';
import {
  CreateInstructionModalDirective,
  UpdateInstructionModalDirective,
  UpdateInstructionSubmit,
} from '../components';
import { InstructionNode } from '../utils';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

interface ViewModel {
  instruction: Option<InstructionNode>;
  isUpdating: boolean;
  isUpdatingThumbnail: boolean;
  isDeleting: boolean;
  hotkeys: [HotKey, HotKey, HotKey, HotKey];
}

const initialState: ViewModel = {
  instruction: null,
  isUpdating: false,
  isUpdatingThumbnail: false,
  isDeleting: false,
  hotkeys: [
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
  ],
};

@Component({
  selector: 'pg-instruction-dock',
  template: `
    <pg-secondary-dock
      *ngIf="instruction$ | ngrxPush as instruction"
      class="text-white block bp-font-game"
      pgKeyListener="Escape"
      (pgKeyDown)="onUnselectInstruction()"
    >
      <div class="flex gap-4 justify-center items-start">
        <img
          [src]="instruction.data.thumbnailUrl"
          pgDefaultImageUrl="assets/generic/instruction.png"
          class="w-[100px] h-[106px] overflow-hidden rounded-xl"
        />

        <div>
          <h2 class="text-xl">Name</h2>
          <p class="text-base">{{ instruction.data.name }}</p>
        </div>

        <div class="ml-10">
          <h2 class="text-xl">Actions</h2>

          <div class="flex gap-4 justify-center items-start">
            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="0 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[0].code"
                  (pgKeyDown)="updateInstructionModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/instruction.png"
                [pgIsActive]="false"
                pgUpdateInstructionModal
                #updateInstructionModal="modal"
                [pgInstruction]="instruction"
                (pgOpenModal)="setIsUpdating(true)"
                (pgCloseModal)="setIsUpdating(false)"
                (pgUpdateInstruction)="
                  onUpdateInstruction(instruction.id, $event)
                "
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[1].code"
                  (pgKeyDown)="updateInstructionThumbnailModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/instruction.png"
                [pgIsActive]="(isUpdatingThumbnail$ | ngrxPush) ?? false"
                pgUploadFileModal
                #updateInstructionThumbnailModal="modal"
                (pgSubmit)="
                  onUploadThumbnail(
                    instruction.id,
                    $event.fileId,
                    $event.fileUrl
                  )
                "
                (pgOpenModal)="setIsUpdatingThumbnail(true)"
                (pgCloseModal)="setIsUpdatingThumbnail(false)"
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="2 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[2].code"
                  (pgKeyDown)="deleteInstructionModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                [pgIsActive]="(isDeleting$ | ngrxPush) ?? false"
                pgThumbnailUrl="assets/generic/instruction.png"
                (pgConfirm)="onDeleteInstruction(instruction.id)"
                pgConfirmModal
                #deleteInstructionModal="modal"
                pgMessage="Are you sure? This action cannot be reverted."
                (pgOpenModal)="setIsDeleting(true)"
                (pgCloseModal)="setIsDeleting(false)"
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="3 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[3].code"
                  (pgKeyDown)="onUnselectInstruction()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/instruction.png"
                (click)="onUnselectInstruction()"
              ></pg-square-button>
            </div>
          </div>
        </div>
      </div>
    </pg-secondary-dock>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
    KeyListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
    UploadFileModalDirective,
    UpdateInstructionModalDirective,
    CreateInstructionModalDirective,
    SecondaryDockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionDockComponent extends ComponentStore<ViewModel> {
  readonly isUpdating$ = this.select(({ isUpdating }) => isUpdating);
  readonly isUpdatingThumbnail$ = this.select(
    ({ isUpdatingThumbnail }) => isUpdatingThumbnail
  );
  readonly isDeleting$ = this.select(({ isDeleting }) => isDeleting);
  readonly hotkeys$ = this.select(({ hotkeys }) => hotkeys);
  readonly instruction$ = this.select(({ instruction }) => instruction);

  @Input() set pgInstruction(instruction: Option<InstructionNode>) {
    this.patchState({ instruction });
  }
  @Output() pgInstructionUnselected = new EventEmitter();
  @Output() pgUpdateInstruction = new EventEmitter<{
    id: string;
    changes: UpdateInstructionSubmit;
  }>();
  @Output() pgUpdateInstructionThumbnail = new EventEmitter<{
    id: string;
    fileId: string;
    fileUrl: string;
  }>();
  @Output() pgDeleteInstruction = new EventEmitter<string>();

  readonly setIsUpdating = this.updater<boolean>((state, isUpdating) => ({
    ...state,
    isUpdating,
  }));

  readonly setIsUpdatingThumbnail = this.updater<boolean>(
    (state, isUpdatingThumbnail) => ({
      ...state,
      isUpdatingThumbnail,
    })
  );

  readonly setIsDeleting = this.updater<boolean>((state, isDeleting) => ({
    ...state,
    isDeleting,
  }));

  constructor() {
    super(initialState);
  }

  onUpdateInstruction(
    instructionId: string,
    instructionData: UpdateInstructionSubmit
  ) {
    this.pgUpdateInstruction.emit({
      id: instructionId,
      changes: instructionData,
    });
  }

  onUploadThumbnail(instructionId: string, fileId: string, fileUrl: string) {
    this.pgUpdateInstructionThumbnail.emit({
      id: instructionId,
      fileId,
      fileUrl,
    });
  }

  onDeleteInstruction(instructionId: string) {
    this.pgDeleteInstruction.emit(instructionId);
  }

  onUnselectInstruction() {
    this.pgInstructionUnselected.emit();
  }
}

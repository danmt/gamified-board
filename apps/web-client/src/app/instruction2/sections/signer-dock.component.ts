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
import { UpdateSignerModalDirective, UpdateSignerSubmit } from '../components';
import { SignerNode } from '../utils';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

interface ViewModel {
  signer: Option<SignerNode>;
  isUpdating: boolean;
  isUpdatingThumbnail: boolean;
  isDeleting: boolean;
  hotkeys: [HotKey, HotKey, HotKey, HotKey];
}

const initialState: ViewModel = {
  signer: null,
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
  selector: 'pg-signer-dock',
  template: `
    <pg-secondary-dock
      *ngIf="signer$ | ngrxPush as signer"
      class="text-white block bp-font-game"
      pgKeyListener="Escape"
      (pgKeyDown)="onUnselectSigner()"
    >
      <div class="flex gap-4 justify-center items-start">
        <img
          [src]="signer.data.thumbnailUrl"
          pgDefaultImageUrl="assets/generic/signer.png"
          class="w-[100px] h-[106px] overflow-hidden rounded-xl"
        />

        <div>
          <h2 class="text-xl">Name</h2>
          <p class="text-base">{{ signer.data.name }}</p>
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
                  (pgKeyDown)="updateSignerModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/signer.png"
                [pgIsActive]="false"
                pgUpdateSignerModal
                #updateSignerModal="modal"
                [pgSigner]="signer"
                (pgOpenModal)="setIsUpdating(true)"
                (pgCloseModal)="setIsUpdating(false)"
                (pgUpdateSigner)="onUpdateSigner(signer.id, $event)"
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[1].code"
                  (pgKeyDown)="updateSignerThumbnailModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/signer.png"
                [pgIsActive]="(isUpdatingThumbnail$ | ngrxPush) ?? false"
                pgUploadFileModal
                #updateSignerThumbnailModal="modal"
                (pgSubmit)="
                  onUploadThumbnail(signer.id, $event.fileId, $event.fileUrl)
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
                  (pgKeyDown)="deleteSignerModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                [pgIsActive]="(isDeleting$ | ngrxPush) ?? false"
                pgThumbnailUrl="assets/generic/signer.png"
                (pgConfirm)="onDeleteSigner(signer.id)"
                pgConfirmModal
                #deleteSignerModal="modal"
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
                  (pgKeyDown)="onUnselectSigner()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/signer.png"
                (click)="onUnselectSigner()"
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
    UpdateSignerModalDirective,
    SecondaryDockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignerDockComponent extends ComponentStore<ViewModel> {
  readonly isUpdating$ = this.select(({ isUpdating }) => isUpdating);
  readonly isUpdatingThumbnail$ = this.select(
    ({ isUpdatingThumbnail }) => isUpdatingThumbnail
  );
  readonly isDeleting$ = this.select(({ isDeleting }) => isDeleting);
  readonly hotkeys$ = this.select(({ hotkeys }) => hotkeys);
  readonly signer$ = this.select(({ signer }) => signer);

  @Input() set pgSigner(signer: Option<SignerNode>) {
    this.patchState({ signer });
  }
  @Output() pgSignerUnselected = new EventEmitter();
  @Output() pgUpdateSigner = new EventEmitter<{
    id: string;
    changes: UpdateSignerSubmit;
  }>();
  @Output() pgUpdateSignerThumbnail = new EventEmitter<{
    id: string;
    fileId: string;
    fileUrl: string;
  }>();
  @Output() pgDeleteSigner = new EventEmitter<string>();

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

  onUpdateSigner(signerId: string, signerData: UpdateSignerSubmit) {
    this.pgUpdateSigner.emit({
      id: signerId,
      changes: signerData,
    });
  }

  onUploadThumbnail(signerId: string, fileId: string, fileUrl: string) {
    this.pgUpdateSignerThumbnail.emit({
      id: signerId,
      fileId,
      fileUrl,
    });
  }

  onDeleteSigner(signerId: string) {
    this.pgDeleteSigner.emit(signerId);
  }

  onUnselectSigner() {
    this.pgSignerUnselected.emit();
  }
}

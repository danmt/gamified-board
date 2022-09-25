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
import { UpdateSysvarModalDirective, UpdateSysvarSubmit } from '../components';
import { SysvarNode } from '../utils';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

interface ViewModel {
  sysvar: Option<SysvarNode>;
  isUpdating: boolean;
  isUpdatingThumbnail: boolean;
  isDeleting: boolean;
  hotkeys: [HotKey, HotKey, HotKey, HotKey];
}

const initialState: ViewModel = {
  sysvar: null,
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
  selector: 'pg-sysvar-dock',
  template: `
    <pg-secondary-dock
      *ngIf="sysvar$ | ngrxPush as sysvar"
      class="text-white block bp-font-game"
      pgKeyListener="Escape"
      (pgKeyDown)="onUnselectSysvar()"
    >
      <div class="flex gap-4 justify-center items-start">
        <img
          [src]="sysvar.data.thumbnailUrl"
          pgDefaultImageUrl="assets/generic/sysvar.png"
          class="w-[100px] h-[106px] overflow-hidden rounded-xl"
        />

        <div>
          <h2 class="text-xl">Name</h2>
          <p class="text-base">{{ sysvar.data.name }}</p>
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
                  (pgKeyDown)="updateSysvarModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/sysvar.png"
                [pgIsActive]="false"
                pgUpdateSysvarModal
                #updateSysvarModal="modal"
                [pgSysvar]="sysvar"
                (pgOpenModal)="setIsUpdating(true)"
                (pgCloseModal)="setIsUpdating(false)"
                (pgUpdateSysvar)="onUpdateSysvar(sysvar.id, $event)"
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[1].code"
                  (pgKeyDown)="updateSysvarThumbnailModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/sysvar.png"
                [pgIsActive]="(isUpdatingThumbnail$ | ngrxPush) ?? false"
                pgUploadFileModal
                #updateSysvarThumbnailModal="modal"
                (pgSubmit)="
                  onUploadThumbnail(sysvar.id, $event.fileId, $event.fileUrl)
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
                  (pgKeyDown)="deleteSysvarModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                [pgIsActive]="(isDeleting$ | ngrxPush) ?? false"
                pgThumbnailUrl="assets/generic/sysvar.png"
                (pgConfirm)="onDeleteSysvar(sysvar.id)"
                pgConfirmModal
                #deleteSysvarModal="modal"
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
                  (pgKeyDown)="onUnselectSysvar()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/sysvar.png"
                (click)="onUnselectSysvar()"
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
    UpdateSysvarModalDirective,
    SecondaryDockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SysvarDockComponent extends ComponentStore<ViewModel> {
  readonly isUpdating$ = this.select(({ isUpdating }) => isUpdating);
  readonly isUpdatingThumbnail$ = this.select(
    ({ isUpdatingThumbnail }) => isUpdatingThumbnail
  );
  readonly isDeleting$ = this.select(({ isDeleting }) => isDeleting);
  readonly hotkeys$ = this.select(({ hotkeys }) => hotkeys);
  readonly sysvar$ = this.select(({ sysvar }) => sysvar);

  @Input() set pgSysvar(sysvar: Option<SysvarNode>) {
    this.patchState({ sysvar });
  }
  @Output() pgSysvarUnselected = new EventEmitter();
  @Output() pgUpdateSysvar = new EventEmitter<{
    id: string;
    changes: UpdateSysvarSubmit;
  }>();
  @Output() pgUpdateSysvarThumbnail = new EventEmitter<{
    id: string;
    fileId: string;
    fileUrl: string;
  }>();
  @Output() pgDeleteSysvar = new EventEmitter<string>();

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

  onUpdateSysvar(sysvarId: string, sysvarData: UpdateSysvarSubmit) {
    this.pgUpdateSysvar.emit({
      id: sysvarId,
      changes: sysvarData,
    });
  }

  onUploadThumbnail(sysvarId: string, fileId: string, fileUrl: string) {
    this.pgUpdateSysvarThumbnail.emit({
      id: sysvarId,
      fileId,
      fileUrl,
    });
  }

  onDeleteSysvar(sysvarId: string) {
    this.pgDeleteSysvar.emit(sysvarId);
  }

  onUnselectSysvar() {
    this.pgSysvarUnselected.emit();
  }
}

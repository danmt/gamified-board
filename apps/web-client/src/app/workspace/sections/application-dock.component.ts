import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { Storage } from '@angular/fire/storage';
import { LetModule, PushModule } from '@ngrx/component';
import { ComponentStore } from '@ngrx/component-store';
import { concatMap, EMPTY } from 'rxjs';
import {
  CreateApplicationModalDirective,
  openEditApplicationModal,
  UpdateApplicationModalDirective,
  UpdateApplicationSubmit,
} from '../../application/components';
import { Node } from '../../drawer/utils';
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
import { generateId, isNotNull, Option } from '../../shared/utils';
import { ActiveApplicationComponent } from './active-application.component';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

interface ViewModel {
  application: Option<Node>;
  isUpdating: boolean;
  isUpdatingThumbnail: boolean;
  isDeleting: boolean;
  hotkeys: [HotKey, HotKey, HotKey, HotKey];
}

const initialState: ViewModel = {
  application: null,
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
  selector: 'pg-application-dock',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <pg-secondary-dock
        *ngIf="application$ | ngrxPush as application"
        class="text-white block bp-font-game"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, application, $event)"
      >
        <div class="flex gap-4 justify-center items-start">
          <img
            [src]="application.thumbnailUrl"
            pgDefaultImageUrl="assets/generic/application.png"
            class="w-[100px] h-[106px] overflow-hidden rounded-xl"
          />

          <div>
            <h2 class="text-xl">Name</h2>
            <p class="text-base">{{ application?.name }}</p>
          </div>

          <div class="ml-10">
            <h2 class="text-xl">Actions</h2>

            <div class="flex gap-4 justify-center items-start">
              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <ng-container *ngrxLet="hotkeys$; let hotkeys">
                  <span
                    *ngIf="0 | pgSlotHotkey: hotkeys as hotkey"
                    class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                    style="font-size: 0.5rem; line-height: 0.5rem"
                  >
                    {{ hotkey }}
                  </span>
                </ng-container>

                <pg-square-button
                  pgThumbnailUrl="assets/generic/application.png"
                  [pgIsActive]="false"
                  pgUpdateApplicationModal
                  [pgApplication]="application"
                  (pgOpenModal)="setIsUpdating(true)"
                  (pgCloseModal)="setIsUpdating(false)"
                  (pgUpdateApplication)="
                    onUpdateApplication(application.id, $event)
                  "
                ></pg-square-button>
              </div>

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <ng-container *ngrxLet="hotkeys$; let hotkeys">
                  <span
                    *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
                    class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                    style="font-size: 0.5rem; line-height: 0.5rem"
                  >
                    {{ hotkey }}
                  </span>
                </ng-container>

                <pg-square-button
                  pgThumbnailUrl="assets/generic/application.png"
                  [pgIsActive]="(isUpdatingThumbnail$ | ngrxPush) ?? false"
                  pgUploadFileModal
                  (pgSubmit)="
                    onUploadThumbnail(
                      application.id,
                      $event.fileId,
                      $event.fileUrl
                    )
                  "
                  (pgOpenModal)="setIsUpdatingThumbnail(true)"
                  (pgCloseModal)="setIsUpdatingThumbnail(false)"
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
                  [pgIsActive]="(isDeleting$ | ngrxPush) ?? false"
                  pgThumbnailUrl="assets/generic/application.png"
                  (pgConfirm)="onDeleteApplication(application.id)"
                  pgConfirmModal
                  pgMessage="Are you sure? This action cannot be reverted."
                  (pgOpenModal)="setIsDeleting(true)"
                  (pgCloseModal)="setIsDeleting(false)"
                ></pg-square-button>
              </div>

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <ng-container *ngrxLet="hotkeys$; let hotkeys">
                  <span
                    *ngIf="3 | pgSlotHotkey: hotkeys as hotkey"
                    class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                    style="font-size: 0.5rem; line-height: 0.5rem"
                  >
                    {{ hotkey }}
                  </span>
                </ng-container>

                <pg-square-button
                  pgThumbnailUrl="assets/generic/application.png"
                  (click)="onUnselectApplication()"
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
    DialogModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
    UploadFileModalDirective,
    UpdateApplicationModalDirective,
    CreateApplicationModalDirective,
    SecondaryDockComponent,
    ActiveApplicationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationDockComponent extends ComponentStore<ViewModel> {
  private readonly _dialog = inject(Dialog);
  private readonly _storage = inject(Storage);

  readonly isUpdating$ = this.select(({ isUpdating }) => isUpdating);
  readonly isUpdatingThumbnail$ = this.select(
    ({ isUpdatingThumbnail }) => isUpdatingThumbnail
  );
  readonly isDeleting$ = this.select(({ isDeleting }) => isDeleting);
  readonly hotkeys$ = this.select(({ hotkeys }) => hotkeys);
  readonly application$ = this.select(({ application }) => application);

  @Input() set pgApplication(application: Option<Node>) {
    this.patchState({ application });
  }
  @Output() pgApplicationUnselected = new EventEmitter();
  @Output() pgUpdateApplication = new EventEmitter<{
    id: string;
    changes: UpdateApplicationSubmit;
  }>();
  @Output() pgUpdateApplicationThumbnail = new EventEmitter<{
    id: string;
    fileId: string;
    fileUrl: string;
  }>();
  @Output() pgDeleteApplication = new EventEmitter<string>();

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

  onUpdateApplication(
    applicationId: string,
    applicationData: UpdateApplicationSubmit
  ) {
    this.pgUpdateApplication.emit({
      id: applicationId,
      changes: applicationData,
    });
  }

  onUploadThumbnail(applicationId: string, fileId: string, fileUrl: string) {
    this.pgUpdateApplicationThumbnail.emit({
      id: applicationId,
      fileId,
      fileUrl,
    });
  }

  onDeleteApplication(applicationId: string) {
    this.pgDeleteApplication.emit(applicationId);
  }

  onUnselectApplication() {
    this.pgApplicationUnselected.emit();
  }

  onKeyDown(hotkeys: HotKey[], application: Node, event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.pgApplicationUnselected.emit();
    } else {
      const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

      if (isNotNull(hotkey)) {
        switch (hotkey.slot) {
          case 0: {
            this.setIsUpdating(true);

            openEditApplicationModal(this._dialog, {
              application,
            }).closed.subscribe((applicationData) => {
              this.setIsUpdating(false);

              if (applicationData) {
                this.pgUpdateApplication.emit({
                  id: application.id,
                  changes: applicationData,
                });
              }
            });

            break;
          }

          case 1: {
            this.setIsUpdatingThumbnail(true);

            const fileId = generateId();
            const fileName = `${fileId}.png`;

            openUploadFileModal(this._dialog)
              .closed.pipe(
                concatMap((uploadFileData) => {
                  this.setIsUpdatingThumbnail(false);

                  if (uploadFileData === undefined) {
                    return EMPTY;
                  }

                  return openUploadFileProgressModal(
                    this._dialog,
                    this._storage,
                    fileName,
                    uploadFileData.fileSource
                  ).closed;
                })
              )
              .subscribe((payload) => {
                if (payload) {
                  this.pgUpdateApplicationThumbnail.emit({
                    id: application.id,
                    fileId,
                    fileUrl: payload.fileUrl,
                  });
                }
              });

            break;
          }

          case 2: {
            this.setIsDeleting(true);

            openConfirmModal(this._dialog, {
              message: 'Are you sure? This action cannot be reverted.',
            }).closed.subscribe((confirmData) => {
              this.setIsDeleting(false);

              if (confirmData) {
                this.pgDeleteApplication.emit(application.id);
              }
            });

            break;
          }

          case 3: {
            this.pgApplicationUnselected.emit();

            break;
          }

          default: {
            break;
          }
        }
      }
    }
  }
}

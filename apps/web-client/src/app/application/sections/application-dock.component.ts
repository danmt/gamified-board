import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Storage } from '@angular/fire/storage';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { ApplicationView } from '../../board/utils';
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
  openEditApplicationModal,
  UpdateApplicationModalDirective,
  UpdateApplicationSubmit,
} from '../components';
import { ApplicationApiService } from '../services';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-application-dock',
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
            pgDefaultImage="assets/generic/application.png"
            class="w-[100px] h-[106px] overflow-hidden rounded-xl"
          />

          <div>
            <h2 class="text-xl">Name</h2>
            <p class="text-base">{{ selected?.name }}</p>
            <h2 class="text-xl">Kind</h2>
            <p class="text-base">{{ selected?.kind }}</p>
          </div>

          <div class="ml-10">
            <h2
              class="text-xl"
              *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
            >
              Actions
            </h2>
            <div class="flex gap-4 justify-center items-start">
              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
                *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
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
                  [pgIsActive]="isUpdating"
                  pgThumbnailUrl="assets/generic/application.png"
                  pgUpdateApplicationModal
                  [pgApplication]="selected"
                  (pgOpenModal)="isUpdating = true"
                  (pgCloseModal)="isUpdating = false"
                  (pgUpdateApplication)="
                    onUpdateApplication(selected.id, $event)
                  "
                ></pg-square-button>
              </div>

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
                *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
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
                  [pgIsActive]="isDeleting"
                  pgThumbnailUrl="assets/generic/application.png"
                  (pgConfirm)="onDeleteApplication(selected.id)"
                  pgConfirmModal
                  pgMessage="Are you sure? This action cannot be reverted."
                ></pg-square-button>
              </div>

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
                *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
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
                  pgThumbnailUrl="assets/generic/application.png"
                  pgUploadFileModal
                  (pgSubmit)="
                    onUploadThumbnail(
                      selected.id,
                      $event.fileId,
                      $event.fileUrl
                    )
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
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    UpdateApplicationModalDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
    UploadFileModalDirective,
    SecondaryDockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _storage = inject(Storage);
  private readonly _boardStore = inject(BoardStore);
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = combineLatest([
    this._boardStore.applications$,
    this._boardStore.selected$,
  ]).pipe(
    map(([applications, selected]) => {
      if (
        isNull(applications) ||
        isNull(selected) ||
        selected.kind !== 'application'
      ) {
        return null;
      }

      return applications.find(({ id }) => id === selected.id) ?? null;
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
  ]);

  isUpdating = false;
  isDeleting = false;
  isUpdatingThumbnail = false;

  onUpdateApplication(
    applicationId: string,
    applicationData: UpdateApplicationSubmit
  ) {
    this._applicationApiService
      .updateApplication(applicationId, {
        name: applicationData.name,
      })
      .subscribe();
  }

  onDeleteApplication(applicationId: string) {
    this._applicationApiService
      .deleteApplication(applicationId)
      .subscribe(() => this._boardStore.setSelected(null));
  }

  onUploadThumbnail(applicationId: string, fileId: string, fileUrl: string) {
    this._applicationApiService
      .updateApplicationThumbnail(applicationId, {
        fileId,
        fileUrl,
      })
      .subscribe();
  }

  onKeyDown(
    hotkeys: HotKey[],
    application: ApplicationView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        case 0: {
          this.isUpdating = true;

          openEditApplicationModal(this._dialog, { application })
            .closed.pipe(
              concatMap((applicationData) => {
                this.isUpdating = false;

                if (applicationData === undefined) {
                  return EMPTY;
                }

                return this._applicationApiService.updateApplication(
                  application.id,
                  {
                    name: applicationData.name,
                  }
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

                return this._applicationApiService
                  .deleteApplication(application.id)
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

                return this._applicationApiService.updateApplicationThumbnail(
                  application.id,
                  { fileId, fileUrl: payload.fileUrl }
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

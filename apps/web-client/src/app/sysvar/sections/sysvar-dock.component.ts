import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Storage } from '@angular/fire/storage';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore, SysvarView } from '../../core/stores';
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
  EditSysvarSubmit,
  openEditSysvarModal,
  UpdateSysvarModalDirective,
} from '../components';
import { SysvarApiService } from '../services';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-sysvar-dock',
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
            pgDefaultImage="assets/generic/sysvar.png"
            class="w-[140px]"
          />

          <div>
            <h2 class="text-xl">Name</h2>
            <p class="text-base">{{ selected?.name }}</p>
            <h2 class="text-xl">Kind</h2>
            <p class="text-base">{{ selected?.kind }}</p>
          </div>

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
              pgThumbnailUrl="assets/generic/sysvar.png"
              pgUpdateSysvarModal
              [pgSysvar]="selected"
              (pgOpenModal)="isEditing = true"
              (pgCloseModal)="isEditing = false"
              (pgUpdateSysvar)="onUpdateSysvar(selected.id, selected)"
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
              pgThumbnailUrl="assets/generic/sysvar.png"
              (pgConfirm)="onDeleteSysvar(selected.id)"
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
              pgThumbnailUrl="assets/generic/sysvar.png"
              pgUploadFileModal
              (pgSubmit)="
                onUploadThumbnail(selected.id, $event.fileId, $event.fileUrl)
              "
            ></pg-square-button>
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
    UpdateSysvarModalDirective,
    UploadFileModalDirective,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
    SecondaryDockComponent,
  ],
})
export class SysvarDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _storage = inject(Storage);
  private readonly _boardStore = inject(BoardStore);
  private readonly _sysvarApiService = inject(SysvarApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = combineLatest([
    this._boardStore.sysvars$,
    this._boardStore.selected$,
  ]).pipe(
    map(([sysvars, selected]) => {
      if (isNull(sysvars) || isNull(selected) || selected.kind !== 'sysvar') {
        return null;
      }

      return sysvars.find(({ id }) => id === selected.id) ?? null;
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

  isEditing = false;
  isDeleting = false;
  isUpdatingThumbnail = false;

  onUpdateSysvar(sysvarId: string, sysvarData: EditSysvarSubmit) {
    this._sysvarApiService
      .updateSysvar(sysvarId, { name: sysvarData.name })
      .subscribe();
  }

  onUploadThumbnail(sysvarId: string, fileId: string, fileUrl: string) {
    this._sysvarApiService
      .updateSysvarThumbnail(sysvarId, {
        fileId,
        fileUrl,
      })
      .subscribe();
  }

  onDeleteSysvar(sysvarId: string) {
    this._sysvarApiService
      .deleteSysvar(sysvarId)
      .subscribe(() => this._boardStore.setSelected(null));
  }

  onKeyDown(hotkeys: HotKey[], sysvar: SysvarView, event: KeyboardEvent) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditSysvarModal(this._dialog, { sysvar })
            .closed.pipe(
              concatMap((sysvarData) => {
                this.isEditing = false;

                if (sysvarData === undefined) {
                  return EMPTY;
                }

                return this._sysvarApiService.updateSysvar(sysvar.id, {
                  name: sysvarData.name,
                });
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

                return this._sysvarApiService
                  .deleteSysvar(sysvar.id)
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

                return this._sysvarApiService.updateSysvarThumbnail(sysvar.id, {
                  fileId,
                  fileUrl: payload.fileUrl,
                });
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

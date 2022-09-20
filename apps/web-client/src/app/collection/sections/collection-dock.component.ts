import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Storage } from '@angular/fire/storage';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { CollectionView } from '../../board/utils';
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
  EditCollectionAttributesSubmit,
  // EditCollectionSubmit,
  openEditCollectionAttributesModal,
  UpdateCollectionAttributesModalDirective,
  UpdateCollectionModalDirective,
} from '../components';
import { CollectionApiService } from '../services';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-collection-dock',
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
            pgDefaultImage="assets/generic/collection.png"
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
                  pgThumbnailUrl="assets/generic/collection.png"
                  pgUpdateCollectionModal
                  [pgCollection]="selected"
                  (pgOpenModal)="isUpdating = true"
                  (pgCloseModal)="isUpdating = false"
                  (pgUpdateCollection)="onUpdateCollection(selected.id, $event)"
                ></pg-square-button>
              </div> -->

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
                  pgThumbnailUrl="assets/generic/collection.png"
                  (pgConfirm)="onDeleteCollection(selected.id)"
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
                  pgThumbnailUrl="assets/generic/collection.png"
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
                  [pgIsActive]="isUpdatingAttributes"
                  pgThumbnailUrl="assets/generic/collection.png"
                  pgUpdateCollectionAttributesModal
                  [pgCollectionAttributes]="selected.attributes"
                  (pgOpenModal)="isUpdatingAttributes = true"
                  (pgCloseModal)="isUpdatingAttributes = false"
                  (pgUpdateCollectionAttributes)="
                    onUpdateCollectionAttributes(selected.id, $event)
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
    UpdateCollectionModalDirective,
    UpdateCollectionAttributesModalDirective,
    UploadFileModalDirective,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
    SecondaryDockComponent,
  ],
})
export class CollectionDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _storage = inject(Storage);
  private readonly _boardStore = inject(BoardStore);
  private readonly _collectionApiService = inject(CollectionApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = combineLatest([
    this._boardStore.collections$,
    this._boardStore.selected$,
  ]).pipe(
    map(([collections, selected]) => {
      if (
        isNull(collections) ||
        isNull(selected) ||
        selected.kind !== 'collection'
      ) {
        return null;
      }

      return collections.find(({ id }) => id === selected.id) ?? null;
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
  isUpdatingAttributes = false;

  onUpdateCollection(collectionId: string, collectionData: any) {
    this._collectionApiService
      .updateCollection(collectionId, {
        name: collectionData.name,
      })
      .subscribe();
  }

  onUpdateCollectionAttributes(
    collectionId: string,
    collectionAttributesData: EditCollectionAttributesSubmit
  ) {
    this._collectionApiService
      .updateCollection(collectionId, {
        attributes: collectionAttributesData,
      })
      .subscribe();
  }

  onDeleteCollection(collectionId: string) {
    this._collectionApiService
      .deleteCollection(collectionId)
      .subscribe(() => this._boardStore.setSelected(null));
  }

  onUploadThumbnail(collectionId: string, fileId: string, fileUrl: string) {
    this._collectionApiService
      .updateCollectionThumbnail(collectionId, {
        fileId,
        fileUrl,
      })
      .subscribe();
  }

  onKeyDown(
    hotkeys: HotKey[],
    collection: CollectionView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        /* case 0: {
          this.isUpdating = true;

          openEditCollectionModal(this._dialog, { collection })
            .closed.pipe(
              concatMap((collectionData) => {
                this.isUpdating = false;

                if (collectionData === undefined) {
                  return EMPTY;
                }

                return this._collectionApiService.updateCollection(
                  collection.id,
                  {
                    name: collectionData.name,
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

                return this._collectionApiService
                  .deleteCollection(collection.id)
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

                return this._collectionApiService.updateCollectionThumbnail(
                  collection.id,
                  { fileId, fileUrl: payload.fileUrl }
                );
              })
            )
            .subscribe();

          break;
        }

        case 3: {
          this.isUpdatingAttributes = true;

          openEditCollectionAttributesModal(this._dialog, {
            collectionAttributes: collection.attributes,
          })
            .closed.pipe(
              concatMap((collectionAttributesData) => {
                this.isUpdatingAttributes = false;

                if (collectionAttributesData === undefined) {
                  return EMPTY;
                }

                return this._collectionApiService.updateCollection(
                  collection.id,
                  {
                    attributes: collectionAttributesData,
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

import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore, CollectionView } from '../../core/stores';
import {
  ConfirmModalDirective,
  openConfirmModal,
  SquareButtonComponent,
} from '../../shared/components';
import {
  DefaultImageDirective,
  KeyboardListenerDirective,
} from '../../shared/directives';
import { SlotHotkeyPipe } from '../../shared/pipes';
import { isNotNull, isNull } from '../../shared/utils';
import {
  EditCollectionSubmit,
  openEditCollectionModal,
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
      <div
        *ngIf="selected$ | ngrxPush as selected"
        class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <img
          [src]="selected?.thumbnailUrl"
          pgDefaultImage="assets/generic/collection.png"
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
            pgThumbnailUrl="assets/generic/collection.png"
            pgUpdateCollectionModal
            [pgCollection]="selected"
            (pgOpenModal)="isEditing = true"
            (pgCloseModal)="isEditing = false"
            (pgUpdateCollection)="onUpdateCollection(selected.id, $event)"
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
            pgThumbnailUrl="assets/generic/collection.png"
            (pgConfirm)="onDeleteCollection(selected.id)"
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
    UpdateCollectionModalDirective,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
  ],
})
export class CollectionDockComponent {
  private readonly _dialog = inject(Dialog);
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
  ]);

  isEditing = false;
  isDeleting = false;

  onUpdateCollection(
    collectionId: string,
    collectionData: EditCollectionSubmit
  ) {
    this._collectionApiService
      .updateCollection(
        collectionId,
        collectionData.name,
        collectionData.thumbnailUrl,
        collectionData.attributes
      )
      .subscribe();
  }

  onDeleteCollection(collectionId: string) {
    this._collectionApiService
      .deleteCollection(collectionId)
      .subscribe(() => this._boardStore.setSelected(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    collection: CollectionView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditCollectionModal(this._dialog, { collection })
            .closed.pipe(
              concatMap((collectionData) => {
                this.isEditing = false;

                if (collectionData === undefined) {
                  return EMPTY;
                }

                return this._collectionApiService.updateCollection(
                  collection.id,
                  collectionData.name,
                  collectionData.thumbnailUrl,
                  collectionData.attributes
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

                return this._collectionApiService
                  .deleteCollection(collection.id)
                  .pipe(tap(() => this._boardStore.setSelected(null)));
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

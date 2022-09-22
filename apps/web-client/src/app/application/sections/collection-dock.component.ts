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
import { Node } from '../../drawer/utils';
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
  UpdateCollectionModalDirective,
  UpdateCollectionSubmit,
} from '../components';
import { ApplicationNodeData } from '../utils';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

interface ViewModel {
  collection: Option<Node<ApplicationNodeData>>;
  isUpdating: boolean;
  isUpdatingThumbnail: boolean;
  isDeleting: boolean;
  hotkeys: [HotKey, HotKey, HotKey, HotKey];
}

const initialState: ViewModel = {
  collection: null,
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
  selector: 'pg-collection-dock',
  template: `
    <pg-secondary-dock
      *ngIf="collection$ | ngrxPush as collection"
      class="text-white block bp-font-game"
      pgKeyListener="Escape"
      (pgKeyDown)="onUnselectCollection()"
    >
      <div class="flex gap-4 justify-center items-start">
        <img
          [src]="collection.data.thumbnailUrl"
          pgDefaultImageUrl="assets/generic/collection.png"
          class="w-[100px] h-[106px] overflow-hidden rounded-xl"
        />

        <div>
          <h2 class="text-xl">Name</h2>
          <p class="text-base">{{ collection.data.name }}</p>
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
                  (pgKeyDown)="updateCollectionModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/collection.png"
                [pgIsActive]="false"
                pgUpdateCollectionModal
                #updateCollectionModal="modal"
                [pgCollection]="collection"
                (pgOpenModal)="setIsUpdating(true)"
                (pgCloseModal)="setIsUpdating(false)"
                (pgUpdateCollection)="onUpdateCollection(collection.id, $event)"
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[1].code"
                  (pgKeyDown)="updateCollectionThumbnailModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/collection.png"
                [pgIsActive]="(isUpdatingThumbnail$ | ngrxPush) ?? false"
                pgUploadFileModal
                #updateCollectionThumbnailModal="modal"
                (pgSubmit)="
                  onUploadThumbnail(
                    collection.id,
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
                  (pgKeyDown)="deleteCollectionModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                [pgIsActive]="(isDeleting$ | ngrxPush) ?? false"
                pgThumbnailUrl="assets/generic/collection.png"
                (pgConfirm)="onDeleteCollection(collection.id)"
                pgConfirmModal
                #deleteCollectionModal="modal"
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
                  (pgKeyDown)="onUnselectCollection()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/collection.png"
                (click)="onUnselectCollection()"
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
    UpdateCollectionModalDirective,
    SecondaryDockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDockComponent extends ComponentStore<ViewModel> {
  readonly isUpdating$ = this.select(({ isUpdating }) => isUpdating);
  readonly isUpdatingThumbnail$ = this.select(
    ({ isUpdatingThumbnail }) => isUpdatingThumbnail
  );
  readonly isDeleting$ = this.select(({ isDeleting }) => isDeleting);
  readonly hotkeys$ = this.select(({ hotkeys }) => hotkeys);
  readonly collection$ = this.select(({ collection }) => collection);

  @Input() set pgCollection(collection: Option<Node<ApplicationNodeData>>) {
    this.patchState({ collection });
  }
  @Output() pgCollectionUnselected = new EventEmitter();
  @Output() pgUpdateCollection = new EventEmitter<{
    id: string;
    changes: UpdateCollectionSubmit;
  }>();
  @Output() pgUpdateCollectionThumbnail = new EventEmitter<{
    id: string;
    fileId: string;
    fileUrl: string;
  }>();
  @Output() pgDeleteCollection = new EventEmitter<string>();

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

  onUpdateCollection(
    collectionId: string,
    collectionData: UpdateCollectionSubmit
  ) {
    this.pgUpdateCollection.emit({
      id: collectionId,
      changes: collectionData,
    });
  }

  onUploadThumbnail(collectionId: string, fileId: string, fileUrl: string) {
    this.pgUpdateCollectionThumbnail.emit({
      id: collectionId,
      fileId,
      fileUrl,
    });
  }

  onDeleteCollection(collectionId: string) {
    this.pgDeleteCollection.emit(collectionId);
  }

  onUnselectCollection() {
    this.pgCollectionUnselected.emit();
  }
}

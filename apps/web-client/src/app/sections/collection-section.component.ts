import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { map } from 'rxjs';
import { SquareButtonComponent } from '../components';
import {
  EditCollectionModalDirective,
  EditCollectionSubmitPayload,
} from '../modals';
import { CollectionApiService } from '../services';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-collection-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.thumbnailUrl" />

      {{ selected?.name }}

      <div
        class="bg-gray-800 relative"
        style="width: 2.89rem; height: 2.89rem"
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.applicationId"
      >
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          q
        </span>

        <pg-square-button
          [pgIsActive]="isEditing"
          pgThumbnailUrl="assets/generic/signer.png"
          pgEditCollectionModal
          [pgCollection]="selected"
          (pgOpenModal)="isEditing = true"
          (pgCloseModal)="isEditing = false"
          (pgUpdateCollection)="onUpdateCollection(selected.id, selected)"
        ></pg-square-button>
      </div>

      <div
        class="bg-gray-800 relative"
        style="width: 2.89rem; height: 2.89rem"
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.applicationId"
      >
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          w
        </span>

        <pg-square-button
          [pgIsActive]="false"
          pgThumbnailUrl="assets/generic/signer.png"
          (click)="onDeleteCollection(selected.id)"
        ></pg-square-button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    EditCollectionModalDirective,
  ],
})
export class CollectionSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _collectionApiService = inject(CollectionApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'collection') {
        return null;
      }

      return selected;
    })
  );

  isEditing = false;
  isDeleting = false;

  onUpdateCollection(
    collectionId: string,
    collectionData: EditCollectionSubmitPayload
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
    this.isDeleting = true;

    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._collectionApiService
        .deleteCollection(collectionId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }

    this.isDeleting = false;
  }
}

import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map } from 'rxjs';
import { EditCollectionData, EditCollectionModalComponent } from '../modals';
import { CollectionApiService } from '../services';
import { BoardStore, CollectionView } from '../stores';

@Component({
  selector: 'pg-collection-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.thumbnailUrl" />

      {{ selected?.name }}

      <button
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.applicationId"
        (click)="onUpdateCollection(selected.id, selected)"
      >
        edit
      </button>

      <button
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.applicationId"
        (click)="onDeleteCollection(selected.id)"
      >
        x
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule],
})
export class CollectionSectionComponent {
  private readonly _dialog = inject(Dialog);
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

  onUpdateCollection(collectionId: string, collection: CollectionView) {
    this._dialog
      .open<
        EditCollectionData,
        EditCollectionData,
        EditCollectionModalComponent
      >(EditCollectionModalComponent, {
        data: collection,
      })
      .closed.pipe(
        concatMap((collectionData) => {
          if (collectionData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActive(null);

          return this._collectionApiService.updateCollection(
            collectionId,
            collectionData.name,
            collectionData.thumbnailUrl,
            collectionData.attributes
          );
        })
      )
      .subscribe();
  }

  onDeleteCollection(collectionId: string) {
    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._collectionApiService
        .deleteCollection(collectionId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }
  }
}

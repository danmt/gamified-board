import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { EditCollectionModalDirective } from '../modals';
import { CollectionApiService } from '../services';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-collections-section',
  template: `
    <div class="bg-gray-500 h-full flex flex-col gap-4">
      <h1 class="px-4 pt-4">Collections</h1>

      <div class="flex-1 px-4 overflow-auto">
        <div
          *ngrxLet="collections$; let collections"
          id="collections-section"
          cdkDropList
          [cdkDropListConnectedTo]="[
            'collection-slot-0',
            'collection-slot-1',
            'collection-slot-2',
            'collection-slot-3',
            'collection-slot-4',
            'collection-slot-5'
          ]"
          [cdkDropListData]="collections"
          cdkDropListSortingDisabled
          class="flex flex-wrap gap-2"
        >
          <div
            *ngFor="let collection of collections; trackBy: trackBy"
            class="relative"
          >
            <ng-container *ngIf="(isDragging$ | ngrxPush) === collection.id">
              <div
                class="w-full h-full absolute z-20 bg-black bg-opacity-50"
              ></div>
              <div class="bg-yellow-500 p-0.5 w-11 h-11">
                <img
                  class="w-full h-full object-cover"
                  [src]="collection.thumbnailUrl"
                />
              </div>
            </ng-container>

            <div
              cdkDrag
              [cdkDragData]="collection.id"
              (click)="onSelectCollection(collection.id)"
              (dblclick)="onActivateCollection(collection.id)"
              (cdkDragStarted)="onDragStart($event)"
              (cdkDragEnded)="onDragEnd()"
            >
              <div class="bg-yellow-500 p-0.5 w-11 h-11">
                <img
                  class="w-full h-full object-cover"
                  [src]="collection.thumbnailUrl"
                />
              </div>

              <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
                <img
                  class="w-full h-full object-cover"
                  [src]="collection.thumbnailUrl"
                />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="w-full h-32 p-4 bg-black bg-opacity-25 overflow-auto"
        *ngrxLet="selectedCollection$; let collection"
      >
        {{ collection?.name }}

        <div>
          <p>Collection attributes</p>
          <div class="flex gap-2 flex-wrap">
            <div
              *ngFor="let attribute of collection?.attributes"
              class="border-2 border-black p-1 text-xs"
            >
              {{ attribute.name }} - {{ attribute.type }}
            </div>
          </div>
        </div>

        <button
          *ngIf="
            collection !== null &&
            collection.applicationId !== null &&
            collection.applicationId === (currentApplicationId$ | ngrxPush)
          "
          pgEditCollectionModal
          [collection]="collection"
          (updateCollection)="
            onUpdateCollection(
              collection.id,
              $event.name,
              $event.thumbnailUrl,
              $event.attributes
            )
          "
        >
          edit
        </button>

        <button
          *ngIf="
            collection !== null &&
            collection.applicationId !== null &&
            collection.applicationId === (currentApplicationId$ | ngrxPush)
          "
          class="rounded-full bg-slate-400 w-8 h-8"
          (click)="onDeleteCollection(collection.applicationId, collection.id)"
        >
          x
        </button>

        <a
          class="underline"
          *ngIf="
            collection !== null &&
            collection.workspaceId === (workspaceId$ | ngrxPush) &&
            collection.applicationId !== (currentApplicationId$ | ngrxPush)
          "
          [routerLink]="[
            '/board',
            collection.workspaceId,
            collection.applicationId
          ]"
        >
          view
        </a>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    PushModule,
    LetModule,
    RouterModule,
    EditCollectionModalDirective,
  ],
})
export class CollectionsSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _collectionApiService = inject(CollectionApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly selectedCollection$ = this._boardStore.selectedCollection$;
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly collections$ = this._boardStore.collections$;

  onActivateCollection(collectionId: string) {
    this._boardStore.setActiveCollectionId(collectionId);
  }

  onSelectCollection(collectionId: string) {
    this._boardStore.setSelectedCollectionId(collectionId);
  }

  onUpdateCollection(
    collectionId: string,
    collectionName: string,
    thumbnailUrl: string,
    attributes: { id: string; name: string; type: string; isOption: boolean }[]
  ) {
    this._collectionApiService
      .updateCollection(collectionId, collectionName, thumbnailUrl, attributes)
      .subscribe();
  }

  onDeleteCollection(applicationId: string, collectionId: string) {
    this._collectionApiService
      .deleteCollection(applicationId, collectionId)
      .subscribe(() => this._boardStore.setSelectedCollectionId(null));
  }

  onDragStart(event: CdkDragStart) {
    this._isDragging.next(event.source.data);
  }

  onDragEnd() {
    this._isDragging.next(null);
  }

  trackBy(index: number): number {
    return index;
  }
}

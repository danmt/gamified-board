import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { DefaultImageDirective } from '../directives';
import { EditCollectionModalDirective } from '../modals';
import { CollectionApiService } from '../services';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-collections-section',
  template: `
    <div class="bg-gray-500 h-full flex flex-col gap-4">
      <header class="flex items-center gap-2 mb-2 px-4 pt-4">
        <h2>Collections</h2>

        <ng-container *ngIf="workspaceId$ | ngrxPush as workspaceId">
          <ng-container
            *ngIf="currentApplicationId$ | ngrxPush as applicationId"
          >
            <button
              class="rounded-full bg-slate-400 w-8 h-8"
              pgEditCollectionModal
              (pgCreateCollection)="
                onCreateCollection(
                  workspaceId,
                  applicationId,
                  $event.id,
                  $event.name,
                  $event.thumbnailUrl,
                  $event.attributes
                )
              "
            >
              +
            </button>
          </ng-container>
        </ng-container>
      </header>

      <div class="flex-1 px-4 overflow-auto">
        <div
          *ngrxLet="collections$; let collections"
          id="collections-section"
          cdkDropList
          [cdkDropListConnectedTo]="[
            'slot-0',
            'slot-1',
            'slot-2',
            'slot-3',
            'slot-4',
            'slot-5',
            'slot-6',
            'slot-7',
            'slot-8',
            'slot-9'
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
                  pgDefaultImage="assets/generic/collection.png"
                />
              </div>
            </ng-container>

            <div
              cdkDrag
              [cdkDragData]="{ id: collection.id, kind: 'collection' }"
              (click)="onSelectCollection(collection.id)"
              (dblclick)="onActivateCollection(collection.id)"
              (cdkDragStarted)="onDragStart($event)"
              (cdkDragEnded)="onDragEnd()"
            >
              <div class="bg-yellow-500 p-0.5 w-11 h-11">
                <img
                  class="w-full h-full object-cover"
                  [src]="collection.thumbnailUrl"
                  pgDefaultImage="assets/generic/collection.png"
                />
              </div>

              <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
                <img
                  class="w-full h-full object-cover"
                  [src]="collection.thumbnailUrl"
                  pgDefaultImage="assets/generic/collection.png"
                />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>
        </div>
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
    DefaultImageDirective,
  ],
})
export class CollectionsSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _collectionApiService = inject(CollectionApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly collections$ = this._boardStore.collections$;

  onActivateCollection(collectionId: string) {
    this._boardStore.setActive({ id: collectionId, kind: 'collection' });
  }

  onSelectCollection(collectionId: string) {
    this._boardStore.setSelectedId(collectionId);
  }

  onCreateCollection(
    workspaceId: string,
    applicationId: string,
    id: string,
    name: string,
    thumbnailUrl: string,
    attributes: { id: string; name: string; type: string; isOption: boolean }[]
  ) {
    this._collectionApiService
      .createCollection(
        workspaceId,
        applicationId,
        id,
        name,
        thumbnailUrl,
        attributes
      )
      .subscribe();
  }

  onDragStart(event: CdkDragStart) {
    this._isDragging.next(event.source.data.id);
  }

  onDragEnd() {
    this._isDragging.next(null);
  }

  trackBy(index: number): number {
    return index;
  }
}

import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { InventoryComponent } from '../../shared/components';
import { DefaultImageDirective } from '../../shared/directives';
import { isNull, Option } from '../../shared/utils';
import {
  CollectionTooltipDirective,
  CreateCollectionModalDirective,
} from '../components';
import { CollectionApiService } from '../services';

@Component({
  selector: 'pg-collections-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[500px] max-h-[500px]"
      pgDirection="right"
      [pgTotal]="(total$ | ngrxPush) ?? 0"
      [pgPage]="(page$ | ngrxPush) ?? 1"
      [pgPageSize]="pageSize"
      (pgSetPage)="onSetPage($event)"
    >
      <h2 class="bp-font-game-title text-3xl" pgInventoryTitle>Collections</h2>

      <!-- <button
        pgInventoryCreateButton
        class="bp-button-add-futuristic z-20"
        [pgWorkspaceId]="(workspaceId$ | ngrxPush) ?? null"
        [pgApplicationId]="(currentApplicationId$ | ngrxPush) ?? null"
        pgCreateCollectionModal
        (pgCreateCollection)="
          onCreateCollection(
            $event.workspaceId,
            $event.applicationId,
            $event.id,
            $event.name
          )
        "
      ></button> -->

      <div
        pgInventoryBody
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
        class="flex flex-wrap gap-4 justify-center"
      >
        <div
          *ngFor="let collection of collections; trackBy: trackBy"
          pgCollectionTooltip
          [pgCollection]="collection"
          class="relative"
        >
          <ng-container *ngIf="(isDragging$ | ngrxPush) === collection.id">
            <div
              class="w-full h-full absolute z-20 bg-black bg-opacity-50"
            ></div>
            <div class="bg-gray-600 p-0.5 w-11 h-11">
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
            <div class="bg-gray-600 p-0.5 w-11 h-11">
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
    </pg-inventory>
  `,
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    PushModule,
    LetModule,
    RouterModule,
    OverlayModule,
    CreateCollectionModalDirective,
    DefaultImageDirective,
    InventoryComponent,
    CollectionTooltipDirective,
  ],
})
export class CollectionsInventoryComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _collectionApiService = inject(CollectionApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  private readonly _page = new BehaviorSubject<number>(1);

  readonly isDragging$ = this._isDragging.asObservable();
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly total$ = this._boardStore.collections$.pipe(
    map((collections) => collections?.length ?? 0)
  );
  readonly pageSize = 24;
  readonly page$ = this._page.asObservable();
  readonly collections$ = combineLatest([
    this._boardStore.collections$,
    this.page$,
  ]).pipe(
    map(([collections, page]) => {
      if (isNull(collections)) {
        return null;
      }

      return collections.slice(
        page === 1 ? 0 : (page - 1) * this.pageSize,
        page * this.pageSize
      );
    })
  );

  onSetPage(page: number) {
    this._page.next(page);
  }

  onActivateCollection(collectionId: string) {
    this._boardStore.setActive({ id: collectionId, kind: 'collection' });
  }

  onSelectCollection(collectionId: string) {
    this._boardStore.setSelected({ id: collectionId, kind: 'collection' });
  }

  onCreateCollection(
    workspaceId: string,
    applicationId: string,
    id: string,
    name: string
  ) {
    this._collectionApiService
      .createCollection({
        workspaceId,
        applicationId,
        id,
        name,
      })
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

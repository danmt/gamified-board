import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { BoardStore } from '../../core/stores';
import { DefaultImageDirective } from '../../shared/directives';
import { Option } from '../../shared/utils';
import {
  CollectionTooltipDirective,
  EditCollectionModalDirective,
} from '../components';
import { CollectionApiService } from '../services';

@Component({
  selector: 'pg-collections-inventory',
  template: `
    <div
      class="flex flex-col relative mt-10 z-40 bp-bg-futuristic min-w-[300px] min-h-[500px] max-h-[500px]"
    >
      <!-- top border design -->
      <div
        class="bp-skin-metal-corner-left-top absolute -top-2.5 -left-2.5 z-20"
      ></div>
      <div
        class="bp-skin-metal-border-top absolute -top-2.5 w-5/6 left-16 right-0 mx-auto my-0 z-10"
      ></div>
      <div class="bp-skin-detail-2  absolute -top-3 z-20 right-0"></div>

      <!-- side border design -->
      <div
        class="bp-skin-metal-border-left absolute -left-2.5 h-5/6 top-0 bottom-0 my-auto mx-0 z-10"
      ></div>

      <!-- bottom border design -->
      <div
        class="bp-skin-metal-corner-left-bottom absolute -bottom-2.5 -left-2.5 z-20"
      ></div>
      <div
        class="bp-skin-metal-border-bottom absolute -bottom-2.5 w-5/6 left-16 right-0 mx-auto my-0 z-10"
      ></div>
      <div class="bp-skin-detail-2  absolute -bottom-4 z-20 right-0"></div>

      <!-- section content -->
      <header class="relative h-[80px]">
        <div
          class="absolute w-full bp-skin-title-box flex items-center justify-between pl-6 pr-8 ml-1.5"
        >
          <h1 class="bp-font-game text-3xl">Collections</h1>

          <ng-container *ngIf="workspaceId$ | ngrxPush as workspaceId">
            <ng-container
              *ngIf="currentApplicationId$ | ngrxPush as applicationId"
            >
              <button
                class="bp-button-add-futuristic z-20"
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
              ></button>
            </ng-container>
          </ng-container>
        </div>
      </header>

      <section
        class="flex-1 pl-6 pr-4 pt-4 pb-10 overflow-auto max-w-[280px] ml-2"
      >
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
          class="flex flex-wrap gap-4"
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
              <div class="bg-green-800 p-0.5 w-11 h-11">
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
              <div class="bg-green-800 p-0.5 w-11 h-11">
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
      </section>
    </div>
  `,
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    PushModule,
    LetModule,
    RouterModule,
    OverlayModule,
    EditCollectionModalDirective,
    DefaultImageDirective,
    CollectionTooltipDirective,
  ],
})
export class CollectionsInventoryComponent {
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
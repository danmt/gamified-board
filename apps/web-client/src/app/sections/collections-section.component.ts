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
    <div class="flex flex-col relative mt-10 z-40">
      <header class="flex relative" style="height:78px">
        <div class="bp-skin-metal-corner-left-top z-10"></div>
        <div class="bp-skin-metal-border flex-1 z-10"></div>
        <div
          class="absolute w-full bp-skin-title-box flex items-center justify-between pl-12 pr-8 ml-1.5"
        >
          <h1 class="bp-font-game text-3xl">Collections</h1>

          <ng-container *ngIf="workspaceId$ | ngrxPush as workspaceId">
            <ng-container
              *ngIf="currentApplicationId$ | ngrxPush as applicationId"
            >
              <button
                class="rounded-full bg-slate-400 w-8 h-8"
                pgEditCollectionModal
                (createCollection)="
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
        </div>
        <div
          class="bp-skin-metal-detail-2 absolute -top-2.5 z-20 right-0"
        ></div>
      </header>

      <div class="relative bp-bg-futuristic">
        <div
          class="bp-skin-metal-border-left absolute left-0 h-full z-20"
        ></div>
        <div>
          <div
            class="flex-1 px-4 pt-4 pb-10 overflow-auto bp-skin-metal-body ml-4"
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
              class="flex flex-wrap gap-2"
            >
              <div
                *ngFor="let collection of collections; trackBy: trackBy"
                class="relative"
              >
                <ng-container
                  *ngIf="(isDragging$ | ngrxPush) === collection.id"
                >
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
                    />
                  </div>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
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
        </div>
      </div>

      <div class="flex items-end relative" style="top: -75px; z-index: 100;">
        <div class="bp-skin-metal-corner-left-bottom"></div>
        <div class="bp-skin-metal-border-bottom flex-1"></div>
        <div
          class="bp-skin-metal-detail-2 absolute -bottom-3 z-20 right-0"
        ></div>
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

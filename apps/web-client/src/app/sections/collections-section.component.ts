import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { provideComponentStore } from '@ngrx/component-store';
import { BehaviorSubject } from 'rxjs';
import { EditCollectionModalDirective } from '../modals';
import { PluginsService } from '../plugins';
import { CollectionApiService } from '../services';
import { BoardCollectionsStore, BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-collections-section',
  template: `
    <div class="bg-gray-500 h-full flex flex-col gap-4">
      <h1 class="px-4 pt-4">Collections</h1>

      <div class="flex-1 px-4 overflow-auto">
        <ng-container *ngrxLet="workspaceId$; let workspaceId">
          <ng-container *ngrxLet="currentApplication$; let application">
            <div *ngIf="application !== null && workspaceId !== null">
              <h2>{{ application.name }}</h2>

              <div
                [id]="workspaceId + '-' + application.id + '-collections'"
                cdkDropList
                [cdkDropListConnectedTo]="[
                  'collection-slot-0',
                  'collection-slot-1',
                  'collection-slot-2',
                  'collection-slot-3',
                  'collection-slot-4',
                  'collection-slot-5'
                ]"
                [cdkDropListData]="application.collections"
                cdkDropListSortingDisabled
                class="flex flex-wrap gap-2"
              >
                <div
                  *ngFor="
                    let collection of application.collections;
                    trackBy: trackBy
                  "
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
                    [cdkDragData]="collection.id"
                    (click)="onSelectInternalCollection(collection.id)"
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
          </ng-container>

          <ng-container
            *ngFor="let application of otherApplications$ | ngrxPush"
          >
            <div *ngIf="application !== null && workspaceId !== null">
              <h2>{{ application.name }}</h2>

              <div
                [id]="workspaceId + '-' + application.id + '-collections'"
                cdkDropList
                [cdkDropListConnectedTo]="[
                  'collection-slot-0',
                  'collection-slot-1',
                  'collection-slot-2',
                  'collection-slot-3',
                  'collection-slot-4',
                  'collection-slot-5'
                ]"
                [cdkDropListData]="application.collections"
                cdkDropListSortingDisabled
                class="flex flex-wrap gap-2"
              >
                <div
                  *ngFor="
                    let collection of application.collections;
                    trackBy: trackBy
                  "
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
                    [cdkDragData]="collection.id"
                    (click)="onSelectInternalCollection(collection.id)"
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
          </ng-container>
        </ng-container>

        <ng-container *ngFor="let plugin of plugins">
          <div *ngIf="plugin.accounts.length > 0">
            <h2>{{ plugin.name }}</h2>

            <div
              [id]="plugin.name + '-collections'"
              cdkDropList
              [cdkDropListConnectedTo]="[
                'collection-slot-0',
                'collection-slot-1',
                'collection-slot-2',
                'collection-slot-3',
                'collection-slot-4',
                'collection-slot-5'
              ]"
              [cdkDropListData]="plugin.accounts"
              cdkDropListSortingDisabled
              class="flex flex-wrap gap-2"
            >
              <div
                *ngFor="let account of plugin.accounts; trackBy: trackBy"
                class="relative"
              >
                <ng-container
                  *ngIf="
                    (isDragging$ | ngrxPush) ===
                    plugin.namespace + '/' + plugin.name + '/' + account.name
                  "
                >
                  <div
                    class="w-full h-full absolute z-20 bg-black bg-opacity-50"
                  ></div>
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="
                        'assets/plugins/' +
                        plugin.namespace +
                        '/' +
                        plugin.name +
                        '/accounts/' +
                        account.name +
                        '.png'
                      "
                    />
                  </div>
                </ng-container>

                <div
                  cdkDrag
                  [cdkDragData]="
                    plugin.namespace + '/' + plugin.name + '/' + account.name
                  "
                  (click)="
                    onSelectExternalCollection(
                      plugin.namespace,
                      plugin.name,
                      account.name
                    )
                  "
                  (cdkDragStarted)="onDragStart($event)"
                  (cdkDragEnded)="onDragEnd()"
                >
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="
                        'assets/plugins/' +
                        plugin.namespace +
                        '/' +
                        plugin.name +
                        '/accounts/' +
                        account.name +
                        '.png'
                      "
                    />
                  </div>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img
                      class="w-full h-full object-cover"
                      [src]="
                        'assets/plugins/' +
                        plugin.namespace +
                        '/' +
                        plugin.name +
                        '/accounts/' +
                        account.name +
                        '.png'
                      "
                    />
                  </div>

                  <div *cdkDragPlaceholder></div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <div
        class="w-full h-24 p-4 bg-black bg-opacity-25"
        *ngrxLet="selectedCollection$; let collection"
      >
        {{ collection?.name }}

        <button
          *ngIf="
            collection !== null &&
            collection.applicationId !== null &&
            collection.applicationId === (currentApplicationId$ | ngrxPush)
          "
          pgEditCollectionModal
          [collection]="collection"
          (updateCollection)="
            onUpdateCollection(collection.id, $event.name, $event.thumbnailUrl)
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
  providers: [provideComponentStore(BoardCollectionsStore)],
})
export class CollectionsSectionComponent {
  private readonly _pluginsService = inject(PluginsService);
  private readonly _boardStore = inject(BoardStore);
  private readonly _boardCollectionsStore = inject(BoardCollectionsStore);
  private readonly _collectionApiService = inject(CollectionApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly selectedCollection$ =
    this._boardCollectionsStore.selectedCollection$;
  readonly plugins = this._pluginsService.plugins;
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly currentApplication$ = this._boardStore.currentApplication$;
  readonly otherApplications$ = this._boardStore.otherApplications$;

  onSelectInternalCollection(collectionId: string) {
    this._boardCollectionsStore.setSelectedCollectionId(collectionId);
  }

  onSelectExternalCollection(
    namespace: string,
    plugin: string,
    account: string
  ) {
    this._boardCollectionsStore.setSelectedCollectionId(
      `${namespace}/${plugin}/${account}`
    );
  }

  onUpdateCollection(
    collectionId: string,
    collectionName: string,
    thumbnailUrl: string
  ) {
    this._collectionApiService
      .updateCollection(collectionId, collectionName, thumbnailUrl)
      .subscribe();
  }

  onDeleteCollection(applicationId: string, collectionId: string) {
    this._collectionApiService
      .deleteCollection(applicationId, collectionId)
      .subscribe(() =>
        this._boardCollectionsStore.setSelectedCollectionId(null)
      );
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

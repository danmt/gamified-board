import { DIALOG_DATA } from '@angular/cdk/dialog';
import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { PluginInterface } from '../plugins';
import { ApplicationApiService } from '../services';
import { Option } from '../utils';

@Component({
  selector: 'pg-collections',
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
                  'slot-6',
                  'slot-7',
                  'slot-8',
                  'slot-9',
                  'slot-10',
                  'slot-11'
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
                    [cdkDragData]="{
                        workspaceId,
                        applicationId: application.id,
                        id: collection.id,
                        name: collection.name,
                        thumbnailUrl: collection.thumbnailUrl,
                        isInternal: true,
                        namespace: null,
                        plugin: null
                      }"
                    (click)="
                      onSelectInternalCollection(
                        workspaceId,
                        application.id,
                        collection.id,
                        collection.name
                      )
                    "
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
                  'slot-6',
                  'slot-7',
                  'slot-8',
                  'slot-9',
                  'slot-10',
                  'slot-11'
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
                    [cdkDragData]="{
                        workspaceId,
                        applicationId: application.id,
                        id: collection.id,
                        name: collection.name,
                        thumbnailUrl: collection.thumbnailUrl,
                        isInternal: true,
                        namespace: null,
                        plugin: null
                      }"
                    (click)="
                      onSelectInternalCollection(
                        workspaceId,
                        application.id,
                        collection.id,
                        collection.name
                      )
                    "
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
                'slot-6',
                'slot-7',
                'slot-8',
                'slot-9',
                'slot-10',
                'slot-11'
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
                  [cdkDragData]="{
                    namespace: plugin.namespace,
                    plugin: plugin.name,
                    id: account.name,
                    name: account.name,
                    account: account.name,
                    thumbnailUrl:
                      'assets/plugins/' +
                      plugin.namespace +
                      '/' +
                      plugin.name +
                      '/accounts/' +
                      account.name +
                      '.png',
                    isInternal: false,
                    workspaceId: null,
                    applicationId: null
                  }"
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
            collection.applicationId === (applicationId$ | ngrxPush)
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
            collection.applicationId !== (applicationId$ | ngrxPush)
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
  imports: [DragDropModule, CommonModule, PushModule, LetModule, RouterModule],
})
export class CollectionsComponent {
  private readonly _applicationApiService = inject(ApplicationApiService);
  private readonly _data = inject<{
    plugins: PluginInterface[];
    workspaceId$: Observable<Option<string>>;
    applicationId$: Observable<Option<string>>;
    applications$: Observable<
      {
        id: string;
        name: string;
        collections: { id: string; name: string; thumbnailUrl: string }[];
      }[]
    >;
  }>(DIALOG_DATA);
  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  private readonly _selectedCollection = new BehaviorSubject<
    Option<{
      id: string;
      name: string;
      workspaceId: Option<string>;
      applicationId: Option<string>;
      namespace: Option<string>;
      plugin: Option<string>;
      isInternal: boolean;
    }>
  >(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly selectedCollection$ = this._selectedCollection.asObservable();
  readonly plugins = this._data.plugins;
  readonly workspaceId$ = this._data.workspaceId$;
  readonly applicationId$ = this._data.applicationId$;
  readonly currentApplication$ = combineLatest([
    this._data.applications$,
    this._data.applicationId$,
  ]).pipe(
    map(([applications, applicationId]) => {
      if (applicationId === null) {
        return null;
      }

      return applications.find(({ id }) => id === applicationId) ?? null;
    })
  );
  readonly otherApplications$ = combineLatest([
    this._data.applications$,
    this._data.applicationId$,
  ]).pipe(
    map(([applications, applicationId]) => {
      if (applicationId === null) {
        return [];
      }

      return applications.filter(({ id }) => id !== applicationId) ?? null;
    })
  );

  onSelectInternalCollection(
    workspaceId: string,
    applicationId: string,
    collectionId: string,
    collectionName: string
  ) {
    this._selectedCollection.next({
      id: collectionId,
      name: collectionName,
      isInternal: true,
      workspaceId,
      applicationId,
      namespace: null,
      plugin: null,
    });
  }

  onSelectExternalCollection(
    namespace: string,
    plugin: string,
    account: string
  ) {
    this._selectedCollection.next({
      id: account,
      name: account,
      isInternal: false,
      workspaceId: null,
      applicationId: null,
      namespace,
      plugin,
    });
  }

  onDeleteCollection(applicationId: string, collectionId: string) {
    this._applicationApiService
      .deleteCollection(applicationId, collectionId)
      .subscribe(() => this._selectedCollection.next(null));
  }

  onDragStart(event: CdkDragStart) {
    this._isDragging.next(
      event.source.data.isInternal
        ? event.source.data.id
        : `${event.source.data.namespace}/${event.source.data.plugin}/${event.source.data.account}`
    );
  }

  onDragEnd() {
    this._isDragging.next(null);
  }

  trackBy(index: number): number {
    return index;
  }
}

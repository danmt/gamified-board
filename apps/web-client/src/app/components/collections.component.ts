import { DIALOG_DATA } from '@angular/cdk/dialog';
import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { PluginInterface } from '../plugins';
import { Option } from '../utils';

@Component({
  selector: 'pg-collections',
  template: `
    <div class="p-4 bg-white h-full">
      <h1>Collections</h1>

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
                  *ngIf="
                    (isDragging$ | ngrxPush) ===
                    workspaceId + '/' + application.id + '/' + collection.id
                  "
                >
                  <div
                    class="w-full h-full absolute z-20 bg-black bg-opacity-50"
                  ></div>
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="
                        'assets/workspaces/' +
                        workspaceId +
                        '/' +
                        application.id +
                        '/collections/' +
                        collection.id +
                        '.png'
                      "
                    />
                  </div>
                </ng-container>

                <div
                  cdkDrag
                  [cdkDragData]="{
                    id:
                      workspaceId + '/' + application.id + '/' + collection.id,
                    thumbnailUrl:
                      'assets/workspaces/' +
                      workspaceId +
                      '/' +
                      application.id +
                      '/collections/' +
                      collection.id +
                      '.png'
                  }"
                  (cdkDragStarted)="onDragStart($event)"
                  (cdkDragEnded)="onDragEnd()"
                >
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="
                        'assets/workspaces/' +
                        workspaceId +
                        '/' +
                        application.id +
                        '/collections/' +
                        collection.id +
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
                        'assets/workspaces/' +
                        workspaceId +
                        '/' +
                        application.id +
                        '/collections/' +
                        collection.id +
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

        <ng-container *ngFor="let application of otherApplications$ | async">
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
                  *ngIf="
                    (isDragging$ | ngrxPush) ===
                    workspaceId + '/' + application.id + '/' + collection.id
                  "
                >
                  <div
                    class="w-full h-full absolute z-20 bg-black bg-opacity-50"
                  ></div>
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="
                        'assets/workspaces/' +
                        workspaceId +
                        '/' +
                        application.id +
                        '/collections/' +
                        collection.id +
                        '.png'
                      "
                    />
                  </div>
                </ng-container>

                <div
                  cdkDrag
                  [cdkDragData]="{
                    id:
                      workspaceId + '/' + application.id + '/' + collection.id,
                    thumbnailUrl:
                      'assets/workspaces/' +
                      workspaceId +
                      '/' +
                      application.id +
                      '/collections/' +
                      collection.id +
                      '.png'
                  }"
                  (cdkDragStarted)="onDragStart($event)"
                  (cdkDragEnded)="onDragEnd()"
                >
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="
                        'assets/workspaces/' +
                        workspaceId +
                        '/' +
                        application.id +
                        '/collections/' +
                        collection.id +
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
                        'assets/workspaces/' +
                        workspaceId +
                        '/' +
                        application.id +
                        '/collections/' +
                        collection.id +
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
                  (isDragging$ | ngrxPush) === plugin.name + '/' + account.name
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
                  id: plugin.name + '/' + account.name,
                  thumbnailUrl:
                    'assets/plugins/' +
                    plugin.namespace +
                    '/' +
                    plugin.name +
                    '/accounts/' +
                    account.name +
                    '.png'
                }"
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
  `,
  standalone: true,
  imports: [DragDropModule, CommonModule, PushModule, LetModule],
})
export class CollectionsComponent {
  private readonly _data = inject<{
    plugins: PluginInterface[];
    workspaceId$: Observable<Option<string>>;
    applicationId$: Observable<Option<string>>;
    applications$: Observable<
      {
        id: string;
        name: string;
        collections: { id: string; name: string }[];
      }[]
    >;
  }>(DIALOG_DATA);
  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
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

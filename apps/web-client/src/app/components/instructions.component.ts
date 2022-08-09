import { DIALOG_DATA } from '@angular/cdk/dialog';
import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { PluginInterface } from '../plugins';
import { Option } from '../utils';

@Component({
  selector: 'pg-instructions',
  template: `
    <div class="p-4 bg-gray-500 h-full overflow-auto">
      <h1>Instructions</h1>

      <ng-container *ngrxLet="workspaceId$; let workspaceId">
        <ng-container *ngrxLet="currentApplication$; let application">
          <div *ngIf="application !== null && workspaceId !== null">
            <h2>{{ application.name }}</h2>

            <div
              [id]="workspaceId + '-' + application.id + '-instructions'"
              cdkDropList
              [cdkDropListConnectedTo]="[
                'slot-0',
                'slot-1',
                'slot-2',
                'slot-3',
                'slot-4',
                'slot-5'
              ]"
              [cdkDropListData]="application.instructions"
              cdkDropListSortingDisabled
              class="flex flex-wrap gap-2"
            >
              <div
                *ngFor="
                  let instruction of application.instructions;
                  trackBy: trackBy
                "
                class="relative"
              >
                <ng-container
                  *ngIf="(isDragging$ | ngrxPush) === instruction.id"
                >
                  <div
                    class="w-full h-full absolute z-20 bg-black bg-opacity-50"
                  ></div>
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="instruction.thumbnailUrl"
                    />
                  </div>
                </ng-container>

                <div
                  cdkDrag
                  [cdkDragData]="{
                    workspaceId,
                    applicationId: application.id,
                    id: instruction.id,
                    name: instruction.name,
                    thumbnailUrl: instruction.thumbnailUrl,
                    isInternal: true,
                    namespace: null,
                    plugin: null
                  }"
                  (cdkDragStarted)="onDragStart($event)"
                  (cdkDragEnded)="onDragEnd()"
                >
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="instruction.thumbnailUrl"
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
                        '/instructions/' +
                        instruction.id +
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
              [id]="workspaceId + '-' + application.id + '-instructions'"
              cdkDropList
              [cdkDropListConnectedTo]="[
                'slot-0',
                'slot-1',
                'slot-2',
                'slot-3',
                'slot-4',
                'slot-5'
              ]"
              [cdkDropListData]="application.instructions"
              cdkDropListSortingDisabled
              class="flex flex-wrap gap-2"
            >
              <div
                *ngFor="
                  let instruction of application.instructions;
                  trackBy: trackBy
                "
                class="relative"
              >
                <ng-container
                  *ngIf="(isDragging$ | ngrxPush) === instruction.id"
                >
                  <div
                    class="w-full h-full absolute z-20 bg-black bg-opacity-50"
                  ></div>
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="instruction.thumbnailUrl"
                    />
                  </div>
                </ng-container>

                <div
                  cdkDrag
                  [cdkDragData]="{
                    workspaceId,
                    applicationId: application.id,
                    id: instruction.id,
                    name: instruction.name,
                    thumbnailUrl: instruction.thumbnailUrl,
                    isInternal: true,
                    namespace: null,
                    plugin: null
                  }"
                  (cdkDragStarted)="onDragStart($event)"
                  (cdkDragEnded)="onDragEnd()"
                >
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="instruction.thumbnailUrl"
                    />
                  </div>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img
                      class="w-full h-full object-cover"
                      [src]="instruction.thumbnailUrl"
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
        <div *ngIf="plugin.instructions.length > 0">
          <h2>{{ plugin.name }}</h2>

          <div
            [id]="plugin.name + '-instructions'"
            cdkDropList
            [cdkDropListConnectedTo]="[
              'slot-0',
              'slot-1',
              'slot-2',
              'slot-3',
              'slot-4',
              'slot-5'
            ]"
            [cdkDropListData]="plugin.instructions"
            cdkDropListSortingDisabled
            class="flex flex-wrap gap-2"
          >
            <div
              *ngFor="let instruction of plugin.instructions; trackBy: trackBy"
              class="relative"
            >
              <ng-container
                *ngIf="
                  (isDragging$ | ngrxPush) ===
                  plugin.namespace + '/' + plugin.name + '/' + instruction.name
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
                      '/instructions/' +
                      instruction.name +
                      '.png'
                    "
                  />
                </div>
              </ng-container>

              <div
                [id]="plugin.name + '/' + instruction.name"
                cdkDrag
                [cdkDragData]="{
                  namespace: plugin.namespace,
                  plugin: plugin.name,
                  id: instruction.name,
                  name: instruction.name,
                  instruction: instruction.name,
                  thumbnailUrl:
                    'assets/plugins/' +
                    plugin.namespace +
                    '/' +
                    plugin.name +
                    '/instructions/' +
                    instruction.name +
                    '.png',
                  isInternal: false,
                  workspaceId: null,
                  applicationId: null
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
                      '/instructions/' +
                      instruction.name +
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
                      '/instructions/' +
                      instruction.name +
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
export class InstructionsComponent {
  private readonly _data = inject<{
    plugins: PluginInterface[];
    workspaceId$: Observable<Option<string>>;
    applicationId$: Observable<Option<string>>;
    applications$: Observable<
      {
        id: string;
        name: string;
        instructions: { id: string; name: string; thumbnailUrl: string }[];
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
    this._isDragging.next(
      event.source.data.isInternal
        ? event.source.data.id
        : `${event.source.data.namespace}/${event.source.data.plugin}/${event.source.data.instruction}`
    );
  }

  onDragEnd() {
    this._isDragging.next(null);
  }

  trackBy(index: number): number {
    return index;
  }
}

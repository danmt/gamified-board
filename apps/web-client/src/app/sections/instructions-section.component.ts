import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { PluginsService } from '../plugins';
import { InstructionApiService } from '../services';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-instructions-section',
  template: `
    <div class="bg-gray-500 h-full flex flex-col gap-4">
      <h1 class="px-4 pt-4">Instructions</h1>

      <div class="flex-1 px-4 overflow-auto">
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
                    (click)="
                      onSelectInternalInstruction(
                        workspaceId,
                        application.id,
                        instruction.id,
                        instruction.name
                      )
                    "
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
                    (click)="
                      onSelectInternalInstruction(
                        workspaceId,
                        application.id,
                        instruction.id,
                        instruction.name
                      )
                    "
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
                *ngFor="
                  let instruction of plugin.instructions;
                  trackBy: trackBy
                "
                class="relative"
              >
                <ng-container
                  *ngIf="
                    (isDragging$ | ngrxPush) ===
                    plugin.namespace +
                      '/' +
                      plugin.name +
                      '/' +
                      instruction.name
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
                  (click)="
                    onSelectExternalInstruction(
                      plugin.namespace,
                      plugin.name,
                      instruction.name
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

      <div
        class="w-full h-24 p-4 bg-black bg-opacity-25"
        *ngrxLet="selectedInstruction$; let instruction"
      >
        {{ instruction?.name }}

        <button
          *ngIf="
            instruction !== null &&
            instruction.applicationId !== null &&
            instruction.applicationId === (currentApplicationId$ | ngrxPush)
          "
          class="rounded-full bg-slate-400 w-8 h-8"
          (click)="
            onDeleteInstruction(instruction.applicationId, instruction.id)
          "
        >
          x
        </button>

        <a
          class="underline"
          *ngIf="
            instruction !== null &&
            instruction.workspaceId === (workspaceId$ | ngrxPush) &&
            instruction.applicationId !== (currentApplicationId$ | ngrxPush)
          "
          [routerLink]="[
            '/board',
            instruction.workspaceId,
            instruction.applicationId
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
export class InstructionsSectionComponent {
  private readonly _pluginsService = inject(PluginsService);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionApiService = inject(InstructionApiService);

  private readonly _selectedInstruction = new BehaviorSubject<
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
  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly selectedInstruction$ = this._selectedInstruction.asObservable();
  readonly plugins = this._pluginsService.plugins;
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly currentApplication$ = this._boardStore.currentApplication$;
  readonly otherApplications$ = this._boardStore.otherApplications$;

  onSelectInternalInstruction(
    workspaceId: string,
    applicationId: string,
    instructionId: string,
    instructionName: string
  ) {
    this._selectedInstruction.next({
      id: instructionId,
      name: instructionName,
      isInternal: true,
      workspaceId,
      applicationId,
      namespace: null,
      plugin: null,
    });
  }

  onSelectExternalInstruction(
    namespace: string,
    plugin: string,
    account: string
  ) {
    this._selectedInstruction.next({
      id: account,
      name: account,
      isInternal: false,
      workspaceId: null,
      applicationId: null,
      namespace,
      plugin,
    });
  }

  onDeleteInstruction(applicationId: string, instructionId: string) {
    this._instructionApiService
      .deleteInstruction(applicationId, instructionId)
      .subscribe(() => this._selectedInstruction.next(null));
  }

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

import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { provideComponentStore } from '@ngrx/component-store';
import { BehaviorSubject } from 'rxjs';
import { EditInstructionModalDirective } from '../modals';
import { PluginsService } from '../plugins';
import { InstructionApiService } from '../services';
import { BoardInstructionsStore, BoardStore } from '../stores';
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
                  'instruction-slot-0',
                  'instruction-slot-1',
                  'instruction-slot-2',
                  'instruction-slot-3',
                  'instruction-slot-4',
                  'instruction-slot-5'
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
                    [cdkDragData]="instruction.id"
                    (click)="onSelectInternalInstruction(instruction.id)"
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

          <ng-container *ngFor="let application of otherApplications$ | async">
            <div *ngIf="application !== null && workspaceId !== null">
              <h2>{{ application.name }}</h2>

              <div
                [id]="workspaceId + '-' + application.id + '-instructions'"
                cdkDropList
                [cdkDropListConnectedTo]="[
                  'instruction-slot-0',
                  'instruction-slot-1',
                  'instruction-slot-2',
                  'instruction-slot-3',
                  'instruction-slot-4',
                  'instruction-slot-5'
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
                    [cdkDragData]="instruction.id"
                    (click)="onSelectInternalInstruction(instruction.id)"
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
                'instruction-slot-0',
                'instruction-slot-1',
                'instruction-slot-2',
                'instruction-slot-3',
                'instruction-slot-4',
                'instruction-slot-5'
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
                  cdkDrag
                  [cdkDragData]="
                    plugin.namespace +
                    '/' +
                    plugin.name +
                    '/' +
                    instruction.name
                  "
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
          pgEditInstructionModal
          [instruction]="instruction"
          (updateInstruction)="
            onUpdateInstruction(
              instruction.id,
              $event.name,
              $event.thumbnailUrl
            )
          "
        >
          edit
        </button>

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
  imports: [
    DragDropModule,
    CommonModule,
    PushModule,
    LetModule,
    RouterModule,
    EditInstructionModalDirective,
  ],
  providers: [provideComponentStore(BoardInstructionsStore)],
})
export class InstructionsSectionComponent {
  private readonly _pluginsService = inject(PluginsService);
  private readonly _boardStore = inject(BoardStore);
  private readonly _boardInstructionsStore = inject(BoardInstructionsStore);
  private readonly _instructionApiService = inject(InstructionApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly selectedInstruction$ =
    this._boardInstructionsStore.selectedInstruction$;
  readonly plugins = this._pluginsService.plugins;
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly currentApplication$ = this._boardStore.currentApplication$;
  readonly otherApplications$ = this._boardStore.otherApplications$;

  onSelectInternalInstruction(instructionId: string) {
    this._boardInstructionsStore.setSelectedInstructionId(instructionId);
  }

  onSelectExternalInstruction(
    namespace: string,
    plugin: string,
    account: string
  ) {
    this._boardInstructionsStore.setSelectedInstructionId(
      `${namespace}/${plugin}/${account}`
    );
  }

  onUpdateInstruction(
    instructionId: string,
    instructionName: string,
    thumbnailUrl: string
  ) {
    this._instructionApiService
      .updateInstruction(instructionId, instructionName, thumbnailUrl)
      .subscribe();
  }

  onDeleteInstruction(applicationId: string, instructionId: string) {
    this._instructionApiService
      .deleteInstruction(applicationId, instructionId)
      .subscribe(() =>
        this._boardInstructionsStore.setSelectedInstructionId(null)
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

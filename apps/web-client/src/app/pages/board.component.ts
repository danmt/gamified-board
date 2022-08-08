import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import {
  GlobalPositionStrategy,
  NoopScrollStrategy,
} from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LetModule } from '@ngrx/component';
import { map, of, switchMap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import {
  BoardComponent,
  CollectionsComponent,
  HotKey,
  InstructionsComponent,
  MainDockComponent,
  NavigationWrapperComponent,
  SelectedDocumentDockComponent,
  SelectedTaskDockComponent,
} from '../components';
import { PluginsService } from '../plugins';
import { ApplicationApiService } from '../services';
import {
  ActiveItem,
  BoardDocument,
  BoardInstruction,
  BoardItemKind,
  BoardTask,
  Collection,
  Instruction,
  MainDockSlots,
  Option,
  SelectedBoardItem,
} from '../utils';

@Component({
  selector: 'pg-board-page',
  template: `
    <pg-navigation-wrapper zPosition="z-30"></pg-navigation-wrapper>
    <pg-main-dock
      *ngIf="selectedTask === null && selectedDocument === null"
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
      [slots]="slots"
      [hotkeys]="hotkeys"
      [active]="active"
      (swapSlots)="onSwapSlots($event[0], $event[1])"
      (removeFromSlot)="onRemoveFromSlot($event)"
      (activateSlot)="onSlotActivate($event)"
      (updateSlot)="onUpdateSlot($event.index, $event.data)"
    ></pg-main-dock>
    <pg-selected-task-dock
      *ngIf="selectedTask !== null"
      [selected]="selectedTask"
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
    ></pg-selected-task-dock>
    <pg-selected-document-dock
      *ngIf="selectedDocument !== null"
      [selected]="selectedDocument"
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
    ></pg-selected-document-dock>
    <pg-board
      *ngrxLet="currentApplicationInstructions$; let instructions"
      [instructions]="instructions ?? []"
      [active]="active"
      (useCollection)="onUseCollection($event.instructionId, $event.collection)"
      (useInstruction)="
        onUseInstruction($event.instructionId, $event.instruction)
      "
      (selectItem)="
        onSelectItem(
          instructions,
          $event.instructionId,
          $event.itemId,
          $event.kind
        )
      "
      (moveDocument)="
        onMoveDocument(
          instructions,
          $event.instructionId,
          $event.previousIndex,
          $event.newIndex
        )
      "
      (transferDocument)="
        onTransferDocument(
          instructions,
          $event.previousInstructionId,
          $event.newInstructionId,
          $event.documentId,
          $event.previousIndex,
          $event.newIndex
        )
      "
      (moveTask)="
        onMoveTask(
          instructions,
          $event.instructionId,
          $event.previousIndex,
          $event.newIndex
        )
      "
      (transferTask)="
        onTransferTask(
          instructions,
          $event.previousInstructionId,
          $event.newInstructionId,
          $event.documentId,
          $event.previousIndex,
          $event.newIndex
        )
      "
    ></pg-board>
  `,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DialogModule,
    MainDockComponent,
    SelectedTaskDockComponent,
    SelectedDocumentDockComponent,
    BoardComponent,
    NavigationWrapperComponent,
    LetModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPageComponent {
  private readonly _pluginsService = inject(PluginsService);
  private readonly _dialog = inject(Dialog);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly workspaceId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId'))
  );
  readonly applicationId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('applicationId'))
  );
  readonly workspaceApplications$ = this.workspaceId$.pipe(
    switchMap((workspaceId) => {
      if (workspaceId === null) {
        return of(null);
      }

      return this._applicationApiService.getWorkspaceApplications(workspaceId);
    })
  );
  readonly currentApplicationInstructions$ = this.applicationId$.pipe(
    switchMap((applicationId) => {
      if (applicationId === null) {
        return of([]);
      }

      return this._applicationApiService.getApplicationInstructions(
        applicationId
      );
    })
  );

  active: Option<ActiveItem> = null;
  selected: Option<SelectedBoardItem> = null;
  selectedTask: Option<BoardTask> = null;
  selectedDocument: Option<BoardDocument> = null;
  boardInstructions: BoardInstruction[] = [
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      name: 'ix1',
      documents: [],
      tasks: [],
    },
  ];
  plugins = this._pluginsService.plugins;
  slots: MainDockSlots = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  hotkeys: HotKey[] = [
    {
      slot: 0,
      key: 'q',
    },
    {
      slot: 1,
      key: 'w',
    },
    {
      slot: 2,
      key: 'e',
    },
    {
      slot: 3,
      key: 'r',
    },
    {
      slot: 4,
      key: 't',
    },
    {
      slot: 5,
      key: 'y',
    },
    {
      slot: 6,
      key: '1',
    },
    {
      slot: 7,
      key: '2',
    },
    {
      slot: 8,
      key: '3',
    },
    {
      slot: 9,
      key: '4',
    },
    {
      slot: 10,
      key: '5',
    },
    {
      slot: 11,
      key: '6',
    },
  ];

  collectionsDialogRef: Option<
    DialogRef<CollectionsComponent, CollectionsComponent>
  > = null;
  instructionsDialogRef: Option<
    DialogRef<InstructionsComponent, InstructionsComponent>
  > = null;
  @HostBinding('class') class = 'block';
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Delete': {
        if (this.selectedTask !== null) {
          if (confirm('Are you sure? This action cannot be reverted.')) {
            const instructionIndex =
              this.boardInstructions.findIndex(
                ({ id }) => id === this.selected?.instructionId
              ) ?? null;

            if (instructionIndex !== null) {
              this.boardInstructions = [
                ...this.boardInstructions.slice(0, instructionIndex),
                {
                  ...this.boardInstructions[instructionIndex],
                  tasks: this.boardInstructions[instructionIndex].tasks.filter(
                    ({ id }) => id !== this.selectedTask?.id
                  ),
                },
                ...this.boardInstructions.slice(instructionIndex + 1),
              ];
            }

            this.selectedTask = null;
          }
        } else if (this.selectedDocument !== null) {
          if (confirm('Are you sure? This action cannot be reverted.')) {
            const instructionIndex =
              this.boardInstructions.findIndex(
                ({ id }) => id === this.selected?.instructionId
              ) ?? null;

            if (instructionIndex !== null) {
              this.boardInstructions = [
                ...this.boardInstructions.slice(0, instructionIndex),
                {
                  ...this.boardInstructions[instructionIndex],
                  documents: this.boardInstructions[
                    instructionIndex
                  ].documents.filter(
                    ({ id }) => id !== this.selectedDocument?.id
                  ),
                },
                ...this.boardInstructions.slice(instructionIndex + 1),
              ];
            }

            this.selectedDocument = null;
          }
        }

        break;
      }
      case 'Escape': {
        if (
          this.collectionsDialogRef !== null ||
          this.instructionsDialogRef !== null
        ) {
          this.collectionsDialogRef?.close();
          this.collectionsDialogRef = null;
          this.instructionsDialogRef?.close();
          this.instructionsDialogRef = null;
        } else if (this.active !== null) {
          this.active = null;
        } else if (this.selectedTask !== null) {
          this.selectedTask = null;
        } else if (this.selectedDocument !== null) {
          this.selectedDocument = null;
        }

        break;
      }
      case '.': {
        if (this.collectionsDialogRef === null) {
          this.collectionsDialogRef = this._dialog.open(CollectionsComponent, {
            data: {
              plugins: this._pluginsService.plugins,
              workspaceId$: this.workspaceId$,
              applicationId$: this.applicationId$,
              applications$: this.workspaceApplications$,
            },
            width: '300px',
            height: '500px',
            hasBackdrop: false,
            scrollStrategy: new NoopScrollStrategy(),
            positionStrategy: new GlobalPositionStrategy()
              .right('0')
              .centerVertically(),
            disableClose: true,
          });
          this.collectionsDialogRef.closed.subscribe(() => {
            this.collectionsDialogRef = null;
          });
        } else {
          this.collectionsDialogRef.close();
          this.collectionsDialogRef = null;
        }

        break;
      }
      case ',': {
        if (this.instructionsDialogRef === null) {
          this.instructionsDialogRef = this._dialog.open(
            InstructionsComponent,
            {
              data: {
                plugins: this._pluginsService.plugins,
                workspaceId$: this.workspaceId$,
                applicationId$: this.applicationId$,
                applications$: this.workspaceApplications$,
              },
              width: '300px',
              height: '500px',
              hasBackdrop: false,
              scrollStrategy: new NoopScrollStrategy(),
              positionStrategy: new GlobalPositionStrategy()
                .left('0')
                .centerVertically(),
              disableClose: true,
            }
          );
          this.instructionsDialogRef.closed.subscribe(() => {
            this.instructionsDialogRef = null;
          });
        } else {
          this.instructionsDialogRef.close();
          this.instructionsDialogRef = null;
        }

        break;
      }
    }
  }

  onRemoveFromSlot(index: number) {
    this.slots[index] = null;
  }

  onSwapSlots(previousIndex: number, newIndex: number) {
    const temp = this.slots[newIndex];
    this.slots[newIndex] = this.slots[previousIndex];
    this.slots[previousIndex] = temp;
  }

  onSlotActivate(index: number) {
    const data = this.slots[index] ?? null;

    if (data !== null) {
      this.active = {
        kind: index < 6 ? 'instruction' : 'collection',
        data: data,
      };
    }
  }

  onUpdateSlot(index: number, data: Instruction | Collection) {
    this.slots[index] = data;
  }

  onUseItem(instructionId: string, item: Option<ActiveItem>) {
    const instructionIndex =
      this.boardInstructions.findIndex(({ id }) => id === instructionId) ??
      null;

    // create a new document/task

    if (item !== null && instructionIndex !== null) {
      this.active = null;

      if (item.kind === 'instruction') {
        this.boardInstructions[instructionIndex] = {
          ...this.boardInstructions[instructionIndex],
          tasks: [
            ...this.boardInstructions[instructionIndex].tasks,
            {
              id: uuid(),
              name: 'asd',
              instruction: {
                id: '',
                name: '',
                applicationId: '',
                workspaceId: '',
                thumbnailUrl: '',
                isInternal: false,
                instruction: '',
                namespace: '',
                plugin: '',
              },
            },
          ],
        };
      } else {
        this.boardInstructions[instructionIndex] = {
          ...this.boardInstructions[instructionIndex],
          documents: [
            ...this.boardInstructions[instructionIndex].documents,
            {
              id: uuid(),
              name: 'asd',
              collection: {
                id: '',
                name: '',
                applicationId: '',
                workspaceId: '',
                thumbnailUrl: '',
                isInternal: true,
                account: null,
                namespace: null,
                plugin: null,
              },
            },
          ],
        };
      }
    }
  }

  onUseCollection(instructionId: string, collection: Collection) {
    this._applicationApiService
      .createInstructionDocument(instructionId, collection)
      .subscribe();
  }

  onUseInstruction(instructionId: string, instruction: Instruction) {
    this._applicationApiService
      .createInstructionTask(instructionId, instruction)
      .subscribe();
  }

  onSelectItem(
    instructions: BoardInstruction[],
    instructionId: string,
    itemId: string,
    kind: BoardItemKind
  ) {
    const instruction =
      instructions.find(({ id }) => id === instructionId) ?? null;

    if (instruction !== null) {
      if (kind === 'document') {
        const document =
          instruction.documents.find(({ id }) => id === itemId) ?? null;

        if (document !== null) {
          this.selectedDocument = document;
          this.selectedTask = null;
        }
      } else if (kind === 'task') {
        const task = instruction.tasks.find(({ id }) => id === itemId) ?? null;

        if (task !== null) {
          this.selectedTask = task;
          this.selectedDocument = null;
        }
      }
    }
  }

  onMoveDocument(
    instructions: BoardInstruction[],
    instructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    const instructionIndex = instructions.findIndex(
      ({ id }) => id === instructionId
    );

    if (instructionIndex === -1) {
      throw new Error('Invalid instruction.');
    }

    const documentsOrder = instructions[instructionIndex].documents.map(
      ({ id }) => id
    );

    moveItemInArray(documentsOrder, previousIndex, newIndex);

    this._applicationApiService
      .updateInstructionDocumentsOrder(instructionId, documentsOrder)
      .subscribe();
  }

  onTransferDocument(
    instructions: BoardInstruction[],
    previousInstructionId: string,
    newInstructionId: string,
    documentId: string,
    previousIndex: number,
    newIndex: number
  ) {
    this._applicationApiService
      .transferInstructionDocument(
        instructions,
        previousInstructionId,
        newInstructionId,
        documentId,
        previousIndex,
        newIndex
      )
      .subscribe();
  }

  onMoveTask(
    instructions: BoardInstruction[],
    instructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    const instructionIndex = instructions.findIndex(
      ({ id }) => id === instructionId
    );

    if (instructionIndex === -1) {
      throw new Error('Invalid instruction.');
    }

    const tasksOrder = instructions[instructionIndex].tasks.map(({ id }) => id);

    moveItemInArray(tasksOrder, previousIndex, newIndex);

    this._applicationApiService
      .updateInstructionTasksOrder(instructionId, tasksOrder)
      .subscribe();
  }

  onTransferTask(
    instructions: BoardInstruction[],
    previousInstructionId: string,
    newInstructionId: string,
    taskId: string,
    previousIndex: number,
    newIndex: number
  ) {
    this._applicationApiService
      .transferInstructionTask(
        instructions,
        previousInstructionId,
        newInstructionId,
        taskId,
        previousIndex,
        newIndex
      )
      .subscribe();
  }
}

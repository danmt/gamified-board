import { Dialog, DialogModule } from '@angular/cdk/dialog';
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
  inject,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { provideComponentStore } from '@ngrx/component-store';
import { concatMap, EMPTY, map } from 'rxjs';
import {
  BoardComponent,
  HotKey,
  MainDockComponent,
  RowComponent,
  SelectedDocumentDockComponent,
  SelectedTaskDockComponent,
} from '../components';
import { KeyboardListenerDirective } from '../directives';
import {
  EditDocumentData,
  EditDocumentModalComponent,
  EditDocumentSubmitPayload,
  EditTaskData,
  EditTaskModalComponent,
} from '../modals';
import { BoardItemDropListsPipe } from '../pipes';
import {
  CollectionsSectionComponent,
  InstructionsSectionComponent,
} from '../sections';
import {
  CollectionApiService,
  DocumentApiService,
  InstructionApiService,
  TaskApiService,
} from '../services';
import {
  BoardCollection,
  BoardDocument,
  BoardEntry,
  BoardInstruction,
  BoardStore,
  BoardTask,
} from '../stores';
import { Entity, Option } from '../utils';

@Component({
  selector: 'pg-board-page',
  template: `
    <ng-container *ngrxLet="selectedTask$; let selectedTask">
      <ng-container *ngrxLet="selectedDocument$; let selectedDocument">
        <ng-container *ngrxLet="activeCollection$; let activeCollection">
          <ng-container *ngrxLet="activeInstruction$; let activeInstruction">
            <ng-container
              pgKeyboardListener
              (pressComma)="onCommaPressed()"
              (pressDot)="onDotPressed()"
              (pressEscape)="
                onEscapePressed(
                  activeInstruction?.id ?? null,
                  activeCollection?.id ?? null,
                  selectedTask,
                  selectedDocument
                )
              "
              (pressDelete)="onDeletePressed(selectedTask, selectedDocument)"
            >
              <ng-container
                *ngrxLet="currentApplicationInstructions$; let instructions"
              >
                <pg-main-dock
                  *ngIf="selectedTask === null && selectedDocument === null"
                  class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
                  [instructionSlots]="(instructionSlots$ | ngrxPush) ?? null"
                  [instructionHotkeys]="instructionHotkeys"
                  [activeInstructionId]="activeInstruction?.id ?? null"
                  [collectionSlots]="(collectionSlots$ | ngrxPush) ?? null"
                  [collectionHotkeys]="collectionHotkeys"
                  [activeCollectionId]="activeCollection?.id ?? null"
                  (swapInstructionSlots)="
                    onSwapInstructionSlots($event[0], $event[1])
                  "
                  (removeFromInstructionSlot)="
                    onRemoveFromInstructionSlot($event)
                  "
                  (activateInstructionSlot)="onActivateInstructionSlot($event)"
                  (updateInstructionSlot)="
                    onUpdateInstructionSlot($event.index, $event.data)
                  "
                  (createInstruction)="
                    onCreateInstruction(
                      $event.id,
                      $event.name,
                      $event.thumbnailUrl,
                      $event.arguments
                    )
                  "
                  (swapCollectionSlots)="
                    onSwapCollectionSlots($event[0], $event[1])
                  "
                  (removeFromCollectionSlot)="
                    onRemoveFromCollectionSlot($event)
                  "
                  (activateCollectionSlot)="onActivateCollectionSlot($event)"
                  (updateCollectionSlot)="
                    onUpdateCollectionSlot($event.index, $event.data)
                  "
                  (createCollection)="
                    onCreateCollection(
                      $event.id,
                      $event.name,
                      $event.thumbnailUrl,
                      $event.attributes
                    )
                  "
                ></pg-main-dock>
                <pg-selected-task-dock
                  *ngIf="selectedTask$ | ngrxPush as selectedTask"
                  [selected]="selectedTask"
                  class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
                  (updateTask)="
                    onUpdateTask(
                      selectedTask.ownerId,
                      selectedTask.id,
                      selectedTask
                    )
                  "
                  (clearSelectedTask)="onSelectTask(null)"
                ></pg-selected-task-dock>
                <pg-selected-document-dock
                  *ngIf="selectedDocument$ | ngrxPush as selectedDocument"
                  [selected]="selectedDocument"
                  class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
                  (updateDocument)="
                    onUpdateDocument(
                      selectedDocument.ownerId,
                      selectedDocument.id,
                      selectedDocument
                    )
                  "
                  (clearSelectedDocument)="onSelectDocument(null)"
                ></pg-selected-document-dock>
                <pg-board *ngIf="instructions !== null">
                  <ng-container
                    *ngrxLet="activeCollection$; let activeCollection"
                  >
                    <pg-row
                      *ngFor="let instruction of instructions; trackBy: trackBy"
                      [activeInstruction]="activeInstruction"
                      [activeCollection]="activeCollection"
                      [instruction]="instruction"
                      [documentsDropLists]="
                        instructions | pgBoardItemDropLists: 'document'
                      "
                      [tasksDropLists]="
                        instructions | pgBoardItemDropLists: 'task'
                      "
                      (createDocument)="
                        onCreateDocument(instruction.id, activeCollection)
                      "
                      (createTask)="
                        onCreateTask(instruction.id, activeInstruction)
                      "
                      (selectTask)="onSelectTask($event)"
                      (selectDocument)="onSelectDocument($event)"
                      (moveDocument)="
                        onMoveDocument(
                          instructions,
                          instruction.id,
                          $event.previousIndex,
                          $event.newIndex
                        )
                      "
                      (transferDocument)="
                        onTransferDocument(
                          $event.previousInstructionId,
                          $event.newInstructionId,
                          $event.documentId,
                          $event.newIndex
                        )
                      "
                      (moveTask)="
                        onMoveTask(
                          instructions,
                          instruction.id,
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
                    >
                      <p>Instruction: {{ instruction.name }}</p>
                    </pg-row>
                  </ng-container>
                </pg-board>
              </ng-container>
            </ng-container>
          </ng-container>
        </ng-container>
      </ng-container>
    </ng-container>
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
    RowComponent,
    PushModule,
    LetModule,
    BoardItemDropListsPipe,
    KeyboardListenerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideComponentStore(BoardStore)],
})
export class BoardPageComponent implements OnInit {
  private readonly _dialog = inject(Dialog);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _taskApiService = inject(TaskApiService);
  private readonly _documentApiService = inject(DocumentApiService);
  private readonly _collectionApiService = inject(CollectionApiService);
  private readonly _instructionApiService = inject(InstructionApiService);
  private readonly _boardStore = inject(BoardStore);
  private readonly _viewContainerRef = inject(ViewContainerRef);

  readonly workspaceId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId'))
  );
  readonly applicationId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('applicationId'))
  );
  readonly workspaceApplications$ = this._boardStore.workspaceApplications$;
  readonly currentApplicationInstructions$ =
    this._boardStore.boardInstructions$;
  readonly selectedTask$ = this._boardStore.selectedTask$;
  readonly selectedDocument$ = this._boardStore.selectedDocument$;
  readonly activeCollection$ = this._boardStore.activeCollection$;
  readonly activeInstruction$ = this._boardStore.activeInstruction$;
  readonly instructionSlots$ = this._boardStore.instructionSlots$;
  readonly collectionSlots$ = this._boardStore.collectionSlots$;

  instructionHotkeys: HotKey[] = [
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
  ];
  collectionHotkeys: HotKey[] = [
    {
      slot: 0,
      key: '1',
    },
    {
      slot: 1,
      key: '2',
    },
    {
      slot: 2,
      key: '3',
    },
    {
      slot: 3,
      key: '4',
    },
    {
      slot: 4,
      key: '5',
    },
    {
      slot: 5,
      key: '6',
    },
  ];
  @HostBinding('class') class = 'block';

  ngOnInit() {
    this._boardStore.setWorkspaceId(this.workspaceId$);
    this._boardStore.setCurrentApplicationId(this.applicationId$);
  }

  onUpdateInstructionSlot(index: number, instructionId: string) {
    this._boardStore.setInstructionSlotId({ index, instructionId });
  }

  onRemoveFromInstructionSlot(index: number) {
    this._boardStore.setInstructionSlotId({ index, instructionId: null });
  }

  onSwapInstructionSlots(previousIndex: number, newIndex: number) {
    this._boardStore.swapInstructionSlotIds({ previousIndex, newIndex });
  }

  onActivateInstructionSlot(instructionId: string) {
    this._boardStore.setActiveInstructionId(instructionId);
  }

  onUpdateCollectionSlot(index: number, collectionId: string) {
    this._boardStore.setCollectionSlotId({ index, collectionId });
  }

  onRemoveFromCollectionSlot(index: number) {
    this._boardStore.setCollectionSlotId({ index, collectionId: null });
  }

  onSwapCollectionSlots(previousIndex: number, newIndex: number) {
    this._boardStore.swapCollectionSlotIds({ previousIndex, newIndex });
  }

  onActivateCollectionSlot(collectionId: string) {
    this._boardStore.setActiveCollectionId(collectionId);
  }

  onMoveDocument(
    entries: BoardEntry[],
    instructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    const instructionIndex = entries.findIndex(
      ({ id }) => id === instructionId
    );

    if (instructionIndex === -1) {
      throw new Error('Invalid instruction.');
    }

    const documentsOrder = entries[instructionIndex].documents.map(
      ({ id }) => id
    );

    moveItemInArray(documentsOrder, previousIndex, newIndex);

    this._documentApiService
      .updateDocumentsOrder(instructionId, documentsOrder)
      .subscribe();
  }

  onTransferDocument(
    previousInstructionId: string,
    newInstructionId: string,
    documentId: string,
    newIndex: number
  ) {
    this._documentApiService
      .transferDocument(
        previousInstructionId,
        newInstructionId,
        documentId,
        newIndex
      )
      .subscribe();
  }

  onMoveTask(
    entries: BoardEntry[],
    instructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    const instructionIndex = entries.findIndex(
      ({ id }) => id === instructionId
    );

    if (instructionIndex === -1) {
      throw new Error('Invalid instruction.');
    }

    const tasksOrder = entries[instructionIndex].tasks.map(({ id }) => id);

    moveItemInArray(tasksOrder, previousIndex, newIndex);

    this._instructionApiService
      .updateInstructionTasksOrder(instructionId, tasksOrder)
      .subscribe();
  }

  onTransferTask(
    entries: BoardEntry[],
    previousInstructionId: string,
    newInstructionId: string,
    taskId: string,
    previousIndex: number,
    newIndex: number
  ) {
    this._taskApiService
      .transferTask(
        entries,
        previousInstructionId,
        newInstructionId,
        taskId,
        previousIndex,
        newIndex
      )
      .subscribe();
  }

  onCreateInstruction(
    instructionId: string,
    instructionName: string,
    thumbnailUrl: string,
    args: { id: string; name: string; type: string; isOption: boolean }[]
  ) {
    const workspaceId =
      this._activatedRoute.snapshot.paramMap.get('workspaceId');
    const applicationId =
      this._activatedRoute.snapshot.paramMap.get('applicationId');

    if (workspaceId === null) {
      throw new Error('WorkspaceId not defined.');
    }

    if (applicationId === null) {
      throw new Error('ApplicationId not defined.');
    }

    this._instructionApiService
      .createInstruction(
        workspaceId,
        applicationId,
        instructionId,
        instructionName,
        thumbnailUrl,
        args
      )
      .subscribe();
  }

  onCreateCollection(
    collectionId: string,
    collectionName: string,
    thumbnailUrl: string,
    attributes: { id: string; name: string; type: string; isOption: boolean }[]
  ) {
    const workspaceId =
      this._activatedRoute.snapshot.paramMap.get('workspaceId');
    const applicationId =
      this._activatedRoute.snapshot.paramMap.get('applicationId');

    if (workspaceId === null) {
      throw new Error('WorkspaceId not defined.');
    }

    if (applicationId === null) {
      throw new Error('ApplicationId not defined.');
    }

    this._collectionApiService
      .createCollection(
        workspaceId,
        applicationId,
        collectionId,
        collectionName,
        thumbnailUrl,
        attributes
      )
      .subscribe();
  }

  onSelectDocument(documentId: Option<string>) {
    this._boardStore.setSelectedDocumentId(documentId);
  }

  onCreateDocument(
    instructionId: string,
    documentCollection: Option<BoardCollection>
  ) {
    if (documentCollection !== null) {
      this._dialog
        .open<
          EditDocumentSubmitPayload,
          EditDocumentData,
          EditDocumentModalComponent
        >(EditDocumentModalComponent, {
          data: {
            collection: documentCollection,
            document: null,
            instructionId,
          },
          viewContainerRef: this._viewContainerRef,
        })
        .closed.pipe(
          concatMap((documentData) => {
            if (documentData === undefined) {
              return EMPTY;
            }

            this._boardStore.setActiveCollectionId(null);
            this._boardStore.setActiveInstructionId(null);

            return this._documentApiService.createDocument(
              instructionId,
              documentData.id,
              documentData.name,
              documentData.method,
              documentCollection.id,
              documentData.seeds,
              documentData.bump
            );
          })
        )
        .subscribe();
    }
  }

  onUpdateDocument(
    instructionId: string,
    documentId: string,
    document: BoardDocument
  ) {
    this._dialog
      .open<
        EditDocumentSubmitPayload,
        EditDocumentData,
        EditDocumentModalComponent
      >(EditDocumentModalComponent, {
        data: { document, collection: document.collection, instructionId },
        viewContainerRef: this._viewContainerRef,
      })
      .closed.pipe(
        concatMap((documentData) => {
          if (documentData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveCollectionId(null);
          this._boardStore.setActiveInstructionId(null);

          return this._documentApiService.updateDocument(
            instructionId,
            documentId,
            documentData.name,
            documentData.method,
            documentData.seeds,
            documentData.bump
          );
        })
      )
      .subscribe();
  }

  onSelectTask(taskId: Option<string>) {
    this._boardStore.setSelectedTaskId(taskId);
  }

  onCreateTask(
    instructionId: string,
    taskInstruction: Option<BoardInstruction>
  ) {
    if (taskInstruction !== null) {
      this._dialog
        .open<EditTaskData, Option<EditTaskData>, EditTaskModalComponent>(
          EditTaskModalComponent
        )
        .closed.pipe(
          concatMap((taskData) => {
            if (taskData === undefined) {
              return EMPTY;
            }

            this._boardStore.setActiveCollectionId(null);
            this._boardStore.setActiveInstructionId(null);

            return this._taskApiService.createTask(
              instructionId,
              taskData.id,
              taskData.name,
              taskInstruction.id
            );
          })
        )
        .subscribe();
    }
  }

  onUpdateTask(instructionId: string, taskId: string, task: BoardTask) {
    this._dialog
      .open<EditTaskData, Option<EditTaskData>, EditTaskModalComponent>(
        EditTaskModalComponent,
        { data: task }
      )
      .closed.pipe(
        concatMap((taskData) => {
          if (taskData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveCollectionId(null);
          this._boardStore.setActiveInstructionId(null);

          return this._taskApiService.updateTask(
            instructionId,
            taskId,
            taskData.name
          );
        })
      )
      .subscribe();
  }

  onCommaPressed() {
    const dialogRef = this._dialog.getDialogById('instructions-section');

    if (dialogRef === undefined) {
      this._dialog.open(InstructionsSectionComponent, {
        id: 'instructions-section',
        width: '300px',
        height: '500px',
        hasBackdrop: false,
        scrollStrategy: new NoopScrollStrategy(),
        positionStrategy: new GlobalPositionStrategy()
          .left('0')
          .centerVertically(),
        disableClose: true,
        viewContainerRef: this._viewContainerRef,
      });
    } else {
      dialogRef.close();
    }
  }

  onDotPressed() {
    const dialogRef = this._dialog.getDialogById('collections-section');

    if (dialogRef === undefined) {
      this._dialog.open(CollectionsSectionComponent, {
        id: 'collections-section',
        width: '300px',
        height: '500px',
        hasBackdrop: false,
        scrollStrategy: new NoopScrollStrategy(),
        positionStrategy: new GlobalPositionStrategy()
          .right('0')
          .centerVertically(),
        disableClose: true,
        viewContainerRef: this._viewContainerRef,
      });
    } else {
      dialogRef.close();
    }
  }

  onEscapePressed(
    activeInstructionId: Option<string>,
    activeCollectionId: Option<string>,
    selectedTask: Option<BoardTask>,
    selectedDocument: Option<BoardDocument>
  ) {
    const instructionsSectionRef = this._dialog.getDialogById(
      'instructions-section'
    );
    const collectionsSectionRef = this._dialog.getDialogById(
      'collections-section'
    );

    if (
      instructionsSectionRef !== undefined ||
      collectionsSectionRef !== undefined
    ) {
      instructionsSectionRef?.close();
      collectionsSectionRef?.close();
    } else if (activeInstructionId !== null) {
      this._boardStore.setActiveInstructionId(null);
    } else if (activeCollectionId !== null) {
      this._boardStore.setActiveCollectionId(null);
    } else if (selectedDocument !== null) {
      this._boardStore.setSelectedDocumentId(null);
    } else if (selectedTask !== null) {
      this._boardStore.setSelectedTaskId(null);
    }
  }

  onDeletePressed(
    selectedTask: Option<BoardTask>,
    selectedDocument: Option<BoardDocument>
  ) {
    if (selectedTask !== null) {
      if (confirm('Are you sure? This action cannot be reverted.')) {
        this._taskApiService
          .deleteTask(selectedTask.ownerId, selectedTask.id)
          .subscribe(() => (selectedTask = null));
      }
    } else if (selectedDocument !== null) {
      if (confirm('Are you sure? This action cannot be reverted.')) {
        this._documentApiService
          .deleteDocument(selectedDocument.ownerId, selectedDocument.id)
          .subscribe(() => (selectedDocument = null));
      }
    }
  }

  trackBy(_: number, item: Entity<unknown>): string {
    return item.id;
  }
}

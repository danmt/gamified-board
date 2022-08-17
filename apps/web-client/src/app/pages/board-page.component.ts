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
  DocumentDto,
  InstructionApiService,
  TaskApiService,
  TaskDto,
} from '../services';
import { BoardStore } from '../stores';
import {
  ActiveItem,
  BoardInstruction,
  Collection,
  Entity,
  Instruction,
  MainDockSlots,
  Option,
} from '../utils';

@Component({
  selector: 'pg-board-page',
  template: `
    <ng-container *ngrxLet="selectedTask$; let selectedTask">
      <ng-container *ngrxLet="selectedDocument$; let selectedDocument">
        <ng-container *ngrxLet="activeItem$; let activeItem">
          <ng-container
            pgKeyboardListener
            (pressComma)="onCommaPressed()"
            (pressDot)="onDotPressed()"
            (pressEscape)="
              onEscapePressed(activeItem, selectedTask, selectedDocument)
            "
            (pressDelete)="onDeletePressed(selectedTask, selectedDocument)"
          >
            <pg-main-dock
              *ngIf="selectedTask === null && selectedDocument === null"
              class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
              [slots]="slots"
              [hotkeys]="hotkeys"
              [active]="activeItem"
              (swapSlots)="onSwapSlots($event[0], $event[1])"
              (removeFromSlot)="onRemoveFromSlot($event)"
              (activateSlot)="onSlotActivate($event)"
              (updateSlot)="onUpdateSlot($event.index, $event.data)"
              (createCollection)="
                onCreateCollection($event.id, $event.name, $event.thumbnailUrl)
              "
              (createInstruction)="
                onCreateInstruction($event.id, $event.name, $event.thumbnailUrl)
              "
            ></pg-main-dock>
            <pg-selected-task-dock
              *ngIf="selectedTask$ | ngrxPush as selectedTask"
              [selected]="selectedTask"
              class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
              (updateTask)="
                onUpdateTask(selectedTask.owner, selectedTask.id, selectedTask)
              "
              (clearSelectedTask)="onSelectTask(null)"
            ></pg-selected-task-dock>
            <pg-selected-document-dock
              *ngIf="selectedDocument$ | ngrxPush as selectedDocument"
              [selected]="selectedDocument"
              class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
              (updateDocument)="
                onUpdateDocument(
                  selectedDocument.owner,
                  selectedDocument.id,
                  selectedDocument
                )
              "
              (clearSelectedDocument)="onSelectDocument(null)"
            ></pg-selected-document-dock>
            <pg-board
              *ngIf="currentApplicationInstructions$ | ngrxPush as instructions"
            >
              <pg-row
                *ngFor="let instruction of instructions; trackBy: trackBy"
                [active]="activeItem"
                [instruction]="instruction"
                [documentsDropLists]="
                  instructions | pgBoardItemDropLists: 'document'
                "
                [tasksDropLists]="instructions | pgBoardItemDropLists: 'task'"
                (createDocument)="onCreateDocument(instruction.id, $event)"
                (createTask)="onCreateTask(instruction.id, $event)"
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
            </pg-board>
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
    this._boardStore.currentApplicationInstructions$;
  readonly selectedTask$ = this._boardStore.selectedTask$;
  readonly selectedDocument$ = this._boardStore.selectedDocument$;
  readonly activeItem$ = this._boardStore.activeItem$;

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
  @HostBinding('class') class = 'block';

  ngOnInit() {
    this._boardStore.setWorkspaceId(this.workspaceId$);
    this._boardStore.setCurrentApplicationId(this.applicationId$);
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
      this._boardStore.setActiveItem({
        kind: index < 6 ? 'instruction' : 'collection',
        data: data,
      });
    }
  }

  onUpdateSlot(index: number, data: Instruction | Collection) {
    this.slots[index] = data;
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

    this._instructionApiService
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
    this._documentApiService
      .transferDocument(
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

    this._instructionApiService
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
    this._taskApiService
      .transferTask(
        instructions,
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
    thumbnailUrl: string
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
        thumbnailUrl
      )
      .subscribe();
  }

  onCreateCollection(
    collectionId: string,
    collectionName: string,
    thumbnailUrl: string
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
        thumbnailUrl
      )
      .subscribe();
  }

  onSelectDocument(documentId: Option<string>) {
    this._boardStore.setSelectedDocumentId(documentId);
  }

  onCreateDocument(instructionId: string, collection: Collection) {
    this._dialog
      .open<
        EditDocumentData,
        Option<EditDocumentData>,
        EditDocumentModalComponent
      >(EditDocumentModalComponent)
      .closed.pipe(
        concatMap((documentData) => {
          if (documentData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveItem(null);

          return this._documentApiService.createDocument(
            instructionId,
            documentData.id,
            documentData.name,
            collection
          );
        })
      )
      .subscribe();
  }

  onUpdateDocument(
    instructionId: string,
    documentId: string,
    document: DocumentDto
  ) {
    this._dialog
      .open<
        EditDocumentData,
        Option<EditDocumentData>,
        EditDocumentModalComponent
      >(EditDocumentModalComponent, { data: document })
      .closed.pipe(
        concatMap((documentData) => {
          if (documentData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveItem(null);

          return this._documentApiService.updateDocument(
            instructionId,
            documentId,
            documentData.name
          );
        })
      )
      .subscribe();
  }

  onSelectTask(taskId: Option<string>) {
    this._boardStore.setSelectedTaskId(taskId);
  }

  onCreateTask(instructionId: string, instruction: Instruction) {
    this._dialog
      .open<EditTaskData, Option<EditTaskData>, EditTaskModalComponent>(
        EditTaskModalComponent
      )
      .closed.pipe(
        concatMap((taskData) => {
          if (taskData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveItem(null);

          return this._taskApiService.createTask(
            instructionId,
            taskData.id,
            taskData.name,
            instruction
          );
        })
      )
      .subscribe();
  }

  onUpdateTask(instructionId: string, taskId: string, task: TaskDto) {
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

          this._boardStore.setActiveItem(null);

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
    activeItem: Option<ActiveItem>,
    selectedTask: Option<TaskDto>,
    selectedDocument: Option<DocumentDto>
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
    } else if (activeItem !== null) {
      this._boardStore.setActiveItem(null);
    } else if (selectedDocument !== null) {
      this._boardStore.setSelectedDocumentId(null);
    } else if (selectedTask !== null) {
      this._boardStore.setSelectedTaskId(null);
    }
  }

  onDeletePressed(
    selectedTask: Option<TaskDto>,
    selectedDocument: Option<DocumentDto>
  ) {
    if (selectedTask !== null) {
      if (confirm('Are you sure? This action cannot be reverted.')) {
        this._taskApiService
          .deleteTask(selectedTask.owner, selectedTask.id)
          .subscribe(() => (selectedTask = null));
      }
    } else if (selectedDocument !== null) {
      if (confirm('Are you sure? This action cannot be reverted.')) {
        this._documentApiService
          .deleteDocument(selectedDocument.owner, selectedDocument.id)
          .subscribe(() => (selectedDocument = null));
      }
    }
  }

  trackBy(_: number, item: Entity<unknown>): string {
    return item.id;
  }
}

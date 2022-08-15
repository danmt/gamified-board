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
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PushModule } from '@ngrx/component';
import { provideComponentStore } from '@ngrx/component-store';
import { map } from 'rxjs';
import {
  BoardComponent,
  HotKey,
  MainDockComponent,
  RowComponent,
  SelectedDocumentDockComponent,
  SelectedTaskDockComponent,
} from '../components';
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
import { BoardStore } from '../stores';
import {
  ActiveItem,
  BoardInstruction,
  BoardItemKind,
  Collection,
  Entity,
  Instruction,
  MainDockSlots,
  Option,
  SelectedBoardDocument,
  SelectedBoardTask,
} from '../utils';

@Component({
  selector: 'pg-board-page',
  template: `
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
      (createCollection)="onCreateCollection()"
      (createInstruction)="onCreateInstruction()"
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
      *ngIf="currentApplicationInstructions$ | ngrxPush as instructions"
    >
      <pg-row
        *ngFor="let instruction of instructions; trackBy: trackBy"
        [active]="active"
        [instruction]="instruction"
        [documentsDropLists]="instructions | pgBoardItemDropLists: 'document'"
        [tasksDropLists]="instructions | pgBoardItemDropLists: 'task'"
        (useCollection)="onUseCollection(instruction.id, $event)"
        (useInstruction)="onUseInstruction(instruction.id, $event)"
        (selectItem)="
          onSelectItem(instructions, instruction.id, $event.itemId, $event.kind)
        "
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
        <p>row {{ instruction.id }}</p>
      </pg-row>
    </pg-board>
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
    BoardItemDropListsPipe,
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

  active: Option<ActiveItem> = null;
  selectedTask: Option<SelectedBoardTask> = null;
  selectedDocument: Option<SelectedBoardDocument> = null;
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

  collectionsSectionDialogRef: Option<
    DialogRef<CollectionsSectionComponent, CollectionsSectionComponent>
  > = null;
  instructionsSectionDialogRef: Option<
    DialogRef<InstructionsSectionComponent, InstructionsSectionComponent>
  > = null;
  @HostBinding('class') class = 'block';
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Delete': {
        if (this.selectedTask !== null) {
          if (confirm('Are you sure? This action cannot be reverted.')) {
            this._taskApiService
              .deleteTask(this.selectedTask.instructionId, this.selectedTask.id)
              .subscribe(() => (this.selectedTask = null));
          }
        } else if (this.selectedDocument !== null) {
          if (confirm('Are you sure? This action cannot be reverted.')) {
            this._documentApiService
              .deleteDocument(
                this.selectedDocument.instructionId,
                this.selectedDocument.id
              )
              .subscribe(() => (this.selectedDocument = null));
          }
        }

        break;
      }
      case 'Escape': {
        if (
          this.collectionsSectionDialogRef !== null ||
          this.instructionsSectionDialogRef !== null
        ) {
          this.collectionsSectionDialogRef?.close();
          this.collectionsSectionDialogRef = null;
          this.instructionsSectionDialogRef?.close();
          this.instructionsSectionDialogRef = null;
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
        if (this.collectionsSectionDialogRef === null) {
          this.collectionsSectionDialogRef = this._dialog.open(
            CollectionsSectionComponent,
            {
              width: '300px',
              height: '500px',
              hasBackdrop: false,
              scrollStrategy: new NoopScrollStrategy(),
              positionStrategy: new GlobalPositionStrategy()
                .right('0')
                .centerVertically(),
              disableClose: true,
              viewContainerRef: this._viewContainerRef,
            }
          );
          this.collectionsSectionDialogRef.closed.subscribe(() => {
            this.collectionsSectionDialogRef = null;
          });
        } else {
          this.collectionsSectionDialogRef.close();
          this.collectionsSectionDialogRef = null;
        }

        break;
      }
      case ',': {
        if (this.instructionsSectionDialogRef === null) {
          this.instructionsSectionDialogRef = this._dialog.open(
            InstructionsSectionComponent,
            {
              width: '300px',
              height: '500px',
              hasBackdrop: false,
              scrollStrategy: new NoopScrollStrategy(),
              positionStrategy: new GlobalPositionStrategy()
                .left('0')
                .centerVertically(),
              disableClose: true,
              viewContainerRef: this._viewContainerRef,
            }
          );
          this.instructionsSectionDialogRef.closed.subscribe(() => {
            this.instructionsSectionDialogRef = null;
          });
        } else {
          this.instructionsSectionDialogRef.close();
          this.instructionsSectionDialogRef = null;
        }

        break;
      }
    }
  }

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
      this.active = {
        kind: index < 6 ? 'instruction' : 'collection',
        data: data,
      };
    }
  }

  onUpdateSlot(index: number, data: Instruction | Collection) {
    this.slots[index] = data;
  }

  onUseCollection(instructionId: string, collection: Collection) {
    this.active = null;
    this._documentApiService
      .createDocument(instructionId, collection)
      .subscribe();
  }

  onUseInstruction(instructionId: string, instruction: Instruction) {
    this.active = null;
    this._taskApiService.createTask(instructionId, instruction).subscribe();
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
          this.selectedDocument = {
            id: document.id,
            name: document.name,
            instructionId,
            collection: {
              id: document.collection.id,
              name: document.collection.name,
              applicationId: document.collection.applicationId,
              workspaceId: document.collection.workspaceId,
              isInternal: document.collection.isInternal,
              account: document.collection.account,
              namespace: document.collection.namespace,
              plugin: document.collection.plugin,
              thumbnailUrl: document.collection.thumbnailUrl,
            },
            kind: 'document',
          };
          this.selectedTask = null;
          this.active = null;
        }
      } else if (kind === 'task') {
        const task = instruction.tasks.find(({ id }) => id === itemId) ?? null;

        if (task !== null) {
          this.selectedTask = {
            id: task.id,
            name: task.name,
            instructionId,
            instruction: {
              id: task.instruction.id,
              name: task.instruction.name,
              applicationId: task.instruction.applicationId,
              workspaceId: task.instruction.workspaceId,
              isInternal: task.instruction.isInternal,
              instruction: task.instruction.instruction,
              namespace: task.instruction.namespace,
              plugin: task.instruction.plugin,
              thumbnailUrl: task.instruction.thumbnailUrl,
            },
            kind: 'task',
          };
          this.selectedDocument = null;
          this.active = null;
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

  onCreateInstruction() {
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
      .createInstruction(workspaceId, applicationId, 'my name')
      .subscribe();
  }

  onCreateCollection() {
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
      .createCollection(workspaceId, applicationId, 'my name')
      .subscribe();
  }

  trackBy(_: number, item: Entity<unknown>): string {
    return item.id;
  }
}

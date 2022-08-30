import { DialogModule } from '@angular/cdk/dialog';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { provideComponentStore } from '@ngrx/component-store';
import { map } from 'rxjs';
import { HotKey, MainDockComponent, RowComponent } from '../components';
import {
  CursorScrollDirective,
  FollowCursorDirective,
  KeyboardListenerDirective,
} from '../directives';
import { BoardItemDropListsPipe } from '../pipes';
import {
  ApplicationSectionComponent,
  ApplicationsSectionComponent,
  CollectionSectionComponent,
  CollectionsSectionComponent,
  InstructionDocumentSectionComponent,
  InstructionSectionComponent,
  InstructionsSectionComponent,
  InstructionTaskSectionComponent,
} from '../sections';
import {
  InstructionDocumentApiService,
  InstructionTaskApiService,
} from '../services';
import { BoardStore, EntryView } from '../stores';
import { Entity, Option } from '../utils';

@Component({
  selector: 'pg-board-page',
  template: `
    <div
      *ngIf="currentApplicationInstructions$ | ngrxPush as instructions"
      pgKeyboardListener
      pgCursorScroll
      (pgKeyDown)="onKeyDown($event)"
    >
      <pg-row
        *ngFor="let instruction of instructions; trackBy: trackBy"
        [ngClass]="{ 'border-blue-500': hoveredRow === instruction.id }"
        style="width: 8000px"
        [active]="(active$ | ngrxPush) ?? null"
        [instruction]="instruction"
        [documentsDropLists]="instructions | pgBoardItemDropLists: 'document'"
        [tasksDropLists]="instructions | pgBoardItemDropLists: 'task'"
        (useActive)="onUseActive(instruction.id)"
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
            $event.previousInstructionId,
            $event.newInstructionId,
            $event.instructionTaskId,
            $event.newIndex
          )
        "
        (mouseenter)="hoveredRow = instruction.id"
        (mouseleave)="hoveredRow = null"
      >
        <p>Instruction: {{ instruction.name }}</p>
      </pg-row>
    </div>

    <pg-main-dock
      *ngIf="(selected$ | ngrxPush) === null"
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
      [slots]="(slots$ | ngrxPush) ?? null"
      [hotkeys]="hotkeys"
      [activeId]="(active$ | ngrxPush)?.id ?? null"
      (swapSlots)="onSwapSlots($event[0], $event[1])"
      (removeFromSlot)="onRemoveFromSlot($event)"
      (activateSlot)="onActivateSlot($event)"
      (updateSlot)="onUpdateSlot($event.index, $event.data)"
    ></pg-main-dock>

    <pg-instruction-document-section
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
    ></pg-instruction-document-section>

    <pg-instruction-task-section
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
    ></pg-instruction-task-section>

    <pg-collection-section
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
    ></pg-collection-section>

    <pg-instruction-section
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
    ></pg-instruction-section>

    <pg-application-section
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
    ></pg-application-section>

    <pg-collections-section
      *ngIf="isCollectionsSectionOpen$ | ngrxPush"
      class="fixed right-0 top-24"
      style="width: 300px; height: 500px"
    ></pg-collections-section>

    <pg-instructions-section
      *ngIf="isInstructionsSectionOpen$ | ngrxPush"
      class="fixed left-0 top-24"
      style="width: 300px; height: 500px"
    ></pg-instructions-section>

    <pg-applications-section
      *ngIf="isApplicationsSectionOpen$ | ngrxPush"
      class="fixed left-0 top-24"
      style="width: 300px; height: 500px"
    ></pg-applications-section>

    <div
      class="fixed z-20 pointer-events-none"
      pgFollowCursor
      *ngrxLet="active$; let active"
    >
      <div
        *ngIf="active !== null"
        class="inline-block relative rounded-md shadow-2xl p-1"
        [ngClass]="{
          'bg-green-500': hoveredRow !== null,
          'bg-red-500': hoveredRow === null
        }"
      >
        <img
          [src]="active.thumbnailUrl"
          class="w-16"
          style="min-width: 4rem;"
        />

        <span
          *ngIf="hoveredRow !== null"
          class="text-white absolute bottom-1 right-1 leading-none"
          >+</span
        >

        <span
          *ngIf="hoveredRow === null"
          class="text-white absolute bottom-1 right-1  leading-none"
          >x</span
        >
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DialogModule,
    MainDockComponent,
    RowComponent,
    PushModule,
    LetModule,
    BoardItemDropListsPipe,
    KeyboardListenerDirective,
    FollowCursorDirective,
    CursorScrollDirective,
    CollectionsSectionComponent,
    InstructionsSectionComponent,
    ApplicationsSectionComponent,
    ApplicationSectionComponent,
    InstructionDocumentSectionComponent,
    InstructionTaskSectionComponent,
    CollectionSectionComponent,
    InstructionSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideComponentStore(BoardStore)],
})
export class BoardPageComponent implements OnInit {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );
  private readonly _boardStore = inject(BoardStore);

  readonly workspaceId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId'))
  );
  readonly applicationId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('applicationId'))
  );
  readonly currentApplicationInstructions$ =
    this._boardStore.currentApplicationInstructions$;
  readonly selected$ = this._boardStore.selected$;
  readonly slots$ = this._boardStore.slots$;
  readonly active$ = this._boardStore.active$;
  readonly isCollectionsSectionOpen$ =
    this._boardStore.isCollectionsSectionOpen$;
  readonly isInstructionsSectionOpen$ =
    this._boardStore.isInstructionsSectionOpen$;
  readonly isApplicationsSectionOpen$ =
    this._boardStore.isApplicationsSectionOpen$;

  hoveredRow: Option<string> = null;
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
      key: 'a',
    },
    {
      slot: 6,
      key: 's',
    },
    {
      slot: 7,
      key: 'd',
    },
    {
      slot: 8,
      key: 'f',
    },
    {
      slot: 9,
      key: 'g',
    },
  ];
  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';

  ngOnInit() {
    this._boardStore.setWorkspaceId(this.workspaceId$);
    this._boardStore.setCurrentApplicationId(this.applicationId$);
  }

  onUpdateSlot(
    index: number,
    data: { id: string; kind: 'collection' | 'instruction' | 'application' }
  ) {
    this._boardStore.setSlot({ index, data });
  }

  onRemoveFromSlot(index: number) {
    this._boardStore.setSlot({ index, data: null });
  }

  onSwapSlots(previousIndex: number, newIndex: number) {
    this._boardStore.swapSlots({ previousIndex, newIndex });
  }

  onActivateSlot(activeId: string) {
    this._boardStore.setActiveId(activeId);
  }

  onMoveDocument(
    entries: EntryView[],
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

    this._instructionDocumentApiService
      .updateInstructionDocumentsOrder(instructionId, documentsOrder)
      .subscribe();
  }

  onTransferDocument(
    previousInstructionId: string,
    newInstructionId: string,
    documentId: string,
    newIndex: number
  ) {
    this._instructionDocumentApiService
      .transferInstructionDocument(
        previousInstructionId,
        newInstructionId,
        documentId,
        newIndex
      )
      .subscribe();
  }

  onMoveTask(
    entries: EntryView[],
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

    this._instructionTaskApiService
      .updateInstructionTasksOrder(instructionId, tasksOrder)
      .subscribe();
  }

  onTransferTask(
    previousInstructionId: string,
    newInstructionId: string,
    documentId: string,
    newIndex: number
  ) {
    this._instructionTaskApiService
      .transferInstructionTask(
        previousInstructionId,
        newInstructionId,
        documentId,
        newIndex
      )
      .subscribe();
  }

  onSelectDocument(documentId: Option<string>) {
    this._boardStore.setSelectedId(documentId);
  }

  onSelectTask(taskId: Option<string>) {
    this._boardStore.setSelectedId(taskId);
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape': {
        this._boardStore.closeActiveOrSelected();

        break;
      }
      case '.': {
        this._boardStore.toggleIsCollectionsSectionOpen();

        break;
      }
      case ',': {
        this._boardStore.toggleIsInstructionsSectionOpen();

        break;
      }
      case 'm': {
        this._boardStore.toggleIsApplicationsSectionOpen();

        break;
      }
    }
  }

  trackBy(_: number, item: Entity<unknown>): string {
    return item.id;
  }

  onUseActive(instructionId: string) {
    this._boardStore.useActive(instructionId);
  }
}

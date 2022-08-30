import { moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, HostBinding, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { ActiveComponent, RowComponent } from '../components';
import {
  FollowCursorDirective,
  KeyboardListenerDirective,
} from '../directives';
import {
  InstructionApplicationApiService,
  InstructionDocumentApiService,
  InstructionSignerApiService,
  InstructionSysvarApiService,
  InstructionTaskApiService,
} from '../services';
import { BoardStore, InstructionView } from '../stores';
import { Entity, Option } from '../utils';

@Component({
  selector: 'pg-board-section',
  template: `
    <div
      *ngIf="instructions$ | ngrxPush as instructions"
      pgKeyboardListener
      pgCursorScroll
      (pgKeyDown)="onKeyDown($event)"
    >
      <pg-row
        *ngFor="let instruction of instructions; trackBy: trackBy"
        style="width: 8000px"
        [pgInstruction]="instruction"
        [pgInstructions]="instructions"
        [pgIsHovered]="(hoveredId$ | ngrxPush) === instruction.id"
        (pgUseActive)="onUseActive(instruction.id)"
        (pgSelect)="onSelect($event)"
        (pgMoveDocument)="
          onMoveDocument(
            instructions,
            instruction.id,
            $event.previousIndex,
            $event.newIndex
          )
        "
        (pgTransferDocument)="
          onTransferDocument(
            $event.previousInstructionId,
            $event.newInstructionId,
            $event.documentId,
            $event.newIndex
          )
        "
        (pgMoveTask)="
          onMoveTask(
            instructions,
            instruction.id,
            $event.previousIndex,
            $event.newIndex
          )
        "
        (pgTransferTask)="
          onTransferTask(
            $event.previousInstructionId,
            $event.newInstructionId,
            $event.instructionTaskId,
            $event.newIndex
          )
        "
        (pgMoveApplication)="
          onMoveApplication(
            instructions,
            instruction.id,
            $event.previousIndex,
            $event.newIndex
          )
        "
        (pgTransferApplication)="
          onTransferApplication(
            $event.previousInstructionId,
            $event.newInstructionId,
            $event.instructionApplicationId,
            $event.newIndex
          )
        "
        (pgMoveSysvar)="
          onMoveSysvar(
            instructions,
            instruction.id,
            $event.previousIndex,
            $event.newIndex
          )
        "
        (pgTransferSysvar)="
          onTransferSysvar(
            $event.previousInstructionId,
            $event.newInstructionId,
            $event.instructionSysvarId,
            $event.newIndex
          )
        "
        (pgMoveSigner)="
          onMoveSigner(
            instructions,
            instruction.id,
            $event.previousIndex,
            $event.newIndex
          )
        "
        (pgTransferSigner)="
          onTransferSigner(
            $event.previousInstructionId,
            $event.newInstructionId,
            $event.instructionSignerId,
            $event.newIndex
          )
        "
        (mouseenter)="onMouseEnterRow(instruction.id)"
        (mouseleave)="onMouseLeaveRow()"
      >
        <p>Instruction: {{ instruction.name }}</p>
      </pg-row>
    </div>

    <div class="fixed z-10 pointer-events-none" pgFollowCursor>
      <pg-active
        [pgActive]="(active$ | ngrxPush) ?? null"
        [pgCanAdd]="(hoveredId$ | ngrxPush) !== null"
      ></pg-active>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    KeyboardListenerDirective,
    FollowCursorDirective,
    RowComponent,
    ActiveComponent,
  ],
})
export class BoardSectionComponent {
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );
  private readonly _instructionApplicationApiService = inject(
    InstructionApplicationApiService
  );
  private readonly _instructionSysvarApiService = inject(
    InstructionSysvarApiService
  );
  private readonly _instructionSignerApiService = inject(
    InstructionSignerApiService
  );
  private readonly _boardStore = inject(BoardStore);

  readonly instructions$ = this._boardStore.currentApplicationInstructions$;
  readonly active$ = this._boardStore.active$;
  readonly selected$ = this._boardStore.selected$;
  readonly hoveredId$ = this._boardStore.hoveredId$;
  readonly isCollectionsSectionOpen$ =
    this._boardStore.isCollectionsSectionOpen$;
  readonly isInstructionsSectionOpen$ =
    this._boardStore.isInstructionsSectionOpen$;
  readonly isApplicationsSectionOpen$ =
    this._boardStore.isApplicationsSectionOpen$;

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';

  onMoveDocument(
    entries: InstructionView[],
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
    instructionDocumentId: string,
    newIndex: number
  ) {
    this._instructionDocumentApiService
      .transferInstructionDocument(
        previousInstructionId,
        newInstructionId,
        instructionDocumentId,
        newIndex
      )
      .subscribe();
  }

  onMoveTask(
    entries: InstructionView[],
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
    instructionTaskId: string,
    newIndex: number
  ) {
    this._instructionTaskApiService
      .transferInstructionTask(
        previousInstructionId,
        newInstructionId,
        instructionTaskId,
        newIndex
      )
      .subscribe();
  }

  onMoveApplication(
    entries: InstructionView[],
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

    const applicationsOrder = entries[instructionIndex].applications.map(
      ({ id }) => id
    );

    moveItemInArray(applicationsOrder, previousIndex, newIndex);

    this._instructionApplicationApiService
      .updateInstructionApplicationsOrder(instructionId, applicationsOrder)
      .subscribe();
  }

  onTransferApplication(
    previousInstructionId: string,
    newInstructionId: string,
    instructionApplicationId: string,
    newIndex: number
  ) {
    this._instructionApplicationApiService
      .transferInstructionApplication(
        previousInstructionId,
        newInstructionId,
        instructionApplicationId,
        newIndex
      )
      .subscribe();
  }

  onMoveSysvar(
    entries: InstructionView[],
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

    const sysvarsOrder = entries[instructionIndex].sysvars.map(({ id }) => id);

    moveItemInArray(sysvarsOrder, previousIndex, newIndex);

    this._instructionSysvarApiService
      .updateInstructionSysvarsOrder(instructionId, sysvarsOrder)
      .subscribe();
  }

  onTransferSysvar(
    previousInstructionId: string,
    newInstructionId: string,
    instructionSysvarId: string,
    newIndex: number
  ) {
    this._instructionSysvarApiService
      .transferInstructionSysvar(
        previousInstructionId,
        newInstructionId,
        instructionSysvarId,
        newIndex
      )
      .subscribe();
  }

  onMoveSigner(
    entries: InstructionView[],
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

    const signersOrder = entries[instructionIndex].signers.map(({ id }) => id);

    moveItemInArray(signersOrder, previousIndex, newIndex);

    this._instructionSignerApiService
      .updateInstructionSignersOrder(instructionId, signersOrder)
      .subscribe();
  }

  onTransferSigner(
    previousInstructionId: string,
    newInstructionId: string,
    instructionSignerId: string,
    newIndex: number
  ) {
    this._instructionSignerApiService
      .transferInstructionSigner(
        previousInstructionId,
        newInstructionId,
        instructionSignerId,
        newIndex
      )
      .subscribe();
  }

  onSelect(selectId: Option<string>) {
    this._boardStore.setSelectedId(selectId);
  }

  onUseActive(instructionId: string) {
    this._boardStore.useActive(instructionId);
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape': {
        this._boardStore.closeActiveOrSelected();

        break;
      }

      case 'n': {
        this._boardStore.toggleIsApplicationsSectionOpen();

        break;
      }
      case 'm': {
        this._boardStore.toggleIsInstructionsSectionOpen();

        break;
      }
      case ',': {
        this._boardStore.setActive({ id: 'signer', kind: 'signer' });

        break;
      }
      case '.': {
        this._boardStore.toggleIsCollectionsSectionOpen();

        break;
      }
      case '-': {
        this._boardStore.toggleIsSysvarsSectionOpen();

        break;
      }
    }
  }

  trackBy(_: number, item: Entity<unknown>): string {
    return item.id;
  }

  onMouseEnterRow(hoveredId: string) {
    this._boardStore.setHoveredId(hoveredId);
  }

  onMouseLeaveRow() {
    this._boardStore.setHoveredId(null);
  }
}

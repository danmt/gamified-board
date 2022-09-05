import { CommonModule } from '@angular/common';
import { Component, HostBinding, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { InstructionApplicationsListComponent } from '../../instruction-application/sections';
import { InstructionDocumentsListComponent } from '../../instruction-document/sections';
import { InstructionSignersListComponent } from '../../instruction-signer/sections';
import { InstructionSysvarsListComponent } from '../../instruction-sysvar/sections';
import { InstructionTasksListComponent } from '../../instruction-task/sections';
import { ActiveComponent } from '../../shared/components';
import {
  CursorScrollDirective,
  FollowCursorDirective,
  KeyboardListenerDirective,
} from '../../shared/directives';
import { BoardItemDropListsPipe } from '../../shared/pipes';
import { Entity, Option } from '../../shared/utils';
import { RowComponent } from '../components';
import { BoardStore } from '../stores';

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
        [pgIsHovered]="(hoveredId$ | ngrxPush) === instruction.id"
        (click)="onUseActive(instruction.id)"
        (mouseenter)="onMouseEnterRow(instruction.id)"
        (mouseleave)="onMouseLeaveRow()"
      >
        <p>Instruction: {{ instruction.name }}</p>

        <pg-instruction-applications-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'application'"
          [pgInstructionApplications]="instruction.applications"
        ></pg-instruction-applications-list>

        <pg-instruction-documents-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'document'"
          [pgInstructionDocuments]="instruction.documents"
        ></pg-instruction-documents-list>

        <pg-instruction-tasks-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'task'"
          [pgInstructionTasks]="instruction.tasks"
        ></pg-instruction-tasks-list>

        <pg-instruction-sysvars-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'sysvar'"
          [pgInstructionSysvars]="instruction.sysvars"
        ></pg-instruction-sysvars-list>

        <pg-instruction-signers-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'signer'"
          [pgInstructionSigners]="instruction.signers"
        ></pg-instruction-signers-list>
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
    CursorScrollDirective,
    BoardItemDropListsPipe,
    RowComponent,
    ActiveComponent,
    InstructionApplicationsListComponent,
    InstructionDocumentsListComponent,
    InstructionTasksListComponent,
    InstructionSysvarsListComponent,
    InstructionSignersListComponent,
  ],
})
export class BoardSectionComponent {
  private readonly _boardStore = inject(BoardStore);

  readonly instructions$ = this._boardStore.currentApplicationInstructions$;
  readonly active$ = this._boardStore.active$;
  readonly selected$ = this._boardStore.selected$;
  readonly hoveredId$ = this._boardStore.hoveredId$;

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';

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

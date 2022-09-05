import { CommonModule } from '@angular/common';
import { Component, HostBinding, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { InstructionApplicationsListComponent } from '../../instruction-application/sections';
import { InstructionDocumentsListComponent } from '../../instruction-document/sections';
import { InstructionSignersListComponent } from '../../instruction-signer/sections';
import { InstructionSysvarsListComponent } from '../../instruction-sysvar/sections';
import { InstructionTasksListComponent } from '../../instruction-task/sections';
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
        [id]="instruction.id"
        *ngFor="let instruction of instructions; trackBy: trackBy"
      >
        <p>Instruction: {{ instruction.name }}</p>

        <pg-instruction-applications-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'application'"
          [pgInstructionApplications]="instruction.applications"
          (pgSelect)="onSelect($event)"
        ></pg-instruction-applications-list>

        <pg-instruction-documents-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'document'"
          [pgInstructionDocuments]="instruction.documents"
          (pgSelect)="onSelect($event)"
        ></pg-instruction-documents-list>

        <pg-instruction-tasks-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'task'"
          [pgInstructionTasks]="instruction.tasks"
          (pgSelect)="onSelect($event)"
        ></pg-instruction-tasks-list>

        <pg-instruction-sysvars-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'sysvar'"
          [pgInstructionSysvars]="instruction.sysvars"
          (pgSelect)="onSelect($event)"
        ></pg-instruction-sysvars-list>

        <pg-instruction-signers-list
          [pgInstructionId]="instruction.id"
          [pgDropLists]="instructions | pgBoardItemDropLists: 'signer'"
          [pgInstructionSigners]="instruction.signers"
          (pgSelect)="onSelect($event)"
        ></pg-instruction-signers-list>
      </pg-row>
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

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';

  onSelect(
    selected: Option<{
      id: string;
      kind:
        | 'collection'
        | 'instruction'
        | 'application'
        | 'sysvar'
        | 'signer'
        | 'instructionDocument'
        | 'instructionTask'
        | 'instructionSigner'
        | 'instructionSysvar'
        | 'instructionApplication';
    }>
  ) {
    this._boardStore.setSelected(selected);
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
}

import { CommonModule } from '@angular/common';
import { Component, HostBinding, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { InstructionApplicationsListComponent } from '../../instruction-application/components';
import { ActiveInstructionApplicationComponent } from '../../instruction-application/sections';
import { ActiveInstructionArgumentComponent } from '../../instruction-argument/sections';
import { InstructionDocumentsListComponent } from '../../instruction-document/components';
import { ActiveInstructionDocumentComponent } from '../../instruction-document/sections';
import { InstructionSignersListComponent } from '../../instruction-signer/components';
import { ActiveInstructionSignerComponent } from '../../instruction-signer/sections';
import { InstructionSysvarsListComponent } from '../../instruction-sysvar/components';
import { ActiveInstructionSysvarComponent } from '../../instruction-sysvar/sections';
import { InstructionTasksListComponent } from '../../instruction-task/components';
import { InstructionsTasksReferencesDropListsIdsPipe } from '../../instruction-task/pipes';
import { InstructionTaskApiService } from '../../instruction-task/services';
import {
  CursorScrollDirective,
  FollowCursorDirective,
  KeyboardListenerDirective,
} from '../../shared/directives';
import { Entity, Option } from '../../shared/utils';

import { RowComponent } from '../components';
import { ActiveStore, BoardStore } from '../stores';
import { Brick } from '../utils';

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
        <div>
          <p>Instruction: {{ instruction.name }}</p>

          <div class="flex gap-2">
            <div
              *ngFor="let arg of instruction.arguments"
              class="px-2 py-1 border-2 border-gray-700"
              (click)="
                onActivate({
                  id: arg.id,
                  kind: 'instructionArgument',
                  instructionId: instruction.id
                })
              "
            >
              {{ arg.name }}: {{ arg.type }}
            </div>
          </div>
        </div>

        <div>
          <pg-instruction-applications-list
            [pgInstructionId]="instruction.id"
            [pgInstructionApplications]="instruction.applications"
            (pgSelect)="onSelect($event)"
            (pgActivate)="onActivate($event)"
          ></pg-instruction-applications-list>

          <pg-instruction-documents-list
            [pgInstructionId]="instruction.id"
            [pgInstructionDocuments]="instruction.documents"
            (pgSelect)="onSelect($event)"
            (pgActivate)="onActivate($event)"
          ></pg-instruction-documents-list>

          <pg-instruction-sysvars-list
            [pgInstructionId]="instruction.id"
            [pgInstructionSysvars]="instruction.sysvars"
            (pgSelect)="onSelect($event)"
            (pgActivate)="onActivate($event)"
          ></pg-instruction-sysvars-list>

          <pg-instruction-signers-list
            [pgInstructionId]="instruction.id"
            [pgInstructionSigners]="instruction.signers"
            (pgSelect)="onSelect($event)"
            (pgActivate)="onActivate($event)"
          ></pg-instruction-signers-list>
        </div>

        <pg-instruction-tasks-list
          [pgInstructionId]="instruction.id"
          [pgInstructionTasks]="instruction.tasks"
          [pgActive]="(active$ | ngrxPush) ?? null"
          (pgSelect)="onSelect($event)"
          (pgRemoveReference)="
            onRemoveReference(
              $event.instructionId,
              $event.taskId,
              $event.referenceId,
              $event.kind
            )
          "
        ></pg-instruction-tasks-list>
      </pg-row>

      <pg-active-instruction-document
        [pgDropLists]="
          instructions | pgInstructionsTasksReferencesDropListsIds: 'documents'
        "
      ></pg-active-instruction-document>

      <pg-active-instruction-application
        [pgDropLists]="
          instructions
            | pgInstructionsTasksReferencesDropListsIds: 'applications'
        "
      ></pg-active-instruction-application>

      <pg-active-instruction-signer
        [pgDropLists]="
          instructions | pgInstructionsTasksReferencesDropListsIds: 'signers'
        "
      ></pg-active-instruction-signer>

      <pg-active-instruction-sysvar
        [pgDropLists]="
          instructions | pgInstructionsTasksReferencesDropListsIds: 'sysvars'
        "
      ></pg-active-instruction-sysvar>

      <pg-active-instruction-argument
        [pgDropLists]="
          instructions | pgInstructionsTasksReferencesDropListsIds: 'arguments'
        "
      ></pg-active-instruction-argument>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    KeyboardListenerDirective,
    FollowCursorDirective,
    CursorScrollDirective,
    InstructionsTasksReferencesDropListsIdsPipe,
    RowComponent,
    InstructionApplicationsListComponent,
    InstructionDocumentsListComponent,
    InstructionTasksListComponent,
    InstructionSysvarsListComponent,
    InstructionSignersListComponent,
    ActiveInstructionDocumentComponent,
    ActiveInstructionApplicationComponent,
    ActiveInstructionSignerComponent,
    ActiveInstructionSysvarComponent,
    ActiveInstructionArgumentComponent,
  ],
})
export class BoardSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _activeStore = inject(ActiveStore);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  readonly active$ = this._activeStore.active$;
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

  onActivate(active: Option<Brick>) {
    this._activeStore.setActive(active);
  }

  onRemoveReference(
    instructionId: string,
    taskId: string,
    referenceId: string,
    kind: 'document' | 'signer' | 'sysvar' | 'application' | 'argument'
  ) {
    this._instructionTaskApiService
      .setTaskReference(instructionId, taskId, {
        id: referenceId,
        kind,
        ref: null,
      })
      .subscribe();
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape': {
        this._boardStore.closeActiveOrSelected();
        this._activeStore.setActive(null);

        break;
      }
    }
  }

  trackBy(_: number, item: Entity): string {
    return item.id;
  }
}

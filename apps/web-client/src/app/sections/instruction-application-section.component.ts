import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject, ViewContainerRef } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map } from 'rxjs';
import {
  EditInstructionApplicationData,
  EditInstructionApplicationModalComponent,
} from '../modals';
import { InstructionApplicationApiService } from '../services';
import { BoardStore, InstructionApplicationView } from '../stores';

@Component({
  selector: 'pg-instruction-application-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.application?.thumbnailUrl" />

      {{ selected?.name }}

      <button
        (click)="
          onUpdateInstructionApplication(
            selected.ownerId,
            selected.id,
            selected
          )
        "
      >
        edit
      </button>

      <button
        (click)="onDeleteInstructionApplication(selected.ownerId, selected.id)"
      >
        x
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule],
})
export class InstructionApplicationSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _instructionApplicationApiService = inject(
    InstructionApplicationApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'instructionApplication') {
        return null;
      }

      return selected;
    })
  );

  onUpdateInstructionApplication(
    instructionId: string,
    applicationId: string,
    application: InstructionApplicationView
  ) {
    this._dialog
      .open<
        EditInstructionApplicationData,
        EditInstructionApplicationData,
        EditInstructionApplicationModalComponent
      >(EditInstructionApplicationModalComponent, {
        data: application,
      })
      .closed.pipe(
        concatMap((applicationData) => {
          if (applicationData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActive(null);

          return this._instructionApplicationApiService.updateInstructionApplication(
            instructionId,
            applicationId,
            applicationData.name
          );
        })
      )
      .subscribe();
  }

  onDeleteInstructionApplication(instructionId: string, applicationId: string) {
    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionApplicationApiService
        .deleteInstructionApplication(instructionId, applicationId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }
  }
}

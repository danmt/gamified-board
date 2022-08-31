import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject, ViewContainerRef } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map } from 'rxjs';
import {
  EditInstructionSysvarData,
  EditInstructionSysvarModalComponent,
} from '../modals';
import { InstructionSysvarApiService } from '../services';
import { BoardStore, InstructionSysvarView } from '../stores';

@Component({
  selector: 'pg-instruction-sysvar-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.sysvar?.thumbnailUrl" />

      {{ selected?.name }}

      <button
        (click)="
          onUpdateInstructionSysvar(selected.ownerId, selected.id, selected)
        "
      >
        edit
      </button>

      <button
        (click)="onDeleteInstructionSysvar(selected.ownerId, selected.id)"
      >
        x
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule],
})
export class InstructionSysvarSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _instructionSysvarApiService = inject(
    InstructionSysvarApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'instructionSysvar') {
        return null;
      }

      return selected;
    })
  );

  onUpdateInstructionSysvar(
    instructionId: string,
    sysvarId: string,
    sysvar: InstructionSysvarView
  ) {
    this._dialog
      .open<
        EditInstructionSysvarData,
        EditInstructionSysvarData,
        EditInstructionSysvarModalComponent
      >(EditInstructionSysvarModalComponent, {
        data: sysvar,
        viewContainerRef: this._viewContainerRef,
      })
      .closed.pipe(
        concatMap((sysvarData) => {
          if (sysvarData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActive(null);

          return this._instructionSysvarApiService.updateInstructionSysvar(
            instructionId,
            sysvarId,
            sysvarData.name
          );
        })
      )
      .subscribe();
  }

  onDeleteInstructionSysvar(instructionId: string, sysvarId: string) {
    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionSysvarApiService
        .deleteInstructionSysvar(instructionId, sysvarId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }
  }
}

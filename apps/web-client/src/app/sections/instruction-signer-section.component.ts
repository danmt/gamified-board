import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject, ViewContainerRef } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map } from 'rxjs';
import {
  EditInstructionSignerData,
  EditInstructionSignerModalComponent,
} from '../modals';
import { InstructionSignerApiService } from '../services';
import { BoardStore, InstructionSignerView } from '../stores';

@Component({
  selector: 'pg-instruction-signer-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="'asd'" />

      {{ selected?.name }}

      <button
        (click)="
          onUpdateInstructionSigner(selected.ownerId, selected.id, selected)
        "
      >
        edit
      </button>

      <button
        (click)="onDeleteInstructionSigner(selected.ownerId, selected.id)"
      >
        x
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule],
})
export class InstructionSignerSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _instructionSignerApiService = inject(
    InstructionSignerApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'instructionSigner') {
        return null;
      }

      return selected;
    })
  );

  onUpdateInstructionSigner(
    instructionId: string,
    signerId: string,
    signer: InstructionSignerView
  ) {
    this._dialog
      .open<
        EditInstructionSignerData,
        EditInstructionSignerData,
        EditInstructionSignerModalComponent
      >(EditInstructionSignerModalComponent, {
        data: signer,
        viewContainerRef: this._viewContainerRef,
      })
      .closed.pipe(
        concatMap((signerData) => {
          if (signerData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActive(null);

          return this._instructionSignerApiService.updateInstructionSigner(
            instructionId,
            signerId,
            signerData.name
          );
        })
      )
      .subscribe();
  }

  onDeleteInstructionSigner(instructionId: string, signerId: string) {
    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionSignerApiService
        .deleteInstructionSigner(instructionId, signerId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }
  }
}

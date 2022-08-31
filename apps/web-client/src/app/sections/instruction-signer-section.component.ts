import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { map } from 'rxjs';
import { SquareButtonComponent } from '../components';
import {
  EditInstructionSignerModalDirective,
  EditInstructionSignerSubmitPayload,
} from '../modals';
import { InstructionSignerApiService } from '../services';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-instruction-signer-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img src="assets/generic/signer.png" />

      {{ selected?.name }}

      <div class="bg-gray-800 relative" style="width: 2.89rem; height: 2.89rem">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          q
        </span>

        <pg-square-button
          [pgIsActive]="isEditing"
          pgThumbnailUrl="assets/generic/signer.png"
          pgEditInstructionSignerModal
          [pgInstructionSigner]="selected"
          (pgOpenModal)="isEditing = true"
          (pgCloseModal)="isEditing = false"
          (pgUpdateInstructionSigner)="
            onUpdateInstructionSigner(selected.ownerId, selected.id, $event)
          "
        ></pg-square-button>
      </div>

      <div class="bg-gray-800 relative" style="width: 2.89rem; height: 2.89rem">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          w
        </span>

        <pg-square-button
          [pgIsActive]="false"
          pgThumbnailUrl="assets/generic/signer.png"
          (click)="onDeleteInstructionSigner(selected.ownerId, selected.id)"
        ></pg-square-button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    EditInstructionSignerModalDirective,
  ],
})
export class InstructionSignerSectionComponent {
  private readonly _boardStore = inject(BoardStore);
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

  isEditing = false;
  isDeleting = false;

  onUpdateInstructionSigner(
    instructionId: string,
    instructionSignerId: string,
    instructionSignerData: EditInstructionSignerSubmitPayload
  ) {
    this._instructionSignerApiService
      .updateInstructionSigner(
        instructionId,
        instructionSignerId,
        instructionSignerData.name
      )
      .subscribe();
  }

  onDeleteInstructionSigner(instructionId: string, signerId: string) {
    this.isDeleting = true;

    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionSignerApiService
        .deleteInstructionSigner(instructionId, signerId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }

    this.isDeleting = false;
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { map } from 'rxjs';
import { SquareButtonComponent } from '../components';
import {
  EditInstructionApplicationModalDirective,
  EditInstructionApplicationSubmitPayload,
} from '../modals';
import { InstructionApplicationApiService } from '../services';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-instruction-application-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.application?.thumbnailUrl" />

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
          pgEditInstructionApplicationModal
          [pgInstructionApplication]="selected"
          (pgOpenModal)="isEditing = true"
          (pgCloseModal)="isEditing = false"
          (pgUpdateInstructionApplication)="
            onUpdateInstructionApplication(
              selected.ownerId,
              selected.id,
              $event
            )
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
          (click)="
            onDeleteInstructionApplication(selected.ownerId, selected.id)
          "
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
    EditInstructionApplicationModalDirective,
  ],
})
export class InstructionApplicationSectionComponent {
  private readonly _boardStore = inject(BoardStore);
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

  isEditing = false;
  isDeleting = false;

  onUpdateInstructionApplication(
    instructionId: string,
    instructionApplicationId: string,
    instructionApplicationData: EditInstructionApplicationSubmitPayload
  ) {
    this._instructionApplicationApiService
      .updateInstructionApplication(
        instructionId,
        instructionApplicationId,
        instructionApplicationData.name
      )
      .subscribe();
  }

  onDeleteInstructionApplication(instructionId: string, applicationId: string) {
    this.isDeleting = true;

    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionApplicationApiService
        .deleteInstructionApplication(instructionId, applicationId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }

    this.isDeleting = false;
  }
}

import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map } from 'rxjs';
import { EditInstructionData, EditInstructionModalComponent } from '../modals';
import { InstructionApiService } from '../services';
import { BoardStore, InstructionView } from '../stores';

@Component({
  selector: 'pg-instruction-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.thumbnailUrl" />

      {{ selected?.name }}

      <button
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.applicationId"
        (click)="onUpdateInstruction(selected.id, selected)"
      >
        edit
      </button>

      <button
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.applicationId"
        (click)="onDeleteInstruction(selected.id)"
      >
        x
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule],
})
export class InstructionSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionApiService = inject(InstructionApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || !('arguments' in selected)) {
        return null;
      }

      return selected;
    })
  );

  onUpdateInstruction(instructionId: string, instruction: InstructionView) {
    this._dialog
      .open<
        EditInstructionData,
        EditInstructionData,
        EditInstructionModalComponent
      >(EditInstructionModalComponent, {
        data: instruction,
      })
      .closed.pipe(
        concatMap((instructionData) => {
          if (instructionData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveId(null);

          return this._instructionApiService.updateInstruction(
            instructionId,
            instructionData.name,
            instructionData.thumbnailUrl,
            instructionData.arguments
          );
        })
      )
      .subscribe();
  }

  onDeleteInstruction(instructionId: string) {
    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionApiService
        .deleteInstruction(instructionId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }
  }
}

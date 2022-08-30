import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject, ViewContainerRef } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map } from 'rxjs';
import {
  EditDocumentData,
  EditDocumentModalComponent,
  EditDocumentSubmitPayload,
} from '../modals';
import { InstructionDocumentApiService } from '../services';
import { BoardStore, InstructionDocumentView } from '../stores';

@Component({
  selector: 'pg-instruction-document-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.collection?.thumbnailUrl" />

      {{ selected?.name }}

      <button
        (click)="
          onUpdateInstructionDocument(selected.ownerId, selected.id, selected)
        "
      >
        edit
      </button>

      <button
        (click)="onDeleteInstructionDocument(selected.ownerId, selected.id)"
      >
        x
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule],
})
export class InstructionDocumentSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || !('collection' in selected)) {
        return null;
      }

      return selected;
    })
  );

  onUpdateInstructionDocument(
    instructionId: string,
    documentId: string,
    document: InstructionDocumentView
  ) {
    this._dialog
      .open<
        EditDocumentSubmitPayload,
        EditDocumentData,
        EditDocumentModalComponent
      >(EditDocumentModalComponent, {
        data: { document, instructionId },
        viewContainerRef: this._viewContainerRef,
      })
      .closed.pipe(
        concatMap((documentData) => {
          if (documentData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveId(null);

          return this._instructionDocumentApiService.updateInstructionDocument(
            instructionId,
            documentId,
            documentData.name,
            documentData.method,
            documentData.seeds,
            documentData.bump,
            documentData.payer
          );
        })
      )
      .subscribe();
  }

  onDeleteInstructionDocument(instructionId: string, documentId: string) {
    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionDocumentApiService
        .deleteInstructionDocument(instructionId, documentId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, map } from 'rxjs';
import { SquareButtonComponent } from '../components';
import {
  EditInstructionDocumentModalDirective,
  EditInstructionDocumentSubmitPayload,
} from '../modals';
import { InstructionDocumentApiService } from '../services';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-instruction-document-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.collection?.thumbnailUrl" />

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
          pgEditInstructionDocumentModal
          [pgInstructionDocument]="selected"
          [pgArgumentReferences$]="argumentReferences$"
          [pgAttributeReferences$]="attributeReferences$"
          [pgBumpReferences$]="bumpReferences$"
          (pgOpenModal)="isEditing = true"
          (pgCloseModal)="isEditing = false"
          (pgUpdateInstructionDocument)="
            onUpdateInstructionDocument(selected.ownerId, selected.id, $event)
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
          (click)="onDeleteInstructionDocument(selected.ownerId, selected.id)"
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
    EditInstructionDocumentModalDirective,
  ],
})
export class InstructionDocumentSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'instructionDocument') {
        return null;
      }

      return selected;
    })
  );
  readonly argumentReferences$ = combineLatest([
    this._boardStore.currentApplicationInstructions$,
    this.selected$,
  ]).pipe(
    map(([instructions, instructionDocument]) => {
      const instruction =
        instructions?.find(({ id }) => id === instructionDocument?.ownerId) ??
        null;

      if (instruction === null) {
        return [];
      }

      return instruction.arguments.map((argument) => ({
        kind: 'argument' as const,
        argument,
      }));
    })
  );
  readonly attributeReferences$ = combineLatest([
    this._boardStore.currentApplicationInstructions$,
    this.selected$,
  ]).pipe(
    map(([instructions, instructionDocument]) => {
      const instruction =
        instructions?.find(({ id }) => id === instructionDocument?.ownerId) ??
        null;

      if (instruction === null) {
        return [];
      }

      return instruction.documents.reduce<
        {
          kind: 'document';
          attribute: {
            id: string;
            name: string;
            type: string;
          };
          document: {
            id: string;
            name: string;
          };
        }[]
      >(
        (attributes, document) =>
          attributes.concat(
            document.collection.attributes.map((attribute) => ({
              kind: 'document' as const,
              attribute: {
                id: attribute.id,
                name: attribute.name,
                type: attribute.type,
              },
              document: {
                id: document.id,
                name: document.name,
              },
            }))
          ),
        []
      );
    })
  );
  readonly bumpReferences$ = combineLatest([
    this.argumentReferences$,
    this.attributeReferences$,
  ]).pipe(
    map(([argumentReferences, attributeReferences]) => [
      ...(argumentReferences?.filter(
        (argumentReference) => argumentReference.argument.type === 'u8'
      ) ?? []),
      ...(attributeReferences?.filter(
        (attributeReference) => attributeReference.attribute.type === 'u8'
      ) ?? []),
    ])
  );

  isEditing = false;
  isDeleting = false;

  onUpdateInstructionDocument(
    instructionId: string,
    instructionDocumentId: string,
    instructionDocumentData: EditInstructionDocumentSubmitPayload
  ) {
    this._instructionDocumentApiService
      .updateInstructionDocument(
        instructionId,
        instructionDocumentId,
        instructionDocumentData.name,
        instructionDocumentData.method,
        instructionDocumentData.seeds,
        instructionDocumentData.bump,
        instructionDocumentData.payer
      )
      .subscribe();
  }

  onDeleteInstructionDocument(instructionId: string, documentId: string) {
    this.isDeleting = true;

    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._instructionDocumentApiService
        .deleteInstructionDocument(instructionId, documentId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }

    this.isDeleting = false;
  }
}

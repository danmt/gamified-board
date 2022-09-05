import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore, InstructionDocumentView } from '../../core/stores';
import {
  ConfirmModalDirective,
  openConfirmModal,
  SquareButtonComponent,
} from '../../shared/components';
import {
  DefaultImageDirective,
  KeyboardListenerDirective,
} from '../../shared/directives';
import { SlotHotkeyPipe } from '../../shared/pipes';
import { isNotNull, isNull } from '../../shared/utils';
import {
  EditInstructionDocumentModalDirective,
  EditInstructionDocumentSubmit,
  openEditInstructionDocumentModal,
} from '../components';
import { InstructionDocumentApiService } from '../services';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-instruction-document-dock',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <div
        *ngIf="selected$ | ngrxPush as selected"
        class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <img
          [src]="selected?.collection?.thumbnailUrl"
          pgDefaultImage="assets/generic/instruction-document.png"
        />

        {{ selected?.name }}

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
        >
          <span
            *ngIf="0 | pgSlotHotkey: hotkeys as hotkey"
            class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
            style="font-size: 0.5rem; line-height: 0.5rem"
          >
            {{ hotkey }}
          </span>

          <pg-square-button
            [pgIsActive]="isEditing"
            pgThumbnailUrl="assets/generic/instruction-document.png"
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

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
        >
          <span
            *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
            class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
            style="font-size: 0.5rem; line-height: 0.5rem"
          >
            {{ hotkey }}
          </span>

          <pg-square-button
            [pgIsActive]="isDeleting"
            pgThumbnailUrl="assets/generic/instruction-document.png"
            pgConfirmModal
            pgMessage="Are you sure? This action cannot be reverted."
            (pgConfirm)="
              onDeleteInstructionDocument(selected.ownerId, selected.id)
            "
            (pgOpenModal)="isDeleting = true"
            (pgCloseModal)="isDeleting = false"
          ></pg-square-button>
        </div>
      </div>
    </ng-container>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
    EditInstructionDocumentModalDirective,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
  ],
})
export class InstructionDocumentDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );

  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (isNull(selected) || selected.kind !== 'instructionDocument') {
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

      if (isNull(instruction)) {
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

      if (isNull(instruction)) {
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
  readonly hotkeys$ = of([
    {
      slot: 0,
      code: 'KeyQ',
      key: 'q',
    },
    {
      slot: 1,
      code: 'KeyW',
      key: 'w',
    },
  ]);

  isEditing = false;
  isDeleting = false;

  onUpdateInstructionDocument(
    instructionId: string,
    instructionDocumentId: string,
    instructionDocumentData: EditInstructionDocumentSubmit
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
    this._instructionDocumentApiService
      .deleteInstructionDocument(instructionId, documentId)
      .subscribe(() => this._boardStore.setSelectedId(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    instructionDocument: InstructionDocumentView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditInstructionDocumentModal(this._dialog, {
            instructionDocument,
            argumentReferences$: this.argumentReferences$,
            attributeReferences$: this.attributeReferences$,
            bumpReferences$: this.bumpReferences$,
          })
            .closed.pipe(
              concatMap((instructionDocumentData) => {
                this.isEditing = false;

                if (instructionDocumentData === undefined) {
                  return EMPTY;
                }

                return this._instructionDocumentApiService.updateInstructionDocument(
                  instructionDocument.ownerId,
                  instructionDocument.id,
                  instructionDocumentData.name,
                  instructionDocumentData.method,
                  instructionDocumentData.seeds,
                  instructionDocumentData.bump,
                  instructionDocumentData.payer
                );
              })
            )
            .subscribe();

          break;
        }

        case 1: {
          this.isDeleting = true;

          openConfirmModal(this._dialog, {
            message: 'Are you sure? This action cannot be reverted.',
          })
            .closed.pipe(
              concatMap((confirmData) => {
                this.isDeleting = false;

                if (confirmData === undefined || !confirmData) {
                  return EMPTY;
                }

                return this._instructionDocumentApiService
                  .deleteInstructionDocument(
                    instructionDocument.ownerId,
                    instructionDocument.id
                  )
                  .pipe(tap(() => this._boardStore.setSelectedId(null)));
              })
            )
            .subscribe();

          break;
        }

        default: {
          break;
        }
      }
    }
  }
}

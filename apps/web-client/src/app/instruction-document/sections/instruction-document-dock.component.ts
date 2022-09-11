import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { BoardStore, InstructionDocumentView } from '../../board';
import {
  ConfirmModalDirective,
  DefaultImageDirective,
  isNotNull,
  isNull,
  KeyboardListenerDirective,
  openConfirmModal,
  SlotHotkeyPipe,
  SquareButtonComponent,
} from '../../shared';
import { SecondaryDockComponent } from '../../shared/components/secondary-dock.component';
import {
  EditInstructionDocumentSeedsSubmit,
  EditInstructionDocumentSubmit,
  openEditInstructionDocumentModal,
  openEditInstructionDocumentSeedsModal,
  UpdateInstructionDocumentModalDirective,
  UpdateInstructionDocumentSeedsModalDirective,
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
      <pg-secondary-dock
        *ngIf="selected$ | ngrxPush as selected"
        class="text-white block bp-font-game"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <div class="flex gap-4 justify-center items-start">
          <img
            [src]="selected?.collection?.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-document.png"
            class="w-[140px]"
          />

          <div>
            <h2 class="text-xl">Name</h2>
            <p class="text-base">{{ selected?.name }}</p>
            <h2 class="text-xl">Kind</h2>
            <p class="text-base">{{ selected?.kind }}</p>
          </div>

          <div>
            <h2 class="text-xl">Actions</h2>
            <div class="flex gap-4 justify-center items-start">
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
                  [pgIsActive]="isUpdating"
                  pgThumbnailUrl="assets/generic/instruction-document.png"
                  pgUpdateInstructionDocumentModal
                  [pgInstructionDocument]="selected"
                  [pgDocumentReferences$]="references$"
                  (pgOpenModal)="isUpdating = true"
                  (pgCloseModal)="isUpdating = false"
                  (pgUpdateInstructionDocument)="
                    onUpdateInstructionDocument(
                      selected.ownerId,
                      selected.id,
                      $event
                    )
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

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <span
                  *ngIf="2 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                >
                  {{ hotkey }}
                </span>

                <pg-square-button
                  [pgIsActive]="isUpdatingSeeds"
                  pgThumbnailUrl="assets/generic/instruction-document.png"
                  pgUpdateInstructionDocumentSeedsModal
                  [pgInstructionDocumentSeeds]="selected"
                  [pgArgumentReferences$]="argumentReferences$"
                  [pgAttributeReferences$]="attributeReferences$"
                  [pgBumpReferences$]="bumpReferences$"
                  (pgOpenModal)="isUpdatingSeeds = true"
                  (pgCloseModal)="isUpdatingSeeds = false"
                  (pgUpdateInstructionDocumentSeeds)="
                    onUpdateInstructionDocumentSeeds(
                      selected.ownerId,
                      selected.id,
                      $event
                    )
                  "
                ></pg-square-button>
              </div>
            </div>
          </div>
        </div>
      </pg-secondary-dock>
    </ng-container>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
    UpdateInstructionDocumentModalDirective,
    UpdateInstructionDocumentSeedsModalDirective,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
    SecondaryDockComponent,
  ],
})
export class InstructionDocumentDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );

  readonly selected$ = combineLatest([
    this._boardStore.instructions$,
    this._boardStore.selected$,
  ]).pipe(
    map(([instructions, selected]) => {
      if (
        isNull(instructions) ||
        isNull(selected) ||
        selected.kind !== 'instructionDocument'
      ) {
        return null;
      }

      return (
        instructions
          .reduce<InstructionDocumentView[]>(
            (instructionDocuments, instruction) =>
              instructionDocuments.concat(instruction.documents),
            []
          )
          .find(({ id }) => id === selected.id) ?? null
      );
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
        id: argument.id,
        name: argument.name,
        type: argument.type,
      }));
    })
  );
  readonly references$ = combineLatest([
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

      return [
        ...instruction.documents.map((document) => ({
          kind: 'document' as const,
          id: document.id,
          name: document.name,
        })),
        ...instruction.signers.map((signer) => ({
          kind: 'signer' as const,
          id: signer.id,
          name: signer.name,
        })),
      ];
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
          kind: 'attribute';
          id: string;
          name: string;
          type: string;
          document: {
            id: string;
            name: string;
          };
        }[]
      >(
        (attributes, document) =>
          attributes.concat(
            document.collection.attributes.map((attribute) => ({
              kind: 'attribute' as const,
              id: attribute.id,
              name: attribute.name,
              type: attribute.type,
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
        (argumentReference) => argumentReference.type === 'u8'
      ) ?? []),
      ...(attributeReferences?.filter(
        (attributeReference) => attributeReference.type === 'u8'
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
    {
      slot: 2,
      code: 'KeyE',
      key: 'e',
    },
  ]);

  isUpdating = false;
  isDeleting = false;
  isUpdatingSeeds = false;

  onUpdateInstructionDocument(
    instructionId: string,
    instructionDocumentId: string,
    instructionDocumentData: EditInstructionDocumentSubmit
  ) {
    this._instructionDocumentApiService
      .updateInstructionDocument(instructionId, instructionDocumentId, {
        name: instructionDocumentData.name,
        method: instructionDocumentData.method,
        payer: instructionDocumentData.payer,
      })
      .subscribe();
  }

  onUpdateInstructionDocumentSeeds(
    instructionId: string,
    instructionDocumentId: string,
    instructionDocumentSeedsData: EditInstructionDocumentSeedsSubmit
  ) {
    this._instructionDocumentApiService
      .updateInstructionDocument(instructionId, instructionDocumentId, {
        seeds: instructionDocumentSeedsData.seeds,
        bump: instructionDocumentSeedsData.bump,
      })
      .subscribe();
  }

  onDeleteInstructionDocument(instructionId: string, documentId: string) {
    this._instructionDocumentApiService
      .deleteInstructionDocument(instructionId, documentId)
      .subscribe(() => this._boardStore.setSelected(null));
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
          this.isUpdating = true;

          openEditInstructionDocumentModal(this._dialog, {
            instructionDocument,
            references$: this.references$,
          })
            .closed.pipe(
              concatMap((instructionDocumentData) => {
                this.isUpdating = false;

                if (instructionDocumentData === undefined) {
                  return EMPTY;
                }

                return this._instructionDocumentApiService.updateInstructionDocument(
                  instructionDocument.ownerId,
                  instructionDocument.id,
                  {
                    name: instructionDocumentData.name,
                    method: instructionDocumentData.method,
                    payer: instructionDocumentData.payer,
                  }
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
                  .pipe(tap(() => this._boardStore.setSelected(null)));
              })
            )
            .subscribe();

          break;
        }

        case 2: {
          this.isUpdatingSeeds = true;

          openEditInstructionDocumentSeedsModal(this._dialog, {
            instructionDocumentSeeds: instructionDocument,
            argumentReferences$: this.argumentReferences$,
            attributeReferences$: this.attributeReferences$,
            bumpReferences$: this.bumpReferences$,
          })
            .closed.pipe(
              concatMap((instructionDocumentSeedsData) => {
                this.isUpdatingSeeds = false;

                if (instructionDocumentSeedsData === undefined) {
                  return EMPTY;
                }

                return this._instructionDocumentApiService.updateInstructionDocument(
                  instructionDocument.ownerId,
                  instructionDocument.id,
                  {
                    seeds: instructionDocumentSeedsData.seeds,
                    bump: instructionDocumentSeedsData.bump,
                  }
                );
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

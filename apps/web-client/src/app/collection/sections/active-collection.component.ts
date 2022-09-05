import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, filter, map, take } from 'rxjs';
import { BoardStore } from '../../core/stores';
import { openEditInstructionDocumentModal } from '../../instruction-document/components';
import { InstructionDocumentApiService } from '../../instruction-document/services';
import { ActiveComponent } from '../../shared/components';
import { FollowCursorDirective } from '../../shared/directives';
import {
  getFirstParentId,
  isChildOf,
  isNotNull,
  isNull,
} from '../../shared/utils';

@Component({
  selector: 'pg-active-collection',
  template: `
    <pg-active
      *ngIf="activeCollection$ | ngrxPush as collection"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [pgActive]="collection"
      [pgCanAdd]="canAdd"
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveCollectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );
  private readonly _dialog = inject(Dialog);

  readonly activeCollection$ = combineLatest([
    this._boardStore.collections$,
    this._boardStore.active$,
  ]).pipe(
    map(([collections, active]) => {
      if (
        isNull(collections) ||
        isNull(active) ||
        active.kind !== 'collection'
      ) {
        return null;
      }

      return (
        collections.find((collection) => collection.id === active.id) ?? null
      );
    })
  );

  canAdd = false;

  @HostListener('window:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    const isChildOfRow = isChildOf(event.target as HTMLElement, (element) =>
      element.matches('pg-row')
    );

    if (isChildOfRow && !this.canAdd) {
      this.canAdd = true;
    } else if (!isChildOfRow && this.canAdd) {
      this.canAdd = false;
    }
  }

  @HostListener('window:click', ['$event']) onClick(event: MouseEvent) {
    const instructionId = getFirstParentId(
      event.target as HTMLElement,
      (element) => element.matches('pg-row')
    );

    if (instructionId !== null) {
      this._useCollection(instructionId);
    }
  }

  private _useCollection(instructionId: string) {
    const argumentReferences$ =
      this._boardStore.currentApplicationInstructions$.pipe(
        map((instructions) => {
          const instruction =
            instructions?.find(({ id }) => id === instructionId) ?? null;

          if (isNull(instruction)) {
            return [];
          }

          return instruction.arguments.map((argument) => ({
            kind: 'argument' as const,
            argument,
          }));
        })
      );
    const attributeReferences$ =
      this._boardStore.currentApplicationInstructions$.pipe(
        map((instructions) => {
          const instruction =
            instructions?.find(({ id }) => id === instructionId) ?? null;

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
    const bumpReferences$ = combineLatest([
      argumentReferences$,
      attributeReferences$,
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

    this.activeCollection$
      .pipe(
        take(1),
        filter(isNotNull),
        concatMap((activeCollection) =>
          openEditInstructionDocumentModal(this._dialog, {
            instructionDocument: null,
            argumentReferences$,
            attributeReferences$,
            bumpReferences$,
          }).closed.pipe(
            concatMap((documentData) => {
              if (documentData === undefined) {
                return EMPTY;
              }

              return this._instructionDocumentApiService.createInstructionDocument(
                instructionId,
                documentData.id,
                documentData.name,
                documentData.method,
                activeCollection.id,
                documentData.seeds,
                documentData.bump,
                documentData.payer
              );
            })
          )
        )
      )
      .subscribe();
  }
}

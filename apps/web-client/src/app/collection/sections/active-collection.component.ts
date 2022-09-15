import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, filter, map, take } from 'rxjs';
import { BoardStore } from '../../board/stores';
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
    const references$ = this._boardStore.currentApplicationInstructions$.pipe(
      map((instructions) => {
        const instruction =
          instructions?.find(({ id }) => id === instructionId) ?? null;

        if (isNull(instruction)) {
          return [];
        }

        return instruction.documents.map((document) => ({
          kind: 'document' as const,
          id: document.id,
          name: document.name,
        }));
      })
    );

    this.activeCollection$
      .pipe(
        take(1),
        filter(isNotNull),
        concatMap((activeCollection) =>
          openEditInstructionDocumentModal(this._dialog, {
            instructionDocument: null,
            references$,
          }).closed.pipe(
            concatMap((documentData) => {
              if (documentData === undefined) {
                return EMPTY;
              }

              return this._instructionDocumentApiService.createInstructionDocument(
                instructionId,
                {
                  id: documentData.id,
                  name: documentData.name,
                  method: documentData.method,
                  collectionId: activeCollection.id,
                  payer: documentData.payer,
                }
              );
            })
          )
        )
      )
      .subscribe();
  }
}

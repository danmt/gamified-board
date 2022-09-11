import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, Input } from '@angular/core';
import { PushModule } from '@ngrx/component';
import {
  BehaviorSubject,
  combineLatest,
  concatMap,
  filter,
  map,
  take,
} from 'rxjs';
import { ActiveStore, BoardStore } from '../../core';
import { InstructionTaskApiService } from '../../instruction-task';
import {
  ActiveComponent,
  FollowCursorDirective,
  getFirstParentId,
  isNotNull,
  isNull,
  Option,
} from '../../shared';

@Component({
  selector: 'pg-active-instruction-document',
  template: `
    <pg-active
      *ngIf="activeInstructionDocument$ | ngrxPush as instructionDocument"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [pgActive]="{
        thumbnailUrl: instructionDocument.collection.thumbnailUrl
      }"
      [pgCanAdd]="(canAdd$ | ngrxPush) ?? false"
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveInstructionDocumentComponent {
  private readonly _activeStore = inject(ActiveStore);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  private readonly _mouseOverDropList = new BehaviorSubject<Option<string>>(
    null
  );

  readonly activeInstructionDocument$ = combineLatest([
    this._boardStore.instructions$,
    this._activeStore.active$,
  ]).pipe(
    map(([instructions, active]) => {
      if (
        isNull(instructions) ||
        isNull(active) ||
        active.kind !== 'instructionDocument'
      ) {
        return null;
      }

      const instruction =
        instructions.find(({ id }) => id === active.instructionId) ?? null;

      if (isNull(instruction)) {
        return null;
      }

      return (
        instruction.documents.find(
          (instructionDocument) => instructionDocument.id === active.id
        ) ?? null
      );
    })
  );
  readonly canAdd$ = combineLatest([
    this.activeInstructionDocument$,
    this._mouseOverDropList.asObservable(),
  ]).pipe(
    map(([activeInstructionDocument, dropListId]) => {
      if (isNull(activeInstructionDocument) || isNull(dropListId)) {
        return false;
      }

      const [instructionId] = dropListId.split('/');

      return activeInstructionDocument.ownerId === instructionId;
    })
  );

  @Input() pgDropLists: string[] = [];

  @HostListener('window:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    this._mouseOverDropList.next(
      getFirstParentId(event.target as HTMLElement, (element) =>
        this.pgDropLists?.some((dropList) => element.id === dropList)
      )
    );
  }

  @HostListener('window:click', ['$event']) onClick(event: MouseEvent) {
    const dropListElement = getFirstParentId(
      event.target as HTMLElement,
      (element) => this.pgDropLists?.some((dropList) => element.id === dropList)
    );

    if (isNotNull(dropListElement)) {
      const [instructionId, taskId, referenceId] = dropListElement.split('/');
      this._useInstructionDocument(instructionId, taskId, referenceId);
    }
  }

  private _useInstructionDocument(
    instructionId: string,
    taskId: string,
    referenceId: string
  ) {
    this.activeInstructionDocument$
      .pipe(
        take(1),
        filter(isNotNull),
        concatMap(({ id }) => {
          this._activeStore.setActive(null);

          return this._instructionTaskApiService.setTaskReference(
            instructionId,
            taskId,
            {
              id: referenceId,
              kind: 'document',
              ref: id,
            }
          );
        })
      )
      .subscribe();
  }
}

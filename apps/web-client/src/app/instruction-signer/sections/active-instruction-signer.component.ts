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
import { ActiveStore, BoardStore } from '../../board';
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
  selector: 'pg-active-instruction-signer',
  template: `
    <pg-active
      *ngIf="activeInstructionSigner$ | ngrxPush as instructionSigner"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [pgActive]="{
        thumbnailUrl: 'assets/generic/signer.png'
      }"
      [pgCanAdd]="(canAdd$ | ngrxPush) ?? false"
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveInstructionSignerComponent {
  private readonly _activeStore = inject(ActiveStore);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  private readonly _mouseOverDropList = new BehaviorSubject<Option<string>>(
    null
  );

  readonly activeInstructionSigner$ = combineLatest([
    this._boardStore.instructions$,
    this._activeStore.active$,
  ]).pipe(
    map(([instructions, active]) => {
      if (
        isNull(instructions) ||
        isNull(active) ||
        active.kind !== 'instructionSigner'
      ) {
        return null;
      }

      const instruction =
        instructions.find(({ id }) => id === active.instructionId) ?? null;

      if (isNull(instruction)) {
        return null;
      }

      return (
        instruction.signers.find(
          (instructionSigner) => instructionSigner.id === active.id
        ) ?? null
      );
    })
  );
  readonly canAdd$ = combineLatest([
    this.activeInstructionSigner$,
    this._mouseOverDropList.asObservable(),
  ]).pipe(
    map(([activeInstructionSigner, dropListId]) => {
      if (isNull(activeInstructionSigner) || isNull(dropListId)) {
        return false;
      }

      const [instructionId] = dropListId.split('/');

      return activeInstructionSigner.ownerId === instructionId;
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
      this._useInstructionSigner(instructionId, taskId, referenceId);
    }
  }

  private _useInstructionSigner(
    instructionId: string,
    taskId: string,
    referenceId: string
  ) {
    this.activeInstructionSigner$
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
              kind: 'signer',
              ref: id,
            }
          );
        })
      )
      .subscribe();
  }
}

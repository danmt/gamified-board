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
  selector: 'pg-active-instruction-argument',
  template: `
    <div
      *ngIf="activeInstructionArgument$ | ngrxPush as instructionArgument"
      class="fixed z-10 pointer-events-none "
      pgFollowCursor
    >
      <div
        class="inline-block relative rounded-md shadow-2xl p-4"
        [ngClass]="{
          'bg-green-500': canAdd$ | ngrxPush,
          'bg-red-500': !(canAdd$ | ngrxPush)
        }"
      >
        {{ instructionArgument.name }}:
        {{ instructionArgument.type }}
        <span
          *ngIf="canAdd$ | ngrxPush"
          class="text-white absolute bottom-1 right-1 leading-none"
          >+</span
        >

        <span
          *ngIf="!(canAdd$ | ngrxPush)"
          class="text-white absolute bottom-1 right-1  leading-none"
          >x</span
        >
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveInstructionArgumentComponent {
  private readonly _activeStore = inject(ActiveStore);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  private readonly _mouseOverDropList = new BehaviorSubject<Option<string>>(
    null
  );

  readonly activeInstructionArgument$ = combineLatest([
    this._boardStore.instructions$,
    this._activeStore.active$,
  ]).pipe(
    map(([instructions, active]) => {
      if (
        isNull(instructions) ||
        isNull(active) ||
        active.kind !== 'instructionArgument'
      ) {
        return null;
      }

      const instruction =
        instructions.find(({ id }) => id === active.instructionId) ?? null;

      if (isNull(instruction)) {
        return null;
      }

      return (
        instruction.arguments.find(
          (instructionArgument) => instructionArgument.id === active.id
        ) ?? null
      );
    })
  );
  readonly canAdd$ = combineLatest([
    this.activeInstructionArgument$,
    this._mouseOverDropList.asObservable(),
  ]).pipe(
    map(([activeInstructionArgument, dropListId]) => {
      if (isNull(activeInstructionArgument) || isNull(dropListId)) {
        return false;
      }

      const [instructionId] = dropListId.split('/');

      return activeInstructionArgument.ownerId === instructionId;
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
      this._useInstructionArgument(instructionId, taskId, referenceId);
    }
  }

  private _useInstructionArgument(
    instructionId: string,
    taskId: string,
    referenceId: string
  ) {
    this.activeInstructionArgument$
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
              kind: 'argument',
              ref: id,
            }
          );
        })
      )
      .subscribe();
  }
}

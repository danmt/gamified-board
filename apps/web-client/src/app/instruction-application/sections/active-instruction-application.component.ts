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
import { ActiveStore, BoardStore } from '../../board/stores';
import { InstructionTaskApiService } from '../../instruction-task/services';
import { ActiveComponent } from '../../shared/components';
import { FollowCursorDirective } from '../../shared/directives';
import {
  getFirstParentId,
  isNotNull,
  isNull,
  Option,
} from '../../shared/utils';

@Component({
  selector: 'pg-active-instruction-application',
  template: `
    <pg-active
      *ngIf="activeInstructionApplication$ | ngrxPush as instructionApplication"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [pgActive]="{
        thumbnailUrl: instructionApplication.application.thumbnailUrl
      }"
      [pgCanAdd]="(canAdd$ | ngrxPush) ?? false"
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveInstructionApplicationComponent {
  private readonly _activeStore = inject(ActiveStore);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  private readonly _mouseOverDropList = new BehaviorSubject<Option<string>>(
    null
  );

  readonly activeInstructionApplication$ = combineLatest([
    this._boardStore.instructions$,
    this._activeStore.active$,
  ]).pipe(
    map(([instructions, active]) => {
      if (
        isNull(instructions) ||
        isNull(active) ||
        active.kind !== 'instructionApplication'
      ) {
        return null;
      }

      const instruction =
        instructions.find(({ id }) => id === active.instructionId) ?? null;

      if (isNull(instruction)) {
        return null;
      }

      return (
        instruction.applications.find(
          (instructionApplication) => instructionApplication.id === active.id
        ) ?? null
      );
    })
  );
  readonly canAdd$ = combineLatest([
    this.activeInstructionApplication$,
    this._mouseOverDropList.asObservable(),
  ]).pipe(
    map(([activeInstructionApplication, dropListId]) => {
      if (isNull(activeInstructionApplication) || isNull(dropListId)) {
        return false;
      }

      const [instructionId] = dropListId.split('/');

      return activeInstructionApplication.ownerId === instructionId;
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
      this._useInstructionApplication(instructionId, taskId, referenceId);
    }
  }

  private _useInstructionApplication(
    instructionId: string,
    taskId: string,
    referenceId: string
  ) {
    this.activeInstructionApplication$
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
              kind: 'application',
              ref: id,
            }
          );
        })
      )
      .subscribe();
  }
}

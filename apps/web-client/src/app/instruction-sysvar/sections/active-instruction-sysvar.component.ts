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
  selector: 'pg-active-instruction-sysvar',
  template: `
    <pg-active
      *ngIf="activeInstructionSysvar$ | ngrxPush as instructionSysvar"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [pgActive]="{
        thumbnailUrl: instructionSysvar.sysvar.thumbnailUrl
      }"
      [pgCanAdd]="(canAdd$ | ngrxPush) ?? false"
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveInstructionSysvarComponent {
  private readonly _activeStore = inject(ActiveStore);
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  private readonly _mouseOverDropList = new BehaviorSubject<Option<string>>(
    null
  );

  readonly activeInstructionSysvar$ = combineLatest([
    this._boardStore.instructions$,
    this._activeStore.active$,
  ]).pipe(
    map(([instructions, active]) => {
      if (
        isNull(instructions) ||
        isNull(active) ||
        active.kind !== 'instructionSysvar'
      ) {
        return null;
      }

      const instruction =
        instructions.find(({ id }) => id === active.instructionId) ?? null;

      if (isNull(instruction)) {
        return null;
      }

      return (
        instruction.sysvars.find(
          (instructionSysvar) => instructionSysvar.id === active.id
        ) ?? null
      );
    })
  );
  readonly canAdd$ = combineLatest([
    this.activeInstructionSysvar$,
    this._mouseOverDropList.asObservable(),
  ]).pipe(
    map(([activeInstructionSysvar, dropListId]) => {
      if (isNull(activeInstructionSysvar) || isNull(dropListId)) {
        return false;
      }

      const [instructionId] = dropListId.split('/');

      return activeInstructionSysvar.ownerId === instructionId;
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
      this._useInstructionSysvar(instructionId, taskId, referenceId);
    }
  }

  private _useInstructionSysvar(
    instructionId: string,
    taskId: string,
    referenceId: string
  ) {
    this.activeInstructionSysvar$
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
              kind: 'sysvar',
              ref: id,
            }
          );
        })
      )
      .subscribe();
  }
}

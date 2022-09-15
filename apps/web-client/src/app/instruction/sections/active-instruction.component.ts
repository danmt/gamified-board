import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, filter, map, take } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { openEditInstructionTaskModal } from '../../instruction-task/components';
import { InstructionTaskApiService } from '../../instruction-task/services';
import { ActiveComponent } from '../../shared/components';
import { FollowCursorDirective } from '../../shared/directives';
import {
  getFirstParentId,
  isChildOf,
  isNotNull,
  isNull,
} from '../../shared/utils';

@Component({
  selector: 'pg-active-instruction',
  template: `
    <pg-active
      *ngIf="activeInstruction$ | ngrxPush as instruction"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [pgActive]="instruction"
      [pgCanAdd]="canAdd"
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveInstructionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );
  private readonly _dialog = inject(Dialog);

  readonly activeInstruction$ = combineLatest([
    this._boardStore.instructions$,
    this._boardStore.active$,
  ]).pipe(
    map(([instructions, active]) => {
      if (
        isNull(instructions) ||
        isNull(active) ||
        active.kind !== 'instruction'
      ) {
        return null;
      }

      return (
        instructions.find((instruction) => instruction.id === active.id) ?? null
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
      this._useInstruction(instructionId);
    }
  }

  private _useInstruction(instructionId: string) {
    this.activeInstruction$
      .pipe(
        take(1),
        filter(isNotNull),
        concatMap((activeInstruction) =>
          openEditInstructionTaskModal(this._dialog, {
            instructionTask: null,
          }).closed.pipe(
            concatMap((instructionTaskData) => {
              if (instructionTaskData === undefined) {
                return EMPTY;
              }

              return this._instructionTaskApiService.createInstructionTask(
                instructionId,
                {
                  id: instructionTaskData.id,
                  name: instructionTaskData.name,
                  instructionId: activeInstruction.id,
                }
              );
            })
          )
        )
      )
      .subscribe();
  }
}

import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, filter, map, take } from 'rxjs';
import { BoardStore } from '../../core';
import {
  InstructionSysvarApiService,
  openEditInstructionSysvarModal,
} from '../../instruction-sysvar';
import {
  ActiveComponent,
  FollowCursorDirective,
  getFirstParentId,
  isChildOf,
  isNotNull,
  isNull,
} from '../../shared';

@Component({
  selector: 'pg-active-sysvar',
  template: `
    <pg-active
      *ngIf="activeSysvar$ | ngrxPush as sysvar"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [pgActive]="sysvar"
      [pgCanAdd]="canAdd"
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveSysvarComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _dialog = inject(Dialog);
  private readonly _instructionSysvarApiService = inject(
    InstructionSysvarApiService
  );

  readonly activeSysvar$ = combineLatest([
    this._boardStore.sysvars$,
    this._boardStore.active$,
  ]).pipe(
    map(([sysvars, active]) => {
      if (isNull(sysvars) || isNull(active) || active.kind !== 'sysvar') {
        return null;
      }

      return sysvars.find((sysvar) => sysvar.id === active.id) ?? null;
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
      this._useSysvar(instructionId);
    }
  }

  private _useSysvar(instructionId: string) {
    this.activeSysvar$
      .pipe(
        take(1),
        filter(isNotNull),
        concatMap((activeSysvar) =>
          openEditInstructionSysvarModal(this._dialog, {
            instructionSysvar: null,
          }).closed.pipe(
            concatMap((instructionSysvarData) => {
              if (instructionSysvarData === undefined) {
                return EMPTY;
              }

              return this._instructionSysvarApiService.createInstructionSysvar(
                instructionId,
                {
                  id: instructionSysvarData.id,
                  name: instructionSysvarData.name,
                  sysvarId: activeSysvar.id,
                }
              );
            })
          )
        )
      )
      .subscribe();
  }
}

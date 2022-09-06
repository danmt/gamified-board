import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { combineLatest, concatMap, EMPTY, filter, map, take } from 'rxjs';
import { BoardStore } from '../../core/stores';
import { openEditInstructionApplicationModal } from '../../instruction-application/components';
import { InstructionApplicationApiService } from '../../instruction-application/services';
import { ActiveComponent } from '../../shared/components';
import { FollowCursorDirective } from '../../shared/directives';
import {
  getFirstParentId,
  isChildOf,
  isNotNull,
  isNull,
} from '../../shared/utils';

@Component({
  selector: 'pg-active-application',
  template: `
    <pg-active
      *ngIf="activeApplication$ | ngrxPush as application"
      [pgActive]="application"
      [pgCanAdd]="canAdd"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveApplicationComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _dialog = inject(Dialog);
  private readonly _instructionApplicationApiService = inject(
    InstructionApplicationApiService
  );

  readonly activeApplication$ = combineLatest([
    this._boardStore.applications$,
    this._boardStore.active$,
  ]).pipe(
    map(([applications, active]) => {
      if (
        isNull(applications) ||
        isNull(active) ||
        active.kind !== 'application'
      ) {
        return null;
      }

      return (
        applications.find((application) => application.id === active.id) ?? null
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
      this._useApplication(instructionId);
    }
  }

  private _useApplication(instructionId: string) {
    this.activeApplication$
      .pipe(
        take(1),
        filter(isNotNull),
        concatMap((activeApplication) =>
          openEditInstructionApplicationModal(this._dialog, {
            instructionApplication: null,
          }).closed.pipe(
            concatMap((instructionApplicationData) => {
              if (instructionApplicationData === undefined) {
                return EMPTY;
              }

              return this._instructionApplicationApiService.createInstructionApplication(
                instructionId,
                instructionApplicationData.id,
                instructionApplicationData.name,
                activeApplication.id
              );
            })
          )
        )
      )
      .subscribe();
  }
}

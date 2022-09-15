import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, filter, map, take } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { openEditInstructionSignerModal } from '../../instruction-signer/components';
import { InstructionSignerApiService } from '../../instruction-signer/services';
import { ActiveComponent } from '../../shared/components';
import { FollowCursorDirective } from '../../shared/directives';
import {
  getFirstParentId,
  isChildOf,
  isNotNull,
  isNull,
} from '../../shared/utils';

@Component({
  selector: 'pg-active-signer',
  template: `
    <pg-active
      *ngIf="activeSigner$ | ngrxPush as signer"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [pgActive]="signer"
      [pgCanAdd]="canAdd"
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveSignerComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _dialog = inject(Dialog);
  private readonly _instructionSignerApiService = inject(
    InstructionSignerApiService
  );

  readonly activeSigner$ = this._boardStore.active$.pipe(
    map((active) => {
      if (isNull(active) || active.kind !== 'signer') {
        return null;
      }

      return {
        id: 'signer',
        kind: 'signer' as const,
        thumbnailUrl: 'assets/generic/signer.png',
      };
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
      this._useSigner(instructionId);
    }
  }

  private _useSigner(instructionId: string) {
    this.activeSigner$
      .pipe(
        take(1),
        filter(isNotNull),
        concatMap(() =>
          openEditInstructionSignerModal(this._dialog, {
            instructionSigner: null,
          }).closed.pipe(
            concatMap((instructionSignerData) => {
              if (instructionSignerData === undefined) {
                return EMPTY;
              }

              return this._instructionSignerApiService.createInstructionSigner(
                instructionId,
                {
                  id: instructionSignerData.id,
                  name: instructionSignerData.name,
                  saveChanges: instructionSignerData.saveChanges,
                }
              );
            })
          )
        )
      )
      .subscribe();
  }
}

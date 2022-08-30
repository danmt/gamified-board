import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map } from 'rxjs';
import { EditSysvarData, EditSysvarModalComponent } from '../modals';
import { SysvarApiService } from '../services';
import { BoardStore, SysvarView } from '../stores';

@Component({
  selector: 'pg-sysvar-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.thumbnailUrl" />

      {{ selected?.name }}

      <button (click)="onUpdateSysvar(selected.id, selected)">edit</button>

      <button (click)="onDeleteSysvar(selected.id)">x</button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule],
})
export class SysvarSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _sysvarApiService = inject(SysvarApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (
        selected === null ||
        'workspaceId' in selected ||
        'ownerId' in selected
      ) {
        return null;
      }

      return selected;
    })
  );

  onUpdateSysvar(sysvarId: string, sysvar: SysvarView) {
    this._dialog
      .open<EditSysvarData, EditSysvarData, EditSysvarModalComponent>(
        EditSysvarModalComponent,
        {
          data: sysvar,
        }
      )
      .closed.pipe(
        concatMap((sysvarData) => {
          if (sysvarData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveId(null);

          return this._sysvarApiService.updateSysvar(
            sysvarId,
            sysvarData.name,
            sysvarData.thumbnailUrl
          );
        })
      )
      .subscribe();
  }

  onDeleteSysvar(sysvarId: string) {
    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._sysvarApiService
        .deleteSysvar(sysvarId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }
  }
}

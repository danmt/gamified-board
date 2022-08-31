import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { map } from 'rxjs';
import { SquareButtonComponent } from '../components';
import { EditSysvarModalDirective, EditSysvarSubmitPayload } from '../modals';
import { SysvarApiService } from '../services';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-sysvar-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.thumbnailUrl" />

      {{ selected?.name }}

      <div class="bg-gray-800 relative" style="width: 2.89rem; height: 2.89rem">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          q
        </span>

        <pg-square-button
          [pgIsActive]="isEditing"
          pgThumbnailUrl="assets/generic/signer.png"
          pgEditSysvarModal
          [pgSysvar]="selected"
          (pgOpenModal)="isEditing = true"
          (pgCloseModal)="isEditing = false"
          (pgUpdateSysvar)="onUpdateSysvar(selected.id, selected)"
        ></pg-square-button>
      </div>

      <div class="bg-gray-800 relative" style="width: 2.89rem; height: 2.89rem">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          w
        </span>

        <pg-square-button
          [pgIsActive]="false"
          pgThumbnailUrl="assets/generic/signer.png"
          (click)="onDeleteSysvar(selected.id)"
        ></pg-square-button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    EditSysvarModalDirective,
  ],
})
export class SysvarSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _sysvarApiService = inject(SysvarApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'sysvar') {
        return null;
      }

      return selected;
    })
  );

  isEditing = false;
  isDeleting = false;

  onUpdateSysvar(sysvarId: string, sysvarData: EditSysvarSubmitPayload) {
    this._sysvarApiService
      .updateSysvar(sysvarId, sysvarData.name, sysvarData.thumbnailUrl)
      .subscribe();
  }

  onDeleteSysvar(sysvarId: string) {
    this.isDeleting = true;

    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._sysvarApiService
        .deleteSysvar(sysvarId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }

    this.isDeleting = false;
  }
}

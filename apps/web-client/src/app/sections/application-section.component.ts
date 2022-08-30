import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map } from 'rxjs';
import { EditApplicationData, EditApplicationModalComponent } from '../modals';
import { ApplicationApiService } from '../services';
import { ApplicationView, BoardStore } from '../stores';

@Component({
  selector: 'pg-application-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.thumbnailUrl" />

      {{ selected?.name }}

      <button
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
        (click)="onUpdateApplication(selected.id, selected)"
      >
        edit
      </button>

      <button
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
        (click)="onDeleteApplication(selected.id)"
      >
        x
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, PushModule],
})
export class ApplicationSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected !== null && 'collections' in selected) {
        selected;
      }

      if (selected === null || !('collections' in selected)) {
        return null;
      }

      return selected;
    })
  );

  onUpdateApplication(applicationId: string, application: ApplicationView) {
    this._dialog
      .open<
        EditApplicationData,
        EditApplicationData,
        EditApplicationModalComponent
      >(EditApplicationModalComponent, {
        data: application,
      })
      .closed.pipe(
        concatMap((applicationData) => {
          if (applicationData === undefined) {
            return EMPTY;
          }

          this._boardStore.setActiveId(null);

          return this._applicationApiService.updateApplication(
            applicationId,
            applicationData.name,
            applicationData.thumbnailUrl
          );
        })
      )
      .subscribe();
  }

  onDeleteApplication(applicationId: string) {
    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._applicationApiService
        .deleteApplication(applicationId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }
  }
}

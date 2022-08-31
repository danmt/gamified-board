import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { map } from 'rxjs';
import { SquareButtonComponent } from '../components';
import {
  EditApplicationModalDirective,
  EditApplicationSubmitPayload,
} from '../modals';
import { ApplicationApiService } from '../services';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-application-section',
  template: `
    <div
      *ngIf="selected$ | ngrxPush as selected"
      class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.thumbnailUrl" />

      {{ selected?.name }}

      <div
        class="bg-gray-800 relative"
        style="width: 2.89rem; height: 2.89rem"
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
      >
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          q
        </span>

        <pg-square-button
          [pgIsActive]="isEditing"
          pgThumbnailUrl="assets/generic/signer.png"
          pgEditApplicationModal
          [pgApplication]="selected"
          (pgOpenModal)="isEditing = true"
          (pgCloseModal)="isEditing = false"
          (pgUpdateApplication)="onUpdateApplication(selected.id, selected)"
        ></pg-square-button>
      </div>

      <div
        class="bg-gray-800 relative"
        style="width: 2.89rem; height: 2.89rem"
        *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
      >
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          w
        </span>

        <pg-square-button
          [pgIsActive]="false"
          pgThumbnailUrl="assets/generic/signer.png"
          (click)="onDeleteApplication(selected.id)"
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
    EditApplicationModalDirective,
  ],
})
export class ApplicationSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'application') {
        return null;
      }

      return selected;
    })
  );

  isEditing = false;
  isDeleting = false;

  onUpdateApplication(
    applicationId: string,
    applicationData: EditApplicationSubmitPayload
  ) {
    this._applicationApiService
      .updateApplication(
        applicationId,
        applicationData.name,
        applicationData.thumbnailUrl
      )
      .subscribe();
  }

  onDeleteApplication(applicationId: string) {
    this.isDeleting = true;

    if (confirm('Are you sure? This action cannot be reverted.')) {
      this._applicationApiService
        .deleteApplication(applicationId)
        .subscribe(() => this._boardStore.setSelectedId(null));
    }

    this.isDeleting = false;
  }
}

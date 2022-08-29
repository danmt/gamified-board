import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { EditApplicationModalDirective } from '../modals';
import { ApplicationApiService } from '../services';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-applications-section',
  template: `
    <div class="bg-gray-500 h-full flex flex-col gap-4">
      <h1 class="px-4 pt-4">Applications</h1>

      <div class="flex-1 px-4 overflow-auto">
        <div
          *ngrxLet="applications$; let applications"
          id="applications-section"
          cdkDropList
          [cdkDropListConnectedTo]="[
            'application-slot-0',
            'application-slot-1',
            'application-slot-2',
            'application-slot-3',
            'application-slot-4',
            'application-slot-5'
          ]"
          [cdkDropListData]="applications"
          cdkDropListSortingDisabled
          class="flex flex-wrap gap-2"
        >
          <div
            *ngFor="let application of applications; trackBy: trackBy"
            class="relative"
          >
            <ng-container *ngIf="(isDragging$ | ngrxPush) === application.id">
              <div
                class="w-full h-full absolute z-20 bg-black bg-opacity-50"
              ></div>
              <div class="bg-yellow-500 p-0.5 w-11 h-11">
                <img
                  class="w-full h-full object-cover"
                  [src]="application.thumbnailUrl"
                />
              </div>
            </ng-container>

            <div
              cdkDrag
              [cdkDragData]="application.id"
              (click)="onSelectApplication(application.id)"
              (dblclick)="onActivateApplication(application.id)"
              (cdkDragStarted)="onDragStart($event)"
              (cdkDragEnded)="onDragEnd()"
            >
              <div class="bg-yellow-500 p-0.5 w-11 h-11">
                <img
                  class="w-full h-full object-cover"
                  [src]="application.thumbnailUrl"
                />
              </div>

              <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
                <img
                  class="w-full h-full object-cover"
                  [src]="application.thumbnailUrl"
                />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="w-full h-32 p-4 bg-black bg-opacity-25 overflow-auto"
        *ngrxLet="selectedApplication$; let application"
      >
        {{ application?.name }}

        <button
          *ngIf="
            application !== null &&
            application.id !== null &&
            application.id === (currentApplicationId$ | ngrxPush)
          "
          pgEditApplicationModal
          [application]="application"
          (updateApplication)="
            onUpdateApplication(
              application.id,
              $event.name,
              $event.thumbnailUrl
            )
          "
        >
          edit
        </button>

        <button
          *ngIf="
            application !== null &&
            application.id !== null &&
            application.id === (currentApplicationId$ | ngrxPush)
          "
          class="rounded-full bg-slate-400 w-8 h-8"
          (click)="onDeleteApplication(application.id, application.id)"
        >
          x
        </button>

        <a
          class="underline"
          *ngIf="
            application !== null &&
            application.workspaceId === (workspaceId$ | ngrxPush) &&
            application.id !== (currentApplicationId$ | ngrxPush)
          "
          [routerLink]="['/board', application.workspaceId, application.id]"
        >
          view
        </a>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    PushModule,
    LetModule,
    RouterModule,
    EditApplicationModalDirective,
  ],
})
export class ApplicationsSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _applicationApiService = inject(ApplicationApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly selectedApplication$ = this._boardStore.selectedApplication$;
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly applications$ = this._boardStore.applications$;

  onActivateApplication(applicationId: string) {
    this._boardStore.setActiveApplicationId(applicationId);
  }

  onSelectApplication(applicationId: string) {
    this._boardStore.setSelectedApplicationId(applicationId);
  }

  onUpdateApplication(
    applicationId: string,
    applicationName: string,
    thumbnailUrl: string
  ) {
    this._applicationApiService
      .updateApplication(applicationId, applicationName, thumbnailUrl)
      .subscribe();
  }

  onDeleteApplication(applicationId: string, workspaceId: string) {
    this._applicationApiService
      .deleteApplication(applicationId, workspaceId)
      .subscribe(() => this._boardStore.setSelectedApplicationId(null));
  }

  onDragStart(event: CdkDragStart) {
    this._isDragging.next(event.source.data);
  }

  onDragEnd() {
    this._isDragging.next(null);
  }

  trackBy(index: number): number {
    return index;
  }
}

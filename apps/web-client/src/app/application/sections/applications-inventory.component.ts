import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { BoardStore } from '../../core/stores';
import { InventoryComponent, InvetoryDirection } from '../../shared/components';
import { DefaultImageDirective } from '../../shared/directives';
import { Option } from '../../shared/utils';
import {
  ApplicationTooltipDirective,
  EditApplicationModalDirective,
} from '../components';

@Component({
  selector: 'pg-applications-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[500px] max-h-[500px]"
      [direction]="direction"
    >
      <header class="relative h-[80px]">
        <div
          class="flex relative w-full bp-skin-title-box items-center justify-between pl-6 pr-8 mr-1.5"
        >
          <h1 class="bp-font-game text-3xl">Applications</h1>
        </div>
      </header>
      <section
        class="flex-1 pl-6 pr-4 pt-4 pb-10 overflow-auto max-w-[280px] mr-4"
      >
        <div
          *ngrxLet="applications$; let applications"
          id="applications-section"
          cdkDropList
          [cdkDropListConnectedTo]="[
            'slot-0',
            'slot-1',
            'slot-2',
            'slot-3',
            'slot-4',
            'slot-5',
            'slot-6',
            'slot-7',
            'slot-8',
            'slot-9'
          ]"
          [cdkDropListData]="applications"
          cdkDropListSortingDisabled
          class="flex flex-wrap gap-4"
        >
          <div
            *ngFor="let application of applications; trackBy: trackBy"
            pgApplicationTooltip
            [pgApplication]="application"
            class="relative"
          >
            <ng-container *ngIf="(isDragging$ | ngrxPush) === application.id">
              <div
                class="w-full h-full absolute z-20 bg-black bg-opacity-50"
              ></div>
              <div class="bg-green-800 p-0.5 w-11 h-11">
                <img
                  class="w-full h-full object-cover"
                  [src]="application.thumbnailUrl"
                  pgDefaultImage="assets/generic/application.png"
                />
              </div>
            </ng-container>

            <div
              cdkDrag
              [cdkDragData]="{ id: application.id, kind: 'application' }"
              (click)="onSelectApplication(application.id)"
              (dblclick)="onActivateApplication(application.id)"
              (cdkDragStarted)="onDragStart($event)"
              (cdkDragEnded)="onDragEnd()"
            >
              <div class="bg-green-800 p-0.5 w-11 h-11">
                <img
                  class="w-full h-full object-cover"
                  [src]="application.thumbnailUrl"
                  pgDefaultImage="assets/generic/application.png"
                />
              </div>

              <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
                <img
                  class="w-full h-full object-cover"
                  [src]="application.thumbnailUrl"
                  pgDefaultImage="assets/generic/application.png"
                />
              </div>

              <div *cdkDragPlaceholder></div>
            </div>
          </div>
        </div>
      </section>
    </pg-inventory>
  `,
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    OverlayModule,
    PushModule,
    LetModule,
    RouterModule,
    DefaultImageDirective,
    InventoryComponent,
    ApplicationTooltipDirective,
    EditApplicationModalDirective,
  ],
})
export class ApplicationsInventoryComponent {
  private readonly _boardStore = inject(BoardStore);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);

  readonly isDragging$ = this._isDragging.asObservable();
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly applications$ = this._boardStore.applications$;
  readonly direction = InvetoryDirection.left;

  onActivateApplication(applicationId: string) {
    this._boardStore.setActive({ id: applicationId, kind: 'application' });
  }

  onSelectApplication(applicationId: string) {
    this._boardStore.setSelected({ id: applicationId, kind: 'application' });
  }

  onDragStart(event: CdkDragStart) {
    this._isDragging.next(event.source.data.id);
  }

  onDragEnd() {
    this._isDragging.next(null);
  }

  trackBy(index: number): number {
    return index;
  }
}

import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { EditApplicationModalDirective } from '../modals';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-applications-section',
  template: `
    <div class="flex flex-col relative mt-10 z-40">
      <div class="flex relative" style="height:78px">
        <div class="bp-skin-metal-detail absolute -top-2.5 z-20"></div>
        <div class="bp-skin-metal-border flex-1 z-10"></div>
        <div class="absolute w-full bp-skin-title-box">
          <h1 class="bp-font-game text-3xl px-4 mt-6">Applications</h1>
        </div>
        <div class="bp-skin-metal-corner-right-top z-10"></div>
      </div>

      <div class="relative bp-bg-futuristic">
        <div
          class="bp-skin-metal-border-right absolute right-0 h-full z-20"
        ></div>
        <div>
          <div class="flex-1 px-4 pt-4 pb-10 overflow-auto bp-skin-metal-body">
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
              class="flex flex-wrap gap-2"
            >
              <div
                *ngFor="let application of applications; trackBy: trackBy"
                class="relative"
              >
                <ng-container
                  *ngIf="(isDragging$ | ngrxPush) === application.id"
                >
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
                  [cdkDragData]="{ id: application.id, kind: 'application' }"
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

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
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
        </div>
      </div>
      <div class="flex items-end relative" style="top: -75px; z-index: 100;">
        <div class="bp-skin-metal-detail absolute -bottom-3 z-20"></div>
        <div class="bp-skin-metal-border-bottom flex-1"></div>
        <div class="bp-skin-metal-corner-right-bottom"></div>
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

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly applications$ = this._boardStore.applications$;

  onActivateApplication(applicationId: string) {
    this._boardStore.setActiveId(applicationId);
  }

  onSelectApplication(applicationId: string) {
    this._boardStore.setSelectedId(applicationId);
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

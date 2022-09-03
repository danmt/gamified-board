import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { ApplicationTooltipDirective } from '../components';
import { DefaultImageDirective } from '../directives';
import { EditApplicationModalDirective } from '../modals';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-applications-section',
  template: `
    <div
      class="flex flex-col relative mt-10 z-40 bp-bg-futuristic min-w-[300px] min-h-[500px] max-h-[500px]"
    >
      <!-- top border design -->
      <div
        class="bp-skin-metal-corner-right-top absolute -top-2.5 -right-2.5 z-20"
      ></div>
      <div
        class="bp-skin-metal-border-top absolute -top-2.5 w-5/6 right-16 left-0 mx-auto my-0 z-10"
      ></div>
      <div class="bp-skin-detail-1  absolute -top-3 z-20 left-0"></div>

      <!-- side border design -->
      <div
        class="bp-skin-metal-border-right absolute -right-2.5 h-5/6 top-0 bottom-0 my-auto mx-0 z-10"
      ></div>

      <!-- bottom border design -->
      <div
        class="bp-skin-metal-corner-right-bottom absolute -bottom-2.5 -right-2.5 z-20"
      ></div>
      <div
        class="bp-skin-metal-border-bottom absolute -bottom-2.5 w-5/6 right-16 left-0 mx-auto my-0 z-10"
      ></div>
      <div class="bp-skin-detail-1  absolute -bottom-4 z-20 left-0"></div>

      <!-- section content -->
      <header class="relative h-[80px]">
        <div
          class="relative w-full bp-skin-title-box flex items-center justify-between pl-6 pr-8 mr-1.5"
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
            [pgApplicationTooltip]="application"
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
    </div>
  `,
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    OverlayModule,
    PushModule,
    LetModule,
    RouterModule,
    EditApplicationModalDirective,
    DefaultImageDirective,
    ApplicationTooltipDirective,
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
    this._boardStore.setActive({ id: applicationId, kind: 'application' });
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

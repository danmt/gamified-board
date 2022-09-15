import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { InventoryComponent } from '../../shared/components';
import { DefaultImageDirective } from '../../shared/directives';
import { isNull, Option } from '../../shared/utils';
import { ApplicationTooltipDirective } from '../components';

@Component({
  selector: 'pg-applications-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[500px] max-h-[500px]"
      pgDirection="left"
      [pgTotal]="(total$ | ngrxPush) ?? 0"
      [pgPage]="(page$ | ngrxPush) ?? 1"
      [pgPageSize]="pageSize"
      (pgSetPage)="onSetPage($event)"
    >
      <h2 pgInventoryTitle class="bp-font-game text-3xl">Applications</h2>

      <div
        pgInventoryBody
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
        class="flex flex-wrap gap-4 justify-center"
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
  ],
})
export class ApplicationsInventoryComponent {
  private readonly _boardStore = inject(BoardStore);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  private readonly _page = new BehaviorSubject(1);

  readonly isDragging$ = this._isDragging.asObservable();
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly total$ = this._boardStore.applications$.pipe(
    map((applications) => applications?.length ?? 0)
  );
  readonly pageSize = 24;
  readonly page$ = this._page.asObservable();
  readonly applications$ = combineLatest([
    this._boardStore.applications$,
    this.page$,
  ]).pipe(
    map(([applications, page]) => {
      if (isNull(applications)) {
        return null;
      }

      return applications.slice(
        page === 1 ? 0 : (page - 1) * this.pageSize,
        page * this.pageSize
      );
    })
  );

  onSetPage(page: number) {
    this._page.next(page);
  }

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

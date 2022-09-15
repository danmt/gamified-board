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
import {
  CreateSysvarModalDirective,
  SysvarTooltipDirective,
} from '../components';
import { SysvarApiService } from '../services';

@Component({
  selector: 'pg-sysvars-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[500px] max-h-[500px]"
      pgDirection="right"
      [pgTotal]="(total$ | ngrxPush) ?? 0"
      [pgPage]="(page$ | ngrxPush) ?? 1"
      [pgPageSize]="pageSize"
      (pgSetPage)="onSetPage($event)"
    >
      <h2 class="bp-font-game-title text-3xl" pgInventoryTitle>Sysvars</h2>

      <button
        class="bp-button-add-futuristic z-20"
        pgCreateSysvarModal
        (pgCreateSysvar)="onCreateSysvar($event.id, $event.name)"
        pgInventoryCreateButton
      ></button>

      <div
        pgInventoryBody
        *ngrxLet="sysvars$; let sysvars"
        id="sysvars-section"
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
        [cdkDropListData]="sysvars"
        cdkDropListSortingDisabled
        class="flex flex-wrap gap-4 justify-center"
      >
        <div
          *ngFor="let sysvar of sysvars; trackBy: trackBy"
          class="relative"
          pgSysvarTooltip
          [pgSysvar]="sysvar"
        >
          <ng-container *ngIf="(isDragging$ | ngrxPush) === sysvar.id">
            <div
              class="w-full h-full absolute z-20 bg-black bg-opacity-50"
            ></div>
            <div class="bg-gray-600 p-0.5 w-11 h-11">
              <img
                class="w-full h-full object-cover"
                [src]="sysvar.thumbnailUrl"
                pgDefaultImage="assets/generic/sysvar.png"
              />
            </div>
          </ng-container>

          <div
            cdkDrag
            [cdkDragData]="{ id: sysvar.id, kind: 'sysvar' }"
            (click)="onSelectSysvar(sysvar.id)"
            (dblclick)="onActivateSysvar(sysvar.id)"
            (cdkDragStarted)="onDragStart($event)"
            (cdkDragEnded)="onDragEnd()"
          >
            <div class="bg-gray-600 p-0.5 w-11 h-11">
              <img
                class="w-full h-full object-cover"
                [src]="sysvar.thumbnailUrl"
                pgDefaultImage="assets/generic/sysvar.png"
              />
            </div>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img
                class="w-full h-full object-cover"
                [src]="sysvar.thumbnailUrl"
                pgDefaultImage="assets/generic/sysvar.png"
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
    CreateSysvarModalDirective,
    DefaultImageDirective,
    SysvarTooltipDirective,
    InventoryComponent,
  ],
})
export class SysvarsInventoryComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _sysvarApiService = inject(SysvarApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  private readonly _page = new BehaviorSubject<number>(1);

  readonly isDragging$ = this._isDragging.asObservable();
  readonly total$ = this._boardStore.sysvars$.pipe(
    map((sysvars) => sysvars?.length ?? 0)
  );
  readonly pageSize = 24;
  readonly page$ = this._page.asObservable();
  readonly sysvars$ = combineLatest([
    this._boardStore.sysvars$,
    this.page$,
  ]).pipe(
    map(([sysvars, page]) => {
      if (isNull(sysvars)) {
        return null;
      }

      return sysvars.slice(
        page === 1 ? 0 : (page - 1) * this.pageSize,
        page * this.pageSize
      );
    })
  );

  onSetPage(page: number) {
    this._page.next(page);
  }

  onActivateSysvar(sysvarId: string) {
    this._boardStore.setActive({ id: sysvarId, kind: 'sysvar' });
  }

  onSelectSysvar(sysvarId: string) {
    this._boardStore.setSelected({ id: sysvarId, kind: 'sysvar' });
  }

  onCreateSysvar(id: string, name: string) {
    this._sysvarApiService.createSysvar({ id, name }).subscribe();
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

import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { InventoryComponent, InvetoryDirection } from '../components';
import { DefaultImageDirective } from '../directives';
import { EditSysvarModalDirective } from '../modals';
import { SysvarApiService } from '../services';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-sysvars-section',
  template: `
    <pg-inventory [direction]="direction">
      <header class="relative h-[80px]">
        <div
          class="flex absolute w-full bp-skin-title-box items-center justify-between pl-6 pr-8 ml-1.5"
        >
          <h1 class="bp-font-game text-3xl">Sysvars</h1>

          <button
            class="bp-button-add-futuristic z-20"
            pgEditSysvarModal
            (pgCreateSysvar)="
              onCreateSysvar($event.id, $event.name, $event.thumbnailUrl)
            "
          ></button>
        </div>
      </header>

      <section
        class="flex-1 pl-6 pr-4 pt-4 pb-10 overflow-auto max-w-[280px] ml-2"
      >
        <div
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
          class="flex flex-wrap gap-4"
        >
          <div
            *ngFor="let sysvar of sysvars; trackBy: trackBy"
            class="relative"
          >
            <ng-container *ngIf="(isDragging$ | ngrxPush) === sysvar.id">
              <div
                class="w-full h-full absolute z-20 bg-black bg-opacity-50"
              ></div>
              <div class="bg-green-800 p-0.5 w-11 h-11">
                <img
                  class="w-full h-full object-cover"
                  [src]="sysvar.thumbnailUrl"
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
              <div class="bg-green-800 p-0.5 w-11 h-11">
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
      </section>
    </pg-inventory>
  `,
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    PushModule,
    LetModule,
    RouterModule,
    EditSysvarModalDirective,
    DefaultImageDirective,
    InventoryComponent,
  ],
})
export class SysvarsSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _sysvarApiService = inject(SysvarApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly sysvars$ = this._boardStore.sysvars$;
  readonly direction = InvetoryDirection.right;

  onActivateSysvar(sysvarId: string) {
    this._boardStore.setActive({ id: sysvarId, kind: 'sysvar' });
  }

  onSelectSysvar(sysvarId: string) {
    this._boardStore.setSelectedId(sysvarId);
  }

  onCreateSysvar(id: string, name: string, thumbnailUrl: string) {
    this._sysvarApiService.createSysvar(id, name, thumbnailUrl).subscribe();
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

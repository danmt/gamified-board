import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { EditSysvarModalDirective } from '../modals';
import { SysvarApiService } from '../services';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-sysvars-section',
  template: `
    <div class="flex flex-col relative mt-10 z-40">
      <header class="flex relative" style="height:78px">
        <div class="bp-skin-metal-corner-left-top z-10"></div>
        <div class="bp-skin-metal-border flex-1 z-10"></div>
        <div
          class="absolute w-full bp-skin-title-box flex items-center justify-between pl-12 pr-8 ml-1.5"
        >
          <h1 class="bp-font-game text-3xl">Sysvars</h1>

          <button
            class="bp-button-add-futuristic z-20"
            pgEditSysvarModal
            (createSysvar)="
              onCreateSysvar($event.id, $event.name, $event.thumbnailUrl)
            "
          ></button>
        </div>
        <div
          class="bp-skin-metal-detail-2 absolute -top-2.5 z-20 right-0"
        ></div>
      </header>

      <div class="relative bp-bg-futuristic">
        <div
          class="bp-skin-metal-border-left absolute left-0 h-full z-20"
        ></div>
        <div>
          <div
            class="flex-1 pl-6 pr-4 pt-4 pb-10 overflow-auto bp-skin-metal-body ml-4"
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
                    />
                  </div>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img
                      class="w-full h-full object-cover"
                      [src]="sysvar.thumbnailUrl"
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
        <div class="bp-skin-metal-corner-left-bottom"></div>
        <div class="bp-skin-metal-border-bottom flex-1"></div>
        <div
          class="bp-skin-metal-detail-2 absolute -bottom-3 z-20 right-0"
        ></div>
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
    EditSysvarModalDirective,
  ],
})
export class SysvarsSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _sysvarApiService = inject(SysvarApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly sysvars$ = this._boardStore.sysvars$;

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

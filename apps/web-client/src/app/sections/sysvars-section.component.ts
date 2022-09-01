import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { DefaultImageDirective } from '../directives';
import { EditSysvarModalDirective } from '../modals';
import { SysvarApiService } from '../services';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-sysvars-section',
  template: `
    <div class="bg-gray-500 h-full flex flex-col gap-4">
      <header class="flex items-center gap-2 mb-2 px-4 pt-4">
        <h2>Sysvars</h2>

        <button
          class="rounded-full bg-slate-400 w-8 h-8"
          pgEditSysvarModal
          (pgCreateSysvar)="
            onCreateSysvar($event.id, $event.name, $event.thumbnailUrl)
          "
        >
          +
        </button>
      </header>

      <div class="flex-1 px-4 overflow-auto">
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
          class="flex flex-wrap gap-2"
        >
          <div
            *ngFor="let sysvar of sysvars; trackBy: trackBy"
            class="relative"
          >
            <ng-container *ngIf="(isDragging$ | ngrxPush) === sysvar.id">
              <div
                class="w-full h-full absolute z-20 bg-black bg-opacity-50"
              ></div>
              <div class="bg-yellow-500 p-0.5 w-11 h-11">
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
              <div class="bg-yellow-500 p-0.5 w-11 h-11">
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
    DefaultImageDirective,
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

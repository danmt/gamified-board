import { DIALOG_DATA } from '@angular/cdk/dialog';
import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { PluginInterface } from '../plugins';
import { Option } from '../utils';

@Component({
  selector: 'pg-instructions',
  template: `
    <div class="p-4 bg-white h-full overflow-auto">
      <h1>Instructions</h1>

      <ng-container *ngFor="let plugin of plugins">
        <div *ngIf="plugin.instructions.length > 0">
          <h2>{{ plugin.name }}</h2>

          <div
            [id]="plugin.name + '-instructions'"
            cdkDropList
            [cdkDropListConnectedTo]="[
              'slot-0',
              'slot-1',
              'slot-2',
              'slot-3',
              'slot-4',
              'slot-5'
            ]"
            [cdkDropListData]="plugin.instructions"
            cdkDropListSortingDisabled
            class="flex flex-wrap gap-2"
          >
            <div
              *ngFor="let instruction of plugin.instructions; trackBy: trackBy"
              class="relative"
            >
              <ng-container
                *ngIf="
                  (isDragging$ | ngrxPush) ===
                  plugin.name + '/' + instruction.name
                "
              >
                <div
                  class="w-full h-full absolute z-20 bg-black bg-opacity-50"
                ></div>
                <div class="bg-yellow-500 p-0.5 w-11 h-11">
                  <img
                    class="w-full h-full object-cover"
                    [src]="
                      'assets/plugins/' +
                      plugin.name +
                      '/instructions/' +
                      instruction.name +
                      '.png'
                    "
                  />
                </div>
              </ng-container>

              <div
                cdkDrag
                [cdkDragData]="{
                  id: plugin.name + '/' + instruction.name,
                  thumbnailUrl:
                    'assets/plugins/' +
                    plugin.name +
                    '/instructions/' +
                    instruction.name +
                    '.png'
                }"
                (cdkDragStarted)="onDragStart($event)"
                (cdkDragEnded)="onDragEnd()"
              >
                <div class="bg-yellow-500 p-0.5 w-11 h-11">
                  <img
                    class="w-full h-full object-cover"
                    [src]="
                      'assets/plugins/' +
                      plugin.name +
                      '/instructions/' +
                      instruction.name +
                      '.png'
                    "
                  />
                </div>

                <div
                  *cdkDragPreview
                  class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                >
                  <img
                    class="w-full h-full object-cover"
                    [src]="
                      'assets/plugins/' +
                      plugin.name +
                      '/instructions/' +
                      instruction.name +
                      '.png'
                    "
                  />
                </div>

                <div *cdkDragPlaceholder></div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  standalone: true,
  imports: [DragDropModule, CommonModule, PushModule],
})
export class InstructionsComponent {
  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly plugins = inject<PluginInterface[]>(DIALOG_DATA);

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

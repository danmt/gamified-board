import { DIALOG_DATA } from '@angular/cdk/dialog';
import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { SquareButtonComponent } from './square-button.component';

@Component({
  selector: 'pg-collections',
  template: `
    <div class="p-4 bg-white h-full">
      <h1>Collections</h1>

      <div
        id="collections"
        cdkDropList
        [cdkDropListConnectedTo]="[
          'slot-7',
          'slot-8',
          'slot-9',
          'slot-10',
          'slot-11',
          'slot-12'
        ]"
        [cdkDropListData]="collections"
        cdkDropListSortingDisabled
        class="flex flex-wrap gap-2"
      >
        <div
          *ngFor="let collection of collections; trackBy: trackBy"
          class="relative"
        >
          <div
            *ngIf="(isDragging$ | ngrxPush) === collection"
            class="w-full h-full absolute z-20 bg-black bg-opacity-50"
          ></div>
          <div
            cdkDrag
            [cdkDragData]="collection"
            (cdkDragStarted)="onDragStart($event)"
            (cdkDragEnded)="onDragEnd()"
          >
            <div class="bg-yellow-500 p-0.5 w-11 h-11">
              <img class="w-full h-full" [src]="collection" />
            </div>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img class="w-full h-full" [src]="collection" />
            </div>

            <div *cdkDragPlaceholder></div>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [DragDropModule, CommonModule, SquareButtonComponent, PushModule],
})
export class CollectionsComponent {
  private readonly _isDragging = new BehaviorSubject<string | null>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  collections: string[];

  constructor(@Inject(DIALOG_DATA) data: string[]) {
    this.collections = data;
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

import { DIALOG_DATA } from '@angular/cdk/dialog';
import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { SquareButtonComponent } from './square-button.component';

@Component({
  selector: 'pg-instructions',
  template: `
    <div class="p-4 bg-white h-full">
      <h1>Instructions</h1>

      <div
        cdkDropList
        [cdkDropListData]="instructions"
        cdkDropListSortingDisabled
        class="flex flex-wrap gap-2"
      >
        <div
          *ngFor="let instruction of instructions; trackBy: trackBy"
          class="relative"
        >
          <div
            *ngIf="(isDragging$ | ngrxPush) === instruction"
            class="w-full h-full absolute z-20 bg-black bg-opacity-50"
          ></div>
          <div
            cdkDrag
            [cdkDragData]="instruction"
            (cdkDragStarted)="onDragStart($event)"
            (cdkDragEnded)="onDragEnd()"
          >
            <div class="bg-yellow-500 p-0.5 w-11 h-11">
              <img class="w-full h-full" [src]="instruction" />
            </div>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img class="w-full h-full" [src]="instruction" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [DragDropModule, CommonModule, SquareButtonComponent, PushModule],
})
export class InstructionsComponent {
  private readonly _isDragging = new BehaviorSubject<string | null>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  instructions: string[];

  constructor(@Inject(DIALOG_DATA) data: string[]) {
    this.instructions = data;
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

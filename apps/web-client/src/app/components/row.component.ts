import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { Item } from '../utils';

@Component({
  selector: 'pg-row',
  template: `
    <div
      class="text-2xl text-white uppercase relative h-full flex gap-4"
      (mouseenter)="isHovered = true"
      (mouseleave)="isHovered = false"
      (click)="onUseActive()"
    >
      <ng-content></ng-content>

      <div class="w-80">
        <p>Context</p>

        <div class="flex gap-2 flex-wrap">
          <div
            class="p-2 bg-gray-800"
            *ngFor="let document of documents; trackBy: trackBy"
          >
            <img [src]="document" class="w-12 h-12" />
          </div>

          <div
            *ngIf="isHovered && active !== null && active.kind === 'collection'"
            class="p-2 bg-gray-800"
          >
            <img [src]="active.data" class="w-12 h-12" />
          </div>
        </div>
      </div>

      <div class="w-80">
        <p>Handler</p>

        <div class="flex gap-2 flex-wrap">
          <div
            class="p-2 bg-gray-800"
            *ngFor="let task of tasks; trackBy: trackBy"
          >
            <img [src]="task" class="w-12 h-12" />
          </div>

          <div
            *ngIf="
              isHovered && active !== null && active.kind === 'instruction'
            "
            class="p-2 bg-gray-800"
          >
            <img [src]="active.data" class="w-12 h-12" />
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowComponent {
  @Input() active: Item | null = null;
  @Input() documents: string[] | null = null;
  @Input() tasks: string[] | null = null;
  @Output() useActive = new EventEmitter();
  isHovered = false;
  @HostBinding('class') class =
    'block w-full h-64 bg-blue-300 border border-blue-500 bg-bp-bricks ';

  onUseActive() {
    if (this.active !== null) {
      this.useActive.emit();
    }
  }

  trackBy(index: number): number {
    return index;
  }
}

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { ActiveItem, BoardInstruction, BoardItemKind, Option } from '../utils';

@Component({
  selector: 'pg-row',
  template: `
    <div
      *ngIf="instruction !== null"
      class="text-2xl text-white uppercase relative h-full flex gap-4"
      (mouseenter)="isHovered = true"
      (mouseleave)="isHovered = false"
      (click)="onUseItem(instruction.id, active)"
    >
      <ng-content></ng-content>

      <div class="w-80">
        <p>Context</p>

        <div class="flex gap-2 flex-wrap">
          <button
            class="p-2 bg-gray-800"
            *ngFor="let document of instruction.documents; trackBy: trackBy"
            (click)="onSelectItem(instruction.id, document.id, 'document')"
          >
            <img [src]="document.thumbnailUrl" class="w-12 h-12" />
          </button>

          <div
            *ngIf="isHovered && active !== null && active.kind === 'collection'"
            class="p-2 bg-gray-800"
          >
            <img [src]="active.data.thumbnailUrl" class="w-12 h-12" />
          </div>
        </div>
      </div>

      <div class="w-80">
        <p>Handler</p>

        <div class="flex gap-2 flex-wrap">
          <button
            class="p-2 bg-gray-800"
            *ngFor="let task of instruction.tasks; trackBy: trackBy"
            (click)="onSelectItem(instruction.id, task.id, 'task')"
          >
            <img [src]="task.thumbnailUrl" class="w-12 h-12" />
          </button>

          <div
            *ngIf="
              isHovered && active !== null && active.kind === 'instruction'
            "
            class="p-2 bg-gray-800"
          >
            <img [src]="active.data.thumbnailUrl" class="w-12 h-12" />
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
  @Input() active: ActiveItem | null = null;
  @Input() instruction: BoardInstruction | null = null;
  @Output() useItem = new EventEmitter<{
    instructionId: string;
    item: ActiveItem;
  }>();
  @Output() selectItem = new EventEmitter<{
    instructionId: string;
    itemId: string;
    kind: BoardItemKind;
  }>();
  isHovered = false;
  @HostBinding('class') class =
    'block w-full h-64 bg-blue-300 border border-blue-500 bg-bp-bricks ';

  onUseItem(instructionId: string, active: Option<ActiveItem>) {
    if (active !== null) {
      this.useItem.emit({
        instructionId,
        item: active,
      });
    }
  }

  onSelectItem(instructionId: string, itemId: string, kind: BoardItemKind) {
    this.selectItem.emit({ instructionId, itemId, kind });
  }

  trackBy(index: number): number {
    return index;
  }
}

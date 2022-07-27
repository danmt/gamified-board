import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ActiveItem, BoardInstruction, BoardItemKind } from '../utils';
import { RowComponent } from './row.component';

export const BOARD_SIZE = 8000;

@Component({
  selector: 'pg-board',
  template: `
    <div
      [ngStyle]="{ width: boardSize + 'px' }"
      (mouseover)="isHovered = true"
      (mouseout)="isHovered = false"
      class="relative"
    >
      <pg-row
        *ngFor="let instruction of instructions; trackBy: trackBy"
        [active]="active"
        [instruction]="instruction"
        (useItem)="onUseItem($event.instructionId, $event.item)"
        (selectItem)="
          onSelectItem($event.instructionId, $event.itemId, $event.kind)
        "
      >
        <p>row {{ instruction.id }}</p>
      </pg-row>
    </div>
  `,
  standalone: true,
  imports: [RowComponent, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  @Input() instructions: BoardInstruction[] | null = null;
  @Input() active: ActiveItem | null = null;
  @Output() useItem = new EventEmitter<{
    instructionId: string;
    item: ActiveItem;
  }>();
  @Output() selectItem = new EventEmitter<{
    instructionId: string;
    itemId: string;
    kind: BoardItemKind;
  }>();
  readonly boardSize = BOARD_SIZE;
  isHovered = false;

  onUseItem(instructionId: string, item: ActiveItem) {
    this.useItem.emit({ instructionId, item });
  }

  onSelectItem(instructionId: string, itemId: string, kind: BoardItemKind) {
    this.selectItem.emit({ instructionId, itemId, kind });
  }

  trackBy(_: number, item: BoardInstruction): string {
    return item.id;
  }
}

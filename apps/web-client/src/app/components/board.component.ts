import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { ActiveItem, BoardInstruction, BoardItemKind, Option } from '../utils';
import { RowComponent } from './row.component';

export const BOARD_SIZE = 8000;

@Pipe({
  name: 'pgBoardItemDropLists',
  standalone: true,
})
export class BoardItemDropListsPipe implements PipeTransform {
  transform(value: BoardInstruction[], kind: BoardItemKind): string[] {
    return value.map(({ id }) => `${id}-${kind}`);
  }
}

@Component({
  selector: 'pg-board',
  template: `
    <div
      [ngStyle]="{ width: boardSize + 'px' }"
      (mouseover)="isHovered = true"
      (mouseout)="isHovered = false"
    >
      <pg-row
        *ngFor="let instruction of instructions; trackBy: trackBy"
        [active]="active"
        [instruction]="instruction"
        [documentsDropLists]="instructions | pgBoardItemDropLists: 'document'"
        [tasksDropLists]="instructions | pgBoardItemDropLists: 'task'"
        (useItem)="onUseItem(instruction.id, $event)"
        (selectItem)="onSelectItem(instruction.id, $event.itemId, $event.kind)"
        (moveDocument)="
          onMoveDocument(instruction.id, $event.previousIndex, $event.newIndex)
        "
        (transferDocument)="
          onTransferDocument(
            $event.previousInstructionId,
            $event.newInstructionId,
            $event.previousIndex,
            $event.newIndex
          )
        "
        (moveTask)="
          onMoveTask(instruction.id, $event.previousIndex, $event.newIndex)
        "
        (transferTask)="
          onTransferTask(
            $event.previousInstructionId,
            $event.newInstructionId,
            $event.previousIndex,
            $event.newIndex
          )
        "
      >
        <p>row {{ instruction.id }}</p>
      </pg-row>
    </div>
  `,
  standalone: true,
  imports: [RowComponent, CommonModule, BoardItemDropListsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  @Input() instructions: BoardInstruction[] = [];
  @Input() active: Option<ActiveItem> = null;
  @Output() useItem = new EventEmitter<{
    instructionId: string;
    item: ActiveItem;
  }>();
  @Output() selectItem = new EventEmitter<{
    instructionId: string;
    itemId: string;
    kind: BoardItemKind;
  }>();
  @Output() moveDocument = new EventEmitter<{
    instructionId: string;
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() transferDocument = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() moveTask = new EventEmitter<{
    instructionId: string;
    previousIndex: number;
    newIndex: number;
  }>();
  @Output() transferTask = new EventEmitter<{
    previousInstructionId: string;
    newInstructionId: string;
    previousIndex: number;
    newIndex: number;
  }>();
  readonly boardSize = BOARD_SIZE;
  isHovered = false;

  onUseItem(instructionId: string, item: ActiveItem) {
    this.useItem.emit({ instructionId, item });
  }

  onSelectItem(instructionId: string, itemId: string, kind: BoardItemKind) {
    this.selectItem.emit({ instructionId, itemId, kind });
  }

  onMoveDocument(
    instructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    this.moveDocument.emit({
      instructionId,
      previousIndex,
      newIndex,
    });
  }

  onTransferDocument(
    previousInstructionId: string,
    newInstructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    this.transferDocument.emit({
      previousInstructionId,
      newInstructionId,
      previousIndex,
      newIndex,
    });
  }

  onMoveTask(instructionId: string, previousIndex: number, newIndex: number) {
    this.moveTask.emit({
      instructionId,
      previousIndex,
      newIndex,
    });
  }

  onTransferTask(
    previousInstructionId: string,
    newInstructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    this.transferTask.emit({
      previousInstructionId,
      newInstructionId,
      previousIndex,
      newIndex,
    });
  }

  trackBy(_: number, item: BoardInstruction): string {
    return item.id;
  }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Item } from '../utils';
import { DockComponent } from './dock.component';
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
        *ngFor="let instruction of instructions"
        [active]="active"
        [documents]="instruction.documents"
        [tasks]="instruction.tasks"
        (useActive)="onUse(instruction.id)"
      >
        <p>row {{ instruction.id }}</p>
      </pg-row>
    </div>
  `,
  standalone: true,
  imports: [RowComponent, CommonModule, DockComponent],
})
export class BoardComponent {
  @Input() instructions:
    | { id: number; documents: string[]; tasks: string[] }[]
    | null = null;
  @Input() active: Item | null = null;
  @Output() use = new EventEmitter<number>();
  readonly boardSize = BOARD_SIZE;
  isHovered = false;

  onUse(instructionId: number) {
    this.use.emit(instructionId);
  }
}

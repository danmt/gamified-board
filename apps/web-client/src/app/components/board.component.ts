import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

export const BOARD_SIZE = 8000;

@Component({
  selector: 'pg-board',
  template: `
    <div [ngStyle]="{ width: boardSize + 'px' }">
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  readonly boardSize = BOARD_SIZE;
}

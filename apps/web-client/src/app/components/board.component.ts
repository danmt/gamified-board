import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavigationWrapperComponent } from './navigation-wrapper.component';

export const BOARD_SIZE = 8000;

@Component({
  selector: 'pg-board',
  template: `
    <pg-navigation-wrapper zPosition="z-30"></pg-navigation-wrapper>
    <div [ngStyle]="{ width: boardSize + 'px' }">
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, NavigationWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  readonly boardSize = BOARD_SIZE;
}

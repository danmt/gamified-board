import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';

@Component({
  selector: 'pg-row',
  template: `
    <div
      class="text-2xl text-white uppercase relative h-full flex gap-4 border-2"
      [ngClass]="{ 'border-blue-500': pgIsHovered }"
    >
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowComponent {
  @Input() pgIsHovered = false;

  @HostBinding('class') class = 'block h-64 bg-bp-bricks';

  trackBy(index: number): number {
    return index;
  }
}

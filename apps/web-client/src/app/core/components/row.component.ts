import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';

@Component({
  selector: 'pg-row',
  template: `
    <div
      class="text-2xl text-white uppercase relative h-full flex gap-4 border-2 hover:border-blue-500"
    >
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowComponent {
  @HostBinding('class') class = 'block h-64 bg-bp-bricks';

  trackBy(index: number): number {
    return index;
  }
}

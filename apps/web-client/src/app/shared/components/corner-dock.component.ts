import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { isNotNull, Option } from '../utils';

export type DockDirection = 'right' | 'left';

@Component({
  selector: 'pg-corner-dock',
  template: `
    <!-- top border design -->
    <div
      class="bp-skin-metal-corner-{{
        oppositeDirection
      }}-top absolute -top-2.5 -{{ oppositeDirection }}-2.5 z-20"
    ></div>
    <div
      class="bp-skin-metal-border-top absolute -top-2.5 w-5/6 {{
        oppositeDirection
      }}-16 {{ direction }}-0 mx-auto my-0 z-10"
    ></div>

    <!-- modal content -->
    <ng-content></ng-content>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class CornerDockComponent {
  @HostBinding('class') class = 'block bp-bg-futuristic relative';

  direction: DockDirection = 'right';
  oppositeDirection: DockDirection = 'left';

  @Input() set pgDirection(value: Option<DockDirection>) {
    if (isNotNull(value)) {
      this._setDirection(value);
    }
  }

  private _setDirection(direction: DockDirection) {
    this.direction = direction;
    this.oppositeDirection = direction === 'left' ? 'right' : 'left';
  }
}

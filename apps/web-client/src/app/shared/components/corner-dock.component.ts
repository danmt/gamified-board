import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostBinding, Input } from '@angular/core';

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
export class CornerDockComponent implements AfterViewInit {
  @HostBinding('class') class = 'block bp-bg-futuristic relative';

  @Input() direction: DockDirection = 'right';
  oppositeDirection: DockDirection = 'left';

  ngAfterViewInit(): void {
    this.oppositeDirection = this.direction === 'left' ? 'right' : 'left';
  }
}

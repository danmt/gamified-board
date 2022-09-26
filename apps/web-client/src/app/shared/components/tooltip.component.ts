import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { Position } from '../utils';

@Component({
  selector: 'pg-tooltip',
  template: `
    <!-- outer corners-->
    <div
      class="bp-skin-outer-mini-metal-corner-left-top absolute left-0 top-0 z-40"
    ></div>
    <div
      class="bp-skin-outer-mini-metal-corner-right-top absolute right-0 top-0 z-40"
    ></div>
    <div
      class="bp-skin-outer-mini-metal-corner-left-bottom absolute left-0 bottom-0 z-50"
    ></div>
    <div
      class="bp-skin-outer-mini-metal-corner-right-bottom absolute right-0 bottom-0 z-50"
    ></div>

    <!-- outer borders-->
    <div
      class="bp-skin-outer-mini-metal-border-right absolute right-0 top-0 bottom-0 my-auto mx-0 z-30 rounded-2x tooltip-boards-heigh"
    ></div>
    <div
      class="bp-skin-outer-mini-metal-border-left absolute left-0  top-0 bottom-0 my-auto mx-0 z-30 rounded-2xl tooltip-boards-heigh"
    ></div>
    <div
      class="bp-skin-outer-mini-metal-border-top absolute top-0 w-5/6 left-0 right-0 mx-auto my-0 z-30 rounded-2xl"
    ></div>
    <div
      class="bp-skin-outer-mini-metal-border-bottom absolute bottom-0 w-5/6 left-0 right-0 mx-auto my-0 z-30 rounded-2xl"
    ></div>

    <!-- modal content -->
    <div class="z-20 relative">
      <header class="p-2 bg-white bg-opacity-10">
        <ng-content select="[pgTooltipHeader]"></ng-content>
      </header>

      <section>
        <ng-content select="[pgTooltipContent]"></ng-content>
      </section>

      <footer>
        <ng-content select="[pgTooltipFooter]"></ng-content>
      </footer>

      <div
        *ngIf="pgPosition === 'right'"
        class="absolute -left-8 -translate-y-1/2 top-1/2  w-4 h-4 -rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#565656">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'left'"
        class="absolute -right-8 -translate-y-1/2 top-1/2  w-4 h-4 rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#565656">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'top'"
        class="absolute -bottom-8 -translate-x-1/2 left-1/2  w-4 h-4 rotate-180"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#565656">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'bottom'"
        class="absolute -top-8 -translate-x-1/2 left-1/2  w-4 h-4 rotate"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#565656">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
  exportAs: 'tooltip',
})
export class TooltipComponent {
  @HostBinding('class') class =
    'bp-bg-green-texture block text-white p-4 rounded-[30px]';
  @Input() pgPosition: Position = 'left';
}

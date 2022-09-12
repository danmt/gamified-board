import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';

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
      class="bp-skin-outer-mini-metal-border-right absolute right-0 h-5/6 top-0 bottom-0 my-auto mx-0 z-30 rounded-2xl"
    ></div>
    <div
      class="bp-skin-outer-mini-metal-border-left absolute left-0 h-5/6 top-0 bottom-0 my-auto mx-0 z-30 rounded-2xl"
    ></div>
    <div
      class="bp-skin-outer-mini-metal-border-top absolute top-0 w-5/6 left-0 right-0 mx-auto my-0 z-30 rounded-2xl"
    ></div>
    <div
      class="bp-skin-outer-mini-metal-border-bottom absolute bottom-0 w-5/6 left-0 right-0 mx-auto my-0 z-30 rounded-2xl"
    ></div>

    <!-- modal content -->
    <div class="z-20 relative">
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class TooltipComponent {
  @HostBinding('class') class =
    'bp-bg-futuristic block text-white p-4 rounded-[30px]';
}

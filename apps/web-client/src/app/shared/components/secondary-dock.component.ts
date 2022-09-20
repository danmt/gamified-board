import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'pg-secondary-dock',
  template: `
    <!-- corners-->
    <div
      class="bp-skin-outer-metal-corner-left-top absolute -left-5 -top-4 z-30"
    ></div>
    <div
      class="bp-skin-outer-metal-corner-right-top absolute -right-5 -top-4 z-30"
    ></div>

    <!-- borders -->
    <div
      class="bp-skin-outer-metal-border-top absolute -top-4 w-[70%] left-0 right-0 mx-auto my-0 z-20"
    ></div>
    <div
      class="bp-skin-outer-metal-border-right absolute -right-5 h-5/6 top-10 bottom-0 my-auto mx-0 z-20"
    ></div>
    <div
      class="bp-skin-outer-metal-border-left absolute -left-5 h-5/6 top-10 bottom-0 my-auto mx-0 z-20"
    ></div>

    <!-- modal content -->
    <div class="z-50 w-full relative">
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class SecondaryDockComponent {
  @HostBinding('class') class =
    'p-10 pb-5 bp-bg-yellow-texture relative rounded-t-[35px]';
}

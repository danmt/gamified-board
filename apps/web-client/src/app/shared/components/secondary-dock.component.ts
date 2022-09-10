import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';

export type DockDirection = 'right' | 'left';

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
    <div
      class="bp-skin-dock-detail-left absolute -bottom-2.5 z-40 -left-8"
    ></div>
    <div
      class="bp-skin-dock-detail-right absolute -bottom-2.5 z-40 -right-10"
    ></div>

    <!-- borders -->
    <div
      class="bp-skin-outer-metal-border-top absolute -top-4 w-5/6 left-0 right-0 mx-auto my-0 z-20"
    ></div>
    <div
      class="bp-skin-outer-metal-border-right absolute -right-5 h-4/6 top-0 bottom-0 my-auto mx-0 z-20"
    ></div>
    <div
      class="bp-skin-outer-metal-border-left absolute -left-5 h-4/6 top-0 bottom-0 my-auto mx-0 z-20"
    ></div>

    <!-- modal content -->
    <ng-content></ng-content>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class SecondaryDockComponent {
  @HostBinding('class') class = 'p-10 bp-bg-futuristic relative rounded-[35px]';
}

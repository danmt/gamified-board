import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'pg-left-corner-dock',
  template: `
    <!-- top border design -->
    <div
      class="bp-skin-metal-corner-right-top absolute -top-2.5 -right-2.5 z-20"
    ></div>
    <div
      class="bp-skin-metal-border-top absolute -top-2.5 w-5/6 right-16 left-0 mx-auto my-0 z-10"
    ></div>

    <!-- modal content -->
    <ng-content></ng-content>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class LeftDockComponent {
  @HostBinding('class') class = 'block bp-bg-futuristic relative';
}

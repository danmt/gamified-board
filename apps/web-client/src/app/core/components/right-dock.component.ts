import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'pg-right-corner-dock',
  template: `
    <!-- top border design -->
    <div
      class="bp-skin-metal-corner-left-top absolute -top-2.5 -left-2.5 z-20"
    ></div>
    <div
      class="bp-skin-metal-border-top absolute -top-2.5 w-5/6 left-16 right-0 mx-auto my-0 z-10"
    ></div>

    <!-- modal content -->
    <ng-content></ng-content>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class RightDockComponent {
  @HostBinding('class') class = 'block bp-bg-futuristic relative';
}

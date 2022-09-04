import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'pg-modal',
  template: `
    <!-- corners-->
    <div
      class="bp-skin-metal-corner-left-top absolute -left-4 -top-4 z-20"
    ></div>
    <div
      class="bp-skin-metal-corner-right-top absolute -right-4 -top-4 z-20"
    ></div>
    <div
      class="bp-skin-metal-corner-left-bottom absolute -left-4 -bottom-4 z-20"
    ></div>
    <div
      class="bp-skin-metal-corner-right-bottom absolute -right-4 -bottom-4 z-20"
    ></div>

    <!-- borders -->
    <div
      class="bp-skin-metal-border-right absolute -right-4 h-5/6 top-0 bottom-0 my-auto mx-0 z-10"
    ></div>
    <div
      class="bp-skin-metal-border-left absolute -left-4 h-5/6 top-0 bottom-0 my-auto mx-0 z-10"
    ></div>
    <div
      class="bp-skin-metal-border-bottom absolute -bottom-4 w-5/6 left-0 right-0 mx-auto my-0 z-10"
    ></div>
    <div
      class="bp-skin-metal-border-top absolute -top-4 w-5/6 left-0 right-0 mx-auto my-0 z-10"
    ></div>

    <!-- modal content -->
    <ng-content></ng-content>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class ModalComponent {
  @HostBinding('class') class =
    'px-6 pt-8 pb-4 block bp-bg-futuristic shadow-xl text-white relative';
}

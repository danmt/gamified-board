import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Output } from '@angular/core';

@Component({
  selector: 'pg-modal',
  template: `
    <!-- close button -->
    <button
      class="bp-button-close-futuristic outline-0 absolute right-2.5 top-5 z-40"
      (click)="onClose()"
    ></button>

    <!-- outer corners-->
    <div
      class="bp-skin-outer-metal-corner-left-top absolute -left-5 -top-4 z-30"
    ></div>
    <div
      class="bp-skin-outer-metal-corner-right-top absolute -right-5 -top-4 z-30"
    ></div>
    <div
      class="bp-skin-outer-metal-corner-left-bottom absolute -left-5 -bottom-4 z-50"
    ></div>
    <div
      class="bp-skin-outer-metal-corner-right-bottom absolute -right-5 -bottom-4 z-50"
    ></div>

    <!-- outer borders -->
    <div
      class="bp-skin-outer-metal-border-right absolute -right-5 h-5/6 top-0 bottom-0 my-auto mx-0 z-50"
    ></div>
    <div
      class="bp-skin-outer-metal-border-left absolute -left-5 h-5/6 top-0 bottom-0 my-auto mx-0 z-50"
    ></div>
    <div
      class="bp-skin-outer-metal-border-bottom absolute -bottom-4 w-5/6 left-0 right-0 mx-auto my-0 z-50"
    ></div>
    <div
      class="bp-skin-outer-metal-border-top absolute -top-4 w-5/6 left-0 right-0 mx-auto my-0 z-20"
    ></div>

    <!-- modal content -->
    <div class="z-30 w-full relative">
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class ModalComponent {
  @HostBinding('class') class =
    'flex bp-bg-futuristic shadow-xl relative min-h-[350px] min-w-[450px] px-12 pt-14 box-border rounded-[35px]';

  @Output() pgCloseModal = new EventEmitter();

  onClose() {
    this.pgCloseModal.emit();
  }
}

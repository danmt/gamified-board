import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Output } from '@angular/core';

@Component({
  selector: 'pg-modal',
  template: `
    <!-- top detail -->
    <div
      class="bp-skin-metal-top-detail absolute -top-3 left-0 right-0 mx-auto z-20"
    ></div>

    <!-- left detail -->
    <div
      class="bp-skin-metal-left-detail absolute -left-20 top-0 bottom-0 my-auto z-40"
    ></div>

    <!-- right detail -->
    <div
      class="bp-skin-metal-right-detail absolute -right-20 top-0 bottom-0 my-auto z-40"
    ></div>

    <!-- bottom detail -->
    <div
      class="bp-skin-metal-bottom-detail absolute -bottom-2.5 left-0 right-0 mx-auto z-50"
    ></div>

    <!-- close button -->
    <button
      class="bp-button-close-futuristic outline-0 absolute right-2.5 top-5 z-40"
      (click)="onClose()"
    ></button>

    <!-- outer corners-->
    <div
      class="bp-skin-outer-metal-corner-left-top absolute -left-10 -top-8 z-30"
    ></div>
    <div
      class="bp-skin-outer-metal-corner-right-top absolute -right-10 -top-8 z-30"
    ></div>
    <div
      class="bp-skin-outer-metal-corner-left-bottom absolute -left-10 -bottom-8 z-50"
    ></div>
    <div
      class="bp-skin-outer-metal-corner-right-bottom absolute -right-10 -bottom-8 z-50"
    ></div>

    <!-- outer borders -->
    <div
      class="bp-skin-outer-metal-border-right absolute -right-10 h-5/6 top-0 bottom-0 my-auto mx-0 z-50"
    ></div>
    <div
      class="bp-skin-outer-metal-border-left absolute -left-10 h-5/6 top-0 bottom-0 my-auto mx-0 z-50"
    ></div>
    <div
      class="bp-skin-outer-metal-border-bottom absolute -bottom-8 w-5/6 left-0 right-0 mx-auto my-0 z-50"
    ></div>
    <div
      class="bp-skin-outer-metal-border-top absolute -top-8 w-5/6 left-0 right-0 mx-auto my-0 z-20"
    ></div>

    <!-- inner corners -->
    <div
      class="bp-skin-inner-metal-corner-left-top absolute -left-8 -top-6 z-10"
    ></div>
    <div
      class="bp-skin-inner-metal-corner-right-top absolute -right-8 -top-6 z-10"
    ></div>
    <div
      class="bp-skin-inner-metal-corner-left-bottom absolute -left-8 -bottom-6 z-40"
    ></div>
    <div
      class="bp-skin-inner-metal-corner-right-bottom absolute -right-8 -bottom-6 z-40"
    ></div>

    <!-- inner borders -->
    <div
      class="bp-skin-inner-metal-border-right absolute -right-6 h-5/6 top-0 bottom-0 my-auto mx-0"
    ></div>
    <div
      class="bp-skin-inner-metal-border-left absolute -left-6 h-5/6 top-0 bottom-0 my-auto mx-0"
    ></div>
    <div
      class="bp-skin-inner-metal-border-bottom absolute -bottom-4 w-5/6 left-0 right-0 mx-auto my-0"
    ></div>
    <div
      class="bp-skin-inner-metal-border-top absolute -top-4 w-5/6 left-0 right-0 mx-auto my-0"
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
    'flex bp-bg-futuristic shadow-xl relative min-h-[350px] min-w-[450px] px-12 pt-14 box-border';

  @Output() pgCloseModal = new EventEmitter();

  onClose() {
    this.pgCloseModal.emit();
  }
}

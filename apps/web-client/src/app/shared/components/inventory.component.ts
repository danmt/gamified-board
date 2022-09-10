import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { isNotNull, Option } from '../utils';

export type InventoryDirection = 'left' | 'right';

@Component({
  selector: 'pg-inventory',
  template: `
    <!-- right detail -->
    <div
      class="bp-skin-metal-{{ oppositeDirection }}-detail absolute {{
        oppositeDirection === 'right' ? '-right-20' : '-left-20'
      }} top-0 bottom-0 my-auto z-40"
    ></div>

    <!-- top border design -->
    <div
      class="bp-skin-outer-metal-corner-{{ oppositeDirection }}-top absolute {{
        oppositeDirection === 'right' ? '-right-10' : '-left-10'
      }}  -top-8 z-30"
    ></div>
    <div
      class="bp-skin-outer-metal-border-top absolute -top-8 w-10/12 {{
        oppositeDirection === 'right' ? '-left-6' : '-right-6'
      }} {{
        oppositeDirection === 'right' ? 'right-0' : 'left-0'
      }} mx-auto my-0 z-20"
    ></div>
    <div
      class="bp-skin-inner-metal-corner-{{ oppositeDirection }}-top absolute {{
        oppositeDirection === 'right' ? '-right-8' : '-left-8'
      }} -top-6 z-10"
    ></div>
    <div
      class="bp-skin-inner-metal-border-top absolute -top-4 w-10/12 {{
        oppositeDirection === 'right' ? '-left-6' : '-right-6'
      }} {{
        oppositeDirection === 'right' ? 'right-0' : 'left-0'
      }} mx-auto my-0"
    ></div>

    <!-- side border design -->
    <div
      class="bp-skin-outer-metal-border-{{ oppositeDirection }} absolute {{
        oppositeDirection === 'right' ? '-right-10' : '-left-10'
      }} h-5/6 top-0 bottom-0 my-auto mx-0 z-50"
    ></div>
    <div
      class="bp-skin-inner-metal-border-{{ oppositeDirection }} absolute {{
        oppositeDirection === 'right' ? '-right-6' : '-left-6'
      }} h-3/5 top-0 bottom-0 my-auto mx-0"
    ></div>

    <!-- bottom border design -->
    <div
      class="bp-skin-outer-metal-corner-{{
        oppositeDirection
      }}-bottom absolute {{
        oppositeDirection === 'right' ? '-right-10' : '-left-10'
      }} -bottom-8 z-50"
    ></div>
    <div
      class="bp-skin-outer-metal-border-bottom absolute -bottom-8 w-10/12 {{
        oppositeDirection === 'right' ? '-left-6' : '-right-6'
      }} {{
        oppositeDirection === 'right' ? 'right-0' : 'left-0'
      }} mx-auto my-0 z-40"
    ></div>
    <div
      class="bp-skin-inner-metal-corner-{{
        oppositeDirection
      }}-bottom absolute {{
        oppositeDirection === 'right' ? '-right-8' : '-left-8'
      }} -bottom-6 z-30"
    ></div>
    <div
      class="bp-skin-inner-metal-border-bottom absolute -bottom-4 w-10/12 {{
        oppositeDirection === 'right' ? '-left-6' : '-right-6'
      }} {{
        oppositeDirection === 'right' ? 'right-0' : 'left-0'
      }} mx-auto my-0"
    ></div>

    <!-- section content -->
    <header class="relative h-[80px]">
      <div
        class="flex relative w-full bp-skin-title-box items-center justify-between pl-6 pr-8 mr-1.5"
      >
        <ng-content select="[pgInventoryTitle]"></ng-content>
        <div class="z-50">
          <ng-content select="[pgInventoryCreateButton]"></ng-content>
        </div>
      </div>
    </header>

    <section
      class="max-w-[280px] p-4 flex flex-col gap-2 flex-1 self-center z-50 pb-8"
    >
      <div class="flex-1">
        <ng-content select="[pgInventoryBody]"></ng-content>
      </div>

      <div class="flex justify-center gap-4">
        <button
          class="bp-skin-navigation-left-arrow"
          (click)="onPreviousPage()"
          [disabled]="pgPage === 1"
        ></button>
        <button
          class="bp-skin-navigation-right-arrow"
          (click)="onNextPage()"
          [disabled]="pgPageSize * pgPage >= pgTotal"
        ></button>
      </div>
    </section>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class InventoryComponent {
  @HostBinding('class') class = 'flex flex-col relative z-40 bp-bg-futuristic';

  @Input() pgPageSize = 24;
  @Input() pgPage = 1;
  @Input() pgTotal = 0;
  @Output() pgSetPage = new EventEmitter<number>();

  direction: InventoryDirection = 'right';
  oppositeDirection: InventoryDirection = 'left';

  @Input() set pgDirection(value: Option<InventoryDirection>) {
    if (isNotNull(value)) {
      this._setDirection(value);
    }
  }

  private _setDirection(direction: InventoryDirection) {
    this.direction = direction;
    this.oppositeDirection = direction === 'left' ? 'right' : 'left';
  }

  onPreviousPage() {
    this.pgSetPage.emit(this.pgPage - 1);
  }

  onNextPage() {
    this.pgSetPage.emit(this.pgPage + 1);
  }
}

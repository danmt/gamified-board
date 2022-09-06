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
    <!-- top border design -->
    <div
      class="bp-skin-metal-corner-{{
        oppositeDirection
      }}-top absolute -top-2.5 -{{ oppositeDirection }}-2.5 z-20"
    ></div>
    <div
      class="bp-skin-metal-border-top absolute -top-2.5 w-5/6 {{
        oppositeDirection
      }}-16 {{ direction }}-0 mx-auto my-0 z-10"
    ></div>
    <div
      class="bp-skin-detail-{{ direction }}  absolute -top-3 z-20 {{
        direction
      }}-0"
    ></div>

    <!-- side border design -->
    <div
      class="bp-skin-metal-border-{{ oppositeDirection }} absolute -{{
        oppositeDirection
      }}-2.5 h-5/6 top-0 bottom-0 my-auto mx-0 z-10"
    ></div>

    <!-- bottom border design -->
    <div
      class="bp-skin-metal-corner-{{
        oppositeDirection
      }}-bottom absolute -bottom-2.5 -{{ oppositeDirection }}-2.5 z-20"
    ></div>
    <div
      class="bp-skin-metal-border-bottom absolute -bottom-2.5 w-5/6 {{
        oppositeDirection
      }}-16 {{ direction }}-0 mx-auto my-0 z-10"
    ></div>
    <div
      class="bp-skin-detail-{{ direction }}  absolute -bottom-4 z-20 {{
        direction
      }}-0"
    ></div>

    <!-- section content -->

    <header class="relative h-[80px]">
      <div
        class="flex relative w-full bp-skin-title-box items-center justify-between pl-6 pr-8 mr-1.5"
      >
        <ng-content select="[pgInventoryTitle]"></ng-content>
        <ng-content select="[pgInventoryCreateButton]"></ng-content>
      </div>
    </header>

    <section class="max-w-[280px] p-4 flex flex-col gap-2 flex-1">
      <div class="flex-1">
        <ng-content select="[pgInventoryBody]"></ng-content>
      </div>

      <div class="flex justify-center gap-2">
        <button (click)="onPreviousPage()" [disabled]="pgPage === 1">
          previous
        </button>
        <button
          (click)="onNextPage()"
          [disabled]="pgPageSize * pgPage >= pgTotal"
        >
          next
        </button>
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

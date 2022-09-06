import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostBinding, Input } from '@angular/core';

export enum InventoryDirection {
  left = 'left',
  right = 'right',
}

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
    <ng-content></ng-content>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class InventoryComponent implements AfterViewInit {
  @HostBinding('class') class = 'flex flex-col relative z-40 bp-bg-futuristic';

  @Input() direction: InventoryDirection = InventoryDirection.right;
  oppositeDirection: InventoryDirection = InventoryDirection.left;

  ngAfterViewInit(): void {
    this.oppositeDirection =
      this.direction === InventoryDirection.left
        ? InventoryDirection.right
        : InventoryDirection.left;
  }
}

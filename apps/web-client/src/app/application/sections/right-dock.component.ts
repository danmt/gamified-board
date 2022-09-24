import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
  CornerDockComponent,
  SquareButtonComponent,
} from '../../shared/components';
import { KeyListenerDirective } from '../../shared/directives';

@Component({
  selector: 'pg-right-dock',
  template: `
    <pg-corner-dock
      class="pt-4 pb-2 pr-6 pl-12 flex gap-4 justify-center items-start text-white bp-font-game"
      pgDirection="right"
    >
      <!-- section content -->
      <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
          style="font-size: 0.5rem; line-height: 0.5rem"
          pgKeyListener="Comma"
          (pgKeyDown)="onActivateField()"
        >
          ,
        </span>

        <pg-square-button
          pgThumbnailUrl="assets/generic/instruction.png"
          (click)="onActivateField()"
        ></pg-square-button>
      </div>

      <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
          style="font-size: 0.5rem; line-height: 0.5rem"
          pgKeyListener="Period"
          (pgKeyDown)="onToggleApplicationsInventoryModal()"
        >
          .
        </span>

        <pg-square-button
          pgThumbnailUrl="assets/generic/instruction.png"
          (click)="onToggleApplicationsInventoryModal()"
        ></pg-square-button>
      </div>
    </pg-corner-dock>
  `,
  standalone: true,
  imports: [
    CommonModule,
    SquareButtonComponent,
    CornerDockComponent,
    KeyListenerDirective,
  ],
})
export class RightDockComponent {
  @Output() pgActivateField = new EventEmitter();
  @Output() pgToggleApplicationsInventoryModal = new EventEmitter();

  onActivateField() {
    this.pgActivateField.emit();
  }

  onToggleApplicationsInventoryModal() {
    this.pgToggleApplicationsInventoryModal.emit();
  }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
  CornerDockComponent,
  SquareButtonComponent,
} from '../../shared/components';
import { KeyListenerDirective } from '../../shared/directives';

@Component({
  selector: 'pg-left-dock',
  template: `
    <pg-corner-dock
      class="pt-4 pb-2 pl-6 pr-12  flex gap-4 justify-center items-start text-white bp-font-game"
      pgDirection="left"
    >
      <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
          style="font-size: 0.5rem; line-height: 0.5rem"
          pgKeyListener="KeyZ"
          (pgKeyDown)="onToggleCollectionsInventoryModal()"
        >
          z
        </span>

        <pg-square-button
          pgThumbnailUrl="assets/generic/collection.png"
          (click)="onToggleCollectionsInventoryModal()"
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
export class LeftDockComponent {
  @Output() pgToggleCollectionsInventoryModal = new EventEmitter();

  onToggleCollectionsInventoryModal() {
    this.pgToggleCollectionsInventoryModal.emit();
  }
}

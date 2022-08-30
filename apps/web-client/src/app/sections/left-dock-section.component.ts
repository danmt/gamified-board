import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-left-dock-section',
  template: `
    <div
      class="py-4 px-6 bp-bg-futuristic items-start relative text-white bp-font-game"
    >
      <div class="flex absolute -top-4 left-0" style="width: calc(100% + 15px)">
        <div class="bp-skin-metal-border flex-1 z-10"></div>
        <div class="bp-skin-metal-corner-right-top z-10"></div>
      </div>

      <div class="flex gap-4 justify-center text-xl">
        <button class="z-10" (click)="onToggleInstructionsSection()">
          instructions
        </button>
        <button class="z-10" (click)="onToggleApplicationsSection()">
          applications
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      .cdk-drop-list-dragging:hover {
        @apply bg-gray-700;
      }
    `,
  ],
})
export class LeftDockSectionComponent {
  private readonly _boardStore = inject(BoardStore);

  onToggleApplicationsSection() {
    this._boardStore.toggleIsApplicationsSectionOpen();
  }

  onToggleInstructionsSection() {
    this._boardStore.toggleIsInstructionsSectionOpen();
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-left-dock-section',
  template: `
    <div class="p-4 bg-gray-700 flex gap-4 justify-center items-start">
      <button (click)="onToggleInstructionsSection()">instructions</button>

      <button (click)="onToggleApplicationsSection()">applications</button>
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

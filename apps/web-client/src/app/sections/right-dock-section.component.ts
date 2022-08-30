import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-right-dock-section',
  template: `
    <div class="p-4 bg-gray-700 flex gap-4 justify-center items-start">
      right dock

      <button (click)="onToggleSysvarsSection()">sysvars</button>

      <button (click)="onToggleCollectionsSection()">collections</button>
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
export class RightDockSectionComponent {
  private readonly _boardStore = inject(BoardStore);

  onToggleSysvarsSection() {
    this._boardStore.toggleIsSysvarsSectionOpen();
  }

  onToggleCollectionsSection() {
    this._boardStore.toggleIsCollectionsSectionOpen();
  }
}

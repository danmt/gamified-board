import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { SquareButtonComponent } from '../components';
import { KeyboardListenerDirective } from '../directives';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-left-dock-section',
  template: `
    <div
      class="py-4 px-6 bp-bg-futuristic items-start relative text-white bp-font-game"
      pgKeyboardListener
      (pgKeyDown)="onKeyDown($event)"
    >
      <div class="flex absolute -top-4 left-0" style="width: calc(100% + 15px)">
        <div class="bp-skin-metal-border flex-1 z-10"></div>
        <div class="bp-skin-metal-corner-right-top z-10"></div>
      </div>
      <div class="bg-gray-800 relative" style="width: 2.89rem; height: 2.89rem">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          n
        </span>

        <pg-square-button
          [pgIsActive]="(isApplicationsSectionOpen$ | ngrxPush) ?? false"
          pgThumbnailUrl="assets/generic/application.png"
          (click)="onToggleApplicationsSection()"
        ></pg-square-button>
      </div>

      <div class="bg-gray-800 relative" style="width: 2.89rem; height: 2.89rem">
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          m
        </span>

        <pg-square-button
          [pgIsActive]="(isInstructionsSectionOpen$ | ngrxPush) ?? false"
          pgThumbnailUrl="assets/generic/instruction.png"
          (click)="onToggleInstructionsSection()"
        ></pg-square-button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    KeyboardListenerDirective,
    SquareButtonComponent,
  ],
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

  readonly isApplicationsSectionOpen$ =
    this._boardStore.isApplicationsSectionOpen$;
  readonly isInstructionsSectionOpen$ =
    this._boardStore.isInstructionsSectionOpen$;

  onToggleApplicationsSection() {
    this._boardStore.toggleIsApplicationsSectionOpen();
  }

  onToggleInstructionsSection() {
    this._boardStore.toggleIsInstructionsSectionOpen();
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'n': {
        this._boardStore.toggleIsApplicationsSectionOpen();

        break;
      }
      case 'm': {
        this._boardStore.toggleIsInstructionsSectionOpen();

        break;
      }
    }
  }
}

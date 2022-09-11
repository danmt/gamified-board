import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import {
  CornerDockComponent,
  KeyboardListenerDirective,
  SquareButtonComponent,
} from '../../shared';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-right-dock-section',
  template: `
    <pg-corner-dock
      class="pt-4 pb-2 pr-6 pl-12 flex gap-4 justify-center items-start text-white bp-font-game"
      pgKeyboardListener
      (pgKeyDown)="onKeyDown($event)"
      pgDirection="right"
    >
      <!-- section content -->
      <div
        class="bg-gray-800 relative z-30"
        style="width: 2.89rem; height: 2.89rem"
      >
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          ,
        </span>

        <div class="bp-skin-dock-icon-border absolute -top-0.5 -left-0.5"></div>

        <pg-square-button
          *ngrxLet="active$; let active"
          [pgIsActive]="active?.kind === 'signer'"
          pgThumbnailUrl="assets/generic/signer.png"
          (pgActivated)="onActivateSigner()"
        ></pg-square-button>
      </div>

      <div
        class="bg-gray-800 relative z-30"
        style="width: 2.89rem; height: 2.89rem"
      >
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          .
        </span>

        <div class="bp-skin-dock-icon-border absolute -top-0.5 -left-0.5"></div>

        <pg-square-button
          [pgIsActive]="(isCollectionsSectionOpen$ | ngrxPush) ?? false"
          pgThumbnailUrl="assets/generic/collection.png"
          (pgActivated)="onToggleCollectionsSection()"
        ></pg-square-button>
      </div>

      <div
        class="bg-gray-800 relative z-30"
        style="width: 2.89rem; height: 2.89rem"
      >
        <span
          class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase w-3 h-3"
          style="font-size: 0.5rem; line-height: 0.5rem"
        >
          -
        </span>

        <pg-square-button
          [pgIsActive]="(isSysvarsSectionOpen$ | ngrxPush) ?? false"
          pgThumbnailUrl="assets/generic/sysvar.png"
          (pgActivated)="onToggleSysvarsSection()"
        ></pg-square-button>
      </div>
    </pg-corner-dock>
  `,
  standalone: true,
  imports: [
    CommonModule,
    LetModule,
    PushModule,
    KeyboardListenerDirective,
    SquareButtonComponent,
    CornerDockComponent,
  ],
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

  readonly active$ = this._boardStore.active$;
  readonly isSysvarsSectionOpen$ = this._boardStore.isSysvarsSectionOpen$;
  readonly isCollectionsSectionOpen$ =
    this._boardStore.isCollectionsSectionOpen$;

  onActivateSigner() {
    this._boardStore.setActive({ id: 'signer', kind: 'signer' });
  }

  onToggleSysvarsSection() {
    this._boardStore.toggleIsSysvarsSectionOpen();
  }

  onToggleCollectionsSection() {
    this._boardStore.toggleIsCollectionsSectionOpen();
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case ',': {
        this._boardStore.setActive({ id: 'signer', kind: 'signer' });

        break;
      }
      case '.': {
        this._boardStore.toggleIsCollectionsSectionOpen();

        break;
      }
      case '-': {
        this._boardStore.toggleIsSysvarsSectionOpen();

        break;
      }
    }
  }
}

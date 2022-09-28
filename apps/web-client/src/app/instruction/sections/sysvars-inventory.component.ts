import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { InventoryComponent } from '../../shared/components';
import { TooltipComponent } from '../../shared/components/tooltip.component';
import {
  DefaultImageDirective,
  HoveredDirective,
} from '../../shared/directives';

interface Sysvar {
  name: string;
  thumbnailUrl: string;
}

@Component({
  selector: 'pg-sysvars-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[520px] max-h-[520px]"
      pgDirection="right"
    >
      <h2 pgInventoryTitle class="bp-font-game-title text-3xl">Sysvars</h2>

      <div pgInventoryBody class="flex flex-wrap gap-4 justify-center">
        <ng-container *ngFor="let sysvar of sysvars; trackBy: trackBy">
          <button
            class="bg-gray-600 p-0.5 w-11 h-11"
            (click)="onTapSysvar(sysvar)"
            cdkOverlayOrigin
            #trigger="cdkOverlayOrigin"
            pgHovered
            #accountButton="hovered"
          >
            <img
              class="w-full h-full object-cover"
              [src]="sysvar.thumbnailUrl"
              pgDefaultImage="assets/generic/sysvar.png"
            />
          </button>

          <ng-template
            cdkConnectedOverlay
            [cdkConnectedOverlayOrigin]="trigger"
            [cdkConnectedOverlayOpen]="
              (accountButton.isHovered$ | ngrxPush) ?? false
            "
            [cdkConnectedOverlayPositions]="[
              {
                originX: 'start',
                originY: 'center',
                overlayX: 'end',
                overlayY: 'center',
                offsetX: -16
              }
            ]"
          >
            <pg-tooltip
              class="relative"
              style="min-width: 250px; max-width: 350px"
              pgPosition="left"
            >
              <div class="flex gap-2 items-start" pgTooltipHeader>
                <img
                  [src]="sysvar.thumbnailUrl"
                  pgDefaultImage="assets/generic/sysvar.png"
                  class="w-12 h-10 object-cover"
                />

                <h3 class="uppercase text-xl">
                  {{ sysvar.name }}
                </h3>
              </div>
            </pg-tooltip>
          </ng-template>
        </ng-container>
      </div>
    </pg-inventory>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    OverlayModule,
    HoveredDirective,
    RouterModule,
    DefaultImageDirective,
    InventoryComponent,
    TooltipComponent,
  ],
})
export class SysvarsInventoryComponent {
  readonly sysvars: Sysvar[] = [
    {
      name: 'rent',
      thumbnailUrl: 'assets/generic/sysvar.png',
    },
    {
      name: 'clock',
      thumbnailUrl: 'assets/generic/sysvar.png',
    },
  ];
  @Output() pgTapSysvar = new EventEmitter<Sysvar>();

  trackBy(index: number): number {
    return index;
  }

  onTapSysvar(account: Sysvar) {
    this.pgTapSysvar.emit(account);
  }
}

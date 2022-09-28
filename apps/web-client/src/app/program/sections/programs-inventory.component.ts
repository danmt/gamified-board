import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PushModule } from '@ngrx/component';
import { InventoryComponent } from '../../shared/components';
import { TooltipComponent } from '../../shared/components/tooltip.component';
import {
  DefaultImageDirective,
  HoveredDirective,
} from '../../shared/directives';
import { generateId, isNotNull } from '../../shared/utils';
import { InstallProgramModalDirective } from '../components';
import { InstallableProgram, Installation, ProgramCheckpoint } from '../utils';

export interface InstallProgramPayload {
  id: string;
  data: ProgramCheckpoint;
}

@Component({
  selector: 'pg-programs-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[520px] max-h-[520px]"
      pgDirection="right"
    >
      <h2 pgInventoryTitle class="bp-font-game-title text-3xl">Programs</h2>

      <div pgInventoryBody id="programs-section">
        <div class="text-white flex justify-center gap-4">
          <button
            (click)="onHideInstallable()"
            [ngClass]="{ underline: showInstalled }"
          >
            Browse
          </button>
          <button
            (click)="onShowInstalled()"
            [ngClass]="{ underline: showInstalled === false }"
          >
            Installed
          </button>
        </div>

        <div class="flex flex-wrap gap-4 justify-center">
          <ng-container *ngIf="!showInstalled">
            <div
              *ngFor="let program of pgInstallablePrograms; trackBy: trackBy"
              class="relative"
            >
              <button
                class="bg-gray-600 p-0.5 w-11 h-11"
                pgInstallProgramModal
                [pgInstallableProgram]="program"
                (pgInstallProgram)="
                  onInstallProgram(program, $event.checkpoint)
                "
                cdkOverlayOrigin
                #trigger="cdkOverlayOrigin"
                pgHovered
                #accountButton="hovered"
              >
                <img
                  class="w-full h-full object-cover"
                  [src]="program.data.thumbnailUrl"
                  pgDefaultImage="assets/generic/program.png"
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
                      [src]="program.data.thumbnailUrl"
                      pgDefaultImage="assets/generic/program.png"
                      class="w-12 h-10 object-cover"
                    />

                    <h3 class="uppercase text-xl">
                      {{ program.data.name }}
                    </h3>
                  </div>
                </pg-tooltip>
              </ng-template>
            </div>
          </ng-container>

          <ng-container *ngIf="showInstalled">
            <ng-container
              *ngFor="let installation of pgInstallations; trackBy: trackBy"
            >
              <button
                class="bg-gray-600 p-0.5 w-11 h-11"
                (click)="onTapInstallation(installation)"
                cdkOverlayOrigin
                #trigger="cdkOverlayOrigin"
                pgHovered
                #accountButton="hovered"
              >
                <img
                  class="w-full h-full object-cover"
                  [src]="installation.data.graph.data.thumbnailUrl"
                  pgDefaultImage="assets/generic/program.png"
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
                      [src]="installation.data.graph.data.thumbnailUrl"
                      pgDefaultImage="assets/generic/program.png"
                      class="w-12 h-10 object-cover"
                    />

                    <h3 class="uppercase text-xl">
                      {{ installation.data.graph.data.name }}
                    </h3>
                  </div>
                </pg-tooltip>
              </ng-template>
            </ng-container>
          </ng-container>
        </div>
      </div>
    </pg-inventory>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    OverlayModule,
    RouterModule,
    DefaultImageDirective,
    TooltipComponent,
    HoveredDirective,
    InventoryComponent,
    InstallProgramModalDirective,
  ],
})
export class ProgramsInventoryComponent {
  @Input() pgInstallations: Installation[] = [];
  @Input() pgInstallablePrograms: InstallableProgram[] = [];
  @Output() pgInstallProgram = new EventEmitter<InstallProgramPayload>();
  @Output() pgTapInstallation = new EventEmitter<Installation>();

  showInstalled = false;

  trackBy(index: number): number {
    return index;
  }

  onInstallProgram(program: InstallableProgram, checkpointId: string) {
    const checkpoint =
      program.checkpoints.find(
        (checkpoint) => checkpoint.id === checkpointId
      ) ?? null;

    if (isNotNull(checkpoint)) {
      this.pgInstallProgram.emit({ id: generateId(), data: checkpoint });
    }
  }

  onShowInstalled() {
    this.showInstalled = true;
  }

  onHideInstallable() {
    this.showInstalled = false;
  }

  onTapInstallation(installation: Installation) {
    this.pgTapInstallation.next(installation);
  }
}

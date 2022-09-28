import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { Instruction } from '../../program/utils';
import { InventoryComponent } from '../../shared/components';
import { TooltipComponent } from '../../shared/components/tooltip.component';
import {
  DefaultImageDirective,
  HoveredDirective,
} from '../../shared/directives';

@Component({
  selector: 'pg-instructions-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[520px] max-h-[520px]"
      pgDirection="left"
    >
      <h2 pgInventoryTitle class="bp-font-game-title text-3xl">Instructions</h2>

      <div pgInventoryBody>
        <div class="flex flex-wrap gap-4 justify-center">
          <ng-container
            *ngFor="let instruction of pgInstructions; trackBy: trackBy"
          >
            <button
              class="bg-gray-600 p-0.5 w-11 h-11"
              (click)="onTapInstruction(instruction)"
              cdkOverlayOrigin
              #trigger="cdkOverlayOrigin"
              pgHovered
              #instructionButton="hovered"
            >
              <img
                class="w-full h-full object-cover"
                [src]="instruction.data.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction.png"
              />
            </button>

            <ng-template
              cdkConnectedOverlay
              [cdkConnectedOverlayOrigin]="trigger"
              [cdkConnectedOverlayOpen]="
                (instructionButton.isHovered$ | ngrxPush) ?? false
              "
              [cdkConnectedOverlayPositions]="[
                {
                  originX: 'end',
                  originY: 'center',
                  overlayX: 'start',
                  overlayY: 'center',
                  offsetX: 16
                }
              ]"
            >
              <pg-tooltip
                class="relative"
                style="min-width: 250px; max-width: 350px"
                pgPosition="right"
              >
                <div class="flex gap-2 items-start" pgTooltipHeader>
                  <img
                    [src]="instruction.data.thumbnailUrl"
                    pgDefaultImage="assets/generic/instruction.png"
                    class="w-12 h-10 object-cover"
                  />

                  <h3 class="uppercase text-xl">
                    {{ instruction.data.name }}
                  </h3>
                </div>

                <ng-container pgTooltipContent>
                  <div class="p-2">
                    <p class="uppercase">Attributes</p>

                    <section class="flex gap-2 flex-wrap">
                      <article
                        *ngFor="let field of instruction.fields"
                        class="border border-slate-900 p-1"
                      >
                        <p class="text-sm font-bold">{{ field.data.name }}</p>
                        <p class="text-xs">{{ field.data.type }}</p>
                      </article>
                    </section>
                  </div>
                </ng-container>
              </pg-tooltip>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </pg-inventory>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    RouterModule,
    DefaultImageDirective,
    HoveredDirective,
    InventoryComponent,
    TooltipComponent,
    OverlayModule,
  ],
})
export class InstructionsInventoryComponent {
  @Input() pgInstructions: Instruction[] = [];
  @Output() pgTapInstruction = new EventEmitter<Instruction>();

  trackBy(index: number): number {
    return index;
  }

  onTapInstruction(account: Instruction) {
    this.pgTapInstruction.emit(account);
  }
}

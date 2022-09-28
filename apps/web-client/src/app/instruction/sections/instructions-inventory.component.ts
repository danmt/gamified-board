import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  HostListener,
  inject,
  Input,
  OnDestroy,
  Output,
  ViewContainerRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { Subject, Subscription } from 'rxjs';
import { Instruction } from '../../program/utils';
import { InventoryComponent } from '../../shared/components';
import { TooltipComponent } from '../../shared/components/tooltip.component';
import {
  DefaultImageDirective,
  HoveredDirective,
} from '../../shared/directives';
import { isNotNull, isNull, Option } from '../../shared/utils';

export const openInstructionsInventory = (
  overlay: Overlay,
  viewContainerRef: ViewContainerRef,
  instructions: Instruction[]
) => {
  const overlayRef = overlay.create({
    positionStrategy: overlay
      .position()
      .global()
      .centerVertically()
      .left('0px'),
    scrollStrategy: overlay.scrollStrategies.close(),
  });
  const componentRef = overlayRef.attach(
    new ComponentPortal(InstructionsInventoryComponent, viewContainerRef)
  );
  componentRef.setInput('pgInstructions', instructions);

  return { componentRef, overlayRef };
};

@Directive({
  selector: '[pgInstructionsInventory]',
  standalone: true,
  exportAs: 'modal',
})
export class InstructionsInventoryDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private _overlayRef: Option<OverlayRef> = null;
  private _isOpen = false;
  private _tapInstructionSubscription: Option<Subscription> = null;

  private readonly _tapInstruction = new Subject<Instruction>();

  @Input() pgInstructions: Instruction[] = [];
  @Output() pgTapInstruction = this._tapInstruction.asObservable();

  @HostListener('click') onClick() {
    this.open();
  }

  ngOnDestroy() {
    this.close();
  }

  open() {
    if (isNull(this._overlayRef) && !this._isOpen) {
      this._isOpen = true;
      const { overlayRef, componentRef } = openInstructionsInventory(
        this._overlay,
        this._viewContainerRef,
        this.pgInstructions
      );

      this._overlayRef = overlayRef;

      this._tapInstructionSubscription =
        componentRef.instance.tapInstruction$.subscribe(this._tapInstruction);
    }
  }

  close() {
    if (
      isNotNull(this._overlayRef) &&
      this._isOpen &&
      this._tapInstructionSubscription
    ) {
      this._isOpen = false;
      this._overlayRef.dispose();
      this._overlayRef = null;
      this._tapInstructionSubscription.unsubscribe();
    }
  }

  toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

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
  private readonly _tapInstruction = new Subject<Instruction>();

  readonly tapInstruction$ = this._tapInstruction.asObservable();

  @Input() pgInstructions: Instruction[] = [];

  trackBy(index: number): number {
    return index;
  }

  onTapInstruction(instruction: Instruction) {
    this._tapInstruction.next(instruction);
  }
}

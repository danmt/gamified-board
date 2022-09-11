import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
} from '@angular/core';
import {
  DefaultImageDirective,
  getPosition,
  isNotNull,
  isNull,
  Option,
  Position,
} from '../../shared';
import { TooltipComponent } from '../../shared/components/tooltip.component';

export interface InstructionSignerTooltip {
  kind: 'instructionSigner';
  name: string;
}

export const openInstructionSignerTooltip = (
  overlay: Overlay,
  elementRef: ElementRef<unknown>,
  instructionSigner: InstructionSignerTooltip,
  position: Position = 'right'
) => {
  const overlayRef = overlay.create({
    positionStrategy: overlay
      .position()
      .flexibleConnectedTo(elementRef)
      .withPositions([getPosition(position)])
      .withLockedPosition(true),
    scrollStrategy: overlay.scrollStrategies.close(),
  });
  const portal = new ComponentPortal(InstructionSignerTooltipComponent);
  const componentRef = overlayRef.attach(portal);
  componentRef.instance.pgInstructionSigner = instructionSigner;
  componentRef.instance.pgPosition = position;

  return overlayRef;
};

@Directive({ selector: '[pgInstructionSignerTooltip]', standalone: true })
export class InstructionSignerTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgInstructionSigner: Option<InstructionSignerTooltip> = null;
  @Input() pgPosition: Position = 'right';

  @HostListener('mouseenter') onMouseEnter() {
    this._open();
  }

  @HostListener('mouseleave') onMouseLeave() {
    this._close();
  }

  ngOnDestroy() {
    this._close();
  }

  private _open() {
    if (isNotNull(this.pgInstructionSigner) && isNull(this._overlayRef)) {
      this._overlayRef = openInstructionSignerTooltip(
        this._overlay,
        this._elementRef,
        this.pgInstructionSigner,
        this.pgPosition
      );
    }
  }

  private _close() {
    if (isNotNull(this._overlayRef)) {
      this._overlayRef.dispose();
      this._overlayRef = null;
    }
  }
}

@Component({
  selector: 'pg-instruction-signer-tooltip',
  template: `
    <pg-tooltip class="relative" *ngIf="pgInstructionSigner !== null">
      <header class="bp-bg-futuristic flex gap-2 items-center bp-font-game p-4">
        <img
          src="assets/generic/signer.png"
          pgDefaultImage="assets/generic/signer.png"
          class="w-12 h-10 object-cover"
        />

        <div class="ml-4">
          <h3 class="uppercase text-xl">{{ pgInstructionSigner.name }}</h3>
        </div>
      </header>

      <div
        *ngIf="pgPosition === 'right'"
        class="absolute -left-4 -translate-y-1/2 top-1/2  w-4 h-4 -rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#a1a1a1">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'left'"
        class="absolute -right-4 -translate-y-1/2 top-1/2  w-4 h-4 rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#a1a1a1">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'top'"
        class="absolute -bottom-4 -translate-x-1/2 left-1/2  w-4 h-4 rotate-180"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#a1a1a1">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'bottom'"
        class="absolute -top-4 -translate-x-1/2 left-1/2  w-4 h-4 rotate"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#a1a1a1">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>
    </pg-tooltip>
  `,
  standalone: true,
  imports: [CommonModule, DefaultImageDirective, TooltipComponent],
})
export class InstructionSignerTooltipComponent {
  @Input() pgInstructionSigner: Option<InstructionSignerTooltip> = null;
  @Input() pgPosition: Position = 'left';
}

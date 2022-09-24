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
import { TooltipComponent } from '../../shared/components/tooltip.component';
import { DefaultImageDirective } from '../../shared/directives';
import {
  getPosition,
  isNotNull,
  isNull,
  Option,
  Position,
} from '../../shared/utils';

export interface InstructionApplicationTooltip {
  kind: 'instructionApplication';
  name: string;
  application: {
    name: string;
    thumbnailUrl: string;
  };
}

export const openInstructionApplicationTooltip = (
  overlay: Overlay,
  elementRef: ElementRef<unknown>,
  instructionApplication: InstructionApplicationTooltip,
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
  const portal = new ComponentPortal(InstructionApplicationTooltipComponent);
  const componentRef = overlayRef.attach(portal);
  componentRef.setInput('pgInstructionApplication', instructionApplication);
  componentRef.setInput('pgPosition', position);

  return overlayRef;
};

@Directive({ selector: '[pgInstructionApplicationTooltip]', standalone: true })
export class InstructionApplicationTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgInstructionApplication: Option<InstructionApplicationTooltip> =
    null;
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
    if (isNotNull(this.pgInstructionApplication) && isNull(this._overlayRef)) {
      this._overlayRef = openInstructionApplicationTooltip(
        this._overlay,
        this._elementRef,
        this.pgInstructionApplication,
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
  selector: 'pg-instruction-application-tooltip',
  template: `
    <pg-tooltip
      class="relative"
      style="min-width: 250px; max-width: 350px"
      *ngIf="pgInstructionApplication !== null"
    >
      <header class="p-2 flex gap-2 items-start bg-white bg-opacity-10">
        <img
          [src]="pgInstructionApplication.application.thumbnailUrl"
          pgDefaultImage="assets/generic/instruction-application.png"
          class="w-12 h-10 object-cover"
        />

        <div>
          <h3 class="uppercase text-xl">{{ pgInstructionApplication.name }}</h3>
          <p class="uppercase text-xs">
            {{ pgInstructionApplication.application.name }}
          </p>
        </div>
      </header>

      <div
        *ngIf="pgPosition === 'right'"
        class="absolute -left-8 -translate-y-1/2 top-1/2  w-4 h-4 -rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#565656">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'left'"
        class="absolute -right-8 -translate-y-1/2 top-1/2  w-4 h-4 rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#565656">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'top'"
        class="absolute -bottom-8 -translate-x-1/2 left-1/2  w-4 h-4 rotate-180"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#565656">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'bottom'"
        class="absolute -top-8 -translate-x-1/2 left-1/2  w-4 h-4 rotate"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#565656">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>
    </pg-tooltip>
  `,
  standalone: true,
  imports: [CommonModule, DefaultImageDirective, TooltipComponent],
})
export class InstructionApplicationTooltipComponent {
  @Input() pgInstructionApplication: Option<InstructionApplicationTooltip> =
    null;
  @Input() pgPosition: Position = 'left';
}

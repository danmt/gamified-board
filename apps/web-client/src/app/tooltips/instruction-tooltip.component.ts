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
import { DefaultImageDirective } from '../directives';
import { Option } from '../utils';
import { getPosition, Position } from './utils';

export interface InstructionTooltip {
  kind: 'instruction';
  name: string;
  thumbnailUrl: string;
  application: {
    name: string;
  };
  arguments: {
    name: string;
    type: string;
  }[];
}

export const openInstructionTooltip = (
  overlay: Overlay,
  elementRef: ElementRef<unknown>,
  instruction: InstructionTooltip,
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
  const portal = new ComponentPortal(InstructionTooltipComponent);
  const componentRef = overlayRef.attach(portal);
  componentRef.instance.pgInstruction = instruction;
  componentRef.instance.pgPosition = position;

  return overlayRef;
};

@Directive({ selector: '[pgInstructionTooltip]', standalone: true })
export class InstructionTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgInstruction: Option<InstructionTooltip> = null;
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
    if (this.pgInstruction && this._overlayRef === null) {
      this._overlayRef = openInstructionTooltip(
        this._overlay,
        this._elementRef,
        this.pgInstruction,
        this.pgPosition
      );
    }
  }

  private _close() {
    if (this._overlayRef !== null) {
      this._overlayRef.dispose();
      this._overlayRef = null;
    }
  }
}

@Component({
  selector: 'pg-instruction-tooltip',
  template: `
    <div
      class="relative"
      style="min-width: 250px; max-width: 350px"
      *ngIf="pgInstruction !== null"
    >
      <header class="p-2 flex gap-2 items-start bg-slate-600">
        <img
          [src]="pgInstruction.thumbnailUrl"
          pgDefaultImage="assets/generic/instruction.png"
          class="w-12 h-10 object-cover"
        />

        <div>
          <h3 class="uppercase text-xl">{{ pgInstruction.name }}</h3>
          <p class="uppercase text-xs">
            {{ pgInstruction.application.name }}
          </p>
        </div>
      </header>

      <div class="p-2 bg-slate-700">
        <p class="uppercase">Arguments</p>

        <section class="flex gap-2 flex-wrap">
          <article
            *ngFor="let argument of pgInstruction.arguments"
            class="border border-slate-900 p-1"
          >
            <p class="text-sm font-bold">{{ argument.name }}</p>
            <p class="text-xs">{{ argument.type }}</p>
          </article>
        </section>
      </div>

      <div
        *ngIf="pgPosition === 'right'"
        class="absolute -left-4 -translate-y-1/2 top-1/2  w-4 h-4 -rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#334155">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'left'"
        class="absolute -right-4 -translate-y-1/2 top-1/2  w-4 h-4 rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#334155">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'top'"
        class="absolute -bottom-4 -translate-x-1/2 left-1/2  w-4 h-4 rotate-180"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#334155">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'bottom'"
        class="absolute -top-4 -translate-x-1/2 left-1/2  w-4 h-4 rotate"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#334155">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, DefaultImageDirective],
})
export class InstructionTooltipComponent {
  @Input() pgInstruction: Option<InstructionTooltip> = null;
  @Input() pgPosition: Position = 'left';
}

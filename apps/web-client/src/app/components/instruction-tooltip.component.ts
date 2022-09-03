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

interface Instruction {
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
  instruction: Instruction
) => {
  const overlayRef = overlay.create({
    positionStrategy: overlay
      .position()
      .flexibleConnectedTo(elementRef)
      .withPositions([
        {
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
          offsetX: 16,
        },
      ]),
  });
  const portal = new ComponentPortal(InstructionTooltipComponent);
  const componentRef = overlayRef.attach(portal);
  componentRef.instance.instruction = instruction;

  return overlayRef;
};

@Directive({ selector: '[pgInstructionTooltip]', standalone: true })
export class InstructionTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgInstructionTooltip: Option<Instruction> = null;

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
    if (this.pgInstructionTooltip && this._overlayRef === null) {
      this._overlayRef = openInstructionTooltip(
        this._overlay,
        this._elementRef,
        this.pgInstructionTooltip
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
      *ngIf="instruction !== null"
    >
      <header class="p-2 flex gap-2 items-start bg-slate-600">
        <img
          [src]="instruction.thumbnailUrl"
          pgDefaultImage="assets/generic/instruction.png"
          class="w-12 h-10 object-cover"
        />

        <div>
          <h3 class="uppercase text-xl">{{ instruction.name }}</h3>
          <p class="uppercase text-xs">
            {{ instruction.application.name }}
          </p>
        </div>
      </header>

      <div class="p-2 bg-slate-700">
        <p class="uppercase">Arguments</p>

        <section class="flex gap-2 flex-wrap">
          <article
            *ngFor="let argument of instruction.arguments"
            class="border border-slate-900 p-1"
          >
            <p class="text-sm font-bold">{{ argument.name }}</p>
            <p class="text-xs">{{ argument.type }}</p>
          </article>
        </section>
      </div>

      <div
        class="absolute -left-4 -translate-y-1/2 top-1/2  w-4 h-4 -rotate-90"
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
  @Input() instruction: Option<Instruction> = null;
}

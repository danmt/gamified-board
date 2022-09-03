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

interface Sysvar {
  name: string;
  thumbnailUrl: string;
}

export const openSysvarTooltip = (
  overlay: Overlay,
  elementRef: ElementRef<unknown>,
  sysvar: Sysvar
) => {
  const overlayRef = overlay.create({
    positionStrategy: overlay
      .position()
      .flexibleConnectedTo(elementRef)
      .withPositions([
        {
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -16,
        },
      ]),
  });
  const portal = new ComponentPortal(SysvarTooltipComponent);
  const componentRef = overlayRef.attach(portal);
  componentRef.instance.sysvar = sysvar;

  return overlayRef;
};

@Directive({ selector: '[pgSysvarTooltip]', standalone: true })
export class SysvarTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgSysvarTooltip: Option<Sysvar> = null;

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
    if (this.pgSysvarTooltip && this._overlayRef === null) {
      this._overlayRef = openSysvarTooltip(
        this._overlay,
        this._elementRef,
        this.pgSysvarTooltip
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
  selector: 'pg-sysvar-tooltip',
  template: `
    <div
      class="relative"
      style="min-width: 250px; max-width: 350px"
      *ngIf="sysvar !== null"
    >
      <div>
        <header class="p-2 flex gap-2 items-start bg-slate-600">
          <img
            [src]="sysvar.thumbnailUrl"
            pgDefaultImage="assets/generic/sysvar.png"
            class="w-12 h-10 object-cover"
          />

          <div>
            <h3 class="uppercase text-xl">{{ sysvar.name }}</h3>
          </div>
        </header>
      </div>

      <div
        class="absolute -right-4 -translate-y-1/2 top-1/2  w-4 h-4 rotate-90"
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
export class SysvarTooltipComponent {
  @Input() sysvar: Option<Sysvar> = null;
}

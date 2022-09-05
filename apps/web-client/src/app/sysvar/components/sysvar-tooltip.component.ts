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
import { DefaultImageDirective } from '../../shared/directives';
import {
  getPosition,
  isNotNull,
  isNull,
  Option,
  Position,
} from '../../shared/utils';

export interface SysvarTooltip {
  kind: 'sysvar';
  name: string;
  thumbnailUrl: string;
}

export const openSysvarTooltip = (
  overlay: Overlay,
  elementRef: ElementRef<unknown>,
  sysvar: SysvarTooltip,
  position: Position = 'left'
) => {
  const overlayRef = overlay.create({
    positionStrategy: overlay
      .position()
      .flexibleConnectedTo(elementRef)
      .withPositions([getPosition(position)])
      .withLockedPosition(true),
    scrollStrategy: overlay.scrollStrategies.close(),
  });
  const portal = new ComponentPortal(SysvarTooltipComponent);
  const componentRef = overlayRef.attach(portal);
  componentRef.instance.pgSysvar = sysvar;
  componentRef.instance.pgPosition = position;

  return overlayRef;
};

@Directive({ selector: '[pgSysvarTooltip]', standalone: true })
export class SysvarTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgSysvar: Option<SysvarTooltip> = null;
  @Input() pgPosition: Position = 'left';

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
    if (this.pgSysvar && isNull(this._overlayRef)) {
      this._overlayRef = openSysvarTooltip(
        this._overlay,
        this._elementRef,
        this.pgSysvar,
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
  selector: 'pg-sysvar-tooltip',
  template: `
    <div
      class="relative"
      style="min-width: 250px; max-width: 350px"
      *ngIf="pgSysvar !== null"
    >
      <div>
        <header class="p-2 flex gap-2 items-start bg-slate-600">
          <img
            [src]="pgSysvar.thumbnailUrl"
            pgDefaultImage="assets/generic/sysvar.png"
            class="w-12 h-10 object-cover"
          />

          <div>
            <h3 class="uppercase text-xl">{{ pgSysvar.name }}</h3>
          </div>
        </header>
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
export class SysvarTooltipComponent {
  @Input() pgSysvar: Option<SysvarTooltip> = null;
  @Input() pgPosition: Position = 'left';
}
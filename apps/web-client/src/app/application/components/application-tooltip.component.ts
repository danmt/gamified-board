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

export interface ApplicationTooltip {
  kind: 'application';
  name: string;
  thumbnailUrl: string;
  collections: {
    name: string;
  }[];
  instructions: {
    name: string;
  }[];
}

export const openApplicationTooltip = (
  overlay: Overlay,
  elementRef: ElementRef<unknown>,
  application: ApplicationTooltip,
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
  const portal = new ComponentPortal(ApplicationTooltipComponent);
  const componentRef = overlayRef.attach(portal);
  componentRef.instance.pgApplication = application;
  componentRef.instance.pgPosition = position;

  return overlayRef;
};

@Directive({ selector: '[pgApplicationTooltip]', standalone: true })
export class ApplicationTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgApplication: Option<ApplicationTooltip> = null;
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
    if (isNotNull(this.pgApplication) && isNull(this._overlayRef)) {
      this._overlayRef = openApplicationTooltip(
        this._overlay,
        this._elementRef,
        this.pgApplication,
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
  selector: 'pg-application-tooltip',
  template: `
    <div
      class="relative"
      style="min-width: 250px; max-width: 350px"
      *ngIf="pgApplication !== null"
    >
      <header class="p-2 flex gap-2 items-start bg-slate-600">
        <img
          [src]="pgApplication.thumbnailUrl"
          pgDefaultImage="assets/generic/application.png"
          class="w-12 h-10 object-cover"
        />

        <div>
          <h3 class="uppercase text-xl">{{ pgApplication.name }}</h3>
        </div>
      </header>

      <div class="p-2 bg-slate-700">
        <p class="uppercase">Collections</p>

        <section class="flex gap-2 flex-wrap">
          <article
            *ngFor="let collection of pgApplication.collections"
            class="border border-slate-900 p-1"
          >
            <p class="text-xs">{{ collection.name }}</p>
          </article>
        </section>
      </div>

      <div class="p-2 bg-slate-700">
        <p class="uppercase">Instructions</p>

        <section class="flex gap-2 flex-wrap">
          <article
            *ngFor="let instruction of pgApplication.instructions"
            class="border border-slate-900 p-1"
          >
            <p class="text-xs">{{ instruction.name }}</p>
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
export class ApplicationTooltipComponent {
  @Input() pgApplication: Option<ApplicationTooltip> = null;
  @Input() pgPosition: Position = 'right';
}

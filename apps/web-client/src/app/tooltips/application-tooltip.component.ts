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

interface Application {
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
  application: Application
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
  const portal = new ComponentPortal(ApplicationTooltipComponent);
  const componentRef = overlayRef.attach(portal);
  componentRef.instance.application = application;

  return overlayRef;
};

@Directive({ selector: '[pgApplicationTooltip]', standalone: true })
export class ApplicationTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgApplicationTooltip: Option<Application> = null;

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
    if (this.pgApplicationTooltip && this._overlayRef === null) {
      this._overlayRef = openApplicationTooltip(
        this._overlay,
        this._elementRef,
        this.pgApplicationTooltip
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
  selector: 'pg-application-tooltip',
  template: `
    <div
      class="relative"
      style="min-width: 250px; max-width: 350px"
      *ngIf="application !== null"
    >
      <header class="p-2 flex gap-2 items-start bg-slate-600">
        <img
          [src]="application.thumbnailUrl"
          pgDefaultImage="assets/generic/application.png"
          class="w-12 h-10 object-cover"
        />

        <div>
          <h3 class="uppercase text-xl">{{ application.name }}</h3>
        </div>
      </header>

      <div class="p-2 bg-slate-700">
        <p class="uppercase">Collections</p>

        <section class="flex gap-2 flex-wrap">
          <article
            *ngFor="let collection of application.collections"
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
            *ngFor="let instruction of application.instructions"
            class="border border-slate-900 p-1"
          >
            <p class="text-xs">{{ instruction.name }}</p>
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
export class ApplicationTooltipComponent {
  @Input() application: Option<Application> = null;
}

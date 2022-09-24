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

export interface CollectionTooltip {
  kind: 'collection';
  name: string;
  thumbnailUrl: string;
  application: {
    name: string;
  };
  attributes: {
    name: string;
    type: string;
  }[];
}

export const openCollectionTooltip = (
  overlay: Overlay,
  elementRef: ElementRef<unknown>,
  collection: CollectionTooltip,
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
  const portal = new ComponentPortal(CollectionTooltipComponent);
  const componentRef = overlayRef.attach(portal);
  componentRef.setInput('pgCollection', collection);
  componentRef.setInput('pgPosition', position);

  return overlayRef;
};

@Directive({ selector: '[pgCollectionTooltip]', standalone: true })
export class CollectionTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgCollection: Option<CollectionTooltip> = null;
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
    if (isNotNull(this.pgCollection) && isNull(this._overlayRef)) {
      this._overlayRef = openCollectionTooltip(
        this._overlay,
        this._elementRef,
        this.pgCollection,
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
  selector: 'pg-collection-tooltip',
  template: `
    <pg-tooltip
      class="relative"
      style="min-width: 250px; max-width: 350px"
      *ngIf="pgCollection !== null"
    >
      <header class="p-2 flex gap-2 items-start bg-white bg-opacity-10">
        <img
          [src]="pgCollection.thumbnailUrl"
          pgDefaultImage="assets/generic/collection.png"
          class="w-12 h-10 object-cover"
        />

        <div>
          <h3 class="uppercase text-xl">{{ pgCollection.name }}</h3>
          <p class="uppercase text-xs">
            {{ pgCollection.application.name }}
          </p>
        </div>
      </header>

      <div class="p-2">
        <p class="uppercase">Attributes</p>

        <section class="flex gap-2 flex-wrap">
          <article
            *ngFor="let attribute of pgCollection.attributes"
            class="border border-slate-900 p-1"
          >
            <p class="text-sm font-bold">{{ attribute.name }}</p>
            <p class="text-xs">{{ attribute.type }}</p>
          </article>
        </section>
      </div>

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
export class CollectionTooltipComponent {
  @Input() pgCollection: Option<CollectionTooltip> = null;
  @Input() pgPosition: Position = 'left';
}

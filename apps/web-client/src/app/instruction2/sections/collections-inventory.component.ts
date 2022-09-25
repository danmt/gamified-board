import { Overlay, OverlayRef } from '@angular/cdk/overlay';
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
import { Collection } from '../../application/utils';
import { InventoryComponent } from '../../shared/components';
import { DefaultImageDirective } from '../../shared/directives';
import { isNotNull, isNull, Option } from '../../shared/utils';

export const openCollectionsInventory = (
  overlay: Overlay,
  viewContainerRef: ViewContainerRef,
  collections: Collection[]
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
    new ComponentPortal(CollectionsInventoryComponent, viewContainerRef)
  );
  componentRef.setInput('pgCollections', collections);

  return { componentRef, overlayRef };
};

@Directive({
  selector: '[pgCollectionsInventory]',
  standalone: true,
  exportAs: 'modal',
})
export class CollectionsInventoryDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private _overlayRef: Option<OverlayRef> = null;
  private _isOpen = false;
  private _tapCollectionSubscription: Option<Subscription> = null;

  private readonly _tapCollection = new Subject<Collection>();

  @Input() pgCollections: Collection[] = [];
  @Output() pgTapCollection = this._tapCollection.asObservable();

  @HostListener('click') onClick() {
    this.open();
  }

  ngOnDestroy() {
    this.close();
  }

  open() {
    if (isNull(this._overlayRef) && !this._isOpen) {
      this._isOpen = true;
      const { overlayRef, componentRef } = openCollectionsInventory(
        this._overlay,
        this._viewContainerRef,
        this.pgCollections
      );

      this._overlayRef = overlayRef;

      this._tapCollectionSubscription =
        componentRef.instance.tapCollection$.subscribe(this._tapCollection);
    }
  }

  close() {
    if (
      isNotNull(this._overlayRef) &&
      this._isOpen &&
      this._tapCollectionSubscription
    ) {
      this._isOpen = false;
      this._overlayRef.dispose();
      this._overlayRef = null;
      this._tapCollectionSubscription.unsubscribe();
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
  selector: 'pg-collections-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[520px] max-h-[520px]"
      pgDirection="left"
    >
      <h2 pgInventoryTitle class="bp-font-game-title text-3xl">Collections</h2>

      <div pgInventoryBody>
        <div class="flex flex-wrap gap-4 justify-center">
          <button
            *ngFor="let collection of pgCollections; trackBy: trackBy"
            class="bg-gray-600 p-0.5 w-11 h-11"
            (click)="onTapCollection(collection)"
          >
            <img
              class="w-full h-full object-cover"
              [src]="collection.data.thumbnailUrl"
              pgDefaultImage="assets/generic/collection.png"
            />
          </button>
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
    InventoryComponent,
  ],
})
export class CollectionsInventoryComponent {
  private readonly _tapCollection = new Subject<Collection>();

  readonly tapCollection$ = this._tapCollection.asObservable();

  @Input() pgCollections: Collection[] = [];

  trackBy(index: number): number {
    return index;
  }

  onTapCollection(collection: Collection) {
    this._tapCollection.next(collection);
  }
}

import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  Directive,
  inject,
  Input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { isNotNull, isNull, Option } from '../utils';

@Directive({
  selector: '[pgGlobalOverlay]',
  standalone: true,
  exportAs: 'globalOverlay',
})
export class GlobalOverlayDirective {
  private readonly _templateRef = inject(TemplateRef<unknown>);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _overlay = inject(Overlay);
  private _overlayRef: Option<OverlayRef> = null;
  private isOpen = false;

  @Input() pgPositionStrategy = this._overlay
    .position()
    .global()
    .centerVertically()
    .centerHorizontally();

  toggle() {
    if (!this.isOpen && isNull(this._overlayRef)) {
      this._overlayRef = this._overlay.create({
        positionStrategy: this.pgPositionStrategy,
        scrollStrategy: this._overlay.scrollStrategies.close(),
      });
      this._overlayRef.attach(
        new TemplatePortal(this._templateRef, this._viewContainerRef)
      );
      this.isOpen = true;
    } else if (this.isOpen && isNotNull(this._overlayRef)) {
      this._overlayRef.dispose();
      this._overlayRef = null;
      this.isOpen = false;
    }
  }
}

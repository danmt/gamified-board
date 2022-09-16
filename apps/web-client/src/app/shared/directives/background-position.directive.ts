import { Directive, ElementRef, inject, Input, Renderer2 } from '@angular/core';

@Directive({ selector: '[pgBackgroundImageMove]', standalone: true })
export class BackgroundImageMoveDirective {
  private readonly _elementRef =
    inject<ElementRef<HTMLImageElement>>(ElementRef);
  private readonly _renderer2 = inject(Renderer2);

  @Input() set pgPanValue(value: { x: string; y: string }) {
    this._renderer2.setStyle(
      this._elementRef.nativeElement,
      'background-position-x',
      value.x
    );
    this._renderer2.setStyle(
      this._elementRef.nativeElement,
      'background-position-y',
      value.y
    );
  }
}

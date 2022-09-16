import { Directive, ElementRef, inject, Input, Renderer2 } from '@angular/core';

@Directive({ selector: '[pgBackgroundImageZoom]', standalone: true })
export class BackgroundImageZoomDirective {
  private readonly _elementRef =
    inject<ElementRef<HTMLImageElement>>(ElementRef);
  private readonly _renderer2 = inject(Renderer2);

  @Input() set pgZoomValue(value: string) {
    this._renderer2.setStyle(
      this._elementRef.nativeElement,
      'background-size',
      value
    );
  }
}

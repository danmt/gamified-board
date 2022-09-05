import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Renderer2,
} from '@angular/core';

@Directive({ selector: '[pgFollowCursor]', standalone: true })
export class FollowCursorDirective {
  private readonly _renderer2 = inject(Renderer2);
  private readonly _elementRef = inject(ElementRef<unknown>);

  @HostListener('window:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    this._renderer2.setStyle(
      this._elementRef.nativeElement,
      'left',
      `${event.clientX}px`
    );
    this._renderer2.setStyle(
      this._elementRef.nativeElement,
      'top',
      `${event.clientY}px`
    );
  }
}

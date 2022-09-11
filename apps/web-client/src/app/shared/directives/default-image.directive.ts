import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  Renderer2,
} from '@angular/core';
import { isNull, Option } from '../../shared';

@Directive({ selector: 'img[pgDefaultImage]', standalone: true })
export class DefaultImageDirective {
  private readonly _elementRef =
    inject<ElementRef<HTMLImageElement>>(ElementRef);
  private readonly _renderer2 = inject(Renderer2);

  @Input() pgDefaultImage: Option<string> = null;

  @HostListener('error') onError() {
    if (isNull(this.pgDefaultImage)) {
      throw new Error('Default img URL is missing.');
    }

    this._renderer2.setAttribute(
      this._elementRef.nativeElement,
      'src',
      this.pgDefaultImage
    );
  }
}

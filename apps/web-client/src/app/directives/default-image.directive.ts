import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  Renderer2,
} from '@angular/core';
import { Option } from '../utils';

@Directive({ selector: 'img[pgDefaultImage]', standalone: true })
export class DefaultImageDirective {
  private readonly _elementRef =
    inject<ElementRef<HTMLImageElement>>(ElementRef);
  private readonly _renderer2 = inject(Renderer2);

  @Input() pgDefaultImage: Option<string> = null;

  @HostListener('error') onError() {
    if (this.pgDefaultImage === null) {
      throw new Error('Default img URL is missing.');
    }

    this._renderer2.setAttribute(
      this._elementRef.nativeElement,
      'src',
      this.pgDefaultImage
    );
  }
}

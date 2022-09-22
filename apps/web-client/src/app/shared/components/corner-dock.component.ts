import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostBinding,
  inject,
  Input,
  Renderer2,
} from '@angular/core';
import { isNotNull, Option } from '../utils';

export type DockDirection = 'right' | 'left';

@Component({
  selector: 'pg-corner-dock',
  template: `
    <!-- top border design -->
    <div
      class="bp-skin-metal-corner-{{
        oppositeDirection
      }}-top absolute -top-4 -{{ oppositeDirection }}-4 z-20"
    ></div>
    <div
      class="bp-skin-metal-border-top absolute -top-4 w-5/6 {{
        oppositeDirection
      }}-16 {{ direction }}-0 mx-auto my-0 z-10"
    ></div>

    <!-- modal content -->
    <ng-content></ng-content>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class CornerDockComponent {
  private readonly _elementRef = inject(ElementRef);
  private readonly _renderer2 = inject(Renderer2);

  @HostBinding('class') class = 'block bp-bg-yellow-texture relative';

  direction: DockDirection = 'right';
  oppositeDirection: DockDirection = 'left';

  @Input() set pgDirection(value: Option<DockDirection>) {
    if (isNotNull(value)) {
      this._setDirection(value);
    }
  }

  private _setDirection(direction: DockDirection) {
    this.direction = direction;
    this.oppositeDirection = direction === 'left' ? 'right' : 'left';

    if (direction === 'left') {
      this._renderer2.removeClass(
        this._elementRef.nativeElement,
        'rounded-tl-[35px]'
      );
      this._renderer2.addClass(
        this._elementRef.nativeElement,
        'rounded-tr-[35px]'
      );
    } else {
      this._renderer2.removeClass(
        this._elementRef.nativeElement,
        'rounded-tr-[35px]'
      );
      this._renderer2.addClass(
        this._elementRef.nativeElement,
        'rounded-tl-[35px]'
      );
    }
  }
}

import { Directive, HostListener } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Directive({ selector: '[pgHovered]', standalone: true, exportAs: 'hovered' })
export class HoveredDirective {
  private readonly _isHovered = new BehaviorSubject(false);

  readonly isHovered$ = this._isHovered.asObservable();

  @HostListener('mouseenter', []) onMouseEnter() {
    this._isHovered.next(true);
  }

  @HostListener('mouseleave', []) onMouseLeave() {
    this._isHovered.next(false);
  }
}

import { Directive, HostListener } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Directive({ selector: '[pgFocused]', standalone: true, exportAs: 'focused' })
export class FocusedDirective {
  private readonly _isFocused = new BehaviorSubject(false);

  readonly isFocused$ = this._isFocused.asObservable();

  @HostListener('focus', []) onMouseEnter() {
    this._isFocused.next(true);
  }

  @HostListener('blur', []) onMouseLeave() {
    this._isFocused.next(false);
  }
}

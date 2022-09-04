import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({ selector: '[pgKeyboardListener]', standalone: true })
export class KeyboardListenerDirective {
  @Output() pgKeyDown = new EventEmitter<KeyboardEvent>();

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    this.pgKeyDown.emit(event);
  }
}

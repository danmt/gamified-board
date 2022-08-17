import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({ selector: '[pgKeyboardListener]', standalone: true })
export class KeyboardListenerDirective {
  @Output() pressEscape = new EventEmitter();
  @Output() pressComma = new EventEmitter();
  @Output() pressDot = new EventEmitter();
  @Output() pressDelete = new EventEmitter();

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Delete': {
        this.pressDelete.emit();

        break;
      }
      case 'Escape': {
        this.pressEscape.emit();

        break;
      }
      case '.': {
        this.pressDot.emit();

        break;
      }
      case ',': {
        this.pressComma.emit();

        break;
      }
    }
  }
}

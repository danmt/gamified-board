import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { Option } from '../utils';

@Directive({ selector: '[pgKeyListener]', standalone: true })
export class KeyListenerDirective {
  @Input() pgKeyListener: Option<string> = null;
  @Output() pgKeyDown = new EventEmitter<KeyboardEvent>();

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent) {
    this._handleKeyDown(event);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    this._handleKeyDown(event);
  }

  private _handleKeyDown(event: KeyboardEvent) {
    if (event.code === this.pgKeyListener) {
      this.pgKeyDown.emit(event);
    }
  }
}

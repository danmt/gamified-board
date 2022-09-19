import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { Option } from '../utils';

@Directive({ selector: '[pgKeyDown]', standalone: true })
export class KeyDownDirective {
  @Input() pgKey: Option<string> = null;
  @Output() pgKeyDown = new EventEmitter<KeyboardEvent>();

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === this.pgKey) {
      this.pgKeyDown.emit(event);
    }
  }
}

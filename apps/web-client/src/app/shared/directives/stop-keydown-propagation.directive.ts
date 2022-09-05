import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[pgStopKeydownPropagation]',
  standalone: true,
})
export class StopKeydownPropagationDirective {
  @HostListener('keydown', ['$event']) onKeydown(event: Event) {
    event.stopPropagation();
  }
}

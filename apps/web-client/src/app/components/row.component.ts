import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'pg-row',
  template: ` <ng-content></ng-content> `,
  standalone: true,
})
export class RowComponent {
  @HostBinding('class') class =
    'block w-full h-64 bg-blue-300 border border-blue-500 bg-bp-bricks ';
}

import { Component, HostBinding } from '@angular/core';
import {
  BoardComponent,
  NavigationWrapperComponent,
  RowComponent,
} from './components';

@Component({
  selector: 'pg-root',
  template: `
    <pg-navigation-wrapper></pg-navigation-wrapper>

    <pg-board></pg-board>
  `,
  standalone: true,
  imports: [RowComponent, BoardComponent, NavigationWrapperComponent],
})
export class AppComponent {
  @HostBinding('class') class = 'block';
}

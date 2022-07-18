import { Component, HostBinding } from '@angular/core';
import {
  BoardComponent,
  DockComponent,
  NavigationWrapperComponent,
} from './components';

@Component({
  selector: 'pg-root',
  template: `
    <pg-navigation-wrapper zPosition="z-20"></pg-navigation-wrapper>
    <pg-dock class="fixed bottom-0 w-full z-10"></pg-dock>
    <pg-board></pg-board>
  `,
  standalone: true,
  imports: [DockComponent, BoardComponent, NavigationWrapperComponent],
})
export class AppComponent {
  @HostBinding('class') class = 'block';
}

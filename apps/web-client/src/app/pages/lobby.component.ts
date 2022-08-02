import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pg-lobby-page',
  template: `lobby`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobbyPageComponent {}

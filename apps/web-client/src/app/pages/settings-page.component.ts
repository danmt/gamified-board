import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pg-settings-page',
  template: `settings`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {}

import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app/app.component';
import {
  AssociatedTokenPlugin,
  PluginModule,
  SystemPlugin,
  TokenPlugin,
} from './app/plugins';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserAnimationsModule,
      PluginModule.forRoot([
        new SystemPlugin(),
        new TokenPlugin(),
        new AssociatedTokenPlugin(),
      ]),
      RouterModule.forRoot([
        {
          path: '',
          children: [
            {
              path: 'board',
              loadComponent: () =>
                import('./app/pages/board.component').then(
                  (m) => m.BoardPageComponent
                ),
            },
            {
              path: 'lobby',
              loadComponent: () =>
                import('./app/pages/lobby.component').then(
                  (m) => m.LobbyPageComponent
                ),
            },
            {
              path: 'settings',
              loadComponent: () =>
                import('./app/pages/settings.component').then(
                  (m) => m.SettingsPageComponent
                ),
            },
            {
              path: '**',
              redirectTo: 'lobby',
            },
          ],
        },
      ])
    ),
  ],
}).catch((err) => console.error(err));

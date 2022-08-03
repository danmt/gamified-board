import { enableProdMode, importProvidersFrom } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
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
              path: 'board/:workspaceId/:applicationId',
              loadComponent: () =>
                import('./app/pages/board.component').then(
                  (m) => m.BoardPageComponent
                ),
            },
            {
              path: '**',
              redirectTo: 'lobby',
            },
          ],
        },
      ]),
      provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
      provideFirestore(() => getFirestore())
    ),
  ],
}).catch((err) => console.error(err));

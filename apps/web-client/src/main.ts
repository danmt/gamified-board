import { enableProdMode, importProvidersFrom } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  connectFirestoreEmulator,
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import {
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions,
} from '@angular/fire/functions';
import {
  connectStorageEmulator,
  getStorage,
  provideStorage,
} from '@angular/fire/storage';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import * as cytoscape from 'cytoscape';
import * as cytoscapeCxtmenu from 'cytoscape-cxtmenu';
import * as cytoscapeDagre from 'cytoscape-dagre';
import * as cytoscapeEdgehandles from 'cytoscape-edgehandles';
import * as cytoscapeNodeHtmlLabel from 'cytoscape-node-html-label';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

cytoscape.use(cytoscapeDagre);
cytoscape.use(cytoscapeCxtmenu);
cytoscape.use(cytoscapeEdgehandles);
cytoscape.use(cytoscapeNodeHtmlLabel as cytoscape.Ext);

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserAnimationsModule,
      RouterModule.forRoot([
        {
          path: '',
          children: [
            {
              path: 'lobby',
              loadComponent: () =>
                import('./app/lobby/pages').then((m) => m.LobbyPageComponent),
            },
            {
              path: 'settings',
              loadComponent: () =>
                import('./app/settings/pages').then(
                  (m) => m.SettingsPageComponent
                ),
            },
            {
              path: 'workspaces/:workspaceId',
              loadComponent: () =>
                import('./app/workspace/pages').then(
                  (m) => m.WorkspacePageComponent
                ),
            },
            {
              path: 'workspaces/:workspaceId/programs/:programId',
              loadComponent: () =>
                import('./app/program/pages').then(
                  (m) => m.ProgramPageComponent
                ),
            },
            {
              path: 'workspaces/:workspaceId/programs/:programId/instructions/:instructionId',
              loadComponent: () =>
                import('./app/instruction/pages').then(
                  (m) => m.InstructionPageComponent
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
      provideFirestore(() => {
        const firestore = getFirestore();

        if (environment.useEmulators) {
          connectFirestoreEmulator(firestore, 'localhost', 8080);
        }

        return firestore;
      }),
      provideFunctions(() => {
        const functions = getFunctions();

        if (environment.useEmulators) {
          connectFunctionsEmulator(functions, 'localhost', 5001);
        }

        return functions;
      }),
      provideStorage(() => {
        const storage = getStorage();

        if (environment.useEmulators) {
          connectStorageEmulator(storage, 'localhost', 9199);
        }

        return storage;
      })
    ),
  ],
}).catch((err) => console.error(err));

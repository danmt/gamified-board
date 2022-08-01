import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
      ])
    ),
  ],
}).catch((err) => console.error(err));

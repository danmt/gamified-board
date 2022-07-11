import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {
  AppComponent,
  HoverDirective,
  MouseMoveDirective,
  RowComponent,
} from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    RowComponent,
    MouseMoveDirective,
    HoverDirective,
  ],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

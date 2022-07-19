import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import {
  GlobalPositionStrategy,
  NoopScrollStrategy,
} from '@angular/cdk/overlay';
import { Component, HostBinding, HostListener } from '@angular/core';
import {
  BoardComponent,
  CollectionsComponent,
  DockComponent,
  InstructionsComponent,
  NavigationWrapperComponent,
} from './components';

@Component({
  selector: 'pg-root',
  template: `
    <pg-navigation-wrapper zPosition="z-30"></pg-navigation-wrapper>
    <pg-dock class="fixed bottom-0 w-full z-10"></pg-dock>
    <pg-board></pg-board>
  `,
  standalone: true,
  imports: [
    DialogModule,
    DockComponent,
    BoardComponent,
    NavigationWrapperComponent,
  ],
})
export class AppComponent {
  collectionsDialogRef: DialogRef<
    CollectionsComponent,
    CollectionsComponent
  > | null = null;
  instructionsDialogRef: DialogRef<
    InstructionsComponent,
    InstructionsComponent
  > | null = null;
  @HostBinding('class') class = 'block';
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case ',': {
        if (this.collectionsDialogRef === null) {
          this.collectionsDialogRef = this._dialog.open(CollectionsComponent, {
            width: '300px',
            height: '500px',
            hasBackdrop: false,
            scrollStrategy: new NoopScrollStrategy(),
            positionStrategy: new GlobalPositionStrategy()
              .left('0')
              .centerVertically(),
          });
          this.collectionsDialogRef.closed.subscribe(() => {
            this.collectionsDialogRef = null;
          });
        } else {
          this.collectionsDialogRef.close();
          this.collectionsDialogRef = null;
        }

        break;
      }
      case '.': {
        if (this.instructionsDialogRef === null) {
          this.instructionsDialogRef = this._dialog.open(
            InstructionsComponent,
            {
              width: '300px',
              height: '500px',
              hasBackdrop: false,
              scrollStrategy: new NoopScrollStrategy(),
              positionStrategy: new GlobalPositionStrategy()
                .right('0')
                .centerVertically(),
            }
          );
          this.instructionsDialogRef.closed.subscribe(() => {
            this.instructionsDialogRef = null;
          });
        } else {
          this.instructionsDialogRef.close();
          this.instructionsDialogRef = null;
        }

        break;
      }
    }
  }

  constructor(private readonly _dialog: Dialog) {}
}

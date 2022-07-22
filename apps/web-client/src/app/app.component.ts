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
  HotKey,
  InstructionsComponent,
  NavigationWrapperComponent,
} from './components';

@Component({
  selector: 'pg-root',
  template: `
    <pg-navigation-wrapper zPosition="z-30"></pg-navigation-wrapper>
    <pg-dock
      class="fixed bottom-0 w-full z-10"
      [slots]="slots"
      [hotkeys]="hotkeys"
      [active]="active"
      (swapSlots)="onSwapSlots($event[0], $event[1])"
      (removeFromSlot)="onRemoveFromSlot($event)"
      (activateSlot)="onSlotActivate($event)"
      (updateSlot)="onUpdateSlot($event.index, $event.data)"
    ></pg-dock>
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
  active: number | null = null;
  instructions: string[] = [
    'assets/power-1.png',
    'assets/power-2.png',
    'assets/power-3.png',
    'assets/power-4.png',
    'assets/power-5.png',
    'assets/power-6.png',
    'assets/power-7.png',
    'assets/power-8.png',
  ];
  collections: string[] = [
    'assets/power-9.png',
    'assets/power-10.png',
    'assets/power-11.png',
    'assets/power-12.png',
    'assets/power-13.png',
    'assets/power-14.png',
    'assets/power-15.png',
    'assets/power-16.png',
  ];
  slots: (string | null)[] = [
    'assets/power-1.png',
    'assets/power-2.png',
    'assets/power-3.png',
    null,
    null,
    null,
    'assets/power-9.png',
    'assets/power-10.png',
    null,
    null,
    null,
    null,
  ];
  hotkeys: HotKey[] = [
    {
      slot: 1,
      key: 'q',
    },
    {
      slot: 2,
      key: 'w',
    },
    {
      slot: 3,
      key: 'e',
    },
    {
      slot: 4,
      key: 'r',
    },
    {
      slot: 5,
      key: 't',
    },
    {
      slot: 6,
      key: 'y',
    },
    {
      slot: 7,
      key: '1',
    },
    {
      slot: 8,
      key: '2',
    },
    {
      slot: 9,
      key: '3',
    },
    {
      slot: 10,
      key: '4',
    },
    {
      slot: 11,
      key: '5',
    },
    {
      slot: 12,
      key: '6',
    },
  ];

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
      case 'Escape': {
        if (
          this.collectionsDialogRef !== null ||
          this.instructionsDialogRef !== null
        ) {
          this.collectionsDialogRef?.close();
          this.collectionsDialogRef = null;
          this.instructionsDialogRef?.close();
          this.instructionsDialogRef = null;
        } else {
          this.active = null;
        }

        break;
      }
      case '.': {
        if (this.collectionsDialogRef === null) {
          this.collectionsDialogRef = this._dialog.open(CollectionsComponent, {
            data: this.collections,
            width: '300px',
            height: '500px',
            hasBackdrop: false,
            scrollStrategy: new NoopScrollStrategy(),
            positionStrategy: new GlobalPositionStrategy()
              .right('0')
              .centerVertically(),
            disableClose: true,
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
      case ',': {
        if (this.instructionsDialogRef === null) {
          this.instructionsDialogRef = this._dialog.open(
            InstructionsComponent,
            {
              data: this.instructions,
              width: '300px',
              height: '500px',
              hasBackdrop: false,
              scrollStrategy: new NoopScrollStrategy(),
              positionStrategy: new GlobalPositionStrategy()
                .left('0')
                .centerVertically(),
              disableClose: true,
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

  onRemoveFromSlot(index: number) {
    this.slots[index] = null;
  }

  onSwapSlots(previousIndex: number, newIndex: number) {
    const temp = this.slots[newIndex];
    this.slots[newIndex] = this.slots[previousIndex];
    this.slots[previousIndex] = temp;
  }

  onSlotActivate(index: number) {
    this.active = index;
  }

  onUpdateSlot(index: number, data: string) {
    this.slots[index] = data;
  }
}

import {
  Component,
  HostListener,
  Pipe,
  PipeTransform,
  ViewChild,
} from '@angular/core';
import { RoundButtonComponent } from './round-button.component';
import { SquareButtonComponent } from './square-button.component';

@Pipe({
  name: 'pgButtonHotkey',
  standalone: true,
})
export class ButtonHotkeyPipe implements PipeTransform {
  transform(
    buttonId: string,
    hotkeys: { button: string; key: string }[]
  ): string | null {
    const hotkey = hotkeys.find((hotkey) => hotkey.button === buttonId);

    return hotkey?.key ?? null;
  }
}

@Component({
  selector: 'pg-dock',
  template: `
    <div class="w-full flex justify-center">
      <div
        class="w-auto mx-auto p-4 bg-white flex gap-4 justify-center items-start"
      >
        <div>
          <h2>Instructions</h2>

          <div class="flex gap-2">
            <pg-square-button
              #button1
              buttonId="1"
              [buttonKey]="'1' | pgButtonHotkey: hotkeys"
              [isActive]="active === '1'"
              [thumbnailUrl]="instructions[0]"
              (activated)="onActivated('1')"
            ></pg-square-button>
            <pg-square-button
              #button2
              buttonId="2"
              [buttonKey]="'2' | pgButtonHotkey: hotkeys"
              [isActive]="active === '2'"
              [thumbnailUrl]="instructions[1]"
              (activated)="onActivated('2')"
            ></pg-square-button>
            <pg-square-button
              #button3
              buttonId="3"
              [buttonKey]="'3' | pgButtonHotkey: hotkeys"
              [isActive]="active === '3'"
              [thumbnailUrl]="instructions[2]"
              (activated)="onActivated('3')"
            ></pg-square-button>
            <pg-square-button
              #button4
              buttonId="4"
              [buttonKey]="'4' | pgButtonHotkey: hotkeys"
              [isActive]="active === '4'"
              [thumbnailUrl]="instructions[3]"
              (activated)="onActivated('4')"
            ></pg-square-button>
            <pg-square-button
              #button5
              buttonId="5"
              [buttonKey]="'5' | pgButtonHotkey: hotkeys"
              [isActive]="active === '5'"
              [thumbnailUrl]="instructions[4]"
              (activated)="onActivated('5')"
            ></pg-square-button>
            <pg-square-button
              #button6
              buttonId="6"
              [buttonKey]="'6' | pgButtonHotkey: hotkeys"
              [isActive]="active === '6'"
              [thumbnailUrl]="instructions[5]"
              (activated)="onActivated('6')"
            ></pg-square-button>
          </div>
        </div>

        <div>
          <h2>Collections</h2>

          <div class="flex gap-2 mb-2">
            <pg-square-button
              #button7
              buttonId="7"
              [buttonKey]="'7' | pgButtonHotkey: hotkeys"
              [isActive]="active === '7'"
              [thumbnailUrl]="collections[0]"
              (activated)="onActivated('7')"
            ></pg-square-button>
            <pg-square-button
              #button8
              buttonId="8"
              [buttonKey]="'8' | pgButtonHotkey: hotkeys"
              [isActive]="active === '8'"
              [thumbnailUrl]="collections[1]"
              (activated)="onActivated('8')"
            ></pg-square-button>
            <pg-square-button
              #button9
              buttonId="9"
              [buttonKey]="'9' | pgButtonHotkey: hotkeys"
              [isActive]="active === '9'"
              [thumbnailUrl]="collections[2]"
              (activated)="onActivated('9')"
            ></pg-square-button>
          </div>

          <div class="flex gap-2">
            <pg-square-button
              #button10
              buttonId="10"
              [buttonKey]="'10' | pgButtonHotkey: hotkeys"
              [isActive]="active === '10'"
              [thumbnailUrl]="collections[3]"
              (activated)="onActivated('10')"
            ></pg-square-button>
            <pg-square-button
              #button11
              buttonId="11"
              [buttonKey]="'11' | pgButtonHotkey: hotkeys"
              [isActive]="active === '11'"
              [thumbnailUrl]="collections[4]"
              (activated)="onActivated('11')"
            ></pg-square-button>
            <pg-square-button
              #button12
              buttonId="12"
              [buttonKey]="'12' | pgButtonHotkey: hotkeys"
              [isActive]="active === '12'"
              [thumbnailUrl]="collections[5]"
              (activated)="onActivated('12')"
            ></pg-square-button>
          </div>
        </div>

        <div>
          <pg-round-button
            #button13
            buttonId="13"
            [buttonKey]="'13' | pgButtonHotkey: hotkeys"
            [isActive]="active === '13'"
            thumbnailUrl="assets/power-17.png"
            (activated)="onActivated('13')"
          ></pg-round-button>

          <pg-round-button
            #button14
            buttonId="14"
            [buttonKey]="'14' | pgButtonHotkey: hotkeys"
            [isActive]="active === '14'"
            thumbnailUrl="assets/power-18.png"
            (activated)="onActivated('14')"
          ></pg-round-button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [SquareButtonComponent, RoundButtonComponent, ButtonHotkeyPipe],
})
export class DockComponent {
  @ViewChild('button1') button1: SquareButtonComponent | null = null;
  @ViewChild('button2') button2: SquareButtonComponent | null = null;
  @ViewChild('button3') button3: SquareButtonComponent | null = null;
  @ViewChild('button4') button4: SquareButtonComponent | null = null;
  @ViewChild('button5') button5: SquareButtonComponent | null = null;
  @ViewChild('button6') button6: SquareButtonComponent | null = null;
  @ViewChild('button7') button7: SquareButtonComponent | null = null;
  @ViewChild('button8') button8: SquareButtonComponent | null = null;
  @ViewChild('button9') button9: SquareButtonComponent | null = null;
  @ViewChild('button10') button10: SquareButtonComponent | null = null;
  @ViewChild('button11') button11: SquareButtonComponent | null = null;
  @ViewChild('button12') button12: RoundButtonComponent | null = null;
  @ViewChild('button13') button13: RoundButtonComponent | null = null;
  @ViewChild('button14') button14: RoundButtonComponent | null = null;
  active: string | null = null;
  instructions: string[] = [
    'assets/power-1.png',
    'assets/power-2.png',
    'assets/power-3.png',
    'assets/power-4.png',
    'assets/power-5.png',
    'assets/power-6.png',
  ];
  collections: string[] = [
    'assets/power-7.png',
    'assets/power-8.png',
    'assets/power-9.png',
    'assets/power-10.png',
    'assets/power-11.png',
    'assets/power-12.png',
  ];
  hotkeys = [
    {
      button: '1',
      key: 'q',
    },
    {
      button: '2',
      key: 'w',
    },
    {
      button: '3',
      key: 'e',
    },
    {
      button: '4',
      key: 'r',
    },
    {
      button: '5',
      key: 't',
    },
    {
      button: '6',
      key: 'y',
    },
    {
      button: '7',
      key: '1',
    },
    {
      button: '8',
      key: '2',
    },
    {
      button: '9',
      key: '3',
    },
    {
      button: '10',
      key: '4',
    },
    {
      button: '11',
      key: '5',
    },
    {
      button: '12',
      key: '6',
    },
    {
      button: '13',
      key: 'v',
    },
    {
      button: '14',
      key: 'b',
    },
  ];

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.active !== null) {
      const button = [
        this.button1,
        this.button2,
        this.button3,
        this.button4,
        this.button5,
        this.button6,
        this.button7,
        this.button8,
        this.button9,
        this.button10,
        this.button11,
        this.button12,
        this.button13,
        this.button14,
      ].find((button) => button?.buttonId === this.active);

      button?.deactivate();
      this.active = null;
    } else {
      const hotkey = this.hotkeys.find((hotkey) => hotkey.key === event.key);

      if (hotkey !== undefined) {
        const button = [
          this.button1,
          this.button2,
          this.button3,
          this.button4,
          this.button5,
          this.button6,
          this.button7,
          this.button8,
          this.button9,
          this.button10,
          this.button11,
          this.button12,
          this.button13,
          this.button14,
        ].find((button) => button?.buttonId === hotkey.button);

        button?.activate();
      }
    }
  }

  onActivated(id: string) {
    const buttons = [
      this.button1,
      this.button2,
      this.button3,
      this.button4,
      this.button5,
      this.button6,
      this.button7,
      this.button8,
      this.button9,
      this.button10,
      this.button11,
      this.button12,
      this.button13,
      this.button14,
    ];

    if (this.active === null) {
      const newlyActive =
        buttons?.find((button) => button?.buttonId === id) ?? null;

      if (newlyActive === null) {
        throw new Error('There should be an active button with the same id.');
      } else {
        this.active = id;
      }
    } else {
      if (this.active !== id) {
        const currentlyActive =
          buttons?.find((button) => button?.buttonId === this.active) ?? null;
        const newlyActive =
          buttons?.find((button) => button?.buttonId === id) ?? null;

        if (currentlyActive === null || newlyActive === null) {
          throw new Error('There should be an active button with the same id.');
        } else {
          currentlyActive.deactivate();
          this.active = id;
        }
      }
    }
  }
}

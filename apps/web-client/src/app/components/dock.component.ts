import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'pg-dock-square-button-image',
  template: `
    <img
      [src]="thumbnailUrl"
      class="w-10 h-10"
      style="border-width: 0.2rem"
      [ngClass]="{
        'opacity-80 border-l-gray-500 border-t-gray-400 border-r-gray-600 border-b-gray-700':
          !isActive && !isHovered,
        'opacity-90 border-l-gray-400 border-t-gray-300 border-r-gray-500 border-b-gray-600':
          !isActive && isHovered,
        'opacity-100 border-l-gray-300 border-t-gray-200 border-r-gray-400 border-b-gray-500':
          isActive
      }"
    />
  `,
  standalone: true,
  imports: [CommonModule],
})
export class DockButtonImageComponent {
  @Input() thumbnailUrl: string | null = null;
  @Input() isActive = false;
  @Input() isHovered = false;
}

@Component({
  selector: 'pg-dock-square-button',
  template: `
    <button
      class="bg-gray-800 relative"
      style="padding: 0.12rem"
      (click)="activate()"
      (mouseover)="onMouseOver()"
      (mouseout)="onMouseOut()"
    >
      <span
        class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
        style="font-size: 0.5rem; line-height: 0.5rem"
      >
        {{ buttonKey }}
      </span>

      <pg-dock-square-button-image
        [thumbnailUrl]="thumbnailUrl"
        [isActive]="isActive"
        [isHovered]="isHovered"
      ></pg-dock-square-button-image>
    </button>
  `,
  standalone: true,
  imports: [CommonModule, DockButtonImageComponent],
})
export class DockSquareButtonComponent {
  @Input() buttonId: string | null = null;
  @Input() buttonKey: string | null = null;
  @Input() thumbnailUrl: string | null = null;
  @Input() isActive = false;
  @Output() activated = new EventEmitter();
  @Output() deactivated = new EventEmitter();
  isHovered = false;

  activate() {
    this.activated.emit();
  }

  deactivate() {
    this.deactivated.emit();
  }

  protected onMouseOver() {
    this.isHovered = true;
  }

  protected onMouseOut() {
    this.isHovered = false;
  }
}

@Component({
  selector: 'pg-dock-round-button',
  template: `
    <div class="relative p-1">
      <span
        class="absolute top-0 left-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
        style="font-size: 0.5rem; line-height: 0.5rem"
      >
        {{ buttonKey }}
      </span>
      <button
        class="rounded-full overflow-hidden"
        (click)="activate()"
        (mouseover)="onMouseOver()"
        (mouseout)="onMouseOut()"
      >
        <img [src]="thumbnailUrl" />
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, DockButtonImageComponent],
})
export class DockRoundButtonComponent {
  @Input() buttonId: string | null = null;
  @Input() buttonKey: string | null = null;
  @Input() thumbnailUrl: string | null = null;
  @Input() isActive = false;
  @Output() activated = new EventEmitter();
  @Output() deactivated = new EventEmitter();
  isHovered = false;

  activate() {
    this.activated.emit();
  }

  deactivate() {
    this.deactivated.emit();
  }

  protected onMouseOver() {
    this.isHovered = true;
  }

  protected onMouseOut() {
    this.isHovered = false;
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

          <div class="ml-2 flex gap-2">
            <pg-dock-square-button
              #button1
              buttonId="1"
              buttonKey="q"
              [isActive]="active === '1'"
              [thumbnailUrl]="instructions[0]"
              (activated)="onActivated('1')"
            ></pg-dock-square-button>
            <pg-dock-square-button
              #button2
              buttonId="2"
              buttonKey="w"
              [isActive]="active === '2'"
              [thumbnailUrl]="instructions[1]"
              (activated)="onActivated('2')"
            ></pg-dock-square-button>
            <pg-dock-square-button
              #button3
              buttonId="3"
              buttonKey="e"
              [isActive]="active === '3'"
              [thumbnailUrl]="instructions[2]"
              (activated)="onActivated('3')"
            ></pg-dock-square-button>
            <pg-dock-square-button
              #button4
              buttonId="4"
              buttonKey="r"
              [isActive]="active === '4'"
              [thumbnailUrl]="instructions[3]"
              (activated)="onActivated('4')"
            ></pg-dock-square-button>
            <pg-dock-square-button
              #button5
              buttonId="5"
              buttonKey="t"
              [isActive]="active === '5'"
              [thumbnailUrl]="instructions[4]"
              (activated)="onActivated('5')"
            ></pg-dock-square-button>
            <pg-dock-square-button
              #button6
              buttonId="6"
              buttonKey="y"
              [isActive]="active === '6'"
              [thumbnailUrl]="instructions[5]"
              (activated)="onActivated('6')"
            ></pg-dock-square-button>
          </div>
        </div>

        <div>
          <h2>Collections</h2>

          <div class="ml-2 flex gap-2">
            <pg-dock-square-button
              #button7
              buttonId="7"
              buttonKey="1"
              [isActive]="active === '7'"
              [thumbnailUrl]="collections[0]"
              (activated)="onActivated('7')"
            ></pg-dock-square-button>
            <pg-dock-square-button
              #button8
              buttonId="8"
              buttonKey="2"
              [isActive]="active === '8'"
              [thumbnailUrl]="collections[1]"
              (activated)="onActivated('8')"
            ></pg-dock-square-button>
            <pg-dock-square-button
              #button9
              buttonId="9"
              buttonKey="3"
              [isActive]="active === '9'"
              [thumbnailUrl]="collections[2]"
              (activated)="onActivated('9')"
            ></pg-dock-square-button>
          </div>

          <div class="ml-2 flex gap-2">
            <pg-dock-square-button
              #button10
              buttonId="10"
              buttonKey="4"
              [isActive]="active === '10'"
              [thumbnailUrl]="collections[3]"
              (activated)="onActivated('10')"
            ></pg-dock-square-button>
            <pg-dock-square-button
              #button11
              buttonId="11"
              buttonKey="5"
              [isActive]="active === '11'"
              [thumbnailUrl]="collections[4]"
              (activated)="onActivated('11')"
            ></pg-dock-square-button>
            <pg-dock-square-button
              #button12
              buttonId="12"
              buttonKey="6"
              [isActive]="active === '12'"
              [thumbnailUrl]="collections[5]"
              (activated)="onActivated('12')"
            ></pg-dock-square-button>
          </div>
        </div>

        <div>
          <pg-dock-round-button
            #button13
            buttonId="13"
            buttonKey="v"
            [isActive]="active === '13'"
            thumbnailUrl="assets/power-13.png"
            (activated)="onActivated('13')"
          ></pg-dock-round-button>

          <pg-dock-round-button
            #button14
            buttonId="14"
            buttonKey="b"
            [isActive]="active === '14'"
            thumbnailUrl="assets/power-14.png"
            (activated)="onActivated('14')"
          ></pg-dock-round-button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [DockSquareButtonComponent, DockRoundButtonComponent],
})
export class DockComponent {
  @ViewChild('button1') button1: DockSquareButtonComponent | null = null;
  @ViewChild('button2') button2: DockSquareButtonComponent | null = null;
  @ViewChild('button3') button3: DockSquareButtonComponent | null = null;
  @ViewChild('button4') button4: DockSquareButtonComponent | null = null;
  @ViewChild('button5') button5: DockSquareButtonComponent | null = null;
  @ViewChild('button6') button6: DockSquareButtonComponent | null = null;
  @ViewChild('button7') button7: DockSquareButtonComponent | null = null;
  @ViewChild('button8') button8: DockSquareButtonComponent | null = null;
  @ViewChild('button9') button9: DockSquareButtonComponent | null = null;
  @ViewChild('button10') button10: DockSquareButtonComponent | null = null;
  @ViewChild('button11') button11: DockSquareButtonComponent | null = null;
  @ViewChild('button12') button12: DockRoundButtonComponent | null = null;
  @ViewChild('button13') button13: DockRoundButtonComponent | null = null;
  @ViewChild('button14') button14: DockRoundButtonComponent | null = null;
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

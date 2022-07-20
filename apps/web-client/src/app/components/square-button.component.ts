import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'pg-square-button',
  template: `
    <button
      class="bg-gray-800 relative w-full h-full"
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

      <img
        [src]="thumbnailUrl"
        class="w-full h-full box-border"
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
    </button>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class SquareButtonComponent {
  @HostBinding('class') class = 'inline-block w-11 h-11';
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

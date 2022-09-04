import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { Option } from '../../shared/utils';
import { DefaultImageDirective } from '../directives';

@Component({
  selector: 'pg-square-button',
  template: `
    <button
      *ngIf="pgThumbnailUrl !== null; else emptySlot"
      (click)="activate()"
      (mouseover)="onMouseOver()"
      (mouseout)="onMouseOut()"
      [ngClass]="{
        'opacity-80 border-l-gray-500 border-t-gray-400 border-r-gray-600 border-b-gray-700':
          !pgIsActive && !isHovered,
        'opacity-90 border-l-gray-400 border-t-gray-300 border-r-gray-500 border-b-gray-600':
          !pgIsActive && isHovered,
        'opacity-100 border-l-gray-300 border-t-gray-200 border-r-gray-400 border-b-gray-500':
          pgIsActive
      }"
      style="border-width: 0.2rem; margin: 0.12rem"
    >
      <figure>
        <img
          [src]="pgThumbnailUrl"
          [pgDefaultImage]="pgDefaultImageUrl"
          class="w-9 h-9 object-cover"
        />
      </figure>
    </button>

    <ng-template #emptySlot>
      <div class="w-9 h-9"></div>
    </ng-template>
  `,
  standalone: true,
  imports: [CommonModule, DefaultImageDirective],
})
export class SquareButtonComponent {
  @HostBinding('class') class = 'inline-block';
  @Input() pgButtonId: Option<string> = null;
  @Input() pgThumbnailUrl: Option<string> = null;
  @Input() pgDefaultImageUrl: Option<string> = null;
  @Input() pgIsActive = false;
  @Output() pgActivated = new EventEmitter();
  @Output() pgDeactivated = new EventEmitter();
  isHovered = false;

  activate() {
    this.pgActivated.emit();
  }

  deactivate() {
    this.pgDeactivated.emit();
  }

  protected onMouseOver() {
    this.isHovered = true;
  }

  protected onMouseOut() {
    this.isHovered = false;
  }
}

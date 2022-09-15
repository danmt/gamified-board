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
      style="border-width: 0.2rem; margin: 0.12rem"
    >
      <div class="bp-skin-dock-icon-border absolute -top-0.5 -left-0.5"></div>
      <figure>
        <img
          [src]="pgThumbnailUrl"
          [pgDefaultImage]="pgDefaultImageUrl"
          class="w-9 h-9"
        />
      </figure>
    </button>

    <ng-template #emptySlot>
      <div class="bp-skin-dock-icon-border absolute -top-0.5 -left-0.5"></div>
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

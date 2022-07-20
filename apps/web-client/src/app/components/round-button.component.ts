import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'pg-round-button',
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
        <img
          [src]="thumbnailUrl"
          class="w-8 h-8"
          [ngClass]="{
            'opacity-90': !isActive && !isHovered,
            'opacity-100': !isActive && isHovered,
            'opacity-100 scale-105': isActive
          }"
        />
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class RoundButtonComponent {
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

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'pg-square-button',
  template: `
    <button
      class="w-full h-full"
      (click)="activate()"
      (mouseover)="onMouseOver()"
      (mouseout)="onMouseOut()"
    >
      <img
        *ngIf="thumbnailUrl !== null"
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
  @Input() buttonId: string | null = null;
  @Input() hotkey: string | null = null;
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

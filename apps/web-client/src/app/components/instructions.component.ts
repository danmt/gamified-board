import { DIALOG_DATA } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SquareButtonComponent } from './square-button.component';

@Component({
  selector: 'pg-instructions',
  template: `
    <div class="p-4 bg-white h-full">
      <h1>Instructions</h1>

      <div class="flex flex-wrap gap-2">
        <pg-square-button
          *ngFor="let instruction of instructions"
          [thumbnailUrl]="instruction"
        ></pg-square-button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, SquareButtonComponent],
})
export class InstructionsComponent {
  instructions: string[];

  constructor(@Inject(DIALOG_DATA) data: string[]) {
    this.instructions = data;
  }
}

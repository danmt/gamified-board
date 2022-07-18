import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DockComponent } from './dock.component';
import { RowComponent } from './row.component';

export const BOARD_SIZE = 8000;

@Component({
  selector: 'pg-board',
  template: `
    <div [ngStyle]="{ width: boardSize + 'px' }">
      <pg-row class="text-2xl text-white uppercase">row 1</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 2</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 3</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 4</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 5</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 6</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 7</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 8</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 9</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 10</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 11</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 12</pg-row>
    </div>
  `,
  standalone: true,
  imports: [RowComponent, CommonModule, DockComponent],
})
export class BoardComponent {
  readonly boardSize = BOARD_SIZE;
}

import { Component, HostBinding } from '@angular/core';
import { RowComponent } from './row.component';

export const BOARD_SIZE = 8000;

@Component({
  selector: 'pg-board',
  template: `
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
  `,
  standalone: true,
  imports: [RowComponent],
})
export class BoardComponent {
  @HostBinding('class') class = 'block';
  @HostBinding('style') style = `width: ${BOARD_SIZE}px`;
}

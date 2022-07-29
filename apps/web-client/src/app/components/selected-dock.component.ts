import { Component, Input } from '@angular/core';
import { BoardDocument, BoardTask, Option } from '../utils';

@Component({
  selector: 'pg-selected-dock',
  template: `
    <div
      class="w-auto mx-auto p-4 bg-white flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.thumbnailUrl" />
    </div>
  `,
  standalone: true,
})
export class SelectedDockComponent {
  @Input() selected: Option<BoardDocument | BoardTask> = null;
}

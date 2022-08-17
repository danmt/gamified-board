import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BoardTask, Option } from '../utils';

@Component({
  selector: 'pg-selected-task-dock',
  template: `
    <div
      class="w-auto mx-auto p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.instruction?.thumbnailUrl" />

      {{ selected?.name }}
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class SelectedTaskDockComponent {
  @Input() selected: Option<BoardTask> = null;
}

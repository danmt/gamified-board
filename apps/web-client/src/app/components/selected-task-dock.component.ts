import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KeyboardListenerDirective } from '../directives';
import { Option } from '../utils';

interface SelectedTask {
  name: string;
  instruction: {
    thumbnailUrl: string;
  };
}

@Component({
  selector: 'pg-selected-task-dock',
  template: `
    <div
      class="w-auto mx-auto p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.instruction?.thumbnailUrl" />

      {{ selected?.name }}

      <button (click)="onUpdateTask()">edit</button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, KeyboardListenerDirective],
})
export class SelectedTaskDockComponent {
  @Input() selected: Option<SelectedTask> = null;
  @Output() updateTask = new EventEmitter();

  onUpdateTask() {
    this.updateTask.emit();
  }
}

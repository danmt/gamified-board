import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  Output,
} from '@angular/core';
import { DefaultImageDirective } from '../../shared/directives';
import { Entity, Option } from '../../shared/utils';
import { InstructionTaskTooltipDirective } from '../components';
import { InstructionTaskApiService } from '../services';

type InstructionTask = Entity<{
  kind: 'instructionTask';
  name: string;
  instruction: {
    name: string;
    thumbnailUrl: string;
  };
}>;

@Component({
  selector: 'pg-instruction-tasks-list',
  template: `
    <p>Tasks</p>

    <div
      [id]="pgInstructionId + '-task'"
      cdkDropList
      [cdkDropListConnectedTo]="pgDropLists"
      [cdkDropListData]="pgInstructionTasks"
      cdkDropListOrientation="horizontal"
      (cdkDropListDropped)="onDropped($event)"
      class="flex gap-2 flex-1"
    >
      <div
        *ngFor="let instructionTask of pgInstructionTasks; trackBy: trackBy"
        cdkDrag
        [cdkDragData]="instructionTask.id"
        class="bg-gray-800 relative w-11 h-11"
        style="padding: 0.12rem"
        pgInstructionTaskTooltip
        [pgInstructionTask]="instructionTask"
      >
        <button class="w-full h-full" (click)="onSelect(instructionTask.id)">
          <img
            class="w-full h-full"
            [src]="instructionTask.instruction.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-task.png"
          />
        </button>

        <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
          <img
            class="w-full h-full"
            [src]="instructionTask.instruction.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-task.png"
          />
        </div>

        <div
          *cdkDragPlaceholder=""
          class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
        >
          <img
            class="w-full h-full"
            [src]="instructionTask.instruction.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-task.png"
          />
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    DefaultImageDirective,
    InstructionTaskTooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionTasksListComponent {
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );

  @HostBinding('class') class = 'flex flex-col h-full';
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgDropLists: string[] = [];
  @Input() pgInstructionTasks: InstructionTask[] = [];
  @Output() pgSelect = new EventEmitter<string>();

  onSelect(selectId: string) {
    this.pgSelect.emit(selectId);
  }

  trackBy(index: number): number {
    return index;
  }

  onDropped(event: CdkDragDrop<InstructionTask[], InstructionTask[], string>) {
    if (event.container.id === event.previousContainer.id) {
      this._moveTask(
        event.previousContainer.id.split('-task')[0],
        event.previousContainer.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      this._transferTask(
        event.previousContainer.id.split('-task')[0],
        event.container.id.split('-task')[0],
        event.item.data,
        event.currentIndex
      );
    }
  }

  private _moveTask(
    instructionId: string,
    instructionTasks: InstructionTask[],
    previousIndex: number,
    newIndex: number
  ) {
    const applicationsOrder = instructionTasks.map(({ id }) => id);

    moveItemInArray(applicationsOrder, previousIndex, newIndex);

    this._instructionTaskApiService
      .updateInstructionTasksOrder(instructionId, applicationsOrder)
      .subscribe();
  }

  private _transferTask(
    previousInstructionId: string,
    newInstructionId: string,
    instructionTaskId: string,
    newIndex: number
  ) {
    this._instructionTaskApiService
      .transferInstructionTask(
        previousInstructionId,
        newInstructionId,
        instructionTaskId,
        newIndex
      )
      .subscribe();
  }
}

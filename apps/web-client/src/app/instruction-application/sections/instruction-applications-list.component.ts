import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
  Input,
} from '@angular/core';
import { BoardStore } from '../../core/stores';
import { DefaultImageDirective } from '../../shared/directives';
import { Entity, Option } from '../../shared/utils';
import { InstructionApplicationTooltipDirective } from '../components';
import { InstructionApplicationApiService } from '../services';

type InstructionApplication = Entity<{
  kind: 'instructionApplication';
  name: string;
  application: {
    name: string;
    thumbnailUrl: string;
  };
}>;

@Component({
  selector: 'pg-instruction-applications-list',
  template: `
    <p>Applications</p>

    <div
      [id]="pgInstructionId + '-application'"
      cdkDropList
      [cdkDropListConnectedTo]="pgDropLists"
      cdkDropListOrientation="horizontal"
      (cdkDropListDropped)="onDropped($event)"
      [cdkDropListData]="pgInstructionApplications"
      class="flex gap-2 flex-1"
    >
      <div
        *ngFor="
          let instructionApplication of pgInstructionApplications;
          trackBy: trackBy
        "
        cdkDrag
        [cdkDragData]="instructionApplication.id"
        class="bg-gray-800 relative w-11 h-11"
        style="padding: 0.12rem"
        pgInstructionApplicationTooltip
        [pgInstructionApplication]="instructionApplication"
      >
        <button
          class="w-full h-full"
          (click)="onSelect(instructionApplication.id)"
        >
          <img
            class="w-full h-full"
            [src]="instructionApplication.application.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-application.png"
          />
        </button>

        <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
          <img
            class="w-full h-full"
            [src]="instructionApplication.application.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-application.png"
          />
        </div>

        <div
          *cdkDragPlaceholder=""
          class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
        >
          <img
            class="w-full h-full"
            [src]="instructionApplication.application.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-application.png"
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
    InstructionApplicationTooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionApplicationsListComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionApplicationApiService = inject(
    InstructionApplicationApiService
  );

  @HostBinding('class') class = 'flex flex-col h-full';
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgDropLists: string[] = [];
  @Input() pgInstructionApplications: InstructionApplication[] = [];

  trackBy(index: number): number {
    return index;
  }

  onDropped(
    event: CdkDragDrop<
      InstructionApplication[],
      InstructionApplication[],
      string
    >
  ) {
    if (event.container.id === event.previousContainer.id) {
      this._moveApplication(
        event.previousContainer.id.split('-application')[0],
        event.previousContainer.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      this._transferApplication(
        event.previousContainer.id.split('-application')[0],
        event.container.id.split('-application')[0],
        event.item.data,
        event.currentIndex
      );
    }
  }

  onSelect(selectId: string) {
    this._boardStore.setSelectedId(selectId);
  }

  private _moveApplication(
    instructionId: string,
    instructionApplications: InstructionApplication[],
    previousIndex: number,
    newIndex: number
  ) {
    const applicationsOrder = instructionApplications.map(({ id }) => id);

    moveItemInArray(applicationsOrder, previousIndex, newIndex);

    this._instructionApplicationApiService
      .updateInstructionApplicationsOrder(instructionId, applicationsOrder)
      .subscribe();
  }

  private _transferApplication(
    previousInstructionId: string,
    newInstructionId: string,
    instructionApplicationId: string,
    newIndex: number
  ) {
    this._instructionApplicationApiService
      .transferInstructionApplication(
        previousInstructionId,
        newInstructionId,
        instructionApplicationId,
        newIndex
      )
      .subscribe();
  }
}

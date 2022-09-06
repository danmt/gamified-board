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
import { InstructionSysvarTooltipDirective } from '../components';
import { InstructionSysvarApiService } from '../services';

type InstructionSysvar = Entity<{
  kind: 'instructionSysvar';
  name: string;
  sysvar: {
    name: string;
    thumbnailUrl: string;
  };
}>;

@Component({
  selector: 'pg-instruction-sysvars-list',
  template: `
    <p>Sysvars</p>

    <div
      [id]="pgInstructionId + '-sysvar'"
      cdkDropList
      [cdkDropListConnectedTo]="pgDropLists"
      [cdkDropListData]="pgInstructionSysvars"
      cdkDropListOrientation="horizontal"
      (cdkDropListDropped)="onDropped($event)"
      class="flex gap-2 flex-1"
    >
      <div
        *ngFor="let instructionSysvar of pgInstructionSysvars; trackBy: trackBy"
        cdkDrag
        [cdkDragData]="instructionSysvar.id"
        class="bg-gray-800 relative w-11 h-11"
        style="padding: 0.12rem"
        pgInstructionSysvarTooltip
        [pgInstructionSysvar]="instructionSysvar"
      >
        <button class="w-full h-full" (click)="onSelect(instructionSysvar.id)">
          <img
            class="w-full h-full"
            [src]="instructionSysvar.sysvar.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-sysvar.png"
          />
        </button>

        <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
          <img
            class="w-full h-full"
            [src]="instructionSysvar.sysvar.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-sysvar.png"
          />
        </div>

        <div
          *cdkDragPlaceholder=""
          class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
        >
          <img
            class="w-full h-full"
            [src]="instructionSysvar.sysvar.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-sysvar.png"
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
    InstructionSysvarTooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionSysvarsListComponent {
  private readonly _instructionSysvarApiService = inject(
    InstructionSysvarApiService
  );

  @HostBinding('class') class = 'flex flex-col h-full';
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgDropLists: string[] = [];
  @Input() pgInstructionSysvars: InstructionSysvar[] = [];
  @Output() pgSelect = new EventEmitter<{
    id: string;
    kind: 'instructionSysvar';
  }>();

  onSelect(selectId: string) {
    this.pgSelect.emit({ id: selectId, kind: 'instructionSysvar' });
  }

  trackBy(index: number): number {
    return index;
  }

  onDropped(
    event: CdkDragDrop<InstructionSysvar[], InstructionSysvar[], string>
  ) {
    if (event.container.id === event.previousContainer.id) {
      this._moveSysvar(
        event.previousContainer.id.split('-sysvar')[0],
        event.previousContainer.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      this._transferSysvar(
        event.previousContainer.id.split('-sysvar')[0],
        event.container.id.split('-sysvar')[0],
        event.item.data,
        event.currentIndex
      );
    }
  }

  private _moveSysvar(
    instructionId: string,
    instructionSysvars: InstructionSysvar[],
    previousIndex: number,
    newIndex: number
  ) {
    const applicationsOrder = instructionSysvars.map(({ id }) => id);

    moveItemInArray(applicationsOrder, previousIndex, newIndex);

    this._instructionSysvarApiService
      .updateInstructionSysvarsOrder(instructionId, applicationsOrder)
      .subscribe();
  }

  private _transferSysvar(
    previousInstructionId: string,
    newInstructionId: string,
    instructionSysvarId: string,
    newIndex: number
  ) {
    this._instructionSysvarApiService
      .transferInstructionSysvar(
        previousInstructionId,
        newInstructionId,
        instructionSysvarId,
        newIndex
      )
      .subscribe();
  }
}

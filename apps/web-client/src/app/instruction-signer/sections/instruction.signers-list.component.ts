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
import { Entity, Option } from '../../shared/utils';
import { InstructionSignerTooltipDirective } from '../components';
import { InstructionSignerApiService } from '../services';

type InstructionSigner = Entity<{
  kind: 'instructionSigner';
  name: string;
}>;

@Component({
  selector: 'pg-instruction-signers-list',
  template: `
    <p>Signers</p>

    <div
      [id]="pgInstructionId + '-signer'"
      cdkDropList
      [cdkDropListConnectedTo]="pgDropLists"
      [cdkDropListData]="pgInstructionSigners"
      cdkDropListOrientation="horizontal"
      (cdkDropListDropped)="onDropped($event)"
      class="flex gap-2 flex-1"
    >
      <div
        *ngFor="let instructionSigner of pgInstructionSigners; trackBy: trackBy"
        cdkDrag
        [cdkDragData]="instructionSigner.id"
        class="bg-gray-800 relative w-11 h-11"
        style="padding: 0.12rem"
        pgInstructionSignerTooltip
        [pgInstructionSigner]="instructionSigner"
      >
        <button class="w-full h-full" (click)="onSelect(instructionSigner.id)">
          <img class="w-full h-full" src="assets/generic/signer.png" />
        </button>

        <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
          <img class="w-full h-full" src="assets/generic/signer.png" />
        </div>

        <div
          *cdkDragPlaceholder=""
          class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
        >
          <img class="w-full h-full" src="assets/generic/signer.png" />
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, DragDropModule, InstructionSignerTooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionSignersListComponent {
  private readonly _instructionSignerApiService = inject(
    InstructionSignerApiService
  );

  @HostBinding('class') class = 'flex flex-col h-full';
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgDropLists: string[] = [];
  @Input() pgInstructionSigners: InstructionSigner[] = [];
  @Output() pgSelect = new EventEmitter<{
    id: string;
    kind: 'instructionSigner';
  }>();

  onSelect(selectId: string) {
    this.pgSelect.emit({ id: selectId, kind: 'instructionSigner' });
  }

  trackBy(index: number): number {
    return index;
  }

  onDropped(
    event: CdkDragDrop<InstructionSigner[], InstructionSigner[], string>
  ) {
    if (event.container.id === event.previousContainer.id) {
      this._moveSigner(
        event.previousContainer.id.split('-signer')[0],
        event.previousContainer.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      this._transferSigner(
        event.previousContainer.id.split('-signer')[0],
        event.container.id.split('-signer')[0],
        event.item.data,
        event.currentIndex
      );
    }
  }

  private _moveSigner(
    instructionId: string,
    instructionSigners: InstructionSigner[],
    previousIndex: number,
    newIndex: number
  ) {
    const applicationsOrder = instructionSigners.map(({ id }) => id);

    moveItemInArray(applicationsOrder, previousIndex, newIndex);

    this._instructionSignerApiService
      .updateInstructionSignersOrder(instructionId, applicationsOrder)
      .subscribe();
  }

  private _transferSigner(
    previousInstructionId: string,
    newInstructionId: string,
    instructionSignerId: string,
    newIndex: number
  ) {
    this._instructionSignerApiService
      .transferInstructionSigner(
        previousInstructionId,
        newInstructionId,
        instructionSignerId,
        newIndex
      )
      .subscribe();
  }
}

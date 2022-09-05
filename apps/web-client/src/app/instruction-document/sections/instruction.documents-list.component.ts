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
import { InstructionDocumentTooltipDirective } from '../components';
import { InstructionDocumentApiService } from '../services';

type InstructionDocument = Entity<{
  kind: 'instructionDocument';
  name: string;
  collection: {
    name: string;
    thumbnailUrl: string;
  };
}>;

@Component({
  selector: 'pg-instruction-documents-list',
  template: `
    <p>Documents</p>

    <div
      [id]="pgInstructionId + '-document'"
      cdkDropList
      [cdkDropListConnectedTo]="pgDropLists"
      [cdkDropListData]="pgInstructionDocuments"
      cdkDropListOrientation="horizontal"
      (cdkDropListDropped)="onDropped($event)"
      class="flex gap-2 flex-1"
    >
      <div
        *ngFor="
          let instructionDocument of pgInstructionDocuments;
          trackBy: trackBy
        "
        cdkDrag
        [cdkDragData]="instructionDocument.id"
        class="bg-gray-800 relative w-11 h-11"
        style="padding: 0.12rem"
        pgInstructionDocumentTooltip
        [pgInstructionDocument]="instructionDocument"
      >
        <button
          class="w-full h-full"
          (click)="onSelect(instructionDocument.id)"
        >
          <img
            class="w-full h-full"
            [src]="instructionDocument.collection.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-document.png"
          />
        </button>

        <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
          <img
            class="w-full h-full"
            [src]="instructionDocument.collection.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-document.png"
          />
        </div>

        <div
          *cdkDragPlaceholder=""
          class="bg-yellow-500 p-1 w-12 h-12 rounded-md"
        >
          <img
            class="w-full h-full"
            [src]="instructionDocument.collection.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-document.png"
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
    InstructionDocumentTooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionDocumentsListComponent {
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );

  @HostBinding('class') class = 'flex flex-col h-full';
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgDropLists: string[] = [];
  @Input() pgInstructionDocuments: InstructionDocument[] = [];
  @Output() pgSelect = new EventEmitter<{
    id: string;
    kind: 'instructionDocument';
  }>();

  onSelect(selectId: string) {
    this.pgSelect.emit({ id: selectId, kind: 'instructionDocument' });
  }

  trackBy(index: number): number {
    return index;
  }

  onDropped(
    event: CdkDragDrop<InstructionDocument[], InstructionDocument[], string>
  ) {
    if (event.container.id === event.previousContainer.id) {
      this._moveDocument(
        event.previousContainer.id.split('-document')[0],
        event.previousContainer.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      this._transferDocument(
        event.previousContainer.id.split('-document')[0],
        event.container.id.split('-document')[0],
        event.item.data,
        event.currentIndex
      );
    }
  }

  private _moveDocument(
    instructionId: string,
    instructionDocuments: InstructionDocument[],
    previousIndex: number,
    newIndex: number
  ) {
    const applicationsOrder = instructionDocuments.map(({ id }) => id);

    moveItemInArray(applicationsOrder, previousIndex, newIndex);

    this._instructionDocumentApiService
      .updateInstructionDocumentsOrder(instructionId, applicationsOrder)
      .subscribe();
  }

  private _transferDocument(
    previousInstructionId: string,
    newInstructionId: string,
    instructionDocumentId: string,
    newIndex: number
  ) {
    this._instructionDocumentApiService
      .transferInstructionDocument(
        previousInstructionId,
        newInstructionId,
        instructionDocumentId,
        newIndex
      )
      .subscribe();
  }
}

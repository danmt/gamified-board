import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { DefaultImageDirective, Entity, Option } from '../../shared';
import { InstructionDocumentTooltipDirective } from '../components';

type InstructionDocument = Entity<{
  kind: 'instructionDocument';
  name: string;
  ownerId: string;
  collection: {
    name: string;
    thumbnailUrl: string;
  };
}>;

@Component({
  selector: 'pg-instruction-documents-list',
  template: `
    <p>Documents</p>

    <div class="flex gap-2 flex-1 min-h-[4rem]">
      <div
        *ngFor="
          let instructionDocument of pgInstructionDocuments;
          trackBy: trackBy
        "
        class="bg-gray-800 relative w-11 h-11"
        style="padding: 0.12rem"
        pgInstructionDocumentTooltip
        [pgInstructionDocument]="instructionDocument"
      >
        <button
          class="w-full h-full"
          (click)="onSelect(instructionDocument.id)"
          (dblclick)="
            onActivate(instructionDocument.ownerId, instructionDocument.id)
          "
        >
          <img
            class="w-full h-full"
            [src]="instructionDocument.collection.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-document.png"
          />
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DefaultImageDirective,
    InstructionDocumentTooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionDocumentsListComponent {
  @HostBinding('class') class = 'flex flex-col';
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgInstructionDocuments: InstructionDocument[] = [];
  @Output() pgSelect = new EventEmitter<{
    id: string;
    kind: 'instructionDocument';
  }>();
  @Output() pgActivate = new EventEmitter<{
    id: string;
    instructionId: string;
    kind: 'instructionDocument';
  }>();

  onSelect(selectId: string) {
    this.pgSelect.emit({ id: selectId, kind: 'instructionDocument' });
  }

  onActivate(instructionId: string, activeId: string) {
    this.pgActivate.emit({
      id: activeId,
      instructionId,
      kind: 'instructionDocument',
    });
  }

  trackBy(index: number): number {
    return index;
  }
}

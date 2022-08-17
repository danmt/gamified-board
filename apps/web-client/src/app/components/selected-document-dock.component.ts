import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BoardDocument, Option } from '../utils';

@Component({
  selector: 'pg-selected-document-dock',
  template: `
    <div
      class="w-auto mx-auto p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.collection?.thumbnailUrl" />

      {{ selected?.name }}
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class SelectedDocumentDockComponent {
  @Input() selected: Option<BoardDocument> = null;
}

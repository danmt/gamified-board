import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Option } from '../utils';

interface SelectedDocument {
  name: string;
  collection: {
    thumbnailUrl: string;
  };
}

@Component({
  selector: 'pg-selected-document-dock',
  template: `
    <div
      class="w-auto mx-auto p-4 bg-gray-700 flex gap-4 justify-center items-start"
    >
      <img [src]="selected?.collection?.thumbnailUrl" />

      {{ selected?.name }}

      <button (click)="onUpdateDocument()">edit</button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class SelectedDocumentDockComponent {
  @Input() selected: Option<SelectedDocument> = null;
  @Output() updateDocument = new EventEmitter();

  onUpdateDocument() {
    this.updateDocument.emit();
  }
}

import { DIALOG_DATA } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SquareButtonComponent } from './square-button.component';

@Component({
  selector: 'pg-collections',
  template: `
    <div class="p-4 bg-white h-full">
      <h1>Collections</h1>

      <div class="flex flex-wrap gap-2">
        <pg-square-button
          *ngFor="let collection of collections"
          [thumbnailUrl]="collection"
        ></pg-square-button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, SquareButtonComponent],
})
export class CollectionsComponent {
  collections: string[];

  constructor(@Inject(DIALOG_DATA) data: string[]) {
    this.collections = data;
  }
}

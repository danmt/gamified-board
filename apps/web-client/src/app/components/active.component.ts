import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Option } from '../utils';

interface Active {
  thumbnailUrl: string;
}

@Component({
  selector: 'pg-active',
  template: `
    <div
      *ngIf="pgActive !== null"
      class="inline-block relative rounded-md shadow-2xl p-1"
      [ngClass]="{
        'bg-green-500': pgCanAdd,
        'bg-red-500': !pgCanAdd
      }"
    >
      <img
        [src]="pgActive.thumbnailUrl"
        class="w-16"
        style="min-width: 4rem;"
      />

      <span
        *ngIf="pgCanAdd"
        class="text-white absolute bottom-1 right-1 leading-none"
        >+</span
      >

      <span
        *ngIf="!pgCanAdd"
        class="text-white absolute bottom-1 right-1  leading-none"
        >x</span
      >
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class ActiveComponent {
  @Input() pgActive: Option<Active> = null;
  @Input() pgCanAdd = false;
}

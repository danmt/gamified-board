import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Option } from '../utils';

export interface EditCollectionData {
  id: string;
  name: string;
  thumbnailUrl: string;
}

@Directive({ selector: '[pgEditCollectionModal]', standalone: true })
export class EditCollectionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() collection: Option<EditCollectionData> = null;
  @Output() createCollection = new EventEmitter<EditCollectionData>();
  @Output() updateCollection = new EventEmitter<EditCollectionData>();
  @HostListener('click', []) onClick() {
    this._dialog
      .open<
        EditCollectionData,
        Option<EditCollectionData>,
        EditCollectionModalComponent
      >(EditCollectionModalComponent, {
        data: this.collection,
      })
      .closed.subscribe((collectionData) => {
        if (collectionData !== undefined) {
          if (this.collection === null) {
            this.createCollection.emit(collectionData);
          } else {
            this.updateCollection.emit(collectionData);
          }
        }
      });
  }
}

@Component({
  selector: 'pg-edit-collection-modal',
  template: `
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ collection === null ? 'Create' : 'Update' }} collection
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="block" for="collection-id-input">Collection ID</label>
          <input
            class="block border-b-2 border-black"
            id="collection-id-input"
            type="text"
            formControlName="id"
            [readonly]="collection !== null"
          />
          <p *ngIf="collection === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="collection === null"
            type="button"
            (click)="onGenerateId()"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="collection-name-input">
            Collection name
          </label>
          <input
            class="block border-b-2 border-black"
            id="collection-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div>
          <label class="block" for="collection-thumbnail-url-input">
            Collection thumbnail
          </label>
          <input
            class="block border-b-2 border-black"
            id="collection-thumbnail-url-input"
            type="text"
            formControlName="thumbnailUrl"
          />
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ collection === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditCollectionModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditCollectionData, EditCollectionModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);

  readonly collection = inject<Option<EditCollectionData>>(DIALOG_DATA);
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.collection?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.collection?.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    thumbnailUrl: this._formBuilder.control<string>(
      this.collection?.thumbnailUrl ?? '',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
  });

  onSubmit() {
    if (this.form.valid) {
      const { id, name, thumbnailUrl } = this.form.value;

      if (id === undefined) {
        throw new Error('ID is not properly defined.');
      }

      if (name === undefined) {
        throw new Error('Name is not properly defined.');
      }

      if (thumbnailUrl === undefined) {
        throw new Error('Thumbnail URL is not properly defined.');
      }

      this._dialogRef.close({
        id,
        name,
        thumbnailUrl,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    this.form.get('id')?.setValue(uuid());
  }
}

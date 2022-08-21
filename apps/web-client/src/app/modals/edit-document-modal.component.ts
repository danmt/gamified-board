import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Option } from '../utils';

export interface EditDocumentData {
  document: Option<{
    id: string;
    name: string;
    method: string;
  }>;
  collection: {
    name: string;
    isInternal: boolean;
    isAnchor: boolean;
  };
}
export interface EditDocumentSubmitPayload {
  id: string;
  name: string;
  method: string;
}

@Component({
  selector: 'pg-edit-document-modal',
  template: `
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ document === null ? 'Create' : 'Update' }} {{ collection.name }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="block" for="document-id-input">Document ID</label>
          <input
            class="block border-b-2 border-black"
            id="document-id-input"
            type="text"
            formControlName="id"
            [readonly]="document !== null"
          />
          <p *ngIf="document === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="document === null"
            type="button"
            (click)="onGenerateId()"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="document-name-input"> Document name </label>
          <input
            class="block border-b-2 border-black"
            id="document-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <fieldset>
          <legend>Select a method:</legend>

          <div>
            <input
              type="radio"
              id="document-method-read"
              value="read"
              formControlName="method"
            />
            <label for="document-method-read">Read</label>
          </div>

          <div *ngIf="collection.isInternal || collection.isAnchor">
            <input
              type="radio"
              id="document-method-create"
              value="create"
              formControlName="method"
            />
            <label for="document-method-create">Create</label>
          </div>

          <div>
            <input
              type="radio"
              id="document-method-update"
              value="update"
              formControlName="method"
            />
            <label for="document-method-update">Update</label>
          </div>

          <div>
            <input
              type="radio"
              id="document-method-delete"
              value="delete"
              formControlName="method"
            />
            <label for="document-method-delete">Delete</label>
          </div>
        </fieldset>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ document === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditDocumentModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditDocumentSubmitPayload, EditDocumentModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditDocumentData>(DIALOG_DATA);

  readonly document = this._data.document;
  readonly collection = this._data.collection;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.document?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.document?.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    method: this._formBuilder.control<string>(this.document?.method ?? 'read', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  get idControl() {
    return this.form.get('id') as FormControl<string>;
  }

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  get methodControl() {
    return this.form.get('method') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const method = this.methodControl.value;

      this._dialogRef.close({
        id,
        name,
        method,
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

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

export interface EditDocumentData {
  id: string;
  name: string;
}

@Directive({ selector: '[pgEditDocumentModal]', standalone: true })
export class EditDocumentModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() document: Option<EditDocumentData> = null;
  @Output() createDocument = new EventEmitter<EditDocumentData>();
  @Output() updateDocument = new EventEmitter<EditDocumentData>();
  @HostListener('click', []) onClick() {
    this._dialog
      .open<
        EditDocumentData,
        Option<EditDocumentData>,
        EditDocumentModalComponent
      >(EditDocumentModalComponent, {
        data: this.document,
      })
      .closed.subscribe((documentData) => {
        if (documentData !== undefined) {
          if (this.document === null) {
            this.createDocument.emit(documentData);
          } else {
            this.updateDocument.emit(documentData);
          }
        }
      });
  }
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
        {{ document === null ? 'Create' : 'Update' }} document
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
    inject<DialogRef<EditDocumentData, EditDocumentModalComponent>>(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);

  readonly document = inject<Option<EditDocumentData>>(DIALOG_DATA);
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.document?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.document?.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  onSubmit() {
    if (this.form.valid) {
      const { id, name } = this.form.value;

      if (id === undefined) {
        throw new Error('ID is not properly defined.');
      }

      if (name === undefined) {
        throw new Error('Name is not properly defined.');
      }

      this._dialogRef.close({
        id,
        name,
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

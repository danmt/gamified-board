import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
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
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import {
  Entity,
  generateId,
  isNotNull,
  isNull,
  KeyboardListenerDirective,
  ModalComponent,
  Option,
  StopKeydownPropagationDirective,
} from '../../shared';

type ReferenceKind = 'document' | 'signer';

interface Reference {
  kind: ReferenceKind;
  id: string;
  name: string;
}

type InstructionDocument = Entity<{
  name: string;
  method: string;
  payer: Option<Reference>;
}>;

export interface EditInstructionDocumentData {
  instructionDocument: Option<InstructionDocument>;
  references$: Observable<Reference[]>;
}

export interface EditInstructionDocumentSubmit {
  id: string;
  name: string;
  method: string;
  payer: Option<{ kind: ReferenceKind; id: string }>;
}

export const openEditInstructionDocumentModal = (
  dialog: Dialog,
  data: EditInstructionDocumentData
) =>
  dialog.open<
    EditInstructionDocumentSubmit,
    EditInstructionDocumentData,
    EditInstructionDocumentModalComponent
  >(EditInstructionDocumentModalComponent, {
    data,
  });

@Directive({ selector: '[pgUpdateInstructionDocumentModal]', standalone: true })
export class UpdateInstructionDocumentModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionDocument: Option<InstructionDocument> = null;
  @Input() pgDocumentReferences$: Option<Observable<Reference[]>> = null;

  @Output() pgUpdateInstructionDocument =
    new EventEmitter<EditInstructionDocumentSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgInstructionDocument)) {
      throw new Error('pgInstructionDocument is missing.');
    }

    if (isNull(this.pgDocumentReferences$)) {
      throw new Error('pgDocumentReferences$ is missing.');
    }

    this.pgOpenModal.emit();

    openEditInstructionDocumentModal(this._dialog, {
      instructionDocument: this.pgInstructionDocument,
      references$: this.pgDocumentReferences$,
    }).closed.subscribe((instructionDocumentData) => {
      this.pgCloseModal.emit();

      if (instructionDocumentData !== undefined) {
        this.pgUpdateInstructionDocument.emit(instructionDocumentData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-document-modal',
  template: `
    <pg-modal
      class="px-6 pt-8 pb-4 text-white min-w-[400px] min-h-[400px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game-title uppercase">
          {{ instructionDocument === null ? 'Create' : 'Update' }} document
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[565px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="document-id-input"
            >Document ID</label
          >
          <div class="flex items-center justify-between w-full">
            <input
              class="bp-input-futuristic p-4 outline-0"
              id="document-id-input"
              type="text"
              formControlName="id"
              [readonly]="instructionDocument !== null"
            />

            <button
              *ngIf="instructionDocument === null"
              class="bp-button-generate-futuristic"
              type="button"
              (click)="idControl.setValue(onGenerateId())"
            ></button>
          </div>
          <p class="bp-font-game text-sm" *ngIf="instructionDocument === null">
            Hint: The ID cannot be changed afterwards.
          </p>
        </div>

        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="document-name-input">
            Document name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="document-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <fieldset class="mb-4 bp-font-game">
          <legend class="block text-xl">Select a method:</legend>

          <div>
            <input
              type="radio"
              id="document-method-read"
              value="read"
              formControlName="method"
              class="mr-2"
            />
            <label for="document-method-read" class="text-lg">Read</label>
          </div>

          <div>
            <input
              type="radio"
              id="document-method-create"
              value="create"
              formControlName="method"
              class="mr-2"
            />
            <label for="document-method-create" class="text-lg">Create</label>
          </div>

          <div>
            <input
              type="radio"
              id="document-method-update"
              value="update"
              formControlName="method"
              class="mr-2"
            />
            <label for="document-method-update" class="text-lg">Update</label>
          </div>

          <div>
            <input
              type="radio"
              id="document-method-delete"
              value="delete"
              formControlName="method"
              class="mr-2"
            />
            <label for="document-method-delete" class="text-lg">Delete</label>
          </div>
        </fieldset>

        <div *ngIf="methodControl.value === 'create'">
          <label class="block" for="document-payer"> Select payer </label>

          <select
            id="document-payer"
            formControlName="payer"
            [compareWith]="compareReferencesFn"
          >
            <option
              *ngFor="let reference of references$ | async"
              [ngValue]="reference"
            >
              <span class="uppercase">{{ reference.kind }}:</span>
              {{ reference.name }}
            </option>
          </select>
        </div>

        <div class="flex justify-center items-center mt-10 mb-9">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ instructionDocument === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </pg-modal>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    StopKeydownPropagationDirective,
    KeyboardListenerDirective,
    ModalComponent,
  ],
})
export class EditInstructionDocumentModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditInstructionDocumentSubmit,
        EditInstructionDocumentModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionDocumentData>(DIALOG_DATA);

  readonly instructionDocument = this._data.instructionDocument;
  readonly references$ = this._data.references$;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.instructionDocument?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(
      this.instructionDocument?.name ?? '',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
    method: this._formBuilder.control<string>(
      this.instructionDocument?.method ?? 'read',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
    payer: this._formBuilder.control<
      Option<{
        kind: ReferenceKind;
        id: string;
        name: string;
      }>
    >(this.instructionDocument?.payer ?? null),
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

  get payerControl() {
    return this.form.get('payer') as FormControl<
      Option<{
        kind: ReferenceKind;
        id: string;
        name: string;
      }>
    >;
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const method = this.methodControl.value;
      const payer = this.payerControl.value;

      this._dialogRef.close({
        id,
        name,
        method,
        payer: isNotNull(payer)
          ? {
              kind: payer.kind,
              id: payer.id,
            }
          : null,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  displayFn(reference: Option<Reference>): string {
    if (isNull(reference)) {
      return '';
    }

    switch (reference.kind) {
      case 'document':
        return `Document: ${reference.name}`;

      case 'signer':
        return `Signer: ${reference.name}`;
    }
  }

  compareReferencesFn(
    reference1: Option<{ id: string }>,
    reference2: Option<{ id: string }>
  ) {
    return (
      (isNull(reference1) && isNull(reference2)) ||
      reference1?.id === reference2?.id
    );
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this._dialogRef.close();
    }
  }

  onGenerateId() {
    return generateId();
  }
}

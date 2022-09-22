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
import { ModalComponent } from '../../shared/components';
import {
  KeyListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, isNull, Option } from '../../shared/utils';

export type FieldType =
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'string'
  | 'pubkey'
  | 'struct';

export type Field = Entity<{
  data: { name: string; type: FieldType };
}>;

export interface EditFieldData {
  field: Option<Field>;
}

export type CreateFieldSubmit = {
  name: string;
  type: FieldType;
};

export type UpdateFieldSubmit = {
  name: string;
  type: FieldType;
};

export const openEditFieldModal = (dialog: Dialog, data: EditFieldData) =>
  dialog.open<
    CreateFieldSubmit | UpdateFieldSubmit,
    EditFieldData,
    EditFieldModalComponent
  >(EditFieldModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateFieldModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateFieldModalDirective {
  private readonly _dialog = inject(Dialog);

  @Output() pgCreateField = new EventEmitter<CreateFieldSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    openEditFieldModal(this._dialog, {
      field: null,
    }).closed.subscribe((fieldData) => {
      this.pgCloseModal.emit();

      if (fieldData !== undefined) {
        this.pgCreateField.emit(fieldData);
      }
    });
  }
}

@Directive({
  selector: '[pgUpdateFieldModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateFieldModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgField: Option<Field> = null;

  @Output() pgUpdateField = new EventEmitter<UpdateFieldSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgField)) {
      throw new Error('pgField is missing');
    }

    this.pgOpenModal.emit();

    openEditFieldModal(this._dialog, {
      field: this.pgField,
    }).closed.subscribe((fieldData) => {
      this.pgCloseModal.emit();

      if (fieldData !== undefined) {
        this.pgUpdateField.emit(fieldData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-field-modal',
  template: `
    <pg-modal
      class="text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyListener="Escape"
      (pgKeyDown)="onClose()"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game-title uppercase">
          {{ field === null ? 'Create' : 'Update' }} field
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="field-name-input">
            Field name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="field-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="field-type-input">
            Field type
          </label>

          <select
            class="block bg-transparent"
            formControlName="type"
            id="field-type-input"
          >
            <option class="text-black" value="" selected="selected" disabled>
              Field type
            </option>
            <option class="text-black" value="u8">u8</option>
            <option class="text-black" value="u16">u16</option>
            <option class="text-black" value="u32">u32</option>
            <option class="text-black" value="u64">u64</option>
            <option class="text-black" value="string">String</option>
            <option class="text-black" value="pubkey">Pubkey</option>
            <option class="text-black" value="struct">Struct</option>
          </select>
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ field === null ? 'Send' : 'Save' }}
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
    KeyListenerDirective,
    ModalComponent,
  ],
})
export class EditFieldModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<CreateFieldSubmit | UpdateFieldSubmit, EditFieldModalComponent>
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditFieldData>(DIALOG_DATA);

  readonly field = this._data.field;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.field?.data.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    type: this._formBuilder.control<FieldType>(this.field?.data.type ?? 'u8', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  get typeControl() {
    return this.form.get('type') as FormControl<FieldType>;
  }

  onSubmit() {
    if (this.form.valid) {
      const name = this.nameControl.value;
      const type = this.typeControl.value;

      this._dialogRef.close({
        name,
        type,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

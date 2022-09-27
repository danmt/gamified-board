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

export type Sysvar = Entity<{
  data: { name: string };
}>;

export interface EditSysvarData {
  sysvar: Option<Sysvar>;
}

export type CreateSysvarSubmit = {
  name: string;
};

export type UpdateSysvarSubmit = {
  name: string;
};

export const openEditSysvarModal = (dialog: Dialog, data: EditSysvarData) =>
  dialog.open<
    CreateSysvarSubmit | UpdateSysvarSubmit,
    EditSysvarData,
    EditSysvarModalComponent
  >(EditSysvarModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateSysvarModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateSysvarModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<DialogRef<CreateSysvarSubmit, EditSysvarModalComponent>> =
    null;

  @Output() pgCreateSysvar = new EventEmitter<CreateSysvarSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    this.dialogRef = openEditSysvarModal(this._dialog, {
      sysvar: null,
    });

    this.dialogRef.closed.subscribe((sysvarData) => {
      this.pgCloseModal.emit();

      if (sysvarData !== undefined) {
        this.pgCreateSysvar.emit(sysvarData);
      }
    });

    return this.dialogRef;
  }
}

@Directive({
  selector: '[pgUpdateSysvarModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateSysvarModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<DialogRef<UpdateSysvarSubmit, EditSysvarModalComponent>> =
    null;

  @Input() pgSysvar: Option<Sysvar> = null;
  @Output() pgUpdateSysvar = new EventEmitter<UpdateSysvarSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgSysvar)) {
      throw new Error('pgSysvar is missing');
    }

    this.pgOpenModal.emit();

    this.dialogRef = openEditSysvarModal(this._dialog, {
      sysvar: this.pgSysvar,
    });

    this.dialogRef.closed.subscribe((sysvarData) => {
      this.pgCloseModal.emit();

      if (sysvarData !== undefined) {
        this.pgUpdateSysvar.emit(sysvarData);
      }
    });

    return this.dialogRef;
  }
}

@Component({
  selector: 'pg-edit-sysvar-modal',
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
          {{ sysvar === null ? 'Create' : 'Update' }} sysvar
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="sysvar-name-input">
            Sysvar name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="sysvar-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ sysvar === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </pg-modal>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StopKeydownPropagationDirective,
    KeyListenerDirective,
    ModalComponent,
  ],
})
export class EditSysvarModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        CreateSysvarSubmit | UpdateSysvarSubmit,
        EditSysvarModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditSysvarData>(DIALOG_DATA);

  readonly sysvar = this._data.sysvar;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.sysvar?.data.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const name = this.nameControl.value;

      this._dialogRef.close({
        name,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

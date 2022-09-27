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

export type Program = Entity<{
  data: { name: string };
}>;

export interface EditProgramData {
  program: Option<Program>;
}

export type CreateProgramSubmit = {
  name: string;
};

export type UpdateProgramSubmit = {
  name: string;
};

export const openEditProgramModal = (dialog: Dialog, data: EditProgramData) =>
  dialog.open<
    CreateProgramSubmit | UpdateProgramSubmit,
    EditProgramData,
    EditProgramModalComponent
  >(EditProgramModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateProgramModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateProgramModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<DialogRef<CreateProgramSubmit, EditProgramModalComponent>> =
    null;

  @Output() pgCreateProgram = new EventEmitter<CreateProgramSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    this.dialogRef = openEditProgramModal(this._dialog, {
      program: null,
    });

    this.dialogRef.closed.subscribe((programData) => {
      this.pgCloseModal.emit();

      if (programData !== undefined) {
        this.pgCreateProgram.emit(programData);
      }
    });

    return this.dialogRef;
  }
}

@Directive({
  selector: '[pgUpdateProgramModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateProgramModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<DialogRef<UpdateProgramSubmit, EditProgramModalComponent>> =
    null;

  @Input() pgProgram: Option<Program> = null;
  @Output() pgUpdateProgram = new EventEmitter<UpdateProgramSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgProgram)) {
      throw new Error('pgProgram is missing');
    }

    this.pgOpenModal.emit();

    this.dialogRef = openEditProgramModal(this._dialog, {
      program: this.pgProgram,
    });

    this.dialogRef.closed.subscribe((programData) => {
      this.pgCloseModal.emit();

      if (programData !== undefined) {
        this.pgUpdateProgram.emit(programData);
      }
    });

    return this.dialogRef;
  }
}

@Component({
  selector: 'pg-edit-program-modal',
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
          {{ program === null ? 'Create' : 'Update' }} program
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="program-name-input">
            Program name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="program-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ program === null ? 'Send' : 'Save' }}
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
export class EditProgramModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        CreateProgramSubmit | UpdateProgramSubmit,
        EditProgramModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditProgramData>(DIALOG_DATA);

  readonly program = this._data.program;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.program?.data.name ?? '', {
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

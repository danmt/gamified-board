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

export type Application = Entity<{
  data: { name: string };
}>;

export interface EditApplicationData {
  application: Option<Application>;
}

export type UpdateApplicationSubmit = {
  name: string;
};

export type CreateApplicationSubmit = {
  name: string;
};

export const openEditApplicationModal = (
  dialog: Dialog,
  data: EditApplicationData
) =>
  dialog.open<
    CreateApplicationSubmit | UpdateApplicationSubmit,
    EditApplicationData,
    EditApplicationModalComponent
  >(EditApplicationModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateApplicationModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateApplicationModalDirective {
  private readonly _dialog = inject(Dialog);

  @Output() pgCreateApplication = new EventEmitter<CreateApplicationSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    openEditApplicationModal(this._dialog, {
      application: null,
    }).closed.subscribe((applicationData) => {
      this.pgCloseModal.emit();

      if (applicationData !== undefined) {
        this.pgCreateApplication.emit(applicationData);
      }
    });
  }
}

@Directive({
  selector: '[pgUpdateApplicationModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateApplicationModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgApplication: Option<Application> = null;

  @Output() pgUpdateApplication = new EventEmitter<UpdateApplicationSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgApplication)) {
      throw new Error('pgApplication is missing');
    }

    this.pgOpenModal.emit();

    openEditApplicationModal(this._dialog, {
      application: this.pgApplication,
    }).closed.subscribe((applicationData) => {
      this.pgCloseModal.emit();

      if (applicationData !== undefined) {
        this.pgUpdateApplication.emit(applicationData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-application-modal',
  template: `
    <pg-modal
      class="px-6 pt-8 pb-4 text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyListener="Escape"
      (pgKeyDown)="onClose()"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game uppercase">
          {{ application === null ? 'Create' : 'Update' }} application
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="mb-4">
          <label class="block" for="application-name-input">
            Application name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="application-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ application === null ? 'Send' : 'Save' }}
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
export class EditApplicationModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        CreateApplicationSubmit | UpdateApplicationSubmit,
        EditApplicationModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditApplicationData>(DIALOG_DATA);

  readonly application = this._data.application;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.application?.data.name ?? '', {
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

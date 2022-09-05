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
import { v4 as uuid } from 'uuid';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, isNull, Option } from '../../shared/utils';

export type InstructionApplication = Entity<{
  name: string;
}>;

export interface EditInstructionApplicationData {
  instructionApplication: Option<InstructionApplication>;
}

export type EditInstructionApplicationSubmit = InstructionApplication;

export const openEditInstructionApplicationModal = (
  dialog: Dialog,
  data: EditInstructionApplicationData
) =>
  dialog.open<
    EditInstructionApplicationSubmit,
    EditInstructionApplicationData,
    EditInstructionApplicationModalComponent
  >(EditInstructionApplicationModalComponent, {
    data,
  });

@Directive({
  selector: '[pgEditInstructionApplicationModal]',
  standalone: true,
})
export class EditInstructionApplicationModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionApplication: Option<InstructionApplication> = null;

  @Output() pgCreateInstructionApplication =
    new EventEmitter<EditInstructionApplicationSubmit>();
  @Output() pgUpdateInstructionApplication =
    new EventEmitter<EditInstructionApplicationSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.pgOpenModal.emit();

    openEditInstructionApplicationModal(this._dialog, {
      instructionApplication: this.pgInstructionApplication,
    }).closed.subscribe((instructionApplicationData) => {
      this.pgCloseModal.emit();

      if (instructionApplicationData !== undefined) {
        if (isNull(this.pgInstructionApplication)) {
          this.pgCreateInstructionApplication.emit(instructionApplicationData);
        } else {
          this.pgUpdateInstructionApplication.emit(instructionApplicationData);
        }
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-application-modal',
  template: `
    <div
      class="px-4 pt-8 pb-4 bg-white shadow-xl relative"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
    >
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ instructionApplication === null ? 'Create' : 'Update' }} application
      </h1>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="max-h-96 overflow-y-auto"
      >
        <div>
          <label class="block" for="instruction-application-id-input"
            >Application ID</label
          >
          <input
            class="block border-b-2 border-black"
            id="instruction-application-id-input"
            type="text"
            formControlName="id"
            [readonly]="instructionApplication !== null"
          />
          <p *ngIf="instructionApplication === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="instructionApplication === null"
            type="button"
            (click)="idControl.setValue(onGenerateId())"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="instruction-application-name-input">
            Application name
          </label>
          <input
            class="block border-b-2 border-black"
            id="instruction-application-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ instructionApplication === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StopKeydownPropagationDirective,
    KeyboardListenerDirective,
  ],
})
export class EditInstructionApplicationModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditInstructionApplicationSubmit,
        EditInstructionApplicationModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionApplicationData>(DIALOG_DATA);

  readonly instructionApplication = this._data.instructionApplication;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(
      this.instructionApplication?.id ?? '',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
    name: this._formBuilder.control<string>(
      this.instructionApplication?.name ?? '',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
  });

  get idControl() {
    return this.form.get('id') as FormControl<string>;
  }

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;

      this._dialogRef.close({
        id,
        name,
      });
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this._dialogRef.close();
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    return uuid();
  }
}

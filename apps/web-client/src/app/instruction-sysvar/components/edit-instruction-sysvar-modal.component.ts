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
import { ModalComponent } from '../../shared/components';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, isNull, Option } from '../../shared/utils';

export type InstructionSysvar = Entity<{
  name: string;
}>;

export interface EditInstructionSysvarData {
  instructionSysvar: Option<InstructionSysvar>;
}

export type EditInstructionSysvarSubmit = InstructionSysvar;

export const openEditInstructionSysvarModal = (
  dialog: Dialog,
  data: EditInstructionSysvarData
) =>
  dialog.open<
    EditInstructionSysvarSubmit,
    EditInstructionSysvarData,
    EditInstructionSysvarModalComponent
  >(EditInstructionSysvarModalComponent, {
    data,
  });

@Directive({ selector: '[pgEditInstructionSysvarModal]', standalone: true })
export class EditInstructionSysvarModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionSysvar: Option<InstructionSysvar> = null;

  @Output() pgCreateInstructionSysvar =
    new EventEmitter<EditInstructionSysvarSubmit>();
  @Output() pgUpdateInstructionSysvar =
    new EventEmitter<EditInstructionSysvarSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.pgOpenModal.emit();

    openEditInstructionSysvarModal(this._dialog, {
      instructionSysvar: this.pgInstructionSysvar,
    }).closed.subscribe((instructionSysvarData) => {
      this.pgCloseModal.emit();

      if (instructionSysvarData !== undefined) {
        if (isNull(this.pgInstructionSysvar)) {
          this.pgCreateInstructionSysvar.emit(instructionSysvarData);
        } else {
          this.pgUpdateInstructionSysvar.emit(instructionSysvarData);
        }
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-sysvar-modal',
  template: `
    <pg-modal
      class="px-6 pt-8 pb-4 text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game uppercase">
          {{ sysvar === null ? 'Create' : 'Update' }} sysvar
        </h1>
        <button
          class="bp-button-close-futuristic z-20 outline-0"
          (click)="onClose()"
        ></button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="sysvar-id-input"
            >Sysvar ID</label
          >
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="sysvar-id-input"
            type="text"
            formControlName="id"
            [readonly]="sysvar !== null"
          />
          <p *ngIf="sysvar === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="sysvar === null"
            type="button"
            (click)="idControl.setValue(onGenerateId())"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            Generate
          </button>
        </div>

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

        <div class="flex justify-center items-center mt-10">
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
    KeyboardListenerDirective,
    ModalComponent,
  ],
})
export class EditInstructionSysvarModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditInstructionSysvarSubmit,
        EditInstructionSysvarModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionSysvarData>(DIALOG_DATA);

  readonly sysvar = this._data.instructionSysvar;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.sysvar?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.sysvar?.name ?? '', {
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

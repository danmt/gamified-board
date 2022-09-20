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
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, generateId, isNull, Option } from '../../shared/utils';

export type Instruction = Entity<{
  data: { name: string };
}>;

export interface EditInstructionData {
  instruction: Option<Instruction>;
}

export type CreateInstructionSubmit = {
  name: string;
};

export type UpdateInstructionSubmit = {
  name: string;
};

export const openEditInstructionModal = (
  dialog: Dialog,
  data: EditInstructionData
) =>
  dialog.open<
    CreateInstructionSubmit | UpdateInstructionSubmit,
    EditInstructionData,
    EditInstructionModalComponent
  >(EditInstructionModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateInstructionModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateInstructionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Output() pgCreateInstruction = new EventEmitter<CreateInstructionSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    openEditInstructionModal(this._dialog, {
      instruction: null,
    }).closed.subscribe((instructionData) => {
      this.pgCloseModal.emit();

      if (instructionData !== undefined) {
        this.pgCreateInstruction.emit(instructionData);
      }
    });
  }
}

@Directive({
  selector: '[pgUpdateInstructionModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateInstructionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstruction: Option<Instruction> = null;

  @Output() pgUpdateInstruction = new EventEmitter<UpdateInstructionSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgInstruction)) {
      throw new Error('pgInstruction is missing');
    }

    this.pgOpenModal.emit();

    openEditInstructionModal(this._dialog, {
      instruction: this.pgInstruction,
    }).closed.subscribe((instructionData) => {
      this.pgCloseModal.emit();

      if (instructionData !== undefined) {
        this.pgUpdateInstruction.emit(instructionData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-modal',
  template: `
    <pg-modal
      class="text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game-title uppercase">
          {{ instruction === null ? 'Create' : 'Update' }} instruction
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div class="mb-4">
          <label
            class="block bp-font-game text-xl"
            for="instruction-name-input"
          >
            Instruction name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="instruction-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ instruction === null ? 'Send' : 'Save' }}
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
export class EditInstructionModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        CreateInstructionSubmit | UpdateInstructionSubmit,
        EditInstructionModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionData>(DIALOG_DATA);

  readonly instruction = this._data.instruction;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.instruction?.data.name ?? '', {
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

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this._dialogRef.close();
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    return generateId();
  }
}

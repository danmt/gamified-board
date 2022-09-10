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
  name: string;
}>;

export interface EditInstructionData {
  instruction: Option<Instruction>;
}

export type EditInstructionSubmit = Instruction;

export type CreateInstructionSubmit = Instruction & {
  workspaceId: string;
  applicationId: string;
};

export const openEditInstructionModal = (
  dialog: Dialog,
  data: EditInstructionData
) =>
  dialog.open<
    EditInstructionSubmit,
    EditInstructionData,
    EditInstructionModalComponent
  >(EditInstructionModalComponent, {
    data,
  });

@Directive({ selector: '[pgCreateInstructionModal]', standalone: true })
export class CreateInstructionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgWorkspaceId: Option<string> = null;
  @Input() pgApplicationId: Option<string> = null;

  @Output() pgCreateInstruction = new EventEmitter<CreateInstructionSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgWorkspaceId)) {
      throw new Error('pgWorkspaceId is missing');
    }

    if (isNull(this.pgApplicationId)) {
      throw new Error('pgApplicationId is missing');
    }

    const workspaceId = this.pgWorkspaceId;
    const applicationId = this.pgApplicationId;

    this.pgOpenModal.emit();

    openEditInstructionModal(this._dialog, {
      instruction: null,
    }).closed.subscribe((instructionData) => {
      this.pgCloseModal.emit();

      if (instructionData !== undefined) {
        this.pgCreateInstruction.emit({
          ...instructionData,
          workspaceId,
          applicationId,
        });
      }
    });
  }
}

@Directive({ selector: '[pgUpdateInstructionModal]', standalone: true })
export class UpdateInstructionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstruction: Option<Instruction> = null;

  @Output() pgUpdateInstruction = new EventEmitter<EditInstructionSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
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
        <h1 class="text-center text-3xl mb-4 bp-font-game uppercase">
          {{ instruction === null ? 'Create' : 'Update' }} instruction
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="instruction-id-input"
            >Instruction ID</label
          >
          <div class="flex items-center justify-between w-full">
            <input
              class="bp-input-futuristic p-4 outline-0"
              id="instruction-id-input"
              type="text"
              formControlName="id"
              [readonly]="instruction !== null"
            />
            <button
              *ngIf="instruction === null"
              class="bp-button-generate-futuristic"
              type="button"
              (click)="idControl.setValue(onGenerateId())"
            ></button>
          </div>
          <p class="bp-font-game text-sm" *ngIf="instruction === null">
            Hint: The ID cannot be changed afterwards.
          </p>
        </div>

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
    inject<DialogRef<EditInstructionSubmit, EditInstructionModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionData>(DIALOG_DATA);

  readonly instruction = this._data.instruction;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.instruction?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.instruction?.name ?? '', {
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
    return generateId();
  }
}

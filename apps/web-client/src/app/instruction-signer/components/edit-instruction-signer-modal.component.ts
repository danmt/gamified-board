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
import {
  Entity,
  generateId,
  isNull,
  KeyboardListenerDirective,
  ModalComponent,
  Option,
  StopKeydownPropagationDirective,
} from '../../shared';

export type InstructionSigner = Entity<{
  name: string;
  saveChanges: boolean;
}>;

export interface EditInstructionSignerData {
  instructionSigner: Option<InstructionSigner>;
}

export type EditInstructionSignerSubmit = InstructionSigner;

export const openEditInstructionSignerModal = (
  dialog: Dialog,
  data: EditInstructionSignerData
) =>
  dialog.open<
    EditInstructionSignerSubmit,
    EditInstructionSignerData,
    EditInstructionSignerModalComponent
  >(EditInstructionSignerModalComponent, {
    data,
  });

@Directive({ selector: '[pgUpdateInstructionSignerModal]', standalone: true })
export class UpdateInstructionSignerModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionSigner: Option<InstructionSigner> = null;

  @Output() pgUpdateInstructionSigner =
    new EventEmitter<EditInstructionSignerSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgInstructionSigner)) {
      throw new Error('pgInstructionSigner is missing.');
    }

    this.pgOpenModal.emit();

    openEditInstructionSignerModal(this._dialog, {
      instructionSigner: this.pgInstructionSigner,
    }).closed.subscribe((instructionSignerData) => {
      this.pgCloseModal.emit();

      if (instructionSignerData !== undefined) {
        this.pgUpdateInstructionSigner.emit(instructionSignerData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-signer-modal',
  template: `
    <pg-modal
      class="px-6 pt-8 pb-4 text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game uppercase">
          {{ instructionSigner === null ? 'Create' : 'Update' }} signer
        </h1>
        <button
          class="bp-button-close-futuristic z-20 outline-0"
          (click)="onClose()"
        ></button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="signer-id-input"
            >Signer ID</label
          >
          <div class="flex items-center justify-between w-full">
            <input
              class="bp-input-futuristic p-4 outline-0"
              id="signer-id-input"
              type="text"
              formControlName="id"
              [readonly]="instructionSigner !== null"
            />
            <button
              *ngIf="instructionSigner === null"
              type="button"
              class="bp-button-generate-futuristic"
              (click)="idControl.setValue(onGenerateId())"
            ></button>
          </div>
          <p class="bp-font-game text-sm" *ngIf="instructionSigner === null">
            Hint: The ID cannot be changed afterwards.
          </p>
        </div>

        <div>
          <label class="block bp-font-game text-xl" for="signer-name-input">
            Signer name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="signer-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="mb-4">
          <input
            formControlName="saveChanges"
            type="checkbox"
            id="signer-save-chages"
          />
          <label for="signer-save-chages"> Save changes </label>
        </div>

        <div class="flex justify-center items-center mt-10">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ instructionSigner === null ? 'Send' : 'Save' }}
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
export class EditInstructionSignerModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditInstructionSignerSubmit,
        EditInstructionSignerModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionSignerData>(DIALOG_DATA);

  readonly instructionSigner = this._data.instructionSigner;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.instructionSigner?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(
      this.instructionSigner?.name ?? '',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
    saveChanges: this._formBuilder.control<boolean>(
      this.instructionSigner?.saveChanges ?? false,
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

  get saveChangesControl() {
    return this.form.get('saveChanges') as FormControl<boolean>;
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const saveChanges = this.saveChangesControl.value;

      this._dialogRef.close({
        id,
        name,
        saveChanges,
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

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
import { Option } from '../utils';

export interface EditInstructionSignerData {
  id: string;
  name: string;
  saveChanges: boolean;
}

@Directive({ selector: '[pgEditInstructionSignerModal]', standalone: true })
export class EditInstructionSignerModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() instructionSigner: Option<EditInstructionSignerData> = null;
  @Output() createInstructionSigner =
    new EventEmitter<EditInstructionSignerData>();
  @Output() updateInstructionSigner =
    new EventEmitter<EditInstructionSignerData>();
  @HostListener('click', []) onClick() {
    this._dialog
      .open<
        EditInstructionSignerData,
        Option<EditInstructionSignerData>,
        EditInstructionSignerModalComponent
      >(EditInstructionSignerModalComponent, {
        data: this.instructionSigner,
      })
      .closed.subscribe((instructionSignerData) => {
        if (instructionSignerData !== undefined) {
          if (this.instructionSigner === null) {
            this.createInstructionSigner.emit(instructionSignerData);
          } else {
            this.updateInstructionSigner.emit(instructionSignerData);
          }
        }
      });
  }
}

@Component({
  selector: 'pg-edit-instruction-signer-modal',
  template: `
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ signer === null ? 'Create' : 'Update' }} signer
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="block" for="signer-id-input">Signer ID</label>
          <input
            class="block border-b-2 border-black"
            id="signer-id-input"
            type="text"
            formControlName="id"
            [readonly]="signer !== null"
          />
          <p *ngIf="signer === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="signer === null"
            type="button"
            (click)="idControl.setValue(onGenerateId())"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="signer-name-input"> Signer name </label>
          <input
            class="block border-b-2 border-black"
            id="signer-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div>
          <input
            formControlName="saveChanges"
            type="checkbox"
            id="signer-save-chages"
          />
          <label for="signer-save-chages"> Save changes </label>
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ signer === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditInstructionSignerModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<EditInstructionSignerData, EditInstructionSignerModalComponent>
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);

  readonly signer = inject<Option<EditInstructionSignerData>>(DIALOG_DATA);
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.signer?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.signer?.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    saveChanges: this._formBuilder.control<boolean>(
      this.signer?.saveChanges ?? false,
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

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    return uuid();
  }
}

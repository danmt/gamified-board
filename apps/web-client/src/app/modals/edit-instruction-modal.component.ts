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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Option } from '../utils';

export interface EditInstructionData {
  id: string;
  name: string;
  thumbnailUrl: string;
}

@Directive({ selector: '[pgEditInstructionModal]', standalone: true })
export class EditInstructionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() instruction: Option<EditInstructionData> = null;
  @Output() createInstruction = new EventEmitter<EditInstructionData>();
  @Output() updateInstruction = new EventEmitter<EditInstructionData>();
  @HostListener('click', []) onClick() {
    this._dialog
      .open<
        EditInstructionData,
        Option<EditInstructionData>,
        EditInstructionModalComponent
      >(EditInstructionModalComponent, {
        data: this.instruction,
      })
      .closed.subscribe((instructionData) => {
        if (instructionData !== undefined) {
          if (this.instruction === null) {
            this.createInstruction.emit(instructionData);
          } else {
            this.updateInstruction.emit(instructionData);
          }
        }
      });
  }
}

@Component({
  selector: 'pg-edit-instruction-modal',
  template: `
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ instruction === null ? 'Create' : 'Update' }} instruction
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="block" for="instruction-id-input">Instruction ID</label>
          <input
            class="block border-b-2 border-black"
            id="instruction-id-input"
            type="text"
            formControlName="id"
            [readonly]="instruction !== null"
          />
          <p *ngIf="instruction === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="instruction === null"
            type="button"
            (click)="onGenerateId()"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="instruction-name-input">
            Instruction name
          </label>
          <input
            class="block border-b-2 border-black"
            id="instruction-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div>
          <label class="block" for="instruction-thumbnail-url-input">
            Instruction thumbnail
          </label>
          <input
            class="block border-b-2 border-black"
            id="instruction-thumbnail-url-input"
            type="text"
            formControlName="thumbnailUrl"
          />
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ instruction === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditInstructionModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditInstructionData, EditInstructionModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);

  readonly instruction = inject<Option<EditInstructionData>>(DIALOG_DATA);
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.instruction?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.instruction?.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    thumbnailUrl: this._formBuilder.control<string>(
      this.instruction?.thumbnailUrl ?? '',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
  });

  onSubmit() {
    if (this.form.valid) {
      const { id, name, thumbnailUrl } = this.form.value;

      if (id === undefined) {
        throw new Error('ID is not properly defined.');
      }

      if (name === undefined) {
        throw new Error('Name is not properly defined.');
      }

      if (thumbnailUrl === undefined) {
        throw new Error('Thumbnail URL is not properly defined.');
      }

      this._dialogRef.close({
        id,
        name,
        thumbnailUrl,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    this.form.get('id')?.setValue(uuid());
  }
}

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
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Option } from '../utils';

export interface EditInstructionData {
  id: string;
  name: string;
  thumbnailUrl: string;
  arguments: { name: string; type: string; isOption: boolean }[];
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

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="max-h-96 overflow-y-auto"
      >
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

        <div formArrayName="arguments">
          <p>
            <span>Instruction arguments</span>
            <button (click)="onAddAttribute()" type="button">+</button>
          </p>

          <div class="flex flex-col gap-2">
            <div
              *ngFor="
                let argumentForm of argumentsControl.controls;
                let i = index
              "
              class="border-black border-2 p-2"
            >
              <div [formGroup]="argumentForm">
                <div>
                  <label
                    class="block"
                    [for]="'instruction-arguments-' + i + '-name'"
                  >
                    Attribute name
                  </label>
                  <input
                    [id]="'instruction-arguments-' + i + '-name'"
                    formControlName="name"
                    class="block border-b-2 border-black"
                    type="text"
                  />
                </div>
                <div>
                  <label
                    class="block"
                    [for]="'instruction-arguments-' + i + '-type'"
                  >
                    Attribute type
                  </label>

                  <select
                    class="block"
                    formControlName="type"
                    [id]="'instruction-arguments-' + i + '-type'"
                  >
                    <option value="u8">u8</option>
                    <option value="u16">u16</option>
                    <option value="u32">u32</option>
                    <option value="u64">u64</option>
                    <option value="String">String</option>
                    <option value="Pubkey">Public Key</option>
                  </select>
                </div>

                <div>
                  <input
                    formControlName="isOption"
                    type="checkbox"
                    [id]="'instruction-arguments-' + i + '-is-option'"
                  />
                  <label for="'instruction-arguments-' + i + '-is-option'"
                    >Is Optional</label
                  >
                </div>

                <button (click)="onRemoveAttribute(i)" type="button">x</button>
              </div>
            </div>
          </div>
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
    arguments: this.instruction?.arguments
      ? this._formBuilder.array(
          this.instruction.arguments.map((argument) =>
            this._formBuilder.group({
              name: this._formBuilder.control<string>(argument.name, {
                validators: [Validators.required],
                nonNullable: true,
              }),
              type: this._formBuilder.control<string>(argument.type, {
                validators: [Validators.required],
                nonNullable: true,
              }),
              isOption: this._formBuilder.control<boolean>(argument.isOption, {
                nonNullable: true,
              }),
            })
          )
        )
      : this._formBuilder.array([]),
  });

  get idControl() {
    return this.form.get('id') as FormControl<string>;
  }

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  get thumbnailUrlControl() {
    return this.form.get('thumbnailUrl') as FormControl<string>;
  }

  get argumentsControl() {
    return this.form.get('arguments') as FormArray<
      FormGroup<{
        name: FormControl<string>;
        type: FormControl<string>;
        isOption: FormControl<boolean>;
      }>
    >;
  }

  onAddAttribute() {
    const argumentForm = this._formBuilder.group({
      name: this._formBuilder.control<string>('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      type: this._formBuilder.control<string>('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      isOption: this._formBuilder.control<boolean>(false, {
        nonNullable: true,
      }),
    });

    this.argumentsControl.push(argumentForm);
  }

  onRemoveAttribute(index: number) {
    this.argumentsControl.removeAt(index);
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const thumbnailUrl = this.thumbnailUrlControl.value;
      const args = this.argumentsControl.controls.map((argumentForm) => {
        const nameControl = argumentForm.get('name') as FormControl<string>;
        const typeControl = argumentForm.get('type') as FormControl<string>;
        const isOptionControl = argumentForm.get(
          'isOption'
        ) as FormControl<boolean>;

        return {
          name: nameControl.value,
          type: typeControl.value,
          isOption: isOptionControl.value,
        };
      });

      this._dialogRef.close({
        id,
        name,
        thumbnailUrl,
        arguments: args,
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

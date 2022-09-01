import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
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
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../directives';
import { Entity, Option } from '../utils';

export type Instruction = Entity<{
  name: string;
  thumbnailUrl: string;
  arguments: Entity<{ name: string; type: string; isOption: boolean }>[];
}>;

export interface EditInstructionData {
  instruction: Option<Instruction>;
}

export type EditInstructionSubmit = Instruction;

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

@Directive({ selector: '[pgEditInstructionModal]', standalone: true })
export class EditInstructionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstruction: Option<Instruction> = null;

  @Output() pgCreateInstruction = new EventEmitter<EditInstructionSubmit>();
  @Output() pgUpdateInstruction = new EventEmitter<EditInstructionSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.pgOpenModal.emit();

    openEditInstructionModal(this._dialog, {
      instruction: this.pgInstruction,
    }).closed.subscribe((instructionData) => {
      this.pgCloseModal.emit();

      if (instructionData !== undefined) {
        if (this.pgInstruction === null) {
          this.pgCreateInstruction.emit(instructionData);
        } else {
          this.pgUpdateInstruction.emit(instructionData);
        }
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-modal',
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
            (click)="idControl.setValue(onGenerateId())"
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
            <button (click)="onAddArgument()" type="button">+</button>
          </p>

          <div
            class="flex flex-col gap-2"
            cdkDropList
            [cdkDropListData]="argumentsControl.value"
            (cdkDropListDropped)="onArgumentDropped($event)"
          >
            <div
              *ngFor="
                let argumentForm of argumentsControl.controls;
                let i = index
              "
              class="border-black border-2 p-2 bg-white relative"
              cdkDrag
              [cdkDragData]="argumentForm.value"
            >
              <div class="absolute right-2 top-2" cdkDragHandle>
                <svg width="24px" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"
                  ></path>
                  <path d="M0 0h24v24H0z" fill="none"></path>
                </svg>
              </div>

              <div [formGroup]="argumentForm">
                <div>
                  <label
                    class="block"
                    [for]="'instruction-arguments-' + i + '-id'"
                  >
                    Argument ID
                  </label>
                  <input
                    [id]="'instruction-arguments-' + i + '-id'"
                    formControlName="id"
                    class="block border-b-2 border-black"
                    type="text"
                    [readonly]="instruction !== null"
                  />
                  <p *ngIf="instruction !== null">
                    Hint: The ID cannot be changed afterwards.
                  </p>
                  <button
                    *ngIf="instruction !== null"
                    type="button"
                    (click)="argumentForm.get('id')?.setValue(onGenerateId())"
                  >
                    Generate
                  </button>
                </div>

                <div>
                  <label
                    class="block"
                    [for]="'instruction-arguments-' + i + '-name'"
                  >
                    Argument name
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
                    Argument type
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

                <button (click)="onRemoveArgument(i)" type="button">x</button>
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    StopKeydownPropagationDirective,
    KeyboardListenerDirective,
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
              id: this._formBuilder.control<string>(argument.id, {
                validators: [Validators.required],
                nonNullable: true,
              }),
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
        id: FormControl<string>;
        name: FormControl<string>;
        type: FormControl<string>;
        isOption: FormControl<boolean>;
      }>
    >;
  }

  onAddArgument() {
    const argumentForm = this._formBuilder.group({
      id: this._formBuilder.control<string>('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
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

  onRemoveArgument(index: number) {
    this.argumentsControl.removeAt(index);
  }

  onArgumentDropped(
    event: CdkDragDrop<
      Partial<{
        id: string;
        name: string;
        type: string;
        isOption: boolean;
      }>[],
      unknown,
      Partial<{
        id: string;
        name: string;
        type: string;
        isOption: boolean;
      }>
    >
  ) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    this.argumentsControl.setValue(
      event.container.data.map((argumentData) => ({
        id: argumentData.id ?? '',
        name: argumentData.name ?? '',
        type: argumentData.type ?? '',
        isOption: !!argumentData.isOption,
      }))
    );
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const thumbnailUrl = this.thumbnailUrlControl.value;
      const args = this.argumentsControl.controls.map((argumentForm) => {
        const idControl = argumentForm.get('id') as FormControl<string>;
        const nameControl = argumentForm.get('name') as FormControl<string>;
        const typeControl = argumentForm.get('type') as FormControl<string>;
        const isOptionControl = argumentForm.get(
          'isOption'
        ) as FormControl<boolean>;

        return {
          id: idControl.value,
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

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
import {
  Entity,
  generateId,
  isNull,
  KeyboardListenerDirective,
  ModalComponent,
  Option,
  StopKeydownPropagationDirective,
} from '../../shared';

export type InstructionArguments = Entity<{
  name: string;
  type: string;
  isOption: boolean;
}>[];

export interface EditInstructionArgumentsData {
  instructionArguments: Option<InstructionArguments>;
}

export type EditInstructionArgumentsSubmit = InstructionArguments;

export const openEditInstructionArgumentsModal = (
  dialog: Dialog,
  data: EditInstructionArgumentsData
) =>
  dialog.open<
    EditInstructionArgumentsSubmit,
    EditInstructionArgumentsData,
    EditInstructionArgumentsModalComponent
  >(EditInstructionArgumentsModalComponent, {
    data,
  });

@Directive({
  selector: '[pgUpdateInstructionArgumentsModal]',
  standalone: true,
})
export class UpdateInstructionArgumentsModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionArguments: Option<InstructionArguments> = null;

  @Output() pgUpdateInstructionArguments =
    new EventEmitter<EditInstructionArgumentsSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgInstructionArguments)) {
      throw new Error('pgInstructionArguments is missing');
    }

    this.pgOpenModal.emit();

    openEditInstructionArgumentsModal(this._dialog, {
      instructionArguments: this.pgInstructionArguments,
    }).closed.subscribe((instructionData) => {
      this.pgCloseModal.emit();

      if (instructionData !== undefined) {
        this.pgUpdateInstructionArguments.emit(instructionData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-modal',
  template: `
    <pg-modal
      class="text-white min-w-[550px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <div class="flex items-center w-full mb-4 mt-6">
        <h1 class="text-3xl bp-font-game uppercase mr-6">
          Instruction arguments
        </h1>

        <button
          class="bp-button-add-futuristic z-40"
          (click)="onAddArgument()"
          type="button"
        ></button>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px] text-white"
      >
        <div class="mb-4" formArrayName="arguments">
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
              class="bg-black bg-opacity-40 p-2 flex items-center rounded"
              cdkDrag
              [cdkDragData]="argumentForm.value"
            >
              <div cdkDragHandle>
                <svg width="24px" fill="currentColor" viewBox="0 0 24 15">
                  <path
                    d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"
                  ></path>
                  <path d="M0 0h24v24H0z" fill="none"></path>
                </svg>
              </div>

              <div
                [formGroup]="argumentForm"
                class="flex justify-between items-center w-full"
              >
                <div>
                  <input
                    [id]="'instruction-arguments-' + i + '-name'"
                    formControlName="name"
                    class="block border-b-2 border-black bg-transparent"
                    type="text"
                    placeholder="Argument name"
                  />
                </div>

                <div>
                  <select
                    class="block bg-transparent"
                    formControlName="type"
                    [id]="'instruction-arguments-' + i + '-type'"
                  >
                    <option
                      class="text-black"
                      value=""
                      selected="selected"
                      disabled
                    >
                      Attribute type
                    </option>
                    <option class="text-black" value="u8">u8</option>
                    <option class="text-black" value="u16">u16</option>
                    <option class="text-black" value="u32">u32</option>
                    <option class="text-black" value="u64">u64</option>
                    <option class="text-black" value="String">String</option>
                    <option class="text-black" value="Pubkey"></option>
                  </select>
                </div>

                <div class="flex flex-col justify-center ml-5">
                  <input
                    formControlName="isOption"
                    type="checkbox"
                    [id]="'instruction-arguments-' + i + '-is-option'"
                  />
                  <label
                    for="'instruction-arguments-' + i + '-is-option'"
                    class="text-xs"
                  >
                    Optional
                  </label>
                </div>

                <button
                  (click)="onRemoveArgument(i)"
                  class="ml-5"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="red"
                    class="bi bi-trash"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
                    />
                    <path
                      fill-rule="evenodd"
                      d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center items-center mt-10 mb-10">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            Save
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
export class EditInstructionArgumentsModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditInstructionArgumentsSubmit,
        EditInstructionArgumentsModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionArgumentsData>(DIALOG_DATA);

  readonly instructionArguments = this._data.instructionArguments;
  readonly form = this._formBuilder.group({
    arguments: this.instructionArguments
      ? this._formBuilder.array(
          this.instructionArguments.map((argument) =>
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
              isNew: this._formBuilder.control<boolean>(false, {
                nonNullable: true,
              }),
            })
          )
        )
      : this._formBuilder.array([]),
  });

  get argumentsControl() {
    return this.form.get('arguments') as FormArray<
      FormGroup<{
        name: FormControl<string>;
        type: FormControl<string>;
        isOption: FormControl<boolean>;
        isNew: FormControl<boolean>;
      }>
    >;
  }

  onAddArgument() {
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
      isNew: this._formBuilder.control<boolean>(true, {
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
        isNew: boolean;
      }>[],
      unknown,
      Partial<{
        id: string;
        name: string;
        type: string;
        isOption: boolean;
        isNew: boolean;
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
        isNew: !!argumentData.isNew,
      }))
    );
  }

  onSubmit() {
    if (this.form.valid) {
      const args = this.argumentsControl.controls.map((argumentForm) => {
        const nameControl = argumentForm.get('name') as FormControl<string>;
        const typeControl = argumentForm.get('type') as FormControl<string>;
        const isOptionControl = argumentForm.get(
          'isOption'
        ) as FormControl<boolean>;

        return {
          id: generateId(),
          name: nameControl.value,
          type: typeControl.value,
          isOption: isOptionControl.value,
        };
      });

      this._dialogRef.close(args);
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

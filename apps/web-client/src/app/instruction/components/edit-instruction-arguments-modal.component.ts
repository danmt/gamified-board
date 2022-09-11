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
      class="text-white"
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
        class="max-h-96 overflow-y-auto text-black"
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
                    [readonly]="argumentForm.get('isNew')?.value"
                  />
                  <p *ngIf="argumentForm.get('isNew')?.value">
                    Hint: The ID cannot be changed afterwards.
                  </p>
                  <button
                    *ngIf="argumentForm.get('isNew')?.value"
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
        id: FormControl<string>;
        name: FormControl<string>;
        type: FormControl<string>;
        isOption: FormControl<boolean>;
        isNew: FormControl<boolean>;
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

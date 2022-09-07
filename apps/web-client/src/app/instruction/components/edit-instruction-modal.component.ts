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
import { ModalComponent } from '../../shared/components';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, generateId, isNull, Option } from '../../shared/utils';

export type Instruction = Entity<{
  name: string;
  arguments: Entity<{ name: string; type: string; isOption: boolean }>[];
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

        <div class="mb-4 text-black" formArrayName="arguments">
          <div class="flex items-center justify-between">
            <p class="block bp-font-game text-2xl text-white">
              Instruction arguments
            </p>
            <button
              class="bp-button-add-futuristic"
              (click)="onAddArgument()"
              type="button"
            ></button>
          </div>

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
    return generateId();
  }
}

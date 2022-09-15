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
import { ModalComponent } from '../../shared/components';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, generateId, isNull, Option } from '../../shared/utils';

export type InstructionTask = Entity<{
  name: string;
}>;

export interface EditInstructionTaskData {
  instructionTask: Option<InstructionTask>;
}

export type EditInstructionTaskSubmit = InstructionTask;

export const openEditInstructionTaskModal = (
  dialog: Dialog,
  data: EditInstructionTaskData
) =>
  dialog.open<
    EditInstructionTaskSubmit,
    EditInstructionTaskData,
    EditInstructionTaskModalComponent
  >(EditInstructionTaskModalComponent, {
    data,
  });

@Directive({ selector: '[pgUpdateInstructionTaskModal]', standalone: true })
export class UpdateInstructionTaskModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionTask: Option<InstructionTask> = null;

  @Output() pgUpdateInstructionTask =
    new EventEmitter<EditInstructionTaskSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgInstructionTask)) {
      throw new Error('pgInstructionTask is missing.');
    }

    this.pgOpenModal.emit();

    openEditInstructionTaskModal(this._dialog, {
      instructionTask: this.pgInstructionTask,
    }).closed.subscribe((instructionTaskData) => {
      this.pgCloseModal.emit();

      if (instructionTaskData !== undefined) {
        this.pgUpdateInstructionTask.emit(instructionTaskData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-task-modal',
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
          {{ instructionTask === null ? 'Create' : 'Update' }} task
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mb-14">
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="task-id-input"
            >Task ID</label
          >
          <div class="flex items-center justify-between w-full">
            <input
              class="bp-input-futuristic p-4 outline-0"
              id="task-id-input"
              type="text"
              formControlName="id"
              [readonly]="instructionTask !== null"
            />
            <button
              *ngIf="instructionTask === null"
              class="bp-button-generate-futuristic"
              (click)="idControl.setValue(onGenerateId())"
            ></button>
          </div>
          <p class="bp-font-game text-sm" *ngIf="instructionTask === null">
            Hint: The ID cannot be changed afterwards.
          </p>
        </div>

        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="task-name-input">
            Task name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="task-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ instructionTask === null ? 'Send' : 'Save' }}
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
export class EditInstructionTaskModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<EditInstructionTaskSubmit, EditInstructionTaskModalComponent>
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionTaskData>(DIALOG_DATA);

  readonly instructionTask = this._data.instructionTask;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.instructionTask?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.instructionTask?.name ?? '', {
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

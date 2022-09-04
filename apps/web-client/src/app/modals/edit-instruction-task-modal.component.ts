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
import { ModalComponent } from '../components/modal.component';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../directives';
import { Entity, Option } from '../utils';

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

@Directive({ selector: '[pgEditInstructionTaskModal]', standalone: true })
export class EditInstructionTaskModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionTask: Option<InstructionTask> = null;

  @Output() pgCreateInstructionTask =
    new EventEmitter<EditInstructionTaskSubmit>();
  @Output() pgUpdateInstructionTask =
    new EventEmitter<EditInstructionTaskSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.pgOpenModal.emit();

    openEditInstructionTaskModal(this._dialog, {
      instructionTask: this.pgInstructionTask,
    }).closed.subscribe((instructionTaskData) => {
      this.pgCloseModal.emit();

      if (instructionTaskData !== undefined) {
        if (this.pgInstructionTask === null) {
          this.pgCreateInstructionTask.emit(instructionTaskData);
        } else {
          this.pgUpdateInstructionTask.emit(instructionTaskData);
        }
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-task-modal',
  template: `
    <pg-modal
      class="px-6 pt-8 pb-4 text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
    >
      <div>
        <div class="flex justify-between w-full">
          <h1 class="text-center text-3xl mb-4 bp-font-game">
            {{ instructionTask === null ? 'CREATE' : 'UPDATE' }} TASK
          </h1>
          <button
            class="bp-button-close-futuristic z-20 outline-0"
            (click)="onClose()"
          ></button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
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
            <p *ngIf="instructionTask === null">
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
              class="bp-button-futuristic text-black bp-font-game"
            >
              {{ instructionTask === null ? 'SEND' : 'SAVE' }}
            </button>
          </div>
        </form>
      </div>
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
    return uuid();
  }
}

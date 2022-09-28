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
  KeyListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, isNull, Option } from '../../shared/utils';

export type Task = Entity<{
  data: { name: string };
}>;

export interface EditTaskData {
  task: Option<Task>;
}

export type CreateTaskSubmit = {
  name: string;
};

export type UpdateTaskSubmit = {
  name: string;
};

export const openEditTaskModal = (dialog: Dialog, data: EditTaskData) =>
  dialog.open<
    CreateTaskSubmit | UpdateTaskSubmit,
    EditTaskData,
    EditTaskModalComponent
  >(EditTaskModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateTaskModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateTaskModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<DialogRef<CreateTaskSubmit, EditTaskModalComponent>> = null;

  @Output() pgCreateTask = new EventEmitter<CreateTaskSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    this.dialogRef = openEditTaskModal(this._dialog, {
      task: null,
    });

    this.dialogRef.closed.subscribe((taskData) => {
      this.pgCloseModal.emit();

      if (taskData !== undefined) {
        this.pgCreateTask.emit(taskData);
      }
    });

    return this.dialogRef;
  }
}

@Directive({
  selector: '[pgUpdateTaskModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateTaskModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<DialogRef<UpdateTaskSubmit, EditTaskModalComponent>> = null;

  @Input() pgTask: Option<Task> = null;
  @Output() pgUpdateTask = new EventEmitter<UpdateTaskSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgTask)) {
      throw new Error('pgTask is missing');
    }

    this.pgOpenModal.emit();

    this.dialogRef = openEditTaskModal(this._dialog, {
      task: this.pgTask,
    });

    this.dialogRef.closed.subscribe((taskData) => {
      this.pgCloseModal.emit();

      if (taskData !== undefined) {
        this.pgUpdateTask.emit(taskData);
      }
    });

    return this.dialogRef;
  }
}

@Component({
  selector: 'pg-edit-task-modal',
  template: `
    <pg-modal
      class="text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyListener="Escape"
      (pgKeyDown)="onClose()"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game-title uppercase">
          {{ task === null ? 'Create' : 'Update' }} task
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
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

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ task === null ? 'Send' : 'Save' }}
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
    KeyListenerDirective,
    ModalComponent,
  ],
})
export class EditTaskModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<CreateTaskSubmit | UpdateTaskSubmit, EditTaskModalComponent>
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditTaskData>(DIALOG_DATA);

  readonly task = this._data.task;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.task?.data.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const name = this.nameControl.value;

      this._dialogRef.close({
        name,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

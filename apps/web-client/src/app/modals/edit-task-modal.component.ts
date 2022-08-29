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

export interface EditTaskData {
  id: string;
  name: string;
}

@Directive({ selector: '[pgEditTaskModal]', standalone: true })
export class EditTaskModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() task: Option<EditTaskData> = null;
  @Output() createTask = new EventEmitter<EditTaskData>();
  @Output() updateTask = new EventEmitter<EditTaskData>();
  @HostListener('click', []) onClick() {
    this._dialog
      .open<EditTaskData, Option<EditTaskData>, EditTaskModalComponent>(
        EditTaskModalComponent,
        {
          data: this.task,
        }
      )
      .closed.subscribe((taskData) => {
        if (taskData !== undefined) {
          if (this.task === null) {
            this.createTask.emit(taskData);
          } else {
            this.updateTask.emit(taskData);
          }
        }
      });
  }
}

@Component({
  selector: 'pg-edit-task-modal',
  template: `
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ task === null ? 'Create' : 'Update' }} task
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="block" for="task-id-input">Task ID</label>
          <input
            class="block border-b-2 border-black"
            id="task-id-input"
            type="text"
            formControlName="id"
            [readonly]="task !== null"
          />
          <p *ngIf="task === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="task === null"
            type="button"
            (click)="idControl.setValue(onGenerateId())"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="task-name-input"> Task name </label>
          <input
            class="block border-b-2 border-black"
            id="task-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ task === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditTaskModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditTaskData, EditTaskModalComponent>>(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);

  readonly task = inject<Option<EditTaskData>>(DIALOG_DATA);
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.task?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.task?.name ?? '', {
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

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    return uuid();
  }
}

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
    <div
      class="px-6 pt-8 pb-4 bp-bg-futuristic shadow-xl relative text-white min-w-[400px] min-h-[300px]"
    >
      <!-- corners-->
      <div
        class="bp-skin-metal-corner-left-top absolute -left-4 -top-4 z-20"
      ></div>
      <div
        class="bp-skin-metal-corner-right-top absolute -right-4 -top-4 z-20"
      ></div>
      <div
        class="bp-skin-metal-corner-left-bottom absolute -left-4 -bottom-4 z-20"
      ></div>
      <div
        class="bp-skin-metal-corner-right-bottom absolute -right-4 -bottom-4 z-20"
      ></div>

      <!-- borders -->
      <div
        class="bp-skin-metal-border-right absolute -right-4 h-5/6 top-0 bottom-0 my-auto mx-0 z-10"
      ></div>
      <div
        class="bp-skin-metal-border-left absolute -left-4 h-5/6 top-0 bottom-0 my-auto mx-0 z-10"
      ></div>
      <div
        class="bp-skin-metal-border-bottom absolute -bottom-4 w-5/6 left-0 right-0 mx-auto my-0 z-10"
      ></div>
      <div
        class="bp-skin-metal-border absolute -top-4 w-5/6 left-0 right-0 mx-auto my-0 z-10"
      ></div>

      <!-- modal content -->
      <div>
        <button
          class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
          (click)="onClose()"
        >
          x
        </button>

        <h1 class="text-center text-3xl mb-4 bp-font-game">
          {{ task === null ? 'CREATE' : 'UPDATE' }} TASK
        </h1>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label class="block bp-font-game text-xl" for="task-id-input"
              >Task ID</label
            >
            <div class="flex">
              <input
                class="bp-input-futuristic p-4 outline-0"
                id="task-id-input"
                type="text"
                formControlName="id"
                [readonly]="task !== null"
              />
              <button
                *ngIf="task === null"
                type="button"
                (click)="idControl.setValue(onGenerateId())"
              >
                Generate
              </button>
            </div>
            <p class="bp-font-game" *ngIf="task === null">
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
              {{ task === null ? 'SEND' : 'SAVE' }}
            </button>
          </div>
        </form>
      </div>
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

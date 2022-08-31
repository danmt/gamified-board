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
import { Entity, Option } from '../utils';

export type InstructionTask = Entity<{
  name: string;
}>;

export interface EditInstructionTaskData {
  instructionTask: Option<InstructionTask>;
}

export type EditInstructionTaskSubmitPayload = InstructionTask;

@Directive({ selector: '[pgEditInstructionTaskModal]', standalone: true })
export class EditInstructionTaskModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionTask: Option<InstructionTask> = null;

  @Output() pgCreateInstructionTask =
    new EventEmitter<EditInstructionTaskSubmitPayload>();
  @Output() pgUpdateInstructionTask =
    new EventEmitter<EditInstructionTaskSubmitPayload>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.pgOpenModal.emit();

    this._dialog
      .open<
        EditInstructionTaskSubmitPayload,
        EditInstructionTaskData,
        EditInstructionTaskModalComponent
      >(EditInstructionTaskModalComponent, {
        data: {
          instructionTask: this.pgInstructionTask,
        },
      })
      .closed.subscribe((instructionTaskData) => {
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
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ instructionTask === null ? 'Create' : 'Update' }} task
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="block" for="task-id-input">Task ID</label>
          <input
            class="block border-b-2 border-black"
            id="task-id-input"
            type="text"
            formControlName="id"
            [readonly]="instructionTask !== null"
          />
          <p *ngIf="instructionTask === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="instructionTask === null"
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
            {{ instructionTask === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditInstructionTaskModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditInstructionTaskSubmitPayload,
        EditInstructionTaskModalComponent
      >
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

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    return uuid();
  }
}

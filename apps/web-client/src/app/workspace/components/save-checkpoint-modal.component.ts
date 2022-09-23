import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  EventEmitter,
  HostListener,
  inject,
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

export type SaveCheckpointSubmit = {
  name: string;
};

export const openSaveCheckpointModal = (dialog: Dialog) =>
  dialog.open<SaveCheckpointSubmit, unknown, SaveCheckpointModalComponent>(
    SaveCheckpointModalComponent
  );

@Directive({
  selector: '[pgSaveCheckpointModal]',
  standalone: true,
  exportAs: 'modal',
})
export class SaveCheckpointModalDirective {
  private readonly _dialog = inject(Dialog);

  @Output() pgSaveCheckpoint = new EventEmitter<SaveCheckpointSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    openSaveCheckpointModal(this._dialog).closed.subscribe((checkpointData) => {
      this.pgCloseModal.emit();

      if (checkpointData !== undefined) {
        this.pgSaveCheckpoint.emit(checkpointData);
      }
    });
  }
}

@Component({
  selector: 'pg-save-checkpoint-modal',
  template: `
    <pg-modal
      class="px-6 pt-8 pb-4 text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyListener="Escape"
      (pgKeyDown)="onClose()"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game uppercase">
          Save Checkpoint
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="mb-4">
          <label class="block" for="checkpoint-name-input">
            Checkpoint name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="checkpoint-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
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
    StopKeydownPropagationDirective,
    KeyListenerDirective,
    ModalComponent,
  ],
})
export class SaveCheckpointModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<SaveCheckpointSubmit, SaveCheckpointModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);

  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>('', {
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

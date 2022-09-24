import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
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

export type Signer = Entity<{
  data: { name: string; isMutable: boolean };
}>;

export interface EditSignerData {
  signer: Option<Signer>;
}

export type CreateSignerSubmit = {
  name: string;
  isMutable: boolean;
};

export type UpdateSignerSubmit = {
  name: string;
  isMutable: boolean;
};

export const openEditSignerModal = (dialog: Dialog, data: EditSignerData) =>
  dialog.open<
    CreateSignerSubmit | UpdateSignerSubmit,
    EditSignerData,
    EditSignerModalComponent
  >(EditSignerModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateSignerModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateSignerModalDirective {
  private readonly _dialog = inject(Dialog);

  @Output() pgCreateSigner = new EventEmitter<CreateSignerSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    openEditSignerModal(this._dialog, {
      signer: null,
    }).closed.subscribe((signerData) => {
      this.pgCloseModal.emit();

      if (signerData !== undefined) {
        this.pgCreateSigner.emit(signerData);
      }
    });
  }
}

@Directive({
  selector: '[pgUpdateSignerModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateSignerModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgSigner: Option<Signer> = null;

  @Output() pgUpdateSigner = new EventEmitter<UpdateSignerSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgSigner)) {
      throw new Error('pgSigner is missing');
    }

    this.pgOpenModal.emit();

    openEditSignerModal(this._dialog, {
      signer: this.pgSigner,
    }).closed.subscribe((signerData) => {
      this.pgCloseModal.emit();

      if (signerData !== undefined) {
        this.pgUpdateSigner.emit(signerData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-signer-modal',
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
          {{ signer === null ? 'Create' : 'Update' }} signer
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="signer-name-input">
            Signer name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="signer-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="mb-4">
          <label class="block bp-font-game text-xl">
            Is Mutable
            <input type="checkbox" formControlName="isMutable" />
          </label>
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ signer === null ? 'Send' : 'Save' }}
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
    KeyListenerDirective,
    ModalComponent,
  ],
})
export class EditSignerModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        CreateSignerSubmit | UpdateSignerSubmit,
        EditSignerModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditSignerData>(DIALOG_DATA);

  readonly signer = this._data.signer;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.signer?.data.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    isMutable: this._formBuilder.control<boolean>(
      this.signer?.data.isMutable ?? false,
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
  });

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  get isMutableControl() {
    return this.form.get('isMutable') as FormControl<boolean>;
  }

  onSubmit() {
    if (this.form.valid) {
      const name = this.nameControl.value;
      const isMutable = this.isMutableControl.value;

      this._dialogRef.close({
        name,
        isMutable,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

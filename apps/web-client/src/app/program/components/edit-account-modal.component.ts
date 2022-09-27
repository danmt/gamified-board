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

export type Account = Entity<{
  data: { name: string };
}>;

export interface EditAccountData {
  account: Option<Account>;
}

export type CreateAccountSubmit = {
  name: string;
};

export type UpdateAccountSubmit = {
  name: string;
};

export const openEditAccountModal = (dialog: Dialog, data: EditAccountData) =>
  dialog.open<
    CreateAccountSubmit | UpdateAccountSubmit,
    EditAccountData,
    EditAccountModalComponent
  >(EditAccountModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateAccountModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateAccountModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<DialogRef<CreateAccountSubmit, EditAccountModalComponent>> =
    null;

  @Output() pgCreateAccount = new EventEmitter<CreateAccountSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    this.dialogRef = openEditAccountModal(this._dialog, {
      account: null,
    });

    this.dialogRef.closed.subscribe((accountData) => {
      this.pgCloseModal.emit();

      if (accountData !== undefined) {
        this.pgCreateAccount.emit(accountData);
      }
    });

    return this.dialogRef;
  }
}

@Directive({
  selector: '[pgUpdateAccountModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateAccountModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<DialogRef<UpdateAccountSubmit, EditAccountModalComponent>> =
    null;

  @Input() pgAccount: Option<Account> = null;
  @Output() pgUpdateAccount = new EventEmitter<UpdateAccountSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgAccount)) {
      throw new Error('pgAccount is missing');
    }

    this.pgOpenModal.emit();

    this.dialogRef = openEditAccountModal(this._dialog, {
      account: this.pgAccount,
    });

    this.dialogRef.closed.subscribe((accountData) => {
      this.pgCloseModal.emit();

      if (accountData !== undefined) {
        this.pgUpdateAccount.emit(accountData);
      }
    });

    return this.dialogRef;
  }
}

@Component({
  selector: 'pg-edit-account-modal',
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
          {{ account === null ? 'Create' : 'Update' }} account
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="account-name-input">
            Account name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="account-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ account === null ? 'Send' : 'Save' }}
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
export class EditAccountModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        CreateAccountSubmit | UpdateAccountSubmit,
        EditAccountModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditAccountData>(DIALOG_DATA);

  readonly account = this._data.account;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.account?.data.name ?? '', {
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

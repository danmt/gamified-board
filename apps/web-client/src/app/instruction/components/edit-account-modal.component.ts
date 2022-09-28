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
import { PushModule } from '@ngrx/component';
import { BehaviorSubject, Observable } from 'rxjs';
import { ModalComponent } from '../../shared/components';
import {
  KeyListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, isNull, Option } from '../../shared/utils';
import { AccountMethodType, AccountNode, SignerNode } from '../utils';

export type Account = Entity<{
  data: {
    name: string;
    method: AccountMethodType;
    payer: Option<string>;
    space: Option<number>;
    receiver: Option<string>;
  };
}>;

export interface EditAccountData {
  account: Option<Account>;
  options$: Observable<(AccountNode | SignerNode)[]>;
}

export type CreateAccountSubmit = {
  name: string;
  method: AccountMethodType;
  payer: Option<string>;
  space: Option<number>;
  receiver: Option<string>;
};

export type UpdateAccountSubmit = {
  name: string;
  method: AccountMethodType;
  payer: Option<string>;
  space: Option<number>;
  receiver: Option<string>;
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

  private readonly _options = new BehaviorSubject<(AccountNode | SignerNode)[]>(
    []
  );
  dialogRef: Option<DialogRef<CreateAccountSubmit, EditAccountModalComponent>> =
    null;

  @Input() set pgOptions(options: (AccountNode | SignerNode)[]) {
    this._options.next(options);
  }
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
      options$: this._options.asObservable(),
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
  private readonly _options = new BehaviorSubject<(AccountNode | SignerNode)[]>(
    []
  );
  dialogRef: Option<DialogRef<UpdateAccountSubmit, EditAccountModalComponent>> =
    null;

  @Input() pgAccount: Option<Account> = null;
  @Input() set pgOptions(options: (AccountNode | SignerNode)[]) {
    this._options.next(options);
  }

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
      options$: this._options.asObservable(),
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

        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="account-method-input">
            Account Method
          </label>

          <select
            class="block bg-transparent"
            formControlName="method"
            id="account-method-input"
          >
            <option class="text-black" value="" selected="selected" disabled>
              Method type
            </option>
            <option class="text-black uppercase" value="READ">read</option>
            <option class="text-black uppercase" value="CREATE">create</option>
            <option class="text-black uppercase" value="UPDATE">update</option>
            <option class="text-black uppercase" value="DELETE">delete</option>
          </select>
        </div>

        <div class="mb-4" *ngIf="methodControl.value === 'CREATE'">
          <label class="block bp-font-game text-xl" for="account-payer-input">
            Account Payer
          </label>

          <select
            class="block bg-transparent"
            formControlName="payer"
            id="account-payer-input"
          >
            <option class="text-black" value="" selected="selected" disabled>
              Payer
            </option>
            <option
              class="text-black uppercase"
              *ngFor="let option of options$ | ngrxPush"
              [ngValue]="option.id"
            >
              <ng-container *ngIf="option.kind === 'account'">
                [ACCOUNT] {{ option.data.name }}: {{ option.data.ref.name }}
              </ng-container>

              <ng-container *ngIf="option.kind === 'signer'">
                [SIGNER] {{ option.data.name }}
              </ng-container>
            </option>
          </select>
        </div>

        <div class="mb-4" *ngIf="methodControl.value === 'CREATE'">
          <label class="block bp-font-game text-xl" for="account-space-input">
            Account Space
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="account-space-input"
            type="number"
            formControlName="space"
          />
        </div>

        <div class="mb-4" *ngIf="methodControl.value === 'DELETE'">
          <label
            class="block bp-font-game text-xl"
            for="account-receiver-input"
          >
            Account Receiver
          </label>

          <select
            class="block bg-transparent"
            formControlName="receiver"
            id="account-receiver-input"
          >
            <option class="text-black" value="" selected="selected" disabled>
              Receiver
            </option>
            <option
              class="text-black uppercase"
              *ngFor="let option of options$ | ngrxPush"
              [ngValue]="option.id"
            >
              <ng-container *ngIf="option.kind === 'account'">
                [ACCOUNT] {{ option.data.name }}: {{ option.data.ref.name }}
              </ng-container>

              <ng-container *ngIf="option.kind === 'signer'">
                [SIGNER] {{ option.data.name }}
              </ng-container>
            </option>
          </select>
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
    PushModule,
    DragDropModule,
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
  readonly options$ = this._data.options$;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.account?.data.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    method: this._formBuilder.control<AccountMethodType>(
      this.account?.data.method ?? 'READ',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
    payer: this._formBuilder.control<Option<string>>(
      this.account?.data.payer ?? null
    ),
    space: this._formBuilder.control<Option<number>>(
      this.account?.data.space ?? null
    ),
    receiver: this._formBuilder.control<Option<string>>(
      this.account?.data.receiver ?? null
    ),
  });

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  get methodControl() {
    return this.form.get('method') as FormControl<AccountMethodType>;
  }

  get payerControl() {
    return this.form.get('payer') as FormControl<Option<string>>;
  }

  get spaceControl() {
    return this.form.get('space') as FormControl<Option<number>>;
  }

  get receiverControl() {
    return this.form.get('receiver') as FormControl<Option<string>>;
  }

  onSubmit() {
    if (this.form.valid) {
      const name = this.nameControl.value;
      const method = this.methodControl.value;
      const payer = this.payerControl.value;
      const space = this.spaceControl.value;
      const receiver = this.receiverControl.value;

      this._dialogRef.close({
        name,
        method,
        payer: method === 'CREATE' ? payer : null,
        space: method === 'CREATE' ? space : null,
        receiver: method === 'DELETE' ? receiver : null,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

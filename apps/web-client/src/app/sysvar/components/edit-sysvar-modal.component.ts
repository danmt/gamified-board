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
import {
  Entity,
  generateId,
  KeyboardListenerDirective,
  Option,
  StopKeydownPropagationDirective,
} from '../../shared';
import { ModalComponent } from '../../shared/components';

export type Sysvar = Entity<{
  name: string;
}>;

export interface EditSysvarData {
  sysvar: Option<Sysvar>;
}

export type EditSysvarSubmit = Sysvar;

export const openEditSysvarModal = (dialog: Dialog, data: EditSysvarData) =>
  dialog.open<EditSysvarSubmit, EditSysvarData, EditSysvarModalComponent>(
    EditSysvarModalComponent,
    {
      data,
    }
  );

@Directive({ selector: '[pgCreateSysvarModal]', standalone: true })
export class CreateSysvarModalDirective {
  private readonly _dialog = inject(Dialog);

  @Output() pgCreateSysvar = new EventEmitter<EditSysvarSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.pgOpenModal.emit();

    openEditSysvarModal(this._dialog, {
      sysvar: null,
    }).closed.subscribe((sysvarData) => {
      this.pgCloseModal.emit();

      if (sysvarData !== undefined) {
        this.pgCreateSysvar.emit(sysvarData);
      }
    });
  }
}

@Directive({ selector: '[pgUpdateSysvarModal]', standalone: true })
export class UpdateSysvarModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgSysvar: Option<Sysvar> = null;

  @Output() pgUpdateSysvar = new EventEmitter<EditSysvarSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (this.pgSysvar === null) {
      throw new Error('pgSysvar is missing.');
    }

    this.pgOpenModal.emit();

    openEditSysvarModal(this._dialog, {
      sysvar: this.pgSysvar,
    }).closed.subscribe((sysvarData) => {
      this.pgCloseModal.emit();

      if (sysvarData !== undefined) {
        this.pgUpdateSysvar.emit(sysvarData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-sysvar-modal',
  template: `
    <pg-modal
      class="text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game uppercase">
          {{ sysvar === null ? 'Create' : 'Update' }} sysvar
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[500px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game-title text-xl" for="sysvar-id-input"
            >Sysvar ID</label
          >
          <div class="flex items-center justify-between w-full">
            <input
              class="bp-input-futuristic p-4 outline-0"
              id="sysvar-id-input"
              type="text"
              formControlName="id"
              [readonly]="sysvar !== null"
            />

            <button
              *ngIf="sysvar === null"
              class="bp-button-generate-futuristic"
              type="button"
              (click)="idControl.setValue(onGenerateId())"
            ></button>
          </div>
          <p class="bp-font-game text-sm" *ngIf="sysvar === null">
            Hint: The ID cannot be changed afterwards.
          </p>
        </div>

        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="sysvar-name-input">
            Sysvar name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="sysvar-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ sysvar === null ? 'Send' : 'Save' }}
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
export class EditSysvarModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditSysvarSubmit, EditSysvarModalComponent>>(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditSysvarData>(DIALOG_DATA);

  readonly sysvar = this._data.sysvar;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.sysvar?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.sysvar?.name ?? '', {
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

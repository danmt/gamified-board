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
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, isNull, Option } from '../../shared/utils';

export type Sysvar = Entity<{
  name: string;
  thumbnailUrl: string;
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

@Directive({ selector: '[pgEditSysvarModal]', standalone: true })
export class EditSysvarModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgSysvar: Option<Sysvar> = null;

  @Output() pgCreateSysvar = new EventEmitter<EditSysvarSubmit>();
  @Output() pgUpdateSysvar = new EventEmitter<EditSysvarSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.pgOpenModal.emit();

    openEditSysvarModal(this._dialog, {
      sysvar: this.pgSysvar,
    }).closed.subscribe((sysvarData) => {
      this.pgCloseModal.emit();

      if (sysvarData !== undefined) {
        if (isNull(this.pgSysvar)) {
          this.pgCreateSysvar.emit(sysvarData);
        } else {
          this.pgUpdateSysvar.emit(sysvarData);
        }
      }
    });
  }
}

@Component({
  selector: 'pg-edit-sysvar-modal',
  template: `
    <div
      class="px-4 pt-8 pb-4 bg-white shadow-xl relative"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
    >
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ sysvar === null ? 'Create' : 'Update' }} sysvar
      </h1>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="max-h-96 overflow-y-auto"
      >
        <div>
          <label class="block" for="sysvar-id-input">Sysvar ID</label>
          <input
            class="block border-b-2 border-black"
            id="sysvar-id-input"
            type="text"
            formControlName="id"
            [readonly]="sysvar !== null"
          />
          <p *ngIf="sysvar === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="sysvar === null"
            type="button"
            (click)="idControl.setValue(onGenerateId())"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="sysvar-name-input"> Sysvar name </label>
          <input
            class="block border-b-2 border-black"
            id="sysvar-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div>
          <label class="block" for="sysvar-thumbnail-url-input">
            Sysvar thumbnail
          </label>
          <input
            class="block border-b-2 border-black"
            id="sysvar-thumbnail-url-input"
            type="text"
            formControlName="thumbnailUrl"
          />
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ sysvar === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StopKeydownPropagationDirective,
    KeyboardListenerDirective,
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
    thumbnailUrl: this._formBuilder.control<string>(
      this.sysvar?.thumbnailUrl ?? '',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
  });

  get idControl() {
    return this.form.get('id') as FormControl<string>;
  }

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  get thumbnailUrlControl() {
    return this.form.get('thumbnailUrl') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const thumbnailUrl = this.thumbnailUrlControl.value;

      this._dialogRef.close({
        id,
        name,
        thumbnailUrl,
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

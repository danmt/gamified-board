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

export type Application = Entity<{
  name: string;
  thumbnailUrl: string;
}>;

export interface EditApplicationData {
  application: Option<Application>;
}

export type EditApplicationSubmit = Application;

export const openEditApplicationModal = (
  dialog: Dialog,
  data: EditApplicationData
) =>
  dialog.open<
    EditApplicationSubmit,
    EditApplicationData,
    EditApplicationModalComponent
  >(EditApplicationModalComponent, {
    data,
  });

@Directive({
  selector: '[pgEditApplicationModal]',
  standalone: true,
})
export class EditApplicationModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgApplication: Option<Application> = null;

  @Output() pgCreateApplication = new EventEmitter<EditApplicationSubmit>();
  @Output() pgUpdateApplication = new EventEmitter<EditApplicationSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.pgOpenModal.emit();

    openEditApplicationModal(this._dialog, {
      application: this.pgApplication,
    }).closed.subscribe((applicationData) => {
      this.pgCloseModal.emit();

      if (applicationData !== undefined) {
        if (isNull(this.pgApplication)) {
          this.pgCreateApplication.emit(applicationData);
        } else {
          this.pgUpdateApplication.emit(applicationData);
        }
      }
    });
  }
}

@Component({
  selector: 'pg-edit-application-modal',
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
        {{ application === null ? 'Create' : 'Update' }} application
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="block" for="application-id-input">Application ID</label>
          <input
            class="block border-b-2 border-black"
            id="application-id-input"
            type="text"
            formControlName="id"
            [readonly]="application !== null"
          />
          <p *ngIf="application === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="application === null"
            type="button"
            (click)="idControl.setValue(onGenerateId())"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="application-name-input">
            Application name
          </label>
          <input
            class="block border-b-2 border-black"
            id="application-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div>
          <label class="block" for="application-thumbnail-url-input">
            Application thumbnail
          </label>
          <input
            class="block border-b-2 border-black"
            id="application-thumbnail-url-input"
            type="text"
            formControlName="thumbnailUrl"
          />
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ application === null ? 'Send' : 'Save' }}
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
export class EditApplicationModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditApplicationSubmit, EditApplicationModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditApplicationData>(DIALOG_DATA);

  readonly application = this._data.application;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.application?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.application?.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    thumbnailUrl: this._formBuilder.control<string>(
      this.application?.thumbnailUrl ?? '',
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

  onClose() {
    this._dialogRef.close();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this._dialogRef.close();
    }
  }

  onGenerateId() {
    return uuid();
  }
}

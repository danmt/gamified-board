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
import { ModalComponent } from '../../shared/components';
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
    <pg-modal
      class="px-6 pt-8 pb-4 text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game uppercase">
          {{ application === null ? 'Create' : 'Update' }} application
        </h1>
        <button
          class="bp-button-close-futuristic z-20 outline-0"
          (click)="onClose()"
        ></button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="mb-4">
          <label class="block" for="application-id-input">Application ID</label>

          <div class="flex items-center justify-between w-full">
            <input
              class="bp-input-futuristic p-4 outline-0"
              id="application-id-input"
              type="text"
              formControlName="id"
              [readonly]="application !== null"
            />
            <button
              class="bp-button-generate-futuristic"
              *ngIf="application === null"
              type="button"
              (click)="idControl.setValue(onGenerateId())"
            ></button>
          </div>

          <p class="bp-font-game text-sm" *ngIf="application === null">
            Hint: The ID cannot be changed afterwards.
          </p>
        </div>

        <div class="mb-4">
          <label class="block" for="application-name-input">
            Application name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="application-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="mb-4">
          <label class="block" for="application-thumbnail-url-input">
            Application thumbnail
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="application-thumbnail-url-input"
            type="text"
            formControlName="thumbnailUrl"
          />
        </div>

        <div class="flex justify-center items-center mt-10">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ application === null ? 'Send' : 'Save' }}
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

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

export interface EditApplicationData {
  id: string;
  name: string;
  thumbnailUrl: string;
}

@Directive({ selector: '[pgEditApplicationModal]', standalone: true })
export class EditApplicationModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() application: Option<EditApplicationData> = null;
  @Output() createApplication = new EventEmitter<EditApplicationData>();
  @Output() updateApplication = new EventEmitter<EditApplicationData>();
  @HostListener('click', []) onClick() {
    this._dialog
      .open<
        EditApplicationData,
        Option<EditApplicationData>,
        EditApplicationModalComponent
      >(EditApplicationModalComponent, {
        data: this.application,
      })
      .closed.subscribe((applicationData) => {
        if (applicationData !== undefined) {
          if (this.application === null) {
            this.createApplication.emit(applicationData);
          } else {
            this.updateApplication.emit(applicationData);
          }
        }
      });
  }
}

@Component({
  selector: 'pg-edit-application-modal',
  template: `
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
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
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditApplicationModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditApplicationData, EditApplicationModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);

  readonly application = inject<Option<EditApplicationData>>(DIALOG_DATA);
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

  onGenerateId() {
    return uuid();
  }
}

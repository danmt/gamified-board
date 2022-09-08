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
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, generateId, isNull, Option } from '../../shared/utils';

export type Collection = Entity<{
  name: string;
}>;

export interface EditCollectionData {
  collection: Option<Collection>;
}

export type EditCollectionSubmit = Collection;

export type CreateCollectionSubmit = Collection & {
  workspaceId: string;
  applicationId: string;
};

export const openEditCollectionModal = (
  dialog: Dialog,
  data: EditCollectionData
) =>
  dialog.open<
    EditCollectionSubmit,
    EditCollectionData,
    EditCollectionModalComponent
  >(EditCollectionModalComponent, {
    data,
  });

@Directive({ selector: '[pgCreateCollectionModal]', standalone: true })
export class CreateCollectionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgWorkspaceId: Option<string> = null;
  @Input() pgApplicationId: Option<string> = null;
  @Output() pgCreateCollection = new EventEmitter<CreateCollectionSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgWorkspaceId)) {
      throw new Error('pgWorkspaceId is missing');
    }

    if (isNull(this.pgApplicationId)) {
      throw new Error('pgApplicationId is missing');
    }

    const workspaceId = this.pgWorkspaceId;
    const applicationId = this.pgApplicationId;

    this.pgOpenModal.emit();

    openEditCollectionModal(this._dialog, {
      collection: null,
    }).closed.subscribe((collectionData) => {
      this.pgCloseModal.emit();

      if (collectionData !== undefined) {
        this.pgCreateCollection.emit({
          ...collectionData,
          workspaceId,
          applicationId,
        });
      }
    });
  }
}

@Directive({ selector: '[pgUpdateCollectionModal]', standalone: true })
export class UpdateCollectionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgCollection: Option<Collection> = null;

  @Output() pgUpdateCollection = new EventEmitter<EditCollectionSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgCollection)) {
      throw new Error('pgCollection is missing');
    }

    this.pgOpenModal.emit();

    openEditCollectionModal(this._dialog, {
      collection: this.pgCollection,
    }).closed.subscribe((collectionData) => {
      this.pgCloseModal.emit();

      if (collectionData !== undefined) {
        this.pgUpdateCollection.emit(collectionData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-collection-modal',
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
        {{ collection === null ? 'Create' : 'Update' }} collection
      </h1>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="max-h-96 overflow-y-auto"
      >
        <div>
          <label class="block" for="collection-id-input">Collection ID</label>
          <input
            class="block border-b-2 border-black"
            id="collection-id-input"
            type="text"
            formControlName="id"
            [readonly]="collection !== null"
          />
          <p *ngIf="collection === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="collection === null"
            type="button"
            (click)="idControl.setValue(onGenerateId())"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="collection-name-input">
            Collection name
          </label>
          <input
            class="block border-b-2 border-black"
            id="collection-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ collection === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    StopKeydownPropagationDirective,
    KeyboardListenerDirective,
  ],
})
export class EditCollectionModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditCollectionSubmit, EditCollectionModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditCollectionData>(DIALOG_DATA);

  readonly collection = this._data.collection;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.collection?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.collection?.name ?? '', {
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

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this._dialogRef.close();
    }
  }

  onGenerateId() {
    return generateId();
  }
}

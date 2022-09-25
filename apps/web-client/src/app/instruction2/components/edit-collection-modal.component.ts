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
import { CollectionMethodType } from '../utils';

export type Collection = Entity<{
  data: { name: string; method: CollectionMethodType };
}>;

export interface EditCollectionData {
  collection: Option<Collection>;
}

export type CreateCollectionSubmit = {
  name: string;
  method: CollectionMethodType;
};

export type UpdateCollectionSubmit = {
  name: string;
  method: CollectionMethodType;
};

export const openEditCollectionModal = (
  dialog: Dialog,
  data: EditCollectionData
) =>
  dialog.open<
    CreateCollectionSubmit | UpdateCollectionSubmit,
    EditCollectionData,
    EditCollectionModalComponent
  >(EditCollectionModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateCollectionModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateCollectionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Output() pgCreateCollection = new EventEmitter<CreateCollectionSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    openEditCollectionModal(this._dialog, {
      collection: null,
    }).closed.subscribe((collectionData) => {
      this.pgCloseModal.emit();

      if (collectionData !== undefined) {
        this.pgCreateCollection.emit(collectionData);
      }
    });
  }
}

@Directive({
  selector: '[pgUpdateCollectionModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateCollectionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgCollection: Option<Collection> = null;

  @Output() pgUpdateCollection = new EventEmitter<UpdateCollectionSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
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
    <pg-modal
      class="text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyListener="Escape"
      (pgKeyDown)="onClose()"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game-title uppercase">
          {{ collection === null ? 'Create' : 'Update' }} collection
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="collection-name-input">
            Collection name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="collection-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="mb-4">
          <label
            class="block bp-font-game text-xl"
            for="collection-method-input"
          >
            Collection Method
          </label>

          <select
            class="block bg-transparent"
            formControlName="method"
            id="collection-method-input"
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

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ collection === null ? 'Send' : 'Save' }}
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
export class EditCollectionModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        CreateCollectionSubmit | UpdateCollectionSubmit,
        EditCollectionModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditCollectionData>(DIALOG_DATA);

  readonly collection = this._data.collection;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.collection?.data.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    method: this._formBuilder.control<CollectionMethodType>(
      this.collection?.data.method ?? 'READ',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
  });

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  get methodControl() {
    return this.form.get('method') as FormControl<CollectionMethodType>;
  }

  onSubmit() {
    if (this.form.valid) {
      const name = this.nameControl.value;
      const method = this.methodControl.value;

      this._dialogRef.close({
        name,
        method,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

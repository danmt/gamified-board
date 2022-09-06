import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
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
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { v4 as uuid } from 'uuid';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, isNull, Option } from '../../shared/utils';

export type Collection = Entity<{
  name: string;
  thumbnailUrl: string;
  attributes: Entity<{ name: string; type: string; isOption: boolean }>[];
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

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="overflow-y-auto">
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

        <div>
          <label class="block" for="collection-thumbnail-url-input">
            Collection thumbnail
          </label>
          <input
            class="block border-b-2 border-black"
            id="collection-thumbnail-url-input"
            type="text"
            formControlName="thumbnailUrl"
          />
        </div>

        <div formArrayName="attributes">
          <p>
            <span>Collection attributes</span>
            <button (click)="onAddAttribute()" type="button">+</button>
          </p>

          <div
            class="flex flex-col gap-2"
            cdkDropList
            [cdkDropListData]="attributesControl.value"
            (cdkDropListDropped)="onAttributeDropped($event)"
          >
            <div
              *ngFor="
                let attributeForm of attributesControl.controls;
                let i = index
              "
              class="border-black border-2 p-2 bg-white relative"
              cdkDrag
              [cdkDragData]="attributeForm.value"
            >
              <div class="absolute right-2 top-2" cdkDragHandle>
                <svg width="24px" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"
                  ></path>
                  <path d="M0 0h24v24H0z" fill="none"></path>
                </svg>
              </div>

              <div [formGroup]="attributeForm">
                <div>
                  <label
                    class="block"
                    [for]="'collection-attributes-' + i + '-id'"
                  >
                    Attribute ID
                  </label>
                  <input
                    [id]="'collection-attributes-' + i + '-id'"
                    formControlName="id"
                    class="block border-b-2 border-black"
                    type="text"
                    [readonly]="collection !== null"
                  />
                  <p *ngIf="collection !== null">
                    Hint: The ID cannot be changed afterwards.
                  </p>
                  <button
                    *ngIf="collection !== null"
                    type="button"
                    (click)="attributeForm.get('id')?.setValue(onGenerateId())"
                  >
                    Generate
                  </button>
                </div>

                <div>
                  <label
                    class="block"
                    [for]="'collection-attributes-' + i + '-name'"
                  >
                    Attribute name
                  </label>
                  <input
                    [id]="'collection-attributes-' + i + '-name'"
                    formControlName="name"
                    class="block border-b-2 border-black"
                    type="text"
                  />
                </div>
                <div>
                  <label
                    class="block"
                    [for]="'collection-attributes-' + i + '-type'"
                  >
                    Attribute type
                  </label>

                  <select
                    class="block"
                    formControlName="type"
                    [id]="'collection-attributes-' + i + '-type'"
                  >
                    <option value="u8">u8</option>
                    <option value="u16">u16</option>
                    <option value="u32">u32</option>
                    <option value="u64">u64</option>
                    <option value="String">String</option>
                    <option value="Pubkey">Public Key</option>
                  </select>
                </div>

                <div>
                  <input
                    formControlName="isOption"
                    type="checkbox"
                    [id]="'collection-attributes-' + i + '-is-option'"
                  />
                  <label [for]="'collection-attributes-' + i + '-is-option'">
                    Is Optional
                  </label>
                </div>

                <button (click)="onRemoveAttribute(i)" type="button">x</button>
              </div>
            </div>
          </div>
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
    thumbnailUrl: this._formBuilder.control<string>(
      this.collection?.thumbnailUrl ?? '',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
    attributes: this.collection?.attributes
      ? this._formBuilder.array(
          this.collection.attributes.map((attribute) =>
            this._formBuilder.group({
              id: this._formBuilder.control<string>(attribute.id, {
                validators: [Validators.required],
                nonNullable: true,
              }),
              name: this._formBuilder.control<string>(attribute.name, {
                validators: [Validators.required],
                nonNullable: true,
              }),
              type: this._formBuilder.control<string>(attribute.type, {
                validators: [Validators.required],
                nonNullable: true,
              }),
              isOption: this._formBuilder.control<boolean>(attribute.isOption, {
                nonNullable: true,
              }),
            })
          )
        )
      : this._formBuilder.array([]),
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

  get attributesControl() {
    return this.form.get('attributes') as FormArray<
      FormGroup<{
        id: FormControl<string>;
        name: FormControl<string>;
        type: FormControl<string>;
        isOption: FormControl<boolean>;
      }>
    >;
  }

  onAddAttribute() {
    const attributeForm = this._formBuilder.group({
      id: this._formBuilder.control<string>('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      name: this._formBuilder.control<string>('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      type: this._formBuilder.control<string>('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      isOption: this._formBuilder.control<boolean>(false, {
        nonNullable: true,
      }),
    });

    this.attributesControl.push(attributeForm);
  }

  onRemoveAttribute(index: number) {
    this.attributesControl.removeAt(index);
  }

  onAttributeDropped(
    event: CdkDragDrop<
      Partial<{
        id: string;
        name: string;
        type: string;
        isOption: boolean;
      }>[],
      unknown,
      Partial<{
        id: string;
        name: string;
        type: string;
        isOption: boolean;
      }>
    >
  ) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    this.attributesControl.setValue(
      event.container.data.map((attributeData) => ({
        id: attributeData.id ?? '',
        name: attributeData.name ?? '',
        type: attributeData.type ?? '',
        isOption: !!attributeData.isOption,
      }))
    );
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const thumbnailUrl = this.thumbnailUrlControl.value;
      const attributes = this.attributesControl.controls.map(
        (attributeForm) => {
          const idControl = attributeForm.get('id') as FormControl<string>;
          const nameControl = attributeForm.get('name') as FormControl<string>;
          const typeControl = attributeForm.get('type') as FormControl<string>;
          const isOptionControl = attributeForm.get(
            'isOption'
          ) as FormControl<boolean>;

          return {
            id: idControl.value,
            name: nameControl.value,
            type: typeControl.value,
            isOption: isOptionControl.value,
          };
        }
      );

      this._dialogRef.close({
        id,
        name,
        thumbnailUrl,
        attributes,
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

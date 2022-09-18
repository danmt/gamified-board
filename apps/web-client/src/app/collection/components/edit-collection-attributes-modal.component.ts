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
import { ModalComponent } from '../../shared/components';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { Entity, generateId, isNull, Option } from '../../shared/utils';

export type CollectionAttributes = Entity<{
  name: string;
  type: string;
  isOption: boolean;
}>[];

export interface EditCollectionAttributesData {
  collectionAttributes: Option<CollectionAttributes>;
}

export type EditCollectionAttributesSubmit = CollectionAttributes;

export const openEditCollectionAttributesModal = (
  dialog: Dialog,
  data: EditCollectionAttributesData
) =>
  dialog.open<
    EditCollectionAttributesSubmit,
    EditCollectionAttributesData,
    EditCollectionAttributesModalComponent
  >(EditCollectionAttributesModalComponent, {
    data,
  });

@Directive({
  selector: '[pgUpdateCollectionAttributesModal]',
  standalone: true,
})
export class UpdateCollectionAttributesModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgCollectionAttributes: Option<CollectionAttributes> = null;

  @Output() pgUpdateCollectionAttributes =
    new EventEmitter<EditCollectionAttributesSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgCollectionAttributes)) {
      throw new Error('pgCollectionAttributes is missing');
    }

    this.pgOpenModal.emit();

    openEditCollectionAttributesModal(this._dialog, {
      collectionAttributes: this.pgCollectionAttributes,
    }).closed.subscribe((collectionData) => {
      this.pgCloseModal.emit();

      if (collectionData !== undefined) {
        this.pgUpdateCollectionAttributes.emit(collectionData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-collection-attributes-modal',
  template: `
    <pg-modal
      class="text-white min-w-[550px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <div class="flex items-center w-full mb-4">
        <h1 class="text-3xl bp-font-game-title uppercase mr-6">
          Collection attributes
        </h1>

        <button
          class="bp-button-add-futuristic z-40"
          (click)="onAddAttribute()"
          type="button"
        ></button>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px] text-white"
      >
        <div class="mb-4" formArrayName="attributes">
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
              class="bg-black bg-opacity-40 p-2 flex items-center rounded"
              cdkDrag
              [cdkDragData]="attributeForm.value"
            >
              <div cdkDragHandle>
                <svg
                  class="cursor-grab"
                  width="24px"
                  fill="currentColor"
                  viewBox="0 0 24 15"
                >
                  <path
                    d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"
                  ></path>
                  <path d="M0 0h24v24H0z" fill="none"></path>
                </svg>
              </div>

              <div
                [formGroup]="attributeForm"
                class="flex justify-between items-center w-full"
              >
                <div>
                  <input
                    [id]="'collection-attributes-' + i + '-name'"
                    formControlName="name"
                    class="block border-b-2 border-black bg-transparent"
                    type="text"
                    placeholder="Attribute name"
                  />
                </div>
                <div>
                  <select
                    class="block bg-transparent"
                    formControlName="type"
                    [id]="'collection-attributes-' + i + '-type'"
                  >
                    <option
                      class="text-black"
                      value=""
                      selected="selected"
                      disabled
                    >
                      Attribute type
                    </option>
                    <option class="text-black" value="u8">u8</option>
                    <option class="text-black" value="u16">u16</option>
                    <option class="text-black" value="u32">u32</option>
                    <option class="text-black" value="u64">u64</option>
                    <option class="text-black" value="String">String</option>
                    <option class="text-black" value="Pubkey">
                      Public Key
                    </option>
                  </select>
                </div>

                <div class="flex flex-col justify-center ml-5">
                  <input
                    formControlName="isOption"
                    type="checkbox"
                    [id]="'collection-attributes-' + i + '-is-option'"
                  />
                  <label
                    class="text-xs"
                    [for]="'collection-attributes-' + i + '-is-option'"
                  >
                    Optional
                  </label>
                </div>

                <button
                  class="ml-5"
                  (click)="onRemoveAttribute(i)"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="red"
                    class="bi bi-trash"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
                    />
                    <path
                      fill-rule="evenodd"
                      d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center items-center mt-10 mb-10">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            Save
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
    KeyboardListenerDirective,
    ModalComponent,
  ],
})
export class EditCollectionAttributesModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditCollectionAttributesSubmit,
        EditCollectionAttributesModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditCollectionAttributesData>(DIALOG_DATA);

  readonly collectionAttributes = this._data.collectionAttributes;
  readonly form = this._formBuilder.group({
    attributes: this.collectionAttributes
      ? this._formBuilder.array(
          this.collectionAttributes.map((attribute) =>
            this._formBuilder.group({
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
              isNew: this._formBuilder.control<boolean>(false, {
                nonNullable: true,
              }),
            })
          )
        )
      : this._formBuilder.array([]),
  });

  get attributesControl() {
    return this.form.get('attributes') as FormArray<
      FormGroup<{
        name: FormControl<string>;
        type: FormControl<string>;
        isOption: FormControl<boolean>;
        isNew: FormControl<boolean>;
      }>
    >;
  }

  onAddAttribute() {
    const attributeForm = this._formBuilder.group({
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
      isNew: this._formBuilder.control<boolean>(true, {
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
        isNew: boolean;
      }>[],
      unknown,
      Partial<{
        id: string;
        name: string;
        type: string;
        isOption: boolean;
        isNew: boolean;
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
        isNew: !!attributeData.isNew,
      }))
    );
  }

  onSubmit() {
    if (this.form.valid) {
      const attributes = this.attributesControl.controls.map(
        (attributeForm) => {
          const nameControl = attributeForm.get('name') as FormControl<string>;
          const typeControl = attributeForm.get('type') as FormControl<string>;
          const isOptionControl = attributeForm.get(
            'isOption'
          ) as FormControl<boolean>;

          return {
            id: generateId(),
            name: nameControl.value,
            type: typeControl.value,
            isOption: isOptionControl.value,
          };
        }
      );

      this._dialogRef.close(attributes);
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

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
  Entity,
  generateId,
  isNull,
  KeyboardListenerDirective,
  Option,
  StopKeydownPropagationDirective,
} from '../../shared';

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
      class="text-white min-w-[450px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <div class="flex items-center w-full mb-4 mt-6">
        <h1 class="text-3xl bp-font-game uppercase mr-6">
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
        class="overflow-y-auto max-h-[515px] text-black"
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
                    [readonly]="attributeForm.get('isNew')?.value"
                  />
                  <p *ngIf="attributeForm.get('isNew')?.value">
                    Hint: The ID cannot be changed afterwards.
                  </p>
                  <button
                    *ngIf="attributeForm.get('isNew')?.value"
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
        id: FormControl<string>;
        name: FormControl<string>;
        type: FormControl<string>;
        isOption: FormControl<boolean>;
        isNew: FormControl<boolean>;
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

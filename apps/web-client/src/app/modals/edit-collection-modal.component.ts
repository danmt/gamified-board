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
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Option } from '../utils';

export interface EditCollectionData {
  id: string;
  name: string;
  thumbnailUrl: string;
  attributes: { name: string; type: string; isOption: boolean }[];
}

@Directive({ selector: '[pgEditCollectionModal]', standalone: true })
export class EditCollectionModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() collection: Option<EditCollectionData> = null;
  @Output() createCollection = new EventEmitter<EditCollectionData>();
  @Output() updateCollection = new EventEmitter<EditCollectionData>();
  @HostListener('click', []) onClick() {
    this._dialog
      .open<
        EditCollectionData,
        Option<EditCollectionData>,
        EditCollectionModalComponent
      >(EditCollectionModalComponent, {
        data: this.collection,
      })
      .closed.subscribe((collectionData) => {
        if (collectionData !== undefined) {
          if (this.collection === null) {
            this.createCollection.emit(collectionData);
          } else {
            this.updateCollection.emit(collectionData);
          }
        }
      });
  }
}

@Component({
  selector: 'pg-edit-collection-modal',
  template: `
    <div
      class="px-4 pt-1 pb-4 bp-skin-modal-body text-white shadow-xl relative"
    >
      <div class="absolute bp-skin-modal-top -z-10"></div>
      <div class="absolute bp-skin-modal-bottom -z-10"></div>
      <!-- <div class="absolute bp-skin-modal-1 -z-10"></div> -->
      <div class="flex">
        <button
          class="absolute top-4 right-4 bp-button-close"
          (click)="onClose()"
        ></button>

        <h1
          class="text-center text-xl mb-4 bp-font-game text-3xl tracking-wider pt-2.5"
        >
          {{ collection === null ? 'Create' : 'Update' }} collection
        </h1>
      </div>
      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="max-h-96 overflow-y-auto bp-font-game pr-2.5"
      >
        <div class="mb-4">
          <label class="block text-xl" for="collection-id-input"
            >Collection ID</label
          >
          <input
            class="bp-input-metal"
            id="collection-id-input"
            type="text"
            formControlName="id"
            [readonly]="collection !== null"
          />
          <!-- <p *ngIf="collection === null">
            Hint: The ID cannot be changed afterwards.
          </p> -->
          <button
            *ngIf="collection === null"
            type="button"
            (click)="onGenerateId()"
          >
            Generate
          </button>
        </div>

        <div class="mb-4">
          <label class="block text-xl" for="collection-name-input">
            Collection name
          </label>
          <input
            class="bp-input-metal"
            id="collection-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="mb-4">
          <label class="block text-xl" for="collection-thumbnail-url-input">
            Collection thumbnail
          </label>
          <input
            class="bp-input-metal"
            id="collection-thumbnail-url-input"
            type="text"
            formControlName="thumbnailUrl"
          />
        </div>

        <div formArrayName="attributes">
          <p>
            <span class="mr-8">Collection attributes</span>
            <button (click)="onAddAttribute()" type="button">+</button>
          </p>

          <div class="flex flex-col gap-2">
            <div
              *ngFor="
                let attributeForm of attributesControl.controls;
                let i = index
              "
              class="bp-metal-plate p-3"
            >
              <div [formGroup]="attributeForm">
                <div class="mb-4">
                  <label
                    class="block"
                    [for]="'collection-attributes-' + i + '-name'"
                  >
                    Attribute name
                  </label>
                  <input
                    [id]="'collection-attributes-' + i + '-name'"
                    formControlName="name"
                    class="bp-input-metal"
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
                  <label for="'collection-attributes-' + i + '-is-option'"
                    >Is Optional</label
                  >
                </div>

                <button (click)="onRemoveAttribute(i)" type="button">x</button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="bp-button-metal">
            {{ collection === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditCollectionModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditCollectionData, EditCollectionModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);

  readonly collection = inject<Option<EditCollectionData>>(DIALOG_DATA);
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
        name: FormControl<string>;
        type: FormControl<string>;
        isOption: FormControl<boolean>;
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
    });

    this.attributesControl.push(attributeForm);
  }

  onRemoveAttribute(index: number) {
    this.attributesControl.removeAt(index);
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const thumbnailUrl = this.thumbnailUrlControl.value;
      const attributes = this.attributesControl.controls.map(
        (attributeForm) => {
          const nameControl = attributeForm.get('name') as FormControl<string>;
          const typeControl = attributeForm.get('type') as FormControl<string>;
          const isOptionControl = attributeForm.get(
            'isOption'
          ) as FormControl<boolean>;

          return {
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

  onGenerateId() {
    this.form.get('id')?.setValue(uuid());
  }
}

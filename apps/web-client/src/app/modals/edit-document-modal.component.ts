import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { combineLatest, map, of } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { BoardStore } from '../stores';
import { Option } from '../utils';

type ArgumentSeed = {
  kind: 'argument';
  argument: Option<{
    id: string;
    name: string;
  }>;
};

type AttributeSeed = {
  kind: 'attribute';
  attribute: Option<{
    id: string;
    name: string;
  }>;
  document: Option<{
    id: string;
    name: string;
  }>;
};

type ReferenceSeed = ArgumentSeed | AttributeSeed;

type ValueSeed = {
  kind: null;
  value: string;
  type: string;
};

type SeedTypes = ReferenceSeed | ValueSeed;

type AttributeReference = {
  kind: 'attribute';
  attributeId: string;
  attributeName: string;
  documentId: string;
  documentName: string;
};

type ArgumentReference = {
  kind: 'argument';
  argumentId: string;
  argumentName: string;
};

type SeedReference = AttributeReference | ArgumentReference;

export interface EditDocumentData {
  document: Option<{
    id: string;
    name: string;
    method: string;
    seeds: SeedTypes[];
  }>;
  collection: {
    name: string;
    isInternal: boolean;
    isAnchor: boolean;
  };
  instructionId: string;
}
export interface EditDocumentSubmitPayload {
  id: string;
  name: string;
  method: string;
  seeds: (
    | { kind: 'attribute'; documentId: string; attributeId: string }
    | { kind: 'argument'; argumentId: string }
    | { kind: null; value: string; type: string }
  )[];
}

@Component({
  selector: 'pg-edit-document-modal',
  template: `
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ document === null ? 'Create' : 'Update' }} {{ collection.name }}
      </h1>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="max-h-96 overflow-y-auto"
      >
        <div>
          <label class="block" for="document-id-input">Document ID</label>
          <input
            class="block border-b-2 border-black"
            id="document-id-input"
            type="text"
            formControlName="id"
            [readonly]="document !== null"
          />
          <p *ngIf="document === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="document === null"
            type="button"
            (click)="onGenerateId()"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="document-name-input"> Document name </label>
          <input
            class="block border-b-2 border-black"
            id="document-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <fieldset>
          <legend>Select a method:</legend>

          <div>
            <input
              type="radio"
              id="document-method-read"
              value="read"
              formControlName="method"
            />
            <label for="document-method-read">Read</label>
          </div>

          <div *ngIf="collection.isInternal || collection.isAnchor">
            <input
              type="radio"
              id="document-method-create"
              value="create"
              formControlName="method"
            />
            <label for="document-method-create">Create</label>
          </div>

          <div>
            <input
              type="radio"
              id="document-method-update"
              value="update"
              formControlName="method"
            />
            <label for="document-method-update">Update</label>
          </div>

          <div>
            <input
              type="radio"
              id="document-method-delete"
              value="delete"
              formControlName="method"
            />
            <label for="document-method-delete">Delete</label>
          </div>
        </fieldset>

        <div formArrayName="seeds">
          <p>
            <span>Document seeds</span>
            <button (click)="onAddSeed()" type="button">+</button>
          </p>

          <div
            class="flex flex-col gap-2"
            cdkDropList
            [cdkDropListData]="seedsControl.value"
            (cdkDropListDropped)="onSeedDropped($event)"
          >
            <div
              *ngFor="let seedForm of seedsControl.controls; let i = index"
              class="border-black border-2 p-2 bg-white relative"
              cdkDrag
              [cdkDragData]="seedForm.value"
            >
              <div class="absolute right-2 top-2" cdkDragHandle>
                <svg width="24px" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"
                  ></path>
                  <path d="M0 0h24v24H0z" fill="none"></path>
                </svg>
              </div>

              <div [formGroup]="seedForm">
                <div>
                  <input
                    type="checkbox"
                    id="document-seeds-is-reference"
                    formControlName="isReference"
                  />
                  <label for="document-seeds-is-reference">
                    Is Reference
                  </label>
                </div>

                <div *ngIf="seedForm.get('isReference')?.value === true">
                  <label class="block" for="document-seeds-search">
                    Search reference
                  </label>

                  <select
                    id="document-seeds-search"
                    formControlName="reference"
                  >
                    <option
                      *ngFor="let reference of seedReferences$ | async"
                      [value]="reference"
                    >
                      <ng-container *ngIf="reference.kind === 'argument'">
                        Argument {{ reference.argumentName }}
                      </ng-container>
                      <ng-container *ngIf="reference.kind === 'attribute'">
                        Attribute {{ reference.documentName }}.{{
                          reference.attributeName
                        }}
                      </ng-container>
                    </option>
                  </select>
                </div>

                <div *ngIf="seedForm.get('isReference')?.value === false">
                  <label class="block" for="document-seeds-value">
                    Value
                  </label>
                  <input
                    class="block border-b-2 border-black"
                    type="text"
                    id="document-seeds-value"
                    formControlName="value"
                  />
                </div>

                <div *ngIf="seedForm.get('isReference')?.value === false">
                  <label class="block" for="document-seeds-type"> Type </label>
                  <select
                    class="block"
                    id="document-seeds-type"
                    formControlName="type"
                  >
                    <option ngValue="u8">u8</option>
                    <option ngValue="u16">u16</option>
                    <option ngValue="u32">u32</option>
                    <option ngValue="u64">u64</option>
                    <option ngValue="String">String</option>
                    <option ngValue="Pubkey">Public Key</option>
                  </select>
                </div>

                <button (click)="onRemoveSeed(i)" type="button">x</button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ document === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
})
export class EditDocumentModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditDocumentSubmitPayload, EditDocumentModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditDocumentData>(DIALOG_DATA);
  private readonly _boardStore = inject(BoardStore);

  readonly document = this._data.document;
  readonly collection = this._data.collection;
  readonly instructionId = this._data.instructionId;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.document?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.document?.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    method: this._formBuilder.control<string>(this.document?.method ?? 'read', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    seeds: this.document?.seeds
      ? this._formBuilder.array(
          this.document.seeds.map((seed) => {
            const reference: Option<SeedReference> =
              seed.kind === 'argument'
                ? seed.argument !== null
                  ? {
                      kind: 'argument',
                      argumentId: seed.argument.id,
                      argumentName: seed.argument.name,
                    }
                  : null
                : seed.kind === 'attribute'
                ? seed.attribute !== null && seed.document !== null
                  ? {
                      kind: 'attribute',
                      attributeId: seed.attribute.id,
                      attributeName: seed.attribute.name,
                      documentId: seed.document.id,
                      documentName: seed.document.name,
                    }
                  : null
                : null;

            return this._formBuilder.group({
              isReference: this._formBuilder.control<boolean>(
                seed.kind !== null,
                {
                  validators: [Validators.required],
                  nonNullable: true,
                }
              ),
              reference: this._formBuilder.control(reference),
              value: this._formBuilder.control<Option<string | number>>(
                seed.kind === null ? seed.value : null
              ),
              type: this._formBuilder.control<Option<string>>(
                seed.kind === null ? seed.type : null
              ),
            });
          })
        )
      : this._formBuilder.array([]),
  });
  seedReferences$ = combineLatest([
    this._boardStore.boardInstructions$,
    of(this._data.instructionId),
  ]).pipe(
    map(([boardInstructions, instructionId]) => {
      const instruction =
        boardInstructions?.find(({ id }) => id === instructionId) ?? null;

      if (instruction === null) {
        return null;
      }

      return [
        ...instruction.arguments.map((argument) => ({
          kind: 'argument' as const,
          argumentId: argument.id,
          argumentName: argument.name,
        })),
        ...instruction.documents.reduce<AttributeReference[]>(
          (attributes, document) => [
            ...attributes,
            ...document.collection.attributes.map((attribute) => ({
              kind: 'attribute' as const,
              attributeId: attribute.id,
              attributeName: attribute.name,
              documentId: document.id,
              documentName: document.name,
            })),
          ],
          []
        ),
      ];
    })
  );

  get idControl() {
    return this.form.get('id') as FormControl<string>;
  }

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  get methodControl() {
    return this.form.get('method') as FormControl<string>;
  }

  get seedsControl() {
    return this.form.get('seeds') as FormArray<
      FormGroup<{
        isReference: FormControl<boolean>;
        reference: FormControl<Option<SeedReference>>;
        value: FormControl<Option<string | number>>;
        type: FormControl<Option<string>>;
      }>
    >;
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const method = this.methodControl.value;
      const seeds = this.seedsControl.controls.map((seedForm) => {
        const isReferenceControl = seedForm.get(
          'isReference'
        ) as FormControl<boolean>;
        const referenceControl = seedForm.get('reference') as FormControl<
          Option<SeedReference>
        >;
        const valueControl = seedForm.get('value') as FormControl<
          Option<string>
        >;
        const typeControl = seedForm.get('type') as FormControl<Option<string>>;

        if (isReferenceControl.value) {
          if (referenceControl.value?.kind === 'argument') {
            return {
              kind: 'argument' as const,
              argumentId: referenceControl.value.argumentId,
            };
          } else if (referenceControl.value?.kind === 'attribute') {
            return {
              kind: 'attribute' as const,
              documentId: referenceControl.value.documentId,
              attributeId: referenceControl.value.attributeId,
            };
          } else {
            throw new Error('Invalid reference kind');
          }
        } else {
          if (valueControl.value === null || typeControl.value === null) {
            throw new Error('Invalid value');
          }

          return {
            kind: null,
            value: valueControl.value,
            type: typeControl.value,
          };
        }
      });

      this._dialogRef.close({
        id,
        name,
        method,
        seeds,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  displayFn(reference: Option<SeedReference>): string {
    if (reference === null) {
      return '';
    }

    if (reference.kind === 'argument') {
      return `Argument: ${reference.argumentName}`;
    } else {
      return `Attribute: ${reference.documentName}.${reference.attributeName}`;
    }
  }

  onAddSeed() {
    const seedForm = this._formBuilder.group({
      isReference: this._formBuilder.control<boolean>(true, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      reference: this._formBuilder.control<Option<SeedReference>>(null),
      value: this._formBuilder.control<Option<string | number>>(null),
      type: this._formBuilder.control<Option<string>>(null),
    });

    this.seedsControl.push(seedForm);
  }

  onRemoveSeed(index: number) {
    this.seedsControl.removeAt(index);
  }

  onSeedDropped(
    event: CdkDragDrop<
      Partial<{
        isReference: boolean;
        reference: Option<SeedReference>;
        value: Option<string | number>;
        type: Option<string>;
      }>[],
      unknown,
      {
        isReference: boolean;
        reference: Option<SeedReference>;
        value: Option<string | number>;
        type: Option<string>;
      }
    >
  ) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    this.seedsControl.setValue(
      event.container.data.map((seedData) => ({
        isReference: seedData.isReference ?? true,
        reference: seedData.reference ?? null,
        value: seedData.value ?? null,
        type: seedData.type ?? null,
      }))
    );
  }

  onGenerateId() {
    return uuid();
  }
}

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
import { isNotNull, Option } from '../utils';

interface ArgumentSeed {
  kind: 'argument';
  argument: {
    id: string;
    name: string;
    type: string;
  };
}

interface AttributeSeed {
  kind: 'attribute';
  attribute: {
    id: string;
    name: string;
    type: string;
  };
  document: {
    id: string;
    name: string;
  };
}

type ReferenceSeed = ArgumentSeed | AttributeSeed;

interface ValueSeed {
  kind: null;
  value: string;
  type: string;
}

type SeedTypes = ReferenceSeed | ValueSeed;

export interface EditDocumentData {
  document: Option<{
    id: string;
    name: string;
    method: string;
    seeds: Option<SeedTypes>[];
    bump: Option<ReferenceSeed>;
  }>;
  collection: {
    name: string;
    isInternal: boolean;
    isAnchor: boolean;
  };
  instructionId: string;
}

type SeedOutput =
  | { kind: 'attribute'; documentId: string; attributeId: string }
  | { kind: 'argument'; argumentId: string }
  | { kind: null; value: string; type: string };

export interface EditDocumentSubmitPayload {
  id: string;
  name: string;
  method: string;
  bump: Option<
    | { kind: 'attribute'; documentId: string; attributeId: string }
    | { kind: 'argument'; argumentId: string }
  >;
  seeds: SeedOutput[];
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

            <button
              (click)="onAddAttributeSeed()"
              type="button"
              class="px-4 py-2 border-blue-500 border"
            >
              Attribute +
            </button>
            <button
              (click)="onAddArgumentSeed()"
              type="button"
              class="px-4 py-2 border-blue-500 border"
            >
              Argument +
            </button>
            <button
              (click)="onAddValueSeed()"
              type="button"
              class="px-4 py-2 border-blue-500 border"
            >
              Value +
            </button>
          </p>

          <div
            class="flex flex-col gap-2"
            cdkDropList
            [cdkDropListData]="seedsControl"
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

              <p *ngIf="seedForm.value === null">Invalid seed.</p>

              <div [formGroup]="seedForm">
                <div [ngSwitch]="seedForm.value.kind">
                  <div *ngSwitchCase="'argument'">
                    <div>
                      <label
                        class="block"
                        [for]="'document-seeds-' + i + '-argument'"
                      >
                        Search argument
                      </label>

                      <select
                        [id]="'document-seeds-' + i + '-argument'"
                        formControlName="reference"
                        [compareWith]="compareArgumentsFn"
                      >
                        <option
                          *ngFor="
                            let argumentReference of argumentReferences$ | async
                          "
                          [ngValue]="argumentReference"
                        >
                          Argument {{ argumentReference.argument.name }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div *ngSwitchCase="'attribute'">
                    <div>
                      <label
                        class="block"
                        [for]="'document-seeds-' + i + '-attribute'"
                      >
                        Search attribute
                      </label>

                      <select
                        [id]="'document-seeds-' + i + '-attribute'"
                        formControlName="reference"
                        [compareWith]="compareAttributesFn"
                      >
                        <option
                          *ngFor="
                            let attributeReference of attributeReferences$
                              | async
                          "
                          [ngValue]="attributeReference"
                        >
                          Attribute {{ attributeReference.document.name }}.{{
                            attributeReference.attribute.name
                          }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div *ngSwitchCase="'invalid'">Invalid seed</div>

                  <div *ngSwitchDefault>
                    <div>
                      <label
                        class="block"
                        [for]="'document-seeds-' + i + '-value'"
                      >
                        Value
                      </label>
                      <input
                        class="block border-b-2 border-black"
                        type="text"
                        [id]="'document-seeds-' + i + '-value'"
                        formControlName="value"
                      />
                    </div>

                    <div>
                      <label
                        class="block"
                        [for]="'document-seeds-' + i + '-type'"
                      >
                        Type
                      </label>
                      <select
                        class="block"
                        [id]="'document-seeds-' + i + '-type'"
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
                  </div>
                </div>

                <button (click)="onRemoveSeed(i)" type="button">x</button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="seedsControl.controls.length > 0">
          <label for="document-bump">Document bump</label>

          <select
            formControlName="bump"
            id="document-bump"
            [compareWith]="compareBump"
          >
            <option [ngValue]="null">Not selected</option>
            <option
              *ngFor="let reference of bumpReferences$ | async"
              [ngValue]="reference"
            >
              <ng-container *ngIf="reference.kind === 'attribute'">
                Attribute {{ reference.document.name }}.{{
                  reference.attribute.name
                }}
              </ng-container>
              <ng-container *ngIf="reference.kind === 'argument'">
                Argument {{ reference.argument.name }}
              </ng-container>
            </option>
          </select>
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
            if (seed === null) {
              return this._formBuilder.group({
                kind: this._formBuilder.control<'invalid'>('invalid'),
              });
            } else if (seed.kind === 'argument') {
              return this._formBuilder.group({
                kind: this._formBuilder.control<'argument'>(seed.kind),
                reference: this._formBuilder.control<
                  Option<{
                    argument: {
                      id: string;
                      name: string;
                    };
                  }>
                >({ argument: seed.argument }),
              });
            } else if (seed.kind === 'attribute') {
              return this._formBuilder.group({
                kind: this._formBuilder.control<'attribute'>(seed.kind),
                reference: this._formBuilder.control<
                  Option<{
                    document: {
                      id: string;
                      name: string;
                    };
                    attribute: {
                      id: string;
                      name: string;
                    };
                  }>
                >({ document: seed.document, attribute: seed.attribute }),
              });
            } else {
              return this._formBuilder.group({
                kind: this._formBuilder.control<null>(seed.kind),
                value: this._formBuilder.control<string>(seed.value, {
                  nonNullable: true,
                }),
                type: this._formBuilder.control<string>(seed.type, {
                  nonNullable: true,
                }),
              });
            }
          })
        )
      : this._formBuilder.array([]),
    bump: this._formBuilder.control<
      Option<
        | {
            kind: 'attribute';
            document: {
              id: string;
              name: string;
            };
            attribute: {
              id: string;
              name: string;
            };
          }
        | {
            kind: 'argument';
            argument: {
              id: string;
              name: string;
            };
          }
      >
    >(this.document?.bump ?? null),
  });
  readonly argumentReferences$ = combineLatest([
    this._boardStore.boardInstructions$,
    of(this._data.instructionId),
  ]).pipe(
    map(([boardInstructions, instructionId]) => {
      const instruction =
        boardInstructions?.find(({ id }) => id === instructionId) ?? null;

      if (instruction === null) {
        return null;
      }

      return instruction.arguments.map((argument) => ({
        kind: 'argument' as const,
        argument,
      }));
    })
  );
  readonly attributeReferences$ = combineLatest([
    this._boardStore.boardInstructions$,
    of(this._data.instructionId),
  ]).pipe(
    map(([boardInstructions, instructionId]) => {
      const instruction =
        boardInstructions?.find(({ id }) => id === instructionId) ?? null;

      if (instruction === null) {
        return null;
      }

      return instruction.documents.reduce<AttributeSeed[]>(
        (attributes, document) => [
          ...attributes,
          ...document.collection.attributes.map((attribute) => ({
            kind: 'attribute' as const,
            attribute,
            document,
          })),
        ],
        []
      );
    })
  );
  readonly bumpReferences$ = combineLatest([
    this.argumentReferences$,
    this.attributeReferences$,
  ]).pipe(
    map(([argumentReferences, attributeReferences]) => [
      ...(argumentReferences?.filter(
        (argumentReference) => argumentReference.argument.type === 'u8'
      ) ?? []),
      ...(attributeReferences?.filter(
        (attributeReference) => attributeReference.attribute.type === 'u8'
      ) ?? []),
    ])
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
      | FormGroup<{
          kind: FormControl<'attribute'>;
          reference: FormControl<
            Option<{
              document: {
                id: string;
                name: string;
              };
              attribute: {
                id: string;
                name: string;
              };
            }>
          >;
        }>
      | FormGroup<{
          kind: FormControl<'argument'>;
          reference: FormControl<
            Option<{
              argument: {
                id: string;
                name: string;
              };
            }>
          >;
        }>
      | FormGroup<{
          kind: FormControl<null>;
          value: FormControl<string>;
          type: FormControl<string>;
        }>
      | FormGroup<{
          kind: FormControl<'invalid'>;
        }>
    >;
  }

  get bumpControl() {
    return this.form.get('bump') as FormControl<
      Option<
        | {
            kind: 'argument';
            argument: {
              id: string;
              name: string;
            };
          }
        | {
            kind: 'attribute';
            document: {
              id: string;
              name: string;
            };
            attribute: {
              id: string;
              name: string;
            };
          }
      >
    >;
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;
      const method = this.methodControl.value;
      const bump = this.bumpControl.value;
      const seeds = this.seedsControl.value
        .map((seed) => {
          if (seed.kind === 'argument' && seed.reference) {
            return {
              kind: seed.kind,
              argumentId: seed.reference.argument.id,
            };
          } else if (seed.kind === 'attribute' && seed.reference) {
            return {
              kind: seed.kind,
              documentId: seed.reference.document.id,
              attributeId: seed.reference.attribute.id,
            };
          } else if (seed.kind === null && seed.value && seed.type) {
            return {
              kind: null,
              value: seed.value,
              type: seed.type,
            };
          } else {
            return null;
          }
        })
        .filter(isNotNull);

      this._dialogRef.close({
        id,
        name,
        method,
        seeds,
        bump:
          bump?.kind === 'argument'
            ? { kind: 'argument', argumentId: bump.argument.id }
            : bump?.kind === 'attribute'
            ? {
                kind: 'attribute',
                attributeId: bump.attribute.id,
                documentId: bump.document.id,
              }
            : null,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  displayFn(reference: Option<ReferenceSeed>): string {
    if (reference === null) {
      return '';
    }

    if (reference.kind === 'argument') {
      return `Argument: ${reference.argument.name}`;
    } else {
      return `Attribute: ${reference.document.name}.${reference.attribute.name}`;
    }
  }

  onAddAttributeSeed() {
    const seedForm = this._formBuilder.group({
      kind: this._formBuilder.control<'attribute'>('attribute', {
        nonNullable: true,
      }),
      reference: this._formBuilder.control<
        Option<{
          document: {
            id: string;
            name: string;
          };
          attribute: {
            id: string;
            name: string;
          };
        }>
      >(null),
    });

    this.seedsControl.push(seedForm);
  }

  onAddArgumentSeed() {
    const seedForm = this._formBuilder.group({
      kind: this._formBuilder.control<'argument'>('argument', {
        nonNullable: true,
      }),
      reference: this._formBuilder.control<
        Option<{
          argument: {
            id: string;
            name: string;
          };
        }>
      >(null),
    });

    this.seedsControl.push(seedForm);
  }

  onAddValueSeed() {
    const seedForm = this._formBuilder.group({
      kind: this._formBuilder.control<null>(null),
      value: this._formBuilder.control<string>('', { nonNullable: true }),
      type: this._formBuilder.control<string>('', { nonNullable: true }),
    });

    this.seedsControl.push(seedForm);
  }

  onRemoveSeed(index: number) {
    this.seedsControl.removeAt(index);

    if (this.seedsControl.controls.length === 0) {
      this.bumpControl.setValue(null);
    }
  }

  onSeedDropped(
    event: CdkDragDrop<
      FormArray<
        | FormGroup<{
            kind: FormControl<'attribute'>;
            reference: FormControl<
              Option<{
                document: {
                  id: string;
                  name: string;
                };
                attribute: {
                  id: string;
                  name: string;
                };
              }>
            >;
          }>
        | FormGroup<{
            kind: FormControl<'argument'>;
            reference: FormControl<
              Option<{
                argument: {
                  id: string;
                  name: string;
                };
              }>
            >;
          }>
        | FormGroup<{
            kind: FormControl<null>;
            value: FormControl<string>;
            type: FormControl<string>;
          }>
        | FormGroup<{
            kind: FormControl<'invalid'>;
          }>
      >,
      unknown,
      unknown
    >
  ) {
    const controls = [...event.container.data.controls];

    moveItemInArray(controls, event.previousIndex, event.currentIndex);

    controls.forEach((control, index) =>
      event.container.data.setControl(index, control)
    );
  }

  compareAttributesFn(
    attribute1: Option<{
      document: { id: string };
      attribute: { id: string };
    }>,
    attribute2: Option<{
      document: { id: string };
      attribute: { id: string };
    }>
  ) {
    return (
      (attribute1 === null && attribute2 === null) ||
      (attribute1?.document.id === attribute2?.document.id &&
        attribute1?.attribute.id === attribute2?.attribute.id)
    );
  }

  compareArgumentsFn(
    argument1: Option<{
      argument: { id: string };
    }>,
    argument2: Option<{
      argument: { id: string };
    }>
  ) {
    return (
      (argument1 === null && argument2 === null) ||
      argument1?.argument.id === argument2?.argument.id
    );
  }

  compareBump(
    bump1: Option<
      | {
          kind: 'argument';
          argument: { id: string };
        }
      | {
          kind: 'attribute';
          document: { id: string };
          attribute: { id: string };
        }
    >,
    bump2: Option<
      | {
          kind: 'argument';
          argument: { id: string };
        }
      | {
          kind: 'attribute';
          document: { id: string };
          attribute: { id: string };
        }
    >
  ) {
    return (
      (bump1 === null && bump2 === null) ||
      (bump1?.kind === 'argument' &&
        bump2?.kind === 'argument' &&
        bump1.argument.id === bump2.argument.id) ||
      (bump1?.kind === 'attribute' &&
        bump2?.kind === 'attribute' &&
        bump1.document.id === bump2.document.id &&
        bump1.attribute.id === bump2.attribute.id)
    );
  }

  onGenerateId() {
    return uuid();
  }
}

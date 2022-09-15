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
} from '@angular/forms';
import { Observable } from 'rxjs';
import { ModalComponent } from '../../shared/components';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import {
  Entity,
  generateId,
  isNotNull,
  isNull,
  Option,
} from '../../shared/utils';

interface ArgumentReference {
  kind: 'argument';
  id: string;
  name: string;
  type: string;
}

interface AttributeReference {
  kind: 'attribute';
  id: string;
  name: string;
  type: string;
  document: {
    id: string;
    name: string;
  };
}

type Reference = ArgumentReference | AttributeReference;

interface Value {
  value: string;
  type: string;
}

type InstructionDocumentSeeds = Entity<{
  seeds: Option<ArgumentReference | AttributeReference | Value>[];
  bump: Option<ArgumentReference | AttributeReference>;
}>;

export interface EditInstructionDocumentSeedsData {
  instructionDocumentSeeds: Option<InstructionDocumentSeeds>;
  argumentReferences$: Observable<ArgumentReference[]>;
  attributeReferences$: Observable<AttributeReference[]>;
  bumpReferences$: Observable<Reference[]>;
}

export interface EditInstructionDocumentSeedsSubmit {
  seeds: (
    | { kind: 'attribute'; documentId: string; id: string }
    | { kind: 'argument'; id: string }
    | { value: string; type: string }
  )[];
  bump: Option<
    | { kind: 'attribute'; documentId: string; id: string }
    | { kind: 'argument'; id: string }
  >;
}

export const openEditInstructionDocumentSeedsModal = (
  dialog: Dialog,
  data: EditInstructionDocumentSeedsData
) =>
  dialog.open<
    EditInstructionDocumentSeedsSubmit,
    EditInstructionDocumentSeedsData,
    EditInstructionDocumentSeedsModalComponent
  >(EditInstructionDocumentSeedsModalComponent, {
    data,
  });

@Directive({
  selector: '[pgUpdateInstructionDocumentSeedsModal]',
  standalone: true,
})
export class UpdateInstructionDocumentSeedsModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionDocumentSeeds: Option<InstructionDocumentSeeds> = null;
  @Input() pgArgumentReferences$: Option<Observable<ArgumentReference[]>> =
    null;
  @Input() pgAttributeReferences$: Option<Observable<AttributeReference[]>> =
    null;
  @Input() pgBumpReferences$: Option<Observable<Reference[]>> = null;

  @Output() pgUpdateInstructionDocumentSeeds =
    new EventEmitter<EditInstructionDocumentSeedsSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgInstructionDocumentSeeds)) {
      throw new Error('pgInstructionDocumentSeeds is missing.');
    }

    if (isNull(this.pgArgumentReferences$)) {
      throw new Error('pgArgumentReferences$ is missing.');
    }

    if (isNull(this.pgAttributeReferences$)) {
      throw new Error('pgAttributeReferences$ is missing.');
    }

    if (isNull(this.pgBumpReferences$)) {
      throw new Error('pgBumpReferences$ is missing.');
    }

    this.pgOpenModal.emit();

    openEditInstructionDocumentSeedsModal(this._dialog, {
      instructionDocumentSeeds: this.pgInstructionDocumentSeeds,
      argumentReferences$: this.pgArgumentReferences$,
      attributeReferences$: this.pgAttributeReferences$,
      bumpReferences$: this.pgBumpReferences$,
    }).closed.subscribe((instructionDocumentSeedsData) => {
      this.pgCloseModal.emit();

      if (instructionDocumentSeedsData !== undefined) {
        this.pgUpdateInstructionDocumentSeeds.emit(
          instructionDocumentSeedsData
        );
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-document-seeds-modal',
  template: `
    <pg-modal
      class="text-white min-w-[550px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game-title uppercase">
          Document seeds
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="max-h-[515px] overflow-y-auto"
      >
        <div formArrayName="seeds">
          <div class="flex w-full gap-1">
            <button
              (click)="onAddDocumentReference()"
              type="button"
              class="flex-1 px-4 py-2 border-gray-600 border-2"
            >
              Document +
            </button>
            <button
              (click)="onAddArgumentReference()"
              type="button"
              class="flex-1 px-4 py-2 border-gray-600 border-2"
            >
              Argument +
            </button>
            <button
              (click)="onAddValue()"
              type="button"
              class="flex-1 px-4 py-2 border-gray-600 border-2"
            >
              Value +
            </button>
          </div>

          <div class="my-5" *ngIf="seedsControl.controls.length > 0">
            <label for="document-bump" class="mr-4">Document bump</label>

            <select
              formControlName="bump"
              id="document-bump"
              [compareWith]="compareBump"
              class="border-b-2 border-black bg-transparent text-white"
            >
              <option class="text-black" [ngValue]="null" selected disabled>
                Not selected
              </option>
              <option
                *ngFor="let reference of bumpReferences$ | async"
                [ngValue]="reference"
              >
                <ng-container *ngIf="reference.kind === 'attribute'">
                  Attribute {{ reference.document.name }}.{{ reference.name }}
                </ng-container>
                <ng-container *ngIf="reference.kind === 'argument'">
                  Argument {{ reference.name }}
                </ng-container>
              </option>
            </select>
          </div>

          <div
            class="flex flex-col gap-2"
            cdkDropList
            [cdkDropListData]="seedsControl"
            (cdkDropListDropped)="onSeedDropped($event)"
          >
            <div
              *ngFor="let seedForm of seedsControl.controls; let i = index"
              class="bg-black bg-opacity-40 p-2 flex items-center rounded"
              cdkDrag
              [cdkDragData]="seedForm.value"
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

              <p *ngIf="seedForm.value === null">Invalid seed.</p>

              <div
                class="overflow-y-auto text-white flex justify-between w-full"
                [formGroup]="seedForm"
              >
                <div [ngSwitch]="seedForm.value.kind">
                  <div *ngSwitchCase="'argument'">
                    <div>
                      <select
                        [id]="'document-seeds-' + i + '-argument'"
                        formControlName="reference"
                        [compareWith]="compareArgumentsFn"
                        class="block bg-transparent"
                      >
                        <option
                          class="text-black"
                          [ngValue]="null"
                          selected
                          disabled
                        >
                          Select argument
                        </option>
                        <option
                          class="text-black"
                          *ngFor="
                            let argumentReference of argumentReferences$ | async
                          "
                          [ngValue]="argumentReference"
                        >
                          Argument {{ argumentReference.name }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div *ngSwitchCase="'attribute'">
                    <div>
                      <select
                        [id]="'document-seeds-' + i + '-document'"
                        formControlName="reference"
                        [compareWith]="compareAttributesFn"
                        class="block bg-transparent text-white"
                      >
                        <option
                          class="text-black"
                          [ngValue]="null"
                          selected
                          disabled
                        >
                          Select document
                        </option>
                        <option
                          class="text-black"
                          *ngFor="
                            let attributeReference of attributeReferences$
                              | async
                          "
                          [ngValue]="attributeReference"
                        >
                          Attribute {{ attributeReference.document.name }}.{{
                            attributeReference.name
                          }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div *ngSwitchCase="'invalid'">Invalid seed</div>

                  <div *ngSwitchDefault class="flex gap-4">
                    <div>
                      <input
                        class="block border-b-2 border-black bg-transparent"
                        type="text"
                        [id]="'document-seeds-' + i + '-value'"
                        formControlName="value"
                        placeholder="Value"
                      />
                    </div>

                    <div>
                      <select
                        class="block"
                        [id]="'document-seeds-' + i + '-type'"
                        formControlName="type"
                        class="block bg-transparent"
                      >
                        <option
                          class="text-black"
                          value=""
                          selected="selected"
                          disabled
                        >
                          Type
                        </option>
                        <option class="text-black" ngValue="u8">u8</option>
                        <option class="text-black" ngValue="u16">u16</option>
                        <option class="text-black" ngValue="u32">u32</option>
                        <option class="text-black" ngValue="u64">u64</option>
                        <option class="text-black" ngValue="String">
                          String
                        </option>
                        <option class="text-black" ngValue="Pubkey">
                          Public Key
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <button class="ml-5" (click)="onRemoveSeed(i)" type="button">
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

        <div class="flex justify-center items-center mt-10 mb-11">
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
export class EditInstructionDocumentSeedsModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditInstructionDocumentSeedsSubmit,
        EditInstructionDocumentSeedsModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data =
    inject<EditInstructionDocumentSeedsData>(DIALOG_DATA);

  readonly instructionDocumentSeeds = this._data.instructionDocumentSeeds;
  readonly argumentReferences$ = this._data.argumentReferences$;
  readonly attributeReferences$ = this._data.attributeReferences$;
  readonly bumpReferences$ = this._data.bumpReferences$;
  readonly form = this._formBuilder.group({
    seeds: this.instructionDocumentSeeds?.seeds
      ? this._formBuilder.array(
          this.instructionDocumentSeeds.seeds.map((seed) => {
            if (isNull(seed)) {
              return this._formBuilder.group({
                kind: this._formBuilder.control<'invalid'>('invalid'),
              });
            }

            if (!('kind' in seed)) {
              return this._formBuilder.group({
                kind: this._formBuilder.control<null>(null),
                value: this._formBuilder.control<string>(seed.value, {
                  nonNullable: true,
                }),
                type: this._formBuilder.control<string>(seed.type, {
                  nonNullable: true,
                }),
              });
            }

            if (seed.kind === 'argument') {
              return this._formBuilder.group({
                kind: this._formBuilder.control<'argument'>(seed.kind),
                reference: this._formBuilder.control<
                  Option<{
                    argument: {
                      id: string;
                      name: string;
                    };
                  }>
                >({ argument: seed }),
              });
            } else {
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
                >({ document: seed.document, attribute: seed }),
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
            id: string;
            name: string;
          }
        | {
            kind: 'argument';
            id: string;
            name: string;
          }
      >
    >(this.instructionDocumentSeeds?.bump ?? null),
  });

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
      const seeds = this.seedsControl.value
        .map((seed) => {
          if (seed.kind === 'argument' && seed.reference) {
            return {
              kind: seed.kind,
              id: seed.reference.argument.id,
            };
          } else if (seed.kind === 'attribute' && seed.reference) {
            return {
              kind: seed.kind,
              documentId: seed.reference.document.id,
              id: seed.reference.attribute.id,
            };
          } else if (seed.kind === null && seed.value && seed.type) {
            return {
              value: seed.value,
              type: seed.type,
            };
          } else {
            return null;
          }
        })
        .filter(isNotNull);
      const bump = this.bumpControl.value;

      this._dialogRef.close({
        seeds,
        bump:
          bump?.kind === 'argument'
            ? { kind: 'argument', id: bump.argument.id }
            : bump?.kind === 'attribute'
            ? {
                kind: 'attribute',
                id: bump.attribute.id,
                documentId: bump.document.id,
              }
            : null,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  displayFn(reference: Option<Reference>): string {
    if (isNull(reference)) {
      return '';
    }

    if (reference.kind === 'argument') {
      return `Argument: ${reference.name}`;
    } else {
      return `Attribute: ${reference.document.name}.${reference.name}`;
    }
  }

  onAddDocumentReference() {
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

  onAddArgumentReference() {
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

  onAddValue() {
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
      (isNull(attribute1) && isNull(attribute2)) ||
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
      (isNull(argument1) && isNull(argument2)) ||
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
          kind: 'document';
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
          kind: 'document';
          document: { id: string };
          attribute: { id: string };
        }
    >
  ) {
    return (
      (isNull(bump1) && isNull(bump2)) ||
      (bump1?.kind === 'argument' &&
        bump2?.kind === 'argument' &&
        bump1.argument.id === bump2.argument.id) ||
      (bump1?.kind === 'document' &&
        bump2?.kind === 'document' &&
        bump1.document.id === bump2.document.id &&
        bump1.attribute.id === bump2.attribute.id)
    );
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

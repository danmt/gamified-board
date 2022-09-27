import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
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
  ReactiveFormsModule,
} from '@angular/forms';
import { PushModule } from '@ngrx/component';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  shareReplay,
  startWith,
} from 'rxjs';
import { ModalComponent } from '../../shared/components';
import {
  FocusedDirective,
  HoverDirective,
  KeyListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { isNotNull, isNull, Option } from '../../shared/utils';
import { SeedType } from '../utils';

/* 

seeds can be:

- value
- collection attribute
- argument

Ideally we'd have a single autocomplete that let's you search for any kind 
of seed. 

autocomplete uses a syntax to in order to work:

- value: <type>:<value>
- collection attribute: <collection-name>:<attribute-name>
- argument: <argument-name>

The names are used for UX purposes, in reality, we store the IDs.

We are looking forward to create an autocomplete feature, the options will be
seed types with their corresponding information.

- [ATTRIBUTE] Collection A, Attribute B
- [ATTRIBUTE] Collection C, Attribute D
- [ARGUMENT] Argument A
- [ARGUMENT] Argument B
- [VALUE] Type u8: A
- [VALUE] Type u32: B

each seed kind has a format to find it by index, but each seed option is searchable
by the name of the stuff available. If you'd type "A" in the prior example your list 
would contain:

- [ATTRIBUTE] Collection A, Attribute B
- [ARGUMENT] Argument A
- [VALUE] Type u8: A

While this component doesn't know how these options are "created", they have to
be fetched somewhere in the parent. 

- Arguments come from the instruction's fields, this requires fetching the 
application graph and access the nodes of kind 'field' that have an edge with 
source on the instruction.
- Collection attributes need a compound query, since the list of collections
comes from the instruction but they reference collections, the referenced
collections may have one or more edges which target is a field, we'd aggregate
all the collections + fields based on the instruction's context's collections.
- Values depend on a "type", each type is an option. When the user types in
the value, the autocomplete shows Type T: {search} for the value options.

*/

export interface EditCollectionSeedsData {
  seeds: SeedType[];
  options$: Observable<SeedType[]>;
}

export type EditCollectionSeedsSubmit = {
  seeds: SeedType[];
};

export const openEditCollectionSeedModal = (
  dialog: Dialog,
  data: EditCollectionSeedsData
) =>
  dialog.open<
    EditCollectionSeedsSubmit,
    EditCollectionSeedsData,
    EditCollectionSeedsModalComponent
  >(EditCollectionSeedsModalComponent, {
    data,
  });

@Directive({
  selector: '[pgUpdateCollectionSeedsModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateCollectionSeedsModalDirective {
  private readonly _dialog = inject(Dialog);
  private readonly _options = new BehaviorSubject<SeedType[]>([]);
  dialogRef: Option<
    DialogRef<EditCollectionSeedsSubmit, EditCollectionSeedsModalComponent>
  > = null;

  @Input() pgCollectionSeeds: SeedType[] = [];
  @Input() set pgOptions(value: SeedType[]) {
    this._options.next(value);
  }

  @Output() pgUpdateCollectionSeeds =
    new EventEmitter<EditCollectionSeedsSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgCollectionSeeds)) {
      throw new Error('pgCollectionSeeds is missing');
    }

    this.pgOpenModal.emit();

    this.dialogRef = openEditCollectionSeedModal(this._dialog, {
      seeds: this.pgCollectionSeeds,
      options$: this._options.asObservable(),
    });

    this.dialogRef.closed.subscribe((collectionData) => {
      this.pgCloseModal.emit();

      if (collectionData !== undefined) {
        this.pgUpdateCollectionSeeds.emit(collectionData);
      }
    });

    return this.dialogRef;
  }
}

@Directive({
  selector: '[pgAutocomplete]',
  standalone: true,
  exportAs: 'autocomplete',
})
export class AutocompleteDirective {
  private readonly _isOpen = new BehaviorSubject(false);

  readonly isOpen$ = this._isOpen.asObservable();

  open() {
    this._isOpen.next(true);
  }

  close() {
    this._isOpen.next(false);
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
          Collection Seeds
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div
          cdkDropList
          (cdkDropListDropped)="onDrop($event)"
          [cdkDropListData]="seedsControl.controls"
        >
          <div
            *ngFor="let seedForm of seedsControl.controls; let i = index"
            cdkDrag
            class="flex justify-between gap-4"
          >
            <div class="example-handle" cdkDragHandle>
              <svg width="24px" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"
                ></path>
                <path d="M0 0h24v24H0z" fill="none"></path>
              </svg>
            </div>

            <div
              class="flex justify-between gap-4"
              *ngIf="seedForm.value === null"
            >
              <input
                type="text"
                cdkOverlayOrigin
                #trigger="cdkOverlayOrigin"
                class="text-black flex-1"
                [formControl]="searchControl"
                pgAutocomplete
                #autocomplete="autocomplete"
                (click)="autocomplete.open()"
                (focus)="autocomplete.open()"
              />

              <ng-template
                cdkConnectedOverlay
                [cdkConnectedOverlayOrigin]="trigger"
                [cdkConnectedOverlayOpen]="
                  (autocomplete.isOpen$ | ngrxPush) ?? false
                "
                [cdkConnectedOverlayPositions]="[
                  {
                    originX: 'center',
                    originY: 'bottom',
                    overlayX: 'center',
                    overlayY: 'top',
                    offsetY: 8
                  }
                ]"
                (overlayOutsideClick)="autocomplete.close()"
                pgHover
                #options="hovered"
              >
                <ul class="bg-white p-2">
                  <li *ngFor="let option of filteredOptions$ | ngrxPush">
                    <button
                      *ngIf="
                        option.kind === 'value' && searchControl.value !== ''
                      "
                      (click)="
                        seedForm.setValue({
                          kind: 'value',
                          data: {
                            value: searchControl.value,
                            type: option.data.type
                          }
                        });
                        autocomplete.close()
                      "
                      type="button"
                    >
                      [VALUE] {{ option.data.type }}: {{ searchControl.value }}
                    </button>

                    <button
                      *ngIf="option.kind === 'attribute'"
                      (click)="seedForm.setValue(option); autocomplete.close()"
                      type="button"
                    >
                      [ATTRIBUTE] {{ option.data.collection.name }}:
                      {{ option.data.name }}
                    </button>

                    <button
                      *ngIf="option.kind === 'argument'"
                      (click)="seedForm.setValue(option); autocomplete.close()"
                      type="button"
                    >
                      [ARGUMENT] {{ option.data.name }}
                    </button>
                  </li>
                </ul>
              </ng-template>

              <button (click)="seedsControl.removeAt(i)" type="button">
                x
              </button>
            </div>

            <div *ngIf="seedForm.value !== null">
              <span
                *ngIf="seedForm.value.kind === 'value'"
                class="bg-blue-500 px-4 py-2"
              >
                [VALUE] {{ seedForm.value.data.type }}:
                {{ searchControl.value }}
              </span>

              <span
                *ngIf="seedForm.value.kind === 'attribute'"
                class="bg-blue-500 px-4 py-2"
              >
                [ATTRIBUTE] {{ seedForm.value.data.collection.name }}:
                {{ seedForm.value.data.name }}
              </span>

              <span
                *ngIf="seedForm.value.kind === 'argument'"
                class="bg-blue-500 px-4 py-2"
              >
                [ARGUMENT] {{ seedForm.value.data.name }}
              </span>

              <button (click)="seedForm.setValue(null)" type="button">x</button>
            </div>
          </div>

          <button (click)="onAddSeedControl()" type="button">+</button>
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
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
    PushModule,
    OverlayModule,
    DragDropModule,
    StopKeydownPropagationDirective,
    KeyListenerDirective,
    ModalComponent,
    FocusedDirective,
    HoverDirective,
    AutocompleteDirective,
  ],
})
export class EditCollectionSeedsModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<EditCollectionSeedsSubmit, EditCollectionSeedsModalComponent>
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditCollectionSeedsData>(DIALOG_DATA);

  readonly seeds = this._data.seeds;
  readonly options$ = this._data.options$;
  readonly searchControl = this._formBuilder.control<string>('', {
    nonNullable: true,
  });
  readonly form = this._formBuilder.group({
    seeds: this._formBuilder.array(
      this.seeds?.length > 0
        ? this.seeds.map((seed) =>
            this._formBuilder.control<Option<SeedType>>(seed)
          )
        : [this._formBuilder.control<Option<SeedType>>(null)]
    ),
  });
  readonly searchTerm$ = this.searchControl.valueChanges.pipe(
    startWith(''),
    map((value) => value.toLowerCase()),
    shareReplay(1)
  );
  readonly filteredOptions$ = combineLatest([
    this.options$,
    this.searchTerm$,
  ]).pipe(
    map(([options, search]) =>
      options
        .filter((option) => {
          switch (option.kind) {
            case 'argument': {
              return option.data.name.includes(search);
            }

            case 'attribute': {
              return (
                option.data.name.includes(search) ||
                option.data.collection.name.includes(search)
              );
            }

            default: {
              return true;
            }
          }
        })
        .slice(0, 10)
    )
  );

  get seedsControl() {
    return this.form.get('seeds') as FormArray<FormControl<Option<SeedType>>>;
  }

  onSubmit() {
    if (this.form.valid) {
      const seeds = this.seedsControl.value ?? [];

      this._dialogRef.close({
        seeds: seeds.filter(isNotNull),
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  onAddSeedControl() {
    this.seedsControl.push(this._formBuilder.control(null));
  }

  onDrop(event: CdkDragDrop<FormControl<Option<SeedType>>[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}

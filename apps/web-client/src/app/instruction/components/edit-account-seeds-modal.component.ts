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
  HoveredDirective,
  KeyListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { isNotNull, isNull, Option } from '../../shared/utils';
import { SeedType } from '../utils';

/* 

seeds can be:

- value
- account attribute
- argument

Ideally we'd have a single autocomplete that let's you search for any kind 
of seed. 

autocomplete uses a syntax to in order to work:

- value: <type>:<value>
- account attribute: <account-name>:<attribute-name>
- argument: <argument-name>

The names are used for UX purposes, in reality, we store the IDs.

We are looking forward to create an autocomplete feature, the options will be
seed types with their corresponding information.

- [ATTRIBUTE] Account A, Attribute B
- [ATTRIBUTE] Account C, Attribute D
- [ARGUMENT] Argument A
- [ARGUMENT] Argument B
- [VALUE] Type u8: A
- [VALUE] Type u32: B

each seed kind has a format to find it by index, but each seed option is searchable
by the name of the stuff available. If you'd type "A" in the prior example your list 
would contain:

- [ATTRIBUTE] Account A, Attribute B
- [ARGUMENT] Argument A
- [VALUE] Type u8: A

While this component doesn't know how these options are "created", they have to
be fetched somewhere in the parent. 

- Arguments come from the instruction's fields, this requires fetching the 
program graph and access the nodes of kind 'field' that have an edge with 
source on the instruction.
- Account attributes need a compound query, since the list of accounts
comes from the instruction but they reference accounts, the referenced
accounts may have one or more edges which target is a field, we'd aggregate
all the accounts + fields based on the instruction's context's accounts.
- Values depend on a "type", each type is an option. When the user types in
the value, the autocomplete shows Type T: {search} for the value options.

*/

export interface EditAccountSeedsData {
  seeds: SeedType[];
  options$: Observable<SeedType[]>;
}

export type EditAccountSeedsSubmit = {
  seeds: SeedType[];
};

export const openEditAccountSeedModal = (
  dialog: Dialog,
  data: EditAccountSeedsData
) =>
  dialog.open<
    EditAccountSeedsSubmit,
    EditAccountSeedsData,
    EditAccountSeedsModalComponent
  >(EditAccountSeedsModalComponent, {
    data,
  });

@Directive({
  selector: '[pgUpdateAccountSeedsModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateAccountSeedsModalDirective {
  private readonly _dialog = inject(Dialog);
  private readonly _options = new BehaviorSubject<SeedType[]>([]);
  dialogRef: Option<
    DialogRef<EditAccountSeedsSubmit, EditAccountSeedsModalComponent>
  > = null;

  @Input() pgAccountSeeds: SeedType[] = [];
  @Input() set pgOptions(value: SeedType[]) {
    this._options.next(value);
  }

  @Output() pgUpdateAccountSeeds = new EventEmitter<EditAccountSeedsSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgAccountSeeds)) {
      throw new Error('pgAccountSeeds is missing');
    }

    this.pgOpenModal.emit();

    this.dialogRef = openEditAccountSeedModal(this._dialog, {
      seeds: this.pgAccountSeeds,
      options$: this._options.asObservable(),
    });

    this.dialogRef.closed.subscribe((accountData) => {
      this.pgCloseModal.emit();

      if (accountData !== undefined) {
        this.pgUpdateAccountSeeds.emit(accountData);
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
  selector: 'pg-edit-account-modal',
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
          Account Seeds
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
                pgHovered
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
                      [ATTRIBUTE] {{ option.data.account.name }}:
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
                [ATTRIBUTE] {{ seedForm.value.data.account.name }}:
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
    HoveredDirective,
    AutocompleteDirective,
  ],
})
export class EditAccountSeedsModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditAccountSeedsSubmit, EditAccountSeedsModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditAccountSeedsData>(DIALOG_DATA);

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
                option.data.account.name.includes(search)
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

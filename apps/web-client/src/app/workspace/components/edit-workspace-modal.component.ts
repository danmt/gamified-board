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

export type Workspace = Entity<{
  data: { name: string };
}>;

export interface EditWorkspaceData {
  workspace: Option<Workspace>;
}

export type CreateWorkspaceSubmit = {
  name: string;
};

export type UpdateWorkspaceSubmit = {
  name: string;
};

export const openEditWorkspaceModal = (
  dialog: Dialog,
  data: EditWorkspaceData
) =>
  dialog.open<
    CreateWorkspaceSubmit | UpdateWorkspaceSubmit,
    EditWorkspaceData,
    EditWorkspaceModalComponent
  >(EditWorkspaceModalComponent, {
    data,
  });

@Directive({
  selector: '[pgCreateWorkspaceModal]',
  standalone: true,
  exportAs: 'modal',
})
export class CreateWorkspaceModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<
    DialogRef<CreateWorkspaceSubmit, EditWorkspaceModalComponent>
  > = null;

  @Output() pgCreateWorkspace = new EventEmitter<CreateWorkspaceSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();

    this.dialogRef = openEditWorkspaceModal(this._dialog, {
      workspace: null,
    });

    this.dialogRef.closed.subscribe((workspaceData) => {
      this.pgCloseModal.emit();

      if (workspaceData !== undefined) {
        this.pgCreateWorkspace.emit(workspaceData);
      }
    });

    return this.dialogRef;
  }
}

@Directive({
  selector: '[pgUpdateWorkspaceModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UpdateWorkspaceModalDirective {
  private readonly _dialog = inject(Dialog);

  dialogRef: Option<
    DialogRef<UpdateWorkspaceSubmit, EditWorkspaceModalComponent>
  > = null;

  @Input() pgWorkspace: Option<Workspace> = null;
  @Output() pgUpdateWorkspace = new EventEmitter<UpdateWorkspaceSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgWorkspace)) {
      throw new Error('pgWorkspace is missing');
    }

    this.pgOpenModal.emit();

    this.dialogRef = openEditWorkspaceModal(this._dialog, {
      workspace: this.pgWorkspace,
    });

    this.dialogRef.closed.subscribe((workspaceData) => {
      this.pgCloseModal.emit();

      if (workspaceData !== undefined) {
        this.pgUpdateWorkspace.emit(workspaceData);
      }
    });

    return this.dialogRef;
  }
}

@Component({
  selector: 'pg-edit-workspace-modal',
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
          {{ workspace === null ? 'Create' : 'Update' }} workspace
        </h1>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="overflow-y-auto max-h-[515px]"
      >
        <div class="mb-4">
          <label class="block bp-font-game text-xl" for="workspace-name-input">
            Workspace name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="workspace-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            {{ workspace === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </pg-modal>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StopKeydownPropagationDirective,
    KeyListenerDirective,
    ModalComponent,
  ],
})
export class EditWorkspaceModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        CreateWorkspaceSubmit | UpdateWorkspaceSubmit,
        EditWorkspaceModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditWorkspaceData>(DIALOG_DATA);

  readonly workspace = this._data.workspace;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.workspace?.data.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const name = this.nameControl.value;

      this._dialogRef.close({
        name,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

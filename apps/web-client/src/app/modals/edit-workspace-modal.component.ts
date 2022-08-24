import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
} from '@angular/core';

import { Directive } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Option } from '../utils';

export interface EditWorkspaceData {
  id: string;
  name: string;
}

@Directive({ selector: '[pgEditWorkspaceModal]', standalone: true })
export class EditWorkspaceModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() workspace: Option<EditWorkspaceData> = null;
  @Output() createWorkspace = new EventEmitter<EditWorkspaceData>();
  @Output() updateWorkspace = new EventEmitter<EditWorkspaceData>();
  @HostListener('click', []) onClick() {
    this._dialog
      .open<
        EditWorkspaceData,
        Option<EditWorkspaceData>,
        EditWorkspaceModalComponent
      >(EditWorkspaceModalComponent, {
        data: this.workspace,
      })
      .closed.subscribe((workspaceData) => {
        if (workspaceData !== undefined) {
          if (this.workspace === null) {
            this.createWorkspace.emit(workspaceData);
          } else {
            this.updateWorkspace.emit(workspaceData);
          }
        }
      });
  }
}

@Component({
  selector: 'pg-edit-workspace-modal',
  template: `
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ workspace === null ? 'Create' : 'Update' }} workspace
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="block" for="workspace-id-input">Workspace ID</label>
          <input
            class="block border-b-2 border-black"
            id="workspace-id-input"
            type="text"
            formControlName="id"
            [readonly]="workspace !== null"
          />
          <p *ngIf="workspace === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="workspace === null"
            type="button"
            (click)="idControl.setValue(onGenerateId())"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="workspace-name-input">Workspace name</label>
          <input
            class="block border-b-2 border-black"
            id="workspace-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ workspace === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditWorkspaceModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditWorkspaceData, EditWorkspaceModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);

  readonly workspace = inject<Option<EditWorkspaceData>>(DIALOG_DATA);
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.workspace?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.workspace?.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  get idControl() {
    return this.form.get('id') as FormControl<string>;
  }

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;

      this._dialogRef.close({
        id,
        name,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    return uuid();
  }
}

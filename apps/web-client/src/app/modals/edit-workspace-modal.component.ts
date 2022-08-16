import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
} from '@angular/core';

import { Directive } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Option } from '../utils';

export interface EditWorkspaceData {
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
  imports: [ReactiveFormsModule],
})
export class EditWorkspaceModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<EditWorkspaceData, EditWorkspaceModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);

  readonly workspace = inject<Option<EditWorkspaceData>>(DIALOG_DATA);
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(this.workspace?.name ?? '', [
      Validators.required,
    ]),
  });

  onSubmit() {
    if (this.form.valid) {
      const { name } = this.form.value;

      if (name === null || name === undefined) {
        throw new Error('Name is not properly defined.');
      }

      this._dialogRef.close({
        name,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

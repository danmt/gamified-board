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
import { isNull, Option } from '../../shared/utils';

interface ProgramCheckpoint {
  id: string;
  name: string;
  graph: {
    id: string;
    data: {
      name: string;
    };
  };
}

interface InstallableProgram {
  id: string;
  data: {
    name: string;
  };
  checkpoints: ProgramCheckpoint[];
}

export interface InstallProgramData {
  installableProgram: InstallableProgram;
}

export type InstallProgramSubmit = {
  checkpoint: string;
};

export const openInstallProgramModal = (
  dialog: Dialog,
  data: InstallProgramData
) =>
  dialog.open<
    InstallProgramSubmit,
    InstallProgramData,
    InstallProgramModalComponent
  >(InstallProgramModalComponent, {
    data,
  });

@Directive({
  selector: '[pgInstallProgramModal]',
  standalone: true,
  exportAs: 'modal',
})
export class InstallProgramModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstallableProgram: Option<InstallableProgram> = null;

  @Output() pgInstallProgram = new EventEmitter<InstallProgramSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgInstallableProgram)) {
      throw new Error('pgInstallableProgram is missing');
    }

    this.pgOpenModal.emit();

    openInstallProgramModal(this._dialog, {
      installableProgram: this.pgInstallableProgram,
    }).closed.subscribe((installableProgramData) => {
      this.pgCloseModal.emit();

      if (installableProgramData !== undefined) {
        this.pgInstallProgram.emit(installableProgramData);
      }
    });
  }
}

@Component({
  selector: 'pg-install-program-modal',
  template: `
    <pg-modal
      class="px-6 pt-8 pb-4 text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyListener="Escape"
      (pgKeyDown)="onClose()"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game uppercase">
          Install {{ installableProgram.data.name }}
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <select
          class="block bg-transparent"
          formControlName="checkpoint"
          id="install-program-checkpoint-input"
        >
          <option class="text-black" value="" disabled>
            Select checkpoint
          </option>
          <option
            class="text-black"
            [ngValue]="checkpoint.id"
            *ngFor="let checkpoint of installableProgram.checkpoints"
          >
            {{ checkpoint.name }}
          </option>
        </select>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-button-futuristic text-black bp-font-game uppercase"
          >
            Install
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
export class InstallProgramModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<InstallProgramSubmit, InstallProgramModalComponent>>(
      DialogRef
    );
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<InstallProgramData>(DIALOG_DATA);

  readonly installableProgram = this._data.installableProgram;
  readonly form = this._formBuilder.group({
    checkpoint: this._formBuilder.control<string>('', {
      validators: [Validators.required],
    }),
  });

  get checkpointControl() {
    return this.form.get('checkpoint') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const checkpoint = this.checkpointControl.value;

      this._dialogRef.close({
        checkpoint,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

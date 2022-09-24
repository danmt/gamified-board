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

interface ApplicationCheckpoint {
  id: string;
  name: string;
  graph: {
    id: string;
    data: {
      name: string;
    };
  };
}

interface InstallableApplication {
  id: string;
  data: {
    name: string;
  };
  checkpoints: ApplicationCheckpoint[];
}

export interface InstallApplicationData {
  installableApplication: InstallableApplication;
}

export type InstallApplicationSubmit = {
  checkpoint: string;
};

export const openInstallApplicationModal = (
  dialog: Dialog,
  data: InstallApplicationData
) =>
  dialog.open<
    InstallApplicationSubmit,
    InstallApplicationData,
    InstallApplicationModalComponent
  >(InstallApplicationModalComponent, {
    data,
  });

@Directive({
  selector: '[pgInstallApplicationModal]',
  standalone: true,
  exportAs: 'modal',
})
export class InstallApplicationModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstallableApplication: Option<InstallableApplication> = null;

  @Output() pgInstallApplication = new EventEmitter<InstallApplicationSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgInstallableApplication)) {
      throw new Error('pgInstallableApplication is missing');
    }

    this.pgOpenModal.emit();

    openInstallApplicationModal(this._dialog, {
      installableApplication: this.pgInstallableApplication,
    }).closed.subscribe((installableApplicationData) => {
      this.pgCloseModal.emit();

      if (installableApplicationData !== undefined) {
        this.pgInstallApplication.emit(installableApplicationData);
      }
    });
  }
}

@Component({
  selector: 'pg-install-application-modal',
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
          Install {{ installableApplication.data.name }}
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <select
          class="block bg-transparent"
          formControlName="checkpoint"
          id="install-application-checkpoint-input"
        >
          <option class="text-black" value="" disabled>
            Select checkpoint
          </option>
          <option
            class="text-black"
            [ngValue]="checkpoint.id"
            *ngFor="let checkpoint of installableApplication.checkpoints"
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
export class InstallApplicationModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<InstallApplicationSubmit, InstallApplicationModalComponent>
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<InstallApplicationData>(DIALOG_DATA);

  readonly installableApplication = this._data.installableApplication;
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

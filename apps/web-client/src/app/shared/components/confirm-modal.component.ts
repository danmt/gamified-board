import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  Component,
  Directive,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
} from '@angular/core';
import { isNull, Option } from '../../shared/utils';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../directives';
import { ModalComponent } from './modal.component';

export interface ConfirmData {
  message: string;
}

export type ConfirmPayload = boolean;

export const openConfirmModal = (dialog: Dialog, data: ConfirmData) =>
  dialog.open<ConfirmPayload, ConfirmData, ConfirmModalComponent>(
    ConfirmModalComponent,
    {
      data,
    }
  );

@Directive({
  selector: '[pgConfirmModal]',
  standalone: true,
  exportAs: 'modal',
})
export class ConfirmModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgMessage: Option<string> = null;

  @Output() pgConfirm = new EventEmitter<ConfirmPayload>();
  @Output() pgCancel = new EventEmitter<ConfirmPayload>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.open();
  }

  open() {
    if (isNull(this.pgMessage)) {
      throw new Error('Message is missing.');
    }

    this.pgOpenModal.emit();

    openConfirmModal(this._dialog, {
      message: this.pgMessage,
    }).closed.subscribe((confirm) => {
      this.pgCloseModal.emit();

      if (confirm !== undefined) {
        if (confirm) {
          this.pgConfirm.emit();
        } else {
          this.pgCancel.emit();
        }
      }
    });
  }
}

@Component({
  selector: 'pg-confirm-modal',
  template: `
    <pg-modal
      class="text-white "
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <h1 class=" bp-font-game-title text-3xl">
        {{ message }}
      </h1>

      <div class="flex justify-center gap-2 mt-10 mb-10">
        <button
          class="bp-button-futuristic text-black bp-font-game uppercase"
          (click)="onConfirm()"
        >
          Confirm
        </button>
        <!--<button
          class="bp-button-error-futuristic text-black bp-font-game uppercase"
          (click)="onCancel()"
        >
          Cancel
        </button>-->
      </div>
    </pg-modal>
  `,
  standalone: true,
  imports: [
    StopKeydownPropagationDirective,
    KeyboardListenerDirective,
    ModalComponent,
  ],
})
export class ConfirmModalComponent {
  _dialogRef =
    inject<DialogRef<ConfirmPayload, ConfirmModalComponent>>(DialogRef);
  private readonly _data = inject<ConfirmData>(DIALOG_DATA);

  readonly message = this._data.message;

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this._dialogRef.close();
    }
  }

  onConfirm() {
    this._dialogRef.close(true);
  }

  onCancel() {
    this._dialogRef.close(false);
  }

  onClose() {
    this._dialogRef.close();
  }
}

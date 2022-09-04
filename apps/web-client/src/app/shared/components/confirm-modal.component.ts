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

@Directive({ selector: '[pgConfirmModal]', standalone: true })
export class ConfirmModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgMessage: Option<string> = null;

  @Output() pgConfirm = new EventEmitter<ConfirmPayload>();
  @Output() pgCancel = new EventEmitter<ConfirmPayload>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgMessage)) {
      throw new Error('Message is missing.');
    }

    this.pgOpenModal.emit();

    openConfirmModal(this._dialog, {
      message: this.pgMessage,
    }).closed.subscribe((messageData) => {
      this.pgCloseModal.emit();

      if (messageData !== undefined) {
        if (isNull(messageData)) {
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
    <div
      class="px-4 pt-10 pb-4 bg-white shadow-xl relative"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
    >
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="mb-8">
        {{ message }}
      </h1>

      <div class="flex justify-center gap-2">
        <button class="border-2 border-blue-300 p-2" (click)="onConfirm()">
          Confirm
        </button>
        <button class="border-2 border-red-300 p-2" (click)="onCancel()">
          Cancel
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [StopKeydownPropagationDirective, KeyboardListenerDirective],
})
export class ConfirmModalComponent {
  private readonly _dialogRef =
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

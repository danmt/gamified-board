import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { GlobalPositionStrategy } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  EventEmitter,
  HostListener,
  inject,
  OnInit,
  Output,
} from '@angular/core';
import {
  getDownloadURL,
  ref,
  Storage,
  TaskState,
  uploadBytesResumable,
  UploadTask,
} from '@angular/fire/storage';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject, concatMap, EMPTY } from 'rxjs';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../directives';
import { generateId, Option } from '../utils';
import { ModalComponent } from './modal.component';

export interface UploadFilePayload {
  file: string;
  fileSource: File;
}

export type UploadFileData = unknown;

export const openUploadFileModal = (dialog: Dialog) =>
  dialog.open<UploadFilePayload, UploadFileData, UploadFileModalComponent>(
    UploadFileModalComponent
  );

@Directive({
  selector: '[pgUploadFileModal]',
  standalone: true,
  exportAs: 'modal',
})
export class UploadFileModalDirective {
  private readonly _dialog = inject(Dialog);
  private readonly _storage = inject(Storage);

  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();
  @Output() pgSubmit = new EventEmitter<{ fileId: string; fileUrl: string }>();

  @HostListener('click') onClick() {
    this.open();
  }

  open() {
    this.pgOpenModal.emit();
    const fileId = generateId();
    const fileName = `${fileId}.png`;

    openUploadFileModal(this._dialog)
      .closed.pipe(
        concatMap((uploadFileData) => {
          if (uploadFileData === undefined) {
            return EMPTY;
          }

          return openUploadFileProgressModal(
            this._dialog,
            this._storage,
            fileName,
            uploadFileData.fileSource
          ).closed;
        })
      )
      .subscribe((data) => {
        this.pgCloseModal.emit();

        if (data) {
          this.pgSubmit.emit({
            fileId,
            fileUrl: data.fileUrl,
          });
        }
      });
  }
}

@Component({
  selector: 'pg-upload-file-modal',
  template: `
    <pg-modal
      class="text-white"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <h1 class="mb-6 bp-font-game-title text-3xl">Upload Thumbnail</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <input
          type="file"
          (change)="onFileChange($event)"
          formControlName="file"
          class="mb-5"
        />

        <img
          [src]="imageSrc"
          *ngIf="imageSrc"
          style="height: 300px; width:500px"
        />

        <div class="flex justify-center gap-2 mt-6 mb-12">
          <button
            class="bp-button-futuristic text-black bp-font-game uppercase"
            type="submit"
          >
            Confirm
          </button>
          <!--<button
            class="bp-button-error-futuristic text-black bp-font-game uppercase"
            (click)="onClose()"
          >
            Cancel
          </button>-->
        </div>
      </form>
    </pg-modal>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    KeyboardListenerDirective,
    StopKeydownPropagationDirective,
    ReactiveFormsModule,
  ],
})
export class UploadFileModalComponent {
  private readonly _dialogRef =
    inject<DialogRef<UploadFilePayload, UploadFileModalComponent>>(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);

  imageSrc = '';

  readonly form = this._formBuilder.group({
    file: this._formBuilder.control<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    fileSource: this._formBuilder.control<Option<File>>(null, {
      validators: [Validators.required],
    }),
  });

  get fileControl() {
    return this.form.get('file') as FormControl<string>;
  }

  get fileSourceControl() {
    return this.form.get('fileSource') as FormControl<File>;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this._dialogRef.close();
    }
  }

  onFileChange(event: Event) {
    const reader = new FileReader();
    const inputElement = event.target as HTMLInputElement;

    if (inputElement.files && inputElement.files.length) {
      const file = inputElement.files.item(0);

      if (file) {
        reader.readAsDataURL(file);

        reader.onload = () => {
          this.imageSrc = reader.result as string;

          this.form.patchValue({
            fileSource: file,
          });
        };
      }
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const file = this.fileControl.value;
      const fileSource = this.fileSourceControl.value;

      this._dialogRef.close({ file, fileSource });
    }
  }

  onClose() {
    this._dialogRef.close();
  }
}

export interface UploadFileProgressData {
  uploadTask: UploadTask;
}

export interface UploadFileProgressPayload {
  fileUrl: string;
}

export const openUploadFileProgressModal = (
  dialog: Dialog,
  storage: Storage,
  fileName: string,
  data: File
) =>
  dialog.open<
    UploadFileProgressPayload,
    UploadFileProgressData,
    UploadFileProgressModalComponent
  >(UploadFileProgressModalComponent, {
    data: {
      uploadTask: uploadBytesResumable(ref(storage, fileName), data, {
        contentType: 'image/png',
      }),
    },
    positionStrategy: new GlobalPositionStrategy()
      .centerHorizontally()
      .bottom('32px'),
  });

@Component({
  selector: 'pg-upload-file-progress-modal',
  template: `
    <div [ngSwitch]="status$ | ngrxPush" class="p-4 bg-white">
      <div *ngSwitchCase="'running'">
        file progress: {{ progress$ | ngrxPush }}%

        <button (click)="onClose()">x</button>
      </div>
      <div *ngSwitchCase="'success'">file upload successfully</div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    KeyboardListenerDirective,
    StopKeydownPropagationDirective,
  ],
})
export class UploadFileProgressModalComponent implements OnInit {
  private readonly _dialogRef =
    inject<
      DialogRef<UploadFileProgressPayload, UploadFileProgressModalComponent>
    >(DialogRef);
  private readonly _data = inject<UploadFileProgressData>(DIALOG_DATA);
  private readonly _progress = new BehaviorSubject(0);
  private readonly _status = new BehaviorSubject<TaskState>('running');

  readonly progress$ = this._progress.asObservable();
  readonly status$ = this._status.asObservable();

  ngOnInit() {
    this._data.uploadTask.on(
      'state_changed',
      (snapshot) => {
        this._progress.next(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        this._status.next(snapshot.state);
      },
      (error) => {
        this._status.next('error');
        console.error(error);
      },
      () => {
        this._status.next(this._data.uploadTask.snapshot.state);
        this._progress.next(
          (this._data.uploadTask.snapshot.bytesTransferred /
            this._data.uploadTask.snapshot.totalBytes) *
            100
        );
        getDownloadURL(this._data.uploadTask.snapshot.ref).then(
          (downloadURL) => {
            this._dialogRef.close({ fileUrl: downloadURL });
          }
        );
      }
    );
  }

  onClose() {
    this._dialogRef.close();
  }
}

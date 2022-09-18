import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { Storage } from '@angular/fire/storage';
import { LetModule, PushModule } from '@ngrx/component';
import { ComponentStore } from '@ngrx/component-store';
import { concatMap, EMPTY, tap } from 'rxjs';
import { CreateApplicationModalDirective } from '../../application/components';
import { Graph } from '../../drawer/utils';
import {
  ConfirmModalDirective,
  openConfirmModal,
  openUploadFileModal,
  openUploadFileProgressModal,
  SquareButtonComponent,
  UploadFileModalDirective,
} from '../../shared/components';
import { SecondaryDockComponent } from '../../shared/components/secondary-dock.component';
import {
  DefaultImageDirective,
  KeyboardListenerDirective,
} from '../../shared/directives';
import { SlotHotkeyPipe } from '../../shared/pipes';
import { generateId, isNotNull, Option } from '../../shared/utils';
import {
  openEditWorkspaceModal,
  UpdateWorkspaceModalDirective,
  UpdateWorkspaceSubmit,
} from '../components';
import { ActiveApplicationComponent } from './active-application.component';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

interface ViewModel {
  workspace: Option<Graph>;
  isCreating: boolean;
  isUpdating: boolean;
  isUpdatingThumbnail: boolean;
  isDeleting: boolean;
  hotkeys: [HotKey, HotKey, HotKey, HotKey];
}

const initialState: ViewModel = {
  workspace: null,
  isCreating: false,
  isUpdating: false,
  isUpdatingThumbnail: false,
  isDeleting: false,
  hotkeys: [
    {
      slot: 0,
      code: 'KeyQ',
      key: 'q',
    },
    {
      slot: 1,
      code: 'KeyW',
      key: 'w',
    },
    {
      slot: 2,
      code: 'KeyE',
      key: 'e',
    },
    {
      slot: 3,
      code: 'KeyR',
      key: 'r',
    },
  ],
};

@Component({
  selector: 'pg-workspace-dock',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <pg-secondary-dock
        *ngIf="workspace$ | ngrxPush as workspace"
        class="text-white block bp-font-game"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, workspace, $event)"
      >
        <div class="flex gap-4 justify-center items-start">
          <img
            [src]="workspace.thumbnailUrl"
            pgDefaultImageUrl="assets/generic/workspace.png"
            class="w-[100px] h-[106px] overflow-hidden rounded-xl"
          />

          <div>
            <h2 class="text-xl">Name</h2>
            <p class="text-base">{{ workspace?.name }}</p>
          </div>

          <div class="ml-10">
            <h2 class="text-xl">Actions</h2>

            <div class="flex gap-4 justify-center items-start">
              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <ng-container *ngrxLet="hotkeys$; let hotkeys">
                  <span
                    *ngIf="0 | pgSlotHotkey: hotkeys as hotkey"
                    class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                    style="font-size: 0.5rem; line-height: 0.5rem"
                  >
                    {{ hotkey }}
                  </span>
                </ng-container>

                <pg-square-button
                  pgThumbnailUrl="assets/generic/workspace.png"
                  [pgIsActive]="false"
                  pgUpdateWorkspaceModal
                  [pgWorkspace]="workspace"
                  (pgOpenModal)="setIsUpdating(true)"
                  (pgCloseModal)="setIsUpdating(false)"
                  (pgUpdateWorkspace)="onUpdateWorkspace(workspace.id, $event)"
                ></pg-square-button>
              </div>

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <ng-container *ngrxLet="hotkeys$; let hotkeys">
                  <span
                    *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
                    class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                    style="font-size: 0.5rem; line-height: 0.5rem"
                  >
                    {{ hotkey }}
                  </span>
                </ng-container>

                <pg-square-button
                  pgThumbnailUrl="assets/generic/workspace.png"
                  [pgIsActive]="(isUpdatingThumbnail$ | ngrxPush) ?? false"
                  pgUploadFileModal
                  (pgSubmit)="
                    onUploadThumbnail(
                      workspace.id,
                      $event.fileId,
                      $event.fileUrl
                    )
                  "
                  (pgOpenModal)="setIsUpdatingThumbnail(true)"
                  (pgCloseModal)="setIsUpdatingThumbnail(false)"
                ></pg-square-button>
              </div>

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <ng-container *ngrxLet="hotkeys$; let hotkeys">
                  <span
                    *ngIf="2 | pgSlotHotkey: hotkeys as hotkey"
                    class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                    style="font-size: 0.5rem; line-height: 0.5rem"
                  >
                    {{ hotkey }}
                  </span>
                </ng-container>

                <pg-square-button
                  [pgIsActive]="(isDeleting$ | ngrxPush) ?? false"
                  pgThumbnailUrl="assets/generic/workspace.png"
                  (pgConfirm)="onDeleteWorkspace(workspace.id)"
                  pgConfirmModal
                  pgMessage="Are you sure? This action cannot be reverted."
                  (pgOpenModal)="setIsDeleting(true)"
                  (pgCloseModal)="setIsDeleting(false)"
                ></pg-square-button>
              </div>

              <div
                class="bg-gray-800 relative"
                style="width: 2.89rem; height: 2.89rem"
              >
                <ng-container *ngrxLet="hotkeys$; let hotkeys">
                  <span
                    *ngIf="3 | pgSlotHotkey: hotkeys as hotkey"
                    class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                    style="font-size: 0.5rem; line-height: 0.5rem"
                  >
                    {{ hotkey }}
                  </span>
                </ng-container>

                <pg-square-button
                  pgThumbnailUrl="assets/generic/application.png"
                  (click)="onActivateApplication()"
                ></pg-square-button>
              </div>
            </div>
          </div>
        </div>
      </pg-secondary-dock>
    </ng-container>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
    UploadFileModalDirective,
    UpdateWorkspaceModalDirective,
    CreateApplicationModalDirective,
    SecondaryDockComponent,
    ActiveApplicationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceDockComponent extends ComponentStore<ViewModel> {
  private readonly _dialog = inject(Dialog);
  private readonly _storage = inject(Storage);

  readonly isCreating$ = this.select(({ isCreating }) => isCreating);
  readonly isUpdating$ = this.select(({ isUpdating }) => isUpdating);
  readonly isUpdatingThumbnail$ = this.select(
    ({ isUpdatingThumbnail }) => isUpdatingThumbnail
  );
  readonly isDeleting$ = this.select(({ isDeleting }) => isDeleting);
  readonly hotkeys$ = this.select(({ hotkeys }) => hotkeys);
  readonly workspace$ = this.select(({ workspace }) => workspace);

  @Input() set pgWorkspace(workspace: Option<Graph>) {
    this.patchState({ workspace });
  }
  @Output() pgApplicationActivate = new EventEmitter();
  @Output() pgUpdateWorkspace = new EventEmitter<{
    id: string;
    changes: UpdateWorkspaceSubmit;
  }>();
  @Output() pgUpdateWorkspaceThumbnail = new EventEmitter<{
    id: string;
    fileId: string;
    fileUrl: string;
  }>();
  @Output() pgDeleteWorkspace = new EventEmitter<string>();

  readonly setIsCreating = this.updater<boolean>((state, isCreating) => ({
    ...state,
    isCreating,
  }));

  readonly setIsUpdating = this.updater<boolean>((state, isUpdating) => ({
    ...state,
    isUpdating,
  }));

  readonly setIsUpdatingThumbnail = this.updater<boolean>(
    (state, isUpdatingThumbnail) => ({
      ...state,
      isUpdatingThumbnail,
    })
  );

  readonly setIsDeleting = this.updater<boolean>((state, isDeleting) => ({
    ...state,
    isDeleting,
  }));

  constructor() {
    super(initialState);
  }

  onUpdateWorkspace(workspaceId: string, workspaceData: UpdateWorkspaceSubmit) {
    this.pgUpdateWorkspace.emit({
      id: workspaceId,
      changes: workspaceData,
    });
  }

  onUploadThumbnail(workspaceId: string, fileId: string, fileUrl: string) {
    this.pgUpdateWorkspaceThumbnail.emit({
      id: workspaceId,
      fileId,
      fileUrl,
    });
  }

  onDeleteWorkspace(workspaceId: string) {
    this.pgDeleteWorkspace.emit(workspaceId);
  }

  onActivateApplication() {
    this.pgApplicationActivate.emit();
  }

  onKeyDown(hotkeys: HotKey[], workspace: Graph, event: KeyboardEvent) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        case 0: {
          this.setIsUpdating(true);

          openEditWorkspaceModal(this._dialog, { workspace })
            .closed.pipe(
              tap((workspaceData) => {
                this.setIsUpdating(false);

                if (workspaceData) {
                  this.pgUpdateWorkspace.emit({
                    id: workspace.id,
                    changes: workspaceData,
                  });
                }
              })
            )
            .subscribe();

          break;
        }

        case 1: {
          this.setIsUpdatingThumbnail(true);

          const fileId = generateId();
          const fileName = `${fileId}.png`;

          openUploadFileModal(this._dialog)
            .closed.pipe(
              concatMap((uploadFileData) => {
                this.setIsUpdatingThumbnail(false);

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
            .subscribe((payload) => {
              if (payload) {
                this.pgUpdateWorkspaceThumbnail.emit({
                  id: workspace.id,
                  fileId,
                  fileUrl: payload.fileUrl,
                });
              }
            });

          break;
        }

        case 2: {
          this.setIsDeleting(true);

          openConfirmModal(this._dialog, {
            message: 'Are you sure? This action cannot be reverted.',
          }).closed.subscribe((confirmData) => {
            this.setIsDeleting(false);

            if (confirmData) {
              this.pgDeleteWorkspace.emit(workspace.id);
            }
          });

          break;
        }

        case 3: {
          this.pgApplicationActivate.emit();

          break;
        }

        default: {
          break;
        }
      }
    }
  }
}

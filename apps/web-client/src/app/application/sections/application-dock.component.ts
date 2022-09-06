import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map, of, tap } from 'rxjs';
import { ApplicationView, BoardStore } from '../../core/stores';
import {
  ConfirmModalDirective,
  openConfirmModal,
  SquareButtonComponent,
} from '../../shared/components';
import {
  DefaultImageDirective,
  KeyboardListenerDirective,
} from '../../shared/directives';
import { SlotHotkeyPipe } from '../../shared/pipes';
import { isNotNull, isNull } from '../../shared/utils';
import {
  EditApplicationModalDirective,
  EditApplicationSubmit,
  openEditApplicationModal,
} from '../components';
import { ApplicationApiService } from '../services';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-application-dock',
  template: `
    <ng-container *ngrxLet="hotkeys$; let hotkeys">
      <div
        *ngIf="selected$ | ngrxPush as selected"
        class="p-4 bg-gray-700 flex gap-4 justify-center items-start"
        pgKeyboardListener
        (pgKeyDown)="onKeyDown(hotkeys, selected, $event)"
      >
        <img
          [src]="selected?.thumbnailUrl"
          pgDefaultImage="assets/generic/application.png"
        />

        {{ selected?.name }}

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
          *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
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
            [pgIsActive]="isEditing"
            pgThumbnailUrl="assets/generic/application.png"
            pgEditApplicationModal
            [pgApplication]="selected"
            (pgOpenModal)="isEditing = true"
            (pgCloseModal)="isEditing = false"
            (pgUpdateApplication)="onUpdateApplication(selected.id, $event)"
          ></pg-square-button>
        </div>

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
          *ngIf="(currentApplicationId$ | ngrxPush) === selected.id"
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
            [pgIsActive]="isDeleting"
            pgThumbnailUrl="assets/generic/application.png"
            (pgConfirm)="onDeleteApplication(selected.id)"
            pgConfirmModal
            pgMessage="Are you sure? This action cannot be reverted."
          ></pg-square-button>
        </div>
      </div>
    </ng-container>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    EditApplicationModalDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationDockComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (isNull(selected) || selected.kind !== 'application') {
        return null;
      }

      return selected;
    })
  );
  readonly hotkeys$ = of([
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
  ]);

  isEditing = false;
  isDeleting = false;

  onUpdateApplication(
    applicationId: string,
    applicationData: EditApplicationSubmit
  ) {
    this._applicationApiService
      .updateApplication(
        applicationId,
        applicationData.name,
        applicationData.thumbnailUrl
      )
      .subscribe();
  }

  onDeleteApplication(applicationId: string) {
    this._applicationApiService
      .deleteApplication(applicationId)
      .subscribe(() => this._boardStore.setSelectedId(null));
  }

  onKeyDown(
    hotkeys: HotKey[],
    application: ApplicationView,
    event: KeyboardEvent
  ) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (isNotNull(hotkey)) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditApplicationModal(this._dialog, { application })
            .closed.pipe(
              concatMap((applicationData) => {
                this.isEditing = false;

                if (applicationData === undefined) {
                  return EMPTY;
                }

                return this._applicationApiService.updateApplication(
                  application.id,
                  applicationData.name,
                  applicationData.thumbnailUrl
                );
              })
            )
            .subscribe();

          break;
        }

        case 1: {
          this.isDeleting = true;

          openConfirmModal(this._dialog, {
            message: 'Are you sure? This action cannot be reverted.',
          })
            .closed.pipe(
              concatMap((confirmData) => {
                this.isDeleting = false;

                if (confirmData === undefined || !confirmData) {
                  return EMPTY;
                }

                return this._applicationApiService
                  .deleteApplication(application.id)
                  .pipe(tap(() => this._boardStore.setSelectedId(null)));
              })
            )
            .subscribe();

          break;
        }

        default: {
          break;
        }
      }
    }
  }
}

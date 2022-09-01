import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { concatMap, EMPTY, map, of, tap } from 'rxjs';
import { SquareButtonComponent } from '../components';
import {
  DefaultImageDirective,
  KeyboardListenerDirective,
} from '../directives';
import {
  ConfirmModalDirective,
  EditSysvarModalDirective,
  EditSysvarSubmit,
  openConfirmModal,
  openEditSysvarModal,
} from '../modals';
import { SlotHotkeyPipe } from '../pipes';
import { SysvarApiService } from '../services';
import { BoardStore, SysvarView } from '../stores';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

@Component({
  selector: 'pg-sysvar-section',
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
          pgDefaultImage="assets/generic/sysvar.png"
        />

        {{ selected?.name }}

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
        >
          <span
            *ngIf="0 | pgSlotHotkey: hotkeys as hotkey"
            class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
            style="font-size: 0.5rem; line-height: 0.5rem"
          >
            {{ hotkey }}
          </span>

          <pg-square-button
            [pgIsActive]="isEditing"
            pgThumbnailUrl="assets/generic/sysvar.png"
            pgEditSysvarModal
            [pgSysvar]="selected"
            (pgOpenModal)="isEditing = true"
            (pgCloseModal)="isEditing = false"
            (pgUpdateSysvar)="onUpdateSysvar(selected.id, selected)"
          ></pg-square-button>
        </div>

        <div
          class="bg-gray-800 relative"
          style="width: 2.89rem; height: 2.89rem"
        >
          <span
            *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
            class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
            style="font-size: 0.5rem; line-height: 0.5rem"
          >
            {{ hotkey }}
          </span>

          <pg-square-button
            [pgIsActive]="isDeleting"
            pgThumbnailUrl="assets/generic/sysvar.png"
            (pgConfirm)="onDeleteSysvar(selected.id)"
            pgConfirmModal
            pgMessage="Are you sure? This action cannot be reverted."
            (pgOpenModal)="isDeleting = true"
            (pgCloseModal)="isDeleting = false"
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
    EditSysvarModalDirective,
    SlotHotkeyPipe,
    KeyboardListenerDirective,
    EditSysvarModalDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
  ],
})
export class SysvarSectionComponent {
  private readonly _dialog = inject(Dialog);
  private readonly _boardStore = inject(BoardStore);
  private readonly _sysvarApiService = inject(SysvarApiService);

  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly selected$ = this._boardStore.selected$.pipe(
    map((selected) => {
      if (selected === null || selected.kind !== 'sysvar') {
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

  onUpdateSysvar(sysvarId: string, sysvarData: EditSysvarSubmit) {
    this._sysvarApiService
      .updateSysvar(sysvarId, sysvarData.name, sysvarData.thumbnailUrl)
      .subscribe();
  }

  onDeleteSysvar(sysvarId: string) {
    this._sysvarApiService
      .deleteSysvar(sysvarId)
      .subscribe(() => this._boardStore.setSelectedId(null));
  }

  onKeyDown(hotkeys: HotKey[], sysvar: SysvarView, event: KeyboardEvent) {
    const hotkey = hotkeys.find(({ code }) => code === event.code) ?? null;

    if (hotkey !== null) {
      switch (hotkey.slot) {
        case 0: {
          this.isEditing = true;

          openEditSysvarModal(this._dialog, { sysvar })
            .closed.pipe(
              concatMap((sysvarData) => {
                this.isEditing = false;

                if (sysvarData === undefined) {
                  return EMPTY;
                }

                return this._sysvarApiService.updateSysvar(
                  sysvar.id,
                  sysvarData.name,
                  sysvarData.thumbnailUrl
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

                return this._sysvarApiService
                  .deleteSysvar(sysvar.id)
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

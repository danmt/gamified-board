import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { LetModule, PushModule } from '@ngrx/component';
import { ComponentStore } from '@ngrx/component-store';
import {
  ConfirmModalDirective,
  SecondaryDockComponent,
  SquareButtonComponent,
  UploadFileModalDirective,
} from '../../shared/components';
import {
  DefaultImageDirective,
  KeyListenerDirective,
} from '../../shared/directives';
import { SlotHotkeyPipe } from '../../shared/pipes';
import { Option } from '../../shared/utils';
import {
  UpdateAccountModalDirective,
  UpdateAccountSeedsModalDirective,
  UpdateAccountSubmit,
} from '../components';
import { AccountNode, SeedType } from '../utils';

interface HotKey {
  slot: number;
  key: string;
  code: string;
}

interface ViewModel {
  account: Option<AccountNode>;
  isUpdating: boolean;
  isUpdatingThumbnail: boolean;
  isDeleting: boolean;
  hotkeys: [HotKey, HotKey, HotKey, HotKey, HotKey];
}

const initialState: ViewModel = {
  account: null,
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
    {
      slot: 4,
      code: 'KeyT',
      key: 't',
    },
  ],
};

@Component({
  selector: 'pg-account-dock',
  template: `
    <pg-secondary-dock
      *ngIf="account$ | ngrxPush as account"
      class="text-white block bp-font-game"
      pgKeyListener="Escape"
      (pgKeyDown)="onUnselectAccount()"
    >
      <div class="flex gap-4 justify-center items-start">
        <img
          [src]="account.data.thumbnailUrl"
          pgDefaultImageUrl="assets/generic/account.png"
          class="w-[100px] h-[106px] overflow-hidden rounded-xl"
        />

        <div>
          <h2 class="text-xl">Name</h2>
          <p class="text-base">{{ account.data.name }}</p>
        </div>

        <div class="ml-10">
          <h2 class="text-xl">Actions</h2>

          <div class="flex gap-4 justify-center items-start">
            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="0 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[0].code"
                  (pgKeyDown)="updateAccountModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/account.png"
                [pgIsActive]="false"
                pgUpdateAccountModal
                #updateAccountModal="modal"
                [pgAccount]="account"
                [pgInstructionAccounts]="pgInstructionAccounts"
                (pgOpenModal)="setIsUpdating(true)"
                (pgCloseModal)="setIsUpdating(false)"
                (pgUpdateAccount)="onUpdateAccount(account.id, $event)"
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="1 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[1].code"
                  (pgKeyDown)="updateAccountThumbnailModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/account.png"
                [pgIsActive]="(isUpdatingThumbnail$ | ngrxPush) ?? false"
                pgUploadFileModal
                #updateAccountThumbnailModal="modal"
                (pgSubmit)="
                  onUploadThumbnail(account.id, $event.fileId, $event.fileUrl)
                "
                (pgOpenModal)="setIsUpdatingThumbnail(true)"
                (pgCloseModal)="setIsUpdatingThumbnail(false)"
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="2 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[2].code"
                  (pgKeyDown)="updateAccountSeedsModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/account.png"
                [pgIsActive]="false"
                pgUpdateAccountSeedsModal
                #updateAccountSeedsModal="modal"
                [pgAccountSeeds]="account.data.seeds"
                [pgOptions]="pgSeedOptions"
                (pgOpenModal)="setIsUpdating(true)"
                (pgCloseModal)="setIsUpdating(false)"
                (pgUpdateAccountSeeds)="
                  onUpdateAccountSeeds(account.id, $event.seeds)
                "
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="3 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[3].code"
                  (pgKeyDown)="deleteAccountModal.open()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                [pgIsActive]="(isDeleting$ | ngrxPush) ?? false"
                pgThumbnailUrl="assets/generic/account.png"
                (pgConfirm)="onDeleteAccount(account.id)"
                pgConfirmModal
                #deleteAccountModal="modal"
                pgMessage="Are you sure? This action cannot be reverted."
                (pgOpenModal)="setIsDeleting(true)"
                (pgCloseModal)="setIsDeleting(false)"
              ></pg-square-button>
            </div>

            <div class="bg-gray-800 relative w-[2.89rem] h-[2.89rem]">
              <ng-container *ngrxLet="hotkeys$; let hotkeys">
                <span
                  *ngIf="4 | pgSlotHotkey: hotkeys as hotkey"
                  class="absolute left-0 top-0 px-1 py-0.5 text-white bg-black bg-opacity-60 z-10 uppercase"
                  style="font-size: 0.5rem; line-height: 0.5rem"
                  [pgKeyListener]="hotkeys[4].code"
                  (pgKeyDown)="onUnselectAccount()"
                >
                  {{ hotkey }}
                </span>
              </ng-container>

              <pg-square-button
                pgThumbnailUrl="assets/generic/account.png"
                (click)="onUnselectAccount()"
              ></pg-square-button>
            </div>
          </div>
        </div>
      </div>
    </pg-secondary-dock>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    PushModule,
    LetModule,
    SquareButtonComponent,
    SlotHotkeyPipe,
    KeyListenerDirective,
    ConfirmModalDirective,
    DefaultImageDirective,
    UploadFileModalDirective,
    UpdateAccountModalDirective,
    UpdateAccountSeedsModalDirective,
    SecondaryDockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDockComponent extends ComponentStore<ViewModel> {
  readonly isUpdating$ = this.select(({ isUpdating }) => isUpdating);
  readonly isUpdatingThumbnail$ = this.select(
    ({ isUpdatingThumbnail }) => isUpdatingThumbnail
  );
  readonly isDeleting$ = this.select(({ isDeleting }) => isDeleting);
  readonly hotkeys$ = this.select(({ hotkeys }) => hotkeys);
  readonly account$ = this.select(({ account }) => account);

  @Input() set pgAccount(account: Option<AccountNode>) {
    this.patchState({ account });
  }
  @Input() pgInstructionAccounts: {
    id: string;
    data: { name: string; ref: { name: string } };
  }[] = [];
  @Input() pgSeedOptions: SeedType[] = [];
  @Output() pgAccountUnselected = new EventEmitter();
  @Output() pgUpdateAccount = new EventEmitter<{
    id: string;
    changes: UpdateAccountSubmit;
  }>();
  @Output() pgUpdateAccountThumbnail = new EventEmitter<{
    id: string;
    fileId: string;
    fileUrl: string;
  }>();
  @Output() pgDeleteAccount = new EventEmitter<string>();
  @Output() pgUpdateAccountSeeds = new EventEmitter<{
    id: string;
    seeds: SeedType[];
  }>();

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

  onUpdateAccount(accountId: string, accountData: UpdateAccountSubmit) {
    this.pgUpdateAccount.emit({
      id: accountId,
      changes: accountData,
    });
  }

  onUploadThumbnail(accountId: string, fileId: string, fileUrl: string) {
    this.pgUpdateAccountThumbnail.emit({
      id: accountId,
      fileId,
      fileUrl,
    });
  }

  onUpdateAccountSeeds(accountId: string, seeds: SeedType[]) {
    this.pgUpdateAccountSeeds.emit({ id: accountId, seeds });
  }

  onDeleteAccount(accountId: string) {
    this.pgDeleteAccount.emit(accountId);
  }

  onUnselectAccount() {
    this.pgAccountUnselected.emit();
  }
}

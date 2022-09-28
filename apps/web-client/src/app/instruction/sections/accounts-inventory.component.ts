import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { Account } from '../../program/utils';
import { InventoryComponent } from '../../shared/components';
import { TooltipComponent } from '../../shared/components/tooltip.component';
import {
  DefaultImageDirective,
  HoveredDirective,
} from '../../shared/directives';

@Component({
  selector: 'pg-accounts-inventory',
  exportAs: 'accountsInventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[520px] max-h-[520px]"
      pgDirection="left"
    >
      <h2 pgInventoryTitle class="bp-font-game-title text-3xl">Accounts</h2>

      <div pgInventoryBody>
        <div class="flex flex-wrap gap-4 justify-center">
          <ng-container *ngFor="let account of pgAccounts; trackBy: trackBy">
            <button
              class="bg-gray-600 p-0.5 w-11 h-11"
              (click)="onTapAccount(account)"
              cdkOverlayOrigin
              #trigger="cdkOverlayOrigin"
              pgHovered
              #accountButton="hovered"
            >
              <img
                class="w-full h-full object-cover"
                [src]="account.data.thumbnailUrl"
                pgDefaultImage="assets/generic/account.png"
              />
            </button>

            <ng-template
              cdkConnectedOverlay
              [cdkConnectedOverlayOrigin]="trigger"
              [cdkConnectedOverlayOpen]="
                (accountButton.isHovered$ | ngrxPush) ?? false
              "
              [cdkConnectedOverlayPositions]="[
                {
                  originX: 'end',
                  originY: 'center',
                  overlayX: 'start',
                  overlayY: 'center',
                  offsetX: 16
                }
              ]"
            >
              <pg-tooltip
                class="relative"
                style="min-width: 250px; max-width: 350px"
                pgPosition="right"
              >
                <div class="flex gap-2 items-start" pgTooltipHeader>
                  <img
                    [src]="account.data.thumbnailUrl"
                    pgDefaultImage="assets/generic/account.png"
                    class="w-12 h-10 object-cover"
                  />

                  <h3 class="uppercase text-xl">
                    {{ account.data.name }}
                  </h3>
                </div>

                <ng-container pgTooltipContent>
                  <div class="p-2">
                    <p class="uppercase">Attributes</p>

                    <section class="flex gap-2 flex-wrap">
                      <article
                        *ngFor="let field of account.fields"
                        class="border border-slate-900 p-1"
                      >
                        <p class="text-sm font-bold">{{ field.data.name }}</p>
                        <p class="text-xs">{{ field.data.type }}</p>
                      </article>
                    </section>
                  </div>
                </ng-container>
              </pg-tooltip>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </pg-inventory>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    RouterModule,
    DefaultImageDirective,
    HoveredDirective,
    InventoryComponent,
    TooltipComponent,
    OverlayModule,
  ],
})
export class AccountsInventoryComponent {
  @Input() pgAccounts: Account[] = [];
  @Output() pgTapAccount = new EventEmitter<Account>();

  trackBy(index: number): number {
    return index;
  }

  onTapAccount(account: Account) {
    this.pgTapAccount.emit(account);
  }
}

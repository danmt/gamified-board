import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  HostListener,
  inject,
  Input,
  OnDestroy,
  Output,
  ViewContainerRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { Subject, Subscription } from 'rxjs';
import { Account } from '../../program/utils';
import { InventoryComponent } from '../../shared/components';
import { TooltipComponent } from '../../shared/components/tooltip.component';
import { DefaultImageDirective, HoverDirective } from '../../shared/directives';
import { isNotNull, isNull, Option } from '../../shared/utils';

export const openAccountsInventory = (
  overlay: Overlay,
  viewContainerRef: ViewContainerRef,
  accounts: Account[]
) => {
  const overlayRef = overlay.create({
    positionStrategy: overlay
      .position()
      .global()
      .centerVertically()
      .left('0px'),
    scrollStrategy: overlay.scrollStrategies.close(),
  });
  const componentRef = overlayRef.attach(
    new ComponentPortal(AccountsInventoryComponent, viewContainerRef)
  );
  componentRef.setInput('pgAccounts', accounts);

  return { componentRef, overlayRef };
};

@Directive({
  selector: '[pgAccountsInventory]',
  standalone: true,
  exportAs: 'modal',
})
export class AccountsInventoryDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private _overlayRef: Option<OverlayRef> = null;
  private _isOpen = false;
  private _tapAccountSubscription: Option<Subscription> = null;

  private readonly _tapAccount = new Subject<Account>();

  @Input() pgAccounts: Account[] = [];
  @Output() pgTapAccount = this._tapAccount.asObservable();

  @HostListener('click') onClick() {
    this.open();
  }

  ngOnDestroy() {
    this.close();
  }

  open() {
    if (isNull(this._overlayRef) && !this._isOpen) {
      this._isOpen = true;
      const { overlayRef, componentRef } = openAccountsInventory(
        this._overlay,
        this._viewContainerRef,
        this.pgAccounts
      );

      this._overlayRef = overlayRef;

      this._tapAccountSubscription =
        componentRef.instance.tapAccount$.subscribe(this._tapAccount);
    }
  }

  close() {
    if (
      isNotNull(this._overlayRef) &&
      this._isOpen &&
      this._tapAccountSubscription
    ) {
      this._isOpen = false;
      this._overlayRef.dispose();
      this._overlayRef = null;
      this._tapAccountSubscription.unsubscribe();
    }
  }

  toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

@Component({
  selector: 'pg-accounts-inventory',
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
              pgHover
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
    HoverDirective,
    InventoryComponent,
    TooltipComponent,
    OverlayModule,
  ],
})
export class AccountsInventoryComponent {
  private readonly _tapAccount = new Subject<Account>();

  readonly tapAccount$ = this._tapAccount.asObservable();

  @Input() pgAccounts: Account[] = [];

  trackBy(index: number): number {
    return index;
  }

  onTapAccount(account: Account) {
    this._tapAccount.next(account);
  }
}

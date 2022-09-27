import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  HostListener,
  inject,
  OnDestroy,
  Output,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { Subject, Subscription } from 'rxjs';
import { InventoryComponent } from '../../shared/components';
import { TooltipComponent } from '../../shared/components/tooltip.component';
import {
  DefaultImageDirective,
  HoveredDirective,
} from '../../shared/directives';
import { isNotNull, isNull, Option } from '../../shared/utils';

interface Sysvar {
  name: string;
  thumbnailUrl: string;
}

export const openSysvarsInventory = (overlay: Overlay) => {
  const overlayRef = overlay.create({
    positionStrategy: overlay
      .position()
      .global()
      .centerVertically()
      .right('0px'),
    scrollStrategy: overlay.scrollStrategies.close(),
  });
  const componentRef = overlayRef.attach(
    new ComponentPortal(SysvarsInventoryComponent)
  );

  return { componentRef, overlayRef };
};

@Directive({
  selector: '[pgSysvarsInventory]',
  standalone: true,
  exportAs: 'modal',
})
export class SysvarsInventoryDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private _overlayRef: Option<OverlayRef> = null;
  private _isOpen = false;
  private _tapSysvarSubscription: Option<Subscription> = null;

  private readonly _tapSysvar = new Subject<Sysvar>();

  @Output() pgTapSysvar = this._tapSysvar.asObservable();

  @HostListener('click') onClick() {
    this.open();
  }

  ngOnDestroy() {
    this.close();
  }

  open() {
    if (isNull(this._overlayRef) && !this._isOpen) {
      this._isOpen = true;
      const { overlayRef, componentRef } = openSysvarsInventory(this._overlay);

      this._overlayRef = overlayRef;

      this._tapSysvarSubscription = componentRef.instance.tapSysvar$.subscribe(
        this._tapSysvar
      );
    }
  }

  close() {
    if (
      isNotNull(this._overlayRef) &&
      this._isOpen &&
      this._tapSysvarSubscription
    ) {
      this._isOpen = false;
      this._overlayRef.dispose();
      this._overlayRef = null;
      this._tapSysvarSubscription.unsubscribe();
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
  selector: 'pg-sysvars-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[520px] max-h-[520px]"
      pgDirection="right"
    >
      <h2 pgInventoryTitle class="bp-font-game-title text-3xl">Sysvars</h2>

      <div pgInventoryBody class="flex flex-wrap gap-4 justify-center">
        <ng-container *ngFor="let sysvar of sysvars; trackBy: trackBy">
          <button
            class="bg-gray-600 p-0.5 w-11 h-11"
            (click)="onTapSysvar(sysvar)"
            cdkOverlayOrigin
            #trigger="cdkOverlayOrigin"
            pgHovered
            #accountButton="hovered"
          >
            <img
              class="w-full h-full object-cover"
              [src]="sysvar.thumbnailUrl"
              pgDefaultImage="assets/generic/sysvar.png"
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
                originX: 'start',
                originY: 'center',
                overlayX: 'end',
                overlayY: 'center',
                offsetX: -16
              }
            ]"
          >
            <pg-tooltip
              class="relative"
              style="min-width: 250px; max-width: 350px"
              pgPosition="left"
            >
              <div class="flex gap-2 items-start" pgTooltipHeader>
                <img
                  [src]="sysvar.thumbnailUrl"
                  pgDefaultImage="assets/generic/sysvar.png"
                  class="w-12 h-10 object-cover"
                />

                <h3 class="uppercase text-xl">
                  {{ sysvar.name }}
                </h3>
              </div>
            </pg-tooltip>
          </ng-template>
        </ng-container>
      </div>
    </pg-inventory>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    OverlayModule,
    HoveredDirective,
    RouterModule,
    DefaultImageDirective,
    InventoryComponent,
    TooltipComponent,
  ],
})
export class SysvarsInventoryComponent {
  private readonly _tapSysvar = new Subject<Sysvar>();

  readonly tapSysvar$ = this._tapSysvar.asObservable();

  readonly sysvars: Sysvar[] = [
    {
      name: 'rent',
      thumbnailUrl: 'assets/generic/sysvar.png',
    },
    {
      name: 'clock',
      thumbnailUrl: 'assets/generic/sysvar.png',
    },
  ];

  trackBy(index: number): number {
    return index;
  }

  onTapSysvar(sysvar: Sysvar) {
    this._tapSysvar.next(sysvar);
  }
}

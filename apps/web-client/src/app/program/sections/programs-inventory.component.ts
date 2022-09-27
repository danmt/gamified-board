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
  OnInit,
  Output,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { defer, from, Subject, Subscription, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InventoryComponent } from '../../shared/components';
import { TooltipComponent } from '../../shared/components/tooltip.component';
import { DefaultImageDirective, HoverDirective } from '../../shared/directives';
import { generateId, isNotNull, isNull, Option } from '../../shared/utils';
import { InstallProgramModalDirective } from '../components';
import { ProgramApiService } from '../services';
import { InstallableProgram, Installation, ProgramCheckpoint } from '../utils';

export interface InstallProgramPayload {
  id: string;
  data: ProgramCheckpoint;
}

export const openProgramsInventory = (
  overlay: Overlay,
  installations: {
    id: string;
    data: ProgramCheckpoint;
  }[]
) => {
  const overlayRef = overlay.create({
    positionStrategy: overlay
      .position()
      .global()
      .centerVertically()
      .right('0px'),
    scrollStrategy: overlay.scrollStrategies.close(),
  });
  const componentRef = overlayRef.attach(
    new ComponentPortal(ProgramsInventoryComponent)
  );
  componentRef.setInput('pgInstallations', installations);

  return { componentRef, overlayRef };
};

interface ViewModel {
  programs: InstallableProgram[];
  showInstalled: boolean;
}

const initialState: ViewModel = {
  programs: [],
  showInstalled: false,
};

@Directive({
  selector: '[pgProgramsInventory]',
  standalone: true,
  exportAs: 'modal',
})
export class ProgramsInventoryDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private _overlayRef: Option<OverlayRef> = null;
  private _isOpen = false;
  private _installProgramSubscription: Option<Subscription> = null;
  private _tapInstallationSubscription: Option<Subscription> = null;

  private readonly _installProgram = new Subject<InstallProgramPayload>();
  private readonly _tapInstallation = new Subject<Installation>();

  @Input() pgInstallations: Installation[] = [];

  @Output() pgInstallProgram = this._installProgram.asObservable();
  @Output() pgTapInstallation = this._tapInstallation.asObservable();

  @HostListener('click') onClick() {
    this.open();
  }

  ngOnDestroy() {
    this.close();
  }

  open() {
    if (isNull(this._overlayRef) && !this._isOpen) {
      this._isOpen = true;
      const { overlayRef, componentRef } = openProgramsInventory(
        this._overlay,
        this.pgInstallations
      );

      this._overlayRef = overlayRef;

      this._installProgramSubscription =
        componentRef.instance.installProgram$.subscribe(this._installProgram);
      this._tapInstallationSubscription =
        componentRef.instance.tapInstallation$.subscribe(this._tapInstallation);
    }
  }

  close() {
    if (
      isNotNull(this._overlayRef) &&
      this._isOpen &&
      this._installProgramSubscription &&
      this._tapInstallationSubscription
    ) {
      this._isOpen = false;
      this._overlayRef.dispose();
      this._overlayRef = null;
      this._installProgramSubscription.unsubscribe();
      this._tapInstallationSubscription.unsubscribe();
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
  selector: 'pg-programs-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[520px] max-h-[520px]"
      pgDirection="right"
    >
      <h2 pgInventoryTitle class="bp-font-game-title text-3xl">Programs</h2>

      <div
        pgInventoryBody
        id="programs-section"
        *ngrxLet="programs$; let programs"
      >
        <div class="text-white flex justify-center gap-4">
          <button
            (click)="onHideInstallable()"
            [ngClass]="{ underline: (showInstalled$ | ngrxPush) }"
          >
            Browse
          </button>
          <button
            (click)="onShowInstalled()"
            [ngClass]="{ underline: (showInstalled$ | ngrxPush) === false }"
          >
            Installed
          </button>
        </div>

        <div class="flex flex-wrap gap-4 justify-center">
          <ng-container *ngIf="(showInstalled$ | ngrxPush) === false">
            <div
              *ngFor="let program of programs; trackBy: trackBy"
              class="relative"
            >
              <button
                class="bg-gray-600 p-0.5 w-11 h-11"
                pgInstallProgramModal
                [pgInstallableProgram]="program"
                (pgInstallProgram)="
                  onInstallProgram(program, $event.checkpoint)
                "
                cdkOverlayOrigin
                #trigger="cdkOverlayOrigin"
                pgHover
                #accountButton="hovered"
              >
                <img
                  class="w-full h-full object-cover"
                  [src]="program.data.thumbnailUrl"
                  pgDefaultImage="assets/generic/program.png"
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
                      [src]="program.data.thumbnailUrl"
                      pgDefaultImage="assets/generic/program.png"
                      class="w-12 h-10 object-cover"
                    />

                    <h3 class="uppercase text-xl">
                      {{ program.data.name }}
                    </h3>
                  </div>
                </pg-tooltip>
              </ng-template>
            </div>
          </ng-container>

          <ng-container *ngIf="(showInstalled$ | ngrxPush) ?? false">
            <ng-container
              *ngFor="let installation of pgInstallations; trackBy: trackBy"
            >
              <button
                class="bg-gray-600 p-0.5 w-11 h-11"
                (click)="onTapInstallation(installation)"
                cdkOverlayOrigin
                #trigger="cdkOverlayOrigin"
                pgHover
                #accountButton="hovered"
              >
                <img
                  class="w-full h-full object-cover"
                  [src]="installation.data.graph.data.thumbnailUrl"
                  pgDefaultImage="assets/generic/program.png"
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
                      [src]="installation.data.graph.data.thumbnailUrl"
                      pgDefaultImage="assets/generic/program.png"
                      class="w-12 h-10 object-cover"
                    />

                    <h3 class="uppercase text-xl">
                      {{ installation.data.graph.data.name }}
                    </h3>
                  </div>
                </pg-tooltip>
              </ng-template>
            </ng-container>
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
    OverlayModule,
    RouterModule,
    DefaultImageDirective,
    TooltipComponent,
    HoverDirective,
    InventoryComponent,
    ProgramsInventoryDirective,
    InstallProgramModalDirective,
  ],
})
export class ProgramsInventoryComponent
  extends ComponentStore<ViewModel>
  implements OnInit
{
  private readonly _programApiService = inject(ProgramApiService);
  private readonly _installProgram = new Subject<InstallProgramPayload>();
  private readonly _tapInstallation = new Subject<Installation>();

  @Input() pgInstallations: Installation[] = [];

  readonly installProgram$ = this._installProgram.asObservable();
  readonly tapInstallation$ = this._tapInstallation.asObservable();
  readonly programs$ = this.select(({ programs }) => programs);
  readonly showInstalled$ = this.select(({ showInstalled }) => showInstalled);

  private readonly _loadPrograms = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return [];
      }

      return this._programApiService.getWorkspacePrograms(workspaceId).pipe(
        switchMap((programs) =>
          defer(() =>
            from(
              Promise.all(
                programs.map((program) =>
                  this._programApiService
                    .getProgramLastCheckpoint(workspaceId, program.id)
                    .then((checkpoints) => ({
                      ...program,
                      checkpoints,
                    }))
                )
              )
            )
          ).pipe(
            tapResponse(
              (programs) => this.patchState({ programs }),
              (error) => this._handleError(error)
            )
          )
        )
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngOnInit() {
    this._loadPrograms(environment.installableAppsWorkspace);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }

  trackBy(index: number): number {
    return index;
  }

  onInstallProgram(program: InstallableProgram, checkpointId: string) {
    const checkpoint =
      program.checkpoints.find(
        (checkpoint) => checkpoint.id === checkpointId
      ) ?? null;

    if (isNotNull(checkpoint)) {
      this._installProgram.next({ id: generateId(), data: checkpoint });
    }
  }

  onShowInstalled() {
    this.patchState({ showInstalled: true });
  }

  onHideInstallable() {
    this.patchState({ showInstalled: false });
  }

  onTapInstallation(installation: Installation) {
    this._tapInstallation.next(installation);
  }
}

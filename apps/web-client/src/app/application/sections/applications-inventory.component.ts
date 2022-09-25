import { Overlay, OverlayRef } from '@angular/cdk/overlay';
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
import { DefaultImageDirective } from '../../shared/directives';
import { generateId, isNotNull, isNull, Option } from '../../shared/utils';
import { InstallApplicationModalDirective } from '../components';
import { ApplicationApiService } from '../services';
import {
  ApplicationCheckpoint,
  InstallableApplication,
  Installation,
} from '../utils';

export interface InstallApplicationPayload {
  id: string;
  data: ApplicationCheckpoint;
}

export const openApplicationsInventory = (
  overlay: Overlay,
  installations: {
    id: string;
    data: ApplicationCheckpoint;
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
    new ComponentPortal(ApplicationsInventoryComponent)
  );
  componentRef.setInput('pgInstallations', installations);

  return { componentRef, overlayRef };
};

interface ViewModel {
  applications: InstallableApplication[];
  showInstalled: boolean;
}

const initialState: ViewModel = {
  applications: [],
  showInstalled: false,
};

@Directive({
  selector: '[pgApplicationsInventory]',
  standalone: true,
  exportAs: 'modal',
})
export class ApplicationsInventoryDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private _overlayRef: Option<OverlayRef> = null;
  private _isOpen = false;
  private _installApplicationSubscription: Option<Subscription> = null;
  private _tapInstallationSubscription: Option<Subscription> = null;

  private readonly _installApplication =
    new Subject<InstallApplicationPayload>();
  private readonly _tapInstallation = new Subject<Installation>();

  @Input() pgInstallations: Installation[] = [];

  @Output() pgInstallApplication = this._installApplication.asObservable();
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
      const { overlayRef, componentRef } = openApplicationsInventory(
        this._overlay,
        this.pgInstallations
      );

      this._overlayRef = overlayRef;

      this._installApplicationSubscription =
        componentRef.instance.installApplication$.subscribe(
          this._installApplication
        );
      this._tapInstallationSubscription =
        componentRef.instance.tapInstallation$.subscribe(this._tapInstallation);
    }
  }

  close() {
    if (
      isNotNull(this._overlayRef) &&
      this._isOpen &&
      this._installApplicationSubscription &&
      this._tapInstallationSubscription
    ) {
      this._isOpen = false;
      this._overlayRef.dispose();
      this._overlayRef = null;
      this._installApplicationSubscription.unsubscribe();
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
  selector: 'pg-applications-inventory',
  template: `
    <pg-inventory
      class="mt-10 min-w-[300px] min-h-[520px] max-h-[520px]"
      pgDirection="right"
    >
      <h2 pgInventoryTitle class="bp-font-game-title text-3xl">Applications</h2>

      <div
        pgInventoryBody
        id="applications-section"
        *ngrxLet="applications$; let applications"
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
              *ngFor="let application of applications; trackBy: trackBy"
              class="relative"
            >
              <button
                class="bg-gray-600 p-0.5 w-11 h-11"
                pgInstallApplicationModal
                [pgInstallableApplication]="application"
                (pgInstallApplication)="
                  onInstallApplication(application, $event.checkpoint)
                "
              >
                <img
                  class="w-full h-full object-cover"
                  [src]="application.data.thumbnailUrl"
                  pgDefaultImage="assets/generic/application.png"
                />
              </button>
            </div>
          </ng-container>

          <ng-container *ngIf="(showInstalled$ | ngrxPush) ?? false">
            <button
              *ngFor="let installation of pgInstallations; trackBy: trackBy"
              class="bg-gray-600 p-0.5 w-11 h-11"
              (click)="onTapInstallation(installation)"
            >
              <img
                class="w-full h-full object-cover"
                [src]="installation.data.graph.data.thumbnailUrl"
                pgDefaultImage="assets/generic/application.png"
              />
            </button>
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
    InventoryComponent,
    ApplicationsInventoryDirective,
    InstallApplicationModalDirective,
  ],
})
export class ApplicationsInventoryComponent
  extends ComponentStore<ViewModel>
  implements OnInit
{
  private readonly _applicationApiService = inject(ApplicationApiService);
  private readonly _installApplication =
    new Subject<InstallApplicationPayload>();
  private readonly _tapInstallation = new Subject<Installation>();

  @Input() pgInstallations: Installation[] = [];

  readonly installApplication$ = this._installApplication.asObservable();
  readonly tapInstallation$ = this._tapInstallation.asObservable();
  readonly applications$ = this.select(({ applications }) => applications);
  readonly showInstalled$ = this.select(({ showInstalled }) => showInstalled);

  private readonly _loadApplications = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return [];
      }

      return this._applicationApiService
        .getWorkspaceApplications(workspaceId)
        .pipe(
          switchMap((applications) =>
            defer(() =>
              from(
                Promise.all(
                  applications.map((application) =>
                    this._applicationApiService
                      .getApplicationLastCheckpoint(workspaceId, application.id)
                      .then((checkpoints) => ({
                        ...application,
                        checkpoints,
                      }))
                  )
                )
              )
            ).pipe(
              tapResponse(
                (applications) => this.patchState({ applications }),
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
    this._loadApplications(environment.installableAppsWorkspace);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }

  trackBy(index: number): number {
    return index;
  }

  onInstallApplication(
    application: InstallableApplication,
    checkpointId: string
  ) {
    const checkpoint =
      application.checkpoints.find(
        (checkpoint) => checkpoint.id === checkpointId
      ) ?? null;

    if (isNotNull(checkpoint)) {
      this._installApplication.next({ id: generateId(), data: checkpoint });
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

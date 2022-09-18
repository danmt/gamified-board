import { CommonModule } from '@angular/common';
import { Component, HostBinding, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { ComponentStore, provideComponentStore } from '@ngrx/component-store';
import {
  concatMap,
  EMPTY,
  filter,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { UpdateApplicationSubmit } from '../../application/components';
import { ApplicationApiService } from '../../application/services';
import { DrawerComponent } from '../../drawer/sections';
import { EventApiService } from '../../drawer/services';
import { DrawerStore } from '../../drawer/stores';
import {
  AddNodeSuccessEvent,
  DeleteNodeSuccessEvent,
  isAddNodeSuccessEvent,
  isClickEvent,
  isDeleteNodeSuccessEvent,
  isOneTapNodeEvent,
  isUpdateGraphSuccessEvent,
  isUpdateGraphThumbnailSuccessEvent,
  isUpdateNodeSuccessEvent,
  isUpdateNodeThumbnailSuccessEvent,
  Node,
  OneTapNodeEvent,
  UpdateGraphSuccessEvent,
  UpdateGraphThumbnailSuccessEvent,
  UpdateNodeSuccessEvent,
  UpdateNodeThumbnailSuccessEvent,
} from '../../drawer/utils';
import { isNull, Option } from '../../shared/utils';
import { UpdateWorkspaceSubmit } from '../components';
import {
  ActiveApplicationComponent,
  AddNodeDto,
  ApplicationDockComponent,
  WorkspaceDockComponent,
} from '../sections';
import { WorkspaceApiService } from '../services';
import { WorkspaceStore } from '../stores';

interface ViewModel {
  isCreatingApplication: boolean;
  workspaceId: Option<string>;
  selected: Option<Node>;
}

const initialState: ViewModel = {
  isCreatingApplication: false,
  workspaceId: null,
  selected: null,
};

@Component({
  selector: 'pg-workspace-page',
  template: `
    <pg-drawer [pgGraphId]="(workspaceId$ | ngrxPush) ?? null"></pg-drawer>

    <ng-container *ngrxLet="selected$; let selected">
      <pg-workspace-dock
        *ngIf="selected === null"
        class="fixed bottom-0 -translate-x-1/2 left-1/2"
        [pgWorkspace]="(workspace$ | ngrxPush) ?? null"
        (pgApplicationActivate)="onApplicationActivate()"
        (pgUpdateWorkspace)="onUpdateGraph($event.changes)"
        (pgUpdateWorkspaceThumbnail)="
          onUpdateGraphThumbnail($event.fileId, $event.fileUrl)
        "
        (pgDeleteWorkspace)="onDeleteGraph($event)"
      ></pg-workspace-dock>

      <pg-application-dock
        *ngIf="selected !== null"
        class="fixed bottom-0 -translate-x-1/2 left-1/2"
        [pgApplication]="(selected$ | ngrxPush) ?? null"
        (pgApplicationUnselected)="onApplicationUnselected()"
        (pgUpdateApplication)="onUpdateNode($event.id, $event.changes)"
        (pgUpdateApplicationThumbnail)="
          onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
        "
        (pgDeleteApplication)="onRemoveNode($event)"
      ></pg-application-dock>
    </ng-container>

    <pg-active-application
      [pgActive]="
        (isCreatingApplication$ | ngrxPush)
          ? { thumbnailUrl: 'assets/generic/application.png' }
          : null
      "
      [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
      (pgAddNode)="onAddNode($event)"
      (pgDeactivate)="onApplicationDeactivate()"
    ></pg-active-application>
  `,
  standalone: true,
  imports: [
    CommonModule,
    LetModule,
    PushModule,
    DrawerComponent,
    WorkspaceDockComponent,
    ApplicationDockComponent,
    ActiveApplicationComponent,
  ],
  providers: [
    provideComponentStore(DrawerStore),
    provideComponentStore(WorkspaceStore),
  ],
})
export class WorkspacePageComponent
  extends ComponentStore<ViewModel>
  implements OnInit
{
  private readonly _router = inject(Router);
  private readonly _eventApiService = inject(EventApiService);
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _applicationApiService = inject(ApplicationApiService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _drawerStore = inject(DrawerStore);

  readonly isCreatingApplication$ = this.select(
    ({ isCreatingApplication }) => isCreatingApplication
  );
  readonly selected$ = this.select(({ selected }) => selected);

  readonly workspaceId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId'))
  );
  readonly workspace$ = this._drawerStore.graph$;
  readonly drawerClick$ = this._drawerStore.event$.pipe(filter(isClickEvent));

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';

  private patchSelected = this.updater<{ id: string; changes: Partial<Node> }>(
    (state, { id, changes }) => {
      if (isNull(state.selected) || state.selected.id !== id) {
        return state;
      }

      return {
        ...state,
        selected: { ...state.selected, ...changes },
      };
    }
  );

  private clearSelected = this.updater<string>((state, id) => {
    if (isNull(state.selected) || state.selected.id !== id) {
      return state;
    }

    return {
      ...state,
      selected: null,
    };
  });

  private readonly _handleUpdateGraphSuccess =
    this.effect<UpdateGraphSuccessEvent>(
      concatMap((event) =>
        of(null).pipe(
          withLatestFrom(this.workspaceId$),
          concatMap(([, workspaceId]) => {
            if (isNull(workspaceId)) {
              return EMPTY;
            }

            return this._workspaceApiService.updateWorkspace(
              environment.clientId,
              workspaceId,
              event.payload
            );
          })
        )
      )
    );

  private readonly _handleUpdateGraphThumbnailSuccess =
    this.effect<UpdateGraphThumbnailSuccessEvent>(
      concatMap((event) =>
        of(null).pipe(
          withLatestFrom(this.workspaceId$),
          concatMap(([, workspaceId]) => {
            if (isNull(workspaceId)) {
              return EMPTY;
            }

            return this._workspaceApiService.updateWorkspaceThumbnail(
              environment.clientId,
              workspaceId,
              { fileId: event.payload.fileId, fileUrl: event.payload.fileUrl }
            );
          })
        )
      )
    );

  private readonly _handleAddNodeSuccess = this.effect<AddNodeSuccessEvent>(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$),
        concatMap(([, workspaceId]) => {
          if (isNull(workspaceId)) {
            return EMPTY;
          }

          return this._applicationApiService.createApplication2(
            environment.clientId,
            {
              ...event.payload,
              workspaceId,
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateNodeSuccess =
    this.effect<UpdateNodeSuccessEvent>(
      concatMap((event) =>
        of(null).pipe(
          withLatestFrom(this.workspaceId$),
          concatMap(([, workspaceId]) => {
            if (isNull(workspaceId)) {
              return EMPTY;
            }

            this.patchSelected({
              id: event.payload.id,
              changes: event.payload.changes,
            });

            return this._applicationApiService.updateApplication2(
              environment.clientId,
              workspaceId,
              event.payload.id,
              event.payload.changes
            );
          })
        )
      )
    );

  private readonly _handleUpdateNodeThumbnailSuccess =
    this.effect<UpdateNodeThumbnailSuccessEvent>(
      concatMap((event) =>
        of(null).pipe(
          withLatestFrom(this.workspaceId$),
          concatMap(([, workspaceId]) => {
            if (isNull(workspaceId)) {
              return EMPTY;
            }

            this.patchSelected({
              id: event.payload.id,
              changes: {
                thumbnailUrl: event.payload.fileUrl,
              },
            });

            return this._applicationApiService.updateApplicationThumbnail2(
              environment.clientId,
              workspaceId,
              event.payload.id,
              { fileId: event.payload.fileId, fileUrl: event.payload.fileUrl }
            );
          })
        )
      )
    );

  private readonly _handleDeleteNodeSuccess =
    this.effect<DeleteNodeSuccessEvent>(
      concatMap((event) =>
        of(null).pipe(
          withLatestFrom(this.workspaceId$),
          concatMap(([, workspaceId]) => {
            if (isNull(workspaceId)) {
              return EMPTY;
            }

            this.clearSelected(event.payload);

            return this._applicationApiService.deleteApplication2(
              environment.clientId,
              workspaceId,
              event.payload
            );
          })
        )
      )
    );

  private readonly _handleServerGraphUpdate = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._eventApiService
        .onServerCreate(workspaceId, ['updateWorkspaceSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) =>
            this._drawerStore.handleGraphUpdated(event['payload'].changes)
          )
        );
    })
  );

  private readonly _handleServerGraphThumbnailUpdate = this.effect<
    Option<string>
  >(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._eventApiService
        .onServerCreate(workspaceId, ['updateWorkspaceThumbnailSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) =>
            this._drawerStore.handleGraphThumbnailUpdated(
              event['payload'].fileId,
              event['payload'].fileUrl
            )
          )
        );
    })
  );

  private readonly _handleServerGraphDelete = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._eventApiService
        .onServerCreate(workspaceId, ['deleteWorkspaceSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap(() => this._router.navigate(['/lobby']))
        );
    })
  );

  private readonly _handleServerNodeCreate = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._eventApiService
        .onServerCreate(workspaceId, ['createApplicationSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => this._drawerStore.handleNodeAdded(event['payload']))
        );
    })
  );

  private readonly _handleServerNodeUpdate = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._eventApiService
        .onServerCreate(workspaceId, ['updateApplicationSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            this.patchSelected({
              id: event['payload'].id,
              changes: event['payload'].changes,
            });
            this._drawerStore.handleNodeUpdated(
              event['payload'].id,
              event['payload'].changes
            );
          })
        );
    })
  );

  private readonly _handleServerNodeThumbnailUpdate = this.effect<
    Option<string>
  >(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._eventApiService
        .onServerCreate(workspaceId, ['updateApplicationThumbnailSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            this.patchSelected({
              id: event['payload'].id,
              changes: {
                thumbnailUrl: event['payload'].fileUrl,
              },
            });
            this._drawerStore.handleNodeThumbnailUpdated(
              event['payload'].id,
              event['payload'].fileId,
              event['payload'].fileUrl
            );
          })
        );
    })
  );

  private readonly _handleServerNodeDelete = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._eventApiService
        .onServerCreate(workspaceId, ['deleteApplicationSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            this.clearSelected(event['payload'].id);
            this._drawerStore.handleNodeRemoved(event['payload'].id);
          })
        );
    })
  );

  readonly setSelected = this.updater<OneTapNodeEvent>((state, event) => ({
    ...state,
    selected: event.payload,
  }));

  constructor() {
    super(initialState);
  }

  ngOnInit() {
    this._handleUpdateGraphSuccess(
      this._drawerStore.event$.pipe(filter(isUpdateGraphSuccessEvent))
    );
    this._handleUpdateGraphThumbnailSuccess(
      this._drawerStore.event$.pipe(filter(isUpdateGraphThumbnailSuccessEvent))
    );
    this._handleAddNodeSuccess(
      this._drawerStore.event$.pipe(filter(isAddNodeSuccessEvent))
    );
    this._handleUpdateNodeSuccess(
      this._drawerStore.event$.pipe(filter(isUpdateNodeSuccessEvent))
    );
    this._handleUpdateNodeThumbnailSuccess(
      this._drawerStore.event$.pipe(filter(isUpdateNodeThumbnailSuccessEvent))
    );
    this._handleDeleteNodeSuccess(
      this._drawerStore.event$.pipe(filter(isDeleteNodeSuccessEvent))
    );
    this.setSelected(this._drawerStore.event$.pipe(filter(isOneTapNodeEvent)));

    this._handleServerNodeCreate(this.workspaceId$);
    this._handleServerNodeUpdate(this.workspaceId$);
    this._handleServerNodeThumbnailUpdate(this.workspaceId$);
    this._handleServerNodeDelete(this.workspaceId$);
    this._handleServerGraphUpdate(this.workspaceId$);
    this._handleServerGraphThumbnailUpdate(this.workspaceId$);
    this._handleServerGraphDelete(this.workspaceId$);
  }

  onApplicationActivate() {
    this.patchState({ isCreatingApplication: true });
  }

  onApplicationDeactivate() {
    this.patchState({ isCreatingApplication: false });
  }

  onApplicationUnselected() {
    this.patchState({ selected: null });
  }

  onAddNode(event: AddNodeDto) {
    this._drawerStore.addNode(event.data, event.options.position);
  }

  onUpdateGraph(changes: UpdateWorkspaceSubmit) {
    this._drawerStore.updateGraph(changes);
  }

  onDeleteGraph(graphId: string) {
    this._workspaceApiService
      .deleteWorkspace(environment.clientId, graphId)
      .subscribe(() => this._router.navigate(['/lobby']));
  }

  onUpdateGraphThumbnail(fileId: string, fileUrl: string) {
    this._drawerStore.updateGraphThumbnail(fileId, fileUrl);
  }

  onUpdateNode(nodeId: string, changes: UpdateApplicationSubmit) {
    this._drawerStore.updateNode(nodeId, changes);
  }

  onUpdateNodeThumbnail(nodeId: string, fileId: string, fileUrl: string) {
    this._drawerStore.updateNodeThumbnail(nodeId, fileId, fileUrl);
  }

  onRemoveNode(nodeId: string) {
    this._drawerStore.removeNode(nodeId);
  }
}

import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { ComponentStore, provideComponentStore } from '@ngrx/component-store';
import {
  concatMap,
  defer,
  EMPTY,
  filter,
  from,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { UpdateApplicationSubmit } from '../../application/components';
import { ApplicationApiService } from '../../application/services';
import { EventApiService, GraphApiService } from '../../drawer/services';
import {
  AddNodeSuccessEvent,
  DeleteNodeSuccessEvent,
  Drawer,
  isAddNodeSuccessEvent,
  isClickEvent,
  isDeleteNodeSuccessEvent,
  isOneTapNodeEvent,
  isUpdateGraphSuccessEvent,
  isUpdateGraphThumbnailSuccessEvent,
  isUpdateNodeSuccessEvent,
  isUpdateNodeThumbnailSuccessEvent,
  isViewNodeEvent,
  Node,
  OneTapNodeEvent,
  UpdateGraphSuccessEvent,
  UpdateGraphThumbnailSuccessEvent,
  UpdateNodeSuccessEvent,
  UpdateNodeThumbnailSuccessEvent,
  ViewNodeEvent,
} from '../../drawer/utils';
import {
  BackgroundImageMoveDirective,
  BackgroundImageZoomDirective,
} from '../../shared/directives';
import { isNotNull, isNull, Option } from '../../shared/utils';
import { UpdateWorkspaceSubmit } from '../components';
import {
  ActiveApplicationComponent,
  AddNodeDto,
  ApplicationDockComponent,
  WorkspaceDockComponent,
} from '../sections';
import { WorkspaceApiService } from '../services';
import { WorkspaceDrawerStore } from '../stores';
import { WorkspaceGraphData, WorkspaceNodeData } from '../utils';

interface ViewModel {
  isCreatingApplication: boolean;
  workspaceId: Option<string>;
  selected: Option<Node<WorkspaceNodeData>>;
}

const initialState: ViewModel = {
  isCreatingApplication: false,
  workspaceId: null,
  selected: null,
};

@Component({
  selector: 'pg-workspace-page',
  template: `
    <div
      id="cy"
      class="bp-bg-bricks h-screen"
      #drawerElement
      pgBackgroundImageZoom
      [pgZoomValue]="(zoomSize$ | ngrxPush) ?? '15%'"
      pgBackgroundImageMove
      [pgPanValue]="(panDrag$ | ngrxPush) ?? { x: '0', y: '0' }"
    ></div>

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
      *ngIf="workspace$ | ngrxPush as workspace"
      [pgActive]="
        (isCreatingApplication$ | ngrxPush)
          ? { thumbnailUrl: 'assets/generic/application.png' }
          : null
      "
      [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
      (pgAddNode)="onAddNode(workspace.id, $event)"
      (pgDeactivate)="onApplicationDeactivate()"
    ></pg-active-application>
  `,
  standalone: true,
  imports: [
    CommonModule,
    LetModule,
    PushModule,
    WorkspaceDockComponent,
    ApplicationDockComponent,
    ActiveApplicationComponent,
    BackgroundImageZoomDirective,
    BackgroundImageMoveDirective,
  ],
  providers: [provideComponentStore(WorkspaceDrawerStore)],
})
export class WorkspacePageComponent
  extends ComponentStore<ViewModel>
  implements OnInit, AfterViewInit
{
  private readonly _router = inject(Router);
  private readonly _eventApiService = inject(EventApiService);
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _applicationApiService = inject(ApplicationApiService);
  private readonly _graphApiService = inject(GraphApiService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _workspaceDrawerStore = inject(WorkspaceDrawerStore);

  readonly isCreatingApplication$ = this.select(
    ({ isCreatingApplication }) => isCreatingApplication
  );
  readonly selected$ = this.select(({ selected }) => selected);
  readonly workspaceId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId'))
  );
  readonly workspace$ = this._workspaceDrawerStore.graph$;
  readonly drawerClick$ = this._workspaceDrawerStore.event$.pipe(
    filter(isClickEvent)
  );
  readonly zoomSize$ = this._workspaceDrawerStore.zoomSize$;
  readonly panDrag$ = this._workspaceDrawerStore.panDrag$;

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';
  @ViewChild('drawerElement')
  pgDrawerElementRef: ElementRef<HTMLElement> | null = null;

  private patchSelected = this.updater<{
    id: string;
    changes: Partial<WorkspaceGraphData>;
  }>((state, { id, changes }) => {
    if (isNull(state.selected) || state.selected.id !== id) {
      return state;
    }

    return {
      ...state,
      selected: { ...state.selected, ...changes },
    };
  });

  private clearSelected = this.updater<string>((state, id) => {
    if (isNull(state.selected) || state.selected.id !== id) {
      return state;
    }

    return {
      ...state,
      selected: null,
    };
  });

  private readonly _handleViewNode = this.effect<ViewNodeEvent>(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$),
        tap(([, workspaceId]) => {
          if (isNotNull(workspaceId)) {
            this._router.navigate([
              '/workspaces',
              workspaceId,
              'applications',
              event.payload,
            ]);
          }
        })
      )
    )
  );

  private readonly _handleUpdateGraphSuccess = this.effect<
    UpdateGraphSuccessEvent<WorkspaceGraphData>
  >(
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

  private readonly _handleAddNodeSuccess = this.effect<
    AddNodeSuccessEvent<WorkspaceNodeData>
  >(
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
              id: event.payload.id,
              name: event.payload.data.name,
              kind: event.payload.data.kind,
              workspaceId,
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateNodeSuccess = this.effect<
    UpdateNodeSuccessEvent<WorkspaceNodeData>
  >(
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
            this._workspaceDrawerStore.handleGraphUpdated(
              event['payload'].changes
            )
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
            this._workspaceDrawerStore.handleGraphThumbnailUpdated(
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
          tap((event) =>
            this._workspaceDrawerStore.handleNodeAdded({
              id: event['payload'].id,
              data: {
                kind: event['payload'].kind,
                name: event['payload'].name,
                thumbnailUrl: event['payload'].thumbnailUrl,
                workspaceId: event['payload'].workspaceId,
              },
            })
          )
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
            this._workspaceDrawerStore.handleNodeUpdated(
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
            this._workspaceDrawerStore.handleNodeThumbnailUpdated(
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
            this._workspaceDrawerStore.handleNodeRemoved(event['payload'].id);
          })
        );
    })
  );

  private readonly _loadDrawer = this.effect<{
    workspaceId: Option<string>;
    drawerElement: HTMLElement;
  }>(
    concatMap(({ workspaceId, drawerElement }) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._graphApiService.getGraph<WorkspaceGraphData, WorkspaceNodeData>(
            workspaceId
          )
        ).pipe(
          tap((graph) => {
            if (graph) {
              const drawer = new Drawer(graph, [], drawerElement);
              drawer.initialize();
              this._workspaceDrawerStore.setDrawer(drawer);
            }
          })
        )
      );
    })
  );

  readonly setSelected = this.updater<OneTapNodeEvent<WorkspaceNodeData>>(
    (state, event) => ({
      ...state,
      selected: event.payload,
    })
  );

  constructor() {
    super(initialState);
  }

  ngOnInit() {
    this._handleViewNode(
      this._workspaceDrawerStore.event$.pipe(filter(isViewNodeEvent))
    );
    this._handleUpdateGraphSuccess(
      this._workspaceDrawerStore.event$.pipe(filter(isUpdateGraphSuccessEvent))
    );
    this._handleUpdateGraphThumbnailSuccess(
      this._workspaceDrawerStore.event$.pipe(
        filter(isUpdateGraphThumbnailSuccessEvent)
      )
    );
    this._handleAddNodeSuccess(
      this._workspaceDrawerStore.event$.pipe(filter(isAddNodeSuccessEvent))
    );
    this._handleUpdateNodeSuccess(
      this._workspaceDrawerStore.event$.pipe(filter(isUpdateNodeSuccessEvent))
    );
    this._handleUpdateNodeThumbnailSuccess(
      this._workspaceDrawerStore.event$.pipe(
        filter(isUpdateNodeThumbnailSuccessEvent)
      )
    );
    this._handleDeleteNodeSuccess(
      this._workspaceDrawerStore.event$.pipe(filter(isDeleteNodeSuccessEvent))
    );
    this.setSelected(
      this._workspaceDrawerStore.event$.pipe(
        filter(isOneTapNodeEvent<WorkspaceGraphData, WorkspaceNodeData>)
      )
    );

    // when there's an active and a click on the drawer occurs, add the node

    this._handleServerNodeCreate(this.workspaceId$);
    this._handleServerNodeUpdate(this.workspaceId$);
    this._handleServerNodeThumbnailUpdate(this.workspaceId$);
    this._handleServerNodeDelete(this.workspaceId$);
    this._handleServerGraphUpdate(this.workspaceId$);
    this._handleServerGraphThumbnailUpdate(this.workspaceId$);
    this._handleServerGraphDelete(this.workspaceId$);
  }

  async ngAfterViewInit() {
    if (isNotNull(this.pgDrawerElementRef)) {
      const drawerElement = this.pgDrawerElementRef.nativeElement;

      this._loadDrawer(
        this.select(this.workspaceId$, (workspaceId) => ({
          workspaceId,
          drawerElement,
        }))
      );
    }
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

  onAddNode(workspaceId: string, event: AddNodeDto) {
    this._workspaceDrawerStore.addNode(
      { id: event.data.id, data: { ...event.data, workspaceId } },
      event.options.position
    );
  }

  onUpdateGraph(changes: UpdateWorkspaceSubmit) {
    this._workspaceDrawerStore.updateGraph(changes);
  }

  onDeleteGraph(graphId: string) {
    this._workspaceApiService
      .deleteWorkspace(environment.clientId, graphId)
      .subscribe(() => this._router.navigate(['/lobby']));
  }

  onUpdateGraphThumbnail(fileId: string, fileUrl: string) {
    this._workspaceDrawerStore.updateGraphThumbnail(fileId, fileUrl);
  }

  onUpdateNode(nodeId: string, changes: UpdateApplicationSubmit) {
    this._workspaceDrawerStore.updateNode(nodeId, changes);
  }

  onUpdateNodeThumbnail(nodeId: string, fileId: string, fileUrl: string) {
    this._workspaceDrawerStore.updateNodeThumbnail(nodeId, fileId, fileUrl);
  }

  onRemoveNode(nodeId: string) {
    this._workspaceDrawerStore.removeNode(nodeId);
  }
}

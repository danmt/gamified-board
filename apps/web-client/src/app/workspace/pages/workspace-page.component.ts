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
import { UpdateApplicationSubmit, UpdateWorkspaceSubmit } from '../components';
import {
  ActiveApplicationComponent,
  AddApplicationNodeDto,
  ApplicationDockComponent,
  WorkspaceDockComponent,
} from '../sections';
import { WorkspaceGraphApiService } from '../services';
import { WorkspaceDrawerStore } from '../stores';
import {
  WorkspaceGraphData,
  WorkspaceGraphKind,
  WorkspaceNode,
  WorkspaceNodeData,
  WorkspaceNodeKinds,
  WorkspaceNodesData,
} from '../utils';

interface ViewModel {
  isCreatingApplication: boolean;
  workspaceId: Option<string>;
  selected: Option<WorkspaceNode>;
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
      (pgAddNode)="onAddApplicationNode(workspace.id, $event)"
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
  private readonly _workspaceGraphApiService = inject(WorkspaceGraphApiService);
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
    changes: Partial<WorkspaceNodeData>;
  }>((state, { id, changes }) => {
    if (isNull(state.selected) || state.selected.id !== id) {
      return state;
    }

    return {
      ...state,
      selected: {
        ...state.selected,
        data: {
          ...state.selected.data,
          ...changes,
        },
      },
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
    UpdateGraphSuccessEvent<WorkspaceGraphKind, WorkspaceGraphData>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$),
        concatMap(([, workspaceId]) => {
          if (isNull(workspaceId)) {
            return EMPTY;
          }

          return this._workspaceGraphApiService.updateGraph(
            environment.clientId,
            workspaceId,
            {
              changes: event.payload.changes,
              referenceIds: [workspaceId],
              kind: event.payload.kind,
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateGraphThumbnailSuccess = this.effect<
    UpdateGraphThumbnailSuccessEvent<WorkspaceGraphKind>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$),
        concatMap(([, workspaceId]) => {
          if (isNull(workspaceId)) {
            return EMPTY;
          }

          return this._workspaceGraphApiService.updateGraphThumbnail(
            environment.clientId,
            workspaceId,
            {
              fileId: event.payload.fileId,
              fileUrl: event.payload.fileUrl,
              kind: event.payload.kind,
              referenceIds: [workspaceId],
            }
          );
        })
      )
    )
  );

  private readonly _handleAddNodeSuccess = this.effect<
    AddNodeSuccessEvent<
      WorkspaceNodeKinds,
      WorkspaceNodeData,
      WorkspaceNodesData
    >
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$),
        concatMap(([, workspaceId]) => {
          if (isNull(workspaceId)) {
            return EMPTY;
          }

          return this._workspaceGraphApiService.createNode(
            environment.clientId,
            {
              ...event.payload.data,
              id: event.payload.id,
              parentIds: [workspaceId],
              kind: event.payload.kind,
              graphId: workspaceId,
              referenceIds: [workspaceId, event.payload.id],
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateNodeSuccess = this.effect<
    UpdateNodeSuccessEvent<
      WorkspaceNodeKinds,
      WorkspaceNodeData,
      WorkspaceNodesData
    >
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
            changes: event.payload.data,
          });

          return this._workspaceGraphApiService.updateNode(
            environment.clientId,
            event.payload.id,
            {
              changes: event.payload.data,
              graphId: workspaceId,
              parentIds: [workspaceId],
              referenceIds: [workspaceId, event.payload.id],
              kind: event.payload.kind,
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateNodeThumbnailSuccess = this.effect<
    UpdateNodeThumbnailSuccessEvent<WorkspaceNodeKinds>
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
            changes: {
              thumbnailUrl: event.payload.fileUrl,
            },
          });

          return this._workspaceGraphApiService.updateNodeThumbnail(
            environment.clientId,
            event.payload.id,
            {
              fileId: event.payload.fileId,
              fileUrl: event.payload.fileUrl,
              graphId: workspaceId,
              parentIds: [workspaceId],
              referenceIds: [workspaceId, event.payload.id],
              kind: event.payload.kind,
            }
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

            this.clearSelected(event.payload.id);

            return this._workspaceGraphApiService.deleteNode(
              environment.clientId,
              event.payload.id,
              {
                graphId: workspaceId,
                kind: event.payload.kind,
                parentIds: [workspaceId],
                referenceIds: [workspaceId, event.payload.id],
              }
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

      return this._workspaceGraphApiService
        .listen(workspaceId, [
          'updateGraphSuccess',
          'updateGraphThumbnailSuccess',
        ])
        .pipe(
          tap((event) => {
            this.patchSelected({
              id: event['payload'].id,
              changes: event['payload'].changes,
            });

            if (event['clientId'] !== environment.clientId) {
              this._workspaceDrawerStore.handleGraphUpdated(
                event['payload'].changes
              );
            }
          })
        );
    })
  );

  private readonly _handleServerGraphDelete = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._workspaceGraphApiService
        .listen(workspaceId, ['deleteGraphSuccess'])
        .pipe(
          tap((event) => {
            this.clearSelected(event['payload']);

            if (event['clientId'] !== environment.clientId) {
              this._workspaceDrawerStore.handleNodeRemoved(event['payload']);
              this._router.navigate(['/lobby']);
            }
          })
        );
    })
  );

  private readonly _handleServerNodeCreate = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._workspaceGraphApiService
        .listen(workspaceId, ['createNodeSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            const { id, kind, ...payload } = event['payload'];
            this._workspaceDrawerStore.handleNodeAdded({
              id,
              data: payload,
              kind,
            });
          })
        );
    })
  );

  private readonly _handleServerNodeUpdate = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._workspaceGraphApiService
        .listen(workspaceId, [
          'updateNodeSuccess',
          'updateNodeThumbnailSuccess',
        ])
        .pipe(
          tap((event) => {
            this.patchSelected({
              id: event['payload'].id,
              changes: event['payload'].changes,
            });

            if (event['clientId'] !== environment.clientId) {
              this._workspaceDrawerStore.handleNodeUpdated(
                event['payload'].id,
                event['payload'].changes
              );
            }
          })
        );
    })
  );

  private readonly _handleServerNodeDelete = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._workspaceGraphApiService
        .listen(workspaceId, ['deleteNodeSuccess'])
        .pipe(
          tap((event) => {
            this.clearSelected(event['payload'].id);

            if (event['clientId'] !== environment.clientId) {
              this._workspaceDrawerStore.handleNodeRemoved(event['payload'].id);
            }
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
        from(this._workspaceGraphApiService.getGraph(workspaceId)).pipe(
          tap((graph) => {
            if (graph) {
              const drawer = new Drawer(graph, graph.nodes, [], drawerElement);

              drawer.initialize();
              this._workspaceDrawerStore.setDrawer(drawer);

              this._handleServerNodeCreate(workspaceId);
              this._handleServerNodeUpdate(workspaceId);
              this._handleServerNodeDelete(workspaceId);
              this._handleServerGraphUpdate(workspaceId);
              this._handleServerGraphDelete(workspaceId);
            }
          })
        )
      );
    })
  );

  readonly setSelected = this.updater<
    OneTapNodeEvent<WorkspaceNodeKinds, WorkspaceNodeData, WorkspaceNodesData>
  >((state, event) => ({
    ...state,
    selected: event.payload,
  }));

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
      this._workspaceDrawerStore.event$.pipe(filter(isOneTapNodeEvent))
    );
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

  onAddApplicationNode(
    workspaceId: string,
    { payload, options }: AddApplicationNodeDto
  ) {
    this._workspaceDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
        },
      },
      options.position
    );
  }

  onUpdateGraph(changes: UpdateWorkspaceSubmit) {
    this._workspaceDrawerStore.updateGraph(changes);
  }

  onDeleteGraph(graphId: string) {
    this._workspaceGraphApiService
      .deleteGraph(environment.clientId, graphId, {
        kind: 'workspace',
        referenceIds: [graphId],
      })
      .subscribe(() => this._router.navigate(['/lobby']));
  }

  onUpdateGraphThumbnail(fileId: string, fileUrl: string) {
    this._workspaceDrawerStore.updateGraphThumbnail(fileId, fileUrl);
  }

  onUpdateNode(nodeId: string, changes: UpdateApplicationSubmit) {
    this._workspaceDrawerStore.updateNode(nodeId, {
      kind: 'application',
      changes,
    });
  }

  onUpdateNodeThumbnail(nodeId: string, fileId: string, fileUrl: string) {
    this._workspaceDrawerStore.updateNodeThumbnail(nodeId, fileId, fileUrl);
  }

  onRemoveNode(nodeId: string) {
    this._workspaceDrawerStore.removeNode(nodeId);
  }
}

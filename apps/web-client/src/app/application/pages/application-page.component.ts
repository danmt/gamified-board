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
import {
  ComponentStore,
  provideComponentStore,
  tapResponse,
} from '@ngrx/component-store';
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
import { UpdateCollectionSubmit } from '../../collection/components';
import { DrawerStore } from '../../drawer/stores';
import {
  AddEdgeSuccessEvent,
  AddNodeSuccessEvent,
  DeleteEdgeSuccessEvent,
  DeleteNodeSuccessEvent,
  Drawer,
  isAddEdgeSuccessEvent,
  isAddNodeSuccessEvent,
  isClickEvent,
  isDeleteEdgeSuccessEvent,
  isDeleteNodeSuccessEvent,
  isOneTapNodeEvent,
  isUpdateGraphSuccessEvent,
  isUpdateGraphThumbnailSuccessEvent,
  isUpdateNodeSuccessEvent,
  isUpdateNodeThumbnailSuccessEvent,
  isViewNodeEvent,
  OneTapNodeEvent,
  patchNode,
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
import { GetActiveTypes, isNotNull, isNull, Option } from '../../shared/utils';
import {
  ActiveCollectionComponent,
  ActiveCollectionData,
  ActiveFieldComponent,
  ActiveFieldData,
  ActiveInstructionComponent,
  ActiveInstructionData,
  AddCollectionNodeDto,
  AddFieldNodeDto,
  AddInstructionNodeDto,
  ApplicationDockComponent,
  ApplicationsInventoryDirective,
  CollectionDockComponent,
  FieldDockComponent,
  InstructionDockComponent,
  LeftDockComponent,
  RightDockComponent,
} from '../sections';
import {
  ApplicationApiService,
  ApplicationGraphApiService,
  InstallApplicationDto,
} from '../services';
import {
  ApplicationCheckpoint,
  ApplicationGraphData,
  ApplicationGraphKind,
  ApplicationNode,
  ApplicationNodeData,
  ApplicationNodeKinds,
  ApplicationNodesData,
  PartialApplicationNode,
} from '../utils';
import {
  applicationCanConnectFunction,
  applicationNodeLabelFunction,
} from '../utils/methods';

type ActiveType = GetActiveTypes<{
  collection: ActiveCollectionData;
  field: ActiveFieldData;
  instruction: ActiveInstructionData;
}>;

interface ViewModel {
  active: Option<ActiveType>;
  applicationId: Option<string>;
  selected: Option<ApplicationNode>;
  installations: { id: string; data: ApplicationCheckpoint }[];
}

const initialState: ViewModel = {
  active: null,
  applicationId: null,
  selected: null,
  installations: [],
};

@Component({
  selector: 'pg-application-page',
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

    <ng-container *ngrxLet="application$; let application">
      <ng-container *ngrxLet="selected$; let selected">
        <pg-application-dock
          *ngIf="application !== null && selected === null"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgApplication]="application"
          (pgActivateCollection)="
            setActive({
              kind: 'collection',
              data: {
                thumbnailUrl: 'assets/generic/collection.png'
              }
            })
          "
          (pgActivateInstruction)="
            setActive({
              kind: 'instruction',
              data: {
                thumbnailUrl: 'assets/generic/instruction.png'
              }
            })
          "
          (pgUpdateApplication)="onUpdateGraph($event.changes)"
          (pgUpdateApplicationThumbnail)="
            onUpdateGraphThumbnail($event.fileId, $event.fileUrl)
          "
          (pgDeleteApplication)="
            onDeleteGraph(application.data.workspaceId, $event, 'application')
          "
        ></pg-application-dock>

        <pg-collection-dock
          *ngIf="selected !== null && selected.kind === 'collection'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgCollection]="selected"
          (pgCollectionUnselected)="onUnselect()"
          (pgUpdateCollection)="
            onUpdateNode($event.id, 'collection', $event.changes)
          "
          (pgUpdateCollectionThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteCollection)="onRemoveNode($event)"
        ></pg-collection-dock>

        <pg-instruction-dock
          *ngIf="selected !== null && selected.kind === 'instruction'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgInstruction]="selected"
          (pgInstructionUnselected)="onUnselect()"
          (pgUpdateInstruction)="
            onUpdateNode($event.id, 'instruction', $event.changes)
          "
          (pgUpdateInstructionThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteInstruction)="onRemoveNode($event)"
        ></pg-instruction-dock>

        <pg-field-dock
          *ngIf="selected !== null && selected.kind === 'field'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgField]="selected"
          (pgFieldUnselected)="onUnselect()"
          (pgUpdateField)="onUpdateNode($event.id, 'field', $event.changes)"
          (pgUpdateFieldThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteField)="onRemoveNode($event)"
        ></pg-field-dock>
      </ng-container>

      <pg-right-dock
        class="fixed bottom-0 right-0"
        *ngIf="application !== null"
        (pgActivateField)="
          setActive({
            kind: 'field',
            data: {
              thumbnailUrl: 'assets/generic/field.png'
            }
          })
        "
        (pgToggleApplicationsInventoryModal)="applicationsInventory.toggle()"
      >
        <ng-container
          pgApplicationsInventory
          #applicationsInventory="modal"
          [pgInstallations]="(installations$ | ngrxPush) ?? []"
          (pgInstallApplication)="
            onInstallApplication(
              application.data.workspaceId,
              application.id,
              $event
            )
          "
        ></ng-container>
      </pg-right-dock>

      <pg-left-dock
        *ngrxLet="drawMode$; let drawMode"
        class="fixed bottom-0 left-0"
        (pgToggleDrawMode)="onSetDrawMode(!drawMode)"
      ></pg-left-dock>

      <ng-container *ngrxLet="active$; let active">
        <pg-active-collection
          *ngIf="
            application !== null &&
            active !== null &&
            active.kind === 'collection'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddCollectionNode(
              application.data.workspaceId,
              application.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-collection>

        <pg-active-instruction
          *ngIf="
            application !== null &&
            active !== null &&
            active.kind === 'instruction'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddInstructionNode(
              application.data.workspaceId,
              application.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-instruction>

        <pg-active-field
          *ngIf="
            application !== null && active !== null && active.kind === 'field'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddFieldNode(application.data.workspaceId, application.id, $event)
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-field>
      </ng-container>
    </ng-container>
  `,
  standalone: true,
  imports: [
    CommonModule,
    LetModule,
    PushModule,
    ApplicationDockComponent,
    CollectionDockComponent,
    InstructionDockComponent,
    FieldDockComponent,
    LeftDockComponent,
    RightDockComponent,
    ActiveCollectionComponent,
    ActiveInstructionComponent,
    ActiveFieldComponent,
    ApplicationsInventoryDirective,
    BackgroundImageZoomDirective,
    BackgroundImageMoveDirective,
  ],
  providers: [provideComponentStore(DrawerStore)],
})
export class ApplicationPageComponent
  extends ComponentStore<ViewModel>
  implements OnInit, AfterViewInit
{
  private readonly _router = inject(Router);
  private readonly _applicationApiService = inject(ApplicationApiService);
  private readonly _applicationGraphApiService = inject(
    ApplicationGraphApiService
  );
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _applicationDrawerStore = inject(
    DrawerStore<
      ApplicationNodeKinds,
      ApplicationNodeData,
      ApplicationNodesData,
      ApplicationGraphKind,
      ApplicationGraphData
    >
  );

  readonly active$ = this.select(({ active }) => active);
  readonly selected$ = this.select(({ selected }) => selected);
  readonly installations$ = this.select(({ installations }) => installations);
  readonly workspaceId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId'))
  );
  readonly applicationId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('applicationId'))
  );
  readonly application$ = this._applicationDrawerStore.graph$;
  readonly drawerClick$ = this._applicationDrawerStore.event$.pipe(
    filter(isClickEvent)
  );
  readonly zoomSize$ = this._applicationDrawerStore.zoomSize$;
  readonly panDrag$ = this._applicationDrawerStore.panDrag$;
  readonly drawMode$ = this._applicationDrawerStore.drawMode$;

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';
  @ViewChild('drawerElement')
  pgDrawerElementRef: ElementRef<HTMLElement> | null = null;

  private patchSelected = this.updater<PartialApplicationNode>(
    (state, payload) => {
      if (
        isNull(state.selected) ||
        state.selected.id !== payload.id ||
        state.selected.kind === payload.kind
      ) {
        return state;
      }

      return {
        ...state,
        selected: patchNode(state.selected, payload.data),
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

  readonly setSelected = this.updater<
    OneTapNodeEvent<
      ApplicationNodeKinds,
      ApplicationNodeData,
      ApplicationNodesData
    >
  >((state, event) => ({
    ...state,
    selected: event.payload,
  }));

  readonly setActive = this.updater<Option<ActiveType>>((state, active) => ({
    ...state,
    active,
  }));

  private readonly _handleViewNode = this.effect<
    ViewNodeEvent<ApplicationNodeKinds>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.applicationId$),
        tap(([, workspaceId, applicationId]) => {
          if (
            isNotNull(workspaceId) &&
            isNotNull(applicationId) &&
            event.payload.kind === 'instruction'
          ) {
            this._router.navigate([
              '/workspaces',
              workspaceId,
              'applications',
              applicationId,
              'instructions',
              event.payload.id,
            ]);
          }
        })
      )
    )
  );

  private readonly _handleUpdateGraphSuccess = this.effect<
    UpdateGraphSuccessEvent<ApplicationGraphKind, ApplicationGraphData>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.applicationId$),
        concatMap(([, workspaceId, applicationId]) => {
          if (isNull(workspaceId) || isNull(applicationId)) {
            return EMPTY;
          }

          return this._applicationGraphApiService.updateNode(
            environment.clientId,
            applicationId,
            {
              changes: event.payload.changes,
              referenceIds: [workspaceId, applicationId],
              kind: event.payload.kind,
              graphId: workspaceId,
              parentIds: [workspaceId],
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateGraphThumbnailSuccess = this.effect<
    UpdateGraphThumbnailSuccessEvent<ApplicationGraphKind>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.applicationId$),
        concatMap(([, workspaceId, applicationId]) => {
          if (isNull(workspaceId) || isNull(applicationId)) {
            return EMPTY;
          }

          return this._applicationGraphApiService.updateNodeThumbnail(
            environment.clientId,
            applicationId,
            {
              fileId: event.payload.fileId,
              fileUrl: event.payload.fileUrl,
              kind: event.payload.kind,
              referenceIds: [workspaceId, applicationId],
              graphId: workspaceId,
              parentIds: [workspaceId],
            }
          );
        })
      )
    )
  );

  private readonly _handleAddNodeSuccess = this.effect<
    AddNodeSuccessEvent<
      ApplicationNodeKinds,
      ApplicationNodeData,
      ApplicationNodesData
    >
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.applicationId$),
        concatMap(([, workspaceId, applicationId]) => {
          if (isNull(applicationId) || isNull(workspaceId)) {
            return EMPTY;
          }

          return this._applicationGraphApiService.createNode(
            environment.clientId,
            {
              ...event.payload.data,
              id: event.payload.id,
              parentIds: [workspaceId, applicationId],
              kind: event.payload.kind,
              graphId: applicationId,
              referenceIds: [applicationId, event.payload.id],
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateNodeSuccess = this.effect<
    UpdateNodeSuccessEvent<
      ApplicationNodeKinds,
      ApplicationNodeData,
      ApplicationNodesData
    >
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.applicationId$),
        concatMap(([, workspaceId, applicationId]) => {
          if (isNull(workspaceId) || isNull(applicationId)) {
            return EMPTY;
          }

          this.patchSelected(event.payload);

          return this._applicationGraphApiService.updateNode(
            environment.clientId,
            event.payload.id,
            {
              changes: event.payload.data,
              graphId: applicationId,
              parentIds: [workspaceId, applicationId],
              referenceIds: [applicationId, event.payload.id],
              kind: event.payload.kind,
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateNodeThumbnailSuccess = this.effect<
    UpdateNodeThumbnailSuccessEvent<ApplicationNodeKinds>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.applicationId$),
        concatMap(([, workspaceId, applicationId]) => {
          if (isNull(workspaceId) || isNull(applicationId)) {
            return EMPTY;
          }

          this.patchSelected({
            id: event.payload.id,
            kind: event.payload.kind,
            data: {
              thumbnailUrl: event.payload.fileUrl,
            },
          });

          return this._applicationGraphApiService.updateNodeThumbnail(
            environment.clientId,
            event.payload.id,
            {
              fileId: event.payload.fileId,
              fileUrl: event.payload.fileUrl,
              graphId: applicationId,
              parentIds: [workspaceId, applicationId],
              referenceIds: [applicationId, event.payload.id],
              kind: event.payload.kind,
            }
          );
        })
      )
    )
  );

  private readonly _handleDeleteNodeSuccess = this.effect<
    DeleteNodeSuccessEvent<ApplicationNodeKinds>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.applicationId$),
        concatMap(([, workspaceId, applicationId]) => {
          if (isNull(workspaceId) || isNull(applicationId)) {
            return EMPTY;
          }

          this.clearSelected(event.payload.id);

          return this._applicationGraphApiService.deleteNode(
            environment.clientId,
            event.payload.id,
            {
              graphId: applicationId,
              kind: event.payload.kind,
              parentIds: [workspaceId, applicationId],
              referenceIds: [applicationId, event.payload.id],
            }
          );
        })
      )
    )
  );

  private readonly _handleAddEdgeSuccess = this.effect<AddEdgeSuccessEvent>(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.applicationId$),
        concatMap(([, workspaceId, applicationId]) => {
          if (isNull(applicationId) || isNull(workspaceId)) {
            return EMPTY;
          }

          return this._applicationGraphApiService.createEdge(
            environment.clientId,
            {
              id: event.payload.id,
              source: event.payload.source,
              target: event.payload.target,
              parentIds: [workspaceId, applicationId],
              graphId: applicationId,
              referenceIds: [applicationId, event.payload.id],
            }
          );
        })
      )
    )
  );

  private readonly _handleDeleteEdgeSuccess =
    this.effect<DeleteEdgeSuccessEvent>(
      concatMap((event) =>
        of(null).pipe(
          withLatestFrom(this.workspaceId$, this.applicationId$),
          concatMap(([, workspaceId, applicationId]) => {
            if (isNull(applicationId) || isNull(workspaceId)) {
              return EMPTY;
            }

            return this._applicationGraphApiService.deleteEdge(
              environment.clientId,
              event.payload,
              {
                parentIds: [workspaceId, applicationId],
                graphId: applicationId,
                referenceIds: [applicationId, event.payload],
              }
            );
          })
        )
      )
    );

  private readonly _handleServerGraphUpdate = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return this._applicationGraphApiService
        .listen(workspaceId, applicationId, [
          'updateGraphSuccess',
          'updateGraphThumbnailSuccess',
        ])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            this._applicationDrawerStore.handleGraphUpdated(
              event['payload'].changes
            );
          })
        );
    })
  );

  private readonly _handleServerGraphDelete = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return this._applicationGraphApiService
        .listen(workspaceId, applicationId, ['deleteNodeSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            if (event['payload'].id === applicationId) {
              this._router.navigate(['/workspaces', workspaceId]);
            }
          })
        );
    })
  );

  private readonly _handleServerNodeCreate = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return this._applicationGraphApiService
        .listen(workspaceId, applicationId, ['createNodeSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            const { id, kind, ...payload } = event['payload'];
            this._applicationDrawerStore.handleNodeAdded({
              id,
              data: payload,
              kind,
            });
          })
        );
    })
  );

  private readonly _handleServerNodeUpdate = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return this._applicationGraphApiService
        .listen(workspaceId, applicationId, [
          'updateNodeSuccess',
          'updateNodeThumbnailSuccess',
        ])
        .pipe(
          tap((event) => {
            this.patchSelected({
              id: event['payload'].id,
              data: event['payload'].changes,
              kind: event['payload'].kind,
            });

            if (event['clientId'] !== environment.clientId) {
              if (event['payload'].id === applicationId) {
                this._applicationDrawerStore.handleGraphUpdated(
                  event['payload'].changes
                );
              } else {
                this._applicationDrawerStore.handleNodeUpdated(
                  event['payload'].id,
                  event['payload'].changes
                );
              }
            }
          })
        );
    })
  );

  private readonly _handleServerNodeDelete = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return this._applicationGraphApiService
        .listen(workspaceId, applicationId, ['deleteNodeSuccess'])
        .pipe(
          tap((event) => {
            if (event['payload'].id === applicationId) {
              this._router.navigate(['/workspaces', workspaceId]);
            }

            this.clearSelected(event['payload'].id);

            if (event['clientId'] !== environment.clientId) {
              this._applicationDrawerStore.handleNodeRemoved(
                event['payload'].id
              );
            }
          })
        );
    })
  );

  private readonly _handleServerEdgeCreate = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return this._applicationGraphApiService
        .listen(workspaceId, applicationId, ['createEdgeSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) =>
            this._applicationDrawerStore.handleEdgeAdded(event['payload'])
          )
        );
    })
  );

  private readonly _handleServerEdgeDelete = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return this._applicationGraphApiService
        .listen(workspaceId, applicationId, ['deleteEdgeSuccess'])
        .pipe(
          tap((event) => {
            if (event['payload'].id === applicationId) {
              this._router.navigate(['/workspaces', workspaceId]);
            }

            this.clearSelected(event['payload'].id);

            if (event['clientId'] !== environment.clientId) {
              this._applicationDrawerStore.handleEdgeRemoved(
                event['payload'].id
              );
            }
          })
        );
    })
  );

  private readonly _loadDrawer = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
    drawerElement: HTMLElement;
  }>(
    concatMap(({ workspaceId, applicationId, drawerElement }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._applicationGraphApiService.getGraph(workspaceId, applicationId)
        ).pipe(
          tap((graph) => {
            if (graph) {
              const drawer = new Drawer(
                graph,
                graph.nodes,
                [],
                drawerElement,
                applicationCanConnectFunction,
                applicationNodeLabelFunction
              );
              drawer.initialize();
              this._applicationDrawerStore.setDrawer(drawer);

              this._handleServerGraphUpdate({ workspaceId, applicationId });
              this._handleServerGraphDelete({ workspaceId, applicationId });
              this._handleServerNodeCreate({ workspaceId, applicationId });
              this._handleServerNodeUpdate({ workspaceId, applicationId });
              this._handleServerNodeDelete({ workspaceId, applicationId });
              this._handleServerEdgeCreate({ workspaceId, applicationId });
              this._handleServerEdgeDelete({ workspaceId, applicationId });
            }
          })
        )
      );
    })
  );

  private readonly _loadInstallations = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    concatMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._applicationApiService.getApplicationInstallations(
            workspaceId,
            applicationId
          )
        ).pipe(
          tapResponse(
            (installations) => this.patchState({ installations }),
            (error) => console.error(error)
          )
        )
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngOnInit() {
    this._handleViewNode(
      this._applicationDrawerStore.event$.pipe(filter(isViewNodeEvent))
    );
    this._handleUpdateGraphSuccess(
      this._applicationDrawerStore.event$.pipe(
        filter(isUpdateGraphSuccessEvent)
      )
    );
    this._handleUpdateGraphThumbnailSuccess(
      this._applicationDrawerStore.event$.pipe(
        filter(isUpdateGraphThumbnailSuccessEvent)
      )
    );
    this._handleAddNodeSuccess(
      this._applicationDrawerStore.event$.pipe(filter(isAddNodeSuccessEvent))
    );
    this._handleUpdateNodeSuccess(
      this._applicationDrawerStore.event$.pipe(filter(isUpdateNodeSuccessEvent))
    );
    this._handleUpdateNodeThumbnailSuccess(
      this._applicationDrawerStore.event$.pipe(
        filter(isUpdateNodeThumbnailSuccessEvent)
      )
    );
    this._handleDeleteNodeSuccess(
      this._applicationDrawerStore.event$.pipe(filter(isDeleteNodeSuccessEvent))
    );
    this.setSelected(
      this._applicationDrawerStore.event$.pipe(filter(isOneTapNodeEvent))
    );
    this._handleAddEdgeSuccess(
      this._applicationDrawerStore.event$.pipe(filter(isAddEdgeSuccessEvent))
    );
    this._handleDeleteEdgeSuccess(
      this._applicationDrawerStore.event$.pipe(filter(isDeleteEdgeSuccessEvent))
    );
    this._loadInstallations(
      this.select(
        this.workspaceId$,
        this.applicationId$,
        (workspaceId, applicationId) => ({
          workspaceId,
          applicationId,
        })
      )
    );
  }

  async ngAfterViewInit() {
    if (isNotNull(this.pgDrawerElementRef)) {
      const drawerElement = this.pgDrawerElementRef.nativeElement;

      this._loadDrawer(
        this.select(
          this.workspaceId$,
          this.applicationId$,
          (workspaceId, applicationId) => ({
            workspaceId,
            applicationId,
            drawerElement,
          })
        )
      );
    }
  }

  onInstallApplication(
    workspaceId: string,
    applicationId: string,
    payload: InstallApplicationDto
  ) {
    this._applicationApiService
      .installApplication(
        environment.clientId,
        workspaceId,
        applicationId,
        payload
      )
      .subscribe();
  }

  onUnselect() {
    this.patchState({ selected: null });
  }

  onSetDrawMode(drawMode: boolean) {
    this._applicationDrawerStore.setDrawMode(drawMode);
  }

  onAddInstructionNode(
    workspaceId: string,
    applicationId: string,
    { payload, options }: AddInstructionNodeDto
  ) {
    this._applicationDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          applicationId,
        },
      },
      options.position
    );
  }

  onAddCollectionNode(
    workspaceId: string,
    applicationId: string,
    { payload, options }: AddCollectionNodeDto
  ) {
    this._applicationDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          applicationId,
        },
      },
      options.position
    );
  }

  onAddFieldNode(
    workspaceId: string,
    applicationId: string,
    { payload, options }: AddFieldNodeDto
  ) {
    this._applicationDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          applicationId,
        },
      },
      options.position
    );
  }

  onUpdateGraph(changes: UpdateApplicationSubmit) {
    this._applicationDrawerStore.updateGraph(changes);
  }

  onDeleteGraph(
    workspaceId: string,
    graphId: string,
    kind: ApplicationGraphKind
  ) {
    this._applicationGraphApiService
      .deleteNode(environment.clientId, graphId, {
        graphId,
        kind,
        parentIds: [workspaceId],
        referenceIds: [workspaceId, graphId],
      })
      .subscribe();
  }

  onUpdateGraphThumbnail(fileId: string, fileUrl: string) {
    this._applicationDrawerStore.updateGraphThumbnail(fileId, fileUrl);
  }

  onUpdateNode(
    nodeId: string,
    kind: ApplicationNodeKinds,
    changes: UpdateCollectionSubmit
  ) {
    this._applicationDrawerStore.updateNode(nodeId, {
      changes,
      kind,
    });
  }

  onUpdateNodeThumbnail(nodeId: string, fileId: string, fileUrl: string) {
    this._applicationDrawerStore.updateNodeThumbnail(nodeId, fileId, fileUrl);
  }

  onRemoveNode(nodeId: string) {
    this._applicationDrawerStore.removeNode(nodeId);
  }
}

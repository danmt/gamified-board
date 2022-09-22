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
import { UpdateCollectionSubmit } from '../../collection/components';
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
import {
  ActiveCollectionComponent,
  ActiveInstructionComponent,
  AddCollectionNodeDto,
  AddInstructionNodeDto,
  ApplicationDockComponent,
  CollectionDockComponent,
  InstructionDockComponent,
  RightDockComponent,
} from '../sections';
import { ApplicationGraphApiService } from '../services';
import { ApplicationDrawerStore } from '../stores';
import { ApplicationGraphData, ApplicationNodeData } from '../utils';

interface ViewModel {
  isCreatingCollection: boolean;
  isCreatingInstruction: boolean;
  applicationId: Option<string>;
  selected: Option<Node<ApplicationNodeData>>;
}

const initialState: ViewModel = {
  isCreatingCollection: false,
  isCreatingInstruction: false,
  applicationId: null,
  selected: null,
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

    <ng-container *ngIf="(selected$ | ngrxPush) === null">
      <pg-application-dock
        *ngIf="application$ | ngrxPush as application"
        class="fixed bottom-0 -translate-x-1/2 left-1/2"
        [pgApplication]="application"
        (pgActivateCollection)="onActivateCollection()"
        (pgActivateInstruction)="onActivateInstruction()"
        (pgUpdateApplication)="onUpdateGraph($event.changes)"
        (pgUpdateApplicationThumbnail)="
          onUpdateGraphThumbnail($event.fileId, $event.fileUrl)
        "
        (pgDeleteApplication)="
          onDeleteGraph(application.data.workspaceId, $event, 'application')
        "
      ></pg-application-dock>
    </ng-container>

    <ng-container *ngIf="selected$ | ngrxPush as selected">
      <pg-collection-dock
        *ngIf="selected.kind === 'collection'"
        class="fixed bottom-0 -translate-x-1/2 left-1/2"
        [pgCollection]="selected"
        (pgCollectionUnselected)="onCollectionUnselected()"
        (pgUpdateCollection)="
          onUpdateNode($event.id, 'collection', $event.changes)
        "
        (pgUpdateCollectionThumbnail)="
          onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
        "
        (pgDeleteCollection)="onRemoveNode($event)"
      ></pg-collection-dock>

      <pg-instruction-dock
        *ngIf="selected.kind === 'instruction'"
        class="fixed bottom-0 -translate-x-1/2 left-1/2"
        [pgInstruction]="selected"
        (pgInstructionUnselected)="onInstructionUnselected()"
        (pgUpdateInstruction)="
          onUpdateNode($event.id, 'instruction', $event.changes)
        "
        (pgUpdateInstructionThumbnail)="
          onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
        "
        (pgDeleteInstruction)="onRemoveNode($event)"
      ></pg-instruction-dock>
    </ng-container>

    <pg-right-dock class="fixed bottom-0 right-0"></pg-right-dock>

    <pg-active-collection
      *ngIf="application$ | ngrxPush as application"
      [pgActive]="
        (isCreatingCollection$ | ngrxPush)
          ? { thumbnailUrl: 'assets/generic/collection.png' }
          : null
      "
      [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
      (pgAddNode)="
        onAddNode(application.data.workspaceId, application.id, $event)
      "
      (pgDeactivate)="onDeactivateCollection()"
    ></pg-active-collection>

    <pg-active-instruction
      *ngIf="application$ | ngrxPush as application"
      [pgActive]="
        (isCreatingInstruction$ | ngrxPush)
          ? { thumbnailUrl: 'assets/generic/instruction.png' }
          : null
      "
      [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
      (pgAddNode)="
        onAddNode(application.data.workspaceId, application.id, $event)
      "
      (pgDeactivate)="onDeactivateInstruction()"
    ></pg-active-instruction>
  `,
  standalone: true,
  imports: [
    CommonModule,
    LetModule,
    PushModule,
    ApplicationDockComponent,
    CollectionDockComponent,
    InstructionDockComponent,
    RightDockComponent,
    ActiveCollectionComponent,
    ActiveInstructionComponent,
    BackgroundImageZoomDirective,
    BackgroundImageMoveDirective,
  ],
  providers: [provideComponentStore(ApplicationDrawerStore)],
})
export class ApplicationPageComponent
  extends ComponentStore<ViewModel>
  implements OnInit, AfterViewInit
{
  private readonly _router = inject(Router);
  private readonly _applicationGraphApiService = inject(
    ApplicationGraphApiService
  );
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _applicationDrawerStore = inject(ApplicationDrawerStore);

  readonly isCreatingCollection$ = this.select(
    ({ isCreatingCollection }) => isCreatingCollection
  );
  readonly isCreatingInstruction$ = this.select(
    ({ isCreatingInstruction }) => isCreatingInstruction
  );
  readonly selected$ = this.select(({ selected }) => selected);
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

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';
  @ViewChild('drawerElement')
  pgDrawerElementRef: ElementRef<HTMLElement> | null = null;

  private patchSelected = this.updater<{
    id: string;
    changes: Partial<ApplicationGraphData>;
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

  readonly setSelected = this.updater<OneTapNodeEvent<ApplicationNodeData>>(
    (state, event) => ({
      ...state,
      selected: event.payload,
    })
  );

  private readonly _handleViewNode = this.effect<ViewNodeEvent>(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.applicationId$),
        tap(([, applicationId]) => {
          if (isNotNull(applicationId)) {
            this._router.navigate([
              '/applications',
              applicationId,
              'applications',
              event.payload,
            ]);
          }
        })
      )
    )
  );

  private readonly _handleUpdateGraphSuccess = this.effect<
    UpdateGraphSuccessEvent<ApplicationGraphData>
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

  private readonly _handleUpdateGraphThumbnailSuccess =
    this.effect<UpdateGraphThumbnailSuccessEvent>(
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
    AddNodeSuccessEvent<ApplicationNodeData>
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
    UpdateNodeSuccessEvent<ApplicationNodeData>
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
            changes: event.payload.changes,
          });

          return this._applicationGraphApiService.updateNode(
            environment.clientId,
            event.payload.id,
            {
              changes: event.payload.changes,
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

  private readonly _handleUpdateNodeThumbnailSuccess =
    this.effect<UpdateNodeThumbnailSuccessEvent>(
      concatMap((event) =>
        of(null).pipe(
          withLatestFrom(this.workspaceId$, this.applicationId$),
          concatMap(([, workspaceId, applicationId]) => {
            if (isNull(workspaceId) || isNull(applicationId)) {
              return EMPTY;
            }

            this.patchSelected({
              id: event.payload.id,
              changes: {
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

  private readonly _handleDeleteNodeSuccess =
    this.effect<DeleteNodeSuccessEvent>(
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
              changes: event['payload'].changes,
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
              const drawer = new Drawer(graph, [], drawerElement);
              drawer.initialize();
              this._applicationDrawerStore.setDrawer(drawer);

              this._handleServerGraphUpdate({ workspaceId, applicationId });
              this._handleServerGraphDelete({ workspaceId, applicationId });
              this._handleServerNodeCreate({ workspaceId, applicationId });
              this._handleServerNodeUpdate({ workspaceId, applicationId });
              this._handleServerNodeDelete({ workspaceId, applicationId });
            }
          })
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
      this._applicationDrawerStore.event$.pipe(
        filter(isOneTapNodeEvent<ApplicationGraphData, ApplicationNodeData>)
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

  onActivateCollection() {
    this.patchState({
      isCreatingCollection: true,
      isCreatingInstruction: false,
    });
  }

  onDeactivateCollection() {
    this.patchState({ isCreatingCollection: false });
  }

  onActivateInstruction() {
    this.patchState({
      isCreatingInstruction: true,
      isCreatingCollection: false,
    });
  }

  onDeactivateInstruction() {
    this.patchState({ isCreatingInstruction: false });
  }

  onCollectionUnselected() {
    this.patchState({ selected: null });
  }

  onInstructionUnselected() {
    this.patchState({ selected: null });
  }

  onAddNode(
    workspaceId: string,
    applicationId: string,
    event: AddInstructionNodeDto | AddCollectionNodeDto
  ) {
    const { id, kind, ...payload } = event.data;
    this._applicationDrawerStore.addNode(
      {
        id,
        data: { ...payload, workspaceId, applicationId },
        kind,
      },
      event.options.position
    );
  }

  onUpdateGraph(changes: UpdateApplicationSubmit) {
    this._applicationDrawerStore.updateGraph(changes);
  }

  onDeleteGraph(workspaceId: string, graphId: string, kind: string) {
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

  onUpdateNode(nodeId: string, kind: string, changes: UpdateCollectionSubmit) {
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

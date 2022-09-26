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
import { ApplicationsInventoryDirective } from '../../application/sections';
import {
  ApplicationApiService,
  InstallApplicationDto,
} from '../../application/services';
import { CollectionsStore, InstallationsStore } from '../../application/stores';
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
  OneTapNodeEvent,
  patchNode,
  UpdateGraphSuccessEvent,
  UpdateGraphThumbnailSuccessEvent,
  UpdateNodeSuccessEvent,
  UpdateNodeThumbnailSuccessEvent,
} from '../../drawer/utils';
import { UpdateInstructionSubmit } from '../../instruction/components';
import {
  BackgroundImageMoveDirective,
  BackgroundImageZoomDirective,
} from '../../shared/directives';
import { GetActiveTypes, isNotNull, isNull, Option } from '../../shared/utils';
import {
  ActiveApplicationComponent,
  ActiveApplicationData,
  ActiveCollectionComponent,
  ActiveCollectionData,
  ActiveSignerComponent,
  ActiveSignerData,
  ActiveSysvarComponent,
  ActiveSysvarData,
  AddApplicationNodeDto,
  AddCollectionNodeDto,
  AddSignerNodeDto,
  AddSysvarNodeDto,
  ApplicationDockComponent,
  CollectionDockComponent,
  CollectionsInventoryDirective,
  InstructionDockComponent,
  LeftDockComponent,
  RightDockComponent,
  SignerDockComponent,
  SysvarDockComponent,
  SysvarsInventoryDirective,
} from '../sections';
import { InstructionGraphApiService } from '../services';
import { InstructionCollectionsStore } from '../stores';
import {
  instructionCanConnectFunction,
  InstructionGraphData,
  InstructionGraphKind,
  InstructionNode,
  InstructionNodeData,
  InstructionNodeKinds,
  instructionNodeLabelFunction,
  InstructionNodesData,
  PartialInstructionNode,
} from '../utils';

type ActiveType = GetActiveTypes<{
  signer: ActiveSignerData;
  application: ActiveApplicationData;
  sysvar: ActiveSysvarData;
  collection: ActiveCollectionData;
}>;

interface ViewModel {
  instructionId: Option<string>;
  selected: Option<InstructionNode>;
  active: Option<ActiveType>;
}

const initialState: ViewModel = {
  instructionId: null,
  selected: null,
  active: null,
};

@Component({
  selector: 'pg-instruction-page',
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

    <ng-container *ngrxLet="instruction$; let instruction">
      <ng-container *ngrxLet="selected$; let selected">
        <pg-instruction-dock
          *ngIf="instruction !== null && selected === null"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgInstruction]="instruction"
          (pgActivateSigner)="
            setActive({
              kind: 'signer',
              data: { thumbnailUrl: 'assets/generic/signer.png' }
            })
          "
          (pgUpdateInstruction)="onUpdateGraph($event.changes)"
          (pgUpdateInstructionThumbnail)="
            onUpdateGraphThumbnail($event.fileId, $event.fileUrl)
          "
          (pgDeleteInstruction)="
            onDeleteGraph(
              instruction.data.workspaceId,
              instruction.data.applicationId,
              $event,
              'instruction'
            )
          "
        ></pg-instruction-dock>

        <pg-signer-dock
          *ngIf="selected !== null && selected.kind === 'signer'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgSigner]="selected"
          (pgSignerUnselected)="onUnselect()"
          (pgUpdateSigner)="onUpdateNode($event.id, 'signer', $event.changes)"
          (pgUpdateSignerThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteSigner)="onRemoveNode($event)"
        ></pg-signer-dock>

        <pg-application-dock
          *ngIf="selected !== null && selected.kind === 'application'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgApplication]="selected"
          (pgApplicationUnselected)="onUnselect()"
          (pgUpdateApplication)="
            onUpdateNode($event.id, 'application', $event.changes)
          "
          (pgUpdateApplicationThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteApplication)="onRemoveNode($event)"
        ></pg-application-dock>

        <pg-sysvar-dock
          *ngIf="selected !== null && selected.kind === 'sysvar'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgSysvar]="selected"
          (pgSysvarUnselected)="onUnselect()"
          (pgUpdateSysvar)="onUpdateNode($event.id, 'sysvar', $event.changes)"
          (pgUpdateSysvarThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteSysvar)="onRemoveNode($event)"
        ></pg-sysvar-dock>

        <pg-collection-dock
          *ngIf="selected !== null && selected.kind === 'collection'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgCollection]="selected"
          [pgInstructionCollections]="
            (instructionCollections$ | ngrxPush) ?? []
          "
          (pgCollectionUnselected)="onUnselect()"
          (pgUpdateCollection)="
            onUpdateNode($event.id, 'collection', $event.changes)
          "
          (pgUpdateCollectionThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteCollection)="onRemoveNode($event)"
        ></pg-collection-dock>
      </ng-container>

      <pg-right-dock
        class="fixed bottom-0 right-0"
        *ngIf="instruction !== null"
        (pgToggleApplicationsInventoryModal)="applicationsInventory.toggle()"
        (pgToggleSysvarsInventoryModal)="sysvarsInventory.toggle()"
      >
        <ng-container
          pgApplicationsInventory
          #applicationsInventory="modal"
          [pgInstallations]="(installations$ | ngrxPush) ?? []"
          (pgInstallApplication)="
            onInstallApplication(
              instruction.data.workspaceId,
              instruction.data.applicationId,
              $event
            )
          "
          (pgTapInstallation)="
            setActive({
              kind: 'application',
              data: {
                id: $event.id,
                name: $event.data.graph.data.name,
                thumbnailUrl: $event.data.graph.data.thumbnailUrl
              }
            })
          "
        ></ng-container>

        <ng-container
          pgSysvarsInventory
          #sysvarsInventory="modal"
          (pgTapSysvar)="
            setActive({
              kind: 'sysvar',
              data: {
                name: $event.name,
                thumbnailUrl: $event.thumbnailUrl
              }
            })
          "
        ></ng-container>
      </pg-right-dock>

      <pg-left-dock
        class="fixed bottom-0 left-0"
        *ngIf="instruction$ | ngrxPush as instruction"
        (pgToggleCollectionsInventoryModal)="collectionsInventory.toggle()"
      >
        <ng-container
          pgCollectionsInventory
          #collectionsInventory="modal"
          [pgCollections]="(collections$ | ngrxPush) ?? []"
          (pgTapCollection)="
            setActive({
              kind: 'collection',
              data: {
                id: $event.id,
                name: $event.data.name,
                thumbnailUrl: $event.data.thumbnailUrl
              }
            })
          "
        ></ng-container>
      </pg-left-dock>

      <ng-container *ngrxLet="active$; let active">
        <pg-active-signer
          *ngIf="
            instruction !== null && active !== null && active.kind === 'signer'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddSignerNode(
              instruction.data.workspaceId,
              instruction.data.applicationId,
              instruction.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-signer>

        <pg-active-application
          *ngIf="
            instruction !== null &&
            active !== null &&
            active.kind === 'application'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddApplicationNode(
              instruction.data.workspaceId,
              instruction.data.applicationId,
              instruction.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-application>

        <pg-active-sysvar
          *ngIf="
            instruction !== null && active !== null && active.kind === 'sysvar'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddSysvarNode(
              instruction.data.workspaceId,
              instruction.data.applicationId,
              instruction.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-sysvar>

        <pg-active-collection
          *ngIf="
            instruction !== null &&
            active !== null &&
            active.kind === 'collection'
          "
          [pgActive]="active.data"
          [pgInstructionCollections]="
            (instructionCollections$ | ngrxPush) ?? []
          "
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddCollectionNode(
              instruction.data.workspaceId,
              instruction.data.applicationId,
              instruction.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-collection>
      </ng-container>
    </ng-container>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    LetModule,
    BackgroundImageZoomDirective,
    BackgroundImageMoveDirective,
    ApplicationsInventoryDirective,
    SysvarsInventoryDirective,
    CollectionsInventoryDirective,
    InstructionDockComponent,
    SignerDockComponent,
    SysvarDockComponent,
    CollectionDockComponent,
    ApplicationDockComponent,
    RightDockComponent,
    LeftDockComponent,
    ActiveSignerComponent,
    ActiveApplicationComponent,
    ActiveSysvarComponent,
    ActiveCollectionComponent,
  ],
  providers: [
    provideComponentStore(DrawerStore),
    provideComponentStore(InstallationsStore),
    provideComponentStore(CollectionsStore),
    provideComponentStore(InstructionCollectionsStore),
  ],
})
export class InstructionPageComponent
  extends ComponentStore<ViewModel>
  implements OnInit, AfterViewInit
{
  private readonly _router = inject(Router);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _instructionDrawerStore = inject(
    DrawerStore<
      InstructionNodeKinds,
      InstructionNodeData,
      InstructionNodesData,
      InstructionGraphKind,
      InstructionGraphData
    >
  );
  private readonly _installationsStore = inject(InstallationsStore);
  private readonly _collectionsStore = inject(CollectionsStore);
  private readonly _instructionCollectionsStore = inject(
    InstructionCollectionsStore
  );
  private readonly _applicationApiService = inject(ApplicationApiService);
  private readonly _instructionGraphApiService = inject(
    InstructionGraphApiService
  );

  readonly workspaceId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId'))
  );
  readonly applicationId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('applicationId'))
  );
  readonly instructionId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('instructionId'))
  );
  readonly selected$ = this.select(({ selected }) => selected);
  readonly active$ = this.select(({ active }) => active);
  readonly installations$ = this._installationsStore.installations$;

  readonly instruction$ = this._instructionDrawerStore.graph$;
  readonly drawerClick$ = this._instructionDrawerStore.event$.pipe(
    filter(isClickEvent)
  );
  readonly zoomSize$ = this._instructionDrawerStore.zoomSize$;
  readonly panDrag$ = this._instructionDrawerStore.panDrag$;
  readonly drawMode$ = this._instructionDrawerStore.drawMode$;
  readonly collections$ = this.select(
    this._collectionsStore.collections$,
    this._installationsStore.collections$,
    (collections, installedCollections) => {
      if (isNull(collections) || isNull(installedCollections)) {
        return [];
      }

      return collections.concat(installedCollections);
    }
  );
  readonly instructionCollections$ =
    this._instructionCollectionsStore.collections$;

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';
  @ViewChild('drawerElement')
  pgDrawerElementRef: ElementRef<HTMLElement> | null = null;

  private patchSelected = this.updater<PartialInstructionNode>(
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
      InstructionNodeKinds,
      InstructionNodeData,
      InstructionNodesData
    >
  >((state, event) => ({
    ...state,
    selected: event.payload,
  }));

  readonly setActive = this.updater<Option<ActiveType>>((state, active) => ({
    ...state,
    active,
  }));

  private readonly _handleUpdateGraphSuccess = this.effect<
    UpdateGraphSuccessEvent<InstructionGraphKind, InstructionGraphData>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(
          this.workspaceId$,
          this.applicationId$,
          this.instructionId$
        ),
        concatMap(([, workspaceId, applicationId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(applicationId) ||
            isNull(instructionId)
          ) {
            return EMPTY;
          }

          return this._instructionGraphApiService.updateNode(
            environment.clientId,
            instructionId,
            {
              changes: event.payload.changes,
              referenceIds: [applicationId, instructionId],
              kind: event.payload.kind,
              graphId: applicationId,
              parentIds: [workspaceId, applicationId],
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateGraphThumbnailSuccess = this.effect<
    UpdateGraphThumbnailSuccessEvent<InstructionGraphKind>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(
          this.workspaceId$,
          this.applicationId$,
          this.instructionId$
        ),
        concatMap(([, workspaceId, applicationId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(applicationId) ||
            isNull(instructionId)
          ) {
            return EMPTY;
          }

          return this._instructionGraphApiService.updateNodeThumbnail(
            environment.clientId,
            instructionId,
            {
              fileId: event.payload.fileId,
              fileUrl: event.payload.fileUrl,
              kind: event.payload.kind,
              referenceIds: [applicationId, instructionId],
              graphId: applicationId,
              parentIds: [workspaceId, applicationId],
            }
          );
        })
      )
    )
  );

  private readonly _handleAddNodeSuccess = this.effect<
    AddNodeSuccessEvent<
      InstructionNodeKinds,
      InstructionNodeData,
      InstructionNodesData
    >
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(
          this.workspaceId$,
          this.applicationId$,
          this.instructionId$
        ),
        concatMap(([, workspaceId, applicationId, instructionId]) => {
          if (
            isNull(instructionId) ||
            isNull(applicationId) ||
            isNull(workspaceId)
          ) {
            return EMPTY;
          }

          return this._instructionGraphApiService.createNode(
            environment.clientId,
            {
              ...event.payload.data,
              id: event.payload.id,
              parentIds: [workspaceId, applicationId, instructionId],
              kind: event.payload.kind,
              graphId: instructionId,
              referenceIds: [instructionId, event.payload.id],
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateNodeSuccess = this.effect<
    UpdateNodeSuccessEvent<
      InstructionNodeKinds,
      InstructionNodeData,
      InstructionNodesData
    >
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(
          this.workspaceId$,
          this.applicationId$,
          this.instructionId$
        ),
        concatMap(([, workspaceId, applicationId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(applicationId) ||
            isNull(instructionId)
          ) {
            return EMPTY;
          }

          this.patchSelected(event.payload);

          return this._instructionGraphApiService.updateNode(
            environment.clientId,
            event.payload.id,
            {
              changes: event.payload.data,
              graphId: instructionId,
              parentIds: [workspaceId, applicationId, instructionId],
              referenceIds: [instructionId, event.payload.id],
              kind: event.payload.kind,
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateNodeThumbnailSuccess = this.effect<
    UpdateNodeThumbnailSuccessEvent<InstructionNodeKinds>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(
          this.workspaceId$,
          this.applicationId$,
          this.instructionId$
        ),
        concatMap(([, workspaceId, applicationId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(applicationId) ||
            isNull(instructionId)
          ) {
            return EMPTY;
          }

          this.patchSelected({
            id: event.payload.id,
            kind: event.payload.kind,
            data: {
              thumbnailUrl: event.payload.fileUrl,
            },
          });

          return this._instructionGraphApiService.updateNodeThumbnail(
            environment.clientId,
            event.payload.id,
            {
              fileId: event.payload.fileId,
              fileUrl: event.payload.fileUrl,
              graphId: instructionId,
              parentIds: [workspaceId, applicationId, instructionId],
              referenceIds: [instructionId, event.payload.id],
              kind: event.payload.kind,
            }
          );
        })
      )
    )
  );

  private readonly _handleDeleteNodeSuccess = this.effect<
    DeleteNodeSuccessEvent<InstructionNodeKinds>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(
          this.workspaceId$,
          this.applicationId$,
          this.instructionId$
        ),
        concatMap(([, workspaceId, applicationId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(applicationId) ||
            isNull(instructionId)
          ) {
            return EMPTY;
          }

          this.clearSelected(event.payload.id);

          return this._instructionGraphApiService.deleteNode(
            environment.clientId,
            event.payload.id,
            {
              graphId: instructionId,
              kind: event.payload.kind,
              parentIds: [workspaceId, applicationId, instructionId],
              referenceIds: [instructionId, event.payload.id],
            }
          );
        })
      )
    )
  );

  private readonly _handleAddEdgeSuccess = this.effect<AddEdgeSuccessEvent>(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(
          this.workspaceId$,
          this.applicationId$,
          this.instructionId$
        ),
        concatMap(([, workspaceId, applicationId, instructionId]) => {
          if (
            isNull(instructionId) ||
            isNull(workspaceId) ||
            isNull(applicationId)
          ) {
            return EMPTY;
          }

          return this._instructionGraphApiService.createEdge(
            environment.clientId,
            {
              id: event.payload.id,
              source: event.payload.source,
              target: event.payload.target,
              parentIds: [workspaceId, applicationId, instructionId],
              graphId: instructionId,
              referenceIds: [instructionId, event.payload.id],
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
          withLatestFrom(
            this.workspaceId$,
            this.applicationId$,
            this.instructionId$
          ),
          concatMap(([, workspaceId, applicationId, instructionId]) => {
            if (
              isNull(instructionId) ||
              isNull(workspaceId) ||
              isNull(applicationId)
            ) {
              return EMPTY;
            }

            return this._instructionGraphApiService.deleteEdge(
              environment.clientId,
              event.payload,
              {
                parentIds: [workspaceId, applicationId, instructionId],
                graphId: instructionId,
                referenceIds: [instructionId, event.payload],
              }
            );
          })
        )
      )
    );

  private readonly _handleServerGraphUpdate = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId, instructionId }) => {
      if (
        isNull(workspaceId) ||
        isNull(applicationId) ||
        isNull(instructionId)
      ) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, applicationId, instructionId, [
          'updateGraphSuccess',
          'updateGraphThumbnailSuccess',
        ])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            this._instructionDrawerStore.handleGraphUpdated(
              event['payload'].changes
            );
          })
        );
    })
  );

  private readonly _handleServerGraphDelete = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId, instructionId }) => {
      if (
        isNull(workspaceId) ||
        isNull(applicationId) ||
        isNull(instructionId)
      ) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, applicationId, instructionId, [
          'deleteNodeSuccess',
        ])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            if (event['payload'].id === instructionId) {
              this._router.navigate([
                '/workspaces',
                workspaceId,
                'applications',
                applicationId,
              ]);
            }
          })
        );
    })
  );

  private readonly _handleServerNodeCreate = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId, instructionId }) => {
      if (
        isNull(workspaceId) ||
        isNull(applicationId) ||
        isNull(instructionId)
      ) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, applicationId, instructionId, [
          'createNodeSuccess',
        ])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            const { id, kind, ...payload } = event['payload'];
            this._instructionDrawerStore.handleNodeAdded({
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
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId, instructionId }) => {
      if (
        isNull(workspaceId) ||
        isNull(applicationId) ||
        isNull(instructionId)
      ) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, applicationId, instructionId, [
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
              if (event['payload'].id === instructionId) {
                this._instructionDrawerStore.handleGraphUpdated(
                  event['payload'].changes
                );
              } else {
                this._instructionDrawerStore.handleNodeUpdated(
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
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId, instructionId }) => {
      if (
        isNull(workspaceId) ||
        isNull(applicationId) ||
        isNull(instructionId)
      ) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, applicationId, instructionId, [
          'deleteNodeSuccess',
        ])
        .pipe(
          tap((event) => {
            if (event['payload'].id === instructionId) {
              this._router.navigate([
                '/workspaces',
                workspaceId,
                'applications',
                applicationId,
              ]);
            }

            this.clearSelected(event['payload'].id);

            if (event['clientId'] !== environment.clientId) {
              this._instructionDrawerStore.handleNodeRemoved(
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
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId, instructionId }) => {
      if (
        isNull(workspaceId) ||
        isNull(applicationId) ||
        isNull(instructionId)
      ) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, applicationId, instructionId, [
          'createEdgeSuccess',
        ])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) =>
            this._instructionDrawerStore.handleEdgeAdded(event['payload'])
          )
        );
    })
  );

  private readonly _handleServerEdgeDelete = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId, instructionId }) => {
      if (
        isNull(workspaceId) ||
        isNull(applicationId) ||
        isNull(instructionId)
      ) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, applicationId, instructionId, [
          'deleteEdgeSuccess',
        ])
        .pipe(
          tap((event) => {
            if (event['payload'].id === instructionId) {
              this._router.navigate(['/workspaces', workspaceId]);
            }

            this.clearSelected(event['payload'].id);

            if (event['clientId'] !== environment.clientId) {
              this._instructionDrawerStore.handleEdgeRemoved(
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
    instructionId: Option<string>;
    drawerElement: HTMLElement;
  }>(
    concatMap(
      ({ workspaceId, applicationId, instructionId, drawerElement }) => {
        if (
          isNull(workspaceId) ||
          isNull(applicationId) ||
          isNull(instructionId)
        ) {
          return EMPTY;
        }

        return defer(() =>
          from(
            this._instructionGraphApiService.getGraph(
              workspaceId,
              applicationId,
              instructionId
            )
          ).pipe(
            tap((graph) => {
              if (graph) {
                const drawer = new Drawer(
                  graph,
                  graph.nodes,
                  [],
                  drawerElement,
                  instructionCanConnectFunction,
                  instructionNodeLabelFunction
                );
                drawer.initialize();
                this._instructionDrawerStore.setDrawer(drawer);

                this._handleServerGraphUpdate({
                  workspaceId,
                  applicationId,
                  instructionId,
                });
                this._handleServerGraphDelete({
                  workspaceId,
                  applicationId,
                  instructionId,
                });
                this._handleServerNodeCreate({
                  workspaceId,
                  applicationId,
                  instructionId,
                });
                this._handleServerNodeUpdate({
                  workspaceId,
                  applicationId,
                  instructionId,
                });
                this._handleServerNodeDelete({
                  workspaceId,
                  applicationId,
                  instructionId,
                });
                this._handleServerEdgeCreate({
                  workspaceId,
                  applicationId,
                  instructionId,
                });
                this._handleServerEdgeDelete({
                  workspaceId,
                  applicationId,
                  instructionId,
                });
                this._instructionCollectionsStore.setGraph(graph);
              }
            })
          )
        );
      }
    )
  );

  constructor() {
    super(initialState);
  }

  ngOnInit() {
    this._handleUpdateGraphSuccess(
      this._instructionDrawerStore.event$.pipe(
        filter(isUpdateGraphSuccessEvent)
      )
    );
    this._handleUpdateGraphThumbnailSuccess(
      this._instructionDrawerStore.event$.pipe(
        filter(isUpdateGraphThumbnailSuccessEvent)
      )
    );
    this._handleAddNodeSuccess(
      this._instructionDrawerStore.event$.pipe(filter(isAddNodeSuccessEvent))
    );
    this._handleUpdateNodeSuccess(
      this._instructionDrawerStore.event$.pipe(filter(isUpdateNodeSuccessEvent))
    );
    this._handleUpdateNodeThumbnailSuccess(
      this._instructionDrawerStore.event$.pipe(
        filter(isUpdateNodeThumbnailSuccessEvent)
      )
    );
    this._handleDeleteNodeSuccess(
      this._instructionDrawerStore.event$.pipe(filter(isDeleteNodeSuccessEvent))
    );
    this.setSelected(
      this._instructionDrawerStore.event$.pipe(filter(isOneTapNodeEvent))
    );
    this._handleAddEdgeSuccess(
      this._instructionDrawerStore.event$.pipe(filter(isAddEdgeSuccessEvent))
    );
    this._handleDeleteEdgeSuccess(
      this._instructionDrawerStore.event$.pipe(filter(isDeleteEdgeSuccessEvent))
    );
    this._installationsStore.setWorkspaceId(this.workspaceId$);
    this._installationsStore.setApplicationId(this.applicationId$);
    this._collectionsStore.setWorkspaceId(this.workspaceId$);
    this._collectionsStore.setApplicationId(this.applicationId$);
  }

  async ngAfterViewInit() {
    if (isNotNull(this.pgDrawerElementRef)) {
      const drawerElement = this.pgDrawerElementRef.nativeElement;

      this._loadDrawer(
        this.select(
          this.workspaceId$,
          this.applicationId$,
          this.instructionId$,
          (workspaceId, applicationId, instructionId) => ({
            workspaceId,
            applicationId,
            instructionId,
            drawerElement,
          })
        )
      );
    }
  }

  onUnselect() {
    this.patchState({ selected: null });
  }

  onSetDrawMode(drawMode: boolean) {
    this._instructionDrawerStore.setDrawMode(drawMode);
  }

  onUpdateGraph(changes: UpdateInstructionSubmit) {
    this._instructionDrawerStore.updateGraph(changes);
  }

  onDeleteGraph(
    workspaceId: string,
    applicationId: string,
    graphId: string,
    kind: InstructionGraphKind
  ) {
    this._instructionGraphApiService
      .deleteNode(environment.clientId, graphId, {
        graphId,
        kind,
        parentIds: [workspaceId, applicationId],
        referenceIds: [applicationId, graphId],
      })
      .subscribe();
  }

  onUpdateGraphThumbnail(fileId: string, fileUrl: string) {
    this._instructionDrawerStore.updateGraphThumbnail(fileId, fileUrl);
  }

  onAddSignerNode(
    workspaceId: string,
    applicationId: string,
    instructionId: string,
    { payload, options }: AddSignerNodeDto
  ) {
    this._instructionDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          applicationId,
          instructionId,
        },
      },
      options.position
    );
  }

  onAddApplicationNode(
    workspaceId: string,
    applicationId: string,
    instructionId: string,
    { payload, options }: AddApplicationNodeDto
  ) {
    this._instructionDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          applicationId,
          instructionId,
        },
      },
      options.position
    );
  }

  onAddSysvarNode(
    workspaceId: string,
    applicationId: string,
    instructionId: string,
    { payload, options }: AddSysvarNodeDto
  ) {
    this._instructionDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          applicationId,
          instructionId,
        },
      },
      options.position
    );
  }

  onAddCollectionNode(
    workspaceId: string,
    applicationId: string,
    instructionId: string,
    { payload, options }: AddCollectionNodeDto
  ) {
    this._instructionDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          applicationId,
          instructionId,
        },
      },
      options.position
    );
  }

  onUpdateNode(
    nodeId: string,
    kind: InstructionNodeKinds,
    changes: UpdateCollectionSubmit
  ) {
    this._instructionDrawerStore.updateNode(nodeId, {
      changes,
      kind,
    });
  }

  onUpdateNodeThumbnail(nodeId: string, fileId: string, fileUrl: string) {
    this._instructionDrawerStore.updateNodeThumbnail(nodeId, fileId, fileUrl);
  }

  onRemoveNode(nodeId: string) {
    this._instructionDrawerStore.removeNode(nodeId);
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
}

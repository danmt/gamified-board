import { Overlay } from '@angular/cdk/overlay';
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
  GlobalOverlayDirective,
} from '../../shared/directives';
import { GetTypeUnion, isNotNull, isNull, Option } from '../../shared/utils';
import { UpdateProgramSubmit } from '../components';
import {
  AccountDockComponent,
  ActiveAccountComponent,
  ActiveAccountData,
  ActiveFieldComponent,
  ActiveFieldData,
  ActiveInstructionComponent,
  ActiveInstructionData,
  AddAccountNodeDto,
  AddFieldNodeDto,
  AddInstructionNodeDto,
  FieldDockComponent,
  InstructionDockComponent,
  LeftDockComponent,
  ProgramDockComponent,
  ProgramsInventoryComponent,
  RightDockComponent,
} from '../sections';
import {
  InstallProgramDto,
  ProgramApiService,
  ProgramGraphApiService,
} from '../services';
import { InstallableProgramsStore, InstallationsStore } from '../stores';
import {
  PartialProgramNode,
  programCanConnectFunction,
  ProgramGraphData,
  ProgramGraphKind,
  ProgramNode,
  ProgramNodeData,
  ProgramNodeKinds,
  programNodeLabelFunction,
  ProgramNodesData,
} from '../utils';

type ActiveType = GetTypeUnion<{
  account: ActiveAccountData;
  field: ActiveFieldData;
  instruction: ActiveInstructionData;
}>;

interface ViewModel {
  active: Option<ActiveType>;
  programId: Option<string>;
  selected: Option<ProgramNode>;
}

const initialState: ViewModel = {
  active: null,
  programId: null,
  selected: null,
};

@Component({
  selector: 'pg-program-page',
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

    <ng-container *ngrxLet="program$; let program">
      <ng-container *ngrxLet="selected$; let selected">
        <pg-program-dock
          *ngIf="program !== null && selected === null"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgProgram]="program"
          (pgActivateAccount)="
            setActive({
              kind: 'account',
              data: {
                thumbnailUrl: 'assets/generic/account.png'
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
          (pgUpdateProgram)="onUpdateGraph($event.changes)"
          (pgUpdateProgramThumbnail)="
            onUpdateGraphThumbnail($event.fileId, $event.fileUrl)
          "
          (pgDeleteProgram)="
            onDeleteGraph(program.data.workspaceId, $event, 'program')
          "
        ></pg-program-dock>

        <pg-account-dock
          *ngIf="selected !== null && selected.kind === 'account'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgAccount]="selected"
          (pgAccountUnselected)="onUnselect()"
          (pgUpdateAccount)="
            onUpdateNode({
              id: $event.id,
              kind: 'account',
              data: $event.changes
            })
          "
          (pgUpdateAccountThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteAccount)="onRemoveNode($event)"
        ></pg-account-dock>

        <pg-instruction-dock
          *ngIf="selected !== null && selected.kind === 'instruction'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgInstruction]="selected"
          (pgInstructionUnselected)="onUnselect()"
          (pgUpdateInstruction)="
            onUpdateNode({
              id: $event.id,
              kind: 'instruction',
              data: $event.changes
            })
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
          (pgUpdateField)="
            onUpdateNode({ id: $event.id, kind: 'field', data: $event.changes })
          "
          (pgUpdateFieldThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteField)="onRemoveNode($event)"
        ></pg-field-dock>
      </ng-container>

      <pg-right-dock
        class="fixed bottom-0 right-0"
        *ngIf="program !== null"
        (pgActivateField)="
          setActive({
            kind: 'field',
            data: {
              thumbnailUrl: 'assets/generic/field.png'
            }
          })
        "
        (pgToggleProgramsInventoryModal)="programsInventory.toggle()"
      >
        <ng-template
          pgGlobalOverlay
          #programsInventory="globalOverlay"
          [pgPositionStrategy]="
            overlay.position().global().centerVertically().right('0px')
          "
        >
          <pg-programs-inventory
            [pgInstallations]="(installations$ | ngrxPush) ?? []"
            [pgInstallablePrograms]="(installablePrograms$ | ngrxPush) ?? []"
            (pgInstallProgram)="
              onInstallProgram(program.data.workspaceId, program.id, $event)
            "
          ></pg-programs-inventory>
        </ng-template>
      </pg-right-dock>

      <pg-left-dock
        *ngrxLet="drawMode$; let drawMode"
        class="fixed bottom-0 left-0"
        (pgToggleDrawMode)="onSetDrawMode(!drawMode)"
      ></pg-left-dock>

      <ng-container *ngrxLet="active$; let active">
        <pg-active-account
          *ngIf="
            program !== null && active !== null && active.kind === 'account'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddAccountNode(program.data.workspaceId, program.id, $event)
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-account>

        <pg-active-instruction
          *ngIf="
            program !== null && active !== null && active.kind === 'instruction'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddInstructionNode(program.data.workspaceId, program.id, $event)
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-instruction>

        <pg-active-field
          *ngIf="program !== null && active !== null && active.kind === 'field'"
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddFieldNode(program.data.workspaceId, program.id, $event)
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
    ProgramDockComponent,
    AccountDockComponent,
    InstructionDockComponent,
    FieldDockComponent,
    LeftDockComponent,
    RightDockComponent,
    ActiveAccountComponent,
    ActiveInstructionComponent,
    ActiveFieldComponent,
    ProgramsInventoryComponent,
    GlobalOverlayDirective,
    BackgroundImageZoomDirective,
    BackgroundImageMoveDirective,
  ],
  providers: [
    provideComponentStore(DrawerStore),
    provideComponentStore(InstallationsStore),
    provideComponentStore(InstallableProgramsStore),
  ],
})
export class ProgramPageComponent
  extends ComponentStore<ViewModel>
  implements OnInit, AfterViewInit
{
  private readonly _router = inject(Router);
  private readonly _programApiService = inject(ProgramApiService);
  private readonly _programGraphApiService = inject(ProgramGraphApiService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _installationsStore = inject(InstallationsStore);
  private readonly _installableProgramsStore = inject(InstallableProgramsStore);
  private readonly _programDrawerStore = inject(
    DrawerStore<
      ProgramNodeKinds,
      ProgramNodeData,
      ProgramNodesData,
      ProgramGraphKind,
      ProgramGraphData
    >
  );
  public readonly overlay = inject(Overlay);

  readonly active$ = this.select(({ active }) => active);
  readonly selected$ = this.select(({ selected }) => selected);
  readonly workspaceId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId'))
  );
  readonly programId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('programId'))
  );
  readonly program$ = this._programDrawerStore.graph$;
  readonly drawerClick$ = this._programDrawerStore.event$.pipe(
    filter(isClickEvent)
  );
  readonly zoomSize$ = this._programDrawerStore.zoomSize$;
  readonly panDrag$ = this._programDrawerStore.panDrag$;
  readonly drawMode$ = this._programDrawerStore.drawMode$;
  readonly installations$ = this._installationsStore.installations$;
  readonly installablePrograms$ = this._installableProgramsStore.programs$;

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';
  @ViewChild('drawerElement')
  pgDrawerElementRef: ElementRef<HTMLElement> | null = null;

  private patchSelected = this.updater<PartialProgramNode>((state, payload) => {
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

  readonly setSelected = this.updater<
    OneTapNodeEvent<ProgramNodeKinds, ProgramNodeData, ProgramNodesData>
  >((state, event) => ({
    ...state,
    selected: event.payload,
  }));

  readonly setActive = this.updater<Option<ActiveType>>((state, active) => ({
    ...state,
    active,
  }));

  private readonly _handleViewNode = this.effect<
    ViewNodeEvent<ProgramNodeKinds>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.programId$),
        tap(([, workspaceId, programId]) => {
          if (
            isNotNull(workspaceId) &&
            isNotNull(programId) &&
            event.payload.kind === 'instruction'
          ) {
            this._router.navigate([
              '/workspaces',
              workspaceId,
              'programs',
              programId,
              'instructions',
              event.payload.id,
            ]);
          }
        })
      )
    )
  );

  private readonly _handleUpdateGraphSuccess = this.effect<
    UpdateGraphSuccessEvent<ProgramGraphKind, ProgramGraphData>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.programId$),
        concatMap(([, workspaceId, programId]) => {
          if (isNull(workspaceId) || isNull(programId)) {
            return EMPTY;
          }

          return this._programGraphApiService.updateNode(
            environment.clientId,
            programId,
            {
              changes: event.payload.changes,
              referenceIds: [workspaceId, programId],
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
    UpdateGraphThumbnailSuccessEvent<ProgramGraphKind>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.programId$),
        concatMap(([, workspaceId, programId]) => {
          if (isNull(workspaceId) || isNull(programId)) {
            return EMPTY;
          }

          return this._programGraphApiService.updateNodeThumbnail(
            environment.clientId,
            programId,
            {
              fileId: event.payload.fileId,
              fileUrl: event.payload.fileUrl,
              kind: event.payload.kind,
              referenceIds: [workspaceId, programId],
              graphId: workspaceId,
              parentIds: [workspaceId],
            }
          );
        })
      )
    )
  );

  private readonly _handleAddNodeSuccess = this.effect<
    AddNodeSuccessEvent<ProgramNodeKinds, ProgramNodeData, ProgramNodesData>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.programId$),
        concatMap(([, workspaceId, programId]) => {
          if (isNull(programId) || isNull(workspaceId)) {
            return EMPTY;
          }

          return this._programGraphApiService.createNode(environment.clientId, {
            ...event.payload.data,
            id: event.payload.id,
            parentIds: [workspaceId, programId],
            kind: event.payload.kind,
            graphId: programId,
            referenceIds: [programId, event.payload.id],
          });
        })
      )
    )
  );

  private readonly _handleUpdateNodeSuccess = this.effect<
    UpdateNodeSuccessEvent<ProgramNodeKinds, ProgramNodeData, ProgramNodesData>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.programId$),
        concatMap(([, workspaceId, programId]) => {
          if (isNull(workspaceId) || isNull(programId)) {
            return EMPTY;
          }

          this.patchSelected(event.payload);

          return this._programGraphApiService.updateNode(
            environment.clientId,
            event.payload.id,
            {
              changes: event.payload.data,
              graphId: programId,
              parentIds: [workspaceId, programId],
              referenceIds: [programId, event.payload.id],
              kind: event.payload.kind,
            }
          );
        })
      )
    )
  );

  private readonly _handleUpdateNodeThumbnailSuccess = this.effect<
    UpdateNodeThumbnailSuccessEvent<ProgramNodeKinds>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.programId$),
        concatMap(([, workspaceId, programId]) => {
          if (isNull(workspaceId) || isNull(programId)) {
            return EMPTY;
          }

          this.patchSelected({
            id: event.payload.id,
            kind: event.payload.kind,
            data: {
              thumbnailUrl: event.payload.fileUrl,
            },
          });

          return this._programGraphApiService.updateNodeThumbnail(
            environment.clientId,
            event.payload.id,
            {
              fileId: event.payload.fileId,
              fileUrl: event.payload.fileUrl,
              graphId: programId,
              parentIds: [workspaceId, programId],
              referenceIds: [programId, event.payload.id],
              kind: event.payload.kind,
            }
          );
        })
      )
    )
  );

  private readonly _handleDeleteNodeSuccess = this.effect<
    DeleteNodeSuccessEvent<ProgramNodeKinds>
  >(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.programId$),
        concatMap(([, workspaceId, programId]) => {
          if (isNull(workspaceId) || isNull(programId)) {
            return EMPTY;
          }

          this.clearSelected(event.payload.id);

          return this._programGraphApiService.deleteNode(
            environment.clientId,
            event.payload.id,
            {
              graphId: programId,
              kind: event.payload.kind,
              parentIds: [workspaceId, programId],
              referenceIds: [programId, event.payload.id],
            }
          );
        })
      )
    )
  );

  private readonly _handleAddEdgeSuccess = this.effect<AddEdgeSuccessEvent>(
    concatMap((event) =>
      of(null).pipe(
        withLatestFrom(this.workspaceId$, this.programId$),
        concatMap(([, workspaceId, programId]) => {
          if (isNull(programId) || isNull(workspaceId)) {
            return EMPTY;
          }

          return this._programGraphApiService.createEdge(environment.clientId, {
            id: event.payload.id,
            source: event.payload.source,
            target: event.payload.target,
            parentIds: [workspaceId, programId],
            graphId: programId,
            referenceIds: [programId, event.payload.id],
          });
        })
      )
    )
  );

  private readonly _handleDeleteEdgeSuccess =
    this.effect<DeleteEdgeSuccessEvent>(
      concatMap((event) =>
        of(null).pipe(
          withLatestFrom(this.workspaceId$, this.programId$),
          concatMap(([, workspaceId, programId]) => {
            if (isNull(programId) || isNull(workspaceId)) {
              return EMPTY;
            }

            return this._programGraphApiService.deleteEdge(
              environment.clientId,
              event.payload,
              {
                parentIds: [workspaceId, programId],
                graphId: programId,
                referenceIds: [programId, event.payload],
              }
            );
          })
        )
      )
    );

  private readonly _handleServerGraphUpdate = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return this._programGraphApiService
        .listen(workspaceId, programId, [
          'updateGraphSuccess',
          'updateGraphThumbnailSuccess',
        ])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            this._programDrawerStore.handleGraphUpdated(
              event['payload'].changes
            );
          })
        );
    })
  );

  private readonly _handleServerGraphDelete = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return this._programGraphApiService
        .listen(workspaceId, programId, ['deleteNodeSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            if (event['payload'].id === programId) {
              this._router.navigate(['/workspaces', workspaceId]);
            }
          })
        );
    })
  );

  private readonly _handleServerNodeCreate = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return this._programGraphApiService
        .listen(workspaceId, programId, ['createNodeSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            const { id, kind, ...payload } = event['payload'];
            this._programDrawerStore.handleNodeAdded({
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
    programId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return this._programGraphApiService
        .listen(workspaceId, programId, [
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
              if (event['payload'].id === programId) {
                this._programDrawerStore.handleGraphUpdated(
                  event['payload'].changes
                );
              } else {
                this._programDrawerStore.handleNodeUpdated(
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
    programId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return this._programGraphApiService
        .listen(workspaceId, programId, ['deleteNodeSuccess'])
        .pipe(
          tap((event) => {
            if (event['payload'].id === programId) {
              this._router.navigate(['/workspaces', workspaceId]);
            }

            this.clearSelected(event['payload'].id);

            if (event['clientId'] !== environment.clientId) {
              this._programDrawerStore.handleNodeRemoved(event['payload'].id);
            }
          })
        );
    })
  );

  private readonly _handleServerEdgeCreate = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return this._programGraphApiService
        .listen(workspaceId, programId, ['createEdgeSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) =>
            this._programDrawerStore.handleEdgeAdded(event['payload'])
          )
        );
    })
  );

  private readonly _handleServerEdgeDelete = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return this._programGraphApiService
        .listen(workspaceId, programId, ['deleteEdgeSuccess'])
        .pipe(
          tap((event) => {
            if (event['payload'].id === programId) {
              this._router.navigate(['/workspaces', workspaceId]);
            }

            this.clearSelected(event['payload'].id);

            if (event['clientId'] !== environment.clientId) {
              this._programDrawerStore.handleEdgeRemoved(event['payload'].id);
            }
          })
        );
    })
  );

  private readonly _loadDrawer = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
    drawerElement: HTMLElement;
  }>(
    concatMap(({ workspaceId, programId, drawerElement }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._programGraphApiService.getGraph(workspaceId, programId)
        ).pipe(
          tap((graph) => {
            if (graph) {
              const drawer = new Drawer(
                graph,
                graph.nodes,
                [],
                drawerElement,
                programCanConnectFunction,
                programNodeLabelFunction
              );
              drawer.initialize();
              this._programDrawerStore.setDrawer(drawer);

              this._handleServerGraphUpdate({ workspaceId, programId });
              this._handleServerGraphDelete({ workspaceId, programId });
              this._handleServerNodeCreate({ workspaceId, programId });
              this._handleServerNodeUpdate({ workspaceId, programId });
              this._handleServerNodeDelete({ workspaceId, programId });
              this._handleServerEdgeCreate({ workspaceId, programId });
              this._handleServerEdgeDelete({ workspaceId, programId });
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
      this._programDrawerStore.event$.pipe(filter(isViewNodeEvent))
    );
    this._handleUpdateGraphSuccess(
      this._programDrawerStore.event$.pipe(filter(isUpdateGraphSuccessEvent))
    );
    this._handleUpdateGraphThumbnailSuccess(
      this._programDrawerStore.event$.pipe(
        filter(isUpdateGraphThumbnailSuccessEvent)
      )
    );
    this._handleAddNodeSuccess(
      this._programDrawerStore.event$.pipe(filter(isAddNodeSuccessEvent))
    );
    this._handleUpdateNodeSuccess(
      this._programDrawerStore.event$.pipe(filter(isUpdateNodeSuccessEvent))
    );
    this._handleUpdateNodeThumbnailSuccess(
      this._programDrawerStore.event$.pipe(
        filter(isUpdateNodeThumbnailSuccessEvent)
      )
    );
    this._handleDeleteNodeSuccess(
      this._programDrawerStore.event$.pipe(filter(isDeleteNodeSuccessEvent))
    );
    this.setSelected(
      this._programDrawerStore.event$.pipe(filter(isOneTapNodeEvent))
    );
    this._handleAddEdgeSuccess(
      this._programDrawerStore.event$.pipe(filter(isAddEdgeSuccessEvent))
    );
    this._handleDeleteEdgeSuccess(
      this._programDrawerStore.event$.pipe(filter(isDeleteEdgeSuccessEvent))
    );
    this._installationsStore.setWorkspaceId(this.workspaceId$);
    this._installationsStore.setProgramId(this.programId$);
  }

  async ngAfterViewInit() {
    if (isNotNull(this.pgDrawerElementRef)) {
      const drawerElement = this.pgDrawerElementRef.nativeElement;

      this._loadDrawer(
        this.select(
          this.workspaceId$,
          this.programId$,
          (workspaceId, programId) => ({
            workspaceId,
            programId,
            drawerElement,
          })
        )
      );
    }
  }

  onInstallProgram(
    workspaceId: string,
    programId: string,
    payload: InstallProgramDto
  ) {
    this._programApiService
      .installProgram(environment.clientId, workspaceId, programId, payload)
      .subscribe();
  }

  onUnselect() {
    this.patchState({ selected: null });
  }

  onSetDrawMode(drawMode: boolean) {
    this._programDrawerStore.setDrawMode(drawMode);
  }

  onAddInstructionNode(
    workspaceId: string,
    programId: string,
    { payload, options }: AddInstructionNodeDto
  ) {
    this._programDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          programId,
        },
      },
      options.position
    );
  }

  onAddAccountNode(
    workspaceId: string,
    programId: string,
    { payload, options }: AddAccountNodeDto
  ) {
    this._programDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          programId,
        },
      },
      options.position
    );
  }

  onAddFieldNode(
    workspaceId: string,
    programId: string,
    { payload, options }: AddFieldNodeDto
  ) {
    this._programDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          programId,
        },
      },
      options.position
    );
  }

  onUpdateGraph(changes: UpdateProgramSubmit) {
    this._programDrawerStore.updateGraph(changes);
  }

  onDeleteGraph(workspaceId: string, graphId: string, kind: ProgramGraphKind) {
    this._programGraphApiService
      .deleteNode(environment.clientId, graphId, {
        graphId,
        kind,
        parentIds: [workspaceId],
        referenceIds: [workspaceId, graphId],
      })
      .subscribe();
  }

  onUpdateGraphThumbnail(fileId: string, fileUrl: string) {
    this._programDrawerStore.updateGraphThumbnail(fileId, fileUrl);
  }

  onUpdateNode(payload: PartialProgramNode) {
    this._programDrawerStore.updateNode(payload);
  }

  onUpdateNodeThumbnail(nodeId: string, fileId: string, fileUrl: string) {
    this._programDrawerStore.updateNodeThumbnail(nodeId, fileId, fileUrl);
  }

  onRemoveNode(nodeId: string) {
    this._programDrawerStore.removeNode(nodeId);
  }
}

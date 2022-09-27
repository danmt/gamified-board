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
  OneTapNodeEvent,
  patchNode,
  UpdateGraphSuccessEvent,
  UpdateGraphThumbnailSuccessEvent,
  UpdateNodeSuccessEvent,
  UpdateNodeThumbnailSuccessEvent,
} from '../../drawer/utils';
import { ProgramsInventoryDirective } from '../../program/sections';
import {
  InstallProgramDto,
  ProgramApiService,
  ProgramGraphApiService,
} from '../../program/services';
import { AccountsStore, InstallationsStore } from '../../program/stores';
import { FIELD_TYPES } from '../../program/utils';
import {
  BackgroundImageMoveDirective,
  BackgroundImageZoomDirective,
} from '../../shared/directives';
import { GetTypeUnion, isNotNull, isNull, Option } from '../../shared/utils';
import { UpdateInstructionSubmit } from '../components';
import {
  AccountDockComponent,
  AccountsInventoryDirective,
  ActiveAccountComponent,
  ActiveAccountData,
  ActiveProgramComponent,
  ActiveProgramData,
  ActiveSignerComponent,
  ActiveSignerData,
  ActiveSysvarComponent,
  ActiveSysvarData,
  AddAccountNodeDto,
  AddProgramNodeDto,
  AddSignerNodeDto,
  AddSysvarNodeDto,
  InstructionDockComponent,
  LeftDockComponent,
  ProgramDockComponent,
  RightDockComponent,
  SignerDockComponent,
  SysvarDockComponent,
  SysvarsInventoryDirective,
} from '../sections';
import { InstructionGraphApiService } from '../services';
import { InstructionAccountsStore, InstructionArgumentsStore } from '../stores';
import {
  AttributeSeedData,
  instructionCanConnectFunction,
  InstructionGraphData,
  InstructionGraphKind,
  InstructionNode,
  InstructionNodeData,
  InstructionNodeKinds,
  instructionNodeLabelFunction,
  InstructionNodesData,
  PartialInstructionNode,
  SeedType,
} from '../utils';

type ActiveType = GetTypeUnion<{
  signer: ActiveSignerData;
  program: ActiveProgramData;
  sysvar: ActiveSysvarData;
  account: ActiveAccountData;
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
              instruction.data.programId,
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
          (pgUpdateSigner)="
            onUpdateNode({
              id: $event.id,
              kind: 'signer',
              data: $event.changes
            })
          "
          (pgUpdateSignerThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteSigner)="onRemoveNode($event)"
        ></pg-signer-dock>

        <pg-program-dock
          *ngIf="selected !== null && selected.kind === 'program'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgProgram]="selected"
          (pgProgramUnselected)="onUnselect()"
          (pgUpdateProgram)="
            onUpdateNode({
              id: $event.id,
              kind: 'program',
              data: $event.changes
            })
          "
          (pgUpdateProgramThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteProgram)="onRemoveNode($event)"
        ></pg-program-dock>

        <pg-sysvar-dock
          *ngIf="selected !== null && selected.kind === 'sysvar'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgSysvar]="selected"
          (pgSysvarUnselected)="onUnselect()"
          (pgUpdateSysvar)="
            onUpdateNode({
              id: $event.id,
              kind: 'sysvar',
              data: $event.changes
            })
          "
          (pgUpdateSysvarThumbnail)="
            onUpdateNodeThumbnail($event.id, $event.fileId, $event.fileUrl)
          "
          (pgDeleteSysvar)="onRemoveNode($event)"
        ></pg-sysvar-dock>

        <pg-account-dock
          *ngIf="selected !== null && selected.kind === 'account'"
          class="fixed bottom-0 -translate-x-1/2 left-1/2"
          [pgAccount]="selected"
          [pgSeedOptions]="(seedOptions$ | ngrxPush) ?? []"
          [pgInstructionAccounts]="(instructionAccounts$ | ngrxPush) ?? []"
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
          (pgUpdateAccountSeeds)="
            onUpdateNode({
              id: $event.id,
              kind: 'account',
              data: { seeds: $event.seeds }
            })
          "
        ></pg-account-dock>
      </ng-container>

      <pg-right-dock
        class="fixed bottom-0 right-0"
        *ngIf="instruction !== null"
        (pgToggleProgramsInventoryModal)="programsInventory.toggle()"
        (pgToggleSysvarsInventoryModal)="sysvarsInventory.toggle()"
      >
        <ng-container
          pgProgramsInventory
          #programsInventory="modal"
          [pgInstallations]="(installations$ | ngrxPush) ?? []"
          (pgInstallProgram)="
            onInstallProgram(
              instruction.data.workspaceId,
              instruction.data.programId,
              $event
            )
          "
          (pgTapInstallation)="
            setActive({
              kind: 'program',
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
        (pgToggleAccountsInventoryModal)="accountsInventory.toggle()"
      >
        <ng-container
          pgAccountsInventory
          #accountsInventory="modal"
          [pgAccounts]="(accounts$ | ngrxPush) ?? []"
          (pgTapAccount)="
            setActive({
              kind: 'account',
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
              instruction.data.programId,
              instruction.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-signer>

        <pg-active-program
          *ngIf="
            instruction !== null && active !== null && active.kind === 'program'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddProgramNode(
              instruction.data.workspaceId,
              instruction.data.programId,
              instruction.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-program>

        <pg-active-sysvar
          *ngIf="
            instruction !== null && active !== null && active.kind === 'sysvar'
          "
          [pgActive]="active.data"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddSysvarNode(
              instruction.data.workspaceId,
              instruction.data.programId,
              instruction.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-sysvar>

        <pg-active-account
          *ngIf="
            instruction !== null && active !== null && active.kind === 'account'
          "
          [pgActive]="active.data"
          [pgInstructionAccounts]="(instructionAccounts$ | ngrxPush) ?? []"
          [pgClickEvent]="(drawerClick$ | ngrxPush) ?? null"
          (pgAddNode)="
            onAddAccountNode(
              instruction.data.workspaceId,
              instruction.data.programId,
              instruction.id,
              $event
            )
          "
          (pgDeactivate)="setActive(null)"
        ></pg-active-account>
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
    ProgramsInventoryDirective,
    SysvarsInventoryDirective,
    AccountsInventoryDirective,
    InstructionDockComponent,
    SignerDockComponent,
    SysvarDockComponent,
    AccountDockComponent,
    ProgramDockComponent,
    RightDockComponent,
    LeftDockComponent,
    ActiveSignerComponent,
    ActiveProgramComponent,
    ActiveSysvarComponent,
    ActiveAccountComponent,
  ],
  providers: [
    provideComponentStore(DrawerStore),
    provideComponentStore(InstallationsStore),
    provideComponentStore(AccountsStore),
    provideComponentStore(InstructionAccountsStore),
    provideComponentStore(InstructionArgumentsStore),
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
  private readonly _accountsStore = inject(AccountsStore);
  private readonly _instructionAccountsStore = inject(InstructionAccountsStore);
  private readonly _instructionArgumentsStore = inject(
    InstructionArgumentsStore
  );
  private readonly _programApiService = inject(ProgramApiService);
  private readonly _programGraphApiService = inject(ProgramGraphApiService);
  private readonly _instructionGraphApiService = inject(
    InstructionGraphApiService
  );

  readonly workspaceId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId'))
  );
  readonly programId$ = this._activatedRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('programId'))
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
  readonly accounts$ = this.select(
    this._accountsStore.accounts$,
    this._installationsStore.accounts$,
    (accounts, installedAccounts) => {
      if (isNull(accounts) || isNull(installedAccounts)) {
        return [];
      }

      return accounts.concat(installedAccounts);
    }
  );
  readonly instructionAccounts$ = this._instructionAccountsStore.accounts$;
  readonly seedOptions$ = this.select(
    this._instructionAccountsStore.accounts$,
    this.accounts$,
    this._instructionArgumentsStore.instructionArguments$,
    (instructionAccounts, accounts, instructionArguments) => {
      const attributeSeedOptions: SeedType[] = instructionAccounts
        .reduce<AttributeSeedData[]>((attributes, instructionAccount) => {
          const account =
            accounts.find(({ id }) => id === instructionAccount.data.ref.id) ??
            null;

          if (isNull(account)) {
            return attributes;
          }

          return attributes.concat(
            account.fields.map((field) => ({
              id: field.id,
              name: field.data.name,
              account: {
                id: instructionAccount.id,
                name: instructionAccount.data.name,
                ref: account.id,
              },
            }))
          );
        }, [])
        .map((attributeSeedData) => ({
          kind: 'attribute',
          data: attributeSeedData,
        }));

      const argumentSeedOptions: SeedType[] = instructionArguments.map(
        (instructionArgument) => ({
          kind: 'argument',
          data: {
            id: instructionArgument.id,
            name: instructionArgument.data.name,
          },
        })
      );

      const valueSeedOptions: SeedType[] = FIELD_TYPES.map((fieldType) => ({
        kind: 'value',
        data: {
          value: '',
          type: fieldType,
        },
      }));

      return attributeSeedOptions
        .concat(argumentSeedOptions)
        .concat(valueSeedOptions);
    }
  );

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
        withLatestFrom(this.workspaceId$, this.programId$, this.instructionId$),
        concatMap(([, workspaceId, programId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(programId) ||
            isNull(instructionId)
          ) {
            return EMPTY;
          }

          return this._instructionGraphApiService.updateNode(
            environment.clientId,
            instructionId,
            {
              changes: event.payload.changes,
              referenceIds: [programId, instructionId],
              kind: event.payload.kind,
              graphId: programId,
              parentIds: [workspaceId, programId],
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
        withLatestFrom(this.workspaceId$, this.programId$, this.instructionId$),
        concatMap(([, workspaceId, programId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(programId) ||
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
              referenceIds: [programId, instructionId],
              graphId: programId,
              parentIds: [workspaceId, programId],
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
        withLatestFrom(this.workspaceId$, this.programId$, this.instructionId$),
        concatMap(([, workspaceId, programId, instructionId]) => {
          if (
            isNull(instructionId) ||
            isNull(programId) ||
            isNull(workspaceId)
          ) {
            return EMPTY;
          }

          return this._instructionGraphApiService.createNode(
            environment.clientId,
            {
              ...event.payload.data,
              id: event.payload.id,
              parentIds: [workspaceId, programId, instructionId],
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
        withLatestFrom(this.workspaceId$, this.programId$, this.instructionId$),
        concatMap(([, workspaceId, programId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(programId) ||
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
              parentIds: [workspaceId, programId, instructionId],
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
        withLatestFrom(this.workspaceId$, this.programId$, this.instructionId$),
        concatMap(([, workspaceId, programId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(programId) ||
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
              parentIds: [workspaceId, programId, instructionId],
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
        withLatestFrom(this.workspaceId$, this.programId$, this.instructionId$),
        concatMap(([, workspaceId, programId, instructionId]) => {
          if (
            isNull(workspaceId) ||
            isNull(programId) ||
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
              parentIds: [workspaceId, programId, instructionId],
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
        withLatestFrom(this.workspaceId$, this.programId$, this.instructionId$),
        concatMap(([, workspaceId, programId, instructionId]) => {
          if (
            isNull(instructionId) ||
            isNull(workspaceId) ||
            isNull(programId)
          ) {
            return EMPTY;
          }

          return this._instructionGraphApiService.createEdge(
            environment.clientId,
            {
              id: event.payload.id,
              source: event.payload.source,
              target: event.payload.target,
              parentIds: [workspaceId, programId, instructionId],
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
            this.programId$,
            this.instructionId$
          ),
          concatMap(([, workspaceId, programId, instructionId]) => {
            if (
              isNull(instructionId) ||
              isNull(workspaceId) ||
              isNull(programId)
            ) {
              return EMPTY;
            }

            return this._instructionGraphApiService.deleteEdge(
              environment.clientId,
              event.payload,
              {
                parentIds: [workspaceId, programId, instructionId],
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
    programId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId, instructionId }) => {
      if (isNull(workspaceId) || isNull(programId) || isNull(instructionId)) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, programId, instructionId, [
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
    programId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId, instructionId }) => {
      if (isNull(workspaceId) || isNull(programId) || isNull(instructionId)) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, programId, instructionId, ['deleteNodeSuccess'])
        .pipe(
          filter((event) => event['clientId'] !== environment.clientId),
          tap((event) => {
            if (event['payload'].id === instructionId) {
              this._router.navigate([
                '/workspaces',
                workspaceId,
                'programs',
                programId,
              ]);
            }
          })
        );
    })
  );

  private readonly _handleServerNodeCreate = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId, instructionId }) => {
      if (isNull(workspaceId) || isNull(programId) || isNull(instructionId)) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, programId, instructionId, ['createNodeSuccess'])
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
    programId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId, instructionId }) => {
      if (isNull(workspaceId) || isNull(programId) || isNull(instructionId)) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, programId, instructionId, [
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
    programId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId, instructionId }) => {
      if (isNull(workspaceId) || isNull(programId) || isNull(instructionId)) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, programId, instructionId, ['deleteNodeSuccess'])
        .pipe(
          tap((event) => {
            if (event['payload'].id === instructionId) {
              this._router.navigate([
                '/workspaces',
                workspaceId,
                'programs',
                programId,
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
    programId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId, instructionId }) => {
      if (isNull(workspaceId) || isNull(programId) || isNull(instructionId)) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, programId, instructionId, ['createEdgeSuccess'])
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
    programId: Option<string>;
    instructionId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId, instructionId }) => {
      if (isNull(workspaceId) || isNull(programId) || isNull(instructionId)) {
        return EMPTY;
      }

      return this._instructionGraphApiService
        .listen(workspaceId, programId, instructionId, ['deleteEdgeSuccess'])
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
    programId: Option<string>;
    instructionId: Option<string>;
    drawerElement: HTMLElement;
  }>(
    concatMap(({ workspaceId, programId, instructionId, drawerElement }) => {
      if (isNull(workspaceId) || isNull(programId) || isNull(instructionId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._instructionGraphApiService.getGraph(
            workspaceId,
            programId,
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
                programId,
                instructionId,
              });
              this._handleServerGraphDelete({
                workspaceId,
                programId,
                instructionId,
              });
              this._handleServerNodeCreate({
                workspaceId,
                programId,
                instructionId,
              });
              this._handleServerNodeUpdate({
                workspaceId,
                programId,
                instructionId,
              });
              this._handleServerNodeDelete({
                workspaceId,
                programId,
                instructionId,
              });
              this._handleServerEdgeCreate({
                workspaceId,
                programId,
                instructionId,
              });
              this._handleServerEdgeDelete({
                workspaceId,
                programId,
                instructionId,
              });
              this._instructionAccountsStore.setGraph(graph);
            }
          })
        )
      );
    })
  );

  private readonly _loadProgramGraph = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
  }>(
    concatMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._programGraphApiService.getGraph(workspaceId, programId)
        ).pipe(
          tap((graph) => {
            if (graph) {
              this._instructionArgumentsStore.setGraph(graph);
              this._instructionArgumentsStore.setInstructionId(
                this.instructionId$
              );
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
    this._installationsStore.setProgramId(this.programId$);
    this._accountsStore.setWorkspaceId(this.workspaceId$);
    this._accountsStore.setProgramId(this.programId$);
  }

  async ngAfterViewInit() {
    if (isNotNull(this.pgDrawerElementRef)) {
      const drawerElement = this.pgDrawerElementRef.nativeElement;

      this._loadDrawer(
        this.select(
          this.workspaceId$,
          this.programId$,
          this.instructionId$,
          (workspaceId, programId, instructionId) => ({
            workspaceId,
            programId,
            instructionId,
            drawerElement,
          })
        )
      );
      this._loadProgramGraph(
        this.select(
          this.workspaceId$,
          this.programId$,
          (workspaceId, programId) => ({
            workspaceId,
            programId,
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
    programId: string,
    graphId: string,
    kind: InstructionGraphKind
  ) {
    this._instructionGraphApiService
      .deleteNode(environment.clientId, graphId, {
        graphId,
        kind,
        parentIds: [workspaceId, programId],
        referenceIds: [programId, graphId],
      })
      .subscribe();
  }

  onUpdateGraphThumbnail(fileId: string, fileUrl: string) {
    this._instructionDrawerStore.updateGraphThumbnail(fileId, fileUrl);
  }

  onAddSignerNode(
    workspaceId: string,
    programId: string,
    instructionId: string,
    { payload, options }: AddSignerNodeDto
  ) {
    this._instructionDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          programId,
          instructionId,
        },
      },
      options.position
    );
  }

  onAddProgramNode(
    workspaceId: string,
    programId: string,
    instructionId: string,
    { payload, options }: AddProgramNodeDto
  ) {
    this._instructionDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          programId,
          instructionId,
        },
      },
      options.position
    );
  }

  onAddSysvarNode(
    workspaceId: string,
    programId: string,
    instructionId: string,
    { payload, options }: AddSysvarNodeDto
  ) {
    this._instructionDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          programId,
          instructionId,
        },
      },
      options.position
    );
  }

  onAddAccountNode(
    workspaceId: string,
    programId: string,
    instructionId: string,
    { payload, options }: AddAccountNodeDto
  ) {
    this._instructionDrawerStore.addNode(
      {
        ...payload,
        data: {
          ...payload.data,
          workspaceId,
          programId,
          instructionId,
        },
      },
      options.position
    );
  }

  onUpdateNode(payload: PartialInstructionNode) {
    this._instructionDrawerStore.updateNode(payload);
  }

  onUpdateNodeThumbnail(nodeId: string, fileId: string, fileUrl: string) {
    this._instructionDrawerStore.updateNodeThumbnail(nodeId, fileId, fileUrl);
  }

  onRemoveNode(nodeId: string) {
    this._instructionDrawerStore.removeNode(nodeId);
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
}

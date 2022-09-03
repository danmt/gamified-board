import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import {
  concatMap,
  EMPTY,
  Observable,
  of,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import {
  openEditInstructionApplicationModal,
  openEditInstructionDocumentModal,
  openEditInstructionSignerModal,
  openEditInstructionSysvarModal,
  openEditInstructionTaskModal,
} from '../modals';
import { IdlStructField, PluginsService } from '../plugins';
import {
  ApplicationDto,
  CollectionAttributeDto,
  CollectionDto,
  InstructionApplicationApiService,
  InstructionApplicationDto,
  InstructionArgumentDto,
  InstructionDocumentApiService,
  InstructionDocumentDto,
  InstructionDto,
  InstructionSignerApiService,
  InstructionSignerDto,
  InstructionSysvarApiService,
  InstructionSysvarDto,
  InstructionTaskApiService,
  InstructionTaskDto,
  SysvarApiService,
  SysvarDto,
  WorkspaceApiService,
  WorkspaceDto,
} from '../services';
import { Entity, isNotNull, Option } from '../utils';

export type ArgumentReferenceView = {
  kind: 'argument';
  argument: InstructionArgumentDto;
};

export type DocumentReferenceView = {
  kind: 'document';
  document: InstructionDocumentDto;
  attribute: CollectionAttributeDto;
};

export type ReferenceView = ArgumentReferenceView | DocumentReferenceView;

export type ValueView = {
  type: string;
  value: string;
};

export type ApplicationView = Entity<{
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  collections: CollectionView[];
  instructions: InstructionView[];
  kind: 'application';
}>;

export type CollectionView = Entity<{
  name: string;
  thumbnailUrl: string;
  application: ApplicationDto;
  workspaceId: string;
  attributes: CollectionAttributeDto[];
  kind: 'collection';
}>;

export type SysvarView = Entity<{
  name: string;
  thumbnailUrl: string;
  kind: 'sysvar';
}>;

export type InstructionDocumentView = Entity<{
  name: string;
  method: string;
  ownerId: string;
  collection: CollectionView;
  seeds: Option<ReferenceView | ValueView>[];
  bump: Option<ReferenceView>;
  payer: Option<DocumentReferenceView>;
  kind: 'instructionDocument';
}>;

export type InstructionApplicationView = Entity<{
  name: string;
  ownerId: string;
  application: ApplicationDto;
  kind: 'instructionApplication';
}>;

export type InstructionView = Entity<{
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  application: ApplicationDto;
  arguments: InstructionArgumentDto[];
  documents: InstructionDocumentView[];
  tasks: InstructionTaskView[];
  applications: InstructionApplicationView[];
  sysvars: InstructionSysvarView[];
  signers: InstructionSignerView[];
  kind: 'instruction';
}>;

export type InstructionTaskView = Entity<{
  name: string;
  ownerId: string;
  instruction: InstructionView;
  kind: 'instructionTask';
}>;

export type InstructionSysvarView = Entity<{
  name: string;
  ownerId: string;
  sysvar: SysvarView;
  kind: 'instructionSysvar';
}>;

export type InstructionSignerView = Entity<{
  name: string;
  ownerId: string;
  saveChanges: boolean;
  kind: 'instructionSigner';
}>;

const populateInstructionApplication = (
  instructionApplication: InstructionApplicationDto,
  applications: ApplicationDto[]
): InstructionApplicationView => {
  const application =
    applications.find(
      (application) => application.id === instructionApplication.applicationId
    ) ?? null;

  if (application === null) {
    throw new Error(
      `Application ${instructionApplication.id} has an reference to an unknown application.`
    );
  }

  return {
    id: instructionApplication.id,
    name: instructionApplication.name,
    ownerId: instructionApplication.ownerId,
    application,
    kind: 'instructionApplication',
  };
};

const populateCollection = (
  collection: CollectionDto,
  applications: ApplicationDto[]
): CollectionView => {
  const application =
    applications.find(
      (application) => application.id === collection.applicationId
    ) ?? null;

  if (application === null) {
    throw new Error(
      `Collection ${collection.id} has an reference to an unknown application.`
    );
  }

  return {
    id: collection.id,
    name: collection.name,
    thumbnailUrl: collection.thumbnailUrl,
    attributes: collection.attributes,
    workspaceId: collection.workspaceId,
    application,
    kind: 'collection',
  };
};

const populateBump = (
  document: InstructionDocumentDto,
  documents: InstructionDocumentDto[],
  args: InstructionArgumentDto[],
  collections: CollectionDto[]
) => {
  const bump = document.bump;

  if (bump === null) {
    return null;
  }

  if (bump.kind === 'document') {
    const documentId = bump.documentId;
    const attributeId = bump.attributeId;

    const bumpDocument = documents.find(({ id }) => id === documentId) ?? null;
    const collection =
      collections.find(({ id }) => id === bumpDocument?.collectionId) ?? null;
    const attribute =
      collection?.attributes.find(({ id }) => id === attributeId) ?? null;

    return bumpDocument !== null && attribute !== null
      ? {
          kind: 'document' as const,
          document: bumpDocument,
          attribute,
        }
      : null;
  } else {
    const argumentId = bump.argumentId;
    const argument = args.find(({ id }) => id === argumentId) ?? null;

    return argument !== null
      ? {
          kind: 'argument' as const,
          argument,
        }
      : null;
  }
};

const populatePayer = (
  document: InstructionDocumentDto,
  documents: InstructionDocumentDto[],
  collections: CollectionDto[]
) => {
  const payer = document.payer;

  if (payer === null) {
    return null;
  }

  const documentId = payer.documentId;
  const attributeId = payer.attributeId;

  const payerDocument = documents.find(({ id }) => id === documentId) ?? null;
  const collection =
    collections.find(({ id }) => id === payerDocument?.collectionId) ?? null;
  const attribute =
    collection?.attributes.find(({ id }) => id === attributeId) ?? null;

  return payerDocument !== null && attribute !== null
    ? {
        kind: 'document' as const,
        document: payerDocument,
        attribute,
      }
    : null;
};

const populateInstructionDocument = (
  document: InstructionDocumentDto,
  documents: InstructionDocumentDto[],
  args: InstructionArgumentDto[],
  collections: CollectionDto[],
  applications: ApplicationDto[]
): InstructionDocumentView => {
  const collection =
    collections.find((collection) => collection.id === document.collectionId) ??
    null;

  if (collection === null) {
    throw new Error(
      `Document ${document.id} has an reference to an unknown collection.`
    );
  }

  return {
    id: document.id,
    name: document.name,
    method: document.method,
    ownerId: document.ownerId,
    payer: populatePayer(document, documents, collections),
    seeds:
      document.seeds
        ?.map<Option<ReferenceView | ValueView>>((seed) => {
          if (!('kind' in seed)) {
            return {
              value: seed.value,
              type: seed.type,
            };
          }

          switch (seed.kind) {
            case 'argument': {
              const arg = args.find(({ id }) => id === seed.argumentId) ?? null;

              return arg !== null
                ? {
                    kind: seed.kind,
                    argument: arg,
                  }
                : null;
            }
            case 'document': {
              const document =
                documents.find(({ id }) => id === seed.documentId) ?? null;
              const collection =
                collections.find(({ id }) => id === document?.collectionId) ??
                null;
              const attribute =
                collection?.attributes.find(
                  ({ id }) => id === seed.attributeId
                ) ?? null;

              return document !== null && attribute !== null
                ? {
                    kind: seed.kind,
                    document,
                    attribute,
                  }
                : null;
            }
            default: {
              return null;
            }
          }
        })
        .filter(isNotNull) ?? [],
    bump: populateBump(document, documents, args, collections),
    collection: populateCollection(collection, applications),
    kind: 'instructionDocument',
  };
};

const populateSysvar = (sysvar: SysvarDto): SysvarView => {
  return {
    id: sysvar.id,
    name: sysvar.name,
    thumbnailUrl: sysvar.thumbnailUrl,
    kind: 'sysvar',
  };
};

const populateInstructionTask = (
  task: InstructionTaskDto,
  instructions: InstructionDto[],
  applications: ApplicationDto[],
  collections: CollectionDto[],
  sysvars: SysvarDto[]
): InstructionTaskView => {
  const instruction =
    instructions.find(({ id }) => id === task.instructionId) ?? null;

  if (instruction === null) {
    throw new Error(
      `Task ${task.id} has an reference to an unknown instruction.`
    );
  }

  return {
    id: task.id,
    name: task.name,
    ownerId: task.ownerId,
    instruction: populateInstruction(
      instruction,
      applications,
      collections,
      instructions,
      sysvars,
      {
        ignoreTasks: true,
      }
    ),
    kind: 'instructionTask',
  };
};

const populateInstructionSysvar = (
  instructionSysvar: InstructionSysvarDto,
  sysvars: SysvarDto[]
): InstructionSysvarView => {
  const sysvar =
    sysvars.find((sysvar) => sysvar.id === instructionSysvar.sysvarId) ?? null;

  if (sysvar === null) {
    throw new Error(
      `Sysvar ${instructionSysvar.id} has an reference to an unknown sysvar.`
    );
  }

  return {
    id: instructionSysvar.id,
    name: instructionSysvar.name,
    ownerId: instructionSysvar.ownerId,
    sysvar: populateSysvar(sysvar),
    kind: 'instructionSysvar',
  };
};

const populateInstructionSigner = (
  instructionSigner: InstructionSignerDto
): InstructionSignerView => {
  return {
    id: instructionSigner.id,
    name: instructionSigner.name,
    ownerId: instructionSigner.ownerId,
    saveChanges: instructionSigner.saveChanges,
    kind: 'instructionSigner',
  };
};

const populateInstruction = (
  instruction: InstructionDto,
  applications: ApplicationDto[],
  collections: CollectionDto[],
  instructions: InstructionDto[],
  sysvars: SysvarDto[],
  options?: {
    ignoreTasks: boolean;
  }
): InstructionView => {
  const application =
    applications.find(
      (application) => application.id === instruction.applicationId
    ) ?? null;

  if (application === null) {
    throw new Error(
      `Instruction ${instruction.id} has an reference to an unknown application.`
    );
  }

  return {
    id: instruction.id,
    name: instruction.name,
    thumbnailUrl: instruction.thumbnailUrl,
    application,
    workspaceId: instruction.workspaceId,
    arguments: instruction.arguments,
    kind: 'instruction',
    signers: instruction.signers.map((signer) =>
      populateInstructionSigner(signer)
    ),
    applications: instruction.applications.map((instructionApplication) =>
      populateInstructionApplication(instructionApplication, applications)
    ),
    sysvars: instruction.sysvars.map((instructionSysvar) =>
      populateInstructionSysvar(instructionSysvar, sysvars)
    ),
    documents: instruction.documents.map((document) =>
      populateInstructionDocument(
        document,
        instruction.documents,
        instruction.arguments,
        collections,
        applications
      )
    ),
    tasks: options?.ignoreTasks
      ? []
      : instruction.tasks.map((instructionTask) =>
          populateInstructionTask(
            instructionTask,
            instructions,
            applications,
            collections,
            sysvars
          )
        ),
  };
};

interface ViewModel {
  workspaceId: Option<string>;
  currentApplicationId: Option<string>;
  workspace: Option<WorkspaceDto>;
  applications: Option<ApplicationDto[]>;
  collections: Option<CollectionDto[]>;
  instructions: Option<InstructionDto[]>;
  sysvars: Option<SysvarDto[]>;
  isCollectionsSectionOpen: boolean;
  isInstructionsSectionOpen: boolean;
  isApplicationsSectionOpen: boolean;
  isSysvarsSectionOpen: boolean;
  active: Option<{
    id: string;
    kind: 'collection' | 'instruction' | 'application' | 'sysvar' | 'signer';
  }>;
  selectedId: Option<string>;
  hoveredId: Option<string>;
  slots: Option<{
    id: string;
    kind: 'collection' | 'instruction' | 'application' | 'sysvar';
  }>[];
}

const initialState: ViewModel = {
  workspaceId: null,
  workspace: null,
  currentApplicationId: null,
  applications: null,
  collections: null,
  instructions: null,
  sysvars: null,
  isCollectionsSectionOpen: false,
  isInstructionsSectionOpen: false,
  isApplicationsSectionOpen: false,
  isSysvarsSectionOpen: false,
  active: null,
  selectedId: null,
  hoveredId: null,
  slots: [null, null, null, null, null, null, null, null, null, null],
};

@Injectable()
export class BoardStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _dialog = inject(Dialog);
  private readonly _pluginsService = inject(PluginsService);
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _sysvarApiService = inject(SysvarApiService);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );
  private readonly _instructionApplicationApiService = inject(
    InstructionApplicationApiService
  );
  private readonly _instructionSysvarApiService = inject(
    InstructionSysvarApiService
  );
  private readonly _instructionSignerApiService = inject(
    InstructionSignerApiService
  );

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly hoveredId$ = this.select(({ hoveredId }) => hoveredId);
  readonly workspace$ = this.select(({ workspace }) => workspace);
  readonly currentApplicationId$ = this.select(
    ({ currentApplicationId }) => currentApplicationId
  );
  readonly isCollectionsSectionOpen$ = this.select(
    ({ isCollectionsSectionOpen }) => isCollectionsSectionOpen
  );
  readonly isInstructionsSectionOpen$ = this.select(
    ({ isInstructionsSectionOpen }) => isInstructionsSectionOpen
  );
  readonly isApplicationsSectionOpen$ = this.select(
    ({ isApplicationsSectionOpen }) => isApplicationsSectionOpen
  );
  readonly isSysvarsSectionOpen$ = this.select(
    ({ isSysvarsSectionOpen }) => isSysvarsSectionOpen
  );
  readonly collections$: Observable<Option<CollectionView[]>> = this.select(
    this.select(({ applications }) => applications),
    this.select(({ collections }) => collections),
    (applications, collections) => {
      if (collections === null || applications === null) {
        return null;
      }

      return collections.map((collection) =>
        populateCollection(collection, applications)
      );
    }
  );
  readonly sysvars$: Observable<Option<SysvarView[]>> = this.select(
    ({ sysvars }) => sysvars?.map((sysvar) => populateSysvar(sysvar)) ?? null
  );
  readonly instructions$: Observable<Option<InstructionView[]>> = this.select(
    this.select(({ applications }) => applications),
    this.select(({ instructions }) => instructions),
    this.select(({ collections }) => collections),
    this.sysvars$,
    (applications, instructions, collections, sysvars) => {
      if (
        applications === null ||
        instructions === null ||
        collections === null ||
        sysvars === null
      ) {
        return null;
      }

      return instructions.map((instruction) =>
        populateInstruction(
          instruction,
          applications,
          collections,
          instructions,
          sysvars
        )
      );
    }
  );
  readonly applications$: Observable<Option<ApplicationView[]>> = this.select(
    this.select(({ applications }) => applications),
    this.instructions$,
    this.collections$,
    (applications, instructions, collections) => {
      if (
        applications === null ||
        instructions === null ||
        collections === null
      ) {
        return null;
      }

      return applications.map((application) => ({
        ...application,
        instructions: instructions.filter(
          (instruction) => instruction.application.id === application.id
        ),
        collections: collections.filter(
          (collection) => collection.application.id === application.id
        ),
        kind: 'application',
      }));
    }
  );
  readonly currentApplication$ = this.select(
    this.applications$,
    this.currentApplicationId$,
    (applications, currentApplicationId) => {
      if (applications === null) {
        return null;
      }

      return applications.find(({ id }) => id === currentApplicationId) ?? null;
    }
  );
  readonly currentApplicationInstructions$ = this.select(
    this.currentApplication$,
    (currentApplication) => currentApplication?.instructions ?? []
  );
  readonly slots$ = this.select(
    this.applications$,
    this.instructions$,
    this.collections$,
    this.sysvars$,
    this.select(({ slots }) => slots),
    (applications, instructions, collections, sysvars, slots) => {
      if (
        instructions === null ||
        collections === null ||
        applications === null ||
        sysvars === null ||
        slots === null
      ) {
        return [];
      }

      return slots.map((slot) => {
        if (slot === null) {
          return null;
        }

        switch (slot.kind) {
          case 'collection': {
            return (
              collections.find((collection) => collection.id === slot.id) ??
              null
            );
          }

          case 'instruction': {
            return (
              instructions.find((instruction) => instruction.id === slot.id) ??
              null
            );
          }

          case 'application': {
            return (
              applications.find((application) => application.id === slot.id) ??
              null
            );
          }

          case 'sysvar': {
            return sysvars.find((sysvar) => sysvar.id === slot.id) ?? null;
          }
        }
      });
    }
  );
  readonly active$ = this.select(
    this.applications$,
    this.instructions$,
    this.collections$,
    this.sysvars$,
    this.select(({ active }) => active),
    (applications, instructions, collections, sysvars, active) => {
      if (
        applications === null ||
        instructions === null ||
        collections === null ||
        sysvars === null ||
        active === null
      ) {
        return null;
      }

      switch (active.kind) {
        case 'application':
          return (
            applications.find((application) => application.id === active.id) ??
            null
          );
        case 'collection':
          return (
            collections.find((collection) => collection.id === active.id) ??
            null
          );
        case 'instruction':
          return (
            instructions.find((instruction) => instruction.id === active.id) ??
            null
          );
        case 'sysvar':
          return sysvars.find((sysvar) => sysvar.id === active.id) ?? null;
        case 'signer':
          return {
            id: 'signer',
            kind: 'signer' as const,
            thumbnailUrl: 'assets/generic/signer.png',
          };
      }
    }
  );
  readonly selected$ = this.select(
    this.applications$,
    this.instructions$,
    this.collections$,
    this.sysvars$,
    this.select(({ selectedId }) => selectedId),
    (applications, instructions, collections, sysvars, selectedId) => {
      if (
        applications === null ||
        instructions === null ||
        collections === null ||
        sysvars === null ||
        selectedId === null
      ) {
        return null;
      }

      return (
        applications.find((application) => application.id === selectedId) ??
        instructions.find((instruction) => instruction.id === selectedId) ??
        collections.find((collection) => collection.id === selectedId) ??
        sysvars.find((sysvar) => sysvar.id === selectedId) ??
        instructions
          .reduce<InstructionDocumentView[]>(
            (all, instruction) => all.concat(instruction.documents),
            []
          )
          .find((document) => document.id === selectedId) ??
        instructions
          .reduce<InstructionTaskView[]>(
            (all, instruction) => all.concat(instruction.tasks),
            []
          )
          .find((task) => task.id === selectedId) ??
        instructions
          .reduce<InstructionApplicationView[]>(
            (all, instruction) => all.concat(instruction.applications),
            []
          )
          .find((application) => application.id === selectedId) ??
        instructions
          .reduce<InstructionSysvarView[]>(
            (all, instruction) => all.concat(instruction.sysvars),
            []
          )
          .find((sysvar) => sysvar.id === selectedId) ??
        instructions
          .reduce<InstructionSignerView[]>(
            (all, instruction) => all.concat(instruction.signers),
            []
          )
          .find((signer) => signer.id === selectedId) ??
        null
      );
    }
  );

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  readonly setCurrentApplicationId = this.updater<Option<string>>(
    (state, currentApplicationId) => ({
      ...state,
      currentApplicationId,
    })
  );

  readonly setSlot = this.updater<{
    index: number;
    data: Option<{
      id: string;
      kind: 'instruction' | 'collection' | 'application' | 'sysvar';
    }>;
  }>((state, { index, data }) => {
    return {
      ...state,
      slots: state.slots.map((slot, i) => (i === index ? data : slot)),
    };
  });

  readonly swapSlots = this.updater<{
    previousIndex: number;
    newIndex: number;
  }>((state, { previousIndex, newIndex }) => {
    const slots = [...state.slots];
    const temp = slots[newIndex];
    slots[newIndex] = slots[previousIndex];
    slots[previousIndex] = temp;

    return {
      ...state,
      slots,
    };
  });

  readonly setActive = this.updater<
    Option<{
      id: string;
      kind: 'application' | 'collection' | 'instruction' | 'sysvar' | 'signer';
    }>
  >((state, active) => ({
    ...state,
    active,
  }));

  readonly setSelectedId = this.updater<Option<string>>(
    (state, selectedId) => ({
      ...state,
      selectedId,
    })
  );

  readonly setHoveredId = this.updater<Option<string>>((state, hoveredId) => ({
    ...state,
    hoveredId,
  }));

  readonly toggleIsCollectionsSectionOpen = this.updater<void>((state) => ({
    ...state,
    isCollectionsSectionOpen: !state.isCollectionsSectionOpen,
    isSysvarsSectionOpen: false,
  }));

  readonly toggleIsInstructionsSectionOpen = this.updater<void>((state) => ({
    ...state,
    isInstructionsSectionOpen: !state.isInstructionsSectionOpen,
    isApplicationsSectionOpen: false,
  }));

  readonly toggleIsApplicationsSectionOpen = this.updater<void>((state) => ({
    ...state,
    isApplicationsSectionOpen: !state.isApplicationsSectionOpen,
    isInstructionsSectionOpen: false,
  }));

  readonly toggleIsSysvarsSectionOpen = this.updater<void>((state) => ({
    ...state,
    isSysvarsSectionOpen: !state.isSysvarsSectionOpen,
    isCollectionsSectionOpen: false,
  }));

  readonly closeActiveOrSelected = this.updater<void>((state) => {
    if (
      state.isCollectionsSectionOpen ||
      state.isInstructionsSectionOpen ||
      state.isApplicationsSectionOpen ||
      state.isSysvarsSectionOpen
    ) {
      return {
        ...state,
        isCollectionsSectionOpen: false,
        isInstructionsSectionOpen: false,
        isApplicationsSectionOpen: false,
        isSysvarsSectionOpen: false,
      };
    } else if (state.active !== null) {
      return {
        ...state,
        active: null,
      };
    } else if (state.selectedId !== null) {
      return {
        ...state,
        selectedId: null,
      };
    } else {
      return state;
    }
  });

  private readonly _loadWorkspace$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (workspaceId === null) {
        return EMPTY;
      }

      return this._workspaceApiService.getWorkspace(workspaceId).pipe(
        tapResponse(
          (workspace) => this.patchState({ workspace }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadApplications$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (workspaceId === null) {
        return EMPTY;
      }

      return this._workspaceApiService
        .getWorkspaceApplications(workspaceId)
        .pipe(
          tapResponse(
            (applications) =>
              this.patchState({
                applications: applications.concat(
                  this._pluginsService.plugins.map((plugin) => ({
                    id: plugin.name,
                    name: plugin.name,
                    workspaceId: plugin.namespace,
                    thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/application.png`,
                  }))
                ),
              }),
            (error) => this._handleError(error)
          )
        );
    })
  );

  private readonly _loadCollections$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (workspaceId === null) {
        return EMPTY;
      }

      return this._workspaceApiService
        .getWorkspaceCollections(workspaceId)
        .pipe(
          tapResponse(
            (collections) =>
              this.patchState({
                collections: collections.concat(
                  this._pluginsService.plugins.reduce<CollectionDto[]>(
                    (collections, plugin) => [
                      ...collections,
                      ...plugin.accounts.reduce<CollectionDto[]>(
                        (innerCollections, account) => {
                          const fields: IdlStructField[] =
                            typeof account.type === 'string'
                              ? []
                              : 'kind' in account.type
                              ? account.type.fields
                              : [];

                          return [
                            ...innerCollections,
                            {
                              id: `${plugin.namespace}/${plugin.name}/${account.name}`,
                              name: account.name,
                              thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/accounts/${account.name}.png`,
                              applicationId: plugin.name,
                              workspaceId: plugin.namespace,
                              attributes: fields.map((field) => {
                                if (typeof field.type === 'string') {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: field.type,
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                } else if ('option' in field.type) {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: field.type.option,
                                    isOption: true,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                } else if ('coption' in field.type) {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: field.type.coption,
                                    isOption: false,
                                    isCOption: true,
                                    isDefined: false,
                                  };
                                } else if ('defined' in field.type) {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: field.type.defined,
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: true,
                                  };
                                } else {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: JSON.stringify(field.type),
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                }
                              }),
                            },
                          ];
                        },
                        []
                      ),
                    ],
                    []
                  )
                ),
              }),
            (error) => this._handleError(error)
          )
        );
    })
  );

  private readonly _loadInstructions$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (workspaceId === null) {
        return EMPTY;
      }

      return this._workspaceApiService
        .getWorkspaceInstructions(workspaceId)
        .pipe(
          tapResponse(
            (instructions) =>
              this.patchState({
                instructions: instructions.concat(
                  this._pluginsService.plugins.reduce<InstructionDto[]>(
                    (pluginsInstructions, plugin) => [
                      ...pluginsInstructions,
                      ...plugin.instructions.reduce<InstructionDto[]>(
                        (pluginInstructions, instruction) => {
                          const args = instruction.args;

                          return [
                            ...pluginInstructions,
                            {
                              id: `${plugin.namespace}/${plugin.name}/${instruction.name}`,
                              name: instruction.name,
                              thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/instructions/${instruction.name}.png`,
                              applicationId: plugin.name,
                              workspaceId: plugin.namespace,
                              documents: [],
                              tasks: [],
                              applications: [],
                              sysvars: [],
                              signers: [],
                              arguments: args.map((arg) => {
                                if (typeof arg.type === 'string') {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: arg.type,
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                } else if ('option' in arg.type) {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: arg.type.option,
                                    isOption: true,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                } else if ('coption' in arg.type) {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: arg.type.coption,
                                    isOption: false,
                                    isCOption: true,
                                    isDefined: false,
                                  };
                                } else if ('defined' in arg.type) {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: arg.type.defined,
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: true,
                                  };
                                } else {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: JSON.stringify(arg.type),
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                }
                              }),
                            },
                          ];
                        },
                        []
                      ),
                    ],
                    []
                  )
                ),
              }),
            (error) => this._handleError(error)
          )
        );
    })
  );

  private readonly _loadSysvars$ = this.effect<void>(
    switchMap(() =>
      this._sysvarApiService.getAllSysvars().pipe(
        tapResponse(
          (sysvars) => this.patchState({ sysvars }),
          (error) => this._handleError(error)
        )
      )
    )
  );

  readonly useActive = this.effect<string>(
    switchMap((instructionId) => {
      return of(instructionId).pipe(
        withLatestFrom(this.active$),
        concatMap(([instructionId, active]) => {
          if (active === null) {
            return EMPTY;
          }

          this.patchState({
            active: null,
          });

          if (active.kind === 'application') {
            // application
            return openEditInstructionApplicationModal(this._dialog, {
              instructionApplication: null,
            }).closed.pipe(
              concatMap((instructionApplicationData) => {
                if (instructionApplicationData === undefined) {
                  return EMPTY;
                }

                return this._instructionApplicationApiService.createInstructionApplication(
                  instructionId,
                  instructionApplicationData.id,
                  instructionApplicationData.name,
                  active.id
                );
              })
            );
          } else if (active.kind === 'instruction') {
            // instruction
            return openEditInstructionTaskModal(this._dialog, {
              instructionTask: null,
            }).closed.pipe(
              concatMap((taskData) => {
                if (taskData === undefined) {
                  return EMPTY;
                }

                return this._instructionTaskApiService.createInstructionTask(
                  instructionId,
                  taskData.id,
                  taskData.name,
                  active.id
                );
              })
            );
          } else if (active.kind === 'collection') {
            // collection
            const argumentReferences$ = this.select(
              this.currentApplicationInstructions$,
              (instructions) => {
                const instruction =
                  instructions?.find(({ id }) => id === instructionId) ?? null;

                if (instruction === null) {
                  return [];
                }

                return instruction.arguments.map((argument) => ({
                  kind: 'argument' as const,
                  argument: {
                    id: argument.id,
                    name: argument.name,
                    type: argument.type,
                  },
                }));
              }
            );

            const attributeReferences$ = this.select(
              this.currentApplicationInstructions$,
              (instructions) => {
                const instruction =
                  instructions?.find(({ id }) => id === instructionId) ?? null;

                if (instruction === null) {
                  return [];
                }

                return instruction.documents.reduce<
                  {
                    kind: 'document';
                    attribute: {
                      id: string;
                      name: string;
                      type: string;
                    };
                    document: {
                      id: string;
                      name: string;
                    };
                  }[]
                >(
                  (attributes, document) =>
                    attributes.concat(
                      document.collection.attributes.map((attribute) => ({
                        kind: 'document' as const,
                        attribute: {
                          id: attribute.id,
                          name: attribute.name,
                          type: attribute.type,
                        },
                        document: {
                          id: document.id,
                          name: document.name,
                        },
                      }))
                    ),
                  []
                );
              }
            );

            const bumpReferences$ = this.select(
              argumentReferences$,
              attributeReferences$,
              (argumentReferences, attributeReferences) => [
                ...(argumentReferences?.filter(
                  (argumentReference) =>
                    argumentReference.argument.type === 'u8'
                ) ?? []),
                ...(attributeReferences?.filter(
                  (attributeReference) =>
                    attributeReference.attribute.type === 'u8'
                ) ?? []),
              ]
            );

            return openEditInstructionDocumentModal(this._dialog, {
              instructionDocument: null,
              argumentReferences$,
              attributeReferences$,
              bumpReferences$,
            }).closed.pipe(
              concatMap((documentData) => {
                if (documentData === undefined) {
                  return EMPTY;
                }

                return this._instructionDocumentApiService.createInstructionDocument(
                  instructionId,
                  documentData.id,
                  documentData.name,
                  documentData.method,
                  active.id,
                  documentData.seeds,
                  documentData.bump,
                  documentData.payer
                );
              })
            );
          } else if (active.kind === 'sysvar') {
            // sysvar
            return openEditInstructionSysvarModal(this._dialog, {
              instructionSysvar: null,
            }).closed.pipe(
              concatMap((documentData) => {
                if (documentData === undefined) {
                  return EMPTY;
                }

                return this._instructionSysvarApiService.createInstructionSysvar(
                  instructionId,
                  documentData.id,
                  documentData.name,
                  active.id
                );
              })
            );
          } else {
            // signer
            return openEditInstructionSignerModal(this._dialog, {
              instructionSigner: null,
            }).closed.pipe(
              concatMap((signerData) => {
                if (signerData === undefined) {
                  return EMPTY;
                }

                return this._instructionSignerApiService.createInstructionSigner(
                  instructionId,
                  signerData.id,
                  signerData.name,
                  signerData.saveChanges
                );
              })
            );
          }
        })
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadWorkspace$(this.workspaceId$);
    this._loadApplications$(this.workspaceId$);
    this._loadCollections$(this.workspaceId$);
    this._loadInstructions$(this.workspaceId$);
    this._loadSysvars$();
  }

  private _handleError(error: unknown) {
    console.log(error);
  }
}

import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable, ViewContainerRef } from '@angular/core';
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
  EditDocumentData,
  EditDocumentModalComponent,
  EditDocumentSubmitPayload,
  EditInstructionApplicationData,
  EditInstructionApplicationModalComponent,
  EditTaskData,
  EditTaskModalComponent,
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
  InstructionTaskApiService,
  InstructionTaskDto,
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
}>;

export type CollectionView = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  attributes: CollectionAttributeDto[];
}>;

export type InstructionDocumentView = Entity<{
  name: string;
  method: string;
  ownerId: string;
  collection: CollectionView;
  seeds: Option<ReferenceView | ValueView>[];
  bump: Option<ReferenceView>;
  payer: Option<DocumentReferenceView>;
}>;

export type InstructionApplicationView = Entity<{
  name: string;
  ownerId: string;
  application: ApplicationDto;
}>;

export type InstructionView = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  arguments: InstructionArgumentDto[];
  documents: InstructionDocumentView[];
  tasks: InstructionTaskView[];
  applications: InstructionApplicationView[];
}>;

export type InstructionTaskView = Entity<{
  name: string;
  ownerId: string;
  instruction: InstructionView;
}>;

export interface EntryView {
  id: string;
  name: string;
  tasks: InstructionTaskView[];
  documents: InstructionDocumentView[];
  arguments: InstructionArgumentDto[];
  applications: InstructionApplicationView[];
}

const populateInstructionApplication = (
  instructionApplication: InstructionApplicationDto,
  applications: ApplicationDto[]
): InstructionApplicationView => {
  const application =
    applications.find(
      (application) => application.id === instructionApplication.applicationId
    ) ?? null;

  console.log({ applications, instructionApplication });

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
  };
};

const populateInstructionDocument = (
  document: InstructionDocumentDto,
  documents: InstructionDocumentDto[],
  args: InstructionArgumentDto[],
  collections: CollectionDto[]
): InstructionDocumentView => {
  const collection =
    collections.find((collection) => collection.id === document.collectionId) ??
    null;

  if (collection === null) {
    throw new Error(
      `Document ${document.id} has an reference to an unknown collection.`
    );
  }

  let bump: Option<ReferenceView> = null;

  if (document.bump?.kind === 'document') {
    const documentId = document.bump.documentId;
    const attributeId = document.bump.attributeId;

    const bumpDocument = documents.find(({ id }) => id === documentId) ?? null;
    const collection =
      collections.find(({ id }) => id === bumpDocument?.collectionId) ?? null;
    const attribute =
      collection?.attributes.find(({ id }) => id === attributeId) ?? null;

    bump =
      bumpDocument !== null && attribute !== null
        ? {
            kind: 'document' as const,
            document: bumpDocument,
            attribute,
          }
        : null;
  } else if (document.bump?.kind === 'argument') {
    const argumentId = document.bump.argumentId;
    const argument = args.find(({ id }) => id === argumentId) ?? null;

    bump =
      argument !== null
        ? {
            kind: 'argument' as const,
            argument,
          }
        : null;
  }

  let payer: Option<ReferenceView> = null;

  if (document.payer !== null) {
    const documentId = document.payer.documentId;
    const attributeId = document.payer.attributeId;

    const payerDocument = documents.find(({ id }) => id === documentId) ?? null;
    const collection =
      collections.find(({ id }) => id === payerDocument?.collectionId) ?? null;
    const attribute =
      collection?.attributes.find(({ id }) => id === attributeId) ?? null;

    payer =
      payerDocument !== null && attribute !== null
        ? {
            kind: 'document',
            document: payerDocument,
            attribute,
          }
        : null;
  }

  return {
    id: document.id,
    name: document.name,
    method: document.method,
    ownerId: document.ownerId,
    payer,
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
    bump,
    collection,
  };
};

const populateInstructionTask = (
  task: InstructionTaskDto,
  instructions: InstructionDto[],
  applications: ApplicationDto[],
  collections: CollectionDto[]
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
      {
        ignoreTasks: true,
      }
    ),
  };
};

const populateInstruction = (
  instruction: InstructionDto,
  applications: ApplicationDto[],
  collections: CollectionDto[],
  instructions: InstructionDto[],
  options?: {
    ignoreTasks: boolean;
  }
): InstructionView => {
  return {
    id: instruction.id,
    name: instruction.name,
    thumbnailUrl: instruction.thumbnailUrl,
    applicationId: instruction.applicationId,
    workspaceId: instruction.workspaceId,
    arguments: instruction.arguments,
    applications: instruction.applications.map((instructionApplication) =>
      populateInstructionApplication(instructionApplication, applications)
    ),
    documents: instruction.documents.map((document) =>
      populateInstructionDocument(
        document,
        instruction.documents,
        instruction.arguments,
        collections
      )
    ),
    tasks: options?.ignoreTasks
      ? []
      : instruction.tasks.map((instructionTask) =>
          populateInstructionTask(
            instructionTask,
            instructions,
            applications,
            collections
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
  isCollectionsSectionOpen: boolean;
  isInstructionsSectionOpen: boolean;
  isApplicationsSectionOpen: boolean;
  activeId: Option<string>;
  selectedId: Option<string>;
  hoveredId: Option<string>;
  slots: Option<{
    id: string;
    kind: 'collection' | 'instruction' | 'application';
  }>[];
}

const initialState: ViewModel = {
  workspaceId: null,
  workspace: null,
  currentApplicationId: null,
  applications: null,
  collections: null,
  instructions: null,
  isCollectionsSectionOpen: false,
  isInstructionsSectionOpen: false,
  isApplicationsSectionOpen: false,
  activeId: null,
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
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _pluginsService = inject(PluginsService);
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _instructionTaskApiService = inject(
    InstructionTaskApiService
  );
  private readonly _instructionDocumentApiService = inject(
    InstructionDocumentApiService
  );
  private readonly _instructionApplicationApiService = inject(
    InstructionApplicationApiService
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
  readonly collections$: Observable<Option<CollectionView[]>> = this.select(
    ({ collections }) => collections
  );
  readonly instructions$: Observable<Option<InstructionView[]>> = this.select(
    this.select(({ applications }) => applications),
    this.select(({ instructions }) => instructions),
    this.collections$,
    (applications, instructions, collections) => {
      if (
        applications === null ||
        instructions === null ||
        collections === null
      ) {
        return null;
      }

      return instructions.map((instruction) =>
        populateInstruction(
          instruction,
          applications,
          collections,
          instructions
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
          (instruction) => instruction.applicationId === application.id
        ),
        collections: collections.filter(
          (collection) => collection.applicationId === application.id
        ),
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
  readonly slots$: Observable<
    Option<InstructionView | CollectionView | ApplicationView>[]
  > = this.select(
    this.applications$,
    this.instructions$,
    this.collections$,
    this.select(({ slots }) => slots),
    (applications, instructions, collections, slots) => {
      if (
        instructions === null ||
        collections === null ||
        applications === null ||
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
        }
      });
    }
  );
  readonly active$ = this.select(
    this.applications$,
    this.instructions$,
    this.collections$,
    this.select(({ activeId }) => activeId),
    (applications, instructions, collections, activeId) => {
      if (
        applications === null ||
        instructions === null ||
        collections === null ||
        activeId === null
      ) {
        return null;
      }

      return (
        applications.find((application) => application.id === activeId) ??
        instructions.find((instruction) => instruction.id === activeId) ??
        collections.find((collection) => collection.id === activeId) ??
        null
      );
    }
  );
  readonly selected$ = this.select(
    this.applications$,
    this.instructions$,
    this.collections$,
    this.select(({ selectedId }) => selectedId),
    (applications, instructions, collections, selectedId) => {
      if (
        applications === null ||
        instructions === null ||
        collections === null ||
        selectedId === null
      ) {
        return null;
      }

      return (
        applications.find((application) => application.id === selectedId) ??
        instructions.find((instruction) => instruction.id === selectedId) ??
        collections.find((collection) => collection.id === selectedId) ??
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
      kind: 'instruction' | 'collection' | 'application';
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

  readonly setActiveId = this.updater<Option<string>>((state, activeId) => ({
    ...state,
    activeId,
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

  readonly closeActiveOrSelected = this.updater<void>((state) => {
    if (
      state.isCollectionsSectionOpen ||
      state.isInstructionsSectionOpen ||
      state.isApplicationsSectionOpen
    ) {
      return {
        ...state,
        isCollectionsSectionOpen: false,
        isInstructionsSectionOpen: false,
        isApplicationsSectionOpen: false,
      };
    } else if (state.activeId !== null) {
      return {
        ...state,
        activeId: null,
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
                    thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/thumbnail.png`,
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

  readonly useActive = this.effect<string>(
    switchMap((instructionId) => {
      return of(instructionId).pipe(
        withLatestFrom(this.active$),
        concatMap(([instructionId, active]) => {
          if (active === null) {
            return EMPTY;
          }

          this.patchState({
            activeId: null,
          });

          if ('collections' in active) {
            // application
            return this._dialog
              .open<
                EditInstructionApplicationData,
                EditInstructionApplicationData,
                EditInstructionApplicationModalComponent
              >(EditInstructionApplicationModalComponent)
              .closed.pipe(
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
          } else if ('documents' in active) {
            // instruction
            return this._dialog
              .open<EditTaskData, Option<EditTaskData>, EditTaskModalComponent>(
                EditTaskModalComponent
              )
              .closed.pipe(
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
          } else {
            // collection
            return this._dialog
              .open<
                EditDocumentSubmitPayload,
                EditDocumentData,
                EditDocumentModalComponent
              >(EditDocumentModalComponent, {
                data: {
                  document: null,
                  instructionId,
                },
                viewContainerRef: this._viewContainerRef,
              })
              .closed.pipe(
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
  }

  private _handleError(error: unknown) {
    console.log(error);
  }
}

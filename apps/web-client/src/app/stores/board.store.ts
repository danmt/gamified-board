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
import { IdlStructField, PluginsService } from '../plugins';
import {
  ApplicationDto,
  CollectionAttributeDto,
  CollectionDto,
  DocumentApiService,
  DocumentDto,
  InstructionArgumentDto,
  InstructionDto,
  TaskApiService,
  WorkspaceApiService,
  WorkspaceDto,
} from '../services';
import { Entity, isNotNull, Option } from '../utils';

export type BoardArgumentReference = {
  kind: 'argument';
  argument: InstructionArgumentDto;
};

export type BoardDocumentReference = {
  kind: 'document';
  document: DocumentDto;
  attribute: CollectionAttributeDto;
};

export type BoardReference = BoardArgumentReference | BoardDocumentReference;

export type BoardValue = {
  type: string;
  value: string;
};

export type BoardApplication = Entity<{
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  collections: BoardCollection[];
  instructions: BoardInstruction[];
}>;

export type BoardCollection = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  attributes: CollectionAttributeDto[];
}>;

export type BoardDocument = Entity<{
  name: string;
  method: string;
  ownerId: string;
  collection: BoardCollection;
  seeds: Option<BoardReference | BoardValue>[];
  bump: Option<BoardReference>;
  payer: Option<BoardDocumentReference>;
}>;

export type BoardInstruction = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  arguments: InstructionArgumentDto[];
  documents: BoardDocument[];
  tasks: BoardTask[];
}>;

export type BoardTask = Entity<{
  name: string;
  ownerId: string;
  instruction: BoardInstruction;
}>;

export interface BoardEntry {
  id: string;
  name: string;
  tasks: BoardTask[];
  documents: BoardDocument[];
  arguments: InstructionArgumentDto[];
}

interface ViewModel {
  workspaceId: Option<string>;
  currentApplicationId: Option<string>;
  workspace: Option<WorkspaceDto>;
  applications: Option<ApplicationDto[]>;
  collections: Option<CollectionDto[]>;
  instructions: Option<InstructionDto[]>;
  selectedDocumentId: Option<string>;
  selectedTaskId: Option<string>;
  selectedCollectionId: Option<string>;
  selectedInstructionId: Option<string>;
  selectedApplicationId: Option<string>;
  activeCollectionId: Option<string>;
  activeInstructionId: Option<string>;
  activeApplicationId: Option<string>;
  instructionSlotIds: Option<string>[];
  collectionSlotIds: Option<string>[];
}

const initialState: ViewModel = {
  workspaceId: null,
  workspace: null,
  currentApplicationId: null,
  applications: null,
  collections: null,
  instructions: null,
  selectedDocumentId: null,
  selectedTaskId: null,
  selectedApplicationId: null,
  selectedCollectionId: null,
  selectedInstructionId: null,
  activeApplicationId: null,
  activeCollectionId: null,
  activeInstructionId: null,
  instructionSlotIds: [null, null, null, null, null, null],
  collectionSlotIds: [null, null, null, null, null, null],
};

@Injectable()
export class BoardStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _pluginsService = inject(PluginsService);
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _taskApiService = inject(TaskApiService);
  private readonly _documentApiService = inject(DocumentApiService);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly workspace$ = this.select(({ workspace }) => workspace);
  readonly currentApplicationId$ = this.select(
    ({ currentApplicationId }) => currentApplicationId
  );

  readonly collections$: Observable<Option<BoardCollection[]>> = this.select(
    ({ collections }) => {
      if (collections === null) {
        return null;
      }

      return [
        ...collections,
        ...this._pluginsService.plugins.reduce<CollectionDto[]>(
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
        ),
      ];
    }
  );
  readonly instructions$: Observable<Option<BoardInstruction[]>> = this.select(
    this.select(({ instructions }) => instructions),
    this.collections$,
    (instructions, collections) => {
      if (instructions === null || collections === null) {
        return null;
      }

      return [
        ...instructions.map((instruction) => {
          return {
            id: instruction.id,
            name: instruction.name,
            thumbnailUrl: instruction.thumbnailUrl,
            applicationId: instruction.applicationId,
            workspaceId: instruction.workspaceId,
            arguments: instruction.arguments,
            documents: instruction.documents.map((document) => {
              const collection =
                collections.find(
                  (collection) => collection.id === document.collectionId
                ) ?? null;

              if (collection === null) {
                throw new Error(
                  `Document ${document.id} has an reference to an unknown collection.`
                );
              }

              let bump: Option<BoardReference> = null;

              if (document.bump?.kind === 'document') {
                const documentId = document.bump.documentId;
                const attributeId = document.bump.attributeId;

                const bumpDocument =
                  instruction.documents.find(({ id }) => id === documentId) ??
                  null;
                const collection =
                  collections.find(
                    ({ id }) => id === bumpDocument?.collectionId
                  ) ?? null;
                const attribute =
                  collection?.attributes.find(({ id }) => id === attributeId) ??
                  null;

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
                const argument =
                  instruction?.arguments.find(({ id }) => id === argumentId) ??
                  null;

                bump =
                  argument !== null
                    ? {
                        kind: 'argument' as const,
                        argument,
                      }
                    : null;
              }

              let payer: Option<BoardReference> = null;

              if (document.payer !== null) {
                const documentId = document.payer.documentId;
                const attributeId = document.payer.attributeId;

                const payerDocument =
                  instruction.documents.find(({ id }) => id === documentId) ??
                  null;
                const collection =
                  collections.find(
                    ({ id }) => id === payerDocument?.collectionId
                  ) ?? null;
                const attribute =
                  collection?.attributes.find(({ id }) => id === attributeId) ??
                  null;

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
                    ?.map<Option<BoardReference | BoardValue>>((seed) => {
                      if (!('kind' in seed)) {
                        return {
                          value: seed.value,
                          type: seed.type,
                        };
                      }

                      switch (seed.kind) {
                        case 'argument': {
                          const arg =
                            instruction.arguments.find(
                              ({ id }) => id === seed.argumentId
                            ) ?? null;

                          return arg !== null
                            ? {
                                kind: seed.kind,
                                argument: arg,
                              }
                            : null;
                        }
                        case 'document': {
                          const document =
                            instruction.documents.find(
                              ({ id }) => id === seed.documentId
                            ) ?? null;
                          const collection =
                            collections.find(
                              ({ id }) => id === document?.collectionId
                            ) ?? null;
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
            }),
            tasks: [],
          };
        }),
        ...this._pluginsService.plugins.reduce<BoardInstruction[]>(
          (instructions, plugin) => [
            ...instructions,
            ...plugin.instructions.reduce<BoardInstruction[]>(
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
        ),
      ];
    }
  );
  readonly applications$: Observable<Option<BoardApplication[]>> = this.select(
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

      return [
        ...applications.map((application) => ({
          ...application,
          instructions: instructions.filter(
            (instruction) => instruction.applicationId === application.id
          ),
          collections: collections.filter(
            (collection) => collection.applicationId === application.id
          ),
        })),
        ...this._pluginsService.plugins.map((plugin) => ({
          id: plugin.name,
          name: plugin.name,
          workspaceId: plugin.namespace,
          thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/thumbnail.png`,
          instructions: instructions.filter(
            (instruction) =>
              instruction.applicationId === plugin.name &&
              instruction.workspaceId === plugin.namespace
          ),
          collections: collections.filter(
            (collection) =>
              collection.applicationId === plugin.name &&
              collection.workspaceId === plugin.namespace
          ),
        })),
      ];
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
  readonly otherApplications$ = this.select(
    this.applications$,
    this.currentApplicationId$,
    (applications, currentApplicationId) => {
      if (applications === null) {
        return null;
      }

      return applications.filter(({ id }) => id !== currentApplicationId);
    }
  );

  readonly activeCollectionId$ = this.select(
    ({ activeCollectionId }) => activeCollectionId
  );
  readonly activeInstructionId$ = this.select(
    ({ activeInstructionId }) => activeInstructionId
  );
  readonly activeInstruction$: Observable<Option<BoardInstruction>> =
    this.select(
      this.instructions$,
      this.select(({ activeInstructionId }) => activeInstructionId),
      (instructions, activeInstructionId) => {
        if (instructions === null || activeInstructionId === null) {
          return null;
        }

        return (
          instructions?.find(
            (instruction) => instruction.id === activeInstructionId
          ) ?? null
        );
      }
    );
  readonly activeCollection$: Observable<Option<BoardCollection>> = this.select(
    this.collections$,
    this.select(({ activeCollectionId }) => activeCollectionId),
    (collections, activeCollectionId) => {
      if (collections === null || activeCollectionId === null) {
        return null;
      }

      return (
        collections?.find(
          (collection) => collection.id === activeCollectionId
        ) ?? null
      );
    }
  );
  readonly instructionSlots$: Observable<Option<BoardInstruction>[]> =
    this.select(
      this.instructions$,
      this.select(({ instructionSlotIds }) => instructionSlotIds),
      (instructions, instructionSlotIds) => {
        if (instructions === null || instructionSlotIds === null) {
          return [];
        }

        return instructionSlotIds.map((instructionId) => {
          if (instructionId === null) {
            return null;
          }

          return (
            instructions.find(
              (instruction) => instruction.id === instructionId
            ) ?? null
          );
        });
      }
    );
  readonly collectionSlots$: Observable<Option<BoardCollection>[]> =
    this.select(
      this.currentApplication$,
      this.select(({ collectionSlotIds }) => collectionSlotIds),
      (currentApplication, collectionSlotIds) => {
        if (currentApplication === null || collectionSlotIds === null) {
          return [];
        }

        return collectionSlotIds.map((collectionId) => {
          if (collectionId === null) {
            return null;
          }

          return (
            currentApplication.collections.find(
              (collection) => collection.id === collectionId
            ) ?? null
          );
        });
      }
    );
  readonly selectedInstruction$: Observable<Option<BoardInstruction>> =
    this.select(
      this.currentApplication$,
      this.select(({ selectedInstructionId }) => selectedInstructionId),
      (currentApplication, selectedInstructionId) => {
        if (currentApplication === null || selectedInstructionId === null) {
          return null;
        }

        return (
          currentApplication.instructions?.find(
            (instruction) => instruction.id === selectedInstructionId
          ) ?? null
        );
      }
    );
  readonly selectedCollection$: Observable<Option<BoardCollection>> =
    this.select(
      this.collections$,
      this.select(({ selectedCollectionId }) => selectedCollectionId),
      (collections, selectedCollectionId) => {
        if (collections === null || selectedCollectionId === null) {
          return null;
        }

        return (
          collections?.find(
            (collection) => collection.id === selectedCollectionId
          ) ?? null
        );
      }
    );
  readonly selectedApplication$ = this.select(
    this.applications$,
    this.select(({ selectedApplicationId }) => selectedApplicationId),
    (applications, selectedApplicationId) => {
      if (applications === null || selectedApplicationId === null) {
        return null;
      }

      return (
        applications?.find(
          (application) => application.id === selectedApplicationId
        ) ?? null
      );
    }
  );
  readonly activeApplication$ = this.select(
    this.applications$,
    this.select(({ activeApplicationId }) => activeApplicationId),
    (applications, activeApplicationId) => {
      if (applications === null || activeApplicationId === null) {
        return null;
      }

      return (
        applications?.find(
          (application) => application.id === activeApplicationId
        ) ?? null
      );
    }
  );
  readonly selectedTask$ = this.select(
    this.currentApplicationInstructions$,
    this.select(({ selectedTaskId }) => selectedTaskId),
    (currentApplicationInstructions, selectedTaskId) => {
      if (currentApplicationInstructions === null || selectedTaskId === null) {
        return null;
      }

      return (
        currentApplicationInstructions
          .find(({ tasks }) => tasks.some((task) => task.id === selectedTaskId))
          ?.tasks.find((task) => task.id === selectedTaskId) ?? null
      );
    }
  );
  readonly selectedDocument$ = this.select(
    this.currentApplicationInstructions$,
    this.select(({ selectedDocumentId }) => selectedDocumentId),
    (currentApplicationInstructions, selectedDocumentId) => {
      if (
        currentApplicationInstructions === null ||
        selectedDocumentId === null
      ) {
        return null;
      }

      return (
        currentApplicationInstructions
          .find(({ documents }) =>
            documents.some((document) => document.id === selectedDocumentId)
          )
          ?.documents.find((document) => document.id === selectedDocumentId) ??
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

  readonly setSelectedTaskId = this.updater<Option<string>>(
    (state, selectedTaskId) => ({
      ...state,
      selectedTaskId,
      selectedDocumentId: null,
    })
  );

  readonly setSelectedDocumentId = this.updater<Option<string>>(
    (state, selectedDocumentId) => ({
      ...state,
      selectedDocumentId,
      selectedTaskId: null,
    })
  );

  readonly setSelectedCollectionId = this.updater<Option<string>>(
    (state, selectedCollectionId) => ({
      ...state,
      selectedCollectionId,
    })
  );

  readonly setSelectedInstructionId = this.updater<Option<string>>(
    (state, selectedInstructionId) => ({
      ...state,
      selectedInstructionId,
    })
  );

  readonly setActiveCollectionId = this.updater<Option<string>>(
    (state, activeCollectionId) => ({
      ...state,
      activeCollectionId,
      activeApplicationId: null,
      activeInstructionId: null,
    })
  );

  readonly setCollectionSlotId = this.updater<{
    index: number;
    collectionId: Option<string>;
  }>((state, { index, collectionId }) => {
    return {
      ...state,
      collectionSlotIds: state.collectionSlotIds.map((id, i) =>
        i === index ? collectionId : id
      ),
    };
  });

  readonly swapCollectionSlotIds = this.updater<{
    previousIndex: number;
    newIndex: number;
  }>((state, { previousIndex, newIndex }) => {
    const collectionSlotIds = [...state.collectionSlotIds];
    const temp = collectionSlotIds[newIndex];
    collectionSlotIds[newIndex] = collectionSlotIds[previousIndex];
    collectionSlotIds[previousIndex] = temp;

    return {
      ...state,
      collectionSlotIds,
    };
  });

  readonly setActiveInstructionId = this.updater<Option<string>>(
    (state, activeInstructionId) => ({
      ...state,
      activeInstructionId,
      activeApplicationId: null,
      activeCollectionId: null,
    })
  );

  readonly setInstructionSlotId = this.updater<{
    index: number;
    instructionId: Option<string>;
  }>((state, { index, instructionId }) => {
    return {
      ...state,
      instructionSlotIds: state.instructionSlotIds.map((id, i) =>
        i === index ? instructionId : id
      ),
    };
  });

  readonly swapInstructionSlotIds = this.updater<{
    previousIndex: number;
    newIndex: number;
  }>((state, { previousIndex, newIndex }) => {
    const instructionSlotIds = [...state.instructionSlotIds];
    const temp = instructionSlotIds[newIndex];
    instructionSlotIds[newIndex] = instructionSlotIds[previousIndex];
    instructionSlotIds[previousIndex] = temp;

    return {
      ...state,
      instructionSlotIds,
    };
  });

  readonly setSelectedApplicationId = this.updater<Option<string>>(
    (state, selectedApplicationId) => ({
      ...state,
      selectedApplicationId,
    })
  );

  readonly setActiveApplicationId = this.updater<Option<string>>(
    (state, activeApplicationId) => ({
      ...state,
      activeApplicationId,
      activeInstructionId: null,
      activeCollectionId: null,
    })
  );

  readonly closeActiveOrSelected = this.updater<void>((state) => {
    if (state.activeInstructionId !== null) {
      return {
        ...state,
        activeInstructionId: null,
      };
    } else if (state.activeCollectionId !== null) {
      return {
        ...state,
        activeCollectionId: null,
      };
    } else if (state.selectedDocumentId !== null) {
      return {
        ...state,
        selectedDocumentId: null,
      };
    } else if (state.selectedTaskId !== null) {
      return {
        ...state,
        selectedTaskId: null,
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
            (applications) => this.patchState({ applications }),
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
            (collections) => this.patchState({ collections }),
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
            (instructions) => this.patchState({ instructions }),
            (error) => this._handleError(error)
          )
        );
    })
  );

  readonly deleteSelected = this.effect<void>(
    switchMap(() => {
      return of(null).pipe(
        withLatestFrom(this.selectedTask$, this.selectedDocument$),
        concatMap(([, selectedTask, selectedDocument]) => {
          if (selectedTask !== null) {
            if (confirm('Are you sure? This action cannot be reverted.')) {
              return this._taskApiService
                .deleteTask(selectedTask.ownerId, selectedTask.id)
                .pipe(
                  tapResponse(
                    () => this.patchState({ selectedTaskId: null }),
                    (error) => this._handleError(error)
                  )
                );
            } else {
              return EMPTY;
            }
          } else if (selectedDocument !== null) {
            if (confirm('Are you sure? This action cannot be reverted.')) {
              return this._documentApiService
                .deleteDocument(selectedDocument.ownerId, selectedDocument.id)
                .pipe(
                  tapResponse(
                    () => this.patchState({ selectedDocumentId: null }),
                    (error) => this._handleError(error)
                  )
                );
            } else {
              return EMPTY;
            }
          } else {
            return EMPTY;
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

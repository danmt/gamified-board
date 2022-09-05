import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { concatMap, EMPTY, of, switchMap, withLatestFrom } from 'rxjs';
import { ApplicationDto } from '../../application/services';
import { ApplicationsStore } from '../../application/stores';
import {
  CollectionAttributeDto,
  CollectionDto,
} from '../../collection/services';
import { CollectionsStore } from '../../collection/stores';
import { openEditInstructionApplicationModal } from '../../instruction-application/components';
import {
  InstructionApplicationApiService,
  InstructionApplicationDto,
} from '../../instruction-application/services';
import { openEditInstructionDocumentModal } from '../../instruction-document/components';
import {
  InstructionDocumentApiService,
  InstructionDocumentDto,
} from '../../instruction-document/services';
import { openEditInstructionSignerModal } from '../../instruction-signer/components';
import {
  InstructionSignerApiService,
  InstructionSignerDto,
} from '../../instruction-signer/services';
import { openEditInstructionSysvarModal } from '../../instruction-sysvar/components';
import {
  InstructionSysvarApiService,
  InstructionSysvarDto,
} from '../../instruction-sysvar/services';
import { openEditInstructionTaskModal } from '../../instruction-task/components';
import {
  InstructionTaskApiService,
  InstructionTaskDto,
} from '../../instruction-task/services';
import {
  InstructionArgumentDto,
  InstructionDto,
} from '../../instruction/services';
import { InstructionsStore } from '../../instruction/stores';
import { Entity, isNotNull, isNull, Option } from '../../shared/utils';
import { SysvarDto } from '../../sysvar/services';
import { SysvarsStore } from '../../sysvar/stores';
import { WorkspaceStore } from '../../workspace/stores';

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

  if (isNull(application)) {
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

  if (isNull(application)) {
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

  if (isNull(bump)) {
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

    return isNotNull(bumpDocument) && isNotNull(attribute)
      ? {
          kind: 'document' as const,
          document: bumpDocument,
          attribute,
        }
      : null;
  } else {
    const argumentId = bump.argumentId;
    const argument = args.find(({ id }) => id === argumentId) ?? null;

    return isNotNull(argument)
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

  if (isNull(payer)) {
    return null;
  }

  const documentId = payer.documentId;
  const attributeId = payer.attributeId;

  const payerDocument = documents.find(({ id }) => id === documentId) ?? null;
  const collection =
    collections.find(({ id }) => id === payerDocument?.collectionId) ?? null;
  const attribute =
    collection?.attributes.find(({ id }) => id === attributeId) ?? null;

  return isNotNull(payerDocument) && isNotNull(attribute)
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

  if (isNull(collection)) {
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

              return isNotNull(arg)
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

              return isNotNull(document) && isNotNull(attribute)
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

  if (isNull(instruction)) {
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

  if (isNull(sysvar)) {
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

  if (isNull(application)) {
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

const populateApplication = (
  application: ApplicationDto,
  applications: ApplicationDto[],
  instructions: InstructionDto[],
  collections: CollectionDto[],
  sysvars: SysvarDto[]
): ApplicationView => {
  return {
    id: application.id,
    name: application.name,
    thumbnailUrl: application.thumbnailUrl,
    workspaceId: application.workspaceId,
    instructions: instructions
      .filter((instruction) => instruction.applicationId === application.id)
      .map((instruction) =>
        populateInstruction(
          instruction,
          applications,
          collections,
          instructions,
          sysvars
        )
      ),
    collections: collections
      .filter((collection) => collection.applicationId === application.id)
      .map((collection) => populateCollection(collection, applications)),
    kind: 'application',
  };
};

interface ViewModel {
  workspaceId: Option<string>;
  currentApplicationId: Option<string>;
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
  currentApplicationId: null,
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
  private readonly _workspaceStore = inject(WorkspaceStore);
  private readonly _applicationsStore = inject(ApplicationsStore);
  private readonly _collectionsStore = inject(CollectionsStore);
  private readonly _instructionsStore = inject(InstructionsStore);
  private readonly _sysvarsStore = inject(SysvarsStore);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly hoveredId$ = this.select(({ hoveredId }) => hoveredId);
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
  readonly collections$ = this.select(
    this._applicationsStore.applications$,
    this._collectionsStore.collections$,
    (applications, collections) => {
      if (isNull(collections) || isNull(applications)) {
        return null;
      }

      return collections.map((collection) =>
        populateCollection(collection, applications)
      );
    }
  );
  readonly sysvars$ = this.select(this._sysvarsStore.sysvars$, (sysvars) => {
    if (isNull(sysvars)) {
      return null;
    }

    return sysvars.map((sysvar) => populateSysvar(sysvar));
  });
  readonly instructions$ = this.select(
    this._applicationsStore.applications$,
    this._instructionsStore.instructions$,
    this._collectionsStore.collections$,
    this._sysvarsStore.sysvars$,
    (applications, instructions, collections, sysvars) => {
      if (
        isNull(applications) ||
        isNull(instructions) ||
        isNull(collections) ||
        isNull(sysvars)
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
  readonly applications$ = this.select(
    this._applicationsStore.applications$,
    this._instructionsStore.instructions$,
    this._collectionsStore.collections$,
    this._sysvarsStore.sysvars$,
    (applications, instructions, collections, sysvars) => {
      if (
        isNull(applications) ||
        isNull(instructions) ||
        isNull(collections) ||
        isNull(sysvars)
      ) {
        return null;
      }

      return applications.map((application) =>
        populateApplication(
          application,
          applications,
          instructions,
          collections,
          sysvars
        )
      );
    }
  );
  readonly currentApplication$ = this.select(
    this.applications$,
    this.currentApplicationId$,
    (applications, currentApplicationId) => {
      if (isNull(applications)) {
        return null;
      }

      return applications.find(({ id }) => id === currentApplicationId) ?? null;
    }
  );
  readonly currentApplicationInstructions$ = this.select(
    this.instructions$,
    this.currentApplicationId$,
    (instructions, currentApplicationId) => {
      if (isNull(instructions) || isNull(currentApplicationId)) {
        return [];
      }

      return instructions.filter(
        (instruction) => instruction.application.id === currentApplicationId
      );
    }
  );
  readonly slots$ = this.select(
    this.applications$,
    this.instructions$,
    this.collections$,
    this.sysvars$,
    this.select(({ slots }) => slots),
    (applications, instructions, collections, sysvars, slots) => {
      if (
        isNull(instructions) ||
        isNull(collections) ||
        isNull(applications) ||
        isNull(sysvars) ||
        isNull(slots)
      ) {
        return [];
      }

      return slots.map((slot) => {
        if (isNull(slot)) {
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
        isNull(applications) ||
        isNull(instructions) ||
        isNull(collections) ||
        isNull(sysvars) ||
        isNull(active)
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
        isNull(applications) ||
        isNull(instructions) ||
        isNull(collections) ||
        isNull(sysvars) ||
        isNull(selectedId)
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
    } else if (isNotNull(state.active)) {
      return {
        ...state,
        active: null,
      };
    } else if (isNotNull(state.selectedId)) {
      return {
        ...state,
        selectedId: null,
      };
    } else {
      return state;
    }
  });

  readonly useActive = this.effect<string>(
    switchMap((instructionId) => {
      return of(instructionId).pipe(
        withLatestFrom(this.active$),
        concatMap(([instructionId, active]) => {
          if (isNull(active)) {
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

                if (isNull(instruction)) {
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

                if (isNull(instruction)) {
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
    this._workspaceStore.setWorkspaceId(this.workspaceId$);
    this._applicationsStore.setWorkspaceId(this.workspaceId$);
    this._collectionsStore.setWorkspaceId(this.workspaceId$);
    this._instructionsStore.setWorkspaceId(this.workspaceId$);
  }
}

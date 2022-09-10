import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { concatMap, of, tap, withLatestFrom } from 'rxjs';
import { ApplicationDto, ApplicationsStore } from '../../application';
import {
  CollectionAttributeDto,
  CollectionDto,
  CollectionsStore,
} from '../../collection';
import { InstructionDto, InstructionsStore } from '../../instruction';
import { InstructionApplicationDto } from '../../instruction-application';
import { InstructionArgumentDto } from '../../instruction-argument';
import { InstructionDocumentDto } from '../../instruction-document';
import { InstructionSignerDto } from '../../instruction-signer';
import { InstructionSysvarDto } from '../../instruction-sysvar';
import { InstructionTaskDto } from '../../instruction-task';
import { Entity, isNotNull, isNull, Option } from '../../shared';
import { SysvarDto, SysvarsStore } from '../../sysvar';
import { WorkspaceStore } from '../../workspace';

export type ArgumentReferenceView = {
  kind: 'argument';
} & InstructionArgumentDto;

export type DocumentReferenceView = {
  kind: 'document';
} & InstructionDocumentDto;

export type SignerReferenceView = {
  kind: 'signer';
} & InstructionSignerDto;

export type AttributeReferenceView = {
  kind: 'attribute';
  document: InstructionDocumentDto;
} & CollectionAttributeDto;

export type TaskArgumentReferenceView = Entity<{
  kind: 'argument';
  ref: Option<InstructionArgumentDto>;
}>;

export type TaskDocumentReferenceView = Entity<{
  kind: 'document';
  ref: Option<InstructionDocumentDto>;
}>;

export type TaskSysvarReferenceView = Entity<{
  kind: 'sysvar';
  ref: Option<InstructionSysvarDto>;
}>;

export type TaskSignerReferenceView = Entity<{
  kind: 'signer';
  ref: Option<InstructionSignerDto>;
}>;

export type TaskApplicationReferenceView = Entity<{
  kind: 'application';
  ref: Option<InstructionApplicationDto>;
}>;

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
  seeds: Option<ArgumentReferenceView | AttributeReferenceView | ValueView>[];
  bump: Option<ArgumentReferenceView | AttributeReferenceView>;
  payer: Option<DocumentReferenceView | SignerReferenceView>;
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
  arguments: InstructionArgumentView[];
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
  instruction: InstructionDto;
  arguments: (InstructionArgumentDto & {
    reference: Option<InstructionArgumentDto>;
  })[];
  documents: (InstructionDocumentView & {
    reference: Option<InstructionDocumentDto>;
  })[];
  applications: (InstructionApplicationView & {
    reference: Option<InstructionApplicationDto>;
  })[];
  signers: (InstructionSignerView & {
    reference: Option<InstructionSignerDto>;
  })[];
  sysvars: (InstructionSysvarView & {
    reference: Option<InstructionSysvarDto>;
  })[];
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

export type InstructionArgumentView = Entity<{
  name: string;
  type: string;
  isOption: boolean;
  ownerId: string;
}>;

const populateInstructionApplication = (
  owner: InstructionDto,
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
    ownerId: owner.id,
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

  if (bump.kind === 'attribute') {
    const [documentId, attributeId] = bump.id.split('/');

    const bumpDocument = documents.find(({ id }) => id === documentId) ?? null;
    const collection =
      collections.find(({ id }) => id === bumpDocument?.collectionId) ?? null;
    const attribute =
      collection?.attributes.find(({ id }) => id === attributeId) ?? null;

    return isNotNull(bumpDocument) && isNotNull(attribute)
      ? {
          kind: 'attribute' as const,
          document: bumpDocument,
          ...attribute,
        }
      : null;
  } else {
    const argumentId = bump.id;
    const argument = args.find(({ id }) => id === argumentId) ?? null;

    return isNotNull(argument)
      ? {
          kind: 'argument' as const,
          ...argument,
        }
      : null;
  }
};

const populatePayer = (
  document: InstructionDocumentDto,
  documents: InstructionDocumentDto[],
  signers: InstructionSignerDto[]
): Option<DocumentReferenceView | SignerReferenceView> => {
  const payer = document.payer;

  if (isNull(payer)) {
    return null;
  }

  switch (payer.kind) {
    case 'document': {
      const payerDocument = documents.find(({ id }) => id === payer.id) ?? null;

      return isNotNull(payerDocument)
        ? {
            kind: 'document' as const,
            ...payerDocument,
          }
        : null;
    }

    case 'signer': {
      const payerSigner = signers.find(({ id }) => id === payer.id) ?? null;

      return isNotNull(payerSigner)
        ? {
            kind: 'signer' as const,
            ...payerSigner,
          }
        : null;
    }
  }
};

const populateInstructionDocument = (
  owner: InstructionDto,
  document: InstructionDocumentDto,
  documents: InstructionDocumentDto[],
  signers: InstructionSignerDto[],
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
    ownerId: owner.id,
    payer: populatePayer(document, documents, signers),
    seeds:
      document.seeds
        ?.map<
          Option<ArgumentReferenceView | AttributeReferenceView | ValueView>
        >((seed) => {
          if (!('kind' in seed)) {
            return {
              value: seed.value,
              type: seed.type,
            };
          }

          switch (seed.kind) {
            case 'argument': {
              const arg = args.find(({ id }) => id === seed.id) ?? null;

              return isNotNull(arg)
                ? {
                    kind: seed.kind,
                    ...arg,
                  }
                : null;
            }
            case 'attribute': {
              const [documentId, attributeId] = seed.id.split('/');

              const document =
                documents.find(({ id }) => id === documentId) ?? null;
              const collection =
                collections.find(({ id }) => id === document?.collectionId) ??
                null;
              const attribute =
                collection?.attributes.find(({ id }) => id === attributeId) ??
                null;

              return isNotNull(document) && isNotNull(attribute)
                ? {
                    kind: seed.kind,
                    document,
                    ...attribute,
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
  owner: InstructionDto,
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
    ownerId: owner.id,
    instruction,
    documents: instruction.documents.map((document) => {
      const reference =
        task.references.find((reference) => reference.id === document.id) ??
        null;
      const documentReferenced =
        owner.documents.find((document) => document.id === reference?.ref) ??
        null;

      return {
        ...populateInstructionDocument(
          owner,
          document,
          instruction.documents,
          instruction.signers,
          instruction.arguments,
          collections,
          applications
        ),
        reference: documentReferenced,
      };
    }),
    applications: instruction.applications.map((application) => {
      const reference =
        task.references.find((reference) => reference.id === application.id) ??
        null;
      const applicationReferenced =
        owner.applications.find(
          (application) => application.id === reference?.ref
        ) ?? null;

      return {
        ...populateInstructionApplication(owner, application, applications),
        reference: applicationReferenced,
      };
    }),
    arguments: instruction.arguments.map((argument) => {
      const reference =
        task.references.find((reference) => reference.id === argument.id) ??
        null;
      const argumentReferenced =
        owner.arguments.find((argument) => argument.id === reference?.ref) ??
        null;

      return {
        ...argument,
        reference: argumentReferenced,
      };
    }),
    signers: instruction.signers.map((signer) => {
      const reference =
        task.references.find((reference) => reference.id === signer.id) ?? null;
      const signerReferenced =
        owner.signers.find((signer) => signer.id === reference?.ref) ?? null;

      return {
        ...populateInstructionSigner(owner, signer),
        reference: signerReferenced,
      };
    }),
    sysvars: instruction.sysvars.map((sysvar) => {
      const reference =
        task.references.find((reference) => reference.id === sysvar.id) ?? null;
      const sysvarReferenced =
        owner.sysvars.find((sysvar) => sysvar.id === reference?.ref) ?? null;

      return {
        ...populateInstructionSysvar(owner, sysvar, sysvars),
        reference: sysvarReferenced,
      };
    }),
    kind: 'instructionTask',
  };
};

const populateInstructionSysvar = (
  owner: InstructionDto,
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
    ownerId: owner.id,
    sysvar: populateSysvar(sysvar),
    kind: 'instructionSysvar',
  };
};

const populateInstructionSigner = (
  owner: InstructionDto,
  instructionSigner: InstructionSignerDto
): InstructionSignerView => {
  return {
    id: instructionSigner.id,
    name: instructionSigner.name,
    ownerId: owner.id,
    saveChanges: instructionSigner.saveChanges,
    kind: 'instructionSigner',
  };
};

const populateInstruction = (
  instruction: InstructionDto,
  applications: ApplicationDto[],
  collections: CollectionDto[],
  instructions: InstructionDto[],
  sysvars: SysvarDto[]
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
    arguments: instruction.arguments.map((arg) => ({
      ...arg,
      ownerId: instruction.id,
    })),
    kind: 'instruction',
    signers: instruction.signers.map((signer) =>
      populateInstructionSigner(instruction, signer)
    ),
    applications: instruction.applications.map((instructionApplication) =>
      populateInstructionApplication(
        instruction,
        instructionApplication,
        applications
      )
    ),
    sysvars: instruction.sysvars.map((instructionSysvar) =>
      populateInstructionSysvar(instruction, instructionSysvar, sysvars)
    ),
    documents: instruction.documents.map((document) =>
      populateInstructionDocument(
        instruction,
        document,
        instruction.documents,
        instruction.signers,
        instruction.arguments,
        collections,
        applications
      )
    ),
    tasks: instruction.tasks.map((instructionTask) =>
      populateInstructionTask(
        instruction,
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
    kind:
      | 'collection'
      | 'instruction'
      | 'application'
      | 'sysvar'
      | 'signer'
      | 'instructionDocument'
      | 'instructionTask'
      | 'instructionSigner'
      | 'instructionSysvar'
      | 'instructionApplication';
  }>;
  selected: Option<{
    id: string;
    kind:
      | 'collection'
      | 'instruction'
      | 'application'
      | 'sysvar'
      | 'signer'
      | 'instructionDocument'
      | 'instructionTask'
      | 'instructionSigner'
      | 'instructionSysvar'
      | 'instructionApplication';
  }>;
  slots: Option<
    Option<{
      id: string;
      kind: 'collection' | 'instruction' | 'application' | 'sysvar';
    }>[]
  >;
}

const initialState: ViewModel = {
  workspaceId: null,
  currentApplicationId: null,
  isCollectionsSectionOpen: false,
  isInstructionsSectionOpen: false,
  isApplicationsSectionOpen: false,
  isSysvarsSectionOpen: false,
  active: null,
  selected: null,
  slots: null,
};

@Injectable()
export class BoardStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _workspaceStore = inject(WorkspaceStore);
  private readonly _applicationsStore = inject(ApplicationsStore);
  private readonly _collectionsStore = inject(CollectionsStore);
  private readonly _instructionsStore = inject(InstructionsStore);
  private readonly _sysvarsStore = inject(SysvarsStore);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly currentApplicationId$ = this.select(
    ({ currentApplicationId }) => currentApplicationId
  );
  readonly active$ = this.select(({ active }) => active);
  readonly selected$ = this.select(({ selected }) => selected);
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

  readonly setActive = this.updater<
    Option<{
      id: string;
      kind:
        | 'collection'
        | 'instruction'
        | 'application'
        | 'sysvar'
        | 'signer'
        | 'instructionDocument'
        | 'instructionTask'
        | 'instructionSigner'
        | 'instructionSysvar'
        | 'instructionApplication';
    }>
  >((state, active) => ({
    ...state,
    active,
  }));

  readonly setSelected = this.updater<
    Option<{
      id: string;
      kind:
        | 'collection'
        | 'instruction'
        | 'application'
        | 'sysvar'
        | 'signer'
        | 'instructionDocument'
        | 'instructionTask'
        | 'instructionSigner'
        | 'instructionSysvar'
        | 'instructionApplication';
    }>
  >((state, selected) => ({
    ...state,
    selected,
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
    if (isNotNull(state.active)) {
      return {
        ...state,
        active: null,
      };
    } else if (isNotNull(state.selected)) {
      return {
        ...state,
        selected: null,
      };
    } else if (
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
    } else {
      return state;
    }
  });

  loadSlots = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    tap(({ workspaceId, applicationId }) => {
      const slotsMap = localStorage.getItem('slotsMap');

      if (isNull(slotsMap) || isNull(workspaceId) || isNull(applicationId)) {
        this.patchState({
          slots: [null, null, null, null, null, null, null, null, null, null],
        });
      } else {
        const slots = JSON.parse(slotsMap)[`${workspaceId}/${applicationId}`];

        this.patchState({
          slots,
        });
      }
    })
  );

  setSlot = this.effect<{
    index: number;
    data: Option<{
      id: string;
      kind: 'instruction' | 'collection' | 'application' | 'sysvar';
    }>;
  }>(
    concatMap(({ index, data }) =>
      of(null).pipe(
        withLatestFrom(
          this.select(({ slots }) => slots),
          this.select(({ workspaceId }) => workspaceId),
          this.select(({ currentApplicationId }) => currentApplicationId)
        ),
        tap(([, slots, workspaceId, applicationId]) => {
          if (
            isNotNull(slots) &&
            isNotNull(workspaceId) &&
            isNotNull(applicationId)
          ) {
            const updatedSlots = slots.map((slot, i) =>
              i === index ? data : slot
            );

            this.patchState({
              slots: updatedSlots,
            });

            const slotsMap = localStorage.getItem('slotsMap');

            if (isNull(slotsMap)) {
              localStorage.setItem(
                'slotsMap',
                JSON.stringify({
                  [`${workspaceId}/${applicationId}`]: updatedSlots,
                })
              );
            } else {
              localStorage.setItem(
                'slotsMap',
                JSON.stringify({
                  ...JSON.parse(slotsMap),
                  [`${workspaceId}/${applicationId}`]: updatedSlots,
                })
              );
            }
          }
        })
      )
    )
  );

  swapSlots = this.effect<{
    previousIndex: number;
    newIndex: number;
  }>(
    concatMap(({ previousIndex, newIndex }) =>
      of(null).pipe(
        withLatestFrom(
          this.select(({ slots }) => slots),
          this.select(({ workspaceId }) => workspaceId),
          this.select(({ currentApplicationId }) => currentApplicationId)
        ),
        tap(([, slots, workspaceId, applicationId]) => {
          if (
            isNotNull(slots) &&
            isNotNull(workspaceId) &&
            isNotNull(applicationId)
          ) {
            const updatedSlots = [...slots];
            const temp = slots[newIndex];
            updatedSlots[newIndex] = updatedSlots[previousIndex];
            updatedSlots[previousIndex] = temp;

            this.patchState({
              slots: updatedSlots,
            });

            const slotsMap = localStorage.getItem('slotsMap');

            if (isNull(slotsMap)) {
              localStorage.setItem(
                'slotsMap',
                JSON.stringify({
                  [`${workspaceId}/${applicationId}`]: updatedSlots,
                })
              );
            } else {
              localStorage.setItem(
                'slotsMap',
                JSON.stringify({
                  ...JSON.parse(slotsMap),
                  [`${workspaceId}/${applicationId}`]: updatedSlots,
                })
              );
            }
          }
        })
      )
    )
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._workspaceStore.setWorkspaceId(this.workspaceId$);
    this._applicationsStore.setWorkspaceId(this.workspaceId$);
    this._collectionsStore.setWorkspaceId(this.workspaceId$);
    this._instructionsStore.setWorkspaceId(this.workspaceId$);
    this.loadSlots(
      this.select(
        this.workspaceId$,
        this.currentApplicationId$,
        (workspaceId, applicationId) => ({ workspaceId, applicationId })
      )
    );
  }
}

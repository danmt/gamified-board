import { ApplicationDto } from '../../application';
import { CollectionDto } from '../../collection';
import { InstructionDto } from '../../instruction';
import { InstructionApplicationDto } from '../../instruction-application';
import { InstructionArgumentDto } from '../../instruction-argument';
import { InstructionDocumentDto } from '../../instruction-document';
import { InstructionSignerDto } from '../../instruction-signer';
import { InstructionSysvarDto } from '../../instruction-sysvar';
import { InstructionTaskDto } from '../../instruction-task';
import { isNotNull, isNull, Option } from '../../shared';
import { SysvarDto } from '../../sysvar';
import {
  ApplicationView,
  ArgumentReferenceView,
  AttributeReferenceView,
  CollectionView,
  DocumentReferenceView,
  InstructionApplicationView,
  InstructionDocumentView,
  InstructionSignerView,
  InstructionSysvarView,
  InstructionTaskView,
  InstructionView,
  SignerReferenceView,
  SysvarView,
  ValueView,
} from './types';

export const populateInstructionApplication = (
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

export const populateCollection = (
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

export const populateBump = (
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

export const populatePayer = (
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

export const populateInstructionDocument = (
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

export const populateSysvar = (sysvar: SysvarDto): SysvarView => {
  return {
    id: sysvar.id,
    name: sysvar.name,
    thumbnailUrl: sysvar.thumbnailUrl,
    kind: 'sysvar',
  };
};

export const populateInstructionTask = (
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

export const populateInstructionSysvar = (
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

export const populateInstructionSigner = (
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

export const populateInstruction = (
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

export const populateApplication = (
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

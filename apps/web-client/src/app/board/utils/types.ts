import { ApplicationDto } from '../../application';
import { CollectionAttributeDto } from '../../collection';
import { InstructionDto } from '../../instruction';
import { InstructionApplicationDto } from '../../instruction-application';
import { InstructionArgumentDto } from '../../instruction-argument';
import { InstructionDocumentDto } from '../../instruction-document';
import { InstructionSignerDto } from '../../instruction-signer';
import { InstructionSysvarDto } from '../../instruction-sysvar';
import { Entity, Option } from '../../shared';

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

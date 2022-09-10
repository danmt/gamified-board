import { Entity, Option } from '../../shared';

export interface ArgumentReference {
  kind: 'argument';
  id: string;
}

export interface DocumentReference {
  kind: 'document';
  id: string;
}

export interface SignerReference {
  kind: 'signer';
  id: string;
}

export interface AttributeReference {
  kind: 'attribute';
  id: string;
  documentId: string;
}

export type Value = {
  type: string;
  value: string;
};

export type InstructionDocumentDto = Entity<{
  name: string;
  method: string;
  collectionId: string;
  seeds: (ArgumentReference | AttributeReference | Value)[];
  bump: Option<ArgumentReference | AttributeReference>;
  payer: Option<DocumentReference | SignerReference>;
}>;

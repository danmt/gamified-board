import {
  GetNodeTypes,
  GetPartialNodeDataTypes,
  Graph,
  Node,
} from '../../drawer/utils';
import { Entity } from '../../shared/utils';

export type InstructionDto = Entity<{
  name: string;
  workspaceId: string;
  applicationId: string;
  thumbnailUrl: string;
}>;

export interface InstructionGraphData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
}

export type DocumentMethodType = 'CREATE' | 'UPDATE' | 'READ' | 'DELETE';

export interface DocumentNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
  instructionId: string;
  method: DocumentMethodType;
  ref: {
    id: string;
    name: string;
  };
}

export interface SignerNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
  instructionId: string;
  isMutable: boolean;
}

export interface ApplicationNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
  instructionId: string;
  ref: {
    id: string;
    name: string;
  };
}

export interface SysvarNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
  instructionId: string;
  ref: {
    name: string;
  };
}

export type InstructionNodeData =
  | ApplicationNodeData
  | DocumentNodeData
  | SignerNodeData
  | SysvarNodeData;

export type InstructionNodesData = {
  application: ApplicationNodeData;
  signer: SignerNodeData;
  document: DocumentNodeData;
  sysvar: SysvarNodeData;
};

export type ApplicationNode = Node<'application', ApplicationNodeData>;
export type SignerNode = Node<'signer', SignerNodeData>;
export type DocumentNode = Node<'document', DocumentNodeData>;
export type SysvarNode = Node<'sysvar', SysvarNodeData>;

export type InstructionNode = GetNodeTypes<
  InstructionNodeKinds,
  InstructionNodeData,
  InstructionNodesData
>;
export type PartialInstructionNode = GetPartialNodeDataTypes<
  InstructionNodeKinds,
  InstructionNodeData,
  InstructionNodesData
>;
export type InstructionNodeKinds =
  | 'application'
  | 'signer'
  | 'document'
  | 'sysvar';
export type InstructionGraphKind = 'instruction';

export type InstructionGraph = Graph<
  InstructionNodeKinds,
  InstructionNodeData,
  InstructionNodesData,
  InstructionGraphKind,
  InstructionGraphData
>;

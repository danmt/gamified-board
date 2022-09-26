import {
  GetNodeTypes,
  GetPartialNodeDataTypes,
  Graph,
  Node,
} from '../../drawer/utils';
import { Entity, Option } from '../../shared/utils';

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

export type CollectionMethodType = 'CREATE' | 'UPDATE' | 'READ' | 'DELETE';

export interface CollectionNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
  instructionId: string;
  method: CollectionMethodType;
  ref: {
    id: string;
    name: string;
  };
  payer: Option<string>;
  space: Option<number>;
  receiver: Option<string>;
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
  | CollectionNodeData
  | SignerNodeData
  | SysvarNodeData;

export type InstructionNodesData = {
  application: ApplicationNodeData;
  signer: SignerNodeData;
  collection: CollectionNodeData;
  sysvar: SysvarNodeData;
};

export type ApplicationNode = Node<'application', ApplicationNodeData>;
export type SignerNode = Node<'signer', SignerNodeData>;
export type CollectionNode = Node<'collection', CollectionNodeData>;
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
  | 'collection'
  | 'sysvar';
export type InstructionGraphKind = 'instruction';

export type InstructionGraph = Graph<
  InstructionNodeKinds,
  InstructionNodeData,
  InstructionNodesData,
  InstructionGraphKind,
  InstructionGraphData
>;

export const isCollectionNode = (
  node: InstructionNode
): node is CollectionNode => {
  return node.kind === 'collection';
};

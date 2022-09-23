import {
  GetNodeTypes,
  GetPartialNodeDataTypes,
  Graph,
  Node,
} from '../../drawer/utils';
import { Entity } from '../../shared/utils';

export type ApplicationDto = Entity<{
  name: string;
  workspaceId: string;
  thumbnailUrl: string;
}>;

export interface ApplicationGraphData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
}

export interface CollectionNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
}

export interface InstructionNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
}

export type FieldType =
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'string'
  | 'pubkey'
  | 'struct';

export interface FieldNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
  type: FieldType;
}

export type ApplicationNodeData =
  | InstructionNodeData
  | CollectionNodeData
  | FieldNodeData;

export type ApplicationNodesData = {
  collection: CollectionNodeData;
  field: FieldNodeData;
  instruction: InstructionNodeData;
};

export type CollectionNode = Node<'collection', CollectionNodeData>;
export type InstructionNode = Node<'instruction', InstructionNodeData>;
export type FieldNode = Node<'field', FieldNodeData>;
export type ApplicationNode = GetNodeTypes<
  ApplicationNodeKinds,
  ApplicationNodeData,
  ApplicationNodesData
>;
export type PartialApplicationNode = GetPartialNodeDataTypes<
  ApplicationNodeKinds,
  ApplicationNodeData,
  ApplicationNodesData
>;
export type ApplicationNodeKinds = 'collection' | 'field' | 'instruction';
export type ApplicationGraphKind = 'application';

export type ApplicationGraph = Graph<
  ApplicationNodeKinds,
  ApplicationNodeData,
  ApplicationNodesData,
  ApplicationGraphKind,
  ApplicationGraphData
>;

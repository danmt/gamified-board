import { Graph, Node } from '../../drawer/utils';
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
  | CollectionNodeData
  | InstructionNodeData
  | FieldNodeData;

export type ApplicationNode =
  | Node<'collection', CollectionNodeData>
  | Node<'field', FieldNodeData>
  | Node<'instruction', InstructionNodeData>;

export type ApplicationNodeKinds = 'collection' | 'field' | 'instruction';

export type ApplicationGraphKind = 'application';

export type ApplicationGraph = Graph<
  ApplicationNodeKinds,
  ApplicationNodeData,
  ApplicationGraphKind,
  ApplicationGraphData
>;

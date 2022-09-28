import {
  Edge,
  GetNodeTypes,
  GetPartialNodeDataTypes,
  Graph,
  Node,
} from '../../drawer/utils';
import { Entity } from '../../shared/utils';

export type ProgramDto = Entity<{
  name: string;
  workspaceId: string;
  thumbnailUrl: string;
}>;

export interface ProgramGraphData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
}

export interface AccountNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  programId: string;
}

export interface InstructionNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  programId: string;
}

export type FieldType =
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'bool'
  | 'string'
  | 'pubkey'
  | 'struct';

export interface FieldNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  programId: string;
  type: FieldType;
}

export type ProgramNodeData =
  | InstructionNodeData
  | AccountNodeData
  | FieldNodeData;

export type ProgramNodesData = {
  account: AccountNodeData;
  field: FieldNodeData;
  instruction: InstructionNodeData;
};

export type AccountNode = Node<'account', AccountNodeData>;
export type InstructionNode = Node<'instruction', InstructionNodeData>;
export type FieldNode = Node<'field', FieldNodeData>;
export type ProgramNode = GetNodeTypes<
  ProgramNodeKinds,
  ProgramNodeData,
  ProgramNodesData
>;
export type PartialProgramNode = GetPartialNodeDataTypes<
  ProgramNodeKinds,
  ProgramNodeData,
  ProgramNodesData
>;
export type ProgramNodeKinds = 'account' | 'field' | 'instruction';
export type ProgramGraphKind = 'program';

export type ProgramGraph = Graph<
  ProgramNodeKinds,
  ProgramNodeData,
  ProgramNodesData,
  ProgramGraphKind,
  ProgramGraphData
>;

export interface ProgramCheckpoint {
  id: string;
  name: string;
  graph: {
    id: string;
    data: ProgramGraphData;
  };
  nodes: ProgramNode[];
  edges: Edge[];
}

export interface InstallableProgram {
  id: string;
  data: ProgramNodeData;
  checkpoints: ProgramCheckpoint[];
}

export interface Installation {
  id: string;
  data: ProgramCheckpoint;
}

export type Account = AccountNode & { fields: FieldNode[] };

export type Instruction = InstructionNode & { fields: FieldNode[] };

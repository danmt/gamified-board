import {
  GetNodeTypes,
  GetPartialNodeDataTypes,
  Graph,
  Node,
} from '../../drawer/utils';
import { FieldType } from '../../program/utils';
import { Entity, GetTypeUnion, Option } from '../../shared/utils';

export type InstructionDto = Entity<{
  name: string;
  workspaceId: string;
  programId: string;
  thumbnailUrl: string;
}>;

export interface InstructionGraphData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  programId: string;
}

export type AccountMethodType = 'CREATE' | 'UPDATE' | 'READ' | 'DELETE';

export interface AccountNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  programId: string;
  instructionId: string;
  method: AccountMethodType;
  ref: {
    id: string;
    name: string;
  };
  payer: Option<string>;
  space: Option<number>;
  receiver: Option<string>;
  seeds: SeedType[];
}

export interface SignerNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  programId: string;
  instructionId: string;
  isMutable: boolean;
}

export interface ProgramNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  programId: string;
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
  programId: string;
  instructionId: string;
  ref: {
    name: string;
  };
}

export interface TaskNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  programId: string;
  instructionId: string;
  ref: {
    id: string;
    name: string;
  };
}

export type InstructionNodeData =
  | ProgramNodeData
  | AccountNodeData
  | SignerNodeData
  | SysvarNodeData;

export type InstructionNodesData = {
  program: ProgramNodeData;
  signer: SignerNodeData;
  account: AccountNodeData;
  sysvar: SysvarNodeData;
  task: TaskNodeData;
};

export type ProgramNode = Node<'program', ProgramNodeData>;
export type SignerNode = Node<'signer', SignerNodeData>;
export type AccountNode = Node<'account', AccountNodeData>;
export type SysvarNode = Node<'sysvar', SysvarNodeData>;
export type TaskNode = Node<'task', TaskNodeData>;

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
  | 'program'
  | 'signer'
  | 'account'
  | 'sysvar'
  | 'task';
export type InstructionGraphKind = 'instruction';

export type InstructionGraph = Graph<
  InstructionNodeKinds,
  InstructionNodeData,
  InstructionNodesData,
  InstructionGraphKind,
  InstructionGraphData
>;

export const isAccountNode = (node: InstructionNode): node is AccountNode => {
  return node.kind === 'account';
};

export const isSignerNode = (node: InstructionNode): node is SignerNode => {
  return node.kind === 'signer';
};

export interface ArgumentSeedData {
  id: string;
  name: string;
}

export interface AttributeSeedData {
  id: string;
  name: string;
  account: {
    id: string;
    name: string;
  };
}

export interface ValueSeedData {
  type: FieldType;
  value: string;
}

export type SeedType = GetTypeUnion<{
  argument: ArgumentSeedData;
  attribute: AttributeSeedData;
  value: ValueSeedData;
}>;

export interface AccountData {
  name: string;
  ref: {
    id: string;
    name: string;
  };
}

export interface Account {
  id: string;
  data: AccountData;
}

export interface SignerData {
  name: string;
}

export interface Signer {
  id: string;
  data: SignerData;
}

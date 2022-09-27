import {
  GetNodeTypes,
  GetPartialNodeDataTypes,
  Graph,
  Node,
} from '../../drawer/utils';
import { Entity } from '../../shared/utils';

export type WorkspaceDto = Entity<{
  data: WorkspaceGraphData;
}>;

export interface EventDto {
  type: string;
  payload: unknown;
}

export interface WorkspaceGraphData {
  name: string;
  thumbnailUrl: string;
  userId: string;
}

export interface ProgramNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
}

export type WorkspaceNodeData = ProgramNodeData;

export type WorkspaceNodeKinds = 'program';

export type WorkspaceNodesData = {
  program: ProgramNodeData;
};

export type ProgramNode = Node<'program', WorkspaceNodeData>;

export type PartialWorkspaceNode = GetPartialNodeDataTypes<
  WorkspaceNodeKinds,
  WorkspaceNodeData,
  WorkspaceNodesData
>;
export type WorkspaceNode = GetNodeTypes<
  WorkspaceNodeKinds,
  WorkspaceNodeData,
  WorkspaceNodesData
>;

export type WorkspaceGraphKind = 'workspace';

export type WorkspaceGraph = Graph<
  WorkspaceNodeKinds,
  WorkspaceNodeData,
  WorkspaceNodesData,
  WorkspaceGraphKind,
  WorkspaceGraphData
>;

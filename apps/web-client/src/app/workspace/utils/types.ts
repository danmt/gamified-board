import { Graph, Node } from '../../drawer/utils';
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

export interface ApplicationNodeData {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
}

export type WorkspaceNodeData = ApplicationNodeData;

export type WorkspaceNodeKinds = 'application';

export type WorkspaceNodesData = {
  application: ApplicationNodeData;
};

export type ApplicationNode = Node<'application', WorkspaceNodeData>;

export type WorkspaceNode = ApplicationNode;

export type WorkspaceGraphKind = 'workspace';

export type WorkspaceGraph = Graph<
  WorkspaceNodeKinds,
  WorkspaceNodeData,
  WorkspaceNodesData,
  WorkspaceGraphKind,
  WorkspaceGraphData
>;

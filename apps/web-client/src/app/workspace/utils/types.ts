import { Graph, Node } from '../../drawer/utils';
import { Entity } from '../../shared/utils';

export type WorkspaceDto = Entity<{
  name: string;
  userId: string;
  thumbnailUrl: string;
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

export type WorkspaceNode = Node<'application', ApplicationNodeData>;

export type WorkspaceNodeKinds = 'application';

export type WorkspaceGraphKind = 'workspace';

export type WorkspaceGraph = Graph<
  WorkspaceNodeKinds,
  WorkspaceNodeData,
  WorkspaceGraphKind,
  WorkspaceGraphData
>;

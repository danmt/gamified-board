import { Edge, Node } from '../../drawer/utils';
import { Entity } from '../../shared/utils';

export type WorkspaceDto = Entity<{
  name: string;
  thumbnailUrl: string;
  nodes: Node<WorkspaceNodeData>[];
  edges: Edge[];
}>;

export type EventDto = {
  type: string;
  payload: unknown;
};

export type WorkspaceGraphData = {
  name: string;
  thumbnailUrl: string;
  kind: string;
};

export type WorkspaceNodeData = {
  name: string;
  thumbnailUrl: string;
  kind: string;
  workspaceId: string;
};

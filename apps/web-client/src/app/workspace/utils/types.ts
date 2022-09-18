import { Edge, Node } from '../../drawer/utils';
import { Entity } from '../../shared/utils';

export type WorkspaceDto = Entity<{
  name: string;
  thumbnailUrl: string;
  nodes: Node[];
  edges: Edge[];
}>;

export type WorkspaceNodeType = 'solana';

export type WorkspaceNode = Entity<{
  name: string;
  kind: WorkspaceNodeType;
  thumbnailUrl: string;
}>;

export type WorkspaceGraph = Entity<{
  name: string;
  kind: 'workspace';
  thumbnailUrl: string;
  nodes: WorkspaceNode[];
  edges: Edge[];
}>;

export type EventDto = {
  type: string;
  payload: unknown;
};

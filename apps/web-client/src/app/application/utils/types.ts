import { Entity } from '../../shared/utils';

export type ApplicationDto = Entity<{
  name: string;
  workspaceId: string;
  thumbnailUrl: string;
}>;

export type ApplicationGraphData = {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
};

export type ApplicationNodeData = {
  name: string;
  thumbnailUrl: string;
  workspaceId: string;
  applicationId: string;
};

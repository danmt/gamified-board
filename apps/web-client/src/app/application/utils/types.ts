import { Entity } from '../../shared/utils';

export type ApplicationDto = Entity<{
  name: string;
  workspaceId: string;
  thumbnailUrl: string;
}>;

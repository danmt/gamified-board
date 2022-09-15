import { Entity } from '../../shared/utils';

export type CollectionAttributeDto = Entity<{
  name: string;
  type: string;
  isOption: boolean;
}>;

export type CollectionDto = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  attributes: CollectionAttributeDto[];
}>;
